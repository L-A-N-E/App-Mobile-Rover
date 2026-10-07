import type { ChatContext, Language, SuggestionRequest } from './validation.js';

const LANGUAGE_NAMES: Record<Language, string> = {
  pt: 'português do Brasil',
  en: 'inglês (English)',
  es: 'espanhol (español)',
};

export const CATEGORIES = ['Cultura', 'Gastronomia', 'Natureza', 'Vida Noturna'] as const;

function describeItinerary(ctx: ChatContext) {
  if (!ctx.trip) return 'O usuário ainda não tem uma viagem planejada.';
  const { trip } = ctx;
  const days = trip.days
    .map((d, i) => {
      const stops = d.length ? d.map((s) => `${s.start} ${s.name} (${s.category})`).join('; ') : 'dia livre';
      const weather = trip.weather?.[i] ? ` [previsão: ${trip.weather[i]}]` : '';
      return `Dia ${i + 1}${weather}: ${stops}`;
    })
    .join('\n');
  return `Viagem atual: "${trip.title}" em ${trip.city}, ${trip.country}, começando em ${trip.startDate}.\nRoteiro:\n${days}`;
}

// Mantido curto de propósito: cada token do prompt custa tempo para o modelo local processar.
export function chatSystemPrompt(ctx: ChatContext) {
  return [
    `Você é o assistente de viagem do app Rover. Responda SEMPRE em ${LANGUAGE_NAMES[ctx.language]}, em texto simples (sem markdown), com no máximo 4 frases curtas.`,
    'Use o roteiro e a previsão do tempo abaixo (dados reais). Atividades marcadas (ar livre) são afetadas por chuva, calor ou vento. Em imprevistos (chuva, trânsito, cansaço), sugira trocas concretas por lugares reais próximos e diga o horário. Na chuva, prefira locais cobertos.',
    'Não invente preços nem horários de funcionamento. Se a pergunta não for sobre viagem, diga que ajuda com o roteiro.',
    `Usuário: ${ctx.userName || 'viajante'}.`,
    describeItinerary(ctx),
  ].join('\n');
}

export function suggestionsPrompt(req: SuggestionRequest, withCoords: boolean) {
  const interests = req.interests.length ? req.interests.join(', ') : 'variados';
  const avoid = req.existing.length ? req.existing.join('; ') : 'nenhum';
  return [
    `Sugira ${req.count} lugares REAIS e conhecidos para visitar em ${req.city.name}, ${req.city.country}.`,
    `Interesses do viajante: ${interests}.`,
    `NÃO repita estes lugares que já estão no roteiro: ${avoid}.`,
    `Cada lugar deve ter: name (nome oficial do lugar, como aparece em mapas), category (uma de: ${CATEGORIES.join(', ')}),`,
    `durationMin (tempo médio de visita em minutos, entre 20 e 180), outdoor (true se a visita é ao ar livre, false se é em local coberto) e reason (no máximo 12 palavras, em ${LANGUAGE_NAMES[req.language]}, dizendo por que vale a pena).`,
    withCoords
      ? `Inclua também lat e lng aproximados; a cidade fica perto de ${req.city.lat.toFixed(3)}, ${req.city.lng.toFixed(3)}.`
      : '',
    'Responda apenas com o JSON pedido.',
  ]
    .filter(Boolean)
    .join('\n');
}

export function suggestionsSchema(withCoords: boolean) {
  const coords = withCoords ? { lat: { type: 'number' }, lng: { type: 'number' } } : {};
  return {
    type: 'object',
    properties: {
      suggestions: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            category: { type: 'string', enum: [...CATEGORIES] },
            durationMin: { type: 'integer' },
            reason: { type: 'string' },
            outdoor: { type: 'boolean' },
            ...coords,
          },
          required: ['name', 'category', 'durationMin', 'reason', 'outdoor', ...Object.keys(coords)],
        },
      },
    },
    required: ['suggestions'],
  };
}
