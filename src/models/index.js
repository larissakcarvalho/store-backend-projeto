const sequelize = require('../config/database')

const User = require('./User')(sequelize)
const Category = require('./Category')(sequelize)
const Product = require('./Product')(sequelize)
const ProductImage = require('./ProductImage')(sequelize)
const ProductOption = require('./ProductOption')(sequelize)
const ProductCategory = require('./ProductCategory')(sequelize)

Product.belongsToMany(Category, {
  through: ProductCategory,
  foreignKey: 'product_id',
  otherKey: 'category_id',
  as: 'categories',
})
Category.belongsToMany(Product, {
  through: ProductCategory,
  foreignKey: 'category_id',
  otherKey: 'product_id',
  as: 'products',
})
Product.hasMany(ProductImage, { foreignKey: 'product_id', as: 'images', onDelete: 'CASCADE' })
ProductImage.belongsTo(Product, { foreignKey: 'product_id', as: 'product' })
Product.hasMany(ProductOption, { foreignKey: 'product_id', as: 'options', onDelete: 'CASCADE' })
ProductOption.belongsTo(Product, { foreignKey: 'product_id', as: 'product' })

module.exports = { sequelize, User, Category, Product, ProductImage, ProductOption, ProductCategory }
