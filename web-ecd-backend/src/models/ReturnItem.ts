import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database";

/**
 * Modelo ReturnItem — representa itens de uma devolução
 */
export class ReturnItem extends Model {
  public id!: number;
  public returnId!: number;
  public orderItemId!: number;
  public productId!: number;
  public quantidade!: number;
  public motivo?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ReturnItem.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    returnId: {
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
    tableName: "ReturnItems",
    timestamps: true,
  }
);

