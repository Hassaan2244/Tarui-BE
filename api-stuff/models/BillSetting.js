const { DataTypes } = require("sequelize");
const sequelize = require("../../api/db");

const BillSetting = sequelize.define("BillSetting", {
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
    },
    icon: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    phone: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    address: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
});

BillSetting.associate = (models) => {
    BillSetting.belongsTo(models.User, { foreignKey: "userId" });
};


module.exports = BillSetting;
