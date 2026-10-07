import Constants from 'expo-constants';
import { fetch as streamingFetch } from 'expo/fetch';

import { Category } from '../data/catalog';
import { Language } from '../i18n';

// Cliente da API do Rover (pasta /backend), que roda o Llama localmente via Ollama.

const API_PORT = 3333;

// O celular não enxerga o "localhost" do PC. Em desenvolvimento, usamos o mesmo IP
// pelo qual o Expo Go carregou o app (hostUri). Dá para sobrescrever com EXPO_PUBLIC_API_URL.
function resolveApiUrl() {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  const host = Constants.expoConfig?.hostUri?.split(':')[0];
  return `http://${host || 'localhost'}:${API_PORT}`;
}

export const API_URL = resolveApiUrl();

// AbortSignal.timeout não existe em todas as versões do Hermes.
function timeoutSignal(ms: number) {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), ms);
  return controller.signal;
}

export type AiHealth = { ok: boolean; model?: string };

export async function checkAiHealth(): Promise<AiHealth> {
  try {
    const res = await fetch(`${API_URL}/api/health`, { signal: timeoutSignal(4000) });
    const data = (await res.json()) as { ok: boolean; model: string };
    return { ok: Boolean(data.ok), model: data.model };
  } catch {
    return { ok: false };
  }
}

export type AiSuggestion = {
  name: string;
  category: Category;
  durationMin: number;
  reason: string;
  outdoor: boolean;
  lat: number;
  lng: number;
  approximate: boolean;
};

type SuggestionParams = {
  city: { name: string; country: string; lat: number; lng: number };
  existing: string[];
  interests: string[];
  language: Language; // idioma das justificativas (reason)
  count?: number;
};

export async function fetchSuggestions(params: SuggestionParams, signal?: AbortSignal): Promise<AiSuggestion[]> {
  const res = await fetch(`${API_URL}/api/suggestions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ count: 4, ...params }),
    signal,
  });
  if (!res.ok) throw new Error(`API respondeu ${res.status}`);
  const data = (await res.json()) as { suggestions: AiSuggestion[] };
  return data.suggestions;
}

export type ChatTurn = { role: 'user' | 'assistant'; content: string };

// language: idioma em que o assistente deve responder.
export type ChatContext = { userName: string; language: Language; trip?: ChatTripContext };

export type ChatTripContext = {
  title: string;
  city: string;
  country: string;
  startDate: string;
  days: { name: string; category: string; start: string }[][];
  weather?: string[];
};

// Envia a conversa e chama onDelta a cada pedaço de texto gerado pelo modelo.
export async function streamChat(
  body: { messages: ChatTurn[]; context: ChatContext },
  onDelta: (text: string) => void,
  signal?: AbortSignal,
): Promise<void> {
  const res = await streamingFetch(`${API_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  });
  if (!res.ok || !res.body) throw new Error(`API respondeu ${res.status}`);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let newline: number;
    while ((newline = buffer.indexOf('\n')) >= 0) {
      const line = buffer.slice(0, newline).trim();
      buffer = buffer.slice(newline + 1);
      if (!line) continue;
      const event = JSON.parse(line) as { type: 'delta' | 'done' | 'error'; text?: string; message?: string };
      if (event.type === 'delta' && event.text) onDelta(event.text);
      if (event.type === 'error') throw new Error(event.message);
    }
  }
}

// O modelo às vezes usa markdown mesmo pedindo texto simples; o Text do RN não renderiza.
export const stripMarkdown = (text: string) => text.replace(/\*\*|__|`/g, '').replace(/^#+\s*/gm, '');

// Pede ao backend para pré-processar o contexto da viagem (fica em cache no Ollama),
// para a primeira resposta do chat chegar mais rápido.
export function warmupChat(context: ChatContext) {
  fetch(`${API_URL}/api/chat/warmup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ context }),
  }).catch(() => {});
}
