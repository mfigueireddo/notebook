import { normalizeEmail, normalizeUsername } from "./credentialNormalization.js";
import { hashPassword } from "./passwordHasher.js";
import type { PasswordHashResult } from "./passwordHasher.js";
import { createUser, findTakenCredentials } from "./userRepository.js";
import type { CredentialsLookupResult, NewUserRecord, StoredUser, UserCreationResult } from "./userRepository.js";

/**
 * Objetivo: Reunir, em um único fluxo, todas as etapas do cadastro de um usuário
 * novo: normalização dos dados, verificação de credenciais já usadas, geração do
 * hash da senha e persistência do registro.
 *
 * Restrições:
 * - Este módulo não conhece HTTP: ele devolve um status de domínio, e a tradução
 *   desse status em código de resposta é responsabilidade de authenticationRoutes.ts.
 * - Nenhuma função lança exceção; todos os desfechos possíveis são representados
 *   por um valor de UserRegistrationStatus.
 * - As regras de formato (tamanho mínimo, formato do email) NÃO são checadas aqui:
 *   ficam a cargo da validação de schema do Fastify, conforme decidido no escopo
 *   da v0.1 ("deverão ser aproveitadas as validações já existentes pela stack").
 */

export type UserRegistrationStatus =
    | "registered"
    | "email_already_registered"
    | "username_already_registered"
    | "credentials_already_taken"
    | "password_hashing_failed"
    | "database_error";

export interface UserRegistrationInput {
    readonly email: string;
    readonly username: string;
    readonly password: string;
}

export interface UserRegistrationResult {
    readonly status: UserRegistrationStatus;
    readonly user: StoredUser | null;
    readonly failure_cause: unknown;
}

const NO_FAILURE_CAUSE: null = null;

/**
 * Objetivo: Cadastrar um usuário novo, garantindo que email e nome de usuário
 * permaneçam únicos e que a senha seja gravada apenas em forma de hash.
 *
 * Descrição:
 * 1. Normaliza o email e o nome de usuário recebidos.
 * 2. Consulta o banco para saber se alguma das duas credenciais já está em uso;
 *    se estiver, encerra com o status correspondente sem gerar hash algum.
 * 3. Gera o hash da senha; se a derivação falhar, encerra com "password_hashing_failed".
 * 4. Insere o usuário. Uma violação de unicidade nesta etapa significa que outra
 *    requisição cadastrou as mesmas credenciais no intervalo entre os passos 2 e 4.
 *
 * Parâmetros:
 * - registration_input: Dados já aprovados pela validação de schema da rota. A senha
 *   chega em texto puro e é usada somente para gerar o hash.
 *
 * Retornos esperados:
 * - Retorna status "registered" e o usuário criado quando o cadastro conclui.
 * - Retorna status "email_already_registered" quando o email já pertence a uma conta.
 * - Retorna status "username_already_registered" quando o nome de usuário já está em uso
 *   e o email está livre.
 * - Retorna status "credentials_already_taken" quando a colisão só aparece na escrita,
 *   por concorrência entre duas requisições simultâneas.
 * - Retorna status "password_hashing_failed" quando o scrypt não consegue derivar o hash.
 * - Retorna status "database_error" quando o banco não responde em alguma das etapas.
 *
 * Assertivas de entrada:
 * - O banco deve estar acessível e com as migrations aplicadas.
 * - registration_input.password deve ser a senha em texto puro, nunca um hash já pronto.
 *
 * Assertivas de saída:
 * - Quando o status é "registered", existe no banco um usuário com o email e o nome
 *   de usuário normalizados, e o campo user do retorno é diferente de nulo.
 * - Em qualquer outro status, nenhum usuário foi criado e o campo user é nulo.
 * - A senha em texto puro não é gravada nem registrada em log em nenhum desfecho.
 *
 * Restrições:
 * - A verificação prévia de credenciais existe para produzir mensagens específicas
 *   ("email já cadastrado" x "nome de usuário em uso"). A garantia real de unicidade
 *   continua sendo a restrição do banco, verificada no passo 4.
 */
export async function registerUser(registration_input: UserRegistrationInput): Promise<UserRegistrationResult> {
    const normalized_email: string = normalizeEmail(registration_input.email);
    const normalized_username: string = normalizeUsername(registration_input.username);

    const credentials_lookup: CredentialsLookupResult = await findTakenCredentials(normalized_email, normalized_username);
    if (credentials_lookup.status === "database_error") {
        return { status: "database_error", user: null, failure_cause: credentials_lookup.failure_cause };
    }
    if (credentials_lookup.is_email_taken) {
        return { status: "email_already_registered", user: null, failure_cause: NO_FAILURE_CAUSE };
    }
    if (credentials_lookup.is_username_taken) {
        return { status: "username_already_registered", user: null, failure_cause: NO_FAILURE_CAUSE };
    }

    const password_hash_result: PasswordHashResult = await hashPassword(registration_input.password);
    if (!password_hash_result.is_successful) {
        return { status: "password_hashing_failed", user: null, failure_cause: NO_FAILURE_CAUSE };
    }

    const new_user_record: NewUserRecord = {
        email: normalized_email,
        username: normalized_username,
        password_hash: password_hash_result.password_hash
    };
    const user_creation: UserCreationResult = await createUser(new_user_record);
    if (user_creation.status === "credentials_already_taken") {
        return { status: "credentials_already_taken", user: null, failure_cause: NO_FAILURE_CAUSE };
    }
    if (user_creation.status === "database_error" || user_creation.user === null) {
        return { status: "database_error", user: null, failure_cause: user_creation.failure_cause };
    }

    return { status: "registered", user: user_creation.user, failure_cause: NO_FAILURE_CAUSE };
}
