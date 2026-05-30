import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { tokenFromRequest, clearSessionCookie } from '@/lib/session';

export async function POST(req: NextRequest) {
  const token = tokenFromRequest(req);
  if (token) {
    const db = supabaseAdmin();
    await db.from('sessions').delete().eq('token', token);
  }
  return NextResponse.json({ ok: true }, {
    headers: { 'Set-Cookie': clearSessionCookie() },
  });
}
