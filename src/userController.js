const jwt = require('jsonwebtoken')
const { User } = require('../models')
const AppError = require('../utils/AppError')
const asyncHandler = require('../utils/asyncHandler')

function requireText(value, field) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new AppError(`O campo ${field} é obrigatório.`)
  }
  return value.trim()
}

function parseId(value) {
  const id = Number(value)
  if (!Number.isInteger(id) || id < 1) throw new AppError('ID inválido.')
  return id
}

exports.create = asyncHandler(async (req, res) => {
  const firstname = requireText(req.body.firstname, 'firstname')
  const surname = requireText(req.body.surname, 'surname')
  const email = requireText(req.body.email, 'email').toLowerCase()
  const password = requireText(req.body.password, 'password')
  const confirmPassword = requireText(req.body.confirmPassword, 'confirmPassword')

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new AppError('E-mail inválido.')
  if (firstname.length > 100 || surname.length > 100 || email.length > 255) {
    throw new AppError('Nome ou e-mail excede o tamanho máximo permitido.')
  }
  if (password.length < 8) throw new AppError('A senha deve ter ao menos 8 caracteres.')
  if (Buffer.byteLength(password, 'utf8') > 72) throw new AppError('A senha não pode exceder 72 bytes.')
  if (password !== confirmPassword) throw new AppError('As senhas não conferem.')

  const user = await User.create({ firstname, surname, email, password })
  return res.status(201).json(user)
})

exports.createToken = asyncHandler(async (req, res) => {
  const email = requireText(req.body.email, 'email').toLowerCase()
  const password = requireText(req.body.password, 'password')
  const user = await User.findOne({ where: { email } })

  if (!user || !(await user.checkPassword(password))) {
    throw new AppError('E-mail ou senha inválidos.', 401)
  }

  const token = jwt.sign({}, process.env.JWT_SECRET, {
    subject: String(user.id),
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  })
  return res.status(200).json({ token })
})

exports.show = asyncHandler(async (req, res) => {
  const user = await User.findByPk(parseId(req.params.id))
  if (!user) throw new AppError('Usuário não encontrado.', 404)
  return res.status(200).json(user)
})

exports.update = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id)
  if (Number(req.user.id) !== id) throw new AppError('Você não pode alterar este usuário.', 403)

  const user = await User.findByPk(id)
  if (!user) throw new AppError('Usuário não encontrado.', 404)

  const fields = ['firstname', 'surname', 'email']
  const updates = {}
  for (const field of fields) {
    if (req.body[field] !== undefined) updates[field] = requireText(req.body[field], field)
  }
  if (updates.email) updates.email = updates.email.toLowerCase()
  if (!Object.keys(updates).length) throw new AppError('Informe ao menos um campo para atualizar.')
  if (
    updates.firstname?.length > 100
    || updates.surname?.length > 100
    || updates.email?.length > 255
  ) {
    throw new AppError('Nome ou e-mail excede o tamanho máximo permitido.')
  }

  await user.update(updates)
  return res.status(204).end()
})

exports.remove = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id)
  if (Number(req.user.id) !== id) throw new AppError('Você não pode remover este usuário.', 403)

  const user = await User.findByPk(id)
  if (!user) throw new AppError('Usuário não encontrado.', 404)
  await user.destroy()
  return res.status(204).end()
})
