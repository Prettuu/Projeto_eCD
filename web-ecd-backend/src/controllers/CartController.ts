import { Request, Response } from 'express';
import { Product } from '../models/Product';
import { CartItem } from '../models/CartItem';

export const CartController = {
  async addItem(req: Request, res: Response) {
    try {
      const { clientId, productId, quantidade } = req.body;

      if (!clientId || !productId || !quantidade) {
        return res.status(400).json({ message: 'Dados inválidos: clientId, productId e quantidade são obrigatórios' });
      }

      const product = await Product.findByPk(productId);
      
      if (!product) {
        return res.status(404).json({ message: 'Produto não encontrado' });
      }

      if (!product.ativo) {
        return res.status(400).json({ message: 'Produto não está ativo' });
      }

      if (product.estoque < quantidade) {
        return res.status(400).json({ message: `Estoque insuficiente. Disponível: ${product.estoque}` });
      }

      const [cartItem, created] = await CartItem.findOrCreate({
        where: {
          clientId: parseInt(clientId, 10),
          productId: parseInt(productId, 10)
        },
        defaults: {
          clientId: parseInt(clientId, 10),
          productId: parseInt(productId, 10),
          quantidade: parseInt(quantidade, 10)
        }
      });

      if (!created) {
        cartItem.quantidade += parseInt(quantidade, 10);
        await cartItem.save();
      }

      res.status(201).json({
        success: true,
        message: 'Item adicionado ao carrinho',
        item: {
          id: cartItem.id,
          clientId: cartItem.clientId,
          productId: product.id,
          cdId: product.id,
          titulo: product.titulo,
          valorUnitario: product.valorVenda,
          quantidade: cartItem.quantidade,
          estoqueDisponivel: product.estoque
        }
      });
    } catch (error: any) {
      console.error('Erro ao adicionar item ao carrinho:', error);
      res.status(500).json({ message: 'Erro ao adicionar item ao carrinho', error: error.message });
    }
  },

  async getCart(req: Request, res: Response) {
    try {
      const { clientId } = req.query;

      if (!clientId) {
        return res.status(400).json({ message: 'clientId é obrigatório' });
      }

      const cartItems = await CartItem.findAll({
        where: {
          clientId: parseInt(clientId as string, 10)
        }
      });

      const items = await Promise.all(cartItems.map(async (item) => {
        const product = await Product.findByPk(item.productId);
        return {
          id: item.id,
          clientId: item.clientId,
          productId: item.productId,
          cdId: item.productId,
          titulo: product?.titulo || '',
          valorUnitario: product?.valorVenda || 0,
          quantidade: item.quantidade,
          estoqueDisponivel: product?.estoque || 0
        };
      }));

      res.json({
        clientId: parseInt(clientId as string, 10),
        items,
        totalItems: items.length
      });
    } catch (error: any) {
      console.error('Erro ao buscar carrinho:', error);
      res.status(500).json({ message: 'Erro ao buscar carrinho', error: error.message });
    }
  }
};

