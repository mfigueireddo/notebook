# Arquitetura

Diretórios
src/backend/
src/frontend/
src/backend/authentication
src/backend/topics

## Stack (Backend)

- Linguagem: TypeScript
- Runtime/Framework: Node.js + Fastify
- ORM: Prisma
- Banco de dados: PostgreSQL

---

# Autenticação

## Escopo

Desenvolver um sistema de autenticação.
1. Criação de conta (email, nome de usuário e senha)
2. Login (email OU nome de usuário e senha)
3. Edição de conta (nome de usuário)
4. Edição de senha (quando autenticado)
5. Exclusão de conta

As regras de validação dos dados não serão especificadas nesse momento - deverão ser aproveitadas as validações já existentes pela stack escolhida.

Nome de usuário e email serão ambos ÚNICO.

A exclusão de conta deletará todos os dados do usuário - inclusive seus tópicos e anotações vinculadas.

O usuário deverá ser redirecionado à tela de login NÃO AUTENTICADO quando alterar sua senha. 

Exibir uma mensagem pergutando se o usuário deseja confirmar a ação dele ao tentar editar nome de usuário ou senha e também ao tentar excluir sua conta.

Deletar a conta redireciona o usuário à tela de cadastro SEM AUTENTICAÇÃO (até porque não existirá mais).

## Fora do escopo

1. Recuperação de senha
2. Troca de email
3. Especificações sobre JWT

---

# Tópicos

CRUD de tópicos: um usuário pode ter até 3 tópicos criados em sua conta. Ele poderá criar o tópico, editar seu nome, e deletá-lo. Um exemplo seria "Cálculo 2".

Cada tópico terá 500 caracteres disponíveis que o usuário faça suas anotações sobre o tópico. Será apenas 1 CAMPO DE TEXTO por tópico. Deverá haver um contador de caracteres juntamente ao campo texto de anotações. Quando estiver no máximo (500 caracteres escritos), a adição de novos caracteres deverá ser proibida.

O usuário só poderá enxergar seus próprios tópicos.

A criação de um tópico deverá ser desabilitada quando o usuário já tiver 3 tópicos criados. O botão deverá ficar desativado e, quando o usuário colocar o mouse por cima dele, deverá aparecer uma mensagem explicando a situação.

As notas do tópico poderão ser alteradas a qualquer momento.

Exibir uma mensagem pergutando se o usuário deseja confirmar a ação dele ao tentar editar deletar um tópico.