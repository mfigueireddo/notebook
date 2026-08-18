# BUILD.md

Como compilar e executar o backend do projeto.

## Pré-requisitos

| Ferramenta | Versão usada no desenvolvimento |
| --- | --- |
| Node.js | 26.x |
| npm | 11.x |

## Instalação das dependências

```bash
npm install
```

O pacote `esbuild` (dependência do `tsx`) usa script de instalação. Caso o npm
peça aprovação, execute:

```bash
npm install-scripts approve esbuild
```

## Compilação

```bash
npm run build
```

O TypeScript é compilado de `src/backend/` para `dist/backend/`, mantendo a mesma
estrutura de diretórios. Para apenas verificar os tipos, sem gerar arquivos:

```bash
npm run typecheck
```

Para remover os artefatos gerados:

```bash
npm run clean
```

## Execução

Modo produção (exige `npm run build` antes):

```bash
npm start
```

Modo desenvolvimento (recompila e reinicia a cada alteração, sem gerar `dist/`):

```bash
npm run dev
```

### Variáveis de ambiente

| Variável | Padrão | Descrição |
| --- | --- | --- |
| `PORT` | `3333` | Porta TCP em que o servidor escuta. Valores ausentes ou inválidos caem no padrão. |
| `HOST` | `0.0.0.0` | Endereço de escuta do servidor. |

Exemplo:

```bash
PORT=4000 npm start
```

## Healthcheck

Com o servidor em execução, a rota `GET /health` informa se o backend está no ar.

```bash
curl -i http://127.0.0.1:3333/health
```

Resposta esperada (HTTP 200):

```json
{
    "status": "ok",
    "uptime_in_seconds": 67,
    "checked_at": "2026-08-18T01:29:58.841Z"
}
```

| Campo | Descrição |
| --- | --- |
| `status` | Sempre `"ok"` quando o servidor responde. |
| `uptime_in_seconds` | Segundos inteiros desde o início do processo. |
| `checked_at` | Instante da verificação, em ISO 8601 (UTC). |

Se o servidor estiver fora do ar, o `curl` falha na conexão em vez de retornar
um código HTTP de erro.

> Nesta versão o healthcheck verifica apenas a disponibilidade do processo HTTP.
> A verificação do PostgreSQL será incluída quando o banco de dados entrar no projeto.

## Estrutura do backend

| Caminho | Descrição |
| --- | --- |
| [src/backend/main.ts](../src/backend/main.ts) | Ponto de entrada: sobe o servidor e trata o desligamento ordenado. |
| [src/backend/server.ts](../src/backend/server.ts) | Cria a instância do Fastify e registra as rotas. |
| [src/backend/config/serverConfig.ts](../src/backend/config/serverConfig.ts) | Leitura das configurações de host e porta. |
| [src/backend/health/healthRoutes.ts](../src/backend/health/healthRoutes.ts) | Rota `GET /health`. |
