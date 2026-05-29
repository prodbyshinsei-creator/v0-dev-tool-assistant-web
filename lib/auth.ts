'use client';

export const ADMIN_EMAILS = ['prod.by.shinsei@gmail.com'];

export interface AuthUser {
  id: string;
  email: string;
  createdAt: number;
  isAdmin?: boolean;
}

const AUTH_KEY  = 'vamp_auth';
const USERS_KEY = 'vamp_users';

interface StoredUser {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: number;
}

export function getAuthUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    const u = JSON.parse(raw) as AuthUser;
    return { ...u, isAdmin: ADMIN_EMAILS.includes(u.email.toLowerCase()) };
  } catch { return null; }
}

export function setAuthUser(user: AuthUser) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(user));
}

export function clearAuthUser() {
  localStorage.removeItem(AUTH_KEY);
}

export async function hashPassword(password: string): Promise<string> {
  const enc = new TextEncoder().encode(password);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
}

function getStoredUsers(): StoredUser[] {
  try { return JSON.parse(localStorage.getItem(USERS_KEY) || '[]'); } catch { return []; }
}

export function getAllUsers(): { id: string; email: string; createdAt: number; isAdmin: boolean }[] {
  return getStoredUsers().map(u => ({
    id: u.id,
    email: u.email,
    createdAt: u.createdAt,
    isAdmin: ADMIN_EMAILS.includes(u.email.toLowerCase()),
  }));
}

export function deleteUserById(id: string) {
  const users = getStoredUsers().filter(u => u.id !== id);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export async function registerUser(email: string, password: string): Promise<{ ok: boolean; error?: string }> {
  const users = getStoredUsers();
  if (users.find(u => u.email.toLowerCase() === email.toLowerCase()))
    return { ok: false, error: 'Email already registered' };
  const hash = await hashPassword(password);
  const user: StoredUser = { id: crypto.randomUUID(), email, passwordHash: hash, createdAt: Date.now() };
  localStorage.setItem(USERS_KEY, JSON.stringify([...users, user]));
  setAuthUser({ id: user.id, email: user.email, createdAt: user.createdAt, isAdmin: ADMIN_EMAILS.includes(email.toLowerCase()) });
  return { ok: true };
}

export async function loginUser(email: string, password: string): Promise<{ ok: boolean; error?: string }> {
  const users = getStoredUsers();
  const user  = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) return { ok: false, error: 'Email not found' };
  const hash = await hashPassword(password);
  if (hash !== user.passwordHash) return { ok: false, error: 'Wrong password' };
  setAuthUser({ id: user.id, email: user.email, createdAt: user.createdAt, isAdmin: ADMIN_EMAILS.includes(email.toLowerCase()) });
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
