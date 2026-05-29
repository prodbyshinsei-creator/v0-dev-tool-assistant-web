import { NextRequest, NextResponse } from 'next/server';
import { Connection, Keypair, VersionedTransaction } from '@solana/web3.js';
import bs58 from 'bs58';

const HELIUS_RPC = process.env.SOLANA_RPC || 'https://mainnet.helius-rpc.com/?api-key=a7988ce3-1c0c-4130-bad6-4b65b0e8cf73';
const connection = new Connection(HELIUS_RPC, 'confirmed');

// Uses pumpportal.fun which supports "100%" sell — no balance check needed!
const TRADE_API = 'https://pumpportal.fun/api/trade-local';

export async function POST(req: NextRequest) {
  const { privateKey, action, mint, amount, denominatedInSol = true } = await req.json();

  if (!privateKey || !action || !mint || amount === undefined) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 });
  }

  try {
    const keypair = Keypair.fromSecretKey(bs58.decode(privateKey));

    // For sell: always use "100%" to sell all tokens in wallet
    const tradeAmount = action === 'sell' ? '100%' : amount;
    const inSol       = action === 'sell' ? 'false' : (denominatedInSol ? 'true' : 'false');

    const payload = {
      publicKey:        keypair.publicKey.toBase58(),
      action,
      mint,
      denominatedInSol: inSol,
      amount:           tradeAmount,
      slippage:         15,
      priorityFee:      0.00003,   // cheap
      pool:             'pump',
    };

    const res = await fetch(TRADE_API, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
      signal:  AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      const txt = await res.text();
      return NextResponse.json({ error: `Trade API: ${txt}` }, { status: 500 });
    }

    // Response is a binary serialized VersionedTransaction
    const txData = await res.arrayBuffer();
    const tx = VersionedTransaction.deserialize(new Uint8Array(txData));
    tx.sign([keypair]);

    const sig = await connection.sendRawTransaction(tx.serialize(), {
      skipPreflight: true,
      maxRetries:    3,
    });

    return NextResponse.json({ signature: sig, success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
