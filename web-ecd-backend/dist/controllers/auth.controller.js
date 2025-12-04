"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.me = exports.login = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = require("../models/User");
const login = async (req, res) => {
    try {
        const { email, senha } = req.body;
        if (!email || !senha) {
            return res.status(400).json({ message: "E-mail e senha são obrigatórios" });
        }
        console.log(`🔍 Tentativa de login para: ${email}`);
        const user = await User_1.User.findOne({ where: { email } });
        if (!user) {
            console.log(`❌ Usuário não encontrado: ${email}`);
            return res.status(401).json({ message: "E-mail ou senha incorretos" });
        }
        console.log(`✅ Usuário encontrado: ${user.nome} (ID: ${user.id}, Role: ${user.role})`);
        const senhaValida = await bcryptjs_1.default.compare(senha, user.senha);
        if (!senhaValida) {
            console.log(`❌ Senha inválida para usuário: ${email}`);
            return res.status(401).json({ message: "E-mail ou senha incorretos" });
        }
        console.log(`✅ Senha válida para usuário: ${email}`);
        let clientId = null;
        if (user.role === "CLIENT") {
            clientId = user.id;
            if (user.ativo === false) {
                return res.status(401).json({ message: "Conta de cliente inativa" });
            }
        }
        const token = jsonwebtoken_1.default.sign({ id: user.id, role: user.role, clientId }, process.env.JWT_SECRET || "ecd_secret", { expiresIn: "8h" });
        res.json({
            token,
            role: user.role,
            nome: user.nome,
            userId: user.id,
            clientId: clientId,
            email: user.email,
            message: `Bem-vindo(a), ${user.nome}!`
        });
    }
    catch (error) {
        console.error("Erro no login:", error);
        res.status(500).json({ message: "Erro interno no login", error });
    }
};
exports.login = login;
const me = async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Não autenticado" });
        }
        const token = authHeader.split(" ")[1];
        const secret = process.env.JWT_SECRET || "ecd_secret";
        let payload;
        try {
            payload = jsonwebtoken_1.default.verify(token, secret);
        }
        catch (err) {
            return res.status(401).json({ message: "Token inválido ou expirado" });
        }
        const user = await User_1.User.findByPk(payload.id);
        if (!user) {
            return res.status(401).json({ message: "Usuário não existe mais" });
        }
        return res.json({
            userId: user.id,
            email: user.email,
            role: user.role,
            nome: user.nome,
        });
    }
    catch (error) {
        console.error("Erro ao validar sessão:", error);
        return res.status(500).json({ message: "Erro interno ao validar sessão" });
    }
};
exports.me = me;
