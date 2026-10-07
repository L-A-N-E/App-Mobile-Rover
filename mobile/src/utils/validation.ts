import { t } from '../i18n';

// Regras de validação do login e cadastro (usadas na tela e no AuthContext).
// Mensagens traduzidas na hora em que são pedidas, no idioma atual.

export const PASSWORD_MIN_LENGTH = 8;

export type PasswordRule = { id: string; readonly label: string; test: (password: string) => boolean };

export const passwordRules: PasswordRule[] = [
  { id: 'length', get label() { return t('val.rule.length', { count: PASSWORD_MIN_LENGTH }); }, test: (p) => p.length >= PASSWORD_MIN_LENGTH },
  { id: 'upper', get label() { return t('val.rule.upper'); }, test: (p) => /[A-ZÀ-Ý]/.test(p) },
  { id: 'lower', get label() { return t('val.rule.lower'); }, test: (p) => /[a-zß-ÿ]/.test(p) },
  { id: 'number', get label() { return t('val.rule.number'); }, test: (p) => /\d/.test(p) },
  { id: 'symbol', get label() { return t('val.rule.symbol'); }, test: (p) => /[^A-Za-zÀ-ÿ0-9\s]/.test(p) },
];

// Senhas muito comuns são recusadas mesmo cumprindo as regras.
const COMMON_PASSWORDS = new Set([
  '12345678', '123456789', 'password', 'password1', 'senha123', 'senha@123', 'qwerty123', 'abc12345',
  'iloveyou', 'admin123', 'password@1', 'Password1!', 'Senha@123', 'Senha123!', 'Qwerty@123', 'Mudar@123',
].map((p) => p.toLowerCase()));

export type PasswordStrength = { score: 0 | 1 | 2 | 3 | 4; label: string };

export function passwordStrength(password: string): PasswordStrength {
  if (!password) return { score: 0, label: '' };
  const passed = passwordRules.filter((r) => r.test(password)).length;
  let score = passed <= 2 ? 1 : passed <= 4 ? 2 : 3;
  if (passed === passwordRules.length && password.length >= 12) score = 4;
  if (COMMON_PASSWORDS.has(password.toLowerCase()) || /(.)\1{3,}/.test(password)) score = 1;
  const labels = ['', t('val.strength.1'), t('val.strength.2'), t('val.strength.3'), t('val.strength.4')];
  return { score: score as PasswordStrength['score'], label: labels[score] };
}

type PasswordContext = { name?: string; email?: string };

// Retorna a mensagem do primeiro problema encontrado, ou null se a senha é válida.
export function validatePassword(password: string, ctx: PasswordContext = {}): string | null {
  if (!password) return t('val.pw.empty');
  if (/\s/.test(password)) return t('val.pw.spaces');
  const failed = passwordRules.find((r) => !r.test(password));
  if (failed) return t('val.pw.needs', { rule: failed.label.toLowerCase() });
  if (COMMON_PASSWORDS.has(password.toLowerCase())) return t('val.pw.common');
  if (/(.)\1{3,}/.test(password)) return t('val.pw.repeat');

  const lower = password.toLowerCase();
  const emailUser = ctx.email?.split('@')[0]?.toLowerCase();
  if (emailUser && emailUser.length >= 3 && lower.includes(emailUser)) return t('val.pw.email');
  const firstName = ctx.name?.trim().split(/\s+/)[0]?.toLowerCase();
  if (firstName && firstName.length >= 3 && lower.includes(firstName)) return t('val.pw.name');
  return null;
}

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

const EMAIL_REGEX = /^[a-z0-9._%+-]+@[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/i;

export function validateEmail(email: string): string | null {
  const value = normalizeEmail(email);
  if (!value) return t('val.email.empty');
  if (!EMAIL_REGEX.test(value) || value.includes('..')) return t('val.email.invalid');
  return null;
}

// Erros de digitação comuns em domínios: sugere a correção ("Você quis dizer gmail.com?").
const DOMAIN_TYPOS: Record<string, string> = {
  'gmial.com': 'gmail.com', 'gmai.com': 'gmail.com', 'gmail.co': 'gmail.com', 'gamil.com': 'gmail.com',
  'gmail.com.br': 'gmail.com', 'hotmal.com': 'hotmail.com', 'hotmail.co': 'hotmail.com', 'hotmai.com': 'hotmail.com',
  'outlok.com': 'outlook.com', 'outloo.com': 'outlook.com', 'yaho.com': 'yahoo.com', 'yahoo.com.b': 'yahoo.com.br',
  'icloud.co': 'icloud.com',
};

export function suggestEmail(email: string): string | null {
  const value = normalizeEmail(email);
  const [user, domain] = value.split('@');
  if (!user || !domain) return null;
  const fix = DOMAIN_TYPOS[domain];
  return fix ? `${user}@${fix}` : null;
}

export function validateName(name: string): string | null {
  const value = name.trim().replace(/\s+/g, ' ');
  if (!value) return t('val.name.empty');
  if (value.length < 2) return t('val.name.short');
  if (value.length > 60) return t('val.name.long');
  if (!/^[A-Za-zÀ-ÿ' -]+$/.test(value)) return t('val.name.letters');
  return null;
}

export const normalizeName = (name: string) =>
  name
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map((part) => (part.length > 2 ? part[0].toUpperCase() + part.slice(1) : part))
    .join(' ');
