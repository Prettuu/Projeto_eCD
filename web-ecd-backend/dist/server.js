"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const database_1 = require("./config/database");
const Client_1 = require("./models/Client");
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
database_1.sequelize.sync({ alter: true }).then(() => {
    console.log('✅ Banco sincronizado com sucesso');
}).catch((err) => {
    console.error('❌ Erro ao sincronizar o banco:', err);
});
app.get('/', (req, res) => {
    res.send('API funcionando 🚀');
});
app.get('/api/clients', async (req, res) => {
    const clients = await Client_1.Client.findAll();
    res.json(clients);
});
app.post('/api/clients', async (req, res) => {
    const client = await Client_1.Client.create(req.body);
    res.json(client);
});
app.put('/api/clients/:id', async (req, res) => {
    const { id } = req.params;
    await Client_1.Client.update(req.body, { where: { id } });
    res.json({ message: 'Cliente atualizado com sucesso' });
});
app.delete('/api/clients/:id', async (req, res) => {
    const { id } = req.params;
    await Client_1.Client.destroy({ where: { id } });
    res.json({ message: 'Cliente excluído com sucesso' });
});
const PORT = 3000;
app.listen(PORT, () => {
    console.log(` Servidor rodando em http://localhost:${PORT}`);
});
