"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if 'preparedBy' column already exists before adding
    const table = await queryInterface.describeTable("Transactions");
    if (!table.preparedBy) {
      await queryInterface.addColumn("Transactions", "preparedBy", {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: "admin",
      });
    }
  },

  async down(queryInterface, Sequelize) {
    // Remove 'preparedBy' column if it exists
    const table = await queryInterface.describeTable("Transactions");
    if (table.preparedBy) {
      await queryInterface.removeColumn("Transactions", "preparedBy");
    }
  },
};
