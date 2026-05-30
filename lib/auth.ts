'use client';

// Admin emails AND admin wallet addresses
export const ADMIN_EMAILS   = ['prod.by.shinsei@gmail.com'];
export const ADMIN_WALLETS  = ['DjLqiGSJdhPP8fYwLM63jnRUdYFPETnr3Uh1NMUJjowU']; // Phantom wallet

function isAdminCheck(email: string, walletAddress?: string): boolean {
  if (ADMIN_EMAILS.includes((email||'').toLowerCase())) return true;
  if (walletAddress && ADMIN_WALLETS.includes(walletAddress)) return true;
  return false;
}

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
  id: string; email: string; passwordHash: string; createdAt: number;
  walletAddress?: string; banned?: boolean; bannedAt?: number;
  bannedReason?: string; lastLogin?: number;
}

export function getAuthUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    const u = JSON.parse(raw) as AuthUser;
    return { ...u, isAdmin: isAdminCheck(u.email, u.walletAddress) };
  } catch { return null; }
}

export function setAuthUser(user: AuthUser) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(user));
}

export function clearAuthUser() { localStorage.removeItem(AUTH_KEY); }

export async function hashPassword(p: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(p));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
}

function getStoredUsers(): StoredUser[] {
  try { return JSON.parse(localStorage.getItem(USERS_KEY) || '[]'); } catch { return []; }
}

export function getAllUsers() {
  return getStoredUsers().map(u => ({
    id: u.id, email: u.email, createdAt: u.createdAt,
    isAdmin: isAdminCheck(u.email, u.walletAddress),
    walletAddress: u.walletAddress, banned: u.banned || false,
    bannedAt: u.bannedAt, bannedReason: u.bannedReason, lastLogin: u.lastLogin,
  }));
}

export function deleteUserById(id: string) {
  localStorage.setItem(USERS_KEY, JSON.stringify(getStoredUsers().filter(u => u.id !== id)));
}

export function banUser(id: string, reason = '') {
  const users = getStoredUsers(); const idx = users.findIndex(u => u.id === id);
  if (idx !== -1) { users[idx].banned = true; users[idx].bannedAt = Date.now(); users[idx].bannedReason = reason; }
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function unbanUser(id: string) {
  const users = getStoredUsers(); const idx = users.findIndex(u => u.id === id);
  if (idx !== -1) { delete users[idx].banned; delete users[idx].bannedAt; delete users[idx].bannedReason; }
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function loginOrRegisterWithWallet(walletAddress: string, walletName: string): { user: AuthUser | null; banned?: boolean; reason?: string } {
  const users = getStoredUsers();
  let user = users.find(u => u.walletAddress === walletAddress);
  if (!user) {
    user = { id: crypto.randomUUID(), email: `${walletAddress.slice(0,8)}…@wallet`,
      passwordHash: '', createdAt: Date.now(), walletAddress };
    localStorage.setItem(USERS_KEY, JSON.stringify([...users, user]));
  }
  if (user.banned) return { user: null, banned: true, reason: user.bannedReason };
  const authUser: AuthUser = { id: user.id, email: user.email, createdAt: user.createdAt,
    authMethod: 'wallet', walletAddress, isAdmin: isAdminCheck(user.email, walletAddress) };
  setAuthUser(authUser);
  const all = getStoredUsers(); const idx = all.findIndex(u => u.id === user!.id);
  if (idx !== -1) { all[idx].lastLogin = Date.now(); localStorage.setItem(USERS_KEY, JSON.stringify(all)); }
  return { user: authUser };
}

export async function registerUser(email: string, password: string): Promise<{ ok: boolean; error?: string }> {
  const users = getStoredUsers();
  const ex = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (ex) return { ok: false, error: ex.banned ? 'Email is banned' : 'Email already registered' };
  const hash = await hashPassword(password);
  const u: StoredUser = { id: crypto.randomUUID(), email, passwordHash: hash, createdAt: Date.now(), lastLogin: Date.now() };
  localStorage.setItem(USERS_KEY, JSON.stringify([...users, u]));
  setAuthUser({ id: u.id, email: u.email, createdAt: u.createdAt, authMethod: 'email', isAdmin: isAdminCheck(email) });
  return { ok: true };
}

export async function loginUser(email: string, password: string): Promise<{ ok: boolean; error?: string }> {
  const users = getStoredUsers();
  const u = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!u) return { ok: false, error: 'Email not found' };
  if (u.banned) return { ok: false, error: `Banned${u.bannedReason ? ': ' + u.bannedReason : ''}` };
  if (await hashPassword(password) !== u.passwordHash) return { ok: false, error: 'Wrong password' };
  const all = getStoredUsers(); const idx = all.findIndex(x => x.id === u.id);
  if (idx !== -1) { all[idx].lastLogin = Date.now(); localStorage.setItem(USERS_KEY, JSON.stringify(all)); }
  setAuthUser({ id: u.id, email: u.email, createdAt: u.createdAt, authMethod: 'email', isAdmin: isAdminCheck(email) });
  return { ok: true };
}

export async function changePassword(userId: string, oldPwd: string, newPwd: string): Promise<{ ok: boolean; error?: string }> {
  const users = getStoredUsers(); const idx = users.findIndex(u => u.id === userId);
  if (idx === -1) return { ok: false, error: 'Not found' };
  if (await hashPassword(oldPwd) !== users[idx].passwordHash) return { ok: false, error: 'Current password wrong' };
  users[idx].passwordHash = await hashPassword(newPwd);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  return { ok: true };
}

export function trackPageView() {
  try { localStorage.setItem('vamp_page_views', String((parseInt(localStorage.getItem('vamp_page_views')||'0')+1))); } catch {}
}
export function getPageViews(): number {
  try { return parseInt(localStorage.getItem('vamp_page_views')||'0'); } catch { return 0; }
}
