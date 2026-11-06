'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      firstname: { allowNull: false, type: Sequelize.STRING(100) },
      surname: { allowNull: false, type: Sequelize.STRING(100) },
      email: { allowNull: false, unique: true, type: Sequelize.STRING(255) },
      password: { allowNull: false, type: Sequelize.STRING(255) },
      created_at: { allowNull: false, type: Sequelize.DATE },
      updated_at: { allowNull: false, type: Sequelize.DATE },
    })

    await queryInterface.createTable('categories', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      name: { allowNull: false, unique: true, type: Sequelize.STRING(100) },
      slug: { allowNull: false, unique: true, type: Sequelize.STRING(120) },
      use_in_menu: { allowNull: false, defaultValue: false, type: Sequelize.BOOLEAN },
      created_at: { allowNull: false, type: Sequelize.DATE },
      updated_at: { allowNull: false, type: Sequelize.DATE },
    })

    await queryInterface.createTable('products', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      enabled: { allowNull: false, defaultValue: false, type: Sequelize.BOOLEAN },
      name: { allowNull: false, type: Sequelize.STRING(160) },
      slug: { allowNull: false, unique: true, type: Sequelize.STRING(180) },
      use_in_menu: { allowNull: false, defaultValue: false, type: Sequelize.BOOLEAN },
      stock: { allowNull: false, defaultValue: 0, type: Sequelize.INTEGER },
      description: { allowNull: true, type: Sequelize.TEXT },
      price: { allowNull: false, type: Sequelize.DECIMAL(10, 2) },
      price_with_discount: { allowNull: false, defaultValue: 0, type: Sequelize.DECIMAL(10, 2) },
      created_at: { allowNull: false, type: Sequelize.DATE },
      updated_at: { allowNull: false, type: Sequelize.DATE },
    })

    await queryInterface.createTable('product_images', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      product_id: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: { model: 'products', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      enabled: { allowNull: false, defaultValue: true, type: Sequelize.BOOLEAN },
      path: { allowNull: false, type: Sequelize.TEXT('long') },
    })

    await queryInterface.createTable('product_options', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      product_id: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: { model: 'products', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      title: { allowNull: false, type: Sequelize.STRING(100) },
      shape: { allowNull: false, defaultValue: 'square', type: Sequelize.ENUM('square', 'circle') },
      radius: { allowNull: false, defaultValue: 0, type: Sequelize.INTEGER },
      type: { allowNull: false, defaultValue: 'text', type: Sequelize.ENUM('text', 'color') },
      values: { allowNull: false, type: Sequelize.TEXT },
    })

    await queryInterface.createTable('product_categories', {
      product_id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.INTEGER,
        references: { model: 'products', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      category_id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.INTEGER,
        references: { model: 'categories', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
    })
  },

  async down(queryInterface) {
    await queryInterface.dropTable('product_categories')
    await queryInterface.dropTable('product_options')
    await queryInterface.dropTable('product_images')
    await queryInterface.dropTable('products')
    await queryInterface.dropTable('categories')
    await queryInterface.dropTable('users')
  },
}
