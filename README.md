# Digital Store API

API REST da loja demonstrativa, construída com Node.js, Express, MySQL, Sequelize, migrations, JWT e Jest.

## Requisitos

- Node.js 20.19+ (ou 22.12+)
- MySQL 8+
- npm

## Configuração local

1. Crie o banco de dados:

   ```sql
   CREATE DATABASE digital_store CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

2. Copie `.env.example` para `.env` (`Copy-Item .env.example .env` no PowerShell ou `cp .env.example .env` em shells POSIX). Configure as credenciais MySQL e defina `JWT_SECRET` com pelo menos 32 caracteres. Não versione `.env`.
3. Instale e inicialize o banco:

   ```bash
   npm install
   npm run db:migrate
   npm run db:seed
   ```

4. Inicie a API:

   ```bash
   npm run dev
   ```

A API fica em `http://localhost:3000`. Verifique `/health`; a documentação Swagger está em `/api-docs` e a especificação OpenAPI em `/api-docs.json`.

## Endpoints

- `POST /v1/user` — cadastro; `POST /v1/user/token` — autenticação JWT.
- `GET /v1/user/:id` — consulta usuário; `PUT` e `DELETE /v1/user/:id` permitem alterar ou remover apenas o próprio usuário.
- `/v1/category/search` e `/v1/product/search` listam recursos com paginação e filtros.
- `GET /v1/category/:id` e `GET /v1/product/:id` consultam por ID.
- `POST`, `PUT` e `DELETE` em `/v1/category` e `/v1/product` exigem autenticação JWT.

O catálogo inicial contém oito produtos demonstrativos. Pagamentos e checkout real não fazem parte do projeto.

## Testes

```bash
npm test
```
