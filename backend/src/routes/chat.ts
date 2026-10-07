import { Router } from 'express';

import { chat, chatStream } from '../ollama.js';
import { chatSystemPrompt } from '../prompts.js';
import { parseChat, parseChatContext } from '../validation.js';

export const chatRouter = Router();

// POST /api/chat
// Resposta em NDJSON (uma linha JSON por evento) para o app exibir o texto enquanto é gerado:
//   {"type":"delta","text":"..."}  ...  {"type":"done"}   ou   {"type":"error","message":"..."}
chatRouter.post('/', async (req, res) => {
  const { messages, context } = parseChat(req.body);

  const abort = new AbortController();
  res.on('close', () => abort.abort()); // usuário saiu da tela / cancelou

  res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache');
  res.flushHeaders();

  const send = (event: object) => res.write(`${JSON.stringify(event)}\n`);

  try {
    const stream = chatStream([{ role: 'system', content: chatSystemPrompt(context) }, ...messages], {
      temperature: 0.6,
      signal: abort.signal,
    });
    for await (const text of stream) send({ type: 'delta', text });
    send({ type: 'done' });
  } catch (err) {
    if (!abort.signal.aborted) {
      console.error('[chat]', err);
      send({ type: 'error', message: 'Não consegui falar com o modelo de IA agora.' });
    }
  } finally {
    res.end();
  }
});

// POST /api/chat/warmup  { context }
// Processa o prompt de sistema (instruções + roteiro) antes do usuário perguntar. O Ollama
// reaproveita esse prefixo em cache, e a primeira resposta do chat chega bem mais rápido.
chatRouter.post('/warmup', (req, res) => {
  const context = parseChatContext(req.body?.context);
  res.status(202).json({ ok: true });
  chat([{ role: 'system', content: chatSystemPrompt(context) }], { maxTokens: 1 }).catch((err) =>
    console.warn('[chat] aquecimento falhou:', (err as Error).message),
  );
});
