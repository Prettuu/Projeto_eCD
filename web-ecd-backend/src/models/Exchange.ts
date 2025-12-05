import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database";

/**
 * Modelo Exchange — representa solicitações de troca
 */
export class Exchange extends Model {
  public id!: number;
  public orderId!: number;
  public clientId!: number;
  public status!: string;
  public motivo!: string;
  public observacoes?: string;
  public couponGenerated?: string | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Exchange.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    orderId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    clientId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'PENDENTE',
    },
    motivo: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    observacoes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    couponGenerated: {
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
    tableName: "Exchanges",
    timestamps: true,
  }
);

