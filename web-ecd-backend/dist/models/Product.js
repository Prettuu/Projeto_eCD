"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Product = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
/**
 * Modelo Product — representa produtos/CDs do catálogo
 */
class Product extends sequelize_1.Model {
}
exports.Product = Product;
Product.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
    },
    titulo: {
        type: sequelize_1.DataTypes.STRING(150),
        allowNull: false,
    },
    artista: {
        type: sequelize_1.DataTypes.STRING(150),
        allowNull: false,
    },
    ano: {
        type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
    },
    categoria: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: false,
    },
    codigoCatalogo: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: true,
        unique: true,
    },
    estoque: {
        type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
    },
    valorCusto: {
        type: sequelize_1.DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    valorVenda: {
        type: sequelize_1.DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    ativo: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
    motivoInativacao: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    motivoAtivacao: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    genero: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: true,
    },
    gravadora: {
        type: sequelize_1.DataTypes.STRING(150),
        allowNull: true,
    },
    edicao: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: true,
    },
    codigoBarras: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: true,
    },
    numeroFaixas: {
        type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
    },
    duracao: {
        type: sequelize_1.DataTypes.STRING(20),
        allowNull: true,
        comment: 'Formato: MM:SS ou HH:MM:SS',
    },
    sinopse: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    dimensoes: {
        type: sequelize_1.DataTypes.JSON,
        allowNull: true,
        comment: 'JSON: {altura, largura, peso, profundidade}',
    },
    grupoPrecificacao: {
        type: sequelize_1.DataTypes.STRING(50),
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
    tableName: "Products",
    timestamps: true,
});
