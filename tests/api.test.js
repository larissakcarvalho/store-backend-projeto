process.env.DB_NAME = process.env.DB_NAME || 'digital_store_test'
process.env.DB_USER = process.env.DB_USER || 'root'
process.env.DB_PASSWORD = process.env.DB_PASSWORD || ''
process.env.DB_HOST = process.env.DB_HOST || '127.0.0.1'
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-with-at-least-32-characters'

const request = require('supertest')
const app = require('../src/app')
const { Category, Product } = require('../src/models')

describe('API básica', () => {
  afterEach(() => jest.restoreAllMocks())

  test('expõe health check', async () => {
    const response = await request(app).get('/health')
    expect(response.status).toBe(200)
    expect(response.body).toEqual({ status: 'ok' })
  })

  test('expõe a especificação OpenAPI', async () => {
    const response = await request(app).get('/api-docs.json')
    expect(response.status).toBe(200)
    expect(response.body.paths['/v1/product/search']).toBeDefined()
    expect(response.body.paths['/v1/category'].post.requestBody).toBeDefined()
    expect(response.body.paths['/v1/category/{id}'].put.requestBody).toBeDefined()
    expect(response.body.paths['/v1/product/{id}'].put.requestBody).toBeDefined()
    expect(response.body.paths['/v1/user/{id}'].put.requestBody).toBeDefined()
    expect(response.body.components.schemas.ProductUpdate).toBeDefined()
  })

  test('retorna 404 para rotas inexistentes', async () => {
    const response = await request(app).get('/inexistente')
    expect(response.status).toBe(404)
    expect(response.body).toEqual({ message: 'Rota não encontrada.' })
  })

  test('exige token nas operações de escrita', async () => {
    const response = await request(app)
      .post('/v1/category')
      .send({ name: 'Calçados', slug: 'calcados' })
    expect(response.status).toBe(401)
    expect(response.body.message).toMatch(/token/i)
  })

  test('valida o cadastro antes de acessar o banco', async () => {
    const response = await request(app).post('/v1/user').send({})
    expect(response.status).toBe(400)
    expect(response.body.message).toMatch(/firstname/)
  })

  test('pagina a busca de produtos', async () => {
    const findProducts = jest.spyOn(Product, 'findAndCountAll').mockResolvedValue({ rows: [], count: 0 })
    const response = await request(app).get('/v1/product/search?limit=2&page=3')
    expect(response.status).toBe(200)
    expect(response.body).toEqual({ data: [], total: 0, limit: 2, page: 3 })
    expect(findProducts).toHaveBeenCalledWith(expect.objectContaining({ limit: 2, offset: 4 }))
  })

  test('valida parâmetros de paginação antes de consultar categorias', async () => {
    const findCategories = jest.spyOn(Category, 'findAndCountAll')
    const response = await request(app).get('/v1/category/search?limit=0')
    expect(response.status).toBe(400)
    expect(findCategories).not.toHaveBeenCalled()
  })
})
