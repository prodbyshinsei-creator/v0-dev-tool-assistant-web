import { NextResponse } from 'next/server';
import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';

export async function POST() {
  try {
    const kp = Keypair.generate();
    return NextResponse.json({
      address: kp.publicKey.toBase58(),
      privateKey: bs58.encode(kp.secretKey),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
