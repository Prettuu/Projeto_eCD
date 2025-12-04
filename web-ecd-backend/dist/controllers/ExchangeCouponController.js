"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExchangeCouponController = void 0;
const ExchangeCoupon_1 = require("../models/ExchangeCoupon");
exports.ExchangeCouponController = {
    async getByClientId(req, res) {
        try {
            const { clientId } = req.params;
            const { used } = req.query;
            const where = { clientId: Number(clientId) };
            if (used !== undefined) {
                where.used = used === 'true';
            }
            const coupons = await ExchangeCoupon_1.ExchangeCoupon.findAll({
                where,
                order: [['createdAt', 'DESC']],
            });
            res.json(coupons);
        }
        catch (error) {
            console.error('Erro ao buscar cupons de troca:', error);
            res.status(500).json({ message: 'Erro ao buscar cupons de troca', error });
        }
    },
    async getByCode(req, res) {
        try {
            const { code } = req.params;
            const coupon = await ExchangeCoupon_1.ExchangeCoupon.findOne({
                where: { code: code.toUpperCase() },
            });
            if (!coupon) {
                return res.status(404).json({ message: 'Cupom não encontrado' });
            }
            res.json(coupon);
        }
        catch (error) {
            console.error('Erro ao buscar cupom:', error);
            res.status(500).json({ message: 'Erro ao buscar cupom', error });
        }
    },
    async validateCoupon(req, res) {
        try {
            const { code, clientId } = req.body;
            if (!code) {
                return res.status(400).json({ message: 'Código do cupom é obrigatório' });
            }
            const coupon = await ExchangeCoupon_1.ExchangeCoupon.findOne({
                where: { code: code.toUpperCase() },
            });
            if (!coupon) {
                return res.json({ valid: false, error: 'Cupom não encontrado' });
            }
            if (coupon.used) {
                return res.json({ valid: false, error: 'Cupom já foi utilizado' });
            }
            if (clientId && coupon.clientId !== Number(clientId)) {
                return res.json({ valid: false, error: 'Cupom não pertence a este cliente' });
            }
            let couponValue = 0;
            const rawValue = coupon.dataValues?.value || coupon.value;
            if (rawValue !== null && rawValue !== undefined) {
                if (typeof rawValue === 'string') {
                    couponValue = parseFloat(rawValue.replace(',', '.')) || 0;
                }
                else if (typeof rawValue === 'number') {
                    couponValue = rawValue;
                }
                else {
                    couponValue = Number(rawValue) || 0;
                }
            }
            return res.json({
                valid: true,
                coupon: {
                    code: coupon.code,
                    value: couponValue,
                    clientId: coupon.clientId,
                },
            });
        }
        catch (error) {
            console.error('Erro ao validar cupom:', error);
            res.status(500).json({ message: 'Erro ao validar cupom', error });
        }
    },
    async markAsUsed(req, res) {
        try {
            const { code } = req.params;
            const coupon = await ExchangeCoupon_1.ExchangeCoupon.findOne({
                where: { code: code.toUpperCase() },
            });
            if (!coupon) {
                return res.status(404).json({ message: 'Cupom não encontrado' });
            }
            if (coupon.used) {
                return res.status(400).json({ message: 'Cupom já foi utilizado' });
            }
            coupon.used = true;
            await coupon.save();
            res.json(coupon);
        }
        catch (error) {
            console.error('Erro ao marcar cupom como usado:', error);
            res.status(500).json({ message: 'Erro ao marcar cupom como usado', error });
        }
    },
};
