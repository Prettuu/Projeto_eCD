import { Request, Response } from 'express';
import { OrderItem } from '../models/OrderItem';
import { Order } from '../models/Order';
import { Product } from '../models/Product';
import { Op } from 'sequelize';
import { sequelize } from '../config/database';

/**
 * Controller para análise de vendas
 * RF0055 - Analisar histórico de vendas
 */
export const SalesAnalysisController = {
  /**
   * Comparar vendas de CDs por intervalo de datas
   * GET /api/analysis/products?startDate=2024-01-01&endDate=2024-12-31
   */
  async compareProductsByDateRange(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          message: 'Parâmetros startDate e endDate são obrigatórios (formato: YYYY-MM-DD)',
        });
      }

      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      end.setHours(23, 59, 59, 999);

      const orderItems = await OrderItem.findAll({
        where: {
          createdAt: {
            [Op.between]: [start, end],
          },
        },
        include: [
          {
            model: Order,
            as: 'order',
            where: {
              status: {
                [Op.notIn]: ['CANCELADO', 'REPROVADA'],
              },
            },
            required: true,
          },
          {
            model: Product,
            as: 'product',
            required: true,
          },
        ],
      });

      const productSales: Record<number, {
        productId: number;
        titulo: string;
        artista: string;
        categoria: string;
        quantidadeVendida: number;
        valorTotal: number;
        quantidadePedidos: number;
      }> = {};

      orderItems.forEach((item: any) => {
        const productId = item.productId;
        const product = item.product;

        if (!productSales[productId]) {
          productSales[productId] = {
            productId,
            titulo: product?.titulo || item.titulo,
            artista: product?.artista || '',
            categoria: product?.categoria || '',
            quantidadeVendida: 0,
            valorTotal: 0,
            quantidadePedidos: 0,
          };
        }

        productSales[productId].quantidadeVendida += Number(item.quantidade);
        productSales[productId].valorTotal += Number(item.subtotal);
        productSales[productId].quantidadePedidos += 1;
      });

      const result = Object.values(productSales).sort(
        (a, b) => b.valorTotal - a.valorTotal
      );

      res.json({
        period: {
          startDate: start.toISOString().split('T')[0],
          endDate: end.toISOString().split('T')[0],
        },
        totalProducts: result.length,
        products: result,
      });
    } catch (error) {
      console.error('Erro ao analisar vendas de produtos:', error);
      res.status(500).json({ message: 'Erro ao analisar vendas de produtos', error });
    }
  },

  /**
   * Comparar vendas por categoria por intervalo de datas
   * GET /api/analysis/categories?startDate=2024-01-01&endDate=2024-12-31
   */
  async compareCategoriesByDateRange(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          message: 'Parâmetros startDate e endDate são obrigatórios (formato: YYYY-MM-DD)',
        });
      }

      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      end.setHours(23, 59, 59, 999);

      const orderItems = await OrderItem.findAll({
        where: {
          createdAt: {
            [Op.between]: [start, end],
          },
        },
        include: [
          {
            model: Order,
            as: 'order',
            where: {
              status: {
                [Op.notIn]: ['CANCELADO', 'REPROVADA'],
              },
            },
            required: true,
          },
          {
            model: Product,
            as: 'product',
            required: true,
          },
        ],
      });

      const categorySales: Record<string, {
        categoria: string;
        quantidadeVendida: number;
        valorTotal: number;
        quantidadePedidos: number;
        quantidadeProdutos: number;
        produtos: string[];
      }> = {};

      orderItems.forEach((item: any) => {
        const categoria = item.product?.categoria || 'Sem categoria';

        if (!categorySales[categoria]) {
          categorySales[categoria] = {
            categoria,
            quantidadeVendida: 0,
            valorTotal: 0,
            quantidadePedidos: 0,
            quantidadeProdutos: 0,
            produtos: [],
          };
        }

        categorySales[categoria].quantidadeVendida += Number(item.quantidade);
        categorySales[categoria].valorTotal += Number(item.subtotal);
        categorySales[categoria].quantidadePedidos += 1;

        const productTitle = item.product?.titulo || item.titulo;
        if (!categorySales[categoria].produtos.includes(productTitle)) {
          categorySales[categoria].produtos.push(productTitle);
          categorySales[categoria].quantidadeProdutos += 1;
        }
      });

      const result = Object.values(categorySales).sort(
        (a, b) => b.valorTotal - a.valorTotal
      );

      res.json({
        period: {
          startDate: start.toISOString().split('T')[0],
          endDate: end.toISOString().split('T')[0],
        },
        totalCategories: result.length,
        categories: result,
      });
    } catch (error) {
      console.error('Erro ao analisar vendas por categoria:', error);
      res.status(500).json({ message: 'Erro ao analisar vendas por categoria', error });
    }
  },

  /**
   * Obter resumo geral de vendas
   * GET /api/analysis/summary?startDate=2024-01-01&endDate=2024-12-31
   */
  async getSalesSummary(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;

      let start: Date | undefined;
      let end: Date | undefined;

      if (startDate && endDate) {
        start = new Date(startDate as string);
        end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999);
      }

      const whereClause: any = {};
      if (start && end) {
        whereClause.createdAt = {
          [Op.between]: [start, end],
        };
      }

      const orders = await Order.findAll({
        where: {
          status: {
            [Op.notIn]: ['CANCELADO', 'REPROVADA'],
          },
          ...whereClause,
        },
      });

      const totalOrders = orders.length;
      const totalRevenue = orders.reduce(
        (sum, order) => sum + Number(order.total),
        0
      );
      const totalDiscount = orders.reduce(
        (sum, order) => sum + Number(order.desconto || 0),
        0
      );

      const orderItems = await OrderItem.findAll({
        where: whereClause,
        include: [
          {
            model: Order,
            as: 'order',
            where: {
              status: {
                [Op.notIn]: ['CANCELADO', 'REPROVADA'],
              },
            },
            required: true,
          },
        ],
      });

      const totalItemsSold = orderItems.reduce(
        (sum, item) => sum + Number(item.quantidade),
        0
      );

      const uniqueProducts = new Set(
        orderItems.map((item: any) => item.productId)
      );

      res.json({
        period: start && end
          ? {
              startDate: start.toISOString().split('T')[0],
              endDate: end.toISOString().split('T')[0],
            }
          : null,
        summary: {
          totalOrders,
          totalRevenue,
          totalDiscount,
          totalItemsSold,
          uniqueProductsSold: uniqueProducts.size,
          averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
        },
      });
    } catch (error) {
      console.error('Erro ao obter resumo de vendas:', error);
      res.status(500).json({ message: 'Erro ao obter resumo de vendas', error });
    }
  },

  /**
   * Obter vendas de produtos agrupadas por data
   * GET /api/analysis/products-by-date?startDate=2024-01-01&endDate=2024-12-31
   */
  async getProductsByDate(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          message: 'Parâmetros startDate e endDate são obrigatórios (formato: YYYY-MM-DD)',
        });
      }

      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      end.setHours(23, 59, 59, 999);

      const orderItems = await OrderItem.findAll({
        where: {
          createdAt: {
            [Op.between]: [start, end],
          },
        },
        include: [
          {
            model: Order,
            as: 'order',
            where: {
              status: {
                [Op.notIn]: ['CANCELADO', 'REPROVADA'],
              },
            },
            required: true,
          },
          {
            model: Product,
            as: 'product',
            required: true,
          },
        ],
        order: [['createdAt', 'ASC']],
      });

      const datesSet = new Set<string>();
      const productMap: Record<number, {
        productId: number;
        titulo: string;
        artista: string;
        categoria: string;
        salesByDate: Record<string, number>;
      }> = {};

      orderItems.forEach((item: any) => {
        const productId = item.productId;
        const product = item.product;
        const saleDate = new Date(item.createdAt).toISOString().split('T')[0];
        
        datesSet.add(saleDate);

        if (!productMap[productId]) {
          productMap[productId] = {
            productId,
            titulo: product?.titulo || item.titulo,
            artista: product?.artista || '',
            categoria: product?.categoria || '',
            salesByDate: {},
          };
        }

        if (!productMap[productId].salesByDate[saleDate]) {
          productMap[productId].salesByDate[saleDate] = 0;
        }

        productMap[productId].salesByDate[saleDate] += Number(item.quantidade);
      });

      const dates = Array.from(datesSet).sort();

      const products = Object.values(productMap).map(product => ({
        productId: product.productId,
        titulo: product.titulo,
        artista: product.artista,
        categoria: product.categoria,
        salesByDate: dates.map(date => ({
          date,
          quantity: product.salesByDate[date] || 0,
        })),
      }));

      res.json({
        period: {
          startDate: start.toISOString().split('T')[0],
          endDate: end.toISOString().split('T')[0],
        },
        dates,
        products,
      });
    } catch (error) {
      console.error('Erro ao obter vendas de produtos por data:', error);
      res.status(500).json({ message: 'Erro ao obter vendas de produtos por data', error });
    }
  },

  async getCategoriesByDate(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          message: 'Parâmetros startDate e endDate são obrigatórios (formato: YYYY-MM-DD)',
        });
      }

      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      end.setHours(23, 59, 59, 999);

      const orderItems = await OrderItem.findAll({
        where: {
          createdAt: {
            [Op.between]: [start, end],
          },
        },
        include: [
          {
            model: Order,
            as: 'order',
            where: {
              status: {
                [Op.notIn]: ['CANCELADO', 'REPROVADA'],
              },
            },
            required: true,
          },
          {
            model: Product,
            as: 'product',
            required: true,
          },
        ],
        order: [['createdAt', 'ASC']],
      });

      const datesSet = new Set<string>();
      const categoryMap: Record<string, {
        categoria: string;
        salesByDate: Record<string, number>;
      }> = {};

      orderItems.forEach((item: any) => {
        const categoria = item.product?.categoria || 'Sem categoria';
        const saleDate = new Date(item.createdAt).toISOString().split('T')[0];
        
        datesSet.add(saleDate);

        if (!categoryMap[categoria]) {
          categoryMap[categoria] = {
            categoria,
            salesByDate: {},
          };
        }

        if (!categoryMap[categoria].salesByDate[saleDate]) {
          categoryMap[categoria].salesByDate[saleDate] = 0;
        }

        categoryMap[categoria].salesByDate[saleDate] += Number(item.subtotal);
      });

      const dates = Array.from(datesSet).sort();

      const categories = Object.values(categoryMap).map(category => ({
        categoria: category.categoria,
        salesByDate: dates.map(date => ({
          date,
          value: category.salesByDate[date] || 0,
        })),
      }));

      res.json({
        period: {
          startDate: start.toISOString().split('T')[0],
          endDate: end.toISOString().split('T')[0],
        },
        dates,
        categories,
      });
    } catch (error) {
      console.error('Erro ao obter vendas de categorias por data:', error);
      res.status(500).json({ message: 'Erro ao obter vendas de categorias por data', error });
    }
  },
};

