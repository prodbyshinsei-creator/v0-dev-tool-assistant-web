import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifySession, tokenFromRequest } from '@/lib/session';

export async function GET(req: NextRequest) {
  const user = await verifySession(tokenFromRequest(req));
  if (!user?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const db = supabaseAdmin();
  const { data } = await db.from('users').select('id,email,wallet_address,auth_method,is_admin,banned,banned_at,banned_reason,last_login,created_at').order('created_at', { ascending: false });
  return NextResponse.json({ users: data || [] });
}

export async function PATCH(req: NextRequest) {
  const user = await verifySession(tokenFromRequest(req));
  if (!user?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id, action, reason } = await req.json();
  const db = supabaseAdmin();

  if (action === 'ban') {
    await db.from('users').update({ banned: true, banned_at: new Date().toISOString(), banned_reason: reason || '' }).eq('id', id);
    await db.from('sessions').delete().eq('user_id', id);
  } else if (action === 'unban') {
    await db.from('users').update({ banned: false, banned_at: null, banned_reason: null }).eq('id', id);
  } else if (action === 'delete') {
    await db.from('users').delete().eq('id', id);
  }
  return NextResponse.json({ ok: true });
}
