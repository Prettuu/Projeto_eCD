"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Return = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
/**
 * Modelo Return — representa solicitações de devolução
 */
class Return extends sequelize_1.Model {
}
exports.Return = Return;
Return.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
    },
    orderId: {
        type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
    },
    clientId: {
        type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
    },
    status: {
        type: sequelize_1.DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'PENDENTE',
    },
    motivo: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: false,
    },
    observacoes: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    receivedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    createdAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize_1.DataTypes.NOW,
    },
    updatedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize_1.DataTypes.NOW,
    },
}, {
    sequelize: database_1.sequelize,
    tableName: "Returns",
    timestamps: true,
});
