'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('product_option_values', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      option_id: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: { model: 'product_options', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      value: { allowNull: false, type: Sequelize.STRING(255) },
    })
    await queryInterface.addIndex('product_option_values', ['option_id', 'value'])

    const [options] = await queryInterface.sequelize.query(
      'SELECT id, `values` AS option_values FROM `product_options`',
    )
    const optionValues = options.flatMap((option) => {
      const values = [...new Set(String(option.option_values ?? '').split(',').map((value) => value.trim()).filter(Boolean))]
      return values.map((value) => ({ option_id: option.id, value }))
    })
    if (optionValues.length) await queryInterface.bulkInsert('product_option_values', optionValues)

  },

  async down(queryInterface) {
    await queryInterface.dropTable('product_option_values')
  },
}
