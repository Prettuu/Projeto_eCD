import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database";

/**
 * Modelo Return — representa solicitações de devolução
 */
export class Return extends Model {
  public id!: number;
  public orderId!: number;
  public clientId!: number;
  public status!: string;
  public motivo!: string;
  public observacoes?: string;
  public receivedAt?: Date | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Return.init(
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
    receivedAt: {
      type: DataTypes.DATE,
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
    tableName: "Returns",
    timestamps: true,
  }
);

