/**
 * Objetivo: Centralizar os sinais de sistema tratados como pedidos de
 * encerramento ordenado do backend, associando cada sinal a uma descrição
 * legível de sua origem típica.
 *
 * Restrições:
 * - Nenhum nome de sinal deve ser escrito diretamente em chamadas de
 *   process.on ou process.once: todo tratamento de desligamento deve
 *   iterar sobre as entradas deste dicionário.
 */

export interface ShutdownSignalEntry {
    readonly signal: NodeJS.Signals;
    readonly description: string;
}

export const SHUTDOWN_SIGNALS: Readonly<Record<string, ShutdownSignalEntry>> = {
    SIGINT: {
        signal: "SIGINT",
        description: "Sinal de interrupção enviado ao pressionar Ctrl+C no terminal."
    },
    SIGTERM: {
        signal: "SIGTERM",
        description: "Sinal de término enviado por orquestradores (Docker, Kubernetes, systemd) para encerramento ordenado."
    }
} as const;
