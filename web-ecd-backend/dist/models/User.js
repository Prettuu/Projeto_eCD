"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
/**
 * Modelo User — representa usuários do sistema (ADM / CLIENT)
 * Inclui colunas padrão createdAt / updatedAt e tipagem TypeScript
 */
class User extends sequelize_1.Model {
}
exports.User = User;
User.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
    },
    nome: {
        type: sequelize_1.DataTypes.STRING(150),
        allowNull: false,
    },
    email: {
        type: sequelize_1.DataTypes.STRING(150),
        allowNull: false,
        unique: true,
        validate: {
            isEmail: { msg: "Formato de e-mail inválido" },
        },
    },
    senha: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false,
    },
    role: {
        type: sequelize_1.DataTypes.ENUM("ADMIN", "CLIENT"),
        allowNull: false,
        defaultValue: "CLIENT",
    },
    genero: {
        type: sequelize_1.DataTypes.STRING(10),
        allowNull: true,
    },
    dataNascimento: {
        type: sequelize_1.DataTypes.DATEONLY,
        allowNull: true,
    },
    cpf: {
        type: sequelize_1.DataTypes.STRING(20),
        allowNull: true,
        unique: true,
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
        comment: 'Endereço principal do usuário',
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
    tableName: "Users",
    timestamps: true,
});
