module.exports = {
  openapi: '3.0.3',
  info: {
    title: 'Digital Store API',
    version: '1.0.0',
    description: 'API REST de usuários, categorias e produtos da Digital Store.',
  },
  servers: [{ url: 'http://localhost:3000' }],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    parameters: {
      id: { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
    },
    schemas: {
      Error: { type: 'object', properties: { message: { type: 'string' } } },
      UserUpdate: {
        type: 'object',
        minProperties: 1,
        properties: {
          firstname: { type: 'string', maxLength: 100 },
          surname: { type: 'string', maxLength: 100 },
          email: { type: 'string', format: 'email', maxLength: 255 },
        },
      },
      Category: {
        type: 'object',
        required: ['name', 'slug'],
        properties: {
          id: { type: 'integer' },
          name: { type: 'string', maxLength: 100 },
          slug: { type: 'string', maxLength: 120 },
          use_in_menu: { type: 'boolean', default: false },
        },
      },
      CategoryUpdate: {
        type: 'object',
        minProperties: 1,
        properties: {
          name: { type: 'string', maxLength: 100 },
          slug: { type: 'string', maxLength: 120 },
          use_in_menu: { type: 'boolean' },
        },
      },
      ProductOption: {
        type: 'object',
        required: ['title', 'values'],
        properties: {
          id: { type: 'integer' },
          title: { type: 'string', maxLength: 100 },
          shape: { type: 'string', enum: ['square', 'circle'], default: 'square' },
          radius: { type: 'integer', minimum: 0 },
          type: { type: 'string', enum: ['text', 'color'], default: 'text' },
          values: { type: 'array', minItems: 1, items: { type: 'string' } },
          value: { type: 'array', minItems: 1, items: { type: 'string' }, description: 'Alias compatível para values.' },
          deleted: { type: 'boolean' },
        },
      },
      ProductImage: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          content: { type: 'string', description: 'URL da imagem ou conteúdo base64.' },
          deleted: { type: 'boolean' },
        },
      },
      Product: {
        type: 'object',
        required: ['name', 'slug', 'price'],
        properties: {
          id: { type: 'integer' },
          enabled: { type: 'boolean', default: false },
          name: { type: 'string' },
          slug: { type: 'string' },
          stock: { type: 'integer', minimum: 0 },
          description: { type: 'string' },
          price: { type: 'number', minimum: 0 },
          price_with_discount: { type: 'number', minimum: 0 },
          category_ids: { type: 'array', items: { type: 'integer' } },
          images: { type: 'array', items: { $ref: '#/components/schemas/ProductImage' } },
          options: { type: 'array', items: { $ref: '#/components/schemas/ProductOption' } },
        },
      },
      ProductUpdate: {
        type: 'object',
        minProperties: 1,
        properties: {
          enabled: { type: 'boolean' },
          use_in_menu: { type: 'boolean' },
          name: { type: 'string', maxLength: 160 },
          slug: { type: 'string', maxLength: 180 },
          stock: { type: 'integer', minimum: 0 },
          description: { type: 'string' },
          price: { type: 'number', minimum: 0 },
          price_with_discount: { type: 'number', minimum: 0 },
          category_ids: { type: 'array', items: { type: 'integer' } },
          images: { type: 'array', items: { $ref: '#/components/schemas/ProductImage' } },
          options: { type: 'array', items: { $ref: '#/components/schemas/ProductOption' } },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: { summary: 'Verifica a disponibilidade da API', responses: { 200: { description: 'API disponível' } } },
    },
    '/v1/user': {
      post: {
        summary: 'Cadastra usuário',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['firstname', 'surname', 'email', 'password', 'confirmPassword'],
                properties: {
                  firstname: { type: 'string' },
                  surname: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 8 },
                  confirmPassword: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Usuário criado' },
          400: { description: 'Dados inválidos' },
          409: { description: 'E-mail já cadastrado' },
        },
      },
    },
    '/v1/user/token': {
      post: {
        summary: 'Gera token JWT',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', required: ['email', 'password'] } } },
        },
        responses: {
          200: { description: 'Token gerado' },
          401: { description: 'Credenciais inválidas' },
        },
      },
    },
    '/v1/user/{id}': {
      get: { summary: 'Consulta usuário por ID', parameters: [{ $ref: '#/components/parameters/id' }], responses: { 200: { description: 'Usuário encontrado' }, 404: { description: 'Não encontrado' } } },
      put: {
        summary: 'Atualiza o próprio usuário',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/id' }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/UserUpdate' } } },
        },
        responses: { 204: { description: 'Atualizado' }, 401: { description: 'Não autenticado' }, 403: { description: 'Sem permissão' } },
      },
      delete: {
        summary: 'Remove o próprio usuário',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/id' }],
        responses: { 204: { description: 'Removido' }, 401: { description: 'Não autenticado' }, 403: { description: 'Sem permissão' } },
      },
    },
    '/v1/category/search': {
      get: {
        summary: 'Lista e filtra categorias',
        parameters: [
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 12 } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'fields', in: 'query', schema: { type: 'string' } },
          { name: 'use_in_menu', in: 'query', schema: { type: 'boolean' } },
        ],
        responses: { 200: { description: 'Lista paginada de categorias' } },
      },
    },
    '/v1/category': {
      post: {
        summary: 'Cria categoria',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Category' } } },
        },
        responses: { 201: { description: 'Categoria criada' }, 400: { description: 'Dados inválidos' }, 401: { description: 'Não autenticado' } },
      },
    },
    '/v1/category/{id}': {
      get: { summary: 'Consulta categoria por ID', parameters: [{ $ref: '#/components/parameters/id' }], responses: { 200: { description: 'Categoria encontrada' }, 404: { description: 'Não encontrada' } } },
      put: {
        summary: 'Atualiza categoria',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/id' }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CategoryUpdate' } } },
        },
        responses: { 204: { description: 'Atualizada' }, 400: { description: 'Dados inválidos' }, 401: { description: 'Não autenticado' }, 404: { description: 'Não encontrada' } },
      },
      delete: { summary: 'Remove categoria', security: [{ bearerAuth: [] }], parameters: [{ $ref: '#/components/parameters/id' }], responses: { 204: { description: 'Removida' }, 401: { description: 'Não autenticado' }, 409: { description: 'Categoria associada a produtos' } } },
    },
    '/v1/product/search': {
      get: {
        summary: 'Lista e filtra produtos habilitados',
        parameters: [
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 12 } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'fields', in: 'query', schema: { type: 'string' } },
          { name: 'match', in: 'query', schema: { type: 'string' } },
          { name: 'category_ids', in: 'query', schema: { type: 'string' } },
          { name: 'price-range', in: 'query', schema: { type: 'string', example: '100-200' } },
          { name: 'option[ID]', in: 'query', schema: { type: 'string' }, description: 'Filtra pelos valores de uma opção, por exemplo option[45]=GG,PP.' },
        ],
        responses: { 200: { description: 'Lista paginada de produtos' } },
      },
    },
    '/v1/product': {
      post: {
        summary: 'Cria produto',
        security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Product' } } } },
        responses: { 201: { description: 'Produto criado' }, 400: { description: 'Dados inválidos' }, 401: { description: 'Não autenticado' } },
      },
    },
    '/v1/product/{id}': {
      get: { summary: 'Consulta produto habilitado por ID', parameters: [{ $ref: '#/components/parameters/id' }], responses: { 200: { description: 'Produto encontrado' }, 404: { description: 'Não encontrado' } } },
      put: {
        summary: 'Atualiza produto',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/id' }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ProductUpdate' } } },
        },
        responses: { 204: { description: 'Atualizado' }, 400: { description: 'Dados inválidos' }, 401: { description: 'Não autenticado' }, 404: { description: 'Não encontrado' } },
      },
      delete: { summary: 'Remove produto', security: [{ bearerAuth: [] }], parameters: [{ $ref: '#/components/parameters/id' }], responses: { 204: { description: 'Removido' }, 401: { description: 'Não autenticado' }, 404: { description: 'Não encontrado' } } },
    },
  },
}
