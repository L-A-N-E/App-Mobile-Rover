import { Router } from 'express';

import { config } from '../config.js';
import { distanceKm, geocode } from '../geocode.js';
import { chat } from '../ollama.js';
import { CATEGORIES, suggestionsPrompt, suggestionsSchema } from '../prompts.js';
import { parseSuggestions } from '../validation.js';

export const suggestionsRouter = Router();

type RawSuggestion = {
  name?: unknown;
  category?: unknown;
  durationMin?: unknown;
  reason?: unknown;
  outdoor?: unknown;
  lat?: unknown;
  lng?: unknown;
};

const MAX_DISTANCE_KM = 40; // sugestões mais longe que isso do centro da cidade são descartadas

const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

// POST /api/suggestions → { suggestions: [{ name, category, durationMin, reason, lat, lng, approximate }] }
suggestionsRouter.post('/', async (req, res) => {
  const request = parseSuggestions(req.body);
  const center = { lat: request.city.lat, lng: request.city.lng };

  // Pede um a mais porque parte pode ser descartada (repetido, inexistente ou fora da cidade).
  // Com geocoding ligado, o modelo não precisa estimar coordenadas (menos tokens = resposta mais rápida).
  const withCoords = !config.geocoding;
  const startedAt = Date.now();
  const content = await chat([{ role: 'user', content: suggestionsPrompt({ ...request, count: request.count + 1 }, withCoords) }], {
    temperature: 0.4,
    format: suggestionsSchema(withCoords),
  });

  const llmDoneAt = Date.now();

  let raw: RawSuggestion[] = [];
  try {
    raw = (JSON.parse(content) as { suggestions?: RawSuggestion[] }).suggestions ?? [];
  } catch {
    console.error('[suggestions] JSON inválido do modelo:', content.slice(0, 300));
  }

  const seen = new Set(request.existing.map(normalize));
  const results = [];

  for (const s of raw) {
    if (results.length >= request.count) break;
    if (typeof s.name !== 'string' || !s.name.trim()) continue;
    const name = s.name.trim().slice(0, 80);
    const key = normalize(name);
    if (!key || seen.has(key)) continue;
    seen.add(key);

    const category = CATEGORIES.includes(s.category as (typeof CATEGORIES)[number]) ? (s.category as string) : 'Cultura';
    const durationMin = Math.min(180, Math.max(20, Math.round(Number(s.durationMin) || 60)));
    const reason = typeof s.reason === 'string' ? s.reason.trim().slice(0, 200) : '';

    // 1) coordenada real (OpenStreetMap). Se o mapa diz que o lugar não existe, descartamos:
    //    modelos pequenos às vezes inventam nomes.
    // 2) sem internet/geocoding desligado: usa a estimativa do modelo, se plausível.
    const geo = await geocode(name, center);
    if (geo.status === 'not_found') continue;
    const estimated = typeof s.lat === 'number' && typeof s.lng === 'number' ? { lat: s.lat, lng: s.lng } : null;
    const position = geo.status === 'found' ? geo.position : estimated;
    if (!position || distanceKm(position, center) > MAX_DISTANCE_KM) continue;

    const outdoor = typeof s.outdoor === 'boolean' ? s.outdoor : category === 'Natureza';
    results.push({ name, category, durationMin, reason, outdoor, ...position, approximate: geo.status !== 'found' });
  }

  console.log(
    `[suggestions] ${request.city.name}: ${results.length}/${raw.length} aceitas | IA ${((llmDoneAt - startedAt) / 1000).toFixed(1)}s | mapa ${((Date.now() - llmDoneAt) / 1000).toFixed(1)}s`,
  );
  res.json({ suggestions: results });
});
