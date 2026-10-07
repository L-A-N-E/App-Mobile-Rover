import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

import { t, tn } from '../i18n';
import { normalizeEmail, normalizeName, validateEmail, validateName, validatePassword } from '../utils/validation';

// Autenticação local (AsyncStorage) enquanto o backend não tem login.
// Senhas são guardadas como hash SHA-256 com salt aleatório por usuário, nunca em texto puro.
// Ainda é uma solução de protótipo: em produção, o login deve ir para o servidor.

export type User = {
  id: string;
  name: string;
  email: string;
  isPremium: boolean;
};

type StoredUser = User & {
  passwordHash?: string;
  salt?: string;
  password?: string; // formato antigo (texto puro), migrado no primeiro login
};

export type AuthResult = { ok: true } | { ok: false; error: string; field?: 'name' | 'email' | 'password' };

type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (name: string, email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  setPremium: (isPremium: boolean) => Promise<void>;
};

const USERS_KEY = '@rover:users';
const SESSION_KEY = '@rover:session';
const ATTEMPTS_KEY = '@rover:login-attempts';

export const DEMO_EMAIL = 'demo@rover.com';
export const DEMO_PASSWORD = 'Rover@2026';

const MAX_ATTEMPTS = 5;
const LOCK_MS = 60_000;

type Attempts = Record<string, { count: number; lockedUntil?: number }>;

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function hashPassword(password: string, salt: string) {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${salt}:${password}`);
}

async function withPassword(user: User, password: string): Promise<StoredUser> {
  const salt = Crypto.randomUUID();
  return { ...user, salt, passwordHash: await hashPassword(password, salt) };
}

async function verifyPassword(stored: StoredUser, password: string) {
  if (stored.passwordHash && stored.salt) return (await hashPassword(password, stored.salt)) === stored.passwordHash;
  return stored.password === password; // conta antiga
}

async function loadUsers(): Promise<StoredUser[]> {
  const raw = await AsyncStorage.getItem(USERS_KEY);
  let users = raw ? (JSON.parse(raw) as StoredUser[]) : [];
  let changed = !raw;

  // Garante a conta de demonstração com a senha atual (a antiga "123456" não atende às novas regras).
  const demo = users.find((u) => u.id === 'demo');
  if (!demo || demo.password !== undefined) {
    const base: User = demo ?? { id: 'demo', name: 'Nicolas Haubricht', email: DEMO_EMAIL, isPremium: false };
    const migrated = await withPassword({ id: base.id, name: base.name, email: base.email, isPremium: base.isPremium }, DEMO_PASSWORD);
    users = demo ? users.map((u) => (u.id === 'demo' ? migrated : u)) : [migrated, ...users];
    changed = true;
  }
  if (changed) await saveUsers(users);
  return users;
}

async function saveUsers(users: StoredUser[]) {
  await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));
}

async function loadAttempts(): Promise<Attempts> {
  const raw = await AsyncStorage.getItem(ATTEMPTS_KEY);
  return raw ? (JSON.parse(raw) as Attempts) : {};
}

function toPublicUser({ id, name, email, isPremium }: StoredUser): User {
  return { id, name, email, isPremium };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [users, sessionId] = await Promise.all([loadUsers(), AsyncStorage.getItem(SESSION_KEY)]);
      const sessionUser = users.find((u) => u.id === sessionId);
      if (sessionUser) setUser(toPublicUser(sessionUser));
      setIsLoading(false);
    })();
  }, []);

  const signIn: AuthContextValue['signIn'] = async (rawEmail, password) => {
    const emailError = validateEmail(rawEmail);
    if (emailError) return { ok: false, error: emailError, field: 'email' };
    if (!password) return { ok: false, error: t('val.pw.required'), field: 'password' };

    const email = normalizeEmail(rawEmail);
    const attempts = await loadAttempts();
    const entry = attempts[email] ?? { count: 0 };
    if (entry.lockedUntil && entry.lockedUntil > Date.now()) {
      const seconds = Math.ceil((entry.lockedUntil - Date.now()) / 1000);
      return { ok: false, error: t('auth.tooMany', { count: seconds }), field: 'password' };
    }

    const users = await loadUsers();
    const found = users.find((u) => u.email === email);
    const valid = found ? await verifyPassword(found, password) : false;

    if (!found || !valid) {
      const count = entry.count + 1;
      const locked = count >= MAX_ATTEMPTS;
      attempts[email] = locked ? { count: 0, lockedUntil: Date.now() + LOCK_MS } : { count };
      await AsyncStorage.setItem(ATTEMPTS_KEY, JSON.stringify(attempts));
      // Mensagem genérica: não revela se o email existe.
      const remaining = MAX_ATTEMPTS - count;
      return {
        ok: false,
        field: 'password',
        error: locked
          ? t('auth.locked', { count: LOCK_MS / 1000 })
          : t('auth.wrong') + (remaining <= 2 ? tn('auth.remaining', remaining) : ''),
      };
    }

    delete attempts[email];
    await AsyncStorage.setItem(ATTEMPTS_KEY, JSON.stringify(attempts));

    // Migra contas antigas (senha em texto puro) para hash.
    if (found.password !== undefined) {
      const migrated = await withPassword(toPublicUser(found), password);
      await saveUsers(users.map((u) => (u.id === found.id ? migrated : u)));
    }

    await AsyncStorage.setItem(SESSION_KEY, found.id);
    setUser(toPublicUser(found));
    return { ok: true };
  };

  const signUp: AuthContextValue['signUp'] = async (rawName, rawEmail, password) => {
    // Revalida aqui também: a tela pode mudar, a regra não.
    const nameError = validateName(rawName);
    if (nameError) return { ok: false, error: nameError, field: 'name' };
    const emailError = validateEmail(rawEmail);
    if (emailError) return { ok: false, error: emailError, field: 'email' };
    const passwordError = validatePassword(password, { name: rawName, email: rawEmail });
    if (passwordError) return { ok: false, error: passwordError, field: 'password' };

    const users = await loadUsers();
    const email = normalizeEmail(rawEmail);
    if (users.some((u) => u.email === email)) {
      return { ok: false, error: t('auth.exists'), field: 'email' };
    }

    const newUser = await withPassword(
      { id: Crypto.randomUUID(), name: normalizeName(rawName), email, isPremium: false },
      password,
    );
    await saveUsers([...users, newUser]);
    await AsyncStorage.setItem(SESSION_KEY, newUser.id);
    setUser(toPublicUser(newUser));
    return { ok: true };
  };

  const signOut = async () => {
    await AsyncStorage.removeItem(SESSION_KEY);
    setUser(null);
  };

  const setPremium = async (isPremium: boolean) => {
    if (!user) return;
    const users = await loadUsers();
    await saveUsers(users.map((u) => (u.id === user.id ? { ...u, isPremium } : u)));
    setUser({ ...user, isPremium });
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signUp, signOut, setPremium }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
}
