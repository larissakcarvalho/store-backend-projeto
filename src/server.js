require('dotenv').config()

const app = require('./app')
const { sequelize } = require('./models')

const port = Number(process.env.PORT || 3000)

async function start() {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET deve estar definido e conter pelo menos 32 caracteres.')
  }
  await sequelize.authenticate()
  const server = app.listen(port, () => {
    console.log(`Digital Store API disponível em http://localhost:${port}`)
  })

  const shutdown = async () => {
    server.close(async () => {
      await sequelize.close()
      process.exit(0)
    })
  }
  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
}

start().catch((error) => {
  console.error('Não foi possível iniciar a API:', error.message)
  process.exitCode = 1
})
