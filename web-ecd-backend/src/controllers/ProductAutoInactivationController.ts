import { Request, Response } from 'express';
import { ProductAutoInactivationService } from '../services/ProductAutoInactivationService';
import { ProductAutoInactivationJob } from '../jobs/productAutoInactivationJob';

/**
 * Controller para gerenciar inativação automática de produtos
 * RF0013 - Inativar CD automaticamente
 */
export const ProductAutoInactivationController = {
  /**
   * Executar verificação manual de inativação
   * POST /api/products/auto-inactivation/run
   * Body: { daysWithoutSales?: number, minSalesQuantity?: number }
   */
  async runManually(req: Request, res: Response) {
    try {
      const { daysWithoutSales, minSalesQuantity } = req.body;

      const result = await ProductAutoInactivationJob.runManually(
        daysWithoutSales,
        minSalesQuantity
      );

      res.json({
        message: 'Verificação executada com sucesso',
        result,
      });
    } catch (error) {
      console.error('Erro ao executar verificação manual:', error);
      res.status(500).json({
        message: 'Erro ao executar verificação manual',
        error,
      });
    }
  },

  /**
   * Verificar status de um produto específico
   * GET /api/products/:id/auto-inactivation/check
   * Query: ?daysWithoutSales=90&minSalesQuantity=0
   */
  async checkProduct(req: Request, res: Response) {
    try {
      const productId = parseInt(req.params.id, 10);
      const daysWithoutSales = req.query.daysWithoutSales
        ? parseInt(req.query.daysWithoutSales as string, 10)
        : undefined;
      const minSalesQuantity = req.query.minSalesQuantity
        ? parseInt(req.query.minSalesQuantity as string, 10)
        : undefined;

      const result = await ProductAutoInactivationService.checkProduct(
        productId,
        daysWithoutSales,
        minSalesQuantity
      );

      res.json(result);
    } catch (error: any) {
      console.error('Erro ao verificar produto:', error);
      res.status(500).json({
        message: error.message || 'Erro ao verificar produto',
        error,
      });
    }
  },
};

