'use client';

// Simple auth helper — stores session in localStorage
// Keys are NOT encrypted on client (same as before) — real encryption in Phase 2 backend

export interface AuthUser {
  id: string;
  email: string;
  createdAt: number;
}

const AUTH_KEY = 'vamp_auth';

export function getAuthUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function setAuthUser(user: AuthUser) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(user));
}

export function clearAuthUser() {
  localStorage.removeItem(AUTH_KEY);
}

// Very simple password hash (browser-only, Phase 2 uses bcrypt on server)
export async function hashPassword(password: string): Promise<string> {
  const enc  = new TextEncoder().encode(password);
  const buf  = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
}

// Stored users (mock — Phase 2 uses real DB)
const USERS_KEY = 'vamp_users';

interface StoredUser { id: string; email: string; passwordHash: string; createdAt: number; }

function getStoredUsers(): StoredUser[] {
  try { return JSON.parse(localStorage.getItem(USERS_KEY) || '[]'); } catch { return []; }
}

export async function registerUser(email: string, password: string): Promise<{ ok: boolean; error?: string }> {
  const users = getStoredUsers();
  if (users.find(u => u.email.toLowerCase() === email.toLowerCase()))
    return { ok: false, error: 'Email already registered' };
  const hash = await hashPassword(password);
  const user: StoredUser = { id: crypto.randomUUID(), email, passwordHash: hash, createdAt: Date.now() };
  localStorage.setItem(USERS_KEY, JSON.stringify([...users, user]));
  setAuthUser({ id: user.id, email: user.email, createdAt: user.createdAt });
  return { ok: true };
}

export async function loginUser(email: string, password: string): Promise<{ ok: boolean; error?: string }> {
  const users = getStoredUsers();
  const user  = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) return { ok: false, error: 'Email not found' };
  const hash = await hashPassword(password);
  if (hash !== user.passwordHash) return { ok: false, error: 'Wrong password' };
  setAuthUser({ id: user.id, email: user.email, createdAt: user.createdAt });
  return { ok: true };
}

export async function changePassword(userId: string, oldPassword: string, newPassword: string): Promise<{ ok: boolean; error?: string }> {
  const users = getStoredUsers();
  const idx   = users.findIndex(u => u.id === userId);
  if (idx === -1) return { ok: false, error: 'User not found' };
  const oldHash = await hashPassword(oldPassword);
  if (oldHash !== users[idx].passwordHash) return { ok: false, error: 'Current password is wrong' };
  const newHash = await hashPassword(newPassword);
  users[idx] = { ...users[idx], passwordHash: newHash };
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  return { ok: true };
}
