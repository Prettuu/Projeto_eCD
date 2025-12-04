import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database";

/**
 * Modelo ExchangeItem — representa itens de uma troca
 */
export class ExchangeItem extends Model {
  public id!: number;
  public exchangeId!: number;
  public orderItemId!: number;
  public productId!: number;
  public quantidade!: number;
  public motivo?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ExchangeItem.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    exchangeId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    orderItemId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    productId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    quantidade: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    motivo: {
      type: DataTypes.TEXT,
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
    tableName: "ExchangeItems",
    timestamps: true,
  }
);

