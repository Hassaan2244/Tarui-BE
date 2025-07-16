const { DataTypes } = require("sequelize");
const sequelize = require("../../api/db");

const Transaction = sequelize.define("Transaction", {
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    ledgerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    type: {
        type: DataTypes.ENUM(
            "Buy",
            "Sell",
            "Open Sell",
            "Return-In",
            "Return-Out",
            "Breakage",
            "Credit Amount",
            "Debit Amount"
        ),
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
    },
    runningBalance: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        comment: "Cumulative balance after this transaction"
    },
    prevBalance: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        comment: "Cumulative balance before this transaction"
    },
    paid: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    preparedBy: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "admin",
    },    
    selectedProducts: {
        type: DataTypes.JSONB,
        allowNull: true,
    },
});

// models/Transaction.js
Transaction.associate = (models) => {
    Transaction.belongsTo(models.User, { foreignKey: "userId" });

    Transaction.belongsTo(models.Ledger, {
        foreignKey: "ledgerId",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
};
  

module.exports = Transaction;
