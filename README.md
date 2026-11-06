# Digital Store API

API REST da loja demonstrativa, organizada em rotas, controllers, models e middleware. Usa Node.js, Express, MySQL, Sequelize, migrations, JWT e Jest.

## Requisitos

- Node.js 20.19+ (ou 22.12+)
- MySQL 8+
- npm

## Configuração local

1. Crie o banco de dados:

   ```sql
   CREATE DATABASE digital_store
     CHARACTER SET utf8mb4
     COLLATE utf8mb4_unicode_ci;
   ```

2. Entre nesta pasta, instale as dependências e crie o arquivo de ambiente:

   ```bash
   cd backend
   npm install
   cp .env.example .env
   ```

   No Windows PowerShell, use `Copy-Item .env.example .env` no lugar de `cp`.

3. Configure `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER` e `DB_PASSWORD` no `.env`. Defina `JWT_SECRET` com uma chave aleatória de pelo menos 32 caracteres. Não versione o `.env`.

4. Execute as migrations e os dados iniciais:

   ```bash
   npm run db:migrate
   npm run db:seed
   ```

5. Inicie a API:

   ```bash
   npm run dev
   ```

   A API fica em `http://localhost:3000`. Verifique `/health` e acesse `/api-docs` para a documentação interativa; a especificação OpenAPI em JSON está em `/api-docs.json`.

## Endpoints

| Método | Endpoint | Acesso | Descrição |
|---|---|---|---|
| GET | `/health` | Público | Verificação de disponibilidade |
| POST | `/v1/user` | Público | Cadastro; requer `firstname`, `surname`, `email`, `password` e `confirmPassword` |
| POST | `/v1/user/token` | Público | Login e geração de JWT |
| GET | `/v1/user/:id` | Público | Consulta usuário sem expor a senha |
| PUT, DELETE | `/v1/user/:id` | JWT | Altera ou remove o próprio usuário |
| GET | `/v1/category/search` | Público | Lista categorias com paginação e filtros |
| GET | `/v1/category/:id` | Público | Consulta categoria |
| POST, PUT, DELETE | `/v1/category` | JWT | Cria, altera ou remove categoria |
| GET | `/v1/product/search` | Público | Lista produtos habilitados com filtros |
| GET | `/v1/product/:id` | Público | Consulta produto habilitado |
| POST, PUT, DELETE | `/v1/product` | JWT | Cria, altera ou remove produto |

Nas rotas protegidas, envie o JWT obtido no login no cabeçalho `Authorization`, usando o esquema Bearer. O cadastro e o login são as únicas operações de escrita públicas.

As buscas de categorias e produtos aceitam `limit` (padrão 12; `-1` para todos), `page` (padrão 1) e `fields`. Produtos aceitam também `match`, `category_ids`, `price-range` (por exemplo `100-200`) e filtros `option[ID]`. As respostas de busca usam `{ data, total, limit, page }`.

Produtos podem incluir `category_ids`, `images` e `options`. As imagens recebem um `content` (URL ou conteúdo textual/base64); opções recebem título, formato, tipo, raio e `values`. Nas atualizações, categorias informadas substituem os vínculos atuais; imagens e opções são atualizadas pelos IDs enviados, e itens não mencionados são preservados. Essas alterações são atômicas.

Os preços são armazenados como `DECIMAL(10,2)`. `price_with_discount: 0` significa que não há preço promocional. O catálogo inicial insere as categorias e os oito produtos de demonstração.

## Testes

```bash
npm test
```

Os testes de contrato HTTP não precisam de uma conexão com o MySQL. Os testes que exercitarem persistência devem usar um banco de teste configurado separadamente.
