import { NextRequest, NextResponse } from 'next/server';
import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';

export async function POST(req: NextRequest) {
  try {
    const { mintPrivateKey } = await req.json();
    if (!mintPrivateKey) return NextResponse.json({ valid: false, error: 'Missing key' });
    const kp = Keypair.fromSecretKey(bs58.decode(mintPrivateKey.trim()));
    return NextResponse.json({ valid: true, mintAddress: kp.publicKey.toBase58() });
  } catch (e: any) {
    return NextResponse.json({ valid: false, error: 'Invalid keypair' });
  }
}
