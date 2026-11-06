const enabled = process.env.RUN_DB_TESTS === 'true'
const configuredTestDatabase = process.env.TEST_DB_NAME
  || (process.env.DB_NAME?.endsWith('_test') ? process.env.DB_NAME : 'digital_store_test')

if (enabled && !configuredTestDatabase.endsWith('_test')) {
  throw new Error('TEST_DB_NAME deve terminar com _test para proteger bancos não destinados a testes.')
}

if (enabled) process.env.DB_NAME = configuredTestDatabase
else process.env.DB_NAME = process.env.DB_NAME || 'digital_store_test'
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-with-at-least-32-characters'

const request = require('supertest')
const app = require('../src/app')
const {
  sequelize,
  User,
  Category,
  Product,
} = require('../src/models')
const { removeStoredImages } = require('../src/services/imageStorage')

const integration = enabled ? describe : describe.skip

integration('CRUD com persistência MySQL', () => {
  const suffix = `${Date.now()}`
  const userEmail = `integration-${suffix}@example.test`
  const categorySlug = `integration-category-${suffix}`
  const productSlug = `integration-product-${suffix}`
  const unmatchedProductSlug = `integration-unmatched-${suffix}`
  const storedImagePaths = []
  let token
  let connected = false

  beforeAll(async () => {
    await sequelize.authenticate()
    connected = true
  })

  afterAll(async () => {
    await removeStoredImages(storedImagePaths)
    if (connected) {
      await Product.destroy({
        where: { slug: [productSlug, unmatchedProductSlug] },
      })
      await Category.destroy({ where: { slug: categorySlug } })
      await User.destroy({ where: { email: userEmail } })
      await sequelize.close()
    }
  })

  test('persiste cadastro, autenticação e CRUD de usuário, categoria e produto', async () => {
    const registration = await request(app).post('/v1/user').send({
      firstname: 'Integration',
      surname: 'Test',
      email: userEmail,
      password: 'integration-password-123',
      confirmPassword: 'integration-password-123',
    })
    expect(registration.status).toBe(201)
    expect(registration.body.password).toBeUndefined()

    const login = await request(app).post('/v1/user/token').send({
      email: userEmail,
      password: 'integration-password-123',
    })
    expect(login.status).toBe(200)
    token = login.body.token

    const userUpdate = await request(app)
      .put(`/v1/user/${registration.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ firstname: 'Updated' })
    expect(userUpdate.status).toBe(204)
    const updatedUser = await request(app).get(`/v1/user/${registration.body.id}`)
    expect(updatedUser.body.firstname).toBe('Updated')

    const categoryCreate = await request(app)
      .post('/v1/category')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Integration Category', slug: categorySlug })
    expect(categoryCreate.status).toBe(201)

    const categoryUpdate = await request(app)
      .put(`/v1/category/${categoryCreate.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Updated Integration Category' })
    expect(categoryUpdate.status).toBe(204)
    const updatedCategory = await request(app).get(`/v1/category/${categoryCreate.body.id}`)
    expect(updatedCategory.body.name).toBe('Updated Integration Category')

    const productCreate = await request(app)
      .post('/v1/product')
      .set('Authorization', `Bearer ${token}`)
      .send({
        enabled: true,
        name: 'Integration Product',
        slug: productSlug,
        price: 42.5,
        category_ids: [categoryCreate.body.id],
        images: [{
          type: 'image/png',
          content: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lfoAAAAASUVORK5CYII=',
        }],
        options: [
          { title: 'Tamanho', values: ['P', 'M'] },
          { title: 'Cor', values: ['Azul', 'Verde'] },
        ],
      })
    expect(productCreate.status).toBe(201)
    storedImagePaths.push(...productCreate.body.images.map((image) => image.content))
    expect(productCreate.body.images[0].content).toMatch(/^\/media\/[0-9a-f-]+\.png$/i)
    const storedImage = await request(app).get(productCreate.body.images[0].content)
    expect(storedImage.status).toBe(200)
    expect(storedImage.headers['content-type']).toMatch(/^image\/png/)
    expect(productCreate.body.options.map((option) => option.values)).toEqual([
      ['P', 'M'],
      ['Azul', 'Verde'],
    ])

    const unmatchedProduct = await request(app)
      .post('/v1/product')
      .set('Authorization', `Bearer ${token}`)
      .send({
        enabled: true,
        name: 'Integration Unmatched Product',
        slug: unmatchedProductSlug,
        price: 19.9,
        category_ids: [categoryCreate.body.id],
        options: [{ title: 'Tamanho', values: ['P'] }],
      })
    expect(unmatchedProduct.status).toBe(201)

    const [sizeOption, colorOption] = productCreate.body.options
    const optionSearch = await request(app).get(
      `/v1/product/search?option%5B${sizeOption.id}%5D=P&option%5B${colorOption.id}%5D=Azul`,
    )
    expect(optionSearch.status).toBe(200)
    expect(optionSearch.body.data.map((product) => product.slug)).toEqual([productSlug])

    const productUpdate = await request(app)
      .put(`/v1/product/${productCreate.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Updated Integration Product',
        options: [{ id: sizeOption.id, values: ['G'] }],
      })
    expect(productUpdate.status).toBe(204)
    const updatedProduct = await request(app).get(`/v1/product/${productCreate.body.id}`)
    expect(updatedProduct.body.name).toBe('Updated Integration Product')
    expect(updatedProduct.body.options.find((option) => option.id === sizeOption.id).values).toEqual(['G'])

    const restrictedCategoryDelete = await request(app)
      .delete(`/v1/category/${categoryCreate.body.id}`)
      .set('Authorization', `Bearer ${token}`)
    expect(restrictedCategoryDelete.status).toBe(409)

    const productDelete = await request(app)
      .delete(`/v1/product/${productCreate.body.id}`)
      .set('Authorization', `Bearer ${token}`)
    expect(productDelete.status).toBe(204)
    const missingProduct = await request(app).get(`/v1/product/${productCreate.body.id}`)
    expect(missingProduct.status).toBe(404)

    const unmatchedDelete = await request(app)
      .delete(`/v1/product/${unmatchedProduct.body.id}`)
      .set('Authorization', `Bearer ${token}`)
    expect(unmatchedDelete.status).toBe(204)

    const categoryDelete = await request(app)
      .delete(`/v1/category/${categoryCreate.body.id}`)
      .set('Authorization', `Bearer ${token}`)
    expect(categoryDelete.status).toBe(204)
    const missingCategory = await request(app).get(`/v1/category/${categoryCreate.body.id}`)
    expect(missingCategory.status).toBe(404)

    const userDelete = await request(app)
      .delete(`/v1/user/${registration.body.id}`)
      .set('Authorization', `Bearer ${token}`)
    expect(userDelete.status).toBe(204)
    const missingUser = await request(app).get(`/v1/user/${registration.body.id}`)
    expect(missingUser.status).toBe(404)
  })
})
