import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database";

/**
 * Modelo CartItem — representa itens no carrinho de compras
 */
export class CartItem extends Model {
  public id!: number;
  public clientId!: number;
  public productId!: number;
  public quantidade!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

CartItem.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    clientId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      comment: 'ID do cliente (usuário)',
    },
    productId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      comment: 'ID do produto',
    },
    quantidade: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 1,
      comment: 'Quantidade do produto no carrinho',
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
    tableName: "CartItems",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['clientId', 'productId'],
        name: 'unique_client_product'
      }
    ]
  }
);

