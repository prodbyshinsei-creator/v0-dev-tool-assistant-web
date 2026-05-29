import { NextRequest, NextResponse } from 'next/server';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';

const RPC = process.env.SOLANA_RPC || 'https://api.mainnet-beta.solana.com';
const connection = new Connection(RPC, 'confirmed');

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get('address');
  if (!address) return NextResponse.json({ balance: 0 });
  try {
    const pk = new PublicKey(address);
    const lamports = await connection.getBalance(pk);
    return NextResponse.json({ balance: lamports / LAMPORTS_PER_SOL });
  } catch {
    return NextResponse.json({ balance: 0 });
  }
}
