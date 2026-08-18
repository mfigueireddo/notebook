import type { FastifyInstance } from "fastify";

import { getServerConfig } from "./config/serverConfig.js";
import type { ServerConfig } from "./config/serverConfig.js";
import { buildServer } from "./server.js";

const FAILURE_EXIT_CODE: number = 1;
const SHUTDOWN_SIGNALS: readonly NodeJS.Signals[] = ["SIGINT", "SIGTERM"];

/**
 * Objective: Encerra o servidor de forma ordenada quando o processo recebe um
 * sinal de término, evitando conexões abertas e portas presas.
 *
 * Description:
 * 1. Para cada sinal de desligamento conhecido, registra um ouvinte único.
 * 2. Ao receber o sinal, pede o fechamento do servidor Fastify.
 * 3. Encerra o processo com código de falha caso o fechamento não conclua.
 *
 * Assertives of Entrance:
 * - O servidor recebido já deve estar escutando.
 *
 * Assertives of Departure:
 * - O processo termina após o fechamento do servidor, com ou sem sucesso.
 */
function registerShutdownHandlers(server: FastifyInstance): void {
    for (const signal of SHUTDOWN_SIGNALS) {
        process.once(signal, async (): Promise<void> => {
            server.log.info(`Sinal ${signal} recebido. Encerrando o servidor.`);
            try {
                await server.close();
            } catch (shutdown_error: unknown) {
                server.log.error(shutdown_error);
                process.exit(FAILURE_EXIT_CODE);
            }
        });
    }
}

/**
 * Objective: Ponto de entrada do backend: monta o servidor, registra o desligamento
 * ordenado e coloca a aplicação para escutar na porta configurada.
 *
 * Description:
 * 1. Lê a configuração de host e porta.
 * 2. Constrói a instância do Fastify com as rotas registradas.
 * 3. Registra os tratadores de desligamento.
 * 4. Inicia a escuta; em caso de falha, registra o erro e encerra com código de falha.
 *
 * Restrictions:
 * - Esta é a única função do backend autorizada a encerrar o processo.
 */
async function startBackend(): Promise<void> {
    const server_config: ServerConfig = getServerConfig();
    const server: FastifyInstance = await buildServer();

    registerShutdownHandlers(server);

    try {
        await server.listen({ port: server_config.port, host: server_config.host });
    } catch (startup_error: unknown) {
        server.log.error(startup_error);
        process.exit(FAILURE_EXIT_CODE);
    }
}

await startBackend();
