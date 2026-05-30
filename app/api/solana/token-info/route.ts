import { NextRequest, NextResponse } from 'next/server';
const HELIUS = process.env.SOLANA_RPC || 'https://mainnet.helius-rpc.com/?api-key=a7988ce3-1c0c-4130-bad6-4b65b0e8cf73';
const HDR = { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' };

export async function GET(req: NextRequest) {
  let ca = req.nextUrl.searchParams.get('ca')?.trim() || '';
  if (!ca) return NextResponse.json({ error: 'Missing ca' }, { status: 400 });
  if (ca.length > 44 && ca.toLowerCase().endsWith('pump')) ca = ca.slice(0,-4).trim();

  let name='',symbol='',description='',image='',website='',twitter='',telegram='';
  let price=0,marketCap=0,liquidity=0,volume24h=0,holders=0;

  // ALL 4 sources in parallel — Helius included from the start, not as sequential fallback
  const [pumpR, dexR, gmgnR, heliusR] = await Promise.allSettled([
    fetch(`https://frontend-api.pump.fun/coins/${ca}`, { headers: HDR, signal: AbortSignal.timeout(3000) })
      .then(r => r.ok ? r.json() : null).catch(() => null),
    fetch(`https://api.dexscreener.com/latest/dex/tokens/${ca}`, { headers: HDR, signal: AbortSignal.timeout(4000) })
      .then(r => r.ok ? r.json() : null).catch(() => null),
    fetch(`https://gmgn.ai/defi/quotation/v1/tokens/sol/${ca}`, { headers: HDR, signal: AbortSignal.timeout(4000) })
      .then(r => r.ok ? r.json() : null).catch(() => null),
    fetch(HELIUS, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ jsonrpc:'2.0', id:1, method:'getAsset', params:{id:ca} }),
      signal: AbortSignal.timeout(4000),
    }).then(r => r.ok ? r.json() : null).catch(() => null),
  ]);

  // 1. pump.fun — fastest, best for new tokens
  if (pumpR.status === 'fulfilled' && pumpR.value) {
    const p = pumpR.value;
    name        = p.name        || '';
    symbol      = p.symbol      || '';
    image       = p.image_uri   || p.image || '';
    description = p.description || '';
    website     = p.website     || '';
    twitter     = p.twitter     || '';
    telegram    = p.telegram    || '';
    marketCap   = p.usd_market_cap || 0;
    if (twitter && !twitter.startsWith('http')) twitter = `https://x.com/${twitter.replace('@','')}`;
    if (telegram && !telegram.startsWith('http')) telegram = `https://t.me/${telegram.replace('@','')}`;
  }

  // 2. DexScreener — price, liquidity
  if (dexR.status === 'fulfilled' && dexR.value) {
    const pair = dexR.value.pairs?.[0];
    if (pair) {
      const info = pair.info || {};
      if (!name)   name   = pair.baseToken?.name   || '';
      if (!symbol) symbol = pair.baseToken?.symbol || '';
      if (!image)  image  = info.imageUrl          || '';
      price     = parseFloat(pair.priceUsd || '0');
      if (!marketCap) marketCap = pair.marketCap || 0;
      liquidity = pair.liquidity?.usd || 0;
      volume24h = pair.volume?.h24    || 0;
      if (!website) website = info.websites?.[0]?.url || '';
      for (const s of (info.socials || [])) {
        const t = (s.type || '').toLowerCase();
        if ((t==='twitter'||t==='x') && !twitter) twitter = s.url;
        if (t==='telegram'           && !telegram) telegram = s.url;
      }
    }
  }

  // 3. GMGN — description, holders
  if (gmgnR.status === 'fulfilled' && gmgnR.value) {
    const tk = gmgnR.value?.data?.token || {};
    if (!name)        name        = tk.name        || '';
    if (!symbol)      symbol      = tk.symbol      || '';
    if (!image)       image       = tk.image_uri   || tk.logo || '';
    if (!description) description = tk.description || '';
    if (!twitter)     twitter     = tk.twitter     || tk.social_links?.twitter  || '';
    if (!telegram)    telegram    = tk.telegram    || tk.social_links?.telegram || '';
    if (!website)     website     = tk.website     || tk.social_links?.website  || '';
    if (!marketCap)   marketCap   = tk.market_cap  || 0;
    if (!price)       price       = tk.price || 0;
    holders = tk.holder_count || 0;
  }

  // 4. Helius getAsset (ran in parallel above) — fills gaps, then fetches IPFS JSON for description
  if (heliusR.status === 'fulfilled' && heliusR.value) {
    const content = heliusR.value?.result?.content || {};
    const meta = content.metadata || {};
    const files = content.files || [];
    const jsonUri = content.json_uri || '';
    if (!name)   name   = meta.name   || '';
    if (!symbol) symbol = meta.symbol || '';
    if (!image && files[0]) image = files[0].uri || files[0].cdn_uri || '';

    // Fetch IPFS JSON only if we still need description
    if (jsonUri && !description) {
      try {
        const gateways = [jsonUri];
        const hash = jsonUri.split('ipfs/').pop();
        if (hash) gateways.unshift(`https://cloudflare-ipfs.com/ipfs/${hash}`);
        for (const gw of gateways) {
          try {
            const jr = await fetch(gw, { headers: HDR, signal: AbortSignal.timeout(3000) });
            if (!jr.ok) continue;
            const j = await jr.json(); const ext = j.extensions || {};
            if (!description) description = j.description || '';
            if (!image)       image       = j.image || '';
            if (!twitter)     twitter     = ext.twitter || j.twitter || '';
            if (!telegram)    telegram    = ext.telegram || j.telegram || '';
            if (!website)     website     = ext.website || j.website || j.external_url || '';
            break;
          } catch {}
        }
      } catch {}
    }
  }

  if (!name) return NextResponse.json({ error:'Token not found' },{status:404});
  return NextResponse.json({ name, symbol, image, description, website, twitter, telegram, price, marketCap, liquidity, volume24h, holders });
}
