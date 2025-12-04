import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database";

/**
 * Modelo Notification — representa notificações para clientes
 */
export class Notification extends Model {
  public id!: number;
  public titulo!: string;
  public mensagem!: string;
  public tipo!: 'INFO' | 'ALERTA' | 'PROMOCAO' | 'SISTEMA';
  public clientId?: number | null;
  public lida!: boolean;
  public createdAt!: Date;
  public readonly updatedAt!: Date;
}

Notification.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    titulo: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    mensagem: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    tipo: {
      type: DataTypes.ENUM('INFO', 'ALERTA', 'PROMOCAO', 'SISTEMA'),
      allowNull: false,
      defaultValue: 'INFO',
    },
    clientId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      comment: 'null = notificação global para todos os clientes',
    },
    lida: {
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
    tableName: "Notifications",
    timestamps: true,
  }
);

