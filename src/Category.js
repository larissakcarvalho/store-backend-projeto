const { DataTypes, Model } = require('sequelize')

module.exports = (sequelize) => {
  class Category extends Model {
    toJSON() {
      const values = this.get()
      return {
        id: values.id,
        name: values.name,
        slug: values.slug,
        use_in_menu: values.use_in_menu,
        created_at: values.createdAt,
        updated_at: values.updatedAt,
      }
    }
  }

  Category.init(
    {
      name: { type: DataTypes.STRING(100), allowNull: false, unique: true },
      slug: { type: DataTypes.STRING(120), allowNull: false, unique: true },
      use_in_menu: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    },
    { sequelize, modelName: 'Category', tableName: 'categories' },
  )

  return Category
}
