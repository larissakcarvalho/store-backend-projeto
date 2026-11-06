const AppError = require('./AppError')

function parsePagination(query, defaultLimit = 12) {
  const limit = query.limit === undefined ? defaultLimit : Number(query.limit)
  const page = query.page === undefined ? 1 : Number(query.page)

  if (!Number.isInteger(limit) || (limit < 1 && limit !== -1)) {
    throw new AppError('O parâmetro limit deve ser um inteiro positivo ou -1.')
  }
  if (!Number.isInteger(page) || page < 1) {
    throw new AppError('O parâmetro page deve ser um inteiro positivo.')
  }

  return {
    limit,
    page,
    offset: limit === -1 ? undefined : (page - 1) * limit,
  }
}

module.exports = { parsePagination }
