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

Alguns pacotes usam scripts de instalação. Caso o npm peça aprovação, execute:

```bash
npm install-scripts approve esbuild
npm install-scripts approve prisma
npm install-scripts approve @prisma/client
npm install-scripts approve @prisma/engines
```

O `esbuild` é dependência do `tsx`; os pacotes do Prisma usam os scripts para
baixar os engines de consulta e para gerar o cliente após a instalação.

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

O projeto usa o Prisma como ORM sobre PostgreSQL. O backend **abre a conexão com
o banco durante a inicialização**, antes de começar a escutar na porta: se o
PostgreSQL não estiver alcançável em `DATABASE_URL`, o processo registra o erro
e encerra com o código de saída `2` em vez de subir sem banco.

Antes da primeira execução é preciso preparar o ambiente na ordem abaixo:

1. Subir um PostgreSQL e criar o banco apontado por `DATABASE_URL`.
2. Gerar o cliente do Prisma (`npm run prisma:generate`).
3. Aplicar as migrations (`npm run prisma:migrate:dev`), que criam as tabelas
   `users` e `topics`.

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
> Como o backend só sobe depois de conectar ao PostgreSQL, um servidor no ar
> indica que o banco estava alcançável na inicialização — mas não que continua.

## Cadastro de usuário

Com o servidor em execução e as migrations aplicadas, a rota
`POST /authentication/users` cria uma conta nova.

```bash
curl -i -X POST http://127.0.0.1:3333/authentication/users \
    -H "Content-Type: application/json" \
    -d '{"email":"pessoa@exemplo.com","username":"pessoa","password":"senha-secreta"}'
```

Resposta esperada (HTTP 201):

```json
{
    "id": "0f5a4f0e-6d6a-4f5c-9a3e-6a2f0b5b1c34",
    "email": "pessoa@exemplo.com",
    "username": "pessoa",
    "created_at": "2026-08-18T01:29:58.841Z"
}
```

O hash da senha nunca é devolvido pela rota.

### Regras de validação do corpo

| Campo | Regra |
| --- | --- |
| `email` | Obrigatório, formato de email, até 320 caracteres. Gravado em minúsculas. |
| `username` | Obrigatório, de 3 a 64 caracteres. Maiúsculas e minúsculas são preservadas. |
| `password` | Obrigatória, de 8 a 128 caracteres. |

Campos não listados no corpo são descartados pela validação do Fastify.

### Respostas de erro

| Status | `code` | Situação |
| --- | --- | --- |
| 400 | `FST_ERR_VALIDATION` | Corpo malformado ou fora das regras da tabela acima (resposta gerada pelo próprio Fastify). |
| 409 | `EMAIL_ALREADY_REGISTERED` | O email já pertence a uma conta. |
| 409 | `USERNAME_ALREADY_REGISTERED` | O nome de usuário já está em uso. |
| 409 | `CREDENTIALS_ALREADY_TAKEN` | Outra requisição cadastrou as mesmas credenciais no mesmo instante. |
| 500 | `REGISTRATION_FAILED` | Falha interna (banco indisponível ou erro ao gerar o hash). O detalhe fica apenas no log do servidor. |

Exemplo de conflito (HTTP 409):

```json
{
    "code": "EMAIL_ALREADY_REGISTERED",
    "message": "Este email já está cadastrado."
}
```
