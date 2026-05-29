import { NextRequest, NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';

const RPC = process.env.SOLANA_RPC || 'https://api.mainnet-beta.solana.com';
const connection = new Connection(RPC, 'confirmed');

export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get('wallet');
  const mint   = req.nextUrl.searchParams.get('mint');
  if (!wallet || !mint) return NextResponse.json({ balance: 0 });

  try {
    const walletPk = new PublicKey(wallet);
    const mintPk   = new PublicKey(mint);
    const accounts = await connection.getTokenAccountsByOwner(walletPk, { mint: mintPk });
    if (accounts.value.length === 0) return NextResponse.json({ balance: 0 });
    const info = await connection.getTokenAccountBalance(accounts.value[0].pubkey);
    return NextResponse.json({
      balance: parseFloat(info.value.uiAmountString || '0'),
      rawAmount: info.value.amount,
    });
  } catch {
    return NextResponse.json({ balance: 0 });
  }
}
