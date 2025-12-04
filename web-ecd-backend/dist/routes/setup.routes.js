"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const User_1 = require("../models/User");
const router = (0, express_1.Router)();
router.get("/", async (req, res) => {
    try {
        const existing = await User_1.User.findOne({ where: { email: "admin@ecd.com" } });
        if (existing) {
            return res.json({ message: "⚠️ Usuário admin já existe." });
        }
        const senhaHash = await bcryptjs_1.default.hash("123456", 10);
        await User_1.User.create({
            nome: "Administrador",
            email: "admin@ecd.com",
            senha: senhaHash,
            role: "ADMIN",
        });
        res.json({
            message: "✅ Usuário admin criado com sucesso!",
            login: { email: "admin@ecd.com", senha: "123456" },
        });
    }
    catch (error) {
        console.error("❌ Erro ao criar admin:", error);
        res.status(500).json({ message: "Erro ao criar admin.", error });
    }
});
router.get("/users", async (req, res) => {
    try {
        const users = await User_1.User.findAll({
            attributes: ['id', 'nome', 'email', 'role', 'ativo'],
        });
        res.json({ users, total: users.length });
    }
    catch (error) {
        console.error("❌ Erro ao listar usuários:", error);
        res.status(500).json({ message: "Erro ao listar usuários.", error });
    }
});
router.post("/user", async (req, res) => {
    try {
        const { email, senha, nome, role } = req.body;
        if (!email || !senha || !nome) {
            return res.status(400).json({ message: "Email, senha e nome são obrigatórios" });
        }
        const existing = await User_1.User.findOne({ where: { email } });
        if (existing) {
            return res.status(400).json({ message: "Usuário com este email já existe" });
        }
        const senhaHash = await bcryptjs_1.default.hash(senha, 10);
        const user = await User_1.User.create({
            nome,
            email,
            senha: senhaHash,
            role: role || "CLIENT",
            ativo: true,
        });
        res.json({
            message: "✅ Usuário criado com sucesso!",
            user: { id: user.id, nome: user.nome, email: user.email, role: user.role },
        });
    }
    catch (error) {
        console.error("❌ Erro ao criar usuário:", error);
        res.status(500).json({ message: "Erro ao criar usuário.", error });
    }
});
exports.default = router;
