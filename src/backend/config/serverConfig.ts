/**
 * Configurações de inicialização do servidor HTTP do backend.
 *
 * Restrições:
 * - Nenhum valor numérico ou textual de configuração deve ser escrito diretamente
 *   nas rotas ou na inicialização do servidor: todos ficam centralizados aqui.
 */

const DEFAULT_SERVER_PORT: number = 3333;
const DEFAULT_SERVER_HOST: string = "0.0.0.0";
const DECIMAL_RADIX: number = 10;
const MINIMUM_VALID_PORT: number = 1;
const MAXIMUM_VALID_PORT: number = 65535;

export interface ServerConfig {
    readonly port: number;
    readonly host: string;
}

/**
 * Objetivo: Lê a porta do servidor a partir da variável de ambiente PORT,
 * caindo para o valor padrão sempre que a variável estiver ausente ou inválida.
 *
 * Descrição:
 * 1. Lê a variável de ambiente PORT.
 * 2. Retorna o valor padrão caso a variável não esteja definida.
 * 3. Converte o texto para inteiro na base decimal.
 * 4. Retorna o valor padrão caso a conversão falhe ou o número esteja fora da faixa válida.
 *
 * Retornos esperados:
 * - Retorna o inteiro lido de PORT quando ele está entre MINIMUM_VALID_PORT e MAXIMUM_VALID_PORT.
 * - Retorna DEFAULT_SERVER_PORT quando PORT está ausente, não é numérica ou está fora da faixa.
 *
 * Restrições:
 * - Não lança exceções: uma configuração inválida é uma condição esperada e é
 *   tratada por controle de fluxo explícito.
 */
function readServerPort(): number {
    const raw_port: string | undefined = process.env["PORT"];
    if (raw_port === undefined || raw_port.trim().length === 0) {
        return DEFAULT_SERVER_PORT;
    }

    const parsed_port: number = Number.parseInt(raw_port, DECIMAL_RADIX);
    if (Number.isNaN(parsed_port)) {
        return DEFAULT_SERVER_PORT;
    }
    if (parsed_port < MINIMUM_VALID_PORT || parsed_port > MAXIMUM_VALID_PORT) {
        return DEFAULT_SERVER_PORT;
    }

    return parsed_port;
}

/**
 * Retornos esperados:
 * - Retorna o conteúdo da variável de ambiente HOST quando ela está definida e não vazia.
 * - Retorna DEFAULT_SERVER_HOST caso contrário.
 */
function readServerHost(): string {
    const raw_host: string | undefined = process.env["HOST"];
    if (raw_host === undefined || raw_host.trim().length === 0) {
        return DEFAULT_SERVER_HOST;
    }

    return raw_host.trim();
}

/**
 * Objetivo: Monta o objeto de configuração usado para subir o servidor HTTP.
 *
 * Assertivas de saída:
 * - A porta retornada é sempre um inteiro válido dentro da faixa de portas TCP.
 * - O host retornado é sempre uma string não vazia.
 */
export function getServerConfig(): ServerConfig {
    return {
        port: readServerPort(),
        host: readServerHost()
    };
}
