"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeedbackController = void 0;
const Feedback_1 = require("../models/Feedback");
exports.FeedbackController = {
    async create(req, res) {
        try {
            const { clientId, productId, liked } = req.body;
            if (!clientId || !productId || typeof liked !== 'boolean') {
                return res.status(400).json({
                    message: 'clientId, productId e liked são obrigatórios'
                });
            }
            const [feedback, created] = await Feedback_1.Feedback.findOrCreate({
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
        }
        catch (error) {
            console.error('Erro ao criar feedback:', error);
            res.status(500).json({ message: 'Erro ao criar feedback', error });
        }
    },
    async getByClient(req, res) {
        try {
            const clientId = Number(req.params.clientId);
            const feedbacks = await Feedback_1.Feedback.findAll({
                where: { clientId }
            });
            res.json(feedbacks);
        }
        catch (error) {
            console.error('Erro ao buscar feedbacks:', error);
            res.status(500).json({ message: 'Erro ao buscar feedbacks', error });
        }
    }
};
