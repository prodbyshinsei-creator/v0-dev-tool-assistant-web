import { NextRequest, NextResponse } from 'next/server';
import { verifySession, tokenFromRequest } from '@/lib/session';

export async function GET(req: NextRequest) {
  const user = await verifySession(tokenFromRequest(req));
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json(user);
}
