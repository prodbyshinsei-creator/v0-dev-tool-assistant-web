// Realistic fake Solana data for the DEV TOOL ASSISTANT

export interface Wallet {
  id: string;
  name: string;
  address: string;
  balance: number;
  type: 'dev' | 'volume';
}

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

// Mock wallets
export const mockDevWallets: Wallet[] = [
  {
    id: '1',
    name: 'Main Dev',
    address: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    balance: 12.45,
    type: 'dev',
  },
  {
    id: '2',
    name: 'Launch Wallet',
    address: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
    balance: 8.21,
    type: 'dev',
  },
  {
    id: '3',
    name: 'Backup Dev',
    address: '4Nd1mBQtrMJVYVfKf2PJy9NZUZdTAsp7D4xWLs4gDB4T',
    balance: 3.77,
    type: 'dev',
  },
];

export const mockVolumeWallets: Wallet[] = [
  {
    id: '4',
    name: 'Volume 1',
    address: '2wmVCSfPxGPjrnMMn7rchp4uaeoTqN39mXFC2zhPdri9',
    balance: 0.89,
    type: 'volume',
  },
  {
    id: '5',
    name: 'Volume 2',
    address: '5VCwKtCXgCJ6X1AWtrGUSdHE7TxfNuMvbKTbECDCzCDC',
    balance: 1.23,
    type: 'volume',
  },
  {
    id: '6',
    name: 'Volume 3',
    address: '3sB3nkTXSEDhMBphpQCYT4MjA9qhWLRkREBrBYnshTwQ',
    balance: 0.56,
    type: 'volume',
  },
  {
    id: '7',
    name: 'Volume 4',
    address: 'HN7cABqLq46Es1jh92dQQisAi1Y1A5XCZyJFkXM4WnpQ',
    balance: 2.14,
    type: 'volume',
  },
];

export const mockLaunchedTokens: LaunchedToken[] = [
  {
    id: '1',
    ca: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
    name: 'BONK',
    marketCap: 245000,
    launchedAt: new Date(Date.now() - 1000 * 60 * 30),
  },
  {
    id: '2',
    ca: '7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr',
    name: 'POPCAT',
    marketCap: 89000,
    launchedAt: new Date(Date.now() - 1000 * 60 * 120),
  },
  {
    id: '3',
    ca: 'Gu3LDkn7Vx3bmCzLafYNKcDxv2mH7YN44NJZFXnypump',
    name: 'FWOG',
    marketCap: 12500,
    launchedAt: new Date(Date.now() - 1000 * 60 * 5),
  },
];

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
