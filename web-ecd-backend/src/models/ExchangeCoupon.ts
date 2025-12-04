import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database";

/**
 * Modelo ExchangeCoupon — representa cupons de troca gerados
 */
export class ExchangeCoupon extends Model {
  public id!: number;
  public code!: string;
  public exchangeId!: number;
  public clientId!: number;
  public value!: number;
  public used!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ExchangeCoupon.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    exchangeId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    clientId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    value: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    used: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
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
    tableName: "ExchangeCoupons",
    timestamps: true,
  }
);

