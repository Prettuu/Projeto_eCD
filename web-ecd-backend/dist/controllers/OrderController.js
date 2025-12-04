"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderController = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
const Order_1 = require("../models/Order");
const OrderItem_1 = require("../models/OrderItem");
const Product_1 = require("../models/Product");
const ExchangeCoupon_1 = require("../models/ExchangeCoupon");
exports.OrderController = {
    async getAll(req, res) {
        try {
            const { clientId } = req.query;
            const where = {};
            if (clientId) {
                where.clientId = clientId;
                where.status = { [sequelize_1.Op.ne]: 'CANCELADO' };
            }
            else {
            }
            const orders = await Order_1.Order.findAll({
                where,
                order: [['createdAt', 'DESC']],
                include: [
                    {
                        model: OrderItem_1.OrderItem,
                        as: 'items',
                        attributes: ['id', 'productId', 'titulo', 'quantidade', 'valorUnitario', 'subtotal'],
                    },
                ],
            });
            res.json(orders);
        }
        catch (error) {
            console.error('Erro ao buscar pedidos:', error);
            res.status(500).json({ message: 'Erro ao buscar pedidos', error });
        }
    },
    async getById(req, res) {
        try {
            const order = await Order_1.Order.findByPk(req.params.id, {
                include: [
                    {
                        model: OrderItem_1.OrderItem,
                        as: 'items',
                        attributes: ['id', 'productId', 'titulo', 'quantidade', 'valorUnitario', 'subtotal'],
                    },
                ],
            });
            if (!order) {
                return res.status(404).json({ message: 'Pedido não encontrado' });
            }
            const orderData = order.toJSON();
            console.log('OrderController.getById - order:', JSON.stringify(orderData, null, 2));
            console.log('OrderController.getById - items:', orderData.items);
            res.json(orderData);
        }
        catch (error) {
            console.error('Erro ao buscar pedido:', error);
            res.status(500).json({ message: 'Erro ao buscar pedido', error });
        }
    },
    async create(req, res) {
        try {
            const { clientId, items, desconto, cupom, paymentStatus } = req.body;
            let total = req.body.total || 0;
            // validate payment payload if provided
            const payment = req.body.payment;
            let computedPaymentStatus = paymentStatus || 'PENDENTE';
            if (payment) {
                try {
                    const type = (payment.type || '').toUpperCase();
                    if (type === 'ONE') {
                        if (!payment.cardId || !payment.amounts || !Array.isArray(payment.amounts) || payment.amounts.length !== 1) {
                            return res.status(400).json({ message: 'Pagamento inválido para tipo ONE' });
                        }
                        const amt = Number(payment.amounts[0] || 0);
                        if (Math.abs(Number(total) - amt) > 0.01) {
                            return res.status(400).json({ message: 'Valor do pagamento não confere com o total do pedido' });
                        }
                    }
                    else if (type === 'TWO') {
                        if (!payment.cardIds || !Array.isArray(payment.cardIds) || payment.cardIds.length !== 2) {
                            return res.status(400).json({ message: 'Pagamento inválido para tipo TWO (cartões esperados)' });
                        }
                        if (!payment.amounts || !Array.isArray(payment.amounts) || payment.amounts.length !== 2) {
                            return res.status(400).json({ message: 'Pagamento inválido para tipo TWO (valores esperados)' });
                        }
                        const a1 = Number(payment.amounts[0] || 0);
                        const a2 = Number(payment.amounts[1] || 0);
                        if (a1 <= 0 || a2 <= 0) {
                            return res.status(400).json({ message: 'Valores de pagamento devem ser positivos' });
                        }
                        const sum = Number((a1 + a2).toFixed(2));
                        if (Math.abs(Number(total) - sum) > 0.01) {
                            return res.status(400).json({ message: 'A soma dos pagamentos não confere com o total do pedido' });
                        }
                    }
                    else {
                        return res.status(400).json({ message: 'Tipo de pagamento desconhecido' });
                    }
                    // if validation passed, mark as approved (simulated)
                    computedPaymentStatus = 'APROVADO';
                }
                catch (e) {
                    return res.status(400).json({ message: 'Erro ao processar pagamento', error: e?.message || e });
                }
            }
            if (!clientId || !items || !Array.isArray(items) || items.length === 0) {
                return res.status(400).json({ message: 'Dados do pedido inválidos' });
            }
            const order = await database_1.sequelize.transaction(async (t) => {
                for (const item of items) {
                    const productId = item.productId || item.cdId;
                    const product = await Product_1.Product.findByPk(productId, { transaction: t });
                    if (!product) {
                        throw new Error(`Produto ${productId} não encontrado`);
                    }
                    if (!product.ativo) {
                        throw new Error(`Produto ${product.titulo} está inativo`);
                    }
                    const estoqueDisponivel = Number(product.estoque) || 0;
                    const quantidadeSolicitada = Number(item.quantidade) || 0;
                    console.log(`[OrderController] Verificando estoque - Produto: ${product.titulo}, Estoque: ${estoqueDisponivel}, Solicitado: ${quantidadeSolicitada}`);
                    if (estoqueDisponivel < quantidadeSolicitada) {
                        throw new Error(`Estoque insuficiente para ${product.titulo}. Disponível: ${estoqueDisponivel}, Solicitado: ${quantidadeSolicitada}`);
                    }
                }
                let exchangeCoupon = null;
                if (cupom) {
                    if (cupom.toUpperCase().startsWith('TROCA')) {
                        exchangeCoupon = await ExchangeCoupon_1.ExchangeCoupon.findOne({
                            where: { code: cupom.toUpperCase() },
                        });
                        if (!exchangeCoupon) {
                            throw new Error('Cupom de troca não encontrado');
                        }
                        if (exchangeCoupon.used) {
                            throw new Error('Cupom de troca já foi utilizado');
                        }
                        if (exchangeCoupon.clientId !== Number(clientId)) {
                            throw new Error('Cupom de troca não pertence a este cliente');
                        }
                        exchangeCoupon.used = true;
                        await exchangeCoupon.save({ transaction: t });
                    }
                }
                let descontoFinal = desconto || 0;
                if (exchangeCoupon && exchangeCoupon.value) {
                    const couponValue = Number(exchangeCoupon.value);
                    descontoFinal = Math.min(couponValue, total);
                    total = total - descontoFinal;
                }
                const newOrder = await Order_1.Order.create({
                    clientId,
                    total: total,
                    desconto: descontoFinal,
                    cupom: cupom || null,
                    status: 'EM PROCESSAMENTO',
                    paymentStatus: computedPaymentStatus || 'PENDENTE',
                }, { transaction: t });
                for (const item of items) {
                    await OrderItem_1.OrderItem.create({
                        orderId: newOrder.id,
                        productId: item.productId || item.cdId,
                        titulo: item.titulo,
                        quantidade: item.quantidade,
                        valorUnitario: item.valorUnitario,
                        subtotal: item.subtotal || item.valorUnitario * item.quantidade,
                    }, { transaction: t });
                    const product = await Product_1.Product.findByPk(item.productId || item.cdId, { transaction: t });
                    if (product) {
                        const estoqueAtual = Number(product.estoque) || 0;
                        const quantidade = Number(item.quantidade) || 0;
                        product.estoque = Math.max(0, estoqueAtual - quantidade);
                        if (product.estoque === 0 && product.ativo) {
                            product.ativo = false;
                            product.motivoInativacao = 'FORA DE MERCADO - Estoque zerado automaticamente';
                        }
                        await product.save({ transaction: t });
                    }
                }
                return newOrder;
            });
            const orderWithItems = await Order_1.Order.findByPk(order.id, {
                include: [
                    {
                        model: OrderItem_1.OrderItem,
                        as: 'items',
                    },
                ],
            });
            res.status(201).json(orderWithItems);
        }
        catch (error) {
            console.error('Erro ao criar pedido:', error);
            res.status(500).json({ message: error.message || 'Erro ao criar pedido', error });
        }
    },
    async updateStatus(req, res) {
        try {
            const { status, paymentStatus } = req.body;
            const order = await Order_1.Order.findByPk(req.params.id, {
                include: [
                    {
                        model: OrderItem_1.OrderItem,
                        as: 'items',
                        attributes: ['id', 'productId', 'titulo', 'quantidade', 'valorUnitario', 'subtotal'],
                    },
                ],
            });
            if (!order) {
                return res.status(404).json({ message: 'Pedido não encontrado' });
            }
            const previousStatus = order.status;
            const finalStatuses = ['ENTREGUE', 'DEVOLVIDO'];
            const shouldReturnStock = (status === 'REPROVADA' || status === 'CANCELADO') &&
                !finalStatuses.includes(previousStatus);
            if (status)
                order.status = status;
            if (paymentStatus)
                order.paymentStatus = paymentStatus;
            await order.save();
            if (shouldReturnStock && order.items && order.items.length > 0) {
                for (const item of order.items) {
                    try {
                        const product = await Product_1.Product.findByPk(item.productId);
                        if (product) {
                            product.estoque = Number(product.estoque) + Number(item.quantidade);
                            if (!product.ativo && product.estoque > 0) {
                                product.ativo = true;
                                product.motivoAtivacao = 'Reativação automática - Estoque retornado do pedido recusado/cancelado';
                            }
                            await product.save();
                            console.log(`Estoque retornado: Produto ${product.id} (+${item.quantidade})`);
                        }
                    }
                    catch (itemError) {
                        console.error(`Erro ao retornar estoque do item ${item.id}:`, itemError);
                    }
                }
            }
            const orderWithItems = await Order_1.Order.findByPk(order.id, {
                include: [
                    {
                        model: OrderItem_1.OrderItem,
                        as: 'items',
                        attributes: ['id', 'productId', 'titulo', 'quantidade', 'valorUnitario', 'subtotal'],
                    },
                ],
            });
            res.json(orderWithItems);
        }
        catch (error) {
            console.error('Erro ao atualizar status do pedido:', error);
            res.status(500).json({ message: 'Erro ao atualizar status do pedido', error });
        }
    },
    async delete(req, res) {
        try {
            const order = await Order_1.Order.findByPk(req.params.id);
            if (!order) {
                return res.status(404).json({ message: 'Pedido não encontrado' });
            }
            await order.update({
                status: 'CANCELADO',
                paymentStatus: order.paymentStatus === 'APROVADO' ? 'ESTORNADO' : order.paymentStatus
            });
            res.json({ message: 'Pedido excluído com sucesso' });
        }
        catch (error) {
            console.error('Erro ao excluir pedido:', error);
            res.status(500).json({ message: 'Erro ao excluir pedido', error });
        }
    },
};
