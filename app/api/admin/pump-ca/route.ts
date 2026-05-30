import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifySession, tokenFromRequest } from '@/lib/session';

export async function GET(req: NextRequest) {
  const user = await verifySession(tokenFromRequest(req));
  if (!user?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const db = supabaseAdmin();
  const { data } = await db.from('pump_ca_pool').select('id,address,used,used_at,created_at').order('created_at', { ascending: false });
  return NextResponse.json({ pool: data || [] });
}

export async function POST(req: NextRequest) {
  const user = await verifySession(tokenFromRequest(req));
  if (!user?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { entries } = await req.json(); // array of "address,privateKey" strings
  if (!entries?.length) return NextResponse.json({ error: 'No entries' }, { status: 400 });

  const db = supabaseAdmin();
  const rows = entries
    .map((e: string) => { const [address, privateKey] = e.split(',').map((s: string) => s.trim()); return address && privateKey ? { address, private_key: privateKey, added_by: user.id } : null; })
    .filter(Boolean);

  if (!rows.length) return NextResponse.json({ error: 'Invalid format' }, { status: 400 });
  const { error } = await db.from('pump_ca_pool').insert(rows);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, added: rows.length });
}
