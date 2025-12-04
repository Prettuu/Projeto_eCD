"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientController = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const User_1 = require("../models/User");
exports.ClientController = {
    async getAll(req, res) {
        try {
            const clients = await User_1.User.findAll({
                where: {
                    role: 'CLIENT',
                    ativo: true
                }
            });
            res.json(clients);
        }
        catch (error) {
            res.status(500).json({ message: 'Erro ao buscar clientes', error });
        }
    },
    async getById(req, res) {
        try {
            const client = await User_1.User.findOne({ where: { id: req.params.id, role: 'CLIENT' } });
            if (!client) {
                return res.status(404).json({ message: 'Cliente não encontrado' });
            }
            res.json(client);
        }
        catch (error) {
            res.status(500).json({ message: 'Erro ao buscar cliente', error });
        }
    },
    async create(req, res) {
        try {
            const { email, senha, nome } = req.body;
            const existingUser = await User_1.User.findOne({ where: { email } });
            if (existingUser) {
                return res.status(400).json({ message: 'Já existe um usuário com este e-mail' });
            }
            const senhaHash = senha ? await bcryptjs_1.default.hash(senha, 10) : undefined;
            const client = await User_1.User.create({ ...req.body, senha: senhaHash, role: 'CLIENT' });
            res.status(201).json(client);
        }
        catch (error) {
            res.status(500).json({ message: 'Erro ao criar cliente', error });
        }
    },
    async update(req, res) {
        try {
            const client = await User_1.User.findOne({ where: { id: req.params.id, role: 'CLIENT' } });
            if (!client) {
                return res.status(404).json({ message: 'Cliente não encontrado' });
            }
            const updateData = { ...req.body };
            if (updateData.senha) {
                updateData.senha = await bcryptjs_1.default.hash(updateData.senha, 10);
            }
            await client.update(updateData);
            res.json(client);
        }
        catch (error) {
            res.status(500).json({ message: 'Erro ao atualizar cliente', error });
        }
    },
    async updatePassword(req, res) {
        try {
            const { senha } = req.body;
            if (!senha) {
                return res.status(400).json({ message: 'Senha é obrigatória' });
            }
            const client = await User_1.User.findOne({ where: { id: req.params.id, role: 'CLIENT' } });
            if (!client) {
                return res.status(404).json({ message: 'Cliente não encontrado' });
            }
            const senhaHash = await bcryptjs_1.default.hash(senha, 10);
            await client.update({ senha: senhaHash });
            res.json({ message: 'Senha alterada com sucesso' });
        }
        catch (error) {
            res.status(500).json({ message: 'Erro ao alterar senha', error });
        }
    },
    async delete(req, res) {
        try {
            const client = await User_1.User.findOne({ where: { id: req.params.id, role: 'CLIENT' } });
            if (!client) {
                return res.status(404).json({ message: 'Cliente não encontrado' });
            }
            await client.update({ ativo: false });
            res.json({ message: 'Cliente excluído com sucesso' });
        }
        catch (error) {
            res.status(500).json({ message: 'Erro ao excluir cliente', error });
        }
    },
};
