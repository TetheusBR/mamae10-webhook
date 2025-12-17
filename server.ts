// server.ts
import express from 'express';
import { kiwifyRouter } from './src/services/webhooks/kiwify';
import { caktoRouter } from './src/services/webhooks/cakto';

const app = express();
const PORT = process.env.PORT || 4000;

// middlewares globais de body
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// rotas de webhook
app.use('/webhooks', kiwifyRouter);
app.use('/webhooks', caktoRouter);

// rota de teste
app.get('/', (_req, res) => {
  res.send('Servidor Mamãe10 online');
});

// inicia o servidor
app.listen(PORT, () => {
  console.log(`Servidor de webhooks rodando na porta ${PORT}`);
});
