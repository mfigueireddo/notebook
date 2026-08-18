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
| [src/backend/authentication/](src/backend/authentication/) | Cadastro, login e gestão de conta do usuário |
| [src/backend/config/](src/backend/config/) | Configurações de inicialização do backend |
| [src/backend/database/](src/backend/database/) | Acesso ao banco de dados (cliente Prisma) |
| [src/backend/health/](src/backend/health/) | Rotas de healthcheck |
| [prisma/](prisma/) | Schema e migrations do banco de dados (Prisma) |

## Arquivos

| Diretório | Arquivo | Descrição |
| --- | --- | --- |
| ./ | [package.json](package.json) | Dependências e scripts de build e execução |
| ./ | [package-lock.json](package-lock.json) | Trava as versões exatas das dependências (gerado automaticamente pelo npm) |
| ./ | [tsconfig.json](tsconfig.json) | Configuração do compilador TypeScript |
| ./ | [.editorconfig](.editorconfig) | Padronização de indentação e formatação |
| ./ | [.env.example](.env.example) | Modelo das variáveis de ambiente lidas pelo backend |
| prisma/ | [schema.prisma](prisma/schema.prisma) | Modelo das entidades persistidas pelo backend |
| docs/ | [BUILD.md](docs/BUILD.md) | Como compilar, executar e verificar o projeto |
| docs/decisions | [SCOPE_V0.1.md](docs/decisions/SCOPE_V0.1.md) | Escopo da versão v0.1 |
| docs/decisions | [VERSIONS_CRITERIA.md](docs/decisions/VERSIONS_CRITERIA.md) | Critério para a enumeração das versões |
| src/backend/ | [main.ts](src/backend/main.ts) | Ponto de entrada: sobe o servidor e trata o desligamento ordenado |
| src/backend/ | [server.ts](src/backend/server.ts) | Cria a instância do Fastify e registra as rotas |
| src/backend/authentication/ | [authenticationRoutes.ts](src/backend/authentication/authenticationRoutes.ts) | Rota `POST /authentication/users` (cadastro de usuário) |
| src/backend/authentication/ | [registerUser.ts](src/backend/authentication/registerUser.ts) | Fluxo de cadastro: normalização, checagem de unicidade e persistência |
| src/backend/authentication/ | [userRepository.ts](src/backend/authentication/userRepository.ts) | Acesso ao banco de dados da entidade de usuário |
| src/backend/authentication/ | [passwordHasher.ts](src/backend/authentication/passwordHasher.ts) | Geração do hash das senhas (scrypt) |
| src/backend/config/ | [serverConfig.ts](src/backend/config/serverConfig.ts) | Leitura das configurações de host e porta |
| src/backend/config/ | [exitCodes.ts](src/backend/config/exitCodes.ts) | Dicionário de códigos de saída do processo do backend |
| src/backend/config/ | [shutdownSignals.ts](src/backend/config/shutdownSignals.ts) | Dicionário de sinais tratados como pedidos de encerramento ordenado |
| src/backend/config/ | [httpStatus.ts](src/backend/config/httpStatus.ts) | Códigos de status HTTP retornados pelas rotas |
| src/backend/config/ | [databaseConfig.ts](src/backend/config/databaseConfig.ts) | Leitura da URL de conexão do PostgreSQL (`DATABASE_URL`) |
| src/backend/database/ | [prismaClient.ts](src/backend/database/prismaClient.ts) | Instância única do cliente Prisma usada pelo backend |
| src/backend/health/ | [healthRoutes.ts](src/backend/health/healthRoutes.ts) | Rota `GET /health` |
