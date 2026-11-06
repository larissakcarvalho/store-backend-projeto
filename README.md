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
   npm install
   cp .env.example .env
   ```

   Execute os comandos na raiz deste repositório. No Windows PowerShell, use `Copy-Item .env.example .env` no lugar de `cp`.

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
| POST | `/v1/category` | JWT | Cria categoria |
| PUT, DELETE | `/v1/category/:id` | JWT | Altera ou remove categoria |
| GET | `/v1/product/search` | Público | Lista produtos habilitados com filtros |
| GET | `/v1/product/:id` | Público | Consulta produto habilitado |
| POST | `/v1/product` | JWT | Cria produto |
| PUT, DELETE | `/v1/product/:id` | JWT | Altera ou remove produto |

Nas rotas protegidas, envie o JWT obtido no login no cabeçalho `Authorization`, usando o esquema Bearer. O cadastro e o login são as únicas operações de escrita públicas.

As buscas de categorias e produtos aceitam `limit` (padrão 12; `-1` para todos), `page` (padrão 1) e `fields`. Produtos aceitam também `match`, `category_ids`, `price-range` (por exemplo `100-200`) e filtros `option[ID]` (por exemplo, `option[45]=GG,PP`). É possível combinar filtros de opções com IDs diferentes; cada opção filtrada precisa corresponder ao produto. Para manter compatibilidade com o escopo, `product_options.values` armazena os valores separados por vírgulas; uma tabela auxiliar indexada mantém os filtros eficientes. As duas representações são atualizadas na mesma transação. As respostas de busca usam `{ data, total, limit, page }`.

Produtos podem incluir `category_ids`, `images` e `options`. Para imagens, informe `content` como URL HTTP(S), caminho já salvo ou base64 com assinatura real do formato; imagens base64 PNG, JPEG, GIF e WebP são gravadas em `uploads/` e servidas por `/media/`. Opções recebem título, formato, tipo, raio e `values`. Nas atualizações, categorias informadas substituem os vínculos atuais; imagens e opções são atualizadas pelos IDs enviados, e itens não mencionados são preservados. As alterações de banco são atômicas; arquivos novos são removidos se a transação falhar.

Os preços são armazenados como `DECIMAL(10,2)`. `price_with_discount: 0` significa que não há preço promocional. O catálogo inicial insere as categorias e os oito produtos de demonstração.

## Testes

```bash
npm test
```

Os testes de contrato HTTP não precisam de uma conexão com o MySQL. Para executar também o teste de integração CRUD com persistência:

1. Mantenha `DB_NAME=digital_store` no `.env`; a configuração `test` do Sequelize CLI usa o banco separado `digital_store_test`.
2. Execute as migrations nele: `npm run db:migrate -- --env test`.
3. Defina `RUN_DB_TESTS=true` e `TEST_DB_NAME=digital_store_test` e execute `npm run test:db`.

No PowerShell:

```powershell
$env:RUN_DB_TESTS = "true"
$env:TEST_DB_NAME = "digital_store_test"
npm run test:db
```

O workflow do GitHub Actions também executa os testes de contrato e persistência usando um serviço MySQL dedicado.

## Publicação e implantação

### GitHub

O código-fonte do backend está no repositório independente [larissakcarvalho/store-backend-projeto](https://github.com/larissakcarvalho/store-backend-projeto), na branch `main`. O workflow [Backend CI](https://github.com/larissakcarvalho/store-backend-projeto/actions/workflows/backend.yml) instala as dependências, executa os testes, aplica migrations e seed em um MySQL de CI isolado e roda o teste de persistência.

Em 6 de novembro de 2026, a CI foi executada manualmente após a atualização e passou: [execução 3](https://github.com/larissakcarvalho/store-backend-projeto/actions/runs/42226274108). Clones locais anteriores à reescrita devem sincronizar a branch com o remoto; se houver alterações locais, faça backup antes de atualizar.

### Vercel e Railway

O projeto separado do backend foi criado na Vercel, conectado ao repositório GitHub e publicado em [store-backend-projeto.vercel.app](https://store-backend-projeto.vercel.app). A aplicação usa o Express detectado pelo Vercel e configura explicitamente o driver `mysql2` no Sequelize para garantir que ele seja incluído no bundle da função.

O MySQL de produção está hospedado no Railway e acessível pela API por meio do TCP Proxy. As variáveis de conexão e `JWT_SECRET` ficam configuradas no ambiente Production da Vercel; seus valores não devem ser incluídos neste repositório.

As migrations `20261106000000-create-store-tables.js` e `20261106010000-normalize-product-option-values.js` estão registradas em `SequelizeMeta`, e as tabelas da API foram provisionadas no banco de produção. O seed demonstrativo também foi aplicado: 5 categorias, 8 produtos, 8 imagens, 13 vínculos de categoria e 38 valores de opções.

Em 6 de novembro de 2026, foram validados no domínio de produção:

- `GET /health` respondeu HTTP 200.
- `GET /api-docs` respondeu HTTP 200 e serviu o Swagger.
- `GET /v1/category/search` respondeu HTTP 200 e retornou as 5 categorias do banco.
- `GET /v1/product/search` respondeu HTTP 200 e retornou os 8 produtos do banco.

O Railway pode cobrar tráfego de rede pública e, na última verificação, a conta indicava crédito limitado. Acompanhe uso e saldo no painel do provedor para evitar interrupções.

### Integração do frontend

O frontend publicado em [frontend-projeto-scne.vercel.app](https://frontend-projeto-scne.vercel.app) consome os endpoints públicos de leitura desta API. A integração está documentada no [repositório do frontend](https://github.com/larissakcarvalho/frontend-projeto), no commit [`d13cade`](https://github.com/larissakcarvalho/frontend-projeto/commit/d13cade863bf4066a2b601e4aea44f70b2d5acf3).

Na inicialização, o frontend consulta `GET /v1/product/search?limit=-1` e `GET /v1/category/search?limit=-1`. A busca por texto, categoria, preço e ordenação acontece no cliente. O frontend usa `FRONTEND_URL` para autorizar sua origem via CORS; ao alterar o domínio público, atualize essa variável na Vercel e faça um novo deploy da API.

Essa integração é somente de leitura: autenticação, cadastro, processamento de pedidos e checkout ainda não estão conectados ao frontend. Se a API ficar indisponível, a loja pode exibir seu catálogo local de demonstração.

### Variáveis de ambiente de produção

As variáveis abaixo devem permanecer no ambiente Production da Vercel, nunca no Git:

| Variável no Vercel | Uso |
|---|---|
| `DB_HOST` | Host público do TCP Proxy Railway |
| `DB_PORT` | Porta pública do TCP Proxy Railway |
| `DB_NAME` | Nome do banco no Railway |
| `DB_USER` | Usuário do banco no Railway |
| `DB_PASSWORD` | Senha do banco no Railway |
| `JWT_SECRET` | Segredo aleatório com pelo menos 32 caracteres |
| `FRONTEND_URL` | Origem do frontend autorizada por CORS, sem barra final |

Cadastre e altere os valores diretamente nos painéis dos provedores. Não compartilhe senhas ou segredos em issues, commits ou conversas. Gere o `JWT_SECRET` localmente, por exemplo:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Para aplicar alterações de configuração, faça um novo deploy de produção. Antes de executar migrations futuras, confirme que a conexão aponta para o banco correto. Em um ambiente local seguro, configure temporariamente o `.env` com os dados do ambiente de destino e execute:

```bash
npm run db:migrate -- --env production
```

O comando aplica apenas migrations ainda não registradas. O seed não é idempotente; execute-o somente quando quiser inserir o catálogo demonstrativo em um banco vazio:

```bash
npm run db:seed -- --env production
```

### Imagens em produção

O backend aceita URLs HTTP(S), caminhos já salvos e imagens base64. O armazenamento de arquivos em `uploads/` é local e não persistente no ambiente serverless da Vercel. Para esta implantação, use URLs externas para as imagens; não dependa de uploads base64 gravados no disco do Vercel.

### Escopo não incluído

Não há checkout real ou processamento de pagamentos. As imagens enviadas para `uploads/` não persistem entre execuções no ambiente serverless da Vercel; para este deploy, use URLs externas.
