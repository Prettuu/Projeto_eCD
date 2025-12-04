"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecommendationController = void 0;
const RecommendationService_1 = require("../services/RecommendationService");
exports.RecommendationController = {
    async getPersonalized(req, res) {
        try {
            const clientId = Number(req.query.clientId || req.body.clientId);
            if (!clientId) {
                return res.status(400).json({ message: 'clientId é obrigatório' });
            }
            const limit = Number(req.query.limit || 10);
            const recommendations = await RecommendationService_1.RecommendationService.getPersonalizedRecommendations(clientId, limit);
            const productIds = recommendations.map(r => r.productId);
            const products = await RecommendationService_1.RecommendationService.getProductDetails(productIds);
            const result = recommendations.map(rec => {
                const product = products.find(p => p.id === rec.productId);
                return {
                    ...product,
                    score: rec.score,
                    reasons: rec.reasons
                };
            });
            res.json({
                recommendations: result,
                total: result.length
            });
        }
        catch (error) {
            console.error('Erro ao buscar recomendações:', error);
            res.status(500).json({ message: 'Erro ao buscar recomendações', error });
        }
    }
};
