import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database';

export const Client = sequelize.define('Client', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },

  genero: {
    type: DataTypes.STRING(10),
    allowNull: true,
  },

  nome: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },

  dataNascimento: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },

  cpf: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
  },

  email: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },

  senha: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },

  ativo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },

  telefone: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Armazena tipo, ddd e número',
  },

  enderecoResidencial: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Endereço principal do cliente',
  },

  enderecosEntrega: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Lista de endereços alternativos de entrega',
  },

  cartoes: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Lista de cartões cadastrados',
  },
}, {
  tableName: 'Clients',
  timestamps: true,
});
