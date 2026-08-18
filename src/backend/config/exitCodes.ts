/**
 * Objetivo: Centralizar os códigos de saída do processo do backend,
 * associando cada código a uma descrição legível do motivo do encerramento.
 *
 * Restrições:
 * - Nenhum valor numérico de código de saída deve ser escrito diretamente
 *   em chamadas de process.exit: toda saída anormal deve referenciar uma
 *   entrada deste dicionário.
 */

const GENERIC_FAILURE_CODE: number = 1;

export interface ExitCodeEntry {
    readonly code: number;
    readonly description: string;
}

export const EXIT_CODES: Readonly<Record<string, ExitCodeEntry>> = {
    FAILURE: {
        code: GENERIC_FAILURE_CODE,
        description: "Falha genérica durante a inicialização ou o encerramento ordenado do servidor."
    }
} as const;
