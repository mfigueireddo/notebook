# BUILD.md

Como compilar e executar o backend do projeto.

## Pré-requisitos

| Ferramenta | Versão usada no desenvolvimento |
| --- | --- |
| Node.js | 26.x |
| npm | 11.x |
| PostgreSQL | 16.x (necessário quando o backend for de fato conectar ao banco) |

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

Um modelo com todas as variáveis lidas pelo backend está em
[`.env.example`](../.env.example). Copie-o para `.env` e ajuste os valores para
o seu ambiente local (o arquivo `.env` está no `.gitignore` e não é versionado).

| Variável | Padrão | Descrição |
| --- | --- | --- |
| `PORT` | `3333` | Porta TCP em que o servidor escuta. Valores ausentes ou inválidos caem no padrão. |
| `HOST` | `0.0.0.0` | Endereço de escuta do servidor. |
| `DATABASE_URL` | — | URL de conexão do Prisma com o PostgreSQL. Sem ela, o cliente do Prisma falhará ao tentar consultar o banco. |

Exemplo:

```bash
PORT=4000 npm start
```

## Banco de dados (Prisma + PostgreSQL)

O projeto usa o Prisma como ORM sobre PostgreSQL. Nesta versão o schema já está
definido em [`prisma/schema.prisma`](../prisma/schema.prisma), mas o backend
ainda não abre conexão com o banco em nenhum fluxo — os scripts abaixo servem
para preparar o ambiente quando o banco for entrar em uso.

Gerar o cliente TypeScript do Prisma (necessário após clonar o projeto ou
alterar o schema):

```bash
npm run prisma:generate
```

Criar e aplicar uma migration nova em ambiente de desenvolvimento (exige um
PostgreSQL alcançável em `DATABASE_URL`):

```bash
npm run prisma:migrate:dev
```

Aplicar as migrations já geradas em um ambiente de produção/CI (não gera
migrations novas):

```bash
npm run prisma:migrate:deploy
```

Abrir o Prisma Studio para inspecionar visualmente os dados:

```bash
npm run prisma:studio
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
