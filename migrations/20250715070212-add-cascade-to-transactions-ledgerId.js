"use strict";

/**
 * Adds ON DELETE CASCADE to the ledgerId foreign key in Transactions table.
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    const dialect = queryInterface.sequelize.getDialect();
    const fkName = "transactions_ledgerId_fkey_cascade";
    let fkExists = false;

    if (dialect === "postgres") {
      const [fks] = await queryInterface.sequelize.query(`
        SELECT constraint_name
        FROM information_schema.table_constraints
        WHERE table_name = 'Transactions'
        AND constraint_type = 'FOREIGN KEY'
      `);
      fkExists = fks.some((row) => row.constraint_name === fkName);
    } else if (dialect === "mysql" || dialect === "mariadb") {
      const [fks] = await queryInterface.sequelize.query(
        `
        SELECT CONSTRAINT_NAME
        FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
        WHERE TABLE_NAME = 'Transactions'
          AND CONSTRAINT_NAME = :fk
        `,
        { replacements: { fk: fkName } }
      );
      fkExists = fks.length > 0;
    } else if (dialect === "sqlite") {
      const [pragma] = await queryInterface.sequelize.query(
        `PRAGMA foreign_key_list(Transactions);`
      );
      fkExists = pragma?.some((row) => row.id === fkName);
    }

    if (fkExists) {
      console.log(`✔ FK ${fkName} already exists – skipping`);
      return;
    }

    // Remove existing foreign key constraint (if any)
    try {
      await queryInterface.removeConstraint("Transactions", "ledgerId");
    } catch (err) {
      // Ignore if no constraint existed
    }

    // Add new foreign key constraint with CASCADE
    await queryInterface.addConstraint("Transactions", {
      fields: ["ledgerId"],
      type: "foreign key",
      name: fkName,
      references: {
        table: "Ledgers",
        field: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
  },

  async down(queryInterface, Sequelize) {
    const fkName = "transactions_ledgerId_fkey_cascade";

    // Remove cascade FK
    await queryInterface.removeConstraint("Transactions", fkName).catch(() => { });

    // Optional: restore basic FK without cascade
    await queryInterface.addConstraint("Transactions", {
      fields: ["ledgerId"],
      type: "foreign key",
      name: "transactions_ledgerId_fkey",
      references: {
        table: "Ledgers",
        field: "id",
      },
      onDelete: "NO ACTION",
      onUpdate: "CASCADE",
    });
  },
};
