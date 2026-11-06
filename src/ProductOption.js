const { DataTypes, Model } = require('sequelize')

module.exports = (sequelize) => {
  class ProductOption extends Model {}

  ProductOption.init(
    {
      title: { type: DataTypes.STRING(100), allowNull: false },
      shape: { type: DataTypes.ENUM('square', 'circle'), allowNull: false, defaultValue: 'square' },
      radius: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      type: { type: DataTypes.ENUM('text', 'color'), allowNull: false, defaultValue: 'text' },
      values: { type: DataTypes.TEXT, allowNull: false },
    },
    {
      sequelize,
      modelName: 'ProductOption',
      tableName: 'product_options',
      timestamps: false,
    },
  )

  return ProductOption
}
