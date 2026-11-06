const { Op } = require('sequelize')
const {
  Category,
  Product,
  ProductImage,
  ProductOption,
  ProductOptionValue,
  sequelize,
} = require('../models')
const AppError = require('../utils/AppError')
const asyncHandler = require('../utils/asyncHandler')
const { parsePagination } = require('../utils/pagination')
const { prepareImages, removePreparedImages } = require('../services/imageStorage')

const productFields = [
  'id', 'enabled', 'name', 'slug', 'use_in_menu', 'stock', 'description',
  'price', 'price_with_discount', 'created_at', 'updated_at',
]
const associations = [
  { model: Category, as: 'categories', through: { attributes: [] } },
  { model: ProductImage, as: 'images' },
  {
    model: ProductOption,
    as: 'options',
    include: [{
      model: ProductOptionValue,
      as: 'optionValues',
      attributes: ['value'],
      separate: true,
      order: [['id', 'ASC']],
    }],
  },
]

function parseId(value) {
  const id = Number(value)
  if (!Number.isInteger(id) || id < 1) throw new AppError('ID inválido.')
  return id
}

function parseReferenceId(value, field) {
  if (
    !['number', 'string'].includes(typeof value)
    || String(value).trim() === ''
    || !Number.isInteger(Number(value))
    || Number(value) < 1
  ) {
    throw new AppError(`O ID informado em ${field} é inválido.`)
  }
  return Number(value)
}

function parseNonNegativeNumber(value, field) {
  if (
    !['number', 'string'].includes(typeof value)
    || String(value).trim() === ''
    || !Number.isFinite(Number(value))
    || Number(value) < 0
  ) {
    throw new AppError(`O campo ${field} deve ser um número não negativo.`)
  }
  return Number(value)
}

function parseIds(value, field) {
  if (!Array.isArray(value)) {
    throw new AppError(`O campo ${field} deve ser uma lista de IDs válidos.`)
  }
  return [...new Set(value.map((id) => parseReferenceId(id, field)))]
}

function parseRadius(radius) {
  if (radius === undefined) return 0
  if (!['number', 'string'].includes(typeof radius) || String(radius).trim() === '') {
    throw new AppError('O radius deve ser um inteiro não negativo.')
  }
  const parsed = Number(String(radius).replace(/px$/i, ''))
  if (!Number.isInteger(parsed) || parsed < 0) throw new AppError('O radius deve ser um inteiro não negativo.')
  return parsed
}

function normalizeOptions(options, partial = false) {
  if (options === undefined) return undefined
  if (!Array.isArray(options)) throw new AppError('O campo options deve ser uma lista.')

  return options.map((option) => {
    if (option?.deleted === true) {
      return { id: parseReferenceId(option.id, 'options'), deleted: true }
    }
    if (partial && option?.id !== undefined) {
      const updates = { id: parseReferenceId(option.id, 'options'), deleted: false }
      if (option.title !== undefined) {
        if (typeof option.title !== 'string' || !option.title.trim()) throw new AppError('O título da opção não pode ser vazio.')
        if (option.title.trim().length > 100) throw new AppError('O título da opção excede 100 caracteres.')
        updates.title = option.title.trim()
      }
      if (option.shape !== undefined) {
        if (!['square', 'circle'].includes(option.shape)) throw new AppError('Formato de opção inválido.')
        updates.shape = option.shape
      }
      if (option.radius !== undefined) updates.radius = parseRadius(option.radius)
      if (option.type !== undefined) {
        if (!['text', 'color'].includes(option.type)) throw new AppError('Tipo de opção inválido.')
        updates.type = option.type
      }
      const values = option.values ?? option.value
      if (values !== undefined) {
        if (!Array.isArray(values) || !values.length || values.some((value) => typeof value !== 'string' || !value.trim())) {
          throw new AppError('Os valores da opção devem ser uma lista de textos.')
        }
        if (values.some((value) => value.trim().length > 255)) {
          throw new AppError('Cada valor da opção deve ter no máximo 255 caracteres.')
        }
        updates.values = [...new Set(values.map((value) => value.trim()))]
      }
      if (Object.keys(updates).length === 2) throw new AppError('Informe campos para atualizar a opção.')
      return updates
    }
    if (!option || typeof option.title !== 'string' || !option.title.trim()) {
      throw new AppError('Cada opção precisa informar um título.')
    }
    if (option.title.trim().length > 100) throw new AppError('O título da opção excede 100 caracteres.')
    const values = option.values ?? option.value
    if (!Array.isArray(values) || !values.length || values.some((value) => typeof value !== 'string' || !value.trim())) {
      throw new AppError(`A opção ${option.title} precisa conter uma lista de valores.`)
    }
    if (values.some((value) => value.trim().length > 255)) {
      throw new AppError('Cada valor da opção deve ter no máximo 255 caracteres.')
    }
    const shape = option.shape || 'square'
    const type = option.type || 'text'
    if (!['square', 'circle'].includes(shape) || !['text', 'color'].includes(type)) {
      throw new AppError('Formato ou tipo de opção inválido.')
    }
    return {
      id: option.id,
      deleted: option.deleted === true,
      title: option.title.trim(),
      shape,
      radius: parseRadius(option.radius),
      type,
      values: [...new Set(values.map((value) => value.trim()))],
    }
  })
}

function normalizeImages(images) {
  if (images === undefined) return undefined
  if (!Array.isArray(images)) throw new AppError('O campo images deve ser uma lista.')
  return images.map((image) => {
    if (!image || typeof image !== 'object') throw new AppError('Cada imagem deve ser um objeto válido.')
    if (image.deleted === true) {
      return { id: parseReferenceId(image.id, 'images'), deleted: true }
    }
    if (image.id !== undefined && image.content === undefined) {
      const id = parseReferenceId(image.id, 'images')
      return { id, deleted: false }
    }
    if (typeof image.content !== 'string' || !image.content.trim()) {
      throw new AppError('Cada imagem precisa informar o campo content.')
    }
    if (image.type !== undefined && typeof image.type !== 'string') {
      throw new AppError('O tipo da imagem deve ser um texto.')
    }
    return {
      id: image.id,
      deleted: false,
      content: image.content.trim(),
      type: image.type,
    }
  })
}

function validateProduct(body, partial = false) {
  const values = {}
  const required = ['name', 'slug', 'price']
  for (const field of required) {
    if (body[field] === undefined && partial) continue
    if (field === 'price') {
      values.price = parseNonNegativeNumber(body.price, field)
    } else {
      if (typeof body[field] !== 'string' || !body[field].trim()) {
        throw new AppError(`O campo ${field} é obrigatório.`)
      }
      values[field] = body[field].trim()
    }
  }
  if (values.name?.length > 160 || values.slug?.length > 180) {
    throw new AppError('Nome ou slug excede o tamanho máximo permitido.')
  }

  for (const field of ['enabled', 'use_in_menu']) {
    if (body[field] !== undefined) {
      if (typeof body[field] !== 'boolean') throw new AppError(`O campo ${field} deve ser booleano.`)
      values[field] = body[field]
    } else if (!partial && field === 'enabled') {
      values.enabled = false
    }
  }

  if (body.stock !== undefined) {
    if (
      !['number', 'string'].includes(typeof body.stock)
      || String(body.stock).trim() === ''
      || !Number.isInteger(Number(body.stock))
      || Number(body.stock) < 0
    ) {
      throw new AppError('O campo stock deve ser um inteiro não negativo.')
    }
    values.stock = Number(body.stock)
  } else if (!partial) {
    values.stock = 0
  }

  if (body.description !== undefined) {
    if (typeof body.description !== 'string') throw new AppError('O campo description deve ser texto.')
    values.description = body.description
  } else if (!partial) {
    values.description = null
  }

  if (body.price_with_discount !== undefined) {
    values.price_with_discount = parseNonNegativeNumber(body.price_with_discount, 'price_with_discount')
  } else if (!partial) {
    values.price_with_discount = 0
  }

  if (body.category_ids !== undefined) values.category_ids = parseIds(body.category_ids, 'category_ids')
  else if (!partial) values.category_ids = []
  values.images = normalizeImages(body.images)
  values.options = normalizeOptions(body.options, partial)
  return values
}

function serializeOption(option) {
  return {
    id: option.id,
    title: option.title,
    shape: option.shape,
    radius: option.radius,
    type: option.type,
    values: (option.optionValues || []).map((item) => item.value),
  }
}

function serializeProduct(product, fields) {
  const data = product.toJSON()
  const result = {
    id: data.id,
    enabled: data.enabled,
    name: data.name,
    slug: data.slug,
    use_in_menu: data.use_in_menu,
    stock: data.stock,
    description: data.description,
    price: Number(data.price),
    price_with_discount: Number(data.price_with_discount),
    category_ids: (data.categories || []).map((category) => category.id),
    images: (data.images || []).filter((image) => image.enabled).map((image) => ({
      id: image.id,
      content: image.path,
    })),
    options: (data.options || []).map(serializeOption),
    created_at: data.createdAt,
    updated_at: data.updatedAt,
  }
  if (!fields) return result
  const allowed = new Set([...productFields, 'category_ids', 'images', 'options'])
  const invalid = fields.find((field) => !allowed.has(field))
  if (invalid) throw new AppError(`Campo inválido no parâmetro fields: ${invalid}.`)
  return Object.fromEntries(fields.map((field) => [field, result[field]]))
}

async function syncChildren(model, productId, items, transaction, fields) {
  if (!items) return
  const current = await model.findAll({ where: { product_id: productId }, transaction })
  const currentById = new Map(current.map((item) => [item.id, item]))

  for (const item of items) {
    if (item.id !== undefined) {
      const existing = currentById.get(Number(item.id))
      if (!existing) throw new AppError('Uma imagem ou opção informada não pertence a este produto.')
      currentById.delete(Number(item.id))
      if (item.deleted) await existing.destroy({ transaction })
      else if (Object.keys(fields(item)).length) await existing.update(fields(item), { transaction })
    } else if (!item.deleted) {
      await model.create({ product_id: productId, ...fields(item) }, { transaction })
    }
  }
}

async function syncOptions(productId, options, transaction) {
  if (!options) return
  const current = await ProductOption.findAll({ where: { product_id: productId }, transaction })
  const currentById = new Map(current.map((option) => [option.id, option]))

  for (const option of options) {
    const { values, id, deleted, ...attributes } = option
    if (id !== undefined) {
      const existing = currentById.get(Number(id))
      if (!existing) throw new AppError('Uma imagem ou opção informada não pertence a este produto.')
      currentById.delete(Number(id))
      if (deleted) {
        await existing.destroy({ transaction })
      } else {
        const updates = { ...attributes }
        if (values !== undefined) {
          updates.values = values.join(',')
        }
        if (Object.keys(updates).length) await existing.update(updates, { transaction })
        if (values !== undefined) {
          await ProductOptionValue.destroy({ where: { option_id: existing.id }, transaction })
          await ProductOptionValue.bulkCreate(
            values.map((value) => ({ option_id: existing.id, value })),
            { transaction },
          )
        }
      }
    } else if (!deleted) {
      const created = await ProductOption.create(
        { product_id: productId, ...attributes, values: values.join(',') },
        { transaction },
      )
      await ProductOptionValue.bulkCreate(
        values.map((value) => ({ option_id: created.id, value })),
        { transaction },
      )
    }
  }
}

exports.search = asyncHandler(async (req, res) => {
  const { limit, page, offset } = parsePagination(req.query)
  const where = { enabled: true }
  const include = associations.map((association) => ({ ...association }))

  if (req.query.match !== undefined) {
    const match = String(req.query.match).trim()
    if (!match) throw new AppError('O parâmetro match não pode estar vazio.')
    where[Op.or] = [
      { name: { [Op.like]: `%${match}%` } },
      { description: { [Op.like]: `%${match}%` } },
    ]
  }

  if (req.query['price-range'] !== undefined) {
    const range = String(req.query['price-range']).match(/^(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)$/)
    if (!range || Number(range[1]) > Number(range[2])) throw new AppError('O parâmetro price-range deve ter o formato mínimo-máximo.')
    where.price = { [Op.between]: [Number(range[1]), Number(range[2])] }
  }

  if (req.query.category_ids !== undefined) {
    const categoryIds = parseIds(String(req.query.category_ids).split(','), 'category_ids')
    include[0].where = { id: { [Op.in]: categoryIds } }
    include[0].required = true
  }

  const optionFilterEntries = Object.entries(req.query).flatMap(([key, rawValues]) => {
    const literalMatch = key.match(/^option\[(\d+)\]$/)
    if (literalMatch) return [[literalMatch[1], rawValues]]
    if (key === 'option' && Array.isArray(rawValues)) {
      return rawValues.flatMap((value, index) => (
        value === undefined ? [] : [[String(index), value]]
      ))
    }
    if (key === 'option' && rawValues && typeof rawValues === 'object' && !Array.isArray(rawValues)) {
      return Object.entries(rawValues)
    }
    return []
  })
  const optionFilters = optionFilterEntries.map(([rawId, rawValues]) => {
      const optionId = parseReferenceId(rawId, 'option')
      const candidates = Array.isArray(rawValues) ? rawValues : [rawValues]
      const values = [...new Set(candidates.flatMap((candidate) => {
        if (typeof candidate !== 'string') throw new AppError('Os filtros de opção devem conter textos.')
        return candidate.split(',').map((value) => value.trim()).filter(Boolean)
      }))]
      if (!values.length) throw new AppError('Informe pelo menos um valor para filtrar a opção.')
      if (values.some((value) => value.length > 255)) {
        throw new AppError('Cada valor do filtro de opção deve ter no máximo 255 caracteres.')
      }
      return { optionId, values }
    })
  if (optionFilters.length) {
    where[Op.and] = optionFilters.map(({ optionId, values }) => {
      const escapedValues = values.map((value) => sequelize.escape(value)).join(', ')
      const productIds = sequelize.literal(
        `(SELECT po.product_id FROM product_options AS po `
        + 'INNER JOIN product_option_values AS pov ON pov.option_id = po.id '
        + `WHERE po.id = ${optionId} AND pov.value IN (${escapedValues}))`,
      )
      return sequelize.where(sequelize.col('Product.id'), { [Op.in]: productIds })
    })
  }

  const fields = req.query.fields
    ? String(req.query.fields).split(',').map((field) => field.trim())
    : undefined
  const allowedFields = new Set([...productFields, 'category_ids', 'images', 'options'])
  const invalidField = fields?.find((field) => !allowedFields.has(field))
  if (invalidField) throw new AppError(`Campo inválido no parâmetro fields: ${invalidField}.`)
  const result = await Product.findAndCountAll({
    where,
    include,
    distinct: true,
    limit: limit === -1 ? undefined : limit,
    offset,
    order: [['id', 'ASC']],
  })
  return res.status(200).json({
    data: result.rows.map((product) => serializeProduct(product, fields)),
    total: result.count,
    limit,
    page,
  })
})

exports.show = asyncHandler(async (req, res) => {
  const product = await Product.findOne({
    where: { id: parseId(req.params.id), enabled: true },
    include: associations,
  })
  if (!product) throw new AppError('Produto não encontrado.', 404)
  return res.status(200).json(serializeProduct(product))
})

exports.create = asyncHandler(async (req, res) => {
  const values = validateProduct(req.body)
  let preparedImages = { images: values.images, createdFiles: [] }
  const transaction = await sequelize.transaction()
  try {
    preparedImages = await prepareImages(values.images)
    values.images = preparedImages.images
    const { category_ids: categoryIds, images, options, ...attributes } = values
    const product = await Product.create(attributes, { transaction })
    if (categoryIds.length) {
      const categories = await Category.findAll({ where: { id: categoryIds }, transaction })
      if (categories.length !== categoryIds.length) throw new AppError('Uma ou mais categorias não existem.')
      await product.setCategories(categories, { transaction })
    }
    await syncChildren(ProductImage, product.id, images, transaction, (image) => ({ path: image.path, enabled: true }))
    await syncOptions(product.id, options, transaction)
    const created = await Product.findByPk(product.id, { include: associations, transaction })
    const response = serializeProduct(created)
    await transaction.commit()
    return res.status(201).json(response)
  } catch (error) {
    await transaction.rollback()
    try {
      await removePreparedImages(preparedImages)
    } catch (cleanupError) {
      console.error('Não foi possível remover imagens após falha ao criar produto:', cleanupError)
    }
    throw error
  }
})

exports.update = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id)
  const values = validateProduct(req.body, true)
  const { category_ids: categoryIdUpdates, images: imageUpdates, options: optionUpdates, ...attributeUpdates } = values
  if (
    !Object.keys(attributeUpdates).length
    && categoryIdUpdates === undefined
    && imageUpdates === undefined
    && optionUpdates === undefined
  ) {
    throw new AppError('Informe ao menos um campo para atualizar.')
  }
  let preparedImages = { images: values.images, createdFiles: [] }
  const transaction = await sequelize.transaction()
  try {
    preparedImages = await prepareImages(values.images)
    values.images = preparedImages.images
    const product = await Product.findByPk(id, { transaction })
    if (!product) throw new AppError('Produto não encontrado.', 404)
    const { category_ids: categoryIds, images, options, ...attributes } = values
    if (Object.keys(attributes).length) await product.update(attributes, { transaction })
    if (categoryIds !== undefined) {
      const categories = await Category.findAll({ where: { id: categoryIds }, transaction })
      if (categories.length !== categoryIds.length) throw new AppError('Uma ou mais categorias não existem.')
      await product.setCategories(categories, { transaction })
    }
    await syncChildren(ProductImage, id, images, transaction, (image) => ({
      ...(image.path !== undefined ? { path: image.path } : {}),
      ...(image.path !== undefined ? { enabled: true } : {}),
    }))
    await syncOptions(id, options, transaction)
    await transaction.commit()
    return res.status(204).end()
  } catch (error) {
    await transaction.rollback()
    try {
      await removePreparedImages(preparedImages)
    } catch (cleanupError) {
      console.error('Não foi possível remover imagens após falha ao atualizar produto:', cleanupError)
    }
    throw error
  }
})

exports.remove = asyncHandler(async (req, res) => {
  const product = await Product.findByPk(parseId(req.params.id))
  if (!product) throw new AppError('Produto não encontrado.', 404)
  await product.destroy()
  return res.status(204).end()
})
