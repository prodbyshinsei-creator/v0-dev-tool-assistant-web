'use client';

export const ADMIN_EMAILS = ['prod.by.shinsei@gmail.com'];

export interface AuthUser {
  id: string;
  email: string;
  createdAt: number;
  isAdmin?: boolean;
  authMethod?: 'email' | 'wallet';
  walletAddress?: string;
}

const AUTH_KEY  = 'vamp_auth';
const USERS_KEY = 'vamp_users';

interface StoredUser {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: number;
  walletAddress?: string;
  banned?: boolean;
  bannedAt?: number;
  bannedReason?: string;
  lastLogin?: number;
}

export function getAuthUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    const u = JSON.parse(raw) as AuthUser;
    return { ...u, isAdmin: ADMIN_EMAILS.includes((u.email||'').toLowerCase()) };
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

export function getAllUsers() {
  return getStoredUsers().map(u => ({
    id: u.id, email: u.email, createdAt: u.createdAt,
    isAdmin: ADMIN_EMAILS.includes((u.email||'').toLowerCase()),
    walletAddress: u.walletAddress,
    banned: u.banned || false,
    bannedAt: u.bannedAt,
    bannedReason: u.bannedReason,
    lastLogin: u.lastLogin,
  }));
}

export function deleteUserById(id: string) {
  localStorage.setItem(USERS_KEY, JSON.stringify(getStoredUsers().filter(u => u.id !== id)));
}

export function banUser(id: string, reason = '') {
  const users = getStoredUsers();
  const idx   = users.findIndex(u => u.id === id);
  if (idx !== -1) { users[idx].banned = true; users[idx].bannedAt = Date.now(); users[idx].bannedReason = reason; }
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function unbanUser(id: string) {
  const users = getStoredUsers();
  const idx   = users.findIndex(u => u.id === id);
  if (idx !== -1) { delete users[idx].banned; delete users[idx].bannedAt; delete users[idx].bannedReason; }
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function loginOrRegisterWithWallet(walletAddress: string, walletName: string): { user: AuthUser | null; banned?: boolean; reason?: string } {
  const users = getStoredUsers();
  let user = users.find(u => u.walletAddress === walletAddress);
  if (!user) {
    user = { id: crypto.randomUUID(), email: `${walletAddress.slice(0,8)}…@wallet`, passwordHash: '', createdAt: Date.now(), walletAddress };
    localStorage.setItem(USERS_KEY, JSON.stringify([...users, user]));
  }
  if (user.banned) return { user: null, banned: true, reason: user.bannedReason };
  const authUser: AuthUser = { id: user.id, email: user.email, createdAt: user.createdAt,
    authMethod: 'wallet', walletAddress, isAdmin: ADMIN_EMAILS.includes((user.email||'').toLowerCase()) };
  setAuthUser(authUser);
  // Update lastLogin
  const allUsers = getStoredUsers();
  const idx = allUsers.findIndex(u => u.id === user!.id);
  if (idx !== -1) { allUsers[idx].lastLogin = Date.now(); localStorage.setItem(USERS_KEY, JSON.stringify(allUsers)); }
  return { user: authUser };
}

export async function registerUser(email: string, password: string): Promise<{ ok: boolean; error?: string }> {
  const users = getStoredUsers();
  const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) return { ok: false, error: existing.banned ? 'This email is banned' : 'Email already registered' };
  const hash = await hashPassword(password);
  const user: StoredUser = { id: crypto.randomUUID(), email, passwordHash: hash, createdAt: Date.now(), lastLogin: Date.now() };
  localStorage.setItem(USERS_KEY, JSON.stringify([...users, user]));
  setAuthUser({ id: user.id, email: user.email, createdAt: user.createdAt, authMethod: 'email',
    isAdmin: ADMIN_EMAILS.includes(email.toLowerCase()) });
  return { ok: true };
}

export async function loginUser(email: string, password: string): Promise<{ ok: boolean; error?: string }> {
  const users = getStoredUsers();
  const user  = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) return { ok: false, error: 'Email not found' };
  if (user.banned) return { ok: false, error: `Account banned${user.bannedReason ? ': ' + user.bannedReason : ''}` };
  const hash = await hashPassword(password);
  if (hash !== user.passwordHash) return { ok: false, error: 'Wrong password' };
  // Update lastLogin
  const idx = users.findIndex(u => u.id === user.id);
  if (idx !== -1) { users[idx].lastLogin = Date.now(); localStorage.setItem(USERS_KEY, JSON.stringify(users)); }
  setAuthUser({ id: user.id, email: user.email, createdAt: user.createdAt, authMethod: 'email',
    isAdmin: ADMIN_EMAILS.includes(email.toLowerCase()) });
  return { ok: true };
}

export async function changePassword(userId: string, oldPassword: string, newPassword: string): Promise<{ ok: boolean; error?: string }> {
  const users = getStoredUsers();
  const idx   = users.findIndex(u => u.id === userId);
  if (idx === -1) return { ok: false, error: 'User not found' };
  const oldHash = await hashPassword(oldPassword);
  if (oldHash !== users[idx].passwordHash) return { ok: false, error: 'Current password is wrong' };
  users[idx] = { ...users[idx], passwordHash: await hashPassword(newPassword) };
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  return { ok: true };
}

// Simple page view counter
export function trackPageView() {
  try {
    const key = 'vamp_page_views';
    const views = parseInt(localStorage.getItem(key) || '0') + 1;
    localStorage.setItem(key, String(views));
  } catch {}
}

export function getPageViews(): number {
  try { return parseInt(localStorage.getItem('vamp_page_views') || '0'); } catch { return 0; }
}
