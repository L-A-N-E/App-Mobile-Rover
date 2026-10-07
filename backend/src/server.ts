import cors from 'cors';
import express, { NextFunction, Request, Response } from 'express';
import { networkInterfaces } from 'node:os';

import { config } from './config.js';
import { health } from './ollama.js';
import { chatRouter } from './routes/chat.js';
import { suggestionsRouter } from './routes/suggestions.js';
import { BadRequest } from './validation.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '100kb' }));

app.get('/api/health', async (_req, res) => {
  const status = await health();
  res.json({ ok: status.ollama && status.modelInstalled, model: config.model, ...status });
});

app.use('/api/chat', chatRouter);
app.use('/api/suggestions', suggestionsRouter);

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof BadRequest) {
    res.status(400).json({ error: err.message });
    return;
  }
  console.error(err);
  res.status(502).json({ error: 'Falha ao gerar resposta com a IA local. O Ollama está rodando?' });
});

const server = app.listen(config.port, '0.0.0.0', async () => {
  const lanIps = Object.values(networkInterfaces())
    .flat()
    .filter((n) => n && n.family === 'IPv4' && !n.internal)
    .map((n) => n!.address);

  console.log(`\n🧭 Rover API rodando na porta ${config.port}`);
  console.log(`   Local:  http://localhost:${config.port}/api/health`);
  lanIps.forEach((ip) => console.log(`   Rede:   http://${ip}:${config.port}`));

  const status = await health();
  if (!status.ollama) console.warn(`\n⚠️  Ollama não encontrado em ${config.ollamaUrl}. Instale/abra o Ollama.`);
  else if (!status.modelInstalled) console.warn(`\n⚠️  Modelo ${config.model} não instalado. Rode: ollama pull ${config.model}`);
  else console.log(`   Modelo: ${config.model} ✓\n`);
});

server.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ A porta ${config.port} já está em uso (outro backend rodando?). Feche-o ou defina PORT no .env.`);
    process.exit(1);
  }
  throw err;
});
