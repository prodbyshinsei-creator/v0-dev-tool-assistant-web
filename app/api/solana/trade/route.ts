import { NextRequest, NextResponse } from 'next/server';
import { Connection, Keypair, VersionedTransaction } from '@solana/web3.js';
import bs58 from 'bs58';

const RPC = process.env.SOLANA_RPC || 'https://api.mainnet-beta.solana.com';
const connection = new Connection(RPC, 'confirmed');

export async function POST(req: NextRequest) {
  const {
    privateKey,
    action,
    mint,
    amount,
    denominatedInSol = true,
  } = await req.json();

  if (!privateKey || !action || !mint || amount === undefined) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 });
  }

  try {
    const keypair = Keypair.fromSecretKey(bs58.decode(privateKey));

    // Build unsigned tx via pumpdev.io
    const res = await fetch('https://pumpdev.io/api/trade-local', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        publicKey: keypair.publicKey.toBase58(),
        action,
        mint,
        amount,
        denominatedInSol: denominatedInSol ? 'true' : 'false',
        slippage: 15,
        priorityFee: 0.00005, // cheap
      }),
    });

    if (!res.ok) {
      const txt = await res.text();
      return NextResponse.json({ error: `pumpdev: ${txt}` }, { status: 500 });
    }

    const txData = await res.arrayBuffer();
    const tx = VersionedTransaction.deserialize(new Uint8Array(txData));
    tx.sign([keypair]);

    const sig = await connection.sendRawTransaction(tx.serialize(), {
      skipPreflight: true,
      maxRetries: 3,
    });

    return NextResponse.json({ signature: sig, success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
