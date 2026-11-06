const { DataTypes, Model } = require('sequelize')

module.exports = (sequelize) => {
  class ProductOptionValue extends Model {}

  ProductOptionValue.init(
    {
      value: { type: DataTypes.STRING(255), allowNull: false },
    },
    {
      sequelize,
      modelName: 'ProductOptionValue',
      tableName: 'product_option_values',
      timestamps: false,
    },
  )

  return ProductOptionValue
}
