import { Request, Response } from 'express';
import { Notification } from '../models/Notification';
import { Op } from 'sequelize';

export const NotificationController = {
  /**
   * GET /api/notifications
   * Busca notificações do cliente logado (ou todas se admin)
   */
  async getAll(req: Request, res: Response) {
    try {
      const { clientId } = req.query;
      const where: any = {};

      if (clientId) {
        where[Op.or] = [
          { clientId: Number(clientId) },
          { clientId: null }
        ];
      }

      const notifications = await Notification.findAll({
        where,
        order: [['createdAt', 'DESC']],
      });

      res.json(notifications);
    } catch (error) {
      console.error('Erro ao buscar notificações:', error);
      res.status(500).json({ message: 'Erro ao buscar notificações', error });
    }
  },

  /**
   * GET /api/notifications/:id
   */
  async getById(req: Request, res: Response) {
    try {
      const notification = await Notification.findByPk(req.params.id);
      if (!notification) {
        return res.status(404).json({ message: 'Notificação não encontrada' });
      }
      res.json(notification);
    } catch (error) {
      console.error('Erro ao buscar notificação:', error);
      res.status(500).json({ message: 'Erro ao buscar notificação', error });
    }
  },

  /**
   * POST /api/notifications
   * Criar notificação (preparado para admin - validação de role pode ser adicionada depois)
   */
  async create(req: Request, res: Response) {
    try {
      const { titulo, mensagem, tipo, clientId } = req.body;

      if (!titulo || !mensagem) {
        return res.status(400).json({ message: 'Título e mensagem são obrigatórios' });
      }

      const notification = await Notification.create({
        titulo,
        mensagem,
        tipo: tipo || 'INFO',
        clientId: clientId || null,
        lida: false,
      });

      res.status(201).json(notification);
    } catch (error) {
      console.error('Erro ao criar notificação:', error);
      res.status(500).json({ message: 'Erro ao criar notificação', error });
    }
  },

  /**
   * PUT /api/notifications/:id/read
   * Marcar notificação como lida
   */
  async markAsRead(req: Request, res: Response) {
    try {
      const notification = await Notification.findByPk(req.params.id);
      if (!notification) {
        return res.status(404).json({ message: 'Notificação não encontrada' });
      }

      notification.lida = true;
      await notification.save();

      res.json(notification);
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
      res.status(500).json({ message: 'Erro ao marcar notificação como lida', error });
    }
  },

  /**
   * PUT /api/notifications/read-all
   * Marcar todas as notificações do cliente como lidas
   */
  async markAllAsRead(req: Request, res: Response) {
    try {
      const { clientId } = req.body;
      if (!clientId) {
        return res.status(400).json({ message: 'clientId é obrigatório' });
      }

      await Notification.update(
        { lida: true },
        {
          where: {
            [Op.or]: [
              { clientId: Number(clientId) },
              { clientId: null }
            ],
          },
        }
      );

      res.json({ message: 'Todas as notificações foram marcadas como lidas' });
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
      res.status(500).json({ message: 'Erro ao marcar todas como lidas', error });
    }
  },

  /**
   * DELETE /api/notifications/:id
   * Deletar notificação (preparado para admin)
   */
  async delete(req: Request, res: Response) {
    try {
      const notification = await Notification.findByPk(req.params.id);
      if (!notification) {
        return res.status(404).json({ message: 'Notificação não encontrada' });
      }

      await notification.destroy();
      res.json({ message: 'Notificação excluída com sucesso' });
    } catch (error) {
      console.error('Erro ao excluir notificação:', error);
      res.status(500).json({ message: 'Erro ao excluir notificação', error });
    }
  },
};

