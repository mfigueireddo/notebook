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
export const HTTP_STATUS_CREATED: number = 201; // Requisição bem-sucedida; um recurso novo foi criado e é devolvido no corpo.
export const HTTP_STATUS_CONFLICT: number = 409; // A requisição é válida, mas conflita com o estado atual do recurso (ex.: email ou nome de usuário já cadastrado).
export const HTTP_STATUS_INTERNAL_SERVER_ERROR: number = 500; // Falha inesperada no servidor; a requisição não pôde ser concluída.
