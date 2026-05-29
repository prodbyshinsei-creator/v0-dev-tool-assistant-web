import { NextRequest, NextResponse } from 'next/server';
import { Connection, Keypair, VersionedTransaction } from '@solana/web3.js';
import bs58 from 'bs58';

const RPC = process.env.SOLANA_RPC || 'https://api.mainnet-beta.solana.com';
const connection = new Connection(RPC, 'confirmed');

export async function POST(req: NextRequest) {
  const { privateKey, name, symbol, uri, buyAmountSol = 0 } = await req.json();

  if (!privateKey || !name || !symbol || !uri) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    const creator = Keypair.fromSecretKey(bs58.decode(privateKey));

    const res = await fetch('https://pumpdev.io/api/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        publicKey: creator.publicKey.toBase58(),
        name,
        symbol,
        uri,
        buyAmountSol,
        slippage: 15,
        jitoTip: 0.0001,
      }),
    });

    if (!res.ok) {
      const txt = await res.text();
      return NextResponse.json({ error: txt }, { status: 500 });
    }

    const result = await res.json();
    const mintKeypair = Keypair.fromSecretKey(bs58.decode(result.mintSecretKey));
    const signatures: string[] = [];

    for (const txInfo of result.transactions) {
      const tx = VersionedTransaction.deserialize(bs58.decode(txInfo.transaction));
      const signers: Keypair[] = txInfo.signers.includes('mint')
        ? [creator, mintKeypair]
        : [creator];
      tx.sign(signers);

      const sig = await connection.sendRawTransaction(tx.serialize(), {
        skipPreflight: true,
        maxRetries: 3,
      });
      signatures.push(sig);
    }

    return NextResponse.json({
      success: true,
      mintAddress: mintKeypair.publicKey.toBase58(),
      signatures,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
