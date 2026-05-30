// Session management — JWT-like tokens stored in Supabase
import { supabaseAdmin } from './supabase';
import { randomBytes } from 'crypto';

export const SESSION_COOKIE = 'vexor_session';
const SESSION_TTL_DAYS = 30;

export interface SessionUser {
  id:            string;
  email:         string | null;
  walletAddress: string | null;
  authMethod:    string;
  isAdmin:       boolean;
  banned:        boolean;
}

// Create session token, store in DB, return token string
export async function createSession(userId: string): Promise<string> {
  const db = supabaseAdmin();
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 86400_000).toISOString();
  await db.from('sessions').insert({ user_id: userId, token, expires_at: expiresAt });
  return token;
}

// Verify token, return user or null
export async function verifySession(token: string | undefined): Promise<SessionUser | null> {
  if (!token) return null;
  const db = supabaseAdmin();
  const { data } = await db
    .from('sessions')
    .select('user_id, expires_at, users(id,email,wallet_address,auth_method,is_admin,banned)')
    .eq('token', token)
    .single();
  if (!data) return null;
  if (new Date(data.expires_at) < new Date()) {
    await db.from('sessions').delete().eq('token', token);
    return null;
  }
  const u: any = (data as any).users;
  if (!u) return null;
  return {
    id:            u.id,
    email:         u.email,
    walletAddress: u.wallet_address,
    authMethod:    u.auth_method,
    isAdmin:       u.is_admin,
    banned:        u.banned,
  };
}

// Helper to read session token from request cookies
export function tokenFromRequest(req: Request): string | undefined {
  const cookie = req.headers.get('cookie') || '';
  const match  = cookie.match(new RegExp(`${SESSION_COOKIE}=([^;]+)`));
  return match?.[1];
}

// Cookie string for Set-Cookie header
export function sessionCookie(token: string): string {
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_TTL_DAYS * 86400}`;
}
export function clearSessionCookie(): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; Max-Age=0`;
}
