import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const pumpForm = new FormData();
    const file = formData.get('file');
    if (file) pumpForm.append('file', file as Blob);

    pumpForm.append('name',        formData.get('name')        as string || '');
    pumpForm.append('symbol',      formData.get('symbol')      as string || '');
    pumpForm.append('description', formData.get('description') as string || '');
    pumpForm.append('showName', 'true');

    const twitter  = formData.get('twitter');
    const telegram = formData.get('telegram');
    const website  = formData.get('website');
    if (twitter)  pumpForm.append('twitter',  twitter  as string);
    if (telegram) pumpForm.append('telegram', telegram as string);
    if (website)  pumpForm.append('website',  website  as string);

    const res = await fetch('https://pump.fun/api/ipfs', {
      method: 'POST',
      body: pumpForm,
    });

    if (!res.ok) {
      const txt = await res.text();
      return NextResponse.json({ error: `IPFS: ${txt}` }, { status: 500 });
    }

    const data = await res.json();
    return NextResponse.json({
      uri: data.metadataUri,
      imageUrl: data.metadata?.image || '',
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
