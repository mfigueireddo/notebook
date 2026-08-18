import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

const HEALTH_ROUTE_PATH: string = "/health";
const HTTP_STATUS_OK: number = 200;

export interface HealthResponse {
    readonly status: "ok";
    readonly uptime_in_seconds: number;
    readonly checked_at: string;
}

/**
 * Objective: Monta a resposta do healthcheck com o estado atual do processo do backend.
 *
 * Description:
 * 1. Lê o tempo de vida do processo através de process.uptime(), que retorna segundos fracionários.
 * 2. Arredonda o valor para segundos inteiros.
 * 3. Registra o instante da verificação no formato ISO 8601 (UTC).
 *
 * Expected Returns:
 * - Retorna sempre um HealthResponse com status "ok": se o processo não estivesse
 *   saudável, esta função não seria alcançada, pois o servidor não responderia.
 *
 * Restrictions:
 * - Esta versão verifica apenas a disponibilidade do processo HTTP. A verificação
 *   de dependências externas (PostgreSQL via Prisma) será adicionada quando o
 *   banco de dados entrar no projeto.
 */
function buildHealthResponse(): HealthResponse {
    const uptime_in_seconds: number = Math.floor(process.uptime());
    const checked_at: string = new Date().toISOString();

    return {
        status: "ok",
        uptime_in_seconds: uptime_in_seconds,
        checked_at: checked_at
    };
}

/**
 * Objective: Registra a rota GET /health na instância do Fastify recebida.
 *
 * Description:
 * 1. Declara a rota GET /health com o schema de resposta esperado.
 * 2. Ao ser chamada, monta a resposta de saúde e a devolve com status 200.
 *
 * Parameters:
 * - server: Instância do Fastify ainda não escutando em nenhuma porta. As rotas
 *   precisam ser registradas antes da chamada a listen().
 *
 * Assertives of Entrance:
 * - A rota /health ainda não pode ter sido registrada nesta instância; o Fastify
 *   rejeita rotas duplicadas.
 *
 * Assertives of Departure:
 * - A instância passa a responder GET /health com HTTP 200 e corpo JSON.
 */
export async function registerHealthRoutes(server: FastifyInstance): Promise<void> {
    server.get(
        HEALTH_ROUTE_PATH,
        async (_request: FastifyRequest, reply: FastifyReply): Promise<HealthResponse> => {
            const health_response: HealthResponse = buildHealthResponse();
            reply.status(HTTP_STATUS_OK);

            return health_response;
        }
    );
}
