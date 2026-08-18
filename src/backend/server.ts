import Fastify from "fastify";
import type { FastifyInstance } from "fastify";

import { registerHealthRoutes } from "./health/healthRoutes.js";

const LOGGER_ENABLED: boolean = true;

/**
 * Objective: Cria a instância do Fastify já com todas as rotas do backend registradas,
 * sem iniciar a escuta em nenhuma porta.
 *
 * Description:
 * 1. Instancia o Fastify com o logger habilitado.
 * 2. Registra as rotas de healthcheck.
 * 3. Devolve a instância pronta para receber listen() ou para ser usada em testes.
 *
 * Expected Returns:
 * - Retorna a instância do Fastify configurada e ainda não escutando.
 *
 * Assertives of Departure:
 * - Todas as rotas conhecidas do backend estão registradas na instância retornada.
 * - Nenhuma porta foi ocupada; iniciar a escuta é responsabilidade do chamador.
 */
export async function buildServer(): Promise<FastifyInstance> {
    const server: FastifyInstance = Fastify({ logger: LOGGER_ENABLED });

    await registerHealthRoutes(server);

    return server;
}
