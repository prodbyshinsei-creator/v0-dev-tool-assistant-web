import { NextRequest, NextResponse } from 'next/server';

const HELIUS_RPC = process.env.SOLANA_RPC || 'https://mainnet.helius-rpc.com/?api-key=a7988ce3-1c0c-4130-bad6-4b65b0e8cf73';

const timeout = (ms: number) => ({ signal: AbortSignal.timeout(ms) });

export async function GET(req: NextRequest) {
  const ca = req.nextUrl.searchParams.get('ca')?.trim();
  if (!ca) return NextResponse.json({ error: 'Missing ca' }, { status: 400 });

  let name = '', symbol = '', description = '', image = '';
  let website = '', twitter = '', telegram = '';
  let price = 0, marketCap = 0;

  // ── 1. DexScreener (best for image + socials for traded tokens) ─────────────
  try {
    const r = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${ca}`,
      { headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' }, ...timeout(6000) });
    if (r.ok) {
      const d = await r.json();
      const pair = d.pairs?.[0];
      if (pair) {
        const info = pair.info || {};
        name    = pair.baseToken?.name || '';
        symbol  = pair.baseToken?.symbol || '';
        image   = info.imageUrl || '';
        price   = parseFloat(pair.priceUsd || '0');
        marketCap = pair.marketCap || 0;
        website = info.websites?.[0]?.url || '';
        for (const s of (info.socials || [])) {
          const t = (s.type || '').toLowerCase();
          if ((t === 'twitter' || t === 'x') && !twitter) twitter = s.url;
          if (t === 'telegram' && !telegram) telegram = s.url;
        }
      }
    }
  } catch {}

  // ── 2. GMGN (description + socials for pump.fun tokens) ────────────────
  try {
    const r = await fetch(`https://gmgn.ai/defi/quotation/v1/tokens/sol/${ca}`, {
      headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' },
      ...timeout(5000),
    });
    if (r.ok) {
      const d = await r.json();
      const token = d?.data?.token || {};
      if (!name)        name        = token.name || '';
      if (!symbol)      symbol      = token.symbol || '';
      if (!image)       image       = token.image_uri || token.logo || '';
      if (!description) description = token.description || '';
      if (!twitter)     twitter     = token.twitter || token.social_links?.twitter || '';
      if (!telegram)    telegram    = token.telegram || token.social_links?.telegram || '';
      if (!website)     website     = token.website || token.social_links?.website || '';
      if (!marketCap)   marketCap   = token.market_cap || 0;
    }
  } catch {}

  // ── 3. Helius getAsset + IPFS JSON (fallback for any SPL token) ─────────
  if (!name || !image || (!twitter && !telegram && !description)) {
    try {
      const r = await fetch(HELIUS_RPC, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getAsset', params: { id: ca } }),
        ...timeout(8000),
      });
      if (r.ok) {
        const asset = await r.json();
        const content  = asset.result?.content || {};
        const metadata = content.metadata || {};
        const files    = content.files || [];
        const jsonUri  = content.json_uri || '';

        if (!name)   name   = metadata.name   || '';
        if (!symbol) symbol = metadata.symbol || '';
        if (!image && files.length > 0) image = files[0].uri || files[0].cdn_uri || '';

        // Fetch IPFS metadata JSON for description + socials
        if (jsonUri && (!description || !twitter || !telegram)) {
          const gateways: string[] = [jsonUri];
          if (jsonUri.includes('ipfs.io/ipfs/') || jsonUri.includes('ipfs://')) {
            const hash = jsonUri.split('ipfs/').pop()!;
            gateways.unshift(
              `https://cloudflare-ipfs.com/ipfs/${hash}`,
              `https://gateway.pinata.cloud/ipfs/${hash}`,
            );
          }
          for (const gw of gateways) {
            try {
              const jr = await fetch(gw, { headers: { 'User-Agent': 'Mozilla/5.0' }, ...timeout(6000) });
              if (jr.ok) {
                const j = await jr.json();
                if (!name)        name        = j.name        || name;
                if (!symbol)      symbol      = j.symbol      || symbol;
                if (!description) description = j.description || '';
                if (!image)       image       = j.image       || '';
                const ext = j.extensions || {};
                if (!twitter)  twitter  = ext.twitter  || j.twitter  || '';
                if (!telegram) telegram = ext.telegram || j.telegram || '';
                if (!website)  website  = ext.website  || j.website  || j.external_url || '';
                break;
              }
            } catch {}
          }
        }
      }
    } catch {}
  }

  if (!name) return NextResponse.json({ error: 'Token not found' }, { status: 404 });

  return NextResponse.json({ name, symbol, image, description, website, twitter, telegram, price, marketCap });
}
