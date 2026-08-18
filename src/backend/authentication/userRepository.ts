import { getPrismaClient } from "../database/prismaClient.js";

/**
 * Objetivo: Concentrar todo o acesso ao banco de dados relacionado à entidade
 * de usuário, de modo que os fluxos de autenticação não conheçam o Prisma.
 *
 * Restrições:
 * - Este módulo não importa "@prisma/client" diretamente: o tipo do cliente é
 *   derivado da função exposta em src/backend/database/prismaClient.ts, que é o
 *   único arquivo autorizado a importar o pacote.
 * - Nenhuma função deste arquivo lança exceção. As falhas do banco são devolvidas
 *   como um status explícito no resultado, acompanhadas da causa original em
 *   failure_cause, para que a camada de rota possa registrá-la em log.
 * - O campo password_hash nunca é devolvido por este módulo: os fluxos de cadastro
 *   não precisam dele, e mantê-lo fora dos retornos evita vazá-lo em respostas HTTP.
 */

type PrismaClientInstance = ReturnType<typeof getPrismaClient>;

const PRISMA_UNIQUE_CONSTRAINT_ERROR_CODE: string = "P2002";
const NO_FAILURE_CAUSE: null = null;

interface TakenCredentialsRow {
    readonly email: string;
    readonly username: string;
}

export interface StoredUser {
    readonly id: string;
    readonly email: string;
    readonly username: string;
    readonly created_at: Date;
}

export interface NewUserRecord {
    readonly email: string;
    readonly username: string;
    readonly password_hash: string;
}

export type CredentialsLookupStatus = "completed" | "database_error";

export interface CredentialsLookupResult {
    readonly status: CredentialsLookupStatus;
    readonly is_email_taken: boolean;
    readonly is_username_taken: boolean;
    readonly failure_cause: unknown;
}

export type UserCreationStatus = "created" | "credentials_already_taken" | "database_error";

export interface UserCreationResult {
    readonly status: UserCreationStatus;
    readonly user: StoredUser | null;
    readonly failure_cause: unknown;
}

/**
 * Objetivo: Reconhecer, sem depender dos tipos de erro do Prisma, se uma falha
 * de escrita foi causada pela violação de uma restrição de unicidade.
 *
 * Descrição:
 * 1. Descarta valores que não são objetos preenchidos.
 * 2. Lê a propriedade "code" do erro, presente nos erros conhecidos do Prisma.
 * 3. Compara o código com o da violação de restrição única (P2002).
 *
 * Retornos esperados:
 * - Retorna verdadeiro quando o erro recebido é uma violação de unicidade do Prisma.
 * - Retorna falso para qualquer outro valor, inclusive null, undefined e erros de outra natureza.
 *
 * Restrições:
 * - A verificação é estrutural (pelo formato do erro) e não por instanceof, porque
 *   isso exigiria importar "@prisma/client" neste arquivo, o que o projeto proíbe.
 */
function isUniqueConstraintViolation(unknown_error: unknown): boolean {
    if (typeof unknown_error !== "object" || unknown_error === null) {
        return false;
    }

    const error_code: unknown = (unknown_error as { readonly code?: unknown }).code;

    return error_code === PRISMA_UNIQUE_CONSTRAINT_ERROR_CODE;
}

/**
 * Objetivo: Descobrir, antes de tentar a escrita, se o email ou o nome de usuário
 * informados já pertencem a alguma conta, permitindo devolver uma mensagem de erro
 * específica para cada caso.
 *
 * Descrição:
 * 1. Consulta os usuários cujo email OU nome de usuário coincidem com os informados.
 * 2. Seleciona apenas as colunas email e username, sem trazer dados sensíveis.
 * 3. Percorre os registros encontrados marcando qual dos dois campos está ocupado.
 * 4. Em caso de falha do banco, devolve o status "database_error" sem propagar a exceção.
 *
 * Parâmetros:
 * - email: Email já normalizado (sem espaços nas pontas e em minúsculas). A comparação
 *   feita pelo banco é sensível a maiúsculas, então normalizar antes é obrigatório.
 * - username: Nome de usuário já sem espaços nas pontas.
 *
 * Retornos esperados:
 * - Retorna status "completed" com as duas flags preenchidas quando a consulta é executada.
 * - Retorna status "database_error", com ambas as flags falsas e a causa original em
 *   failure_cause, quando o banco não responde.
 *
 * Assertivas de entrada:
 * - DATABASE_URL deve apontar para um PostgreSQL alcançável com as migrations aplicadas.
 *
 * Restrições:
 * - O resultado é apenas um retrato do instante da consulta: duas requisições
 *   simultâneas podem passar por aqui sem conflito e colidir depois na escrita.
 *   Por isso createUser() também trata a violação de unicidade.
 */
export async function findTakenCredentials(email: string, username: string): Promise<CredentialsLookupResult> {
    const prisma_client: PrismaClientInstance = getPrismaClient();

    try {
        const matching_users: TakenCredentialsRow[] = await prisma_client.user.findMany({
            where: {
                OR: [{ email: email }, { username: username }]
            },
            select: { email: true, username: true }
        });

        let is_email_taken: boolean = false;
        let is_username_taken: boolean = false;
        for (const matching_user of matching_users) {
            if (matching_user.email === email) {
                is_email_taken = true;
            }
            if (matching_user.username === username) {
                is_username_taken = true;
            }
        }

        return {
            status: "completed",
            is_email_taken: is_email_taken,
            is_username_taken: is_username_taken,
            failure_cause: NO_FAILURE_CAUSE
        };
    } catch (lookup_error: unknown) {
        return {
            status: "database_error",
            is_email_taken: false,
            is_username_taken: false,
            failure_cause: lookup_error
        };
    }
}

/**
 * Objetivo: Persistir um usuário novo, devolvendo os dados públicos do registro criado.
 *
 * Descrição:
 * 1. Insere o registro com o email, o nome de usuário e o hash de senha recebidos.
 * 2. Seleciona de volta apenas os campos públicos do usuário criado.
 * 3. Se a escrita violar uma restrição de unicidade, devolve "credentials_already_taken".
 * 4. Para qualquer outra falha do banco, devolve "database_error" com a causa original.
 *
 * Parâmetros:
 * - new_user_record: Dados já validados e normalizados. O campo password_hash deve
 *   conter o hash gerado por passwordHasher.ts, nunca a senha em texto puro.
 *
 * Retornos esperados:
 * - Retorna status "created" e o usuário persistido quando a inserção conclui.
 * - Retorna status "credentials_already_taken" e usuário nulo quando o email ou o
 *   nome de usuário foram registrados por outra requisição no intervalo entre a
 *   consulta prévia e esta escrita.
 * - Retorna status "database_error" e usuário nulo em qualquer outra falha do banco.
 *
 * Assertivas de saída:
 * - Quando o status é "created", existe no banco exatamente uma linha nova em "users",
 *   com id e created_at atribuídos pelo próprio banco.
 * - Nos demais status, nenhuma linha foi criada.
 */
export async function createUser(new_user_record: NewUserRecord): Promise<UserCreationResult> {
    const prisma_client: PrismaClientInstance = getPrismaClient();

    try {
        const created_user: StoredUser = await prisma_client.user.create({
            data: {
                email: new_user_record.email,
                username: new_user_record.username,
                password_hash: new_user_record.password_hash
            },
            select: { id: true, email: true, username: true, created_at: true }
        });

        return { status: "created", user: created_user, failure_cause: NO_FAILURE_CAUSE };
    } catch (creation_error: unknown) {
        if (isUniqueConstraintViolation(creation_error)) {
            return { status: "credentials_already_taken", user: null, failure_cause: NO_FAILURE_CAUSE };
        }

        return { status: "database_error", user: null, failure_cause: creation_error };
    }
}
