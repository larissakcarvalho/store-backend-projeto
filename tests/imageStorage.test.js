process.env.DB_NAME = process.env.DB_NAME || 'digital_store_test'
process.env.DB_USER = process.env.DB_USER || 'root'
process.env.DB_PASSWORD = process.env.DB_PASSWORD || ''
process.env.DB_HOST = process.env.DB_HOST || '127.0.0.1'

const request = require('supertest')
const app = require('../src/app')
const { prepareImages, removePreparedImages } = require('../src/services/imageStorage')

describe('armazenamento de imagens', () => {
  test('grava base64 validado e serve a imagem por /media', async () => {
    const prepared = await prepareImages([{
      type: 'image/png',
      content: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lfoAAAAASUVORK5CYII=',
    }])

    try {
      expect(prepared.images[0].path).toMatch(/^\/media\/[0-9a-f-]+\.png$/i)
      const response = await request(app).get(prepared.images[0].path)
      expect(response.status).toBe(200)
      expect(response.headers['content-type']).toMatch(/^image\/png/)
    } finally {
      await removePreparedImages(prepared)
    }
  })

  test('rejeita conteúdo que não corresponda ao tipo declarado', async () => {
    await expect(prepareImages([{
      type: 'image/png',
      content: Buffer.from('not an image').toString('base64'),
    }])).rejects.toThrow(/imagem PNG, JPEG, GIF ou WebP válida/)
  })
})
