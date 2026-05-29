import { NextRequest, NextResponse } from 'next/server';

const HELIUS_RPC = process.env.SOLANA_RPC || 'https://mainnet.helius-rpc.com/?api-key=a7988ce3-1c0c-4130-bad6-4b65b0e8cf73';
const HDR = { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' };

export async function GET(req: NextRequest) {
  let ca = req.nextUrl.searchParams.get('ca')?.trim() || '';
  if (!ca) return NextResponse.json({ error: 'Missing ca' }, { status: 400 });
  if (ca.length > 44 && ca.toLowerCase().endsWith('pump')) ca = ca.slice(0, -4).trim();

  let name='', symbol='', description='', image='', website='', twitter='', telegram='';
  let price=0, marketCap=0, liquidity=0, volume24h=0, holders=0;

  // STEP 1: pump.fun direct API + DexScreener + GMGN — ALL in parallel
  const [pumpRes, dexRes, gmgnRes] = await Promise.allSettled([
    fetch(`https://frontend-api.pump.fun/coins/${ca}`, {
      headers: HDR, signal: AbortSignal.timeout(3000),
    }).then(r => r.ok ? r.json() : null).catch(() => null),

    fetch(`https://api.dexscreener.com/latest/dex/tokens/${ca}`, {
      headers: HDR, signal: AbortSignal.timeout(4000),
    }).then(r => r.ok ? r.json() : null).catch(() => null),

    fetch(`https://gmgn.ai/defi/quotation/v1/tokens/sol/${ca}`, {
      headers: HDR, signal: AbortSignal.timeout(4000),
    }).then(r => r.ok ? r.json() : null).catch(() => null),
  ]);

  // Parse pump.fun (fastest for brand-new tokens, responds in ~200ms)
  if (pumpRes.status === 'fulfilled' && pumpRes.value) {
    const p = pumpRes.value;
    if (!name)        name        = p.name        || '';
    if (!symbol)      symbol      = p.symbol      || '';
    if (!image)       image       = p.image_uri   || p.image || '';
    if (!description) description = p.description || '';
    if (!twitter)     twitter     = p.twitter     || '';
    if (!telegram)    telegram    = p.telegram    || '';
    if (!website)     website     = p.website     || '';
    if (!marketCap)   marketCap   = p.usd_market_cap || 0;
  }

  // Parse DexScreener
  if (dexRes.status === 'fulfilled' && dexRes.value) {
    const pair = dexRes.value.pairs?.[0];
    if (pair) {
      const info = pair.info || {};
      if (!name)   name   = pair.baseToken?.name   || name;
      if (!symbol) symbol = pair.baseToken?.symbol || symbol;
      if (!image)  image  = info.imageUrl          || image;
      price     = parseFloat(pair.priceUsd || '0');
      if (!marketCap) marketCap = pair.marketCap || 0;
      liquidity = pair.liquidity?.usd || 0;
      volume24h = pair.volume?.h24    || 0;
      if (!website) website = info.websites?.[0]?.url || '';
      for (const s of (info.socials || [])) {
        const t = (s.type || '').toLowerCase();
        if ((t === 'twitter' || t === 'x') && !twitter) twitter = s.url;
        if (t === 'telegram' && !telegram)               telegram = s.url;
      }
    }
  }

  // Parse GMGN (best for description + holders)
  if (gmgnRes.status === 'fulfilled' && gmgnRes.value) {
    const token = gmgnRes.value?.data?.token || {};
    if (!name)        name        = token.name        || name;
    if (!symbol)      symbol      = token.symbol      || symbol;
    if (!image)       image       = token.image_uri   || token.logo || image;
    if (!description) description = token.description || '';
    if (!twitter)     twitter     = token.twitter     || token.social_links?.twitter  || twitter;
    if (!telegram)    telegram    = token.telegram    || token.social_links?.telegram || telegram;
    if (!website)     website     = token.website     || token.social_links?.website  || website;
    if (!marketCap)   marketCap   = token.market_cap  || marketCap;
    if (!price)       price       = token.price       || 0;
    holders = token.holder_count || 0;
  }

  // STEP 2: Helius fallback only if still missing name/image
  if (!name || !image) {
    try {
      const ar = await fetch(HELIUS_RPC, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getAsset', params: { id: ca } }),
        signal: AbortSignal.timeout(6000),
      });
      if (ar.ok) {
        const a = await ar.json();
        const content = a.result?.content || {};
        const meta = content.metadata || {}; const files = content.files || []; const jsonUri = content.json_uri || '';
        if (!name)   name   = meta.name   || '';
        if (!symbol) symbol = meta.symbol || '';
        if (!image && files.length > 0) image = files[0].uri || files[0].cdn_uri || '';
        if (jsonUri && (!description || !twitter)) {
          const gateways = [jsonUri];
          const hash = jsonUri.split('ipfs/').pop();
          if (hash && (jsonUri.includes('ipfs.io') || jsonUri.includes('ipfs://')))
            gateways.unshift(`https://cloudflare-ipfs.com/ipfs/${hash}`);
          for (const gw of gateways) {
            try {
              const jr = await fetch(gw, { headers: HDR, signal: AbortSignal.timeout(4000) });
              if (!jr.ok) continue;
              const j = await jr.json(); const ext = j.extensions || {};
              if (!name)        name        = j.name        || name;
              if (!description) description = j.description || '';
              if (!image)       image       = j.image       || '';
              if (!twitter)     twitter     = ext.twitter   || j.twitter  || '';
              if (!telegram)    telegram    = ext.telegram  || j.telegram || '';
              if (!website)     website     = ext.website   || j.website  || j.external_url || '';
              break;
            } catch {}
          }
        }
      }
    } catch {}
  }

  if (!name) return NextResponse.json({ error: 'Token not found' }, { status: 404 });
  return NextResponse.json({ name, symbol, image, description, website, twitter, telegram, price, marketCap, liquidity, volume24h, holders });
}
