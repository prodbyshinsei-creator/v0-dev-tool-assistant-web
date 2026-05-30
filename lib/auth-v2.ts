'use client';
// Phase 2 auth — uses backend API + httpOnly cookies
// Falls back to localStorage for offline dev

export interface AuthUser {
  id:            string;
  email:         string;
  walletAddress?: string;
  authMethod:    'email'|'wallet';
  isAdmin:       boolean;
}

const CACHE_KEY = 'vexor_user_cache';

function cacheUser(u: AuthUser | null) {
  if (typeof window === 'undefined') return;
  if (u) localStorage.setItem(CACHE_KEY, JSON.stringify(u));
  else   localStorage.removeItem(CACHE_KEY);
}
function getCachedUser(): AuthUser | null {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) || 'null'); } catch { return null; }
}

// Fetch current user from backend (uses httpOnly cookie automatically)
export async function fetchMe(): Promise<AuthUser | null> {
  try {
    const r = await fetch('/api/auth/me', { credentials: 'include' });
    if (!r.ok) { cacheUser(null); return null; }
    const u = await r.json();
    const user: AuthUser = {
      id: u.id, email: u.email || u.walletAddress || '',
      walletAddress: u.walletAddress, authMethod: u.authMethod || 'email', isAdmin: u.isAdmin,
    };
    cacheUser(user);
    return user;
  } catch {
    return getCachedUser(); // offline fallback
  }
}

export async function registerWithEmail(email: string, password: string): Promise<{ok:boolean;error?:string}> {
  const r = await fetch('/api/auth/register', {
    method:'POST', headers:{'Content-Type':'application/json'},
    credentials:'include', body: JSON.stringify({ email, password, authMethod:'email' }),
  });
  const d = await r.json();
  if (!r.ok) return { ok:false, error: d.error };
  cacheUser(null); // will re-fetch via fetchMe
  return { ok:true };
}

export async function loginWithEmail(email: string, password: string): Promise<{ok:boolean;error?:string}> {
  const r = await fetch('/api/auth/login', {
    method:'POST', headers:{'Content-Type':'application/json'},
    credentials:'include', body: JSON.stringify({ email, password }),
  });
  const d = await r.json();
  if (!r.ok) return { ok:false, error: d.error };
  return { ok:true };
}

export async function loginWithWallet(walletAddress: string, walletName: string): Promise<{ok:boolean;error?:string}> {
  const r = await fetch('/api/auth/register', {
    method:'POST', headers:{'Content-Type':'application/json'},
    credentials:'include', body: JSON.stringify({ walletAddress, authMethod:'wallet' }),
  });
  const d = await r.json();
  if (!r.ok) return { ok:false, error: d.error };
  return { ok:true };
}

export async function logout(): Promise<void> {
  await fetch('/api/auth/logout', { method:'POST', credentials:'include' });
  cacheUser(null);
}

export async function changePasswordV2(oldPassword: string, newPassword: string): Promise<{ok:boolean;error?:string}> {
  const r = await fetch('/api/auth/change-password', {
    method:'POST', headers:{'Content-Type':'application/json'},
    credentials:'include', body: JSON.stringify({ oldPassword, newPassword }),
  });
  const d = await r.json();
  return r.ok ? {ok:true} : {ok:false, error:d.error};
}
