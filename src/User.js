const bcrypt = require('bcryptjs')
const { DataTypes, Model } = require('sequelize')

module.exports = (sequelize) => {
  class User extends Model {
    async checkPassword(password) {
      return bcrypt.compare(password, this.password)
    }

    toJSON() {
      const values = { ...this.get() }
      delete values.password
      return {
        id: values.id,
        firstname: values.firstname,
        surname: values.surname,
        email: values.email,
        created_at: values.createdAt,
        updated_at: values.updatedAt,
      }
    }
  }

  User.init(
    {
      firstname: { type: DataTypes.STRING(100), allowNull: false },
      surname: { type: DataTypes.STRING(100), allowNull: false },
      email: { type: DataTypes.STRING(255), allowNull: false, unique: true, validate: { isEmail: true } },
      password: { type: DataTypes.STRING(255), allowNull: false },
    },
    {
      sequelize,
      modelName: 'User',
      tableName: 'users',
      hooks: {
        async beforeCreate(user) {
          user.password = await bcrypt.hash(user.password, 12)
        },
        async beforeUpdate(user) {
          if (user.changed('password')) user.password = await bcrypt.hash(user.password, 12)
        },
      },
    },
  )

  return User
}
