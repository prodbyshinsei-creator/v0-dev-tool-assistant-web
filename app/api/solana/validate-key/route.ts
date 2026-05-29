import { NextRequest, NextResponse } from 'next/server';
import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';

export async function POST(req: NextRequest) {
  try {
    const { privateKey } = await req.json();
    if (!privateKey) return NextResponse.json({ valid: false });
    const kp = Keypair.fromSecretKey(bs58.decode(privateKey));
    return NextResponse.json({ valid: true, address: kp.publicKey.toBase58() });
  } catch {
    return NextResponse.json({ valid: false });
  }
}
