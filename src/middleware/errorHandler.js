module.exports = (error, req, res, next) => {
  if (res.headersSent) return next(error)

  let statusCode = error.statusCode || error.status || 500
  let message = statusCode >= 500 ? 'Erro interno do servidor.' : error.message

  if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
    statusCode = error.name === 'SequelizeUniqueConstraintError' ? 409 : 400
    message = error.errors.map((item) => item.message).join(', ')
  } else if (error.name === 'SequelizeForeignKeyConstraintError') {
    statusCode = 409
    message = 'O recurso está relacionado a outros registros e não pode ser removido.'
  } else if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    statusCode = 400
    message = 'O corpo da requisição contém JSON inválido.'
  }

  if (statusCode >= 500) console.error(error)
  return res.status(statusCode).json({ message })
}
