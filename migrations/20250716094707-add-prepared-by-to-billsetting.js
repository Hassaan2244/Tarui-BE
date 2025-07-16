"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable("BillSettings");
    if (!table.preparedBy) {
      await queryInterface.addColumn("BillSettings", "preparedBy", {
        type: Sequelize.JSONB, // Use Sequelize.JSON if not using Postgres
        allowNull: false,
        defaultValue: [],
        comment: "Array of users who prepared bills",
      });
    }
  },

  async down(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable("BillSettings");
    if (table.preparedBy) {
      await queryInterface.removeColumn("BillSettings", "preparedBy");
    }
  },
};
