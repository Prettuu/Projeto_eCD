import { Request, Response } from 'express';
import { ChatbotService } from '../services/ChatbotService';

export const ChatbotController = {
  async chat(req: Request, res: Response) {
    try {
      const { message, clientId } = req.body;

      if (!message) {
        return res.status(400).json({ message: 'Mensagem é obrigatória' });
      }

      const response = await ChatbotService.generateResponse(message, clientId);
      
      res.json({
        response,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Erro no chatbot:', error);
      res.status(500).json({ message: 'Erro ao processar mensagem', error });
    }
  },

  async search(req: Request, res: Response) {
    try {
      const { query } = req.query;

      if (!query || typeof query !== 'string') {
        return res.status(400).json({ message: 'Query é obrigatória' });
      }

      const products = await ChatbotService.searchProducts(query);
      
      res.json({
        products,
        total: products.length
      });
    } catch (error) {
      console.error('Erro na busca:', error);
      res.status(500).json({ message: 'Erro ao buscar produtos', error });
    }
  }
};

