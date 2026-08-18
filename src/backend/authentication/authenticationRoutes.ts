import type { FastifyInstance, FastifyReply, FastifyRequest, FastifySchema } from "fastify";

import {
    HTTP_STATUS_CONFLICT,
    HTTP_STATUS_CREATED,
    HTTP_STATUS_INTERNAL_SERVER_ERROR
} from "../config/httpStatus.js";
import { registerUser } from "./registerUser.js";
import type { UserRegistrationResult } from "./registerUser.js";
import type { StoredUser } from "./userRepository.js";

/**
 * Objetivo: Expor por HTTP os fluxos de autenticação do backend. Nesta versão
 * apenas o cadastro de usuário está implementado; login, edição e exclusão de
 * conta entrarão como novas rotas neste mesmo arquivo.
 *
 * Restrições:
 * - A validação do corpo da requisição é feita pelo schema JSON do Fastify, e não
 *   por código próprio, conforme a decisão registrada em docs/decisions/SCOPE_V0.1.md
 *   ("deverão ser aproveitadas as validações já existentes pela stack escolhida").
 * - Nenhum código de status HTTP é escrito como literal: todos vêm de config/httpStatus.ts.
 * - A resposta de sucesso é montada campo a campo, e não a partir do registro do banco,
 *   para que nenhuma coluna sensível (como password_hash) possa vazar por descuido.
 */

const REGISTER_USER_ROUTE_PATH: string = "/authentication/users";

const EMAIL_MAXIMUM_LENGTH: number = 320;
const USERNAME_MINIMUM_LENGTH: number = 3;
const USERNAME_MAXIMUM_LENGTH: number = 64;
const PASSWORD_MINIMUM_LENGTH: number = 8;
const PASSWORD_MAXIMUM_LENGTH: number = 128;

const EMAIL_ALREADY_REGISTERED_MESSAGE: string = "Este email já está cadastrado.";
const USERNAME_ALREADY_REGISTERED_MESSAGE: string = "Este nome de usuário já está em uso.";
const CREDENTIALS_ALREADY_TAKEN_MESSAGE: string = "Este email ou nome de usuário acabou de ser cadastrado. Tente outros dados.";
const REGISTRATION_FAILED_MESSAGE: string = "Não foi possível concluir o cadastro. Tente novamente em instantes.";

const DATABASE_FAILURE_LOG_MESSAGE: string = "Falha de banco de dados durante o cadastro de usuário.";
const HASHING_FAILURE_LOG_MESSAGE: string = "Falha ao derivar o hash da senha durante o cadastro de usuário.";

export interface RegisterUserRequestBody {
    readonly email: string;
    readonly username: string;
    readonly password: string;
}

export interface RegisteredUserResponse {
    readonly id: string;
    readonly email: string;
    readonly username: string;
    readonly created_at: string;
}

export interface RegistrationErrorResponse {
    readonly code: string;
    readonly message: string;
}

/**
 * Objetivo: Descrever, para a validação do Fastify, o formato aceito no corpo do
 * cadastro, de modo que dados malformados sejam rejeitados antes de qualquer
 * consulta ao banco ou derivação de hash.
 *
 * Restrições:
 * - Os limites de tamanho de email e nome de usuário espelham as colunas declaradas
 *   em prisma/schema.prisma, evitando que o banco rejeite um valor que a rota aceitou.
 * - Os limites mínimos de nome de usuário e senha, e o máximo da senha, não constam do
 *   escopo da v0.1: são valores conservadores adotados até que as regras de negócio
 *   sejam definidas. O máximo da senha também protege o servidor de um custo de
 *   hashing arbitrariamente alto.
 * - O formato do email é verificado pelo validador de formatos que já acompanha o
 *   Fastify; nenhuma expressão regular própria é escrita aqui.
 */
const REGISTER_USER_SCHEMA: FastifySchema = {
    body: {
        type: "object",
        required: ["email", "username", "password"],
        additionalProperties: false,
        properties: {
            email: {
                type: "string",
                format: "email",
                maxLength: EMAIL_MAXIMUM_LENGTH
            },
            username: {
                type: "string",
                minLength: USERNAME_MINIMUM_LENGTH,
                maxLength: USERNAME_MAXIMUM_LENGTH
            },
            password: {
                type: "string",
                minLength: PASSWORD_MINIMUM_LENGTH,
                maxLength: PASSWORD_MAXIMUM_LENGTH
            }
        }
    }
};

/**
 * Objetivo: Converter o usuário persistido na representação pública devolvida ao
 * cliente, deixando explícito quais campos saem do backend.
 *
 * Retornos esperados:
 * - Retorna o identificador, o email, o nome de usuário e o instante de criação
 *   em ISO 8601 (UTC).
 *
 * Assertivas de saída:
 * - A resposta não contém o hash da senha nem qualquer outro campo além dos quatro listados.
 */
function buildRegisteredUserResponse(stored_user: StoredUser): RegisteredUserResponse {
    return {
        id: stored_user.id,
        email: stored_user.email,
        username: stored_user.username,
        created_at: stored_user.created_at.toISOString()
    };
}

/**
 * Retornos esperados:
 * - Retorna o corpo padronizado de erro, com um código estável para o frontend
 *   tratar programaticamente e uma mensagem já pronta para exibição.
 */
function buildRegistrationErrorResponse(error_code: string, error_message: string): RegistrationErrorResponse {
    return { code: error_code, message: error_message };
}

/**
 * Objetivo: Traduzir o desfecho de domínio do cadastro em status HTTP e corpo de
 * resposta, registrando em log apenas as falhas que exigem investigação.
 *
 * Descrição:
 * 1. Trata os conflitos de credenciais devolvendo 409 com a mensagem específica de cada caso.
 * 2. Registra em log a falha de banco ou de hashing, junto com a causa original quando existe.
 * 3. Devolve 500 com uma mensagem genérica para as falhas internas, sem expor detalhes
 *    da infraestrutura ao cliente.
 *
 * Parâmetros:
 * - registration_result: Resultado de registerUser() cujo status NÃO é "registered";
 *   o caso de sucesso é tratado diretamente no handler.
 *
 * Assertivas de saída:
 * - O status HTTP da resposta foi definido antes do retorno.
 * - Nenhuma mensagem devolvida ao cliente contém dados internos do banco.
 */
function replyRegistrationFailure(
    server: FastifyInstance,
    reply: FastifyReply,
    registration_result: UserRegistrationResult
): RegistrationErrorResponse {
    switch (registration_result.status) {
        case "email_already_registered":
            reply.status(HTTP_STATUS_CONFLICT);
            return buildRegistrationErrorResponse("EMAIL_ALREADY_REGISTERED", EMAIL_ALREADY_REGISTERED_MESSAGE);

        case "username_already_registered":
            reply.status(HTTP_STATUS_CONFLICT);
            return buildRegistrationErrorResponse("USERNAME_ALREADY_REGISTERED", USERNAME_ALREADY_REGISTERED_MESSAGE);

        case "credentials_already_taken":
            reply.status(HTTP_STATUS_CONFLICT);
            return buildRegistrationErrorResponse("CREDENTIALS_ALREADY_TAKEN", CREDENTIALS_ALREADY_TAKEN_MESSAGE);

        case "password_hashing_failed":
            server.log.error(HASHING_FAILURE_LOG_MESSAGE);
            reply.status(HTTP_STATUS_INTERNAL_SERVER_ERROR);
            return buildRegistrationErrorResponse("REGISTRATION_FAILED", REGISTRATION_FAILED_MESSAGE);

        default:
            server.log.error({ failure_cause: registration_result.failure_cause }, DATABASE_FAILURE_LOG_MESSAGE);
            reply.status(HTTP_STATUS_INTERNAL_SERVER_ERROR);
            return buildRegistrationErrorResponse("REGISTRATION_FAILED", REGISTRATION_FAILED_MESSAGE);
    }
}

/**
 * Objetivo: Registrar na instância do Fastify as rotas de autenticação do backend.
 *
 * Descrição:
 * 1. Declara POST /authentication/users com o schema de validação do corpo.
 * 2. No handler, delega o cadastro a registerUser().
 * 3. Em caso de sucesso, responde 201 com a representação pública do usuário criado.
 * 4. Em caso de falha, delega a tradução do erro a replyRegistrationFailure().
 *
 * Parâmetros:
 * - server: Instância do Fastify ainda não escutando em nenhuma porta. As rotas
 *   precisam ser registradas antes da chamada a listen().
 *
 * Assertivas de entrada:
 * - As rotas de autenticação ainda não podem ter sido registradas nesta instância;
 *   o Fastify rejeita rotas duplicadas.
 *
 * Assertivas de saída:
 * - A instância passa a responder POST /authentication/users.
 * - Corpos inválidos são rejeitados pelo próprio Fastify, com status 400, antes de
 *   o handler ser executado.
 */
export async function registerAuthenticationRoutes(server: FastifyInstance): Promise<void> {
    server.post<{ Body: RegisterUserRequestBody }>(
        REGISTER_USER_ROUTE_PATH,
        { schema: REGISTER_USER_SCHEMA },
        async (
            request: FastifyRequest<{ Body: RegisterUserRequestBody }>,
            reply: FastifyReply
        ): Promise<RegisteredUserResponse | RegistrationErrorResponse> => {
            const registration_result: UserRegistrationResult = await registerUser({
                email: request.body.email,
                username: request.body.username,
                password: request.body.password
            });

            if (registration_result.status === "registered" && registration_result.user !== null) {
                reply.status(HTTP_STATUS_CREATED);
                return buildRegisteredUserResponse(registration_result.user);
            }

            return replyRegistrationFailure(server, reply, registration_result);
        }
    );
}
