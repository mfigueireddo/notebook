/**
 * Objetivo: Definir, em um único lugar, a forma canônica do email e do nome de
 * usuário, de modo que o cadastro e o login tratem o mesmo texto exatamente da
 * mesma maneira.
 *
 * Restrições:
 * - Toda escrita e toda busca por email ou nome de usuário no backend deve passar
 *   por estas funções. Se o cadastro gravasse o email de um jeito e o login o
 *   procurasse de outro, contas legítimas ficariam inacessíveis.
 */

/**
 * Objetivo: Deixar o email em uma forma canônica antes de compará-lo com os já
 * cadastrados e antes de gravá-lo, para que "Fulano@Email.com" e "fulano@email.com"
 * não gerem duas contas distintas nem impeçam o login.
 *
 * Descrição:
 * 1. Remove os espaços das pontas.
 * 2. Converte todo o texto para minúsculas.
 *
 * Restrições:
 * - A coluna de email no PostgreSQL tem restrição de unicidade sensível a maiúsculas.
 *   A unicidade prometida pelo escopo ("Nome de usuário e email serão ambos ÚNICO")
 *   só se sustenta se toda escrita passar por esta normalização.
 * - O nome de usuário NÃO recebe o mesmo tratamento: ele é exibido ao próprio dono
 *   e deve preservar as maiúsculas escolhidas por ele.
 */
export function normalizeEmail(raw_email: string): string {
    return raw_email.trim().toLowerCase();
}

/**
 * Retornos esperados:
 * - Retorna o nome de usuário sem os espaços das pontas, preservando maiúsculas e
 *   minúsculas exatamente como digitadas.
 */
export function normalizeUsername(raw_username: string): string {
    return raw_username.trim();
}
