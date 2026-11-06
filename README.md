# Digital Store Backend

API REST da loja demonstrativa, organizada em rotas, controllers, models e middleware. Usa Node.js, Express, MySQL, Sequelize, migrations, JWT e Jest.

## Requisitos

- Node.js 20.19+ (ou 22.12+)
- MySQL 8+
- npm

## Configuração

1. Crie o banco: `CREATE DATABASE digital_store CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
2. Copie `.env.example` para `.env` e configure a conexão MySQL e `JWT_SECRET` (mínimo 32 caracteres).
3. Execute `npm install`, `npm run db:migrate` e `npm run db:seed`.
4. Inicie com `npm run dev`. API: `http://localhost:3000`; Swagger: `/api-docs`.

Consulte `src/` para os endpoints e modelos. Rotas CRUD de categorias e produtos exigem JWT Bearer; `/v1/user` cadastra usuários e `/v1/user/token` autentica. Não há checkout ou pagamentos reais.
