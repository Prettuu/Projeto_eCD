import express from 'express';
import cors from 'cors';
import { sequelize } from './config/database';
import { Client } from './models/Client';

const app = express();

app.use(cors());
app.use(express.json());

sequelize.sync({ alter: true }).then(() => {
  console.log('✅ Banco sincronizado com sucesso');
}).catch((err) => {
  console.error('❌ Erro ao sincronizar o banco:', err);
});

app.get('/', (req, res) => {
  res.send('API funcionando 🚀');
});

app.get('/api/clients', async (req, res) => {
  const clients = await Client.findAll();
  res.json(clients);
});

app.post('/api/clients', async (req, res) => {
  const client = await Client.create(req.body);
  res.json(client);
});

app.put('/api/clients/:id', async (req, res) => {
  const { id } = req.params;
  await Client.update(req.body, { where: { id } });
  res.json({ message: 'Cliente atualizado com sucesso' });
});

app.delete('/api/clients/:id', async (req, res) => {
  const { id } = req.params;
  await Client.destroy({ where: { id } });
  res.json({ message: 'Cliente excluído com sucesso' });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(` Servidor rodando em http://localhost:${PORT}`);
});
