import { normalizeEmail, normalizeUsername } from "./credentialNormalization.js";
import { DECOY_PASSWORD_HASH, verifyPassword } from "./passwordHasher.js";
import type { PasswordVerificationResult } from "./passwordHasher.js";
import { findCredentialsByEmailOrUsername } from "./userRepository.js";
import type { CredentialsFetchResult, StoredUser } from "./userRepository.js";

/**
 * Objetivo: Conferir as credenciais apresentadas no login, aceitando tanto o email
 * quanto o nome de usuário como identificador, conforme o escopo da v0.1
 * ("Login (email OU nome de usuário e senha)").
 *
 * Restrições:
 * - Este módulo apenas CONFERE a identidade: ele não emite token nem abre sessão.
 *   O escopo da v0.1 registra "Especificações sobre JWT" como fora do escopo, então
 *   o mecanismo de sessão será acrescentado quando essas regras forem definidas.
 * - Este módulo não conhece HTTP: a tradução do status em código de resposta é
 *   responsabilidade de authenticationRoutes.ts.
 * - Nenhuma função lança exceção; todos os desfechos são representados por um valor
 *   de UserAuthenticationStatus.
 */

export type UserAuthenticationStatus =
    | "authenticated"
    | "invalid_credentials"
    | "password_verification_failed"
    | "database_error";

export interface UserAuthenticationInput {
    readonly identifier: string;
    readonly password: string;
}

export interface UserAuthenticationResult {
    readonly status: UserAuthenticationStatus;
    readonly user: StoredUser | null;
    readonly failure_cause: unknown;
}

const NO_FAILURE_CAUSE: null = null;

/**
 * Objetivo: Autenticar um usuário a partir de um identificador (email ou nome de
 * usuário) e da senha correspondente.
 *
 * Descrição:
 * 1. Normaliza o identificador nas duas formas possíveis: como email e como nome de usuário.
 * 2. Busca no banco o usuário que corresponda a qualquer uma das duas formas.
 * 3. Se nenhum usuário for encontrado, confere a senha contra o hash-isca e responde
 *    credenciais inválidas.
 * 4. Se o usuário existe, confere a senha apresentada contra o hash gravado.
 * 5. Traduz o resultado da conferência no status de autenticação correspondente.
 *
 * Parâmetros:
 * - authentication_input.identifier: Texto único digitado pelo usuário, que pode ser
 *   tanto o email quanto o nome de usuário da conta. Qual dos dois é decidido pela
 *   correspondência no banco, não pelo formato do texto.
 * - authentication_input.password: Senha em texto puro. Nunca é registrada em log
 *   nem devolvida em qualquer resposta.
 *
 * Retornos esperados:
 * - Retorna status "authenticated" e os dados públicos do usuário quando o identificador
 *   existe e a senha confere.
 * - Retorna status "invalid_credentials" e usuário nulo tanto quando o identificador não
 *   existe quanto quando a senha está errada.
 * - Retorna status "password_verification_failed" quando o hash gravado está corrompido
 *   ou o scrypt não conseguiu derivar a chave.
 * - Retorna status "database_error" quando o banco não responde.
 *
 * Assertivas de entrada:
 * - O banco deve estar acessível e com as migrations aplicadas.
 *
 * Assertivas de saída:
 * - Nenhuma linha do banco é alterada: autenticar não registra nada.
 * - O hash da senha não é devolvido em nenhum desfecho.
 *
 * Restrições:
 * - Os dois motivos de recusa (identificador inexistente e senha errada) compartilham
 *   o MESMO status de propósito. Distingui-los transformaria a rota de login em um
 *   verificador de quais emails e nomes de usuário estão cadastrados.
 * - Pelo mesmo motivo, o passo 3 gasta tempo conferindo a senha contra um hash que
 *   nunca confere: sem isso, a resposta para um identificador inexistente voltaria
 *   visivelmente mais rápido do que a resposta para uma senha errada, e essa diferença
 *   de tempo revelaria a existência da conta.
 */
export async function authenticateUser(authentication_input: UserAuthenticationInput): Promise<UserAuthenticationResult> {
    const email_candidate: string = normalizeEmail(authentication_input.identifier);
    const username_candidate: string = normalizeUsername(authentication_input.identifier);

    const credentials_fetch: CredentialsFetchResult = await findCredentialsByEmailOrUsername(email_candidate, username_candidate);
    if (credentials_fetch.status === "database_error") {
        return { status: "database_error", user: null, failure_cause: credentials_fetch.failure_cause };
    }
    if (credentials_fetch.status === "not_found" || credentials_fetch.credentials === null) {
        await verifyPassword(authentication_input.password, DECOY_PASSWORD_HASH);
        return { status: "invalid_credentials", user: null, failure_cause: NO_FAILURE_CAUSE };
    }

    const verification_result: PasswordVerificationResult = await verifyPassword(
        authentication_input.password,
        credentials_fetch.credentials.password_hash
    );
    if (verification_result.status === "matched") {
        return { status: "authenticated", user: credentials_fetch.credentials.user, failure_cause: NO_FAILURE_CAUSE };
    }
    if (verification_result.status === "not_matched") {
        return { status: "invalid_credentials", user: null, failure_cause: NO_FAILURE_CAUSE };
    }

    return { status: "password_verification_failed", user: null, failure_cause: verification_result.status };
}
