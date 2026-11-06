const { DataTypes, Model } = require('sequelize')

module.exports = (sequelize) => {
  class ProductImage extends Model {}

  ProductImage.init(
    {
      enabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      path: { type: DataTypes.TEXT('long'), allowNull: false },
    },
    {
      sequelize,
      modelName: 'ProductImage',
      tableName: 'product_images',
      timestamps: false,
    },
  )

  return ProductImage
}
