const { DataTypes } = require("sequelize");
const sequelize = require("../../api/db");

const Ledger = sequelize.define("Ledger", {
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: 'user_ledger_unique_constraint',
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: 'user_ledger_unique_constraint',
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    latestBalance: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.0,
    },

});

Ledger.associate = (models) => {
    Ledger.belongsTo(models.User, { foreignKey: "userId" });
    Ledger.hasMany(models.Transaction, {
        foreignKey: "ledgerId",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
        hooks: true,
      });};


module.exports = Ledger;
