import { NextRequest, NextResponse } from 'next/server';

const HELIUS_RPC = process.env.SOLANA_RPC || 'https://mainnet.helius-rpc.com/?api-key=a7988ce3-1c0c-4130-bad6-4b65b0e8cf73';

export async function GET(req: NextRequest) {
  let ca = req.nextUrl.searchParams.get('ca')?.trim() || '';
  if (!ca) return NextResponse.json({ error: 'Missing ca' }, { status: 400 });

  // Only strip trailing "pump" if address is LONGER than 44 chars (extra suffix)
  // Valid pump.fun CAs are exactly 44 chars and MUST keep the "pump" suffix
  if (ca.length > 44 && ca.toLowerCase().endsWith('pump')) {
    ca = ca.slice(0, -4).trim();
  }

  let name='', symbol='', description='', image='', website='', twitter='', telegram='';
  let price=0, marketCap=0;

  // 1+2. DexScreener + GMGN PARALLEL
  const [dexRes, gmgnRes] = await Promise.allSettled([
    fetch(`https://api.dexscreener.com/latest/dex/tokens/${ca}`, {
      headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' },
      signal: AbortSignal.timeout(5000),
    }).then(r => r.ok ? r.json() : null).catch(() => null),

    fetch(`https://gmgn.ai/defi/quotation/v1/tokens/sol/${ca}`, {
      headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' },
      signal: AbortSignal.timeout(5000),
    }).then(r => r.ok ? r.json() : null).catch(() => null),
  ]);

  if (dexRes.status === 'fulfilled' && dexRes.value) {
    const pair = dexRes.value.pairs?.[0];
    if (pair) {
      const info = pair.info || {};
      name = pair.baseToken?.name || ''; symbol = pair.baseToken?.symbol || '';
      image = info.imageUrl || ''; price = parseFloat(pair.priceUsd || '0'); marketCap = pair.marketCap || 0;
      website = info.websites?.[0]?.url || '';
      for (const s of (info.socials || [])) {
        const t = (s.type || '').toLowerCase();
        if ((t === 'twitter' || t === 'x') && !twitter) twitter = s.url;
        if (t === 'telegram' && !telegram) telegram = s.url;
      }
    }
  }

  if (gmgnRes.status === 'fulfilled' && gmgnRes.value) {
    const token = gmgnRes.value?.data?.token || {};
    if (!name)        name        = token.name        || '';
    if (!symbol)      symbol      = token.symbol      || '';
    if (!image)       image       = token.image_uri   || token.logo || '';
    if (!description) description = token.description || '';
    if (!twitter)     twitter     = token.twitter     || token.social_links?.twitter  || '';
    if (!telegram)    telegram    = token.telegram    || token.social_links?.telegram || '';
    if (!website)     website     = token.website     || token.social_links?.website  || '';
    if (!marketCap)   marketCap   = token.market_cap  || 0;
  }

  // 3. Helius getAsset + IPFS JSON fallback
  if (!name || !image) {
    try {
      const ar = await fetch(HELIUS_RPC, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getAsset', params: { id: ca } }),
        signal: AbortSignal.timeout(7000),
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
          if (hash && (jsonUri.includes('ipfs.io') || jsonUri.includes('ipfs://'))) {
            gateways.unshift(
              `https://cloudflare-ipfs.com/ipfs/${hash}`,
              `https://gateway.pinata.cloud/ipfs/${hash}`,
            );
          }
          for (const gw of gateways) {
            try {
              const jr = await fetch(gw, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(5000) });
              if (!jr.ok) continue;
              const j = await jr.json(); const ext = j.extensions || {};
              if (!name)        name        = j.name        || name;
              if (!symbol)      symbol      = j.symbol      || symbol;
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
  return NextResponse.json({ name, symbol, image, description, website, twitter, telegram, price, marketCap });
}
