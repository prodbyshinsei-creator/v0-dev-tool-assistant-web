'use client';

import { useState, useEffect } from 'react';
import { Rocket, Trash2, Loader2, Twitter, Send, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Header } from '@/components/header';
import {
  mockDevWallets,
  mockLaunchedTokens,
  LaunchedToken,
  shortenAddress,
  formatMarketCap,
  generateSolanaAddress,
} from '@/lib/mock-data';

interface VampPanelProps {
  onBack: () => void;
}

interface TokenMetadata {
  image_url: string;
  name: string;
  ticker: string;
  description: string;
  twitter?: string;
  telegram?: string;
  website?: string;
  market_cap?: number;
}

const devBuyPresets = ['0.1', '0.5', '1', '2', '5'];

// Fetch token metadata from API (DexScreener + onchain fallback)
const fetchTokenMetadata = async (ca: string): Promise<TokenMetadata> => {
  const response = await fetch(`/api/token/${ca}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch token data');
  }
  
  return response.json();
};

export function VampPanel({ onBack }: VampPanelProps) {
  const [tokenCA, setTokenCA] = useState('');
  const [tokenMetadata, setTokenMetadata] = useState<TokenMetadata | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  
  const [selectedWallet, setSelectedWallet] = useState('');
  const [launchCount, setLaunchCount] = useState('1');
  const [devBuyAmount, setDevBuyAmount] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [launchedTokens, setLaunchedTokens] = useState<LaunchedToken[]>(mockLaunchedTokens);
  const [isLaunching, setIsLaunching] = useState(false);

  // Auto-fetch when CA is pasted (detect full address)
  useEffect(() => {
    const trimmedCA = tokenCA.trim();
    
    // Solana addresses are 32-44 characters
    if (trimmedCA.length >= 32 && trimmedCA.length <= 44) {
      setIsFetching(true);
      setFetchError(null);
      setTokenMetadata(null);
      
      fetchTokenMetadata(trimmedCA)
        .then((metadata) => {
          setTokenMetadata(metadata);
          setIsFetching(false);
        })
        .catch(() => {
          setFetchError('Failed to fetch token data');
          setIsFetching(false);
        });
    } else {
      setTokenMetadata(null);
      setFetchError(null);
    }
  }, [tokenCA]);

  const handlePresetClick = (amount: string) => {
    setDevBuyAmount(amount);
    setCustomAmount('');
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    setDevBuyAmount('');
  };

  const handleLaunch = () => {
    if (!tokenCA || !selectedWallet || !tokenMetadata) return;
    
    setIsLaunching(true);
    setTimeout(() => {
      const newToken: LaunchedToken = {
        id: Date.now().toString(),
        ca: generateSolanaAddress(),
        name: tokenMetadata.ticker,
        marketCap: Math.floor(Math.random() * 100000) + 5000,
        launchedAt: new Date(),
      };
      setLaunchedTokens([newToken, ...launchedTokens]);
      setTokenCA('');
      setTokenMetadata(null);
      setIsLaunching(false);
    }, 2000);
  };

  const handleSell = (id: string) => {
    setLaunchedTokens(launchedTokens.filter((t) => t.id !== id));
  };

  const handleSellAll = () => {
    setLaunchedTokens([]);
  };

  const handleClear = () => {
    setTokenCA('');
    setTokenMetadata(null);
    setFetchError(null);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header title="VAMP" showBack onBack={onBack} variant="vamp" />
      
      <main className="flex-1 container max-w-xl mx-auto px-4 py-6 space-y-4">
        {/* CA Input - Always visible */}
        <section className="p-4 rounded-lg border border-vamp-red/30 bg-card">
          <div className="flex items-center gap-2 text-vamp-red mb-3">
            <img 
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/chrome-vampire-fangs_913262-152-CMgF3bACMdpqgcYjajL4kWgqlTq67j.png" 
              alt="Vamp"
              className="w-5 h-5 object-contain"
            />
            <span className="font-mono text-sm font-bold">Vamp Token</span>
          </div>
          
          <div className="relative">
            <Input
              placeholder="Paste token CA..."
              value={tokenCA}
              onChange={(e) => setTokenCA(e.target.value)}
              className="bg-input border-border focus:border-vamp-red/50 font-mono text-sm pr-10"
            />
            {tokenCA && !isFetching && (
              <button
                onClick={handleClear}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <span className="text-xs">×</span>
              </button>
            )}
          </div>
          
          {/* Loading State */}
          {isFetching && (
            <div className="flex items-center justify-center gap-2 mt-4 py-6">
              <Loader2 className="w-5 h-5 text-vamp-red animate-spin" />
              <span className="text-sm text-muted-foreground font-mono">Fetching token data...</span>
            </div>
          )}
          
          {/* Error State */}
          {fetchError && (
            <div className="mt-4 py-3 text-center">
              <span className="text-sm text-vamp-red font-mono">{fetchError}</span>
            </div>
          )}
        </section>

        {/* Token Preview - Shows after successful fetch */}
        {tokenMetadata && !isFetching && (
          <section className="p-4 rounded-lg border border-vamp-red/20 bg-card animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex gap-4">
              {/* Token Image */}
              <div className="w-16 h-16 rounded-lg overflow-hidden border border-vamp-red/30 bg-background flex-shrink-0">
                <img
                  src={tokenMetadata.image_url}
                  alt={tokenMetadata.name}
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Token Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono font-bold text-foreground">{tokenMetadata.name}</span>
                  <span className="text-vamp-red font-mono text-sm">{tokenMetadata.ticker}</span>
                  {tokenMetadata.market_cap && (
                    <span className="text-wallet-green font-mono text-xs">
                      {formatMarketCap(tokenMetadata.market_cap)}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {tokenMetadata.description}
                </p>
                
                {/* Social Links */}
                <div className="flex items-center gap-3 mt-2">
                  {tokenMetadata.twitter && (
                    <a
                      href={tokenMetadata.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-vamp-red transition-colors"
                    >
                      <Twitter className="w-3.5 h-3.5" />
                    </a>
                  )}
                  {tokenMetadata.telegram && (
                    <a
                      href={tokenMetadata.telegram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-vamp-red transition-colors"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </a>
                  )}
                  {tokenMetadata.website && (
                    <a
                      href={tokenMetadata.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-vamp-red transition-colors"
                    >
                      <Globe className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Launch Controls - Shows after token is loaded */}
        {tokenMetadata && !isFetching && (
          <section className="p-4 rounded-lg border border-vamp-red/20 bg-card space-y-4 animate-in fade-in slide-in-from-top-2 duration-300 delay-100">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Wallet</Label>
                <Select value={selectedWallet} onValueChange={setSelectedWallet}>
                  <SelectTrigger className="bg-input border-border h-9 text-sm">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockDevWallets.map((wallet) => (
                      <SelectItem key={wallet.id} value={wallet.id}>
                        {wallet.name} ({wallet.balance.toFixed(1)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Launch Count</Label>
                <Select value={launchCount} onValueChange={setLaunchCount}>
                  <SelectTrigger className="bg-input border-border h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 5, 10].map((count) => (
                      <SelectItem key={count} value={count.toString()}>
                        {count}x
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Dev Buy (SOL)</Label>
              <div className="flex flex-wrap gap-1.5">
                {devBuyPresets.map((preset) => (
                  <Button
                    key={preset}
                    variant={devBuyAmount === preset ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handlePresetClick(preset)}
                    className={`h-7 px-3 text-xs ${
                      devBuyAmount === preset
                        ? 'bg-vamp-red hover:bg-vamp-red-hover text-foreground'
                        : 'border-vamp-red/30 hover:border-vamp-red/60 hover:bg-vamp-red/10'
                    }`}
                  >
                    {preset}
                  </Button>
                ))}
                <Input
                  placeholder="Custom"
                  value={customAmount}
                  onChange={(e) => handleCustomAmountChange(e.target.value)}
                  type="number"
                  step="0.01"
                  className="w-20 h-7 bg-input border-border focus:border-vamp-red/50 font-mono text-xs px-2"
                />
              </div>
            </div>

            <Button
              onClick={handleLaunch}
              disabled={isLaunching || !selectedWallet}
              className="w-full bg-vamp-red hover:bg-vamp-red-hover text-foreground font-mono font-bold h-10"
            >
              {isLaunching ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Vamping...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Rocket className="w-4 h-4" />
                  VAMP & LAUNCH
                </span>
              )}
            </Button>
          </section>
        )}

        {/* Launched Tokens */}
        {launchedTokens.length > 0 && (
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img 
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/chrome-vampire-fangs_913262-152-CMgF3bACMdpqgcYjajL4kWgqlTq67j.png" 
                  alt="Vamped"
                  className="w-4 h-4 object-contain"
                />
                <span className="font-mono text-sm text-vamp-red">Vamped Tokens</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSellAll}
                className="h-6 px-2 text-xs text-muted-foreground hover:text-vamp-red"
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Sell All
              </Button>
            </div>

            <div className="space-y-1.5">
              {launchedTokens.map((token) => (
                <div
                  key={token.id}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-card hover:border-vamp-red/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-sm">{token.name}</span>
                    <span className="text-xs text-muted-foreground font-mono">
                      {shortenAddress(token.ca)}
                    </span>
                    <span className="text-xs text-wallet-green font-mono">
                      {formatMarketCap(token.marketCap)}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSell(token.id)}
                    className="h-6 px-2 text-xs text-vamp-red hover:bg-vamp-red/10"
                  >
                    Sell
                  </Button>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
