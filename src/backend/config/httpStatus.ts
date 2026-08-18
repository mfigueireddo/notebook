/**
 * Objetivo: Centralizar os códigos de status HTTP retornados pelas rotas do backend,
 * garantindo consistência entre handlers e evitando a repetição de literais numéricos
 * espalhados pelo código.
 *
 * Restrições:
 * - Nenhum código HTTP deve ser escrito diretamente em chamadas de reply.status
 *   ou equivalentes: toda resposta deve referenciar uma constante deste arquivo.
 */

export const HTTP_STATUS_OK: number = 200; // Requisição bem-sucedida; o corpo da resposta contém o recurso solicitado.
