import { PrismaClient } from "@prisma/client";

import { getDatabaseConfig } from "../config/databaseConfig.js";
import type { DatabaseConfig } from "../config/databaseConfig.js";

/**
 * Objetivo: Centralizar a instância do PrismaClient usada pelo backend,
 * garantindo que uma única conexão seja compartilhada por todo o processo.
 *
 * Restrições:
 * - Nenhum módulo do backend deve instanciar PrismaClient por conta própria:
 *   toda leitura ou escrita no banco deve reutilizar a instância exposta aqui.
 * - Este arquivo é o único autorizado a importar diretamente de "@prisma/client".
 */

let prisma_singleton: PrismaClient | null = null;

/**
 * Objetivo: Devolve a instância única do PrismaClient, criando-a na primeira chamada.
 *
 * Descrição:
 * 1. Se a instância já existe, retorna-a imediatamente.
 * 2. Caso contrário, lê a configuração do banco e monta um novo PrismaClient
 *    apontando para a URL configurada.
 * 3. Guarda a instância criada para reutilização em chamadas futuras.
 *
 * Retornos esperados:
 * - Retorna sempre a mesma instância de PrismaClient para o processo atual.
 *
 * Assertivas de entrada:
 * - A variável de ambiente DATABASE_URL deve estar definida com uma URL de
 *   PostgreSQL válida antes da primeira consulta ao banco. Sem ela, o Prisma
 *   falhará ao tentar abrir a conexão (não neste ponto, e sim no primeiro uso).
 *
 * Restrições:
 * - A criação é preguiçosa: importar este módulo NÃO abre conexão com o banco.
 *   A conexão só é estabelecida na primeira query ou em uma chamada explícita
 *   a connectPrismaClient().
 */
export function getPrismaClient(): PrismaClient {
    if (prisma_singleton !== null) {
        return prisma_singleton;
    }

    const database_config: DatabaseConfig = getDatabaseConfig();
    prisma_singleton = new PrismaClient({
        datasources: {
            db: {
                url: database_config.url
            }
        }
    });

    return prisma_singleton;
}

/**
 * Objetivo: Abre explicitamente a conexão do cliente Prisma com o PostgreSQL.
 *
 * Descrição:
 * 1. Obtém (ou cria) a instância única do PrismaClient.
 * 2. Chama $connect() para estabelecer a conexão imediatamente, em vez de
 *    esperar pela primeira query.
 *
 * Assertivas de entrada:
 * - DATABASE_URL deve apontar para um PostgreSQL alcançável a partir do processo.
 *
 * Assertivas de saída:
 * - Ao retornar sem erro, a instância única do PrismaClient está conectada e
 *   pronta para receber consultas.
 */
export async function connectPrismaClient(): Promise<void> {
    const prisma_client: PrismaClient = getPrismaClient();
    await prisma_client.$connect();
}

/**
 * Objetivo: Encerra a conexão do cliente Prisma com o PostgreSQL de forma ordenada.
 *
 * Descrição:
 * 1. Se nenhuma instância foi criada, encerra sem efeito.
 * 2. Caso contrário, chama $disconnect() na instância única e a descarta,
 *    permitindo que uma nova instância seja criada em usos futuros do processo.
 *
 * Assertivas de saída:
 * - Após o retorno, não há conexão aberta pelo backend com o PostgreSQL.
 */
export async function disconnectPrismaClient(): Promise<void> {
    if (prisma_singleton === null) {
        return;
    }

    await prisma_singleton.$disconnect();
    prisma_singleton = null;
}
