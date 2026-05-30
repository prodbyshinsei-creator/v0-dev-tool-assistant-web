import { NextRequest, NextResponse } from 'next/server';
const HELIUS_KEY = 'a7988ce3-1c0c-4130-bad6-4b65b0e8cf73';

export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get('wallet') || '';
  const mint   = req.nextUrl.searchParams.get('mint')   || '';
  const limit  = Math.min(parseInt(req.nextUrl.searchParams.get('limit') || '50'), 100);
  if (!wallet) return NextResponse.json({ error: 'Missing wallet', trades: [] });

  try {
    const url = `https://api.helius.xyz/v0/addresses/${wallet}/transactions?api-key=${HELIUS_KEY}&limit=${limit}&type=SWAP`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`Helius ${res.status}`);
    const txs: any[] = await res.json();

    const trades = txs
      .filter(tx => !mint || (tx.description || '').includes(mint) ||
        (tx.tokenTransfers || []).some((t: any) => t.mint === mint))
      .map((tx: any) => {
        const tt = tx.tokenTransfers || [];
        const nt = tx.nativeTransfers || [];
        const solOut = nt.filter((t: any) => t.fromUserAccount === wallet).reduce((s: number, t: any) => s + t.amount / 1e9, 0);
        const solIn  = nt.filter((t: any) => t.toUserAccount   === wallet).reduce((s: number, t: any) => s + t.amount / 1e9, 0);
        const action = solOut > solIn ? 'buy' : 'sell';
        const tkIn   = tt.find((t: any) => t.toUserAccount   === wallet);
        const tkOut  = tt.find((t: any) => t.fromUserAccount === wallet);
        const tokenMint   = tkIn?.mint || tkOut?.mint || '';
        const tokenAmount = tkIn?.tokenAmount || tkOut?.tokenAmount || 0;
        const solAmount   = Math.abs(solOut - solIn);
        return {
          id: tx.signature, signature: tx.signature,
          timestamp: (tx.timestamp || 0) * 1000, action,
          mint: tokenMint,
          tokenSymbol: tkIn?.symbol || tkOut?.symbol || tokenMint.slice(0, 6) + '…',
          tokenName:   tkIn?.name   || tkOut?.name   || '',
          tokenImage:  '',
          tokenAmount, solAmount,
          walletAddress: wallet, walletName: wallet.slice(0,6)+'…'+wallet.slice(-4),
          source: tx.source || 'unknown',
        };
      })
      .filter((t: any) => t.mint && t.solAmount > 0.00001);

    return NextResponse.json({ trades });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, trades: [] });
  }
}
