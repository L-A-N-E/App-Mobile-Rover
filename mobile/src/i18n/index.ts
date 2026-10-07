import { en } from './en';
import { es } from './es';
import { pt } from './pt';

// Traduções do app. O idioma atual fica num módulo (não só no contexto) para que funções
// fora de componentes — datas, clima, validação — também traduzam. O LanguageProvider
// atualiza este valor antes de re-renderizar as telas.

export type Language = 'pt' | 'en' | 'es';
export type TranslationKey = keyof typeof pt;
export type Dictionary = Record<TranslationKey, string>;

// Chaves de plural: "x_one" / "x_other" viram a base "x".
type PluralBase = TranslationKey extends infer K ? (K extends `${infer B}_one` ? B : never) : never;

type Params = Record<string, string | number>;

export const LANGUAGES: Language[] = ['pt', 'en', 'es'];
export const languageNames: Record<Language, string> = { pt: 'Português (BR)', en: 'English', es: 'Español' };

const dictionaries: Record<Language, Dictionary> = { pt, en, es };

let current: Language = 'pt';

export const getLanguage = () => current;
export const setCurrentLanguage = (language: Language) => {
  current = language;
};

const interpolate = (text: string, params?: Params) =>
  params ? text.replace(/\{(\w+)\}/g, (match, name: string) => (name in params ? String(params[name]) : match)) : text;

export function t(key: TranslationKey, params?: Params): string {
  return interpolate(dictionaries[current][key] ?? pt[key], params);
}

// Plural: usa "<base>_one" para 1 e "<base>_other" para o resto. {count} já vem preenchido.
export function tn(base: PluralBase, count: number, params?: Params): string {
  const key = `${base}_${count === 1 ? 'one' : 'other'}` as TranslationKey;
  return t(key, { count, ...params });
}

// Idioma do aparelho, usado na primeira abertura do app.
export function deviceLanguage(): Language {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale.toLowerCase();
    if (locale.startsWith('es')) return 'es';
    if (locale.startsWith('en')) return 'en';
  } catch {
    // Intl indisponível: segue em português
  }
  return 'pt';
}
