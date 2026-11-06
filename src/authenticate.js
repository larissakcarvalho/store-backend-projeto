const jwt = require('jsonwebtoken')
const { User } = require('../models')
const AppError = require('../utils/AppError')

module.exports = async function authenticate(req, res, next) {
  const authorization = req.get('authorization')
  const parts = authorization?.trim().split(/\s+/) || []
  const [scheme, token] = parts
  if (parts.length !== 2 || scheme !== 'Bearer' || !token) {
    return next(new AppError('Token de autenticação ausente ou inválido.', 401))
  }

  let payload
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET)
  } catch {
    return next(new AppError('Token de autenticação inválido ou expirado.', 401))
  }

  try {
    const user = await User.findByPk(payload.sub)
    if (!user) return next(new AppError('Usuário do token não encontrado.', 401))
    req.user = user
    return next()
  } catch (error) {
    return next(error)
  }
}
