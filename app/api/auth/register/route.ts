import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { createSession, sessionCookie } from '@/lib/session';
import { hash } from 'bcryptjs';

const ADMIN_EMAILS  = ['prod.by.shinsei@gmail.com'];
const ADMIN_WALLETS = ['DjLqiGSJdhPP8fYwLM63jnRUdYFPETnr3Uh1NMUJjowU'];

export async function POST(req: NextRequest) {
  const { email, password, walletAddress, authMethod = 'email' } = await req.json();

  const db = supabaseAdmin();

  try {
    if (authMethod === 'wallet' && walletAddress) {
      // Wallet-based registration / login (upsert)
      const isAdmin = ADMIN_WALLETS.includes(walletAddress);
      const { data: existing } = await db.from('users').select('id,banned,banned_reason').eq('wallet_address', walletAddress).single();

      let userId: string;
      if (existing) {
        if (existing.banned) return NextResponse.json({ error: `Banned${existing.banned_reason ? ': ' + existing.banned_reason : ''}` }, { status: 403 });
        userId = existing.id;
        await db.from('users').update({ last_login: new Date().toISOString() }).eq('id', userId);
      } else {
        const { data: newUser, error } = await db.from('users').insert({
          wallet_address: walletAddress, auth_method: 'wallet', is_admin: isAdmin,
          email: `${walletAddress.slice(0,8)}@wallet.vexor`, last_login: new Date().toISOString(),
        }).select('id').single();
        if (error || !newUser) return NextResponse.json({ error: error?.message || 'DB error' }, { status: 500 });
        userId = newUser.id;
      }

      const token = await createSession(userId);
      return NextResponse.json({ ok: true, userId, isAdmin }, {
        headers: { 'Set-Cookie': sessionCookie(token) },
      });
    }

    // Email registration
    if (!email || !password) return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    if (password.length < 8) return NextResponse.json({ error: 'Password min 8 chars' }, { status: 400 });

    const { data: existing } = await db.from('users').select('id,banned').eq('email', email.toLowerCase()).single();
    if (existing) return NextResponse.json({ error: existing.banned ? 'Account banned' : 'Email already registered' }, { status: 409 });

    const isAdmin = ADMIN_EMAILS.includes(email.toLowerCase());
    const passwordHash = await hash(password, 12);

    const { data: newUser, error } = await db.from('users').insert({
      email: email.toLowerCase(), password_hash: passwordHash,
      auth_method: 'email', is_admin: isAdmin, last_login: new Date().toISOString(),
    }).select('id').single();
    if (error || !newUser) return NextResponse.json({ error: error?.message || 'DB error' }, { status: 500 });

    const token = await createSession(newUser.id);
    return NextResponse.json({ ok: true, userId: newUser.id, isAdmin }, {
      headers: { 'Set-Cookie': sessionCookie(token) },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
