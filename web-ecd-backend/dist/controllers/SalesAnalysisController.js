"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SalesAnalysisController = void 0;
const OrderItem_1 = require("../models/OrderItem");
const Order_1 = require("../models/Order");
const Product_1 = require("../models/Product");
const sequelize_1 = require("sequelize");
/**
 * Controller para análise de vendas
 * RF0055 - Analisar histórico de vendas
 */
exports.SalesAnalysisController = {
    /**
     * Comparar vendas de CDs por intervalo de datas
     * GET /api/analysis/products?startDate=2024-01-01&endDate=2024-12-31
     */
    async compareProductsByDateRange(req, res) {
        try {
            const { startDate, endDate } = req.query;
            if (!startDate || !endDate) {
                return res.status(400).json({
                    message: 'Parâmetros startDate e endDate são obrigatórios (formato: YYYY-MM-DD)',
                });
            }
            const start = new Date(startDate);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            const orderItems = await OrderItem_1.OrderItem.findAll({
                where: {
                    createdAt: {
                        [sequelize_1.Op.between]: [start, end],
                    },
                },
                include: [
                    {
                        model: Order_1.Order,
                        as: 'order',
                        where: {
                            status: {
                                [sequelize_1.Op.notIn]: ['CANCELADO', 'REPROVADA'],
                            },
                        },
                        required: true,
                    },
                    {
                        model: Product_1.Product,
                        as: 'product',
                        required: true,
                    },
                ],
            });
            const productSales = {};
            orderItems.forEach((item) => {
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
            const result = Object.values(productSales).sort((a, b) => b.valorTotal - a.valorTotal);
            res.json({
                period: {
                    startDate: start.toISOString().split('T')[0],
                    endDate: end.toISOString().split('T')[0],
                },
                totalProducts: result.length,
                products: result,
            });
        }
        catch (error) {
            console.error('Erro ao analisar vendas de produtos:', error);
            res.status(500).json({ message: 'Erro ao analisar vendas de produtos', error });
        }
    },
    /**
     * Comparar vendas por categoria por intervalo de datas
     * GET /api/analysis/categories?startDate=2024-01-01&endDate=2024-12-31
     */
    async compareCategoriesByDateRange(req, res) {
        try {
            const { startDate, endDate } = req.query;
            if (!startDate || !endDate) {
                return res.status(400).json({
                    message: 'Parâmetros startDate e endDate são obrigatórios (formato: YYYY-MM-DD)',
                });
            }
            const start = new Date(startDate);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            const orderItems = await OrderItem_1.OrderItem.findAll({
                where: {
                    createdAt: {
                        [sequelize_1.Op.between]: [start, end],
                    },
                },
                include: [
                    {
                        model: Order_1.Order,
                        as: 'order',
                        where: {
                            status: {
                                [sequelize_1.Op.notIn]: ['CANCELADO', 'REPROVADA'],
                            },
                        },
                        required: true,
                    },
                    {
                        model: Product_1.Product,
                        as: 'product',
                        required: true,
                    },
                ],
            });
            const categorySales = {};
            orderItems.forEach((item) => {
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
            const result = Object.values(categorySales).sort((a, b) => b.valorTotal - a.valorTotal);
            res.json({
                period: {
                    startDate: start.toISOString().split('T')[0],
                    endDate: end.toISOString().split('T')[0],
                },
                totalCategories: result.length,
                categories: result,
            });
        }
        catch (error) {
            console.error('Erro ao analisar vendas por categoria:', error);
            res.status(500).json({ message: 'Erro ao analisar vendas por categoria', error });
        }
    },
    /**
     * Obter resumo geral de vendas
     * GET /api/analysis/summary?startDate=2024-01-01&endDate=2024-12-31
     */
    async getSalesSummary(req, res) {
        try {
            const { startDate, endDate } = req.query;
            let start;
            let end;
            if (startDate && endDate) {
                start = new Date(startDate);
                end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
            }
            const whereClause = {};
            if (start && end) {
                whereClause.createdAt = {
                    [sequelize_1.Op.between]: [start, end],
                };
            }
            const orders = await Order_1.Order.findAll({
                where: {
                    status: {
                        [sequelize_1.Op.notIn]: ['CANCELADO', 'REPROVADA'],
                    },
                    ...whereClause,
                },
            });
            const totalOrders = orders.length;
            const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total), 0);
            const totalDiscount = orders.reduce((sum, order) => sum + Number(order.desconto || 0), 0);
            const orderItems = await OrderItem_1.OrderItem.findAll({
                where: whereClause,
                include: [
                    {
                        model: Order_1.Order,
                        as: 'order',
                        where: {
                            status: {
                                [sequelize_1.Op.notIn]: ['CANCELADO', 'REPROVADA'],
                            },
                        },
                        required: true,
                    },
                ],
            });
            const totalItemsSold = orderItems.reduce((sum, item) => sum + Number(item.quantidade), 0);
            const uniqueProducts = new Set(orderItems.map((item) => item.productId));
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
        }
        catch (error) {
            console.error('Erro ao obter resumo de vendas:', error);
            res.status(500).json({ message: 'Erro ao obter resumo de vendas', error });
        }
    },
    /**
     * Obter vendas de produtos agrupadas por data
     * GET /api/analysis/products-by-date?startDate=2024-01-01&endDate=2024-12-31
     */
    async getProductsByDate(req, res) {
        try {
            const { startDate, endDate } = req.query;
            if (!startDate || !endDate) {
                return res.status(400).json({
                    message: 'Parâmetros startDate e endDate são obrigatórios (formato: YYYY-MM-DD)',
                });
            }
            const start = new Date(startDate);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            const orderItems = await OrderItem_1.OrderItem.findAll({
                where: {
                    createdAt: {
                        [sequelize_1.Op.between]: [start, end],
                    },
                },
                include: [
                    {
                        model: Order_1.Order,
                        as: 'order',
                        where: {
                            status: {
                                [sequelize_1.Op.notIn]: ['CANCELADO', 'REPROVADA'],
                            },
                        },
                        required: true,
                    },
                    {
                        model: Product_1.Product,
                        as: 'product',
                        required: true,
                    },
                ],
                order: [['createdAt', 'ASC']],
            });
            const datesSet = new Set();
            const productMap = {};
            orderItems.forEach((item) => {
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
        }
        catch (error) {
            console.error('Erro ao obter vendas de produtos por data:', error);
            res.status(500).json({ message: 'Erro ao obter vendas de produtos por data', error });
        }
    },
    async getCategoriesByDate(req, res) {
        try {
            const { startDate, endDate } = req.query;
            if (!startDate || !endDate) {
                return res.status(400).json({
                    message: 'Parâmetros startDate e endDate são obrigatórios (formato: YYYY-MM-DD)',
                });
            }
            const start = new Date(startDate);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            const orderItems = await OrderItem_1.OrderItem.findAll({
                where: {
                    createdAt: {
                        [sequelize_1.Op.between]: [start, end],
                    },
                },
                include: [
                    {
                        model: Order_1.Order,
                        as: 'order',
                        where: {
                            status: {
                                [sequelize_1.Op.notIn]: ['CANCELADO', 'REPROVADA'],
                            },
                        },
                        required: true,
                    },
                    {
                        model: Product_1.Product,
                        as: 'product',
                        required: true,
                    },
                ],
                order: [['createdAt', 'ASC']],
            });
            const datesSet = new Set();
            const categoryMap = {};
            orderItems.forEach((item) => {
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
        }
        catch (error) {
            console.error('Erro ao obter vendas de categorias por data:', error);
            res.status(500).json({ message: 'Erro ao obter vendas de categorias por data', error });
        }
    },
};
