import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { createSession, sessionCookie } from '@/lib/session';
import { compare } from 'bcryptjs';

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  if (!email || !password) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

  const db = supabaseAdmin();
  const { data: user } = await db.from('users').select('id,password_hash,banned,banned_reason,is_admin').eq('email', email.toLowerCase()).single();
  if (!user) return NextResponse.json({ error: 'Email not found' }, { status: 401 });
  if (user.banned) return NextResponse.json({ error: `Banned${user.banned_reason ? ': ' + user.banned_reason : ''}` }, { status: 403 });
  if (!user.password_hash) return NextResponse.json({ error: 'Use wallet login for this account' }, { status: 400 });

  const ok = await compare(password, user.password_hash);
  if (!ok) return NextResponse.json({ error: 'Wrong password' }, { status: 401 });

  await db.from('users').update({ last_login: new Date().toISOString() }).eq('id', user.id);
  const token = await createSession(user.id);
  return NextResponse.json({ ok: true, isAdmin: user.is_admin }, {
    headers: { 'Set-Cookie': sessionCookie(token) },
  });
}
