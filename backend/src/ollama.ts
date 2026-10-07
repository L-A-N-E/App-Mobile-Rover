import { config } from './config.js';

// Cliente mínimo da API do Ollama (https://github.com/ollama/ollama/blob/main/docs/api.md).

export type LlmMessage = { role: 'system' | 'user' | 'assistant'; content: string };

type ChatOptions = {
  temperature?: number;
  maxTokens?: number;
  format?: 'json' | Record<string, unknown>;
  signal?: AbortSignal;
};

const KEEP_ALIVE = '30m'; // mantém o modelo carregado na memória entre requisições
// Mesmo contexto em todas as chamadas: mudar o num_ctx força o Ollama a recarregar o modelo.
// 2048 é suficiente para o roteiro + histórico curto e ocupa menos VRAM.
const NUM_CTX = 2048;

function body(messages: LlmMessage[], stream: boolean, { temperature = 0.6, format, maxTokens }: ChatOptions) {
  return JSON.stringify({
    model: config.model,
    messages,
    stream,
    format,
    keep_alive: KEEP_ALIVE,
    options: { temperature, num_ctx: NUM_CTX, ...(maxTokens ? { num_predict: maxTokens } : {}) },
  });
}

async function post(messages: LlmMessage[], stream: boolean, options: ChatOptions) {
  const res = await fetch(`${config.ollamaUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body(messages, stream, options),
    signal: options.signal,
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Ollama respondeu ${res.status}: ${detail.slice(0, 200)}`);
  }
  return res;
}

export async function chat(messages: LlmMessage[], options: ChatOptions = {}): Promise<string> {
  const res = await post(messages, false, options);
  const data = (await res.json()) as { message?: { content?: string } };
  return data.message?.content ?? '';
}

// Gera os pedaços de texto conforme o modelo responde.
export async function* chatStream(messages: LlmMessage[], options: ChatOptions = {}): AsyncGenerator<string> {
  const res = await post(messages, true, options);
  if (!res.body) throw new Error('Ollama não retornou corpo de resposta');

  const decoder = new TextDecoder();
  let buffer = '';
  for await (const chunk of res.body) {
    buffer += decoder.decode(chunk, { stream: true });
    let newline: number;
    while ((newline = buffer.indexOf('\n')) >= 0) {
      const line = buffer.slice(0, newline).trim();
      buffer = buffer.slice(newline + 1);
      if (!line) continue;
      const part = JSON.parse(line) as { message?: { content?: string }; error?: string };
      if (part.error) throw new Error(part.error);
      if (part.message?.content) yield part.message.content;
    }
  }
}

export async function health() {
  try {
    const res = await fetch(`${config.ollamaUrl}/api/tags`, { signal: AbortSignal.timeout(3000) });
    const data = (await res.json()) as { models?: { name: string }[] };
    const names = (data.models ?? []).map((m) => m.name);
    const installed = names.some((n) => n === config.model || n === `${config.model}:latest`);
    return { ollama: true, modelInstalled: installed, models: names };
  } catch {
    return { ollama: false, modelInstalled: false, models: [] as string[] };
  }
}
