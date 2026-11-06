const sequelize = require('../config/database')

const User = require('./User')(sequelize)
const Category = require('./Category')(sequelize)
const Product = require('./Product')(sequelize)
const ProductImage = require('./ProductImage')(sequelize)
const ProductOption = require('./ProductOption')(sequelize)
const ProductOptionValue = require('./ProductOptionValue')(sequelize)
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
ProductOption.hasMany(ProductOptionValue, { foreignKey: 'option_id', as: 'optionValues', onDelete: 'CASCADE' })
ProductOptionValue.belongsTo(ProductOption, { foreignKey: 'option_id', as: 'option' })

module.exports = {
  sequelize,
  User,
  Category,
  Product,
  ProductImage,
  ProductOption,
  ProductOptionValue,
  ProductCategory,
}
