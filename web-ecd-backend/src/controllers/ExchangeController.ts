import { Request, Response } from 'express';
import { sequelize } from '../config/database';
import { Exchange } from '../models/Exchange';
import { ExchangeItem } from '../models/ExchangeItem';
import { ExchangeCoupon } from '../models/ExchangeCoupon';
import { Order } from '../models/Order';
import { OrderItem } from '../models/OrderItem';
import { Product } from '../models/Product';

export const ExchangeController = {
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

      const exchanges = await Exchange.findAll({
        where,
        order: [['createdAt', 'DESC']],
      });

      for (const exchange of exchanges) {
        (exchange as any).items = await ExchangeItem.findAll({
          where: { exchangeId: exchange.id }
        });
        (exchange as any).order = await Order.findByPk(exchange.orderId, {
          attributes: ['id', 'total', 'status', 'paymentStatus']
        });
        
        const generatedCoupon = await ExchangeCoupon.findOne({
          where: { exchangeId: exchange.id },
          order: [['createdAt', 'DESC']]
        });
        
        if (generatedCoupon) {
          let couponValue = 0;
          const rawValue = (generatedCoupon as any).dataValues?.value || generatedCoupon.value;
          
          if (rawValue !== null && rawValue !== undefined) {
            if (typeof rawValue === 'string') {
              couponValue = parseFloat(rawValue.replace(',', '.')) || 0;
            } else if (typeof rawValue === 'number') {
              couponValue = rawValue;
            } else {
              couponValue = Number(rawValue) || 0;
            }
          }
          
          (exchange as any).generatedCoupon = {
            code: generatedCoupon.code,
            value: couponValue,
            used: generatedCoupon.used
          };
        }
      }

      res.json(exchanges);
    } catch (error) {
      console.error('Erro ao buscar trocas:', error);
      res.status(500).json({ message: 'Erro ao buscar trocas', error });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const exchange = await Exchange.findByPk(req.params.id);
      
      if (!exchange) {
        return res.status(404).json({ message: 'Troca não encontrada' });
      }
      
      (exchange as any).items = await ExchangeItem.findAll({
        where: { exchangeId: exchange.id }
      });
      
      (exchange as any).order = await Order.findByPk(exchange.orderId, {
        attributes: ['id', 'total', 'status', 'paymentStatus']
      });
      
      const generatedCoupon = await ExchangeCoupon.findOne({
        where: { exchangeId: exchange.id },
        order: [['createdAt', 'DESC']]
      });
      
      if (generatedCoupon) {
        let couponValue = 0;
        const rawValue = (generatedCoupon as any).dataValues?.value || generatedCoupon.value;
        
        if (rawValue !== null && rawValue !== undefined) {
          if (typeof rawValue === 'string') {
            couponValue = parseFloat(rawValue.replace(',', '.')) || 0;
          } else if (typeof rawValue === 'number') {
            couponValue = rawValue;
          } else {
            couponValue = Number(rawValue) || 0;
          }
        }
        
        (exchange as any).generatedCoupon = {
          code: generatedCoupon.code,
          value: couponValue,
          used: generatedCoupon.used
        };
      }

      res.json(exchange);
    } catch (error) {
      console.error('Erro ao buscar troca:', error);
      res.status(500).json({ message: 'Erro ao buscar troca', error });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const { orderId, clientId, motivo, observacoes, items } = req.body;

      if (!orderId || !clientId || !motivo || !items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: 'Dados da troca inválidos' });
      }

      const order = await Order.findByPk(orderId);
      if (!order) {
        return res.status(404).json({ message: 'Pedido não encontrado' });
      }

      if (order.clientId !== Number(clientId)) {
        return res.status(403).json({ message: 'Pedido não pertence ao cliente' });
      }

      if (order.status !== 'ENTREGUE') {
        return res.status(400).json({ message: 'Solicitação de troca só pode ser realizada quando o pedido estiver com status ENTREGUE' });
      }

      const exchange = await sequelize.transaction(async (t) => {
        const newExchange = await Exchange.create(
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

          await ExchangeItem.create(
            {
              exchangeId: newExchange.id,
              orderItemId: orderItem.id,
              productId: item.productId || orderItem.productId,
              quantidade: item.quantidade,
              motivo: item.motivo || null,
            },
            { transaction: t }
          );
        }

        return newExchange;
      });

      const exchangeWithItems = await Exchange.findByPk(exchange.id);
      if (exchangeWithItems) {
        (exchangeWithItems as any).items = await ExchangeItem.findAll({
          where: { exchangeId: exchange.id }
        });
      }

      res.status(201).json(exchangeWithItems);
    } catch (error: any) {
      console.error('Erro ao criar troca:', error);
      res.status(500).json({ message: error.message || 'Erro ao criar troca', error });
    }
  },

  async updateStatus(req: Request, res: Response) {
    try {
      const { status, observacoes, couponCode } = req.body;
      const exchange = await Exchange.findByPk(req.params.id, {
        include: [
          {
            model: ExchangeItem,
            as: 'items',
          }
        ],
      });
      
      if (!exchange) {
        return res.status(404).json({ message: 'Troca não encontrada' });
      }

      if (!status) {
        return res.status(400).json({ message: 'Status é obrigatório' });
      }

      const validStatuses = ['PENDENTE', 'APROVADA', 'NEGADA', 'TROCA EM ANDAMENTO', 'PROCESSANDO', 'CONCLUIDA', 'CANCELADA'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: 'Status inválido' });
      }

      let finalStatus = status;
      if (status === 'APROVADA') {
        finalStatus = 'TROCA EM ANDAMENTO';
      }

      exchange.status = finalStatus;
      if (observacoes) {
        exchange.observacoes = (exchange.observacoes || '') + '\n' + observacoes;
      }

      await exchange.save();

      res.json(exchange);
    } catch (error) {
      console.error('Erro ao atualizar status da troca:', error);
      res.status(500).json({ message: 'Erro ao atualizar status da troca', error });
    }
  },

  async confirmReceived(req: Request, res: Response) {
    try {
      const exchange = await Exchange.findByPk(req.params.id, {
        include: [
          {
            model: ExchangeItem,
            as: 'items',
          }
        ],
      });
      
      if (!exchange) {
        return res.status(404).json({ message: 'Troca não encontrada' });
      }

      if (exchange.status !== 'TROCA EM ANDAMENTO') {
        return res.status(400).json({ message: 'Apenas trocas em andamento podem ter recebimento confirmado' });
      }

      await sequelize.transaction(async (t) => {
        const exchangeItems = (exchange as any).items || [];
        for (const item of exchangeItems) {
          const product = await Product.findByPk(item.productId, { transaction: t });
          if (product) {
            product.estoque = (product.estoque || 0) + item.quantidade;
            await product.save({ transaction: t });
          }
        }

        const order = await Order.findByPk(exchange.orderId, { 
          transaction: t,
          include: [
            {
              model: OrderItem,
              as: 'items',
              attributes: ['id', 'quantidade', 'valorUnitario', 'subtotal']
            }
          ]
        });
        if (!order) {
          throw new Error('Pedido não encontrado');
        }

        const orderItems = (order as any).items || await OrderItem.findAll({
          where: { orderId: exchange.orderId },
          transaction: t
        });
        
        const subtotal = orderItems.reduce((sum: number, item: any) => {
          let valorUnitario = 0;
          if (item.valorUnitario !== null && item.valorUnitario !== undefined) {
            if (typeof item.valorUnitario === 'string') {
              valorUnitario = parseFloat(item.valorUnitario.replace(',', '.')) || 0;
            } else if (typeof item.valorUnitario === 'number') {
              valorUnitario = item.valorUnitario;
            } else if (typeof item.valorUnitario.toString === 'function') {
              valorUnitario = parseFloat(item.valorUnitario.toString().replace(',', '.')) || 0;
            } else {
              valorUnitario = Number(item.valorUnitario) || 0;
            }
          }
          const quantidade = Number(item.quantidade) || 0;
          return sum + (valorUnitario * quantidade);
        }, 0);
        
        const rawDesconto = (order as any).dataValues?.desconto || order.desconto || 0;
        let desconto = 0;
        if (rawDesconto !== null && rawDesconto !== undefined) {
          if (typeof rawDesconto === 'string') {
            desconto = parseFloat(rawDesconto.replace(',', '.')) || 0;
          } else if (typeof rawDesconto === 'number') {
            desconto = rawDesconto;
          } else if (typeof rawDesconto.toString === 'function') {
            desconto = parseFloat(rawDesconto.toString().replace(',', '.')) || 0;
          } else {
            desconto = Number(rawDesconto) || 0;
          }
        }
        
        let valorCupom = subtotal - desconto;
        
        if (valorCupom < 0 || isNaN(valorCupom)) {
          console.error(`[ExchangeController] ERRO: Valor do cupom inválido calculado. Subtotal: ${subtotal}, Desconto: ${desconto}, Valor: ${valorCupom}`);
          valorCupom = 0;
        }
        
        console.log(`[ExchangeController] Calculando cupom de troca para pedido ${exchange.orderId}:`);
        console.log(`  - Subtotal (Σ valorUnitario * quantidade): R$ ${subtotal.toFixed(2)}`);
        console.log(`  - Desconto (order.desconto): R$ ${desconto.toFixed(2)}`);
        console.log(`  - Valor do cupom (subtotal - desconto): R$ ${valorCupom.toFixed(2)}`);

        const couponCode = `TROCA${exchange.id}-${Date.now().toString(36).toUpperCase()}`;
        await ExchangeCoupon.create(
          {
            code: couponCode,
            exchangeId: exchange.id,
            clientId: exchange.clientId,
            value: valorCupom,
            used: false,
          },
          { transaction: t }
        );

        exchange.status = 'CONCLUIDA';
        exchange.couponGenerated = couponCode;
        await exchange.save({ transaction: t });

        order.status = 'DEVOLVIDO';
        await order.save({ transaction: t });
      });

      const updatedExchange = await Exchange.findByPk(exchange.id);
      if (!updatedExchange) {
        return res.status(404).json({ message: 'Troca não encontrada após confirmação' });
      }
      
      (updatedExchange as any).items = await ExchangeItem.findAll({
        where: { exchangeId: exchange.id }
      });
      
      (updatedExchange as any).order = await Order.findByPk(exchange.orderId, {
        attributes: ['id', 'total', 'status', 'paymentStatus']
      });
      
      const generatedCoupon = await ExchangeCoupon.findOne({
        where: { exchangeId: exchange.id },
        order: [['createdAt', 'DESC']]
      });

      if (generatedCoupon) {
        let couponValue = 0;
        const rawValue = (generatedCoupon as any).dataValues?.value || generatedCoupon.value;
        
        if (rawValue !== null && rawValue !== undefined) {
          if (typeof rawValue === 'string') {
            couponValue = parseFloat(rawValue.replace(',', '.')) || 0;
          } else if (typeof rawValue === 'number') {
            couponValue = rawValue;
          } else {
            couponValue = Number(rawValue) || 0;
          }
        }
        
        (updatedExchange as any).generatedCoupon = {
          code: generatedCoupon.code,
          value: couponValue,
          used: generatedCoupon.used
        };
      }

      res.json(updatedExchange);
    } catch (error) {
      console.error('Erro ao confirmar recebimento:', error);
      res.status(500).json({ message: 'Erro ao confirmar recebimento', error });
    }
  },

};

