import { getLanguage, Language } from '../i18n';

// Datas no formato ISO (yyyy-mm-dd) sempre no fuso local do aparelho.
// Evita toISOString(), que usa UTC e "pula" de dia à noite no Brasil.

const MONTHS: Record<Language, string[]> = {
  pt: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  es: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
};
const MONTHS_LONG: Record<Language, string[]> = {
  pt: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  es: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
};
const WEEKDAYS_SHORT: Record<Language, string[]> = {
  pt: ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'],
  en: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
  es: ['D', 'L', 'M', 'X', 'J', 'V', 'S'],
};

export const monthsShort = (language = getLanguage()) => MONTHS[language];
export const monthsLong = () => MONTHS_LONG[getLanguage()];
export const weekdaysShort = () => WEEKDAYS_SHORT[getLanguage()];

const pad = (n: number) => String(n).padStart(2, '0');

export const toISODate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const parseISODate = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d, 12); // meio-dia: imune a horário de verão
};

export const todayISO = () => toISODate(new Date());

export function addDaysISO(iso: string, days: number) {
  const d = parseISODate(iso);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

export const diffDays = (from: string, to: string) =>
  Math.round((parseISODate(to).getTime() - parseISODate(from).getTime()) / 86_400_000);

// Em inglês o mês vem antes do dia ("Oct 19"); em português e espanhol, depois ("19 Out").
const dayMonth = (day: number, month: string) => (getLanguage() === 'en' ? `${month} ${day}` : `${day} ${month}`);

export function formatShortDate(iso: string) {
  const d = parseISODate(iso);
  return dayMonth(d.getDate(), monthsShort()[d.getMonth()]);
}

// "19 – 21 Out" / "Oct 19 – 21", ou "30 Out – 2 Nov" quando muda o mês
export function formatDateRange(start: string, days: number) {
  if (days <= 1) return formatShortDate(start);
  const a = parseISODate(start);
  const b = parseISODate(addDaysISO(start, days - 1));
  if (a.getMonth() === b.getMonth()) {
    const month = monthsShort()[b.getMonth()];
    return getLanguage() === 'en' ? `${month} ${a.getDate()} – ${b.getDate()}` : `${a.getDate()} – ${b.getDate()} ${month}`;
  }
  return `${formatShortDate(start)} – ${formatShortDate(toISODate(b))}`;
}
