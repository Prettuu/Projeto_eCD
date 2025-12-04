import { Request, Response } from 'express';
import { sequelize } from '../config/database';
import { Return } from '../models/Return';
import { ReturnItem } from '../models/ReturnItem';
import { Order } from '../models/Order';
import { OrderItem } from '../models/OrderItem';
import { Product } from '../models/Product';

export const ReturnController = {
  async getAll(req: Request, res: Response) {
    try {
      const { clientId, status } = req.query;
      const where: any = {};
      
      if (clientId) {
        where.clientId = clientId;
      }
      if (status) {
        where.status = status;
      }

      const returns = await Return.findAll({
        where,
        order: [['createdAt', 'DESC']],
      });

      for (const returnRequest of returns) {
        (returnRequest as any).items = await ReturnItem.findAll({
          where: { returnId: returnRequest.id }
        });
        (returnRequest as any).order = await Order.findByPk(returnRequest.orderId, {
          attributes: ['id', 'total', 'status', 'paymentStatus']
        });
      }

      res.json(returns);
    } catch (error) {
      console.error('Erro ao buscar devoluções:', error);
      res.status(500).json({ message: 'Erro ao buscar devoluções', error });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const returnRequest = await Return.findByPk(req.params.id);
      
      if (returnRequest) {
        (returnRequest as any).items = await ReturnItem.findAll({
          where: { returnId: returnRequest.id }
        });
        (returnRequest as any).order = await Order.findByPk(returnRequest.orderId);
      }

      if (!returnRequest) {
        return res.status(404).json({ message: 'Devolução não encontrada' });
      }

      res.json(returnRequest);
    } catch (error) {
      console.error('Erro ao buscar devolução:', error);
      res.status(500).json({ message: 'Erro ao buscar devolução', error });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const { orderId, clientId, motivo, observacoes, items } = req.body;

      if (!orderId || !clientId || !motivo || !items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: 'Dados da devolução inválidos' });
      }

      const order = await Order.findByPk(orderId);
      if (!order) {
        return res.status(404).json({ message: 'Pedido não encontrado' });
      }

      if (order.clientId !== Number(clientId)) {
        return res.status(403).json({ message: 'Pedido não pertence ao cliente' });
      }

      if (!['APROVADA', 'TRANSPORTE', 'ENTREGUE'].includes(order.status)) {
        return res.status(400).json({ message: 'Pedido não está em status válido para devolução' });
      }

      const returnRequest = await sequelize.transaction(async (t) => {
        const newReturn = await Return.create(
          {
            orderId,
            clientId,
            motivo,
            observacoes: observacoes || null,
            status: 'PENDENTE',
          },
          { transaction: t }
        );

        for (const item of items) {
          let orderItem = await OrderItem.findByPk(item.orderItemId, { transaction: t });
          
          if (!orderItem || orderItem.orderId !== orderId) {
            const orderItems = await OrderItem.findAll({
              where: {
                orderId: orderId,
                productId: item.productId
              },
              transaction: t
            });
            orderItem = orderItems.length > 0 ? orderItems[0] : null;
          }

          if (!orderItem || orderItem.orderId !== orderId) {
            throw new Error(`Item ${item.orderItemId || item.productId} não encontrado ou não pertence ao pedido ${orderId}`);
          }

          if (item.quantidade > orderItem.quantidade) {
            throw new Error(`Quantidade solicitada (${item.quantidade}) maior que a disponível (${orderItem.quantidade}) no item ${orderItem.id}`);
          }

          await ReturnItem.create(
            {
              returnId: newReturn.id,
              orderItemId: orderItem.id,
              productId: item.productId || orderItem.productId,
              quantidade: item.quantidade,
              motivo: item.motivo || null,
            },
            { transaction: t }
          );
        }

        return newReturn;
      });

      const returnWithItems = await Return.findByPk(returnRequest.id);
      if (returnWithItems) {
        (returnWithItems as any).items = await ReturnItem.findAll({
          where: { returnId: returnRequest.id }
        });
      }

      res.status(201).json(returnWithItems);
    } catch (error: any) {
      console.error('Erro ao criar devolução:', error);
      res.status(500).json({ message: error.message || 'Erro ao criar devolução', error });
    }
  },

  async updateStatus(req: Request, res: Response) {
    try {
      const { status, observacoes } = req.body;
      const returnRequest = await Return.findByPk(req.params.id, {
        include: [
          {
            model: ReturnItem,
            as: 'items',
          }
        ],
      });
      
      if (!returnRequest) {
        return res.status(404).json({ message: 'Devolução não encontrada' });
      }

      if (!status) {
        return res.status(400).json({ message: 'Status é obrigatório' });
      }

      const validStatuses = ['PENDENTE', 'APROVADA', 'NEGADA', 'RECEBIDA', 'PROCESSANDO', 'CONCLUIDA', 'CANCELADA'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: 'Status inválido' });
      }

      returnRequest.status = status;
      
      if (status === 'RECEBIDA' && !returnRequest.receivedAt) {
        returnRequest.receivedAt = new Date();
      }

      if (observacoes) {
        returnRequest.observacoes = (returnRequest.observacoes || '') + '\n' + observacoes;
      }

      await returnRequest.save();

      res.json(returnRequest);
    } catch (error) {
      console.error('Erro ao atualizar status da devolução:', error);
      res.status(500).json({ message: 'Erro ao atualizar status da devolução', error });
    }
  },

  async confirmReceived(req: Request, res: Response) {
    try {
      const returnRequest = await Return.findByPk(req.params.id, {
        include: [
          {
            model: ReturnItem,
            as: 'items',
          }
        ],
      });
      
      if (!returnRequest) {
        return res.status(404).json({ message: 'Devolução não encontrada' });
      }

      if (returnRequest.status !== 'APROVADA') {
        return res.status(400).json({ message: 'Devolução precisa estar aprovada para confirmar recebimento' });
      }

      await sequelize.transaction(async (t) => {
        for (const item of returnRequest.items) {
          const product = await Product.findByPk(item.productId, { transaction: t });
          if (product) {
            product.estoque = (product.estoque || 0) + item.quantidade;
            await product.save({ transaction: t });
          }
        }

        returnRequest.status = 'CONCLUIDA';
        returnRequest.receivedAt = new Date();
        await returnRequest.save({ transaction: t });

        const order = await Order.findByPk(returnRequest.orderId, { transaction: t });
        if (order) {
          order.status = 'DEVOLVIDO';
          await order.save({ transaction: t });
        }
      });

      const updatedReturn = await Return.findByPk(returnRequest.id);
      if (updatedReturn) {
        (updatedReturn as any).items = await ReturnItem.findAll({
          where: { returnId: returnRequest.id }
        });
      }

      res.json(updatedReturn);
    } catch (error) {
      console.error('Erro ao confirmar recebimento:', error);
      res.status(500).json({ message: 'Erro ao confirmar recebimento', error });
    }
  },
};

