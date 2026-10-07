// Validação simples (sem dependências) dos corpos das requisições.

export class BadRequest extends Error {}

const str = (v: unknown, field: string, max = 200): string => {
  if (typeof v !== 'string' || !v.trim()) throw new BadRequest(`Campo "${field}" inválido`);
  return v.trim().slice(0, max);
};
const optStr = (v: unknown, max = 200) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const num = (v: unknown, field: string): number => {
  if (typeof v !== 'number' || !Number.isFinite(v)) throw new BadRequest(`Campo "${field}" inválido`);
  return v;
};

export type ChatMessage = { role: 'user' | 'assistant'; content: string };

// Idioma escolhido no app; o modelo responde nele.
export type Language = 'pt' | 'en' | 'es';
const parseLanguage = (v: unknown): Language => (v === 'en' || v === 'es' ? v : 'pt');

export type ChatContext = {
  userName: string;
  language: Language;
  trip?: {
    title: string;
    city: string;
    country: string;
    startDate: string;
    days: { name: string; category: string; start: string }[][];
    weather?: string[]; // resumo da previsão de cada dia (Open-Meteo, vindo do app)
  };
};

export function parseChat(body: unknown): { messages: ChatMessage[]; context: ChatContext } {
  const b = (body ?? {}) as Record<string, unknown>;
  if (!Array.isArray(b.messages) || !b.messages.length) throw new BadRequest('Envie ao menos uma mensagem');

  // histórico curto: cabe no contexto do modelo e deixa a resposta mais rápida
  const messages = b.messages.slice(-8).map((m, i) => {
    const msg = (m ?? {}) as Record<string, unknown>;
    if (msg.role !== 'user' && msg.role !== 'assistant') throw new BadRequest(`messages[${i}].role inválido`);
    return { role: msg.role, content: str(msg.content, `messages[${i}].content`, 1500) } as ChatMessage;
  });
  if (messages[messages.length - 1].role !== 'user') throw new BadRequest('A última mensagem deve ser do usuário');

  return { messages, context: parseChatContext(b.context) };
}

export function parseChatContext(raw: unknown): ChatContext {
  const ctx = (raw ?? {}) as Record<string, unknown>;
  const context: ChatContext = { userName: optStr(ctx.userName, 60), language: parseLanguage(ctx.language) };
  const trip = ctx.trip as Record<string, unknown> | undefined;
  if (trip && Array.isArray(trip.days)) {
    context.trip = {
      title: optStr(trip.title, 80),
      city: optStr(trip.city, 60),
      country: optStr(trip.country, 60),
      startDate: optStr(trip.startDate, 20),
      days: trip.days.slice(0, 10).map((day) =>
        (Array.isArray(day) ? day : []).slice(0, 15).map((s) => {
          const stop = (s ?? {}) as Record<string, unknown>;
          return { name: optStr(stop.name, 80), category: optStr(stop.category, 30), start: optStr(stop.start, 5) };
        }),
      ),
      weather: Array.isArray(trip.weather) ? trip.weather.slice(0, 10).map((w) => optStr(w, 120)) : undefined,
    };
  }
  return context;
}

export type SuggestionRequest = {
  city: { name: string; country: string; lat: number; lng: number };
  existing: string[];
  interests: string[];
  language: Language;
  count: number;
};

export function parseSuggestions(body: unknown): SuggestionRequest {
  const b = (body ?? {}) as Record<string, unknown>;
  const city = (b.city ?? {}) as Record<string, unknown>;
  const list = (v: unknown, max: number) =>
    (Array.isArray(v) ? v : []).filter((x): x is string => typeof x === 'string').slice(0, max).map((x) => x.slice(0, 80));
  const count = typeof b.count === 'number' ? Math.round(b.count) : 5;

  return {
    city: {
      name: str(city.name, 'city.name', 60),
      country: str(city.country, 'city.country', 60),
      lat: num(city.lat, 'city.lat'),
      lng: num(city.lng, 'city.lng'),
    },
    existing: list(b.existing, 40),
    interests: list(b.interests, 10),
    language: parseLanguage(b.language),
    count: Math.min(8, Math.max(1, count)),
  };
}
