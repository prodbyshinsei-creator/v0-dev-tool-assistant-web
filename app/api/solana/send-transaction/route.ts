import { NextRequest, NextResponse } from 'next/server';
const RPC = process.env.SOLANA_RPC || 'https://mainnet.helius-rpc.com/?api-key=a7988ce3-1c0c-4130-bad6-4b65b0e8cf73';

export async function POST(req: NextRequest) {
  const { transaction } = await req.json();
  if (!transaction) return NextResponse.json({ error: 'Missing transaction' }, { status: 400 });
  const res = await fetch(RPC, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0', id: 1, method: 'sendTransaction',
      params: [transaction, { encoding: 'base64', skipPreflight: false, preflightCommitment: 'processed' }],
    }),
  });
  const data = await res.json();
  if (data.error) return NextResponse.json({ error: data.error.message || 'RPC error' }, { status: 500 });
  return NextResponse.json({ success: true, signature: data.result });
}
