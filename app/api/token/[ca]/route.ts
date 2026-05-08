import { NextRequest, NextResponse } from 'next/server';

interface DexScreenerPair {
  baseToken: {
    name: string;
    symbol: string;
  };
  info?: {
    imageUrl?: string;
    websites?: Array<{ url: string }>;
    socials?: Array<{ type: string; url: string }>;
  };
  fdv?: number;
  marketCap?: number;
}

interface DexScreenerResponse {
  pairs?: DexScreenerPair[];
}

interface TokenMetadata {
  name: string;
  ticker: string;
  description: string;
  image_url: string;
  website?: string;
  twitter?: string;
  telegram?: string;
  market_cap?: number;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ca: string }> }
) {
  const { ca } = await params;

  if (!ca || ca.length < 32 || ca.length > 44) {
    return NextResponse.json({ error: 'Invalid token address' }, { status: 400 });
  }

  try {
    // Fetch from DexScreener API
    const dexScreenerResponse = await fetch(
      `https://api.dexscreener.com/latest/dex/tokens/${ca}`,
      { next: { revalidate: 60 } } // Cache for 60 seconds
    );

    let dexData: DexScreenerResponse | null = null;
    if (dexScreenerResponse.ok) {
      dexData = await dexScreenerResponse.json();
    }

    // Extract the first pair (usually the most liquid)
    const pair = dexData?.pairs?.[0];

    // Build the response with DexScreener data taking priority
    const metadata: TokenMetadata = {
      name: pair?.baseToken?.name || 'Unknown Token',
      ticker: pair?.baseToken?.symbol ? `$${pair.baseToken.symbol}` : '$UNKNOWN',
      description: `Token on Solana blockchain.`,
      image_url: pair?.info?.imageUrl || `https://api.dicebear.com/7.x/shapes/svg?seed=${ca.slice(0, 8)}`,
      market_cap: pair?.fdv || pair?.marketCap || undefined,
    };

    // Extract socials from DexScreener
    if (pair?.info?.websites?.[0]?.url) {
      metadata.website = pair.info.websites[0].url;
    }

    if (pair?.info?.socials) {
      for (const social of pair.info.socials) {
        if (social.type === 'twitter' && social.url) {
          metadata.twitter = social.url;
        }
        if (social.type === 'telegram' && social.url) {
          metadata.telegram = social.url;
        }
      }
    }

    return NextResponse.json(metadata);
  } catch (error) {
    console.error('Error fetching token metadata:', error);
    
    // Return fallback data on error
    return NextResponse.json({
      name: 'Unknown Token',
      ticker: '$UNKNOWN',
      description: 'Could not fetch token metadata.',
      image_url: `https://api.dicebear.com/7.x/shapes/svg?seed=${ca.slice(0, 8)}`,
    });
  }
}
