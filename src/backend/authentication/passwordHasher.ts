import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import type { ScryptOptions } from "node:crypto";

/**
 * Objetivo: Derivar, de forma lenta e com sal aleatório, o hash das senhas dos
 * usuários, de modo que a senha em texto puro nunca chegue ao banco de dados, e
 * conferir uma senha apresentada no login contra o hash já gravado.
 *
 * Restrições:
 * - O algoritmo usado é o scrypt da biblioteca padrão do Node.js (node:crypto).
 *   Não há dependência externa de hashing no projeto, e nenhum outro módulo do
 *   backend deve derivar ou conferir hashes de senha por conta própria.
 * - Os parâmetros de custo fazem parte do hash gravado, e a conferência usa os
 *   parâmetros lidos do próprio hash, não as constantes atuais. Isso permite que
 *   hashes antigos continuem verificáveis caso os parâmetros sejam endurecidos depois.
 * - A comparação das chaves derivadas é feita com timingSafeEqual: uma comparação
 *   comum (===) revelaria, pelo tempo de resposta, quantos bytes iniciais coincidem.
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

const HASH_FIELD_COUNT: number = 6;
const ALGORITHM_FIELD_INDEX: number = 0;
const COST_FACTOR_FIELD_INDEX: number = 1;
const BLOCK_SIZE_FIELD_INDEX: number = 2;
const PARALLELIZATION_FIELD_INDEX: number = 3;
const SALT_FIELD_INDEX: number = 4;
const DERIVED_KEY_FIELD_INDEX: number = 5;
const DECIMAL_RADIX: number = 10;
const MINIMUM_SCRYPT_PARAMETER_VALUE: number = 1;
const MINIMUM_BUFFER_LENGTH_IN_BYTES: number = 1;

const SCRYPT_OPTIONS: ScryptOptions = {
    N: SCRYPT_COST_FACTOR,
    r: SCRYPT_BLOCK_SIZE,
    p: SCRYPT_PARALLELIZATION,
    maxmem: SCRYPT_MAXIMUM_MEMORY_IN_MEGABYTES * BYTES_IN_ONE_MEGABYTE
};

/**
 * Hash-isca, gerado a partir de uma senha aleatória descartada, usado quando o
 * login é tentado com um identificador que não existe no banco.
 *
 * Restrições:
 * - Nenhuma senha real corresponde a este hash: a senha que o originou foi
 *   sorteada e nunca guardada, então conferir contra ele sempre falha.
 * - Ele existe apenas para que o tempo de resposta de "usuário inexistente" seja
 *   equivalente ao de "senha errada". Sem isso, a diferença de tempo permitiria
 *   descobrir quais emails e nomes de usuário estão cadastrados.
 * - Deve ser regerado com os mesmos parâmetros de custo caso as constantes de
 *   SCRYPT_OPTIONS mudem, sob pena de a defesa deixar de funcionar.
 */
export const DECOY_PASSWORD_HASH: string =
    "scrypt$16384$8$1$03b7048286541b777f882d73946c1016$0c602735ca1e09539f49acb419b77709f918afbf1d183a6cd0a8da462f769726b1ae9f82f2e9906474e8a7b268bce737e3d2b31e1905a3b95695d1c01139090d";

export interface PasswordHashResult {
    readonly is_successful: boolean;
    readonly password_hash: string;
}

export type PasswordVerificationStatus = "matched" | "not_matched" | "malformed_hash" | "verification_failed";

export interface PasswordVerificationResult {
    readonly status: PasswordVerificationStatus;
}

interface ParsedPasswordHash {
    readonly scrypt_options: ScryptOptions;
    readonly salt: Buffer;
    readonly expected_derived_key: Buffer;
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

/**
 * Objetivo: Converter um campo hexadecimal do hash gravado de volta para bytes,
 * recusando conteúdo que não seja hexadecimal válido.
 *
 * Descrição:
 * 1. Decodifica o texto como hexadecimal.
 * 2. Recusa o resultado vazio.
 * 3. Recodifica os bytes e compara com o texto original, em minúsculas.
 *
 * Retornos esperados:
 * - Retorna os bytes decodificados quando o campo é hexadecimal válido e não vazio.
 * - Retorna nulo caso contrário.
 *
 * Restrições:
 * - A recodificação do passo 3 é necessária porque Buffer.from(texto, "hex") ignora
 *   silenciosamente caracteres inválidos em vez de sinalizar erro. Sem essa conferência,
 *   um hash corrompido seria aceito como se fosse íntegro.
 */
function decodeHexadecimalField(hexadecimal_field: string): Buffer | null {
    const decoded_bytes: Buffer = Buffer.from(hexadecimal_field, HASH_ENCODING);
    if (decoded_bytes.length < MINIMUM_BUFFER_LENGTH_IN_BYTES) {
        return null;
    }
    if (decoded_bytes.toString(HASH_ENCODING) !== hexadecimal_field.toLowerCase()) {
        return null;
    }

    return decoded_bytes;
}

/**
 * Retornos esperados:
 * - Retorna o inteiro lido do campo quando ele é um número decimal maior ou igual
 *   a MINIMUM_SCRYPT_PARAMETER_VALUE.
 * - Retorna nulo quando o campo não é numérico ou está abaixo do mínimo.
 */
function parseScryptParameter(parameter_field: string): number | null {
    const parsed_parameter: number = Number.parseInt(parameter_field, DECIMAL_RADIX);
    if (Number.isNaN(parsed_parameter) || parsed_parameter < MINIMUM_SCRYPT_PARAMETER_VALUE) {
        return null;
    }

    return parsed_parameter;
}

/**
 * Objetivo: Reconstruir, a partir do texto gravado no banco, tudo o que é preciso
 * para repetir a derivação da senha: os parâmetros de custo, o sal e a chave esperada.
 *
 * Descrição:
 * 1. Divide o texto pelos separadores e confere a quantidade de campos.
 * 2. Confere se o rótulo do algoritmo é o esperado.
 * 3. Converte os três parâmetros de custo para inteiros positivos.
 * 4. Decodifica o sal e a chave derivada de hexadecimal para bytes.
 *
 * Parâmetros:
 * - stored_password_hash: Conteúdo da coluna password_hash, no formato
 *   "scrypt$N$r$p$sal$chave" produzido por hashPassword().
 *
 * Retornos esperados:
 * - Retorna a estrutura com opções, sal e chave esperada quando o texto está íntegro.
 * - Retorna nulo quando o texto está truncado, com campos não numéricos, com
 *   hexadecimal inválido ou com um rótulo de algoritmo desconhecido.
 *
 * Restrições:
 * - O teto de memória usado na reconferência vem das constantes atuais deste módulo,
 *   e não do hash: assim, um registro adulterado no banco não consegue forçar o
 *   servidor a alocar memória arbitrária durante um login.
 */
function decodePasswordHash(stored_password_hash: string): ParsedPasswordHash | null {
    const hash_fields: string[] = stored_password_hash.split(HASH_FIELD_SEPARATOR);
    if (hash_fields.length !== HASH_FIELD_COUNT) {
        return null;
    }
    if (hash_fields[ALGORITHM_FIELD_INDEX] !== HASH_ALGORITHM_LABEL) {
        return null;
    }

    const cost_factor: number | null = parseScryptParameter(hash_fields[COST_FACTOR_FIELD_INDEX]!);
    const block_size: number | null = parseScryptParameter(hash_fields[BLOCK_SIZE_FIELD_INDEX]!);
    const parallelization: number | null = parseScryptParameter(hash_fields[PARALLELIZATION_FIELD_INDEX]!);
    if (cost_factor === null || block_size === null || parallelization === null) {
        return null;
    }

    const salt: Buffer | null = decodeHexadecimalField(hash_fields[SALT_FIELD_INDEX]!);
    const expected_derived_key: Buffer | null = decodeHexadecimalField(hash_fields[DERIVED_KEY_FIELD_INDEX]!);
    if (salt === null || expected_derived_key === null) {
        return null;
    }

    return {
        scrypt_options: {
            N: cost_factor,
            r: block_size,
            p: parallelization,
            maxmem: SCRYPT_MAXIMUM_MEMORY_IN_MEGABYTES * BYTES_IN_ONE_MEGABYTE
        },
        salt: salt,
        expected_derived_key: expected_derived_key
    };
}

/**
 * Objetivo: Conferir se uma senha apresentada no login corresponde ao hash gravado
 * para o usuário, sem nunca reconstruir a senha original.
 *
 * Descrição:
 * 1. Reconstrói os parâmetros, o sal e a chave esperada a partir do hash gravado.
 * 2. Deriva a chave da senha apresentada usando exatamente o mesmo sal e os mesmos
 *    parâmetros de custo.
 * 3. Compara as duas chaves em tempo constante.
 *
 * Parâmetros:
 * - plain_password: Senha em texto puro enviada na requisição de login. Nunca é
 *   registrada em log nem devolvida em qualquer resposta.
 * - stored_password_hash: Conteúdo da coluna password_hash do usuário.
 *
 * Retornos esperados:
 * - Retorna status "matched" quando a senha apresentada gera a mesma chave derivada.
 * - Retorna status "not_matched" quando a derivação conclui mas as chaves diferem.
 * - Retorna status "malformed_hash" quando o hash gravado não pôde ser interpretado.
 * - Retorna status "verification_failed" quando o scrypt não consegue derivar a chave.
 *
 * Assertivas de entrada:
 * - stored_password_hash deve ter sido produzido por hashPassword(); qualquer outro
 *   conteúdo resulta em "malformed_hash", nunca em "matched".
 *
 * Restrições:
 * - Não lança exceções: todos os desfechos, inclusive os de erro, são devolvidos
 *   como status para tratamento por controle de fluxo.
 * - O chamador deve tratar "malformed_hash" e "verification_failed" como falha
 *   interna, e não como senha incorreta: são problemas do servidor, não do usuário.
 */
export async function verifyPassword(plain_password: string, stored_password_hash: string): Promise<PasswordVerificationResult> {
    const parsed_hash: ParsedPasswordHash | null = decodePasswordHash(stored_password_hash);
    if (parsed_hash === null) {
        return { status: "malformed_hash" };
    }

    return new Promise<PasswordVerificationResult>((resolve): void => {
        scrypt(
            plain_password,
            parsed_hash.salt,
            parsed_hash.expected_derived_key.length,
            parsed_hash.scrypt_options,
            (verification_error: Error | null, derived_key: Buffer): void => {
                if (verification_error !== null) {
                    resolve({ status: "verification_failed" });
                    return;
                }

                const is_matching: boolean = timingSafeEqual(derived_key, parsed_hash.expected_derived_key);
                resolve({ status: is_matching ? "matched" : "not_matched" });
            }
        );
    });
}
