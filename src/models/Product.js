const { DataTypes, Model } = require('sequelize')

module.exports = (sequelize) => {
  class Product extends Model {}

  Product.init(
    {
      enabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      name: { type: DataTypes.STRING(160), allowNull: false },
      slug: { type: DataTypes.STRING(180), allowNull: false, unique: true },
      use_in_menu: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      stock: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, validate: { min: 0 } },
      description: { type: DataTypes.TEXT, allowNull: true },
      price: { type: DataTypes.DECIMAL(10, 2), allowNull: false, validate: { min: 0 } },
      price_with_discount: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0, validate: { min: 0 } },
    },
    { sequelize, modelName: 'Product', tableName: 'products' },
  )

  return Product
}
