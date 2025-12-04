"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatbotService = void 0;
const axios_1 = __importDefault(require("axios"));
const Product_1 = require("../models/Product");
const Order_1 = require("../models/Order");
const ExchangeCoupon_1 = require("../models/ExchangeCoupon");
const sequelize_1 = require("sequelize");
class ChatbotService {
    static async generateResponse(message, clientId) {
        const context = await this.buildContext(clientId);
        const prompt = `Você é um assistente virtual especializado de uma loja de CDs. 
Seu papel é ajudar clientes com informações práticas e específicas sobre:
- Como fazer pedidos (passo a passo)
- Cupons disponíveis e como usar
- Status de pedidos
- Produtos e recomendações
- Categorias e preços

IMPORTANTE:
- Para perguntas simples e práticas: Seja DETALHADO e ESPECÍFICO, dê instruções passo a passo
- Para perguntas complexas ou fora do seu conhecimento: Diga educadamente que não possui conhecimento sobre o assunto
- Sempre seja útil e prestativo

Contexto do cliente:
${context}

Pergunta do cliente: ${message}

Responda de forma clara e útil:`;
        try {
            if (!process.env.OPENAI_API_KEY) {
                return this.getFallbackResponse(message);
            }
            const response = await axios_1.default.post('https://api.openai.com/v1/chat/completions', {
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: `Você é um assistente virtual especializado de uma loja de CDs. 
Você ajuda clientes com:
- Instruções passo a passo para fazer pedidos
- Informações sobre cupons disponíveis
- Status de pedidos e acompanhamento
- Recomendações de produtos
- Dúvidas sobre categorias e preços

Para perguntas simples: Seja DETALHADO e dê instruções claras.
Para perguntas complexas ou fora do seu conhecimento: Diga educadamente que não possui conhecimento sobre o assunto.
Sempre seja útil, amigável e prestativo.`
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: 800,
                temperature: 0.7
            }, {
                headers: {
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            });
            return response.data.choices[0].message.content.trim();
        }
        catch (error) {
            console.error('Erro ao chamar OpenAI:', error);
            return this.getFallbackResponse(message);
        }
    }
    static async buildContext(clientId) {
        const defaultCoupons = [
            { code: 'PROMO10', value: '10%', min: 'R$ 50' },
            { code: 'DESC20', value: '20%', min: 'R$ 100' },
            { code: 'FIXED15', value: 'R$ 15', min: 'R$ 30' },
            { code: 'COMPRA1', value: '30%', min: 'sem mínimo' },
            { code: '30FF', value: 'R$ 30', min: 'sem mínimo' }
        ];
        let context = `CUPONS DISPONÍVEIS:\n`;
        context += defaultCoupons.map(c => `- ${c.code}: ${c.value} de desconto (mínimo ${c.min})`).join('\n');
        context += `\n\nINSTRUÇÕES PARA FAZER PEDIDO:\n`;
        context += `1. Adicione produtos ao carrinho na página de Produtos\n`;
        context += `2. Vá para o Carrinho e revise seus itens\n`;
        context += `3. Clique em "Finalizar Compra"\n`;
        context += `4. Aplique um cupom (se tiver) no campo de cupom\n`;
        context += `5. Selecione forma de pagamento e confirme\n\n`;
        if (!clientId) {
            const products = await Product_1.Product.findAll({
                where: { ativo: true },
                limit: 5,
                attributes: ['titulo', 'artista', 'categoria']
            });
            context += `PRODUTOS DISPONÍVEIS: ${products.map(p => `${p.titulo} - ${p.artista}`).join(', ')}`;
            return context;
        }
        const orders = await Order_1.Order.findAll({
            where: {
                clientId,
                status: { [sequelize_1.Op.notIn]: ['CANCELADO', 'REPROVADA'] }
            },
            limit: 3,
            order: [['createdAt', 'DESC']]
        });
        const activeCoupons = await ExchangeCoupon_1.ExchangeCoupon.findAll({
            where: {
                clientId,
                used: false
            },
            limit: 5
        });
        const products = await Product_1.Product.findAll({
            where: { ativo: true },
            limit: 10,
            attributes: ['titulo', 'artista', 'categoria', 'valorVenda']
        });
        context += `HISTÓRICO DO CLIENTE:\n`;
        context += `- Pedidos anteriores: ${orders.length}\n`;
        if (orders.length > 0) {
            const lastOrder = orders[0];
            context += `- Último pedido: #${lastOrder.id} - Status: ${lastOrder.status}\n`;
        }
        if (activeCoupons.length > 0) {
            context += `- Cupons de troca disponíveis: ${activeCoupons.map(c => c.code).join(', ')}\n`;
        }
        context += `\nPRODUTOS DISPONÍVEIS: ${products.map(p => `${p.titulo} (${p.categoria}) - R$ ${p.valorVenda}`).join(', ')}`;
        return context;
    }
    static getFallbackResponse(message) {
        const lowerMessage = message.toLowerCase();
        if (lowerMessage.includes('como fazer') && (lowerMessage.includes('pedido') || lowerMessage.includes('compra'))) {
            return `Para fazer um pedido, siga estes passos:
1. Vá até a página "Produtos" e adicione os CDs desejados ao carrinho
2. Acesse o "Carrinho" no menu ou clique no ícone do carrinho
3. Revise os itens e clique em "Finalizar Compra"
4. Na página de checkout, você pode aplicar um cupom de desconto (se tiver)
5. Selecione a forma de pagamento e confirme o pedido
6. Aguarde a aprovação do administrador

Dica: Você pode usar cupons como PROMO10, DESC20 ou COMPRA1 para ter desconto!`;
        }
        if (lowerMessage.includes('cupom') || lowerMessage.includes('desconto') || lowerMessage.includes('promoção')) {
            return `Temos vários cupons disponíveis:
• PROMO10 - 10% de desconto (mínimo R$ 50)
• DESC20 - 20% de desconto (mínimo R$ 100)
• FIXED15 - R$ 15 de desconto (mínimo R$ 30)
• COMPRA1 - 30% de desconto (sem valor mínimo)
• 30FF - R$ 30 de desconto (sem valor mínimo)

Para usar: No checkout, digite o código do cupom no campo "Cupom de desconto" e clique em "Aplicar".`;
        }
        if (lowerMessage.includes('recomend') || lowerMessage.includes('sugest')) {
            return 'Baseado no seu histórico de compras, recomendo explorar CDs da mesma categoria dos seus pedidos anteriores. Você pode ver recomendações personalizadas na página inicial. Posso ajudar a encontrar algo específico!';
        }
        if (lowerMessage.includes('preço') || lowerMessage.includes('valor') || lowerMessage.includes('custo')) {
            return 'Os preços variam conforme o produto. Você pode ver todos os valores na página "Produtos". Quer que eu recomende algo dentro de um orçamento específico?';
        }
        if (lowerMessage.includes('status') && lowerMessage.includes('pedido')) {
            return 'Para ver o status do seu pedido, acesse a seção "Pedidos" no menu. Lá você verá todos os seus pedidos e seus respectivos status (PENDENTE, APROVADO, ENVIADO, ENTREGUE, etc.). Se tiver dúvida sobre um pedido específico, me informe o número!';
        }
        if (lowerMessage.includes('pedido') || lowerMessage.includes('compra')) {
            return 'Você pode acompanhar seus pedidos na seção "Pedidos" do menu. Lá você verá o histórico completo com status, valores e detalhes. Se precisar de ajuda com um pedido específico, me informe o número!';
        }
        if (lowerMessage.includes('categoria') || lowerMessage.includes('gênero') || lowerMessage.includes('estilo')) {
            return 'Temos várias categorias disponíveis: Rock, Pop, Sertanejo, Funk, Rap, Trap, MPB, Forró, Pagode, Samba, Eletrônica e muitas outras! Você pode filtrar por categoria na página de Produtos. Qual estilo você prefere?';
        }
        if (lowerMessage.includes('carrinho')) {
            return 'Para acessar seu carrinho, clique no ícone do carrinho no menu superior ou vá até "Carrinho" no menu. Lá você pode revisar os itens, alterar quantidades, aplicar cupons e finalizar a compra.';
        }
        if (lowerMessage.includes('pagamento') || lowerMessage.includes('pagar')) {
            return 'O pagamento é feito no checkout após adicionar produtos ao carrinho. Você pode escolher entre diferentes formas de pagamento disponíveis. O pedido será processado após a confirmação e aguardará aprovação do administrador.';
        }
        if (lowerMessage.includes('troca') || lowerMessage.includes('devolução')) {
            return 'Para solicitar troca ou devolução, acesse a seção "Pedidos", encontre o pedido desejado e clique em "Solicitar Troca". Você precisará informar os itens que deseja trocar e o motivo.';
        }
        const complexTopics = ['filosofia', 'política', 'ciência', 'história', 'matemática', 'física', 'química', 'biologia', 'medicina', 'direito', 'economia avançada'];
        const isComplex = complexTopics.some(topic => lowerMessage.includes(topic));
        if (isComplex) {
            return 'Desculpe, não possuo conhecimento sobre esse assunto. Sou especializado em ajudar com produtos, pedidos, cupons e informações sobre nossa loja de CDs. Como posso ajudar você com algo relacionado à loja?';
        }
        return 'Olá! Posso ajudar você com:\n• Como fazer pedidos (passo a passo)\n• Cupons disponíveis e como usar\n• Status de pedidos\n• Recomendações de produtos\n• Categorias e preços\n\nO que você gostaria de saber?';
    }
    static async searchProducts(query) {
        const products = await Product_1.Product.findAll({
            where: {
                ativo: true,
                estoque: { [sequelize_1.Op.gt]: 0 },
                [sequelize_1.Op.or]: [
                    { titulo: { [sequelize_1.Op.like]: `%${query}%` } },
                    { artista: { [sequelize_1.Op.like]: `%${query}%` } },
                    { categoria: { [sequelize_1.Op.like]: `%${query}%` } }
                ]
            },
            limit: 5,
            attributes: ['id', 'titulo', 'artista', 'categoria', 'valorVenda']
        });
        return products;
    }
}
exports.ChatbotService = ChatbotService;
