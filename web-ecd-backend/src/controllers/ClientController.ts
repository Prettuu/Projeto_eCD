import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';

export const ClientController = {
  async getAll(req: Request, res: Response) {
    try {
      const clients = await User.findAll({ 
        where: { 
          role: 'CLIENT',
          ativo: true
        } 
      });
      res.json(clients);
    } catch (error) {
      res.status(500).json({ message: 'Erro ao buscar clientes', error });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const client = await User.findOne({ where: { id: req.params.id, role: 'CLIENT' } });
      if (!client) {
        return res.status(404).json({ message: 'Cliente não encontrado' });
      }
      res.json(client);
    } catch (error) {
      res.status(500).json({ message: 'Erro ao buscar cliente', error });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const { email, senha, nome } = req.body;
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ message: 'Já existe um usuário com este e-mail' });
      }
      const senhaHash = senha ? await bcrypt.hash(senha, 10) : undefined;
      const client = await User.create({ ...req.body, senha: senhaHash, role: 'CLIENT' });
      res.status(201).json(client);
    } catch (error) {
      res.status(500).json({ message: 'Erro ao criar cliente', error });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const client = await User.findOne({ where: { id: req.params.id, role: 'CLIENT' } });
      if (!client) {
        return res.status(404).json({ message: 'Cliente não encontrado' });
      }
      const updateData: any = { ...req.body };
      
      if (updateData.senha && updateData.senha.length < 100 && !updateData.senha.startsWith('$2')) {
        updateData.senha = await bcrypt.hash(updateData.senha, 10);
      } else if (!updateData.senha) {
        delete updateData.senha;
      }
      
      await client.update(updateData);
      res.json(client);
    } catch (error) {
      res.status(500).json({ message: 'Erro ao atualizar cliente', error });
    }
  },

  async updatePassword(req: Request, res: Response) {
    try {
      const { senha } = req.body;
      if (!senha) {
        return res.status(400).json({ message: 'Senha é obrigatória' });
      }
      
      const client = await User.findOne({ where: { id: req.params.id, role: 'CLIENT' } });
      if (!client) {
        return res.status(404).json({ message: 'Cliente não encontrado' });
      }
      
      const senhaHash = await bcrypt.hash(senha, 10);
      await client.update({ senha: senhaHash });
      res.json({ message: 'Senha alterada com sucesso' });
    } catch (error) {
      res.status(500).json({ message: 'Erro ao alterar senha', error });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const client = await User.findOne({ where: { id: req.params.id, role: 'CLIENT' } });
      if (!client) {
        return res.status(404).json({ message: 'Cliente não encontrado' });
      }
      await client.update({ ativo: false });
      res.json({ message: 'Cliente excluído com sucesso' });
    } catch (error) {
      res.status(500).json({ message: 'Erro ao excluir cliente', error });
    }
  },
};

