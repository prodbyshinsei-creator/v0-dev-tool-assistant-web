import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifySession, tokenFromRequest } from '@/lib/session';
import { compare, hash } from 'bcryptjs';

export async function POST(req: NextRequest) {
  const user = await verifySession(tokenFromRequest(req));
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { oldPassword, newPassword } = await req.json();
  if (!oldPassword || !newPassword || newPassword.length < 8)
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

  const db = supabaseAdmin();
  const { data: u } = await db.from('users').select('password_hash').eq('id', user.id).single();
  if (!u?.password_hash) return NextResponse.json({ error: 'No password set' }, { status: 400 });

  if (!(await compare(oldPassword, u.password_hash)))
    return NextResponse.json({ error: 'Current password wrong' }, { status: 401 });

  await db.from('users').update({ password_hash: await hash(newPassword, 12) }).eq('id', user.id);
  return NextResponse.json({ ok: true });
}
