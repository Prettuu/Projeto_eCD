import { Router } from "express";
import bcrypt from "bcryptjs";
import { User } from "../models/User";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const existing = await User.findOne({ where: { email: "admin@ecd.com" } });

    if (existing) {
      return res.json({ message: "⚠️ Usuário admin já existe." });
    }

    const senhaHash = await bcrypt.hash("123456", 10);
    await User.create({
      nome: "Administrador",
      email: "admin@ecd.com",
      senha: senhaHash,
      role: "ADMIN", 
    });

    res.json({
      message: "✅ Usuário admin criado com sucesso!",
      login: { email: "admin@ecd.com", senha: "123456" },
    });
  } catch (error) {
    console.error("❌ Erro ao criar admin:", error);
    res.status(500).json({ message: "Erro ao criar admin.", error });
  }
});

router.get("/users", async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'nome', 'email', 'role', 'ativo'],
    });
    res.json({ users, total: users.length });
  } catch (error) {
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

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(400).json({ message: "Usuário com este email já existe" });
    }

    const senhaHash = await bcrypt.hash(senha, 10);
    const user = await User.create({
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
  } catch (error) {
    console.error("❌ Erro ao criar usuário:", error);
    res.status(500).json({ message: "Erro ao criar usuário.", error });
  }
});

router.post("/reset-password", async (req, res) => {
  try {
    const { email, novaSenha } = req.body;
    
    if (!email || !novaSenha) {
      return res.status(400).json({ message: "Email e nova senha são obrigatórios" });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }

    const senhaHash = await bcrypt.hash(novaSenha, 10);
    user.senha = senhaHash;
    await user.save();

    res.json({
      message: "✅ Senha resetada com sucesso!",
      user: { id: user.id, nome: user.nome, email: user.email },
    });
  } catch (error) {
    console.error("❌ Erro ao resetar senha:", error);
    res.status(500).json({ message: "Erro ao resetar senha.", error });
  }
});

export default router;
