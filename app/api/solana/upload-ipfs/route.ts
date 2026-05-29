import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const name        = formData.get('name')        as string || '';
    const symbol      = formData.get('symbol')      as string || '';
    const description = formData.get('description') as string || '';
    const twitter     = formData.get('twitter')     as string || '';
    const telegram    = formData.get('telegram')    as string || '';
    const website     = formData.get('website')     as string || '';
    const imageUrl    = formData.get('imageUrl')    as string || '';
    let   fileBlob    = formData.get('file')        as Blob | null;

    // If no file uploaded but we have an image URL — download it
    if (!fileBlob && imageUrl) {
      try {
        // Try multiple IPFS gateways if the URL is IPFS
        const urls: string[] = [imageUrl];
        if (imageUrl.includes('ipfs.io/ipfs/') || imageUrl.startsWith('ipfs://')) {
          const hash = imageUrl.split('ipfs/').pop()!;
          urls.unshift(
            `https://cloudflare-ipfs.com/ipfs/${hash}`,
            `https://gateway.pinata.cloud/ipfs/${hash}`,
          );
        }
        for (const url of urls) {
          try {
            const r = await fetch(url, {
              headers: { 'User-Agent': 'Mozilla/5.0' },
              signal: AbortSignal.timeout(10000),
            });
            if (r.ok) {
              const buf = await r.arrayBuffer();
              const ct  = r.headers.get('content-type') || 'image/png';
              fileBlob  = new Blob([buf], { type: ct });
              break;
            }
          } catch {}
        }
      } catch {}
    }

    const pumpForm = new FormData();
    if (fileBlob) pumpForm.append('file', fileBlob, 'image.png');
    pumpForm.append('name',        name);
    pumpForm.append('symbol',      symbol);
    pumpForm.append('description', description);
    pumpForm.append('showName', 'true');
    if (twitter)  pumpForm.append('twitter',  twitter);
    if (telegram) pumpForm.append('telegram', telegram);
    if (website)  pumpForm.append('website',  website);

    const res = await fetch('https://pump.fun/api/ipfs', {
      method: 'POST',
      body: pumpForm,
      signal: AbortSignal.timeout(60000),
    });

    if (!res.ok) {
      const txt = await res.text();
      return NextResponse.json({ error: `pump.fun IPFS: ${res.status} ${txt.slice(0, 200)}` }, { status: 500 });
    }

    const data = await res.json();
    if (!data.metadataUri) {
      return NextResponse.json({ error: `No metadataUri: ${JSON.stringify(data).slice(0,200)}` }, { status: 500 });
    }
    return NextResponse.json({ uri: data.metadataUri, imageUrl: data.metadata?.image || '' });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
