import { randomBytes, scrypt } from "node:crypto";
import type { ScryptOptions } from "node:crypto";

/**
 * Objetivo: Derivar, de forma lenta e com sal aleatório, o hash das senhas dos
 * usuários, de modo que a senha em texto puro nunca chegue ao banco de dados.
 *
 * Restrições:
 * - O algoritmo usado é o scrypt da biblioteca padrão do Node.js (node:crypto).
 *   Não há dependência externa de hashing no projeto, e nenhum outro módulo do
 *   backend deve derivar hashes de senha por conta própria.
 * - Os parâmetros de custo fazem parte do hash gravado. Isso permite que hashes
 *   antigos continuem verificáveis caso os parâmetros sejam endurecidos depois.
 * - Esta versão expõe apenas a geração do hash. A verificação da senha entrará
 *   junto com o fluxo de login, que ainda não faz parte do escopo implementado.
 */

const HASH_ALGORITHM_LABEL: string = "scrypt";
const HASH_FIELD_SEPARATOR: string = "$";
const HASH_ENCODING: BufferEncoding = "hex";
const EMPTY_PASSWORD_HASH: string = "";

const SALT_LENGTH_IN_BYTES: number = 16;
const DERIVED_KEY_LENGTH_IN_BYTES: number = 64;
const SCRYPT_COST_FACTOR: number = 16384;
const SCRYPT_BLOCK_SIZE: number = 8;
const SCRYPT_PARALLELIZATION: number = 1;
const BYTES_IN_ONE_MEGABYTE: number = 1048576;
const SCRYPT_MAXIMUM_MEMORY_IN_MEGABYTES: number = 64;

const SCRYPT_OPTIONS: ScryptOptions = {
    N: SCRYPT_COST_FACTOR,
    r: SCRYPT_BLOCK_SIZE,
    p: SCRYPT_PARALLELIZATION,
    maxmem: SCRYPT_MAXIMUM_MEMORY_IN_MEGABYTES * BYTES_IN_ONE_MEGABYTE
};

export interface PasswordHashResult {
    readonly is_successful: boolean;
    readonly password_hash: string;
}

/**
 * Objetivo: Montar a representação textual do hash, reunindo, em um único campo
 * gravável no banco, tudo o que é necessário para verificar a senha depois.
 *
 * Descrição:
 * 1. Converte o sal e a chave derivada para hexadecimal.
 * 2. Concatena, separados por "$": o rótulo do algoritmo, os três parâmetros de
 *    custo do scrypt, o sal e a chave derivada.
 *
 * Retornos esperados:
 * - Retorna a string no formato "scrypt$N$r$p$sal$chave", com sal e chave em hexadecimal.
 *
 * Restrições:
 * - O separador não pode aparecer dentro de nenhum campo. Isso é garantido porque
 *   os únicos campos de conteúdo variável (sal e chave) são hexadecimais.
 */
function encodePasswordHash(salt: Buffer, derived_key: Buffer): string {
    const hash_fields: string[] = [
        HASH_ALGORITHM_LABEL,
        String(SCRYPT_COST_FACTOR),
        String(SCRYPT_BLOCK_SIZE),
        String(SCRYPT_PARALLELIZATION),
        salt.toString(HASH_ENCODING),
        derived_key.toString(HASH_ENCODING)
    ];

    return hash_fields.join(HASH_FIELD_SEPARATOR);
}

/**
 * Objetivo: Gerar o hash de uma senha em texto puro, pronto para ser persistido
 * no campo password_hash do usuário.
 *
 * Descrição:
 * 1. Sorteia um sal aleatório exclusivo para esta senha.
 * 2. Deriva a chave com scrypt, usando os parâmetros de custo configurados.
 * 3. Em caso de falha da derivação, resolve com is_successful falso, sem lançar exceção.
 * 4. Em caso de sucesso, resolve com o hash já codificado em texto.
 *
 * Parâmetros:
 * - plain_password: Senha em texto puro, já validada pela rota quanto a tamanho.
 *   O valor não é registrado em log em nenhuma hipótese.
 *
 * Retornos esperados:
 * - Retorna { is_successful: true, password_hash: <hash> } quando a derivação conclui.
 * - Retorna { is_successful: false, password_hash: "" } quando o scrypt falha
 *   (por exemplo, por falta de memória para os parâmetros de custo).
 *
 * Assertivas de saída:
 * - Duas chamadas com a mesma senha produzem hashes diferentes, pois o sal é sorteado a cada chamada.
 * - A senha em texto puro não é mantida em nenhuma estrutura após o retorno.
 *
 * Restrições:
 * - Não lança exceções: a falha de derivação é devolvida por controle de fluxo
 *   explícito, para que a rota possa respondê-la como erro interno.
 */
export async function hashPassword(plain_password: string): Promise<PasswordHashResult> {
    const salt: Buffer = randomBytes(SALT_LENGTH_IN_BYTES);

    return new Promise<PasswordHashResult>((resolve): void => {
        scrypt(
            plain_password,
            salt,
            DERIVED_KEY_LENGTH_IN_BYTES,
            SCRYPT_OPTIONS,
            (hash_error: Error | null, derived_key: Buffer): void => {
                if (hash_error !== null) {
                    resolve({ is_successful: false, password_hash: EMPTY_PASSWORD_HASH });
                    return;
                }

                resolve({ is_successful: true, password_hash: encodePasswordHash(salt, derived_key) });
            }
        );
    });
}
