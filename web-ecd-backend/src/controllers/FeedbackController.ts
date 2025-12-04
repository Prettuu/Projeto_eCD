import { Request, Response } from 'express';
import { Feedback } from '../models/Feedback';

export const FeedbackController = {
  async create(req: Request, res: Response) {
    try {
      const { clientId, productId, liked } = req.body;

      if (!clientId || !productId || typeof liked !== 'boolean') {
        return res.status(400).json({ 
          message: 'clientId, productId e liked são obrigatórios' 
        });
      }

      const [feedback, created] = await Feedback.findOrCreate({
        where: {
          clientId,
          productId
        },
        defaults: {
          clientId,
          productId,
          liked
        }
      });

      if (!created) {
        feedback.liked = liked;
        await feedback.save();
      }

      res.status(201).json(feedback);
    } catch (error) {
      console.error('Erro ao criar feedback:', error);
      res.status(500).json({ message: 'Erro ao criar feedback', error });
    }
  },

  async getByClient(req: Request, res: Response) {
    try {
      const clientId = Number(req.params.clientId);
      const feedbacks = await Feedback.findAll({
        where: { clientId }
      });

      res.json(feedbacks);
    } catch (error) {
      console.error('Erro ao buscar feedbacks:', error);
      res.status(500).json({ message: 'Erro ao buscar feedbacks', error });
    }
  }
};

