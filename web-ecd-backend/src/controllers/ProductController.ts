import { Request, Response } from 'express';
import { Product } from '../models/Product';

/**
 * RN0014 - Valida margem de lucro mínima
 * Fórmula: (valorVenda - valorCusto) / valorCusto >= margemMinima
 */
function validateProfitMargin(valorCusto: number, valorVenda: number): { valid: boolean; message?: string; margemCalculada?: number } {
  const margemMinima = Number(process.env.MARGEM_MINIMA_LUCRO || 0.3);
  
  if (!valorCusto || valorCusto <= 0) {
    return { valid: false, message: 'Valor de custo deve ser maior que zero' };
  }
  
  if (!valorVenda || valorVenda <= 0) {
    return { valid: false, message: 'Valor de venda deve ser maior que zero' };
  }
  
  if (valorVenda < valorCusto) {
    const prejuizo = ((valorCusto - valorVenda) / valorCusto) * 100;
    return { 
      valid: false, 
      message: `Valor de venda menor que o custo. Prejuízo de ${prejuizo.toFixed(2)}%`,
      margemCalculada: (valorVenda - valorCusto) / valorCusto
    };
  }
  
  const margemCalculada = (valorVenda - valorCusto) / valorCusto;
  
  if (margemCalculada < margemMinima) {
    return {
      valid: false,
      message: `Margem de lucro insuficiente. Mínimo: ${(margemMinima * 100).toFixed(0)}%, Calculada: ${(margemCalculada * 100).toFixed(2)}%`,
      margemCalculada: margemCalculada
    };
  }
  
  return { valid: true, margemCalculada: margemCalculada };
}

export const ProductController = {
  async getAll(req: Request, res: Response) {
    try {
      const products = await Product.findAll({ where: { ativo: true } });
      res.json(products);
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
      res.status(500).json({ message: 'Erro ao buscar produtos', error });
    }
  },

  async getAllAdmin(req: Request, res: Response) {
    try {
      const products = await Product.findAll();
      res.json(products);
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
      res.status(500).json({ message: 'Erro ao buscar produtos', error });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const product = await Product.findByPk(req.params.id);
      if (!product) {
        return res.status(404).json({ message: 'Produto não encontrado' });
      }
      res.json(product);
    } catch (error) {
      console.error('Erro ao buscar produto:', error);
      res.status(500).json({ message: 'Erro ao buscar produto', error });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const productData: any = { ...req.body };
      
      if (productData.valorCusto !== undefined && productData.valorVenda !== undefined) {
        const valorCusto = Number(productData.valorCusto);
        const valorVenda = Number(productData.valorVenda);
        const validation = validateProfitMargin(valorCusto, valorVenda);
        
        if (!validation.valid) {
          return res.status(400).json({
            message: validation.message,
            margemMinima: Number(process.env.MARGEM_MINIMA_LUCRO || 0.3),
            margemCalculada: validation.margemCalculada
          });
        }
      }
      
      if (!productData.codigoCatalogo) {
        const count = await Product.count();
        productData.codigoCatalogo = `CD-${Date.now()}-${count + 1}`;
      }
      
      const product = await Product.create(productData);
      res.status(201).json(product);
    } catch (error: any) {
      console.error('Erro ao criar produto:', error);
      const errorMessage = error.errors?.[0]?.message || error.message || 'Erro ao criar produto';
      res.status(500).json({ message: errorMessage, error });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const product = await Product.findByPk(req.params.id);
      if (!product) {
        return res.status(404).json({ message: 'Produto não encontrado' });
      }
      const updateData: any = { ...req.body };
      
      const valorCusto = updateData.valorCusto !== undefined ? Number(updateData.valorCusto) : Number(product.valorCusto);
      const valorVenda = updateData.valorVenda !== undefined ? Number(updateData.valorVenda) : Number(product.valorVenda);
      
      if (updateData.valorCusto !== undefined || updateData.valorVenda !== undefined) {
        const validation = validateProfitMargin(valorCusto, valorVenda);
        
        if (!validation.valid) {
          return res.status(400).json({
            message: validation.message,
            margemMinima: Number(process.env.MARGEM_MINIMA_LUCRO || 0.3),
            margemCalculada: validation.margemCalculada
          });
        }
      }
      
      if (updateData.ativo === true && product.ativo === false) {
        updateData.motivoAtivacao = updateData.motivoAtivacao || null;
      }
      
      if (updateData.ativo === false && product.ativo === true) {
        updateData.motivoInativacao = updateData.motivoInativacao || null;
      }
      
      await product.update(updateData);
      res.json(product);
    } catch (error) {
      console.error('Erro ao atualizar produto:', error);
      res.status(500).json({ message: 'Erro ao atualizar produto', error });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const product = await Product.findByPk(req.params.id);
      if (!product) {
        return res.status(404).json({ message: 'Produto não encontrado' });
      }
      const { motivoInativacao } = req.body;
      await product.update({ ativo: false, motivoInativacao: motivoInativacao || null });
      res.json({ message: 'Produto excluído com sucesso' });
    } catch (error) {
      console.error('Erro ao excluir produto:', error);
      res.status(500).json({ message: 'Erro ao excluir produto', error });
    }
  },

  async updateStock(req: Request, res: Response) {
    try {
      const { quantidade, operation } = req.body;
      const product = await Product.findByPk(req.params.id);
      if (!product) {
        return res.status(404).json({ message: 'Produto não encontrado' });
      }

      const currentStock = Number(product.estoque);
      const qty = Number(quantidade);
      
      if (operation === 'decrease') {
        product.estoque = Math.max(0, currentStock - qty);
        
        if (product.estoque === 0 && product.ativo) {
          product.ativo = false;
          product.motivoInativacao = 'FORA DE MERCADO - Estoque zerado automaticamente';
        }
      } else if (operation === 'increase') {
        product.estoque = currentStock + qty;
      }

      await product.save();
      res.json(product);
    } catch (error) {
      console.error('Erro ao atualizar estoque:', error);
      res.status(500).json({ message: 'Erro ao atualizar estoque', error });
    }
  },
};

