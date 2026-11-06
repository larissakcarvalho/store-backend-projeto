const { DataTypes, Model } = require('sequelize')

module.exports = (sequelize) => {
  class ProductCategory extends Model {}

  ProductCategory.init(
    {
      product_id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true },
      category_id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true },
    },
    {
      sequelize,
      modelName: 'ProductCategory',
      tableName: 'product_categories',
      timestamps: false,
    },
  )

  return ProductCategory
}
