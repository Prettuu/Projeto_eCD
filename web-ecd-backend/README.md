# WEB-ECD Backend (Acadêmico)

Backend mínimo em Node.js + TypeScript + Sequelize + MySQL para conectar o projeto Angular.

## Pré-requisitos
- Node 18+
- MySQL rodando localmente (XAMPP/WAMP/Docker)
  - DB: `web_ecd`
  - Host: `127.0.0.1`
  - Porta: `3306`
  - User: `root`
  - Pass: (vazio) — ajuste no arquivo `.env` se necessário

## Como rodar
```bash
npm install
npm run dev
```
A API sobe em `http://localhost:3000`

### Rotas
- `GET    /clients`
- `GET    /clients/:id`
- `POST   /clients`        (body: { nome, email, cpf, ativo? })
- `PUT    /clients/:id`
- `DELETE /clients/:id`
