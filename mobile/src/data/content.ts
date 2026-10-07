import { t } from '../i18n';
import { getPlacesByCity } from './catalog';

export const premiumPrice = () => t('premium.price');

export const premiumBenefits = () =>
  [
    { icon: 'creation-outline', title: t('premium.b1.title'), text: t('premium.b1.text') },
    { icon: 'chat-processing-outline', title: t('premium.b2.title'), text: t('premium.b2.text') },
    { icon: 'map-marker-star-outline', title: t('premium.b3.title'), text: t('premium.b3.text') },
    { icon: 'cancel', title: t('premium.b4.title'), text: t('premium.b4.text') },
  ] as const;

export type ChatMessage = {
  id: string;
  from: 'bot' | 'user';
  text: string;
};

export const chatSuggestions = () => [t('chat.s1'), t('chat.s2'), t('chat.s3'), t('chat.s4')];

// Respostas simuladas até a integração com a IA. Reconhece palavras-chave nos três idiomas.
export function getBotReply(question: string, cityId: string, cityName: string): string {
  const q = question.toLowerCase();
  const has = (...words: string[]) => words.some((w) => q.includes(w));
  const cityPlaces = getPlacesByCity(cityId);

  if (has('chov', 'chuva', 'rain', 'lluev', 'lluvia')) {
    const indoor = cityPlaces.filter((pl) => pl.category === 'Cultura').slice(0, 2).map((pl) => pl.name);
    return t('bot.rain', { places: indoor.join(t('common.and')) });
  }
  if (has('trânsito', 'transito', 'traffic', 'tráfico', 'trafico')) {
    return t('bot.traffic', { city: cityName });
  }
  if (has('jantar', 'comer', 'restaurante', 'dinner', 'eat', 'restaurant', 'cenar')) {
    const food = cityPlaces.find((pl) => pl.category === 'Gastronomia');
    return food ? t('bot.dinner', { place: food.name }) : t('bot.dinnerNone');
  }
  if (has('otimiz', 'rota', 'optimi', 'route', 'ruta')) {
    return t('bot.optimize');
  }
  return t('bot.default', { city: cityName });
}
