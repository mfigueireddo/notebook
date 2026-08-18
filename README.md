# README.md

Estado do projeto: v0.1 (em desenvolvimento). Acessar o [planejamento](docs/decisions/SCOPE_V0.1.md) para saber mais.

## Stack (Backend)

- Linguagem: TypeScript
- Runtime/Framework: Node.js + Fastify
- ORM: Prisma
- Banco de dados: PostgreSQL

## Diretórios

| Diretório | Descrição |
| --- | --- |
| [docs/](docs/) | Documentação (.md) |
| [docs/decisions/](docs/decisions/) | Decisões de negócio |
| [src/](src/) | Código-fonte |
| [src/backend/](src/backend/) | Contém o código-fonte relacionado ao backend |
| [src/backend/config/](src/backend/config/) | Configurações de inicialização do backend |
| [src/backend/health/](src/backend/health/) | Rotas de healthcheck |

## Arquivos

| Diretório | Arquivo | Descrição |
| --- | --- | --- |
| ./ | [package.json](package.json) | Dependências e scripts de build e execução |
| ./ | [tsconfig.json](tsconfig.json) | Configuração do compilador TypeScript |
| ./ | [.editorconfig](.editorconfig) | Padronização de indentação e formatação |
| docs/ | [BUILD.md](docs/BUILD.md) | Como compilar, executar e verificar o projeto |
| docs/decisions | [SCOPE_V0.1.md](docs/decisions/SCOPE_V0.1.md) | Escopo da versão v0.1 |
| docs/decisions | [VERSIONS_CRITERIA.md](docs/decisions/VERSIONS_CRITERIA.md) | Critério para a enumeração das versões |
| src/backend/ | [main.ts](src/backend/main.ts) | Ponto de entrada: sobe o servidor e trata o desligamento ordenado |
| src/backend/ | [server.ts](src/backend/server.ts) | Cria a instância do Fastify e registra as rotas |
| src/backend/config/ | [serverConfig.ts](src/backend/config/serverConfig.ts) | Leitura das configurações de host e porta |
| src/backend/health/ | [healthRoutes.ts](src/backend/health/healthRoutes.ts) | Rota `GET /health` |
