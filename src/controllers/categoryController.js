const { Category } = require('../models')
const AppError = require('../utils/AppError')
const asyncHandler = require('../utils/asyncHandler')
const { parsePagination } = require('../utils/pagination')

const allowedFields = new Set(['id', 'name', 'slug', 'use_in_menu'])

function parseId(value) {
  const id = Number(value)
  if (!Number.isInteger(id) || id < 1) throw new AppError('ID inválido.')
  return id
}

function validateCategory(body, partial = false) {
  const values = {}
  for (const field of ['name', 'slug']) {
    if (body[field] === undefined && partial) continue
    if (typeof body[field] !== 'string' || !body[field].trim()) {
      throw new AppError(`O campo ${field} é obrigatório.`)
    }
    values[field] = body[field].trim()
  }
  if (values.name?.length > 100 || values.slug?.length > 120) {
    throw new AppError('Nome ou slug excede o tamanho máximo permitido.')
  }

  if (body.use_in_menu !== undefined) {
    if (typeof body.use_in_menu !== 'boolean') throw new AppError('O campo use_in_menu deve ser booleano.')
    values.use_in_menu = body.use_in_menu
  } else if (!partial) {
    values.use_in_menu = false
  }
  return values
}

exports.search = asyncHandler(async (req, res) => {
  const { limit, page, offset } = parsePagination(req.query)
  const attributes = req.query.fields
    ? req.query.fields.split(',').map((field) => field.trim())
    : undefined

  if (attributes?.some((field) => !allowedFields.has(field))) {
    throw new AppError('O parâmetro fields contém campos inválidos.')
  }

  const where = {}
  if (req.query.use_in_menu !== undefined) {
    if (!['true', 'false'].includes(req.query.use_in_menu)) {
      throw new AppError('O parâmetro use_in_menu deve ser true ou false.')
    }
    where.use_in_menu = req.query.use_in_menu === 'true'
  }

  const result = await Category.findAndCountAll({
    where,
    attributes,
    limit: limit === -1 ? undefined : limit,
    offset,
    order: [['id', 'ASC']],
  })
  return res.status(200).json({ data: result.rows, total: result.count, limit, page })
})

exports.show = asyncHandler(async (req, res) => {
  const category = await Category.findByPk(parseId(req.params.id))
  if (!category) throw new AppError('Categoria não encontrada.', 404)
  return res.status(200).json(category)
})

exports.create = asyncHandler(async (req, res) => {
  const category = await Category.create(validateCategory(req.body))
  return res.status(201).json(category)
})

exports.update = asyncHandler(async (req, res) => {
  const category = await Category.findByPk(parseId(req.params.id))
  if (!category) throw new AppError('Categoria não encontrada.', 404)
  const updates = validateCategory(req.body, true)
  if (!Object.keys(updates).length) throw new AppError('Informe ao menos um campo para atualizar.')
  await category.update(updates)
  return res.status(204).end()
})

exports.remove = asyncHandler(async (req, res) => {
  const category = await Category.findByPk(parseId(req.params.id))
  if (!category) throw new AppError('Categoria não encontrada.', 404)
  await category.destroy()
  return res.status(204).end()
})
