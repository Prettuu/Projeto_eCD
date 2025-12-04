"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductAutoInactivationController = void 0;
const ProductAutoInactivationService_1 = require("../services/ProductAutoInactivationService");
const productAutoInactivationJob_1 = require("../jobs/productAutoInactivationJob");
/**
 * Controller para gerenciar inativação automática de produtos
 * RF0013 - Inativar CD automaticamente
 */
exports.ProductAutoInactivationController = {
    /**
     * Executar verificação manual de inativação
     * POST /api/products/auto-inactivation/run
     * Body: { daysWithoutSales?: number, minSalesQuantity?: number }
     */
    async runManually(req, res) {
        try {
            const { daysWithoutSales, minSalesQuantity } = req.body;
            const result = await productAutoInactivationJob_1.ProductAutoInactivationJob.runManually(daysWithoutSales, minSalesQuantity);
            res.json({
                message: 'Verificação executada com sucesso',
                result,
            });
        }
        catch (error) {
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
    async checkProduct(req, res) {
        try {
            const productId = parseInt(req.params.id, 10);
            const daysWithoutSales = req.query.daysWithoutSales
                ? parseInt(req.query.daysWithoutSales, 10)
                : undefined;
            const minSalesQuantity = req.query.minSalesQuantity
                ? parseInt(req.query.minSalesQuantity, 10)
                : undefined;
            const result = await ProductAutoInactivationService_1.ProductAutoInactivationService.checkProduct(productId, daysWithoutSales, minSalesQuantity);
            res.json(result);
        }
        catch (error) {
            console.error('Erro ao verificar produto:', error);
            res.status(500).json({
                message: error.message || 'Erro ao verificar produto',
                error,
            });
        }
    },
};
