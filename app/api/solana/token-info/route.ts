import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const ca = req.nextUrl.searchParams.get('ca');
  if (!ca) return NextResponse.json({ error: 'Missing ca' }, { status: 400 });

  // 1. Try DexScreener
  try {
    const dexRes = await fetch(
      `https://api.dexscreener.com/latest/dex/tokens/${ca}`,
      { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(5000) }
    );
    if (dexRes.ok) {
      const dexData = await dexRes.json();
      const pair = dexData.pairs?.[0];
      if (pair) {
        return NextResponse.json({
          name: pair.baseToken.name,
          symbol: pair.baseToken.symbol,
          image: pair.info?.imageUrl || '',
          description: '',
          supply: '',
          website: pair.info?.websites?.[0]?.url || '',
          twitter:
            pair.info?.socials?.find((s: any) => s.type === 'twitter')?.url || '',
          telegram:
            pair.info?.socials?.find((s: any) => s.type === 'telegram')?.url || '',
          price: parseFloat(pair.priceUsd || '0'),
          marketCap: pair.marketCap || 0,
          volume24h: pair.volume?.h24 || 0,
        });
      }
    }
  } catch {}

  // 2. Fallback: pump.fun API
  try {
    const pumpRes = await fetch(`https://pump.fun/api/coins/${ca}`, {
      signal: AbortSignal.timeout(5000),
    });
    if (pumpRes.ok) {
      const pump = await pumpRes.json();
      return NextResponse.json({
        name: pump.name || 'Unknown',
        symbol: pump.symbol || 'UNK',
        image: pump.image_uri || '',
        description: pump.description || '',
        supply: String(pump.total_supply || '1000000000'),
        website: pump.website || '',
        twitter: pump.twitter || '',
        telegram: pump.telegram || '',
        price: pump.usd_market_cap
          ? pump.usd_market_cap / 1_000_000_000
          : 0,
        marketCap: pump.usd_market_cap || 0,
        volume24h: 0,
      });
    }
  } catch {}

  return NextResponse.json({ error: 'Token not found' }, { status: 404 });
}
