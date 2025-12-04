import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import authRoutes from "./routes/auth.routes";
import setupRoutes from "./routes/setup.routes";
import productsRoutes from "./routes/products.routes";
import ordersRoutes from "./routes/orders.routes";
import exchangesRoutes from "./routes/exchanges.routes";
import exchangeCouponsRoutes from "./routes/exchange-coupons.routes";
import returnsRoutes from "./routes/returns.routes";
import cartRoutes from "./routes/cart.routes";
import analysisRoutes from "./routes/analysis.routes";
import notificationsRoutes from "./routes/notifications.routes";
import recommendationsRoutes from "./routes/recommendations.routes";
import chatbotRoutes from "./routes/chatbot.routes";
import feedbackRoutes from "./routes/feedback.routes";
import { ClientController } from './controllers/ClientController';
import { sequelize } from './config/database';
import { User } from './models/User';
import { Product } from './models/Product';
import { Order } from './models/Order';
import { OrderItem } from './models/OrderItem';
import { Exchange } from './models/Exchange';
import { ExchangeItem } from './models/ExchangeItem';
import { ExchangeCoupon } from './models/ExchangeCoupon';
import { Return } from './models/Return';
import { ReturnItem } from './models/ReturnItem';
import { CartItem } from './models/CartItem';
import { Notification } from './models/Notification';
import { Feedback } from './models/Feedback';


Order.hasMany(OrderItem, {
  foreignKey: 'orderId',
  as: 'items',
});

OrderItem.belongsTo(Order, {
  foreignKey: 'orderId',
  as: 'order',
});

OrderItem.belongsTo(Product, {
  foreignKey: 'productId',
  as: 'product',
});

Exchange.belongsTo(Order, {
  foreignKey: 'orderId',
  as: 'order',
});

Exchange.hasMany(ExchangeItem, {
  foreignKey: 'exchangeId',
  as: 'items',
});

ExchangeItem.belongsTo(Exchange, {
  foreignKey: 'exchangeId',
  as: 'exchange',
});

ExchangeItem.belongsTo(OrderItem, {
  foreignKey: 'orderItemId',
  as: 'orderItem',
});

Return.belongsTo(Order, {
  foreignKey: 'orderId',
  as: 'order',
});

Return.hasMany(ReturnItem, {
  foreignKey: 'returnId',
  as: 'items',
});

ReturnItem.belongsTo(Return, {
  foreignKey: 'returnId',
  as: 'return',
});

ReturnItem.belongsTo(OrderItem, {
  foreignKey: 'orderItemId',
  as: 'orderItem',
});

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/setup", setupRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/exchanges", exchangesRoutes);
app.use("/api/exchange-coupons", exchangeCouponsRoutes);
app.use("/api/returns", returnsRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/analysis", analysisRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/recommendations", recommendationsRoutes);
app.use("/api/chatbot", chatbotRoutes);
app.use("/api/feedback", feedbackRoutes);

app.get('/', (req, res) => {
  res.send('API funcionando 🚀');
});

app.get('/api/clients', ClientController.getAll);
app.get('/api/clients/:id', ClientController.getById);
app.post('/api/clients', ClientController.create);
app.put('/api/clients/:id', ClientController.update);
app.delete('/api/clients/:id', ClientController.delete);

const PORT = 3000;

app.listen(PORT, () => {
  console.log(` Servidor rodando em http://localhost:${PORT}`);
  
  sequelize
    .sync({ alter: false })
    .then(() => {
      console.log('✅ Banco sincronizado com sucesso');
      
      const { ProductAutoInactivationJob } = require('./jobs/productAutoInactivationJob');
      ProductAutoInactivationJob.start();
    })
    .catch((err) => {
      if (err.code === 'ER_TOO_MANY_KEYS') {
        console.warn(' Aviso: Limite de índices na tabela Users. Operação continua normalmente.');
      } else {
        console.error(' Erro ao sincronizar banco:', err.message);
      }
    });
});

export default app;
