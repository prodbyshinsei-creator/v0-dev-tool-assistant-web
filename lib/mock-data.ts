// Realistic fake Solana data for the DEV TOOL ASSISTANT

export interface LaunchedToken {
  id: string;
  ca: string;
  name: string;
  marketCap: number;
  launchedAt: Date;
}

export interface VolumeStats {
  txCount: number;
  running: boolean;
  feesSpent: number;
}

// Helper to generate random Solana address
export function generateSolanaAddress(): string {
  const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let address = '';
  for (let i = 0; i < 44; i++) {
    address += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return address;
}

// Helper to shorten address
export function shortenAddress(address: string): string {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

// Format market cap
export function formatMarketCap(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(2)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}K`;
  }
  return `$${value.toFixed(0)}`;
}
