import { NextRequest, NextResponse } from 'next/server';
import { Keypair, VersionedTransaction } from '@solana/web3.js';
import bs58 from 'bs58';

const HELIUS_RPC = process.env.SOLANA_RPC || 'https://mainnet.helius-rpc.com/?api-key=a7988ce3-1c0c-4130-bad6-4b65b0e8cf73';

export async function POST(req: NextRequest) {
  const { privateKey, name, symbol, uri, buyAmountSol = 0 } = await req.json();

  if (!privateKey || !name || !symbol || !uri) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    const creator = Keypair.fromSecretKey(bs58.decode(privateKey));

    // 1. Request unsigned transaction from pumpdev.io
    const res = await fetch('https://pumpdev.io/api/create', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        publicKey:    creator.publicKey.toBase58(),
        name,
        symbol,
        uri,
        buyAmountSol: parseFloat(String(buyAmountSol)) || 0,
        slippage:     15,
        priorityFee:  0.0005,
      }),
      signal: AbortSignal.timeout(60000),
    });

    if (!res.ok) {
      const txt = await res.text();
      return NextResponse.json({ error: txt }, { status: 500 });
    }

    const result = await res.json();
    if (result.error) return NextResponse.json({ error: result.error }, { status: 500 });

    // pumpdev.io /api/create returns: { mint, transaction (base58), mintSecretKey }
    const mintAddress  = result.mint          as string;
    const txB58        = result.transaction   as string;
    const mintSecret   = result.mintSecretKey as string;

    if (!mintAddress || !txB58) {
      return NextResponse.json({ error: `Bad response: ${JSON.stringify(result)}` }, { status: 500 });
    }

    // 2. Sign with creator + mint keypair
    const mintKeypair = mintSecret
      ? Keypair.fromSecretKey(bs58.decode(mintSecret))
      : null;

    const tx = VersionedTransaction.deserialize(bs58.decode(txB58));
    const signers: Keypair[] = mintKeypair ? [creator, mintKeypair] : [creator];
    tx.sign(signers);

    // 3. Send as base64 directly to Helius RPC
    const base64Tx = Buffer.from(tx.serialize()).toString('base64');
    const rpcRes = await fetch(HELIUS_RPC, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0', id: 1,
        method:  'sendTransaction',
        params:  [base64Tx, {
          encoding:             'base64',
          skipPreflight:        true,
          maxRetries:           3,
          preflightCommitment:  'processed',
        }],
      }),
      signal: AbortSignal.timeout(20000),
    });

    const rpcData = await rpcRes.json();
    if (rpcData.error) {
      return NextResponse.json({ error: JSON.stringify(rpcData.error) }, { status: 500 });
    }

    return NextResponse.json({
      success:     true,
      mintAddress,
      signature:   rpcData.result,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
