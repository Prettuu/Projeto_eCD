import { Request, Response } from 'express';
import { RecommendationService } from '../services/RecommendationService';

export const RecommendationController = {
  async getPersonalized(req: Request, res: Response) {
    try {
      const clientId = Number(req.query.clientId || req.body.clientId);
      
      if (!clientId) {
        return res.status(400).json({ message: 'clientId é obrigatório' });
      }

      const limit = Number(req.query.limit || 10);
      const recommendations = await RecommendationService.getPersonalizedRecommendations(clientId, limit);
      
      const productIds = recommendations.map(r => r.productId);
      const products = await RecommendationService.getProductDetails(productIds);

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
    } catch (error) {
      console.error('Erro ao buscar recomendações:', error);
      res.status(500).json({ message: 'Erro ao buscar recomendações', error });
    }
  }
};

