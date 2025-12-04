"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Client = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
exports.Client = database_1.sequelize.define('Client', {
    id: {
        type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
    },
    genero: {
        type: sequelize_1.DataTypes.STRING(10),
        allowNull: true,
    },
    nome: {
        type: sequelize_1.DataTypes.STRING(150),
        allowNull: false,
    },
    dataNascimento: {
        type: sequelize_1.DataTypes.DATEONLY,
        allowNull: true,
    },
    cpf: {
        type: sequelize_1.DataTypes.STRING(20),
        allowNull: false,
        unique: true,
    },
    email: {
        type: sequelize_1.DataTypes.STRING(150),
        allowNull: false,
    },
    senha: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: true,
    },
    ativo: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: true,
    },
    telefone: {
        type: sequelize_1.DataTypes.JSON,
        allowNull: true,
        comment: 'Armazena tipo, ddd e número',
    },
    enderecoResidencial: {
        type: sequelize_1.DataTypes.JSON,
        allowNull: true,
        comment: 'Endereço principal do cliente',
    },
    enderecosEntrega: {
        type: sequelize_1.DataTypes.JSON,
        allowNull: true,
        comment: 'Lista de endereços alternativos de entrega',
    },
    cartoes: {
        type: sequelize_1.DataTypes.JSON,
        allowNull: true,
        comment: 'Lista de cartões cadastrados',
    },
}, {
    tableName: 'Clients',
    timestamps: true,
});
