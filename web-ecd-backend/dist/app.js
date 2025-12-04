"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const setup_routes_1 = __importDefault(require("./routes/setup.routes"));
const products_routes_1 = __importDefault(require("./routes/products.routes"));
const orders_routes_1 = __importDefault(require("./routes/orders.routes"));
const exchanges_routes_1 = __importDefault(require("./routes/exchanges.routes"));
const exchange_coupons_routes_1 = __importDefault(require("./routes/exchange-coupons.routes"));
const returns_routes_1 = __importDefault(require("./routes/returns.routes"));
const cart_routes_1 = __importDefault(require("./routes/cart.routes"));
const analysis_routes_1 = __importDefault(require("./routes/analysis.routes"));
const notifications_routes_1 = __importDefault(require("./routes/notifications.routes"));
const recommendations_routes_1 = __importDefault(require("./routes/recommendations.routes"));
const chatbot_routes_1 = __importDefault(require("./routes/chatbot.routes"));
const feedback_routes_1 = __importDefault(require("./routes/feedback.routes"));
const ClientController_1 = require("./controllers/ClientController");
const database_1 = require("./config/database");
const Product_1 = require("./models/Product");
const Order_1 = require("./models/Order");
const OrderItem_1 = require("./models/OrderItem");
const Exchange_1 = require("./models/Exchange");
const ExchangeItem_1 = require("./models/ExchangeItem");
const Return_1 = require("./models/Return");
const ReturnItem_1 = require("./models/ReturnItem");
Order_1.Order.hasMany(OrderItem_1.OrderItem, {
    foreignKey: 'orderId',
    as: 'items',
});
OrderItem_1.OrderItem.belongsTo(Order_1.Order, {
    foreignKey: 'orderId',
    as: 'order',
});
OrderItem_1.OrderItem.belongsTo(Product_1.Product, {
    foreignKey: 'productId',
    as: 'product',
});
Exchange_1.Exchange.belongsTo(Order_1.Order, {
    foreignKey: 'orderId',
    as: 'order',
});
Exchange_1.Exchange.hasMany(ExchangeItem_1.ExchangeItem, {
    foreignKey: 'exchangeId',
    as: 'items',
});
ExchangeItem_1.ExchangeItem.belongsTo(Exchange_1.Exchange, {
    foreignKey: 'exchangeId',
    as: 'exchange',
});
ExchangeItem_1.ExchangeItem.belongsTo(OrderItem_1.OrderItem, {
    foreignKey: 'orderItemId',
    as: 'orderItem',
});
Return_1.Return.belongsTo(Order_1.Order, {
    foreignKey: 'orderId',
    as: 'order',
});
Return_1.Return.hasMany(ReturnItem_1.ReturnItem, {
    foreignKey: 'returnId',
    as: 'items',
});
ReturnItem_1.ReturnItem.belongsTo(Return_1.Return, {
    foreignKey: 'returnId',
    as: 'return',
});
ReturnItem_1.ReturnItem.belongsTo(OrderItem_1.OrderItem, {
    foreignKey: 'orderItemId',
    as: 'orderItem',
});
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use("/api/auth", auth_routes_1.default);
app.use("/api/setup", setup_routes_1.default);
app.use("/api/products", products_routes_1.default);
app.use("/api/orders", orders_routes_1.default);
app.use("/api/exchanges", exchanges_routes_1.default);
app.use("/api/exchange-coupons", exchange_coupons_routes_1.default);
app.use("/api/returns", returns_routes_1.default);
app.use("/api/cart", cart_routes_1.default);
app.use("/api/analysis", analysis_routes_1.default);
app.use("/api/notifications", notifications_routes_1.default);
app.use("/api/recommendations", recommendations_routes_1.default);
app.use("/api/chatbot", chatbot_routes_1.default);
app.use("/api/feedback", feedback_routes_1.default);
app.get('/', (req, res) => {
    res.send('API funcionando 🚀');
});
app.get('/api/clients', ClientController_1.ClientController.getAll);
app.get('/api/clients/:id', ClientController_1.ClientController.getById);
app.post('/api/clients', ClientController_1.ClientController.create);
app.put('/api/clients/:id', ClientController_1.ClientController.update);
app.delete('/api/clients/:id', ClientController_1.ClientController.delete);
const PORT = 3000;
app.listen(PORT, () => {
    console.log(` Servidor rodando em http://localhost:${PORT}`);
    database_1.sequelize
        .sync({ alter: false })
        .then(() => {
        console.log('✅ Banco sincronizado com sucesso');
        const { ProductAutoInactivationJob } = require('./jobs/productAutoInactivationJob');
        ProductAutoInactivationJob.start();
    })
        .catch((err) => {
        if (err.code === 'ER_TOO_MANY_KEYS') {
            console.warn(' Aviso: Limite de índices na tabela Users. Operação continua normalmente.');
        }
        else {
            console.error(' Erro ao sincronizar banco:', err.message);
        }
    });
});
exports.default = app;
