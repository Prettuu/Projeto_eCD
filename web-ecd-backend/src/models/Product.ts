import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database";

/**
 * Modelo Product — representa produtos/CDs do catálogo
 */
export class Product extends Model {
  public id!: number;
  public titulo!: string;
  public artista!: string;
  public ano!: number;
  public categoria!: string;
  public codigoCatalogo?: string;
  public estoque!: number;
  public valorCusto!: number;
  public valorVenda!: number;
  public ativo!: boolean;
  public motivoInativacao?: string;
  public motivoAtivacao?: string;
  public genero?: string;
  public gravadora?: string;
  public edicao?: string;
  public codigoBarras?: string;
  public numeroFaixas?: number;
  public duracao?: string;
  public sinopse?: string;
  public dimensoes?: any;
  public grupoPrecificacao?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Product.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    titulo: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    artista: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    ano: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    categoria: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    codigoCatalogo: {
      type: DataTypes.STRING(50),
      allowNull: true,
      unique: true,
    },
    estoque: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
    },
    valorCusto: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    valorVenda: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    ativo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    motivoInativacao: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    motivoAtivacao: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    genero: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    gravadora: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },
    edicao: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    codigoBarras: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    numeroFaixas: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },
    duracao: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: 'Formato: MM:SS ou HH:MM:SS',
    },
    sinopse: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    dimensoes: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'JSON: {altura, largura, peso, profundidade}',
    },
    grupoPrecificacao: {
      type: DataTypes.STRING(50),
      allowNull: true,
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
    tableName: "Products",
    timestamps: true,
  }
);

