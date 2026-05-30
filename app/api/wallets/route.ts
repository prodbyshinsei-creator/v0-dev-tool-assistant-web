import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifySession, tokenFromRequest } from '@/lib/session';
import { encrypt, decrypt } from '@/lib/crypto-aes';

// GET — list wallets for current user (private keys decrypted)
export async function GET(req: NextRequest) {
  const user = await verifySession(tokenFromRequest(req));
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = supabaseAdmin();
  const { data, error } = await db.from('wallets').select('*').eq('user_id', user.id).order('created_at');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const wallets = (data || []).map(w => ({
    id:                  w.id,
    name:                w.name,
    address:             w.address,
    balance:             w.balance,
    type:                w.type,
    connected:           w.connected,
    adapterName:         w.adapter_name,
    // Decrypt private key for client use
    privateKeyEncrypted: w.private_key_encrypted
      ? decrypt({ ciphertext: w.private_key_encrypted, iv: w.iv, authTag: w.auth_tag }, user.id)
      : '',
  }));

  return NextResponse.json({ wallets });
}

// POST — create wallet
export async function POST(req: NextRequest) {
  const user = await verifySession(tokenFromRequest(req));
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { name, address, privateKey, type = 'dev', connected = false, adapterName } = await req.json();
  if (!name || !address) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

  const db = supabaseAdmin();

  let encData = { ciphertext: '', iv: '', authTag: '' };
  if (privateKey) {
    encData = encrypt(privateKey, user.id);
  }

  const { data, error } = await db.from('wallets').insert({
    user_id:              user.id,
    name,
    address,
    private_key_encrypted: encData.ciphertext || null,
    iv:                   encData.iv      || null,
    auth_tag:             encData.authTag || null,
    type,
    connected,
    adapter_name: adapterName || null,
    balance: 0,
  }).select('id').single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, id: data.id });
}

// PATCH — update wallet (name, balance, etc.)
export async function PATCH(req: NextRequest) {
  const user = await verifySession(tokenFromRequest(req));
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, ...updates } = await req.json();
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const db = supabaseAdmin();
  // Only allow updating safe fields
  const safe: Record<string,any> = {};
  if (updates.name    !== undefined) safe.name    = updates.name;
  if (updates.balance !== undefined) safe.balance = updates.balance;
  if (updates.type    !== undefined) safe.type    = updates.type;

  await db.from('wallets').update(safe).eq('id', id).eq('user_id', user.id);
  return NextResponse.json({ ok: true });
}

// DELETE
export async function DELETE(req: NextRequest) {
  const user = await verifySession(tokenFromRequest(req));
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await req.json();
  const db = supabaseAdmin();
  await db.from('wallets').delete().eq('id', id).eq('user_id', user.id);
  return NextResponse.json({ ok: true });
}
