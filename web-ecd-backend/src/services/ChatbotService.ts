import axios from 'axios';
import { Product } from '../models/Product';
import { Order } from '../models/Order';
import { ExchangeCoupon } from '../models/ExchangeCoupon';
import { Op } from 'sequelize';

export class ChatbotService {


  static async generateResponse(
    message: string,
    clientId?: number
  ): Promise<string> {

    const context = await this.buildContext(clientId);

    const systemPrompt = `
Você é um assistente virtual híbrido.

COMPORTAMENTO:
- Você pode responder perguntas gerais sobre qualquer assunto, como um assistente comum.
- Quando a pergunta estiver relacionada à loja eCD, utilize e priorize as informações reais do contexto fornecido.
- Nunca diga que não pode responder algo.
- Nunca force o assunto da loja se a pergunta não for sobre ela.
- Seja educado, natural e converse como um atendente humano experiente.
- Responda sempre em português do Brasil.

SOBRE O PROJETO:
- A eCD é um e-commerce de CDs e produtos musicais.
- Possui produtos, carrinho, pedidos, cupons, trocas e recomendações.
- O backend é em Node.js com TypeScript e Sequelize.
- O frontend é em Angular.

CONTEXTO DO SISTEMA (use apenas se for relevante para a pergunta):
${context}
    `;

    try {
      
      if (!process.env.OPENAI_API_KEY) {
        return this.getFallbackResponse(message);
      }

      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message }
          ],
          temperature: 0.7,
          max_tokens: 900
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.choices[0].message.content.trim();
    } catch (error) {
      console.error('Erro ao chamar OpenAI:', error);
      return this.getFallbackResponse(message);
    }
  }

  private static async buildContext(clientId?: number): Promise<string> {

    const defaultCoupons = [
      { code: 'PROMO10', value: '10%', min: 'R$ 50' },
      { code: 'DESC20', value: '20%', min: 'R$ 100' },
      { code: 'FIXED15', value: 'R$ 15', min: 'R$ 30' },
      { code: 'COMPRA1', value: '30%', min: 'sem mínimo' },
      { code: '30FF', value: 'R$ 30', min: 'sem mínimo' }
    ];

    let context = `CUPONS DISPONÍVEIS:\n`;
    context += defaultCoupons
      .map(c => `- ${c.code}: ${c.value} de desconto (mínimo ${c.min})`)
      .join('\n');

    context += `\n\nINSTRUÇÕES PARA COMPRAR:\n`;
    context += `1. Escolha produtos na página Produtos\n`;
    context += `2. Adicione ao carrinho\n`;
    context += `3. Finalize a compra\n`;
    context += `4. Aplique cupom se desejar\n`;
    context += `5. Confirme o pagamento\n\n`;

    const products = await Product.findAll({
      where: { ativo: true },
      limit: 5,
      attributes: ['titulo', 'artista', 'categoria', 'valorVenda']
    });

    context += `PRODUTOS DISPONÍVEIS:\n`;
    context += products
      .map(p => `• ${p.titulo} - ${p.artista} (${p.categoria}) - R$ ${p.valorVenda}`)
      .join('\n');

    if (!clientId) {
      return context;
    }

    const orders = await Order.findAll({
      where: {
        clientId,
        status: { [Op.notIn]: ['CANCELADO', 'REPROVADA'] }
      },
      limit: 3,
      order: [['createdAt', 'DESC']]
    });

    const exchangeCoupons = await ExchangeCoupon.findAll({
      where: { clientId, used: false },
      limit: 5
    });

    context += `\n\nDADOS DO CLIENTE:\n`;
    context += `- Total de pedidos: ${orders.length}\n`;

    if (orders.length > 0) {
      context += `- Último pedido: #${orders[0].id} - Status: ${orders[0].status}\n`;
    }

    if (exchangeCoupons.length > 0) {
      context += `- Cupons de troca disponíveis: ${exchangeCoupons.map(c => c.code).join(', ')}\n`;
    }

    return context;
  }

  private static getFallbackResponse(message: string): string {
    return `Olá 🙂  
Posso conversar sobre qualquer assunto e também ajudar com a loja eCD.

Se quiser, posso:
• Recomendar CDs
• Informar preços e categorias
• Explicar como comprar
• Ajudar com pedidos, cupons e trocas

O que você gostaria de saber?`;
  }

}
