import { NextRequest, NextResponse } from 'next/server';

const TRADE_API = 'https://pumpportal.fun/api/trade-local';

export async function POST(req: NextRequest) {
  const { publicKey, action, mint, amount, denominatedInSol = true } = await req.json();
  if (!publicKey || !action || !mint || amount === undefined)
    return NextResponse.json({ error: 'Missing params' }, { status: 400 });

  try {
    const tradeAmount = action === 'sell' ? '100%' : amount;
    const inSol = action === 'sell' ? 'false' : (denominatedInSol ? 'true' : 'false');

    const res = await fetch(TRADE_API, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        publicKey, action, mint,
        denominatedInSol: inSol,
        amount: tradeAmount,
        slippage: 15,
        priorityFee: 0.00003,
        pool: 'pump',
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      const txt = await res.text();
      return NextResponse.json({ error: `Trade API: ${txt}` }, { status: 500 });
    }

    // Return as base64 for client-side signing
    const txData = await res.arrayBuffer();
    const base64  = Buffer.from(txData).toString('base64');
    return NextResponse.json({ transaction: base64 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
