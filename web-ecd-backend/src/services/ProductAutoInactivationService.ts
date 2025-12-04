import { Product } from '../models/Product';
import { OrderItem } from '../models/OrderItem';
import { Order } from '../models/Order';
import { Op } from 'sequelize';

/**
 * Serviço para inativação automática de produtos
 * RF0013 - Inativar CD automaticamente por falta de vendas
 */
export class ProductAutoInactivationService {

  private static readonly DEFAULT_DAYS_WITHOUT_SALES = 90; 
  private static readonly DEFAULT_MIN_SALES_QUANTITY = 0;

  static async checkAndInactivateProducts(
    daysWithoutSales: number = this.DEFAULT_DAYS_WITHOUT_SALES,
    minSalesQuantity: number = this.DEFAULT_MIN_SALES_QUANTITY
  ): Promise<{ inactivated: number; checked: number }> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysWithoutSales);

      const activeProducts = await Product.findAll({
        where: { ativo: true },
      });

      let inactivatedCount = 0;

      for (const product of activeProducts) {
        const allOrderItems = await OrderItem.findAll({
          where: {
            productId: product.id,
            createdAt: {
              [Op.gte]: cutoffDate,
            },
          },
          include: [
            {
              model: Order,
              as: 'order',
              required: true,
            },
          ],
        });

        const salesInPeriod = allOrderItems.filter(
          (item: any) => 
            item.order && 
            !['CANCELADO', 'REPROVADA'].includes(item.order.status)
        );

        const totalQuantitySold = salesInPeriod.reduce(
          (sum, item) => sum + Number(item.quantidade),
          0
        );

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
    } catch (error) {
      console.error('Erro ao verificar inativação automática de produtos:', error);
      throw error;
    }
  }

  /**
   * Verifica produtos específicos (para testes ou execução manual)
   */
  static async checkProduct(
    productId: number,
    daysWithoutSales: number = this.DEFAULT_DAYS_WITHOUT_SALES,
    minSalesQuantity: number = this.DEFAULT_MIN_SALES_QUANTITY
  ): Promise<{ shouldInactivate: boolean; salesQuantity: number; lastSaleDate: Date | null }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysWithoutSales);

    const product = await Product.findByPk(productId);
    if (!product) {
      throw new Error('Produto não encontrado');
    }

    const allOrderItems = await OrderItem.findAll({
      where: {
        productId: product.id,
        createdAt: {
          [Op.gte]: cutoffDate,
        },
      },
      include: [
        {
          model: Order,
          as: 'order',
          required: true,
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    const salesInPeriod = allOrderItems.filter(
      (item: any) => 
        item.order && 
        !['CANCELADO', 'REPROVADA'].includes(item.order.status)
    );

    const totalQuantitySold = salesInPeriod.reduce(
      (sum, item) => sum + Number(item.quantidade),
      0
    );

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

