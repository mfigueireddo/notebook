import Fastify from "fastify";
import type { FastifyInstance } from "fastify";

import { registerAuthenticationRoutes } from "./authentication/authenticationRoutes.js";
import { registerHealthRoutes } from "./health/healthRoutes.js";

const LOGGER_ENABLED: boolean = true;

/**
 * Objetivo: Cria a instância do Fastify já com todas as rotas do backend registradas,
 * sem iniciar a escuta em nenhuma porta.
 *
 * Descrição:
 * 1. Instancia o Fastify com o logger habilitado.
 * 2. Registra as rotas de healthcheck.
 * 3. Registra as rotas de autenticação.
 * 4. Devolve a instância pronta para receber listen() ou para ser usada em testes.
 *
 * Retornos esperados:
 * - Retorna a instância do Fastify configurada e ainda não escutando.
 *
 * Assertivas de saída:
 * - Todas as rotas conhecidas do backend estão registradas na instância retornada.
 * - Nenhuma porta foi ocupada; iniciar a escuta é responsabilidade do chamador.
 * - Nenhuma conexão com o banco de dados foi aberta: isso é feito por main.ts.
 */
export async function buildServer(): Promise<FastifyInstance> {
    const server: FastifyInstance = Fastify({ logger: LOGGER_ENABLED });

    await registerHealthRoutes(server);
    await registerAuthenticationRoutes(server);

    return server;
}
