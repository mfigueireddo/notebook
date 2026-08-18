/**
 * Configurações de conexão do backend com o banco de dados PostgreSQL.
 *
 * Restrições:
 * - Nenhuma parte do backend deve ler DATABASE_URL diretamente de process.env
 *   fora deste arquivo: toda leitura deve passar por getDatabaseConfig().
 * - Também não deve haver URL de banco escrita como literal em qualquer outro
 *   lugar do backend.
 */

const EMPTY_DATABASE_URL: string = "";

export interface DatabaseConfig {
    readonly url: string;
    readonly is_configured: boolean;
}

/**
 * Objetivo: Lê a URL de conexão do PostgreSQL a partir da variável de ambiente
 * DATABASE_URL, sem lançar exceções quando a variável estiver ausente.
 *
 * Descrição:
 * 1. Lê a variável de ambiente DATABASE_URL.
 * 2. Retorna uma string vazia quando a variável está ausente ou apenas com
 *    espaços em branco.
 * 3. Devolve a URL original (com espaços das pontas removidos) caso contrário.
 *
 * Retornos esperados:
 * - Retorna o conteúdo de DATABASE_URL quando ele está definido e não vazio.
 * - Retorna EMPTY_DATABASE_URL caso contrário.
 *
 * Restrições:
 * - Não valida o formato da URL (ex.: prefixo "postgresql://"): a validação
 *   fica a cargo do Prisma no momento da conexão. Esta função apenas centraliza
 *   a leitura.
 */
function readDatabaseUrl(): string {
    const raw_database_url: string | undefined = process.env["DATABASE_URL"];
    if (raw_database_url === undefined || raw_database_url.trim().length === 0) {
        return EMPTY_DATABASE_URL;
    }

    return raw_database_url.trim();
}

/**
 * Objetivo: Monta o objeto de configuração usado para inicializar o cliente do
 * Prisma quando o backend precisar acessar o banco de dados.
 *
 * Retornos esperados:
 * - Retorna um DatabaseConfig com a URL lida do ambiente e uma flag indicando
 *   se DATABASE_URL foi encontrada.
 *
 * Assertivas de saída:
 * - is_configured é verdadeiro se, e somente se, url tem comprimento maior que zero.
 */
export function getDatabaseConfig(): DatabaseConfig {
    const database_url: string = readDatabaseUrl();
    return {
        url: database_url,
        is_configured: database_url.length > 0
    };
}
