require('dotenv').config()

const express = require('express')
const cors = require('cors')
const swaggerUi = require('swagger-ui-express')
const AppError = require('./utils/AppError')
const users = require('./routes/users')
const categories = require('./routes/categories')
const products = require('./routes/products')
const openapi = require('./docs/openapi')
const errorHandler = require('./middleware/errorHandler')

const app = express()
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true)
    return callback(new AppError('Origem não autorizada pelo CORS.', 403))
  },
}))
app.use(express.json({ limit: '2mb' }))
app.use((req, res, next) => {
  if (
    ['POST', 'PUT', 'PATCH'].includes(req.method)
    && (!req.body || typeof req.body !== 'object' || Array.isArray(req.body))
  ) {
    return next(new AppError('O corpo da requisição deve ser um objeto JSON.'))
  }
  return next()
})

app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }))
app.get('/api-docs.json', (req, res) => res.status(200).json(openapi))
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapi))
app.use('/v1/user', users)
app.use('/v1/category', categories)
app.use('/v1/product', products)

app.use((req, res, next) => {
  next(new AppError('Rota não encontrada.', 404))
})
app.use(errorHandler)

module.exports = app
