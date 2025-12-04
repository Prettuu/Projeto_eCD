"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductAutoInactivationService = void 0;
const Product_1 = require("../models/Product");
const OrderItem_1 = require("../models/OrderItem");
const Order_1 = require("../models/Order");
const sequelize_1 = require("sequelize");
/**
 * Serviço para inativação automática de produtos
 * RF0013 - Inativar CD automaticamente por falta de vendas
 */
class ProductAutoInactivationService {
    static async checkAndInactivateProducts(daysWithoutSales = this.DEFAULT_DAYS_WITHOUT_SALES, minSalesQuantity = this.DEFAULT_MIN_SALES_QUANTITY) {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysWithoutSales);
            const activeProducts = await Product_1.Product.findAll({
                where: { ativo: true },
            });
            let inactivatedCount = 0;
            for (const product of activeProducts) {
                const allOrderItems = await OrderItem_1.OrderItem.findAll({
                    where: {
                        productId: product.id,
                        createdAt: {
                            [sequelize_1.Op.gte]: cutoffDate,
                        },
                    },
                    include: [
                        {
                            model: Order_1.Order,
                            as: 'order',
                            required: true,
                        },
                    ],
                });
                const salesInPeriod = allOrderItems.filter((item) => item.order &&
                    !['CANCELADO', 'REPROVADA'].includes(item.order.status));
                const totalQuantitySold = salesInPeriod.reduce((sum, item) => sum + Number(item.quantidade), 0);
                if (totalQuantitySold <= minSalesQuantity) {
                    const isStockZero = product.estoque === 0;
                    if (!isStockZero) {
                        product.ativo = false;
                        product.motivoInativacao = `FORA DE MERCADO - Sem vendas há ${daysWithoutSales} dias (vendas no período: ${totalQuantitySold})`;
                        await product.save();
                        inactivatedCount++;
                        console.log(`Produto ${product.id} (${product.titulo}) inativado por falta de vendas`);
                    }
                }
            }
            return {
                inactivated: inactivatedCount,
                checked: activeProducts.length,
            };
        }
        catch (error) {
            console.error('Erro ao verificar inativação automática de produtos:', error);
            throw error;
        }
    }
    /**
     * Verifica produtos específicos (para testes ou execução manual)
     */
    static async checkProduct(productId, daysWithoutSales = this.DEFAULT_DAYS_WITHOUT_SALES, minSalesQuantity = this.DEFAULT_MIN_SALES_QUANTITY) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysWithoutSales);
        const product = await Product_1.Product.findByPk(productId);
        if (!product) {
            throw new Error('Produto não encontrado');
        }
        const allOrderItems = await OrderItem_1.OrderItem.findAll({
            where: {
                productId: product.id,
                createdAt: {
                    [sequelize_1.Op.gte]: cutoffDate,
                },
            },
            include: [
                {
                    model: Order_1.Order,
                    as: 'order',
                    required: true,
                },
            ],
            order: [['createdAt', 'DESC']],
        });
        const salesInPeriod = allOrderItems.filter((item) => item.order &&
            !['CANCELADO', 'REPROVADA'].includes(item.order.status));
        const totalQuantitySold = salesInPeriod.reduce((sum, item) => sum + Number(item.quantidade), 0);
        const lastSaleDate = salesInPeriod.length > 0
            ? salesInPeriod[0].createdAt
            : null;
        const shouldInactivate = totalQuantitySold <= minSalesQuantity && product.estoque > 0;
        return {
            shouldInactivate,
            salesQuantity: totalQuantitySold,
            lastSaleDate,
        };
    }
}
exports.ProductAutoInactivationService = ProductAutoInactivationService;
ProductAutoInactivationService.DEFAULT_DAYS_WITHOUT_SALES = 90;
ProductAutoInactivationService.DEFAULT_MIN_SALES_QUANTITY = 0;
