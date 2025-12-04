import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database";

/**
 * Modelo User — representa usuários do sistema (ADM / CLIENT)
 * Inclui colunas padrão createdAt / updatedAt e tipagem TypeScript
 */
export class User extends Model {
  public id!: number;
  public nome!: string;
  public email!: string;
  public senha!: string;
  public role!: "ADMIN" | "CLIENT";
  public genero?: string;
  public dataNascimento?: Date;
  public cpf?: string;
  public ativo?: boolean;
  public telefone?: any;
  public enderecoResidencial?: any;
  public enderecosEntrega?: any;
  public cartoes?: any;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    nome: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: { msg: "Formato de e-mail inválido" },
      },
    },
    senha: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM("ADMIN", "CLIENT"),
      allowNull: false,
      defaultValue: "CLIENT",
    },
    genero: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    dataNascimento: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    cpf: {
      type: DataTypes.STRING(20),
      allowNull: true,
      unique: true,
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
      comment: 'Endereço principal do usuário',
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
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: "Users",
    timestamps: true,
  }
);
