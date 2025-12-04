"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecommendationService = void 0;
const Product_1 = require("../models/Product");
const OrderItem_1 = require("../models/OrderItem");
const Order_1 = require("../models/Order");
const sequelize_1 = require("sequelize");
const Feedback_1 = require("../models/Feedback");
class RecommendationService {
    static async getPersonalizedRecommendations(clientId, limit = 10) {
        const clientOrders = await Order_1.Order.findAll({
            where: {
                clientId,
                status: {
                    [sequelize_1.Op.notIn]: ['CANCELADO', 'REPROVADA', 'DEVOLVIDO']
                }
            },
            include: [
                {
                    model: OrderItem_1.OrderItem,
                    as: 'items',
                    include: [
                        {
                            model: Product_1.Product,
                            as: 'product',
                            required: true
                        }
                    ]
                }
            ]
        });
        const purchasedProducts = new Map();
        const preferredCategories = new Map();
        const preferredArtists = new Map();
        const preferredYears = new Map();
        clientOrders.forEach(order => {
            order.items?.forEach((item) => {
                const product = item.product;
                if (!product)
                    return;
                const productId = product.id;
                purchasedProducts.set(productId, (purchasedProducts.get(productId) || 0) + item.quantidade);
                const categoria = product.categoria;
                preferredCategories.set(categoria, (preferredCategories.get(categoria) || 0) + item.quantidade);
                const artista = product.artista;
                preferredArtists.set(artista, (preferredArtists.get(artista) || 0) + item.quantidade);
                const ano = product.ano;
                preferredYears.set(ano, (preferredYears.get(ano) || 0) + item.quantidade);
            });
        });
        const clientFeedbacks = await Feedback_1.Feedback.findAll({
            where: { clientId }
        });
        const likedProducts = new Set(clientFeedbacks
            .filter(f => f.liked === true)
            .map(f => f.productId));
        const dislikedProducts = new Set(clientFeedbacks
            .filter(f => f.liked === false)
            .map(f => f.productId));
        const allProducts = await Product_1.Product.findAll({
            where: {
                ativo: true,
                estoque: { [sequelize_1.Op.gt]: 0 }
            }
        });
        const recommendations = [];
        for (const product of allProducts) {
            if (purchasedProducts.has(product.id))
                continue;
            let score = 0;
            const reasons = [];
            if (preferredCategories.has(product.categoria)) {
                const weight = preferredCategories.get(product.categoria) || 0;
                score += weight * 10;
                reasons.push(`Mesma categoria (${product.categoria})`);
            }
            if (preferredArtists.has(product.artista)) {
                const weight = preferredArtists.get(product.artista) || 0;
                score += weight * 15;
                reasons.push(`Mesmo artista (${product.artista})`);
            }
            const yearDiff = Array.from(preferredYears.keys())
                .map(year => Math.abs(year - product.ano))
                .reduce((min, diff) => Math.min(min, diff), Infinity);
            if (yearDiff < 5) {
                score += 5;
                reasons.push(`Ano similar (${product.ano})`);
            }
            if (likedProducts.has(product.id)) {
                score += 20;
                reasons.push('Você curtiu este produto');
            }
            if (dislikedProducts.has(product.id)) {
                score -= 50;
            }
            if (score > 0) {
                recommendations.push({
                    productId: product.id,
                    score,
                    reasons
                });
            }
        }
        recommendations.sort((a, b) => b.score - a.score);
        return recommendations.slice(0, limit);
    }
    static async getProductDetails(productIds) {
        const products = await Product_1.Product.findAll({
            where: {
                id: { [sequelize_1.Op.in]: productIds },
                ativo: true
            }
        });
        return products.map(p => ({
            id: p.id,
            titulo: p.titulo,
            artista: p.artista,
            ano: p.ano,
            categoria: p.categoria,
            valorVenda: p.valorVenda,
            estoque: p.estoque,
            sinopse: p.sinopse
        }));
    }
}
exports.RecommendationService = RecommendationService;
