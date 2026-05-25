'use client';

import { useState, useEffect } from 'react';
import { Rocket, Trash2, Loader2, Twitter, Send, Globe, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Header } from '@/components/header';
import {
  LaunchedToken,
  shortenAddress,
  formatMarketCap,
  generateSolanaAddress,
} from '@/lib/mock-data';
import { cn } from '@/lib/utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

interface VampPanelProps {
  onBack: () => void;
  initialCA?: string;
  initialMetadata?: TokenMetadata | null;
}

interface TokenMetadata {
  name: string;
  ticker: string;
  description: string;
  image_url: string;
  twitter?: string;
  telegram?: string;
  website?: string;
}

interface WalletType {
  id: number;
  name: string;
  address: string;
  balance: number;
}

const multiLaunchOptions = [1, 3, 5, 10];
const devBuyPresets = [0.5, 1, 2, 5];

const platforms = [
  { id: 'pump', name: 'Pump', logo: '/platforms/pump.svg' },
  { id: 'bonk', name: 'Bonk', logo: '/platforms/bonk.svg' },
  { id: 'studio', name: 'Studio', logo: '/platforms/studio.svg' },
  { id: 'bags', name: 'Bags', logo: '/platforms/bags.svg' },
  { id: 'raydium', name: 'Raydium', logo: '/platforms/raydium.svg' },
  { id: 'meteora', name: 'Meteora', logo: '/platforms/meteora.svg' },
];

export function VampPanel({ onBack, initialCA, initialMetadata }: VampPanelProps) {
  const [tokenCA, setTokenCA] = useState('');
  const [tokenMetadata, setTokenMetadata] = useState<TokenMetadata | null>(null);
  const [isFetchingMetadata, setIsFetchingMetadata] = useState(false);
  const [metadataError, setMetadataError] = useState<string | null>(null);
  
  const [tokenName, setTokenName] = useState('');
  const [tokenTicker, setTokenTicker] = useState('');
  const [tokenDescription, setTokenDescription] = useState('');
  const [tokenWebsite, setTokenWebsite] = useState('');
  const [tokenTwitter, setTokenTwitter] = useState('');
  const [tokenTelegram, setTokenTelegram] = useState('');
  const [tokenImage, setTokenImage] = useState('');
  
  const [selectedWallet, setSelectedWallet] = useState('');
  const [launchCount, setLaunchCount] = useState(1);
  const [devBuyAmount, setDevBuyAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['pump']);
  
  const [wallets, setWallets] = useState<WalletType[]>([]);
  const [isLoadingWallets, setIsLoadingWallets] = useState(false);
  const [launchedTokens, setLaunchedTokens] = useState<LaunchedToken[]>([]);
  const [isLaunching, setIsLaunching] = useState(false);

  useEffect(() => {
    loadWallets();
  }, []);

  // Initialize with data from modal when EDIT is clicked
  useEffect(() => {
    if (initialCA) {
      setTokenCA(initialCA);
    }
    if (initialMetadata) {
      setTokenMetadata(initialMetadata);
      setTokenName(initialMetadata.name || '');
      setTokenTicker(initialMetadata.ticker || '');
      setTokenDescription(initialMetadata.description || '');
      setTokenWebsite(initialMetadata.website || '');
      setTokenTwitter(initialMetadata.twitter || '');
      setTokenTelegram(initialMetadata.telegram || '');
      setTokenImage(initialMetadata.image_url || '');
    }
  }, [initialCA, initialMetadata]);

  const loadWallets = async () => {
    try {
      setIsLoadingWallets(true);
      const response = await fetch(`${API_URL}/wallets?user_id=1&wallet_type=dev`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.wallets) {
          setWallets(data.wallets);
        }
      }
    } catch (error) {
      console.log('Backend unavailable');
    } finally {
      setIsLoadingWallets(false);
    }
  };

  useEffect(() => {
    const trimmedCA = tokenCA.trim();
    
    // Skip auto-fetch if we already have metadata from initialMetadata
    if (initialMetadata && tokenCA === initialCA) {
      return;
    }
    
    if (trimmedCA.length >= 32 && trimmedCA.length <= 44) {
      setIsFetchingMetadata(true);
      setMetadataError(null);
      
      fetch(`${API_URL}/vamp/metadata`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ca: trimmedCA }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data) {
            const meta = data.data;
            setTokenMetadata(meta);
            setTokenName(meta.name);
            setTokenTicker(meta.ticker);
            setTokenDescription(meta.description);
            setTokenWebsite(meta.website || '');
            setTokenTwitter(meta.twitter || '');
            setTokenTelegram(meta.telegram || '');
            setTokenImage(meta.image_url || '');
            setMetadataError(null);
          } else {
            setMetadataError(data.error || 'Failed to fetch token metadata');
          }
        })
        .catch((error) => {
          console.error('Metadata fetch error:', error);
          setMetadataError('Failed to fetch token metadata');
        })
        .finally(() => {
          setIsFetchingMetadata(false);
        });
    } else if (trimmedCA.length > 0) {
      setTokenMetadata(null);
      setMetadataError(null);
    }
  }, [tokenCA, initialCA, initialMetadata]);

  const handleLaunch = async () => {
    if (!tokenCA || !selectedWallet) return;
    
    setIsLaunching(true);

    try {
      const finalAmount = parseFloat(customAmount || devBuyAmount?.toString() || '0');
      
      const response = await fetch(`${API_URL}/vamp/launch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ca: tokenCA,
          dev_wallet_address: wallets.find(w => w.id.toString() === selectedWallet)?.address || '',
          dev_wallet_privkey: 'DEMO_KEY',
          dev_buy_sol: finalAmount,
          launch_count: launchCount,
          name: tokenName,
          ticker: tokenTicker,
          description: tokenDescription,
          website: tokenWebsite,
          twitter: tokenTwitter,
          telegram: tokenTelegram,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.launched_tokens) {
          const newTokens = data.launched_tokens.map((ca: string) => ({
            id: Date.now().toString() + Math.random(),
            ca: ca,
            name: tokenName || `TOKEN${Math.floor(Math.random() * 1000)}`,
            marketCap: Math.floor(Math.random() * 100000) + 5000,
            launchedAt: new Date(),
          }));
          setLaunchedTokens([...newTokens, ...launchedTokens]);
          
          setTokenCA('');
          setTokenMetadata(null);
          setTokenName('');
          setTokenTicker('');
          setTokenDescription('');
          setTokenWebsite('');
          setTokenTwitter('');
          setTokenTelegram('');
          setTokenImage('');
          setDevBuyAmount(null);
          setCustomAmount('');
          setLaunchCount(1);
          
          setIsLaunching(false);
          return;
        }
      }

      throw new Error('API unavailable');
      
    } catch (error) {
      console.log('Using mock launch');
      setTimeout(() => {
        const newToken: LaunchedToken = {
          id: Date.now().toString(),
          ca: tokenCA || generateSolanaAddress(),
          name: tokenName || `TOKEN${Math.floor(Math.random() * 1000)}`,
          marketCap: Math.floor(Math.random() * 100000) + 5000,
          launchedAt: new Date(),
        };
        setLaunchedTokens([newToken, ...launchedTokens]);
        
        setTokenCA('');
        setTokenMetadata(null);
        setTokenName('');
        setTokenTicker('');
        setTokenDescription('');
        setTokenWebsite('');
        setTokenTwitter('');
        setTokenTelegram('');
        setTokenImage('');
        setDevBuyAmount(null);
        setCustomAmount('');
        setLaunchCount(1);
        
        setIsLaunching(false);
      }, 1500);
    }
  };

  const handleSell = async (id: string) => {
    const token = launchedTokens.find(t => t.id === id);
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/vamp/sell`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ca: token.ca,
          wallet_address: wallets.find(w => w.id.toString() === selectedWallet)?.address || '',
          wallet_privkey: 'DEMO_KEY',
          slippage: 25,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setLaunchedTokens(launchedTokens.filter((t) => t.id !== id));
          return;
        }
      }
    } catch (error) {
      console.log('API unavailable, using mock sell');
    }

    setLaunchedTokens(launchedTokens.filter((t) => t.id !== id));
  };

  const handleSellAll = () => {
    setLaunchedTokens([]);
  };

  const togglePlatform = (platform: string) => {
    if (selectedPlatforms.includes(platform)) {
      setSelectedPlatforms(selectedPlatforms.filter(p => p !== platform));
    } else {
      setSelectedPlatforms([...selectedPlatforms, platform]);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header title="VAMP" showBack onBack={onBack} variant="vamp" />
      
      <main className="flex-1 container max-w-3xl mx-auto px-4 py-6 space-y-6">
        <section className="p-6 rounded-lg border border-vamp-red/30 bg-card space-y-5">
          <div className="flex items-center gap-3 text-vamp-red mb-2">
            <img src="/vamp-fangs-silver.png" alt="Vamp" className="w-8 h-8" />
            <h2 className="font-mono font-bold text-xl">Vamp Coin</h2>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">Contract Address</Label>
            <Input
              placeholder="4npUgkbThRtWjY5QVKzpHD8DJGKeLXxmrVgJx5yAQtjA"
              value={tokenCA}
              onChange={(e) => setTokenCA(e.target.value)}
              className="bg-input border-border focus:border-vamp-red/50 font-mono text-sm"
            />
          </div>

          {isFetchingMetadata && (
            <div className="flex items-center justify-center gap-2 py-3">
              <Loader2 className="w-5 h-5 text-vamp-red animate-spin" />
              <span className="text-sm text-muted-foreground">Fetching data...</span>
            </div>
          )}

          {metadataError && !isFetchingMetadata && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30">
              <span className="text-sm text-destructive">{metadataError}</span>
            </div>
          )}

          {tokenImage && (
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-lg overflow-hidden border border-vamp-red/30 flex-shrink-0">
                <img
                  src={tokenImage}
                  alt={tokenName}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="64" height="64"%3E%3Crect fill="%23333" width="64" height="64"/%3E%3C/svg%3E';
                  }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-muted-foreground">Token preview loaded</div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Name</Label>
              <Input
                value={tokenName}
                onChange={(e) => setTokenName(e.target.value)}
                placeholder="Token Name"
                className="bg-input border-border"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold">Ticker</Label>
              <Input
                value={tokenTicker}
                onChange={(e) => setTokenTicker(e.target.value)}
                placeholder="TICK"
                className="bg-input border-border"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">Description</Label>
            <Textarea
              value={tokenDescription}
              onChange={(e) => setTokenDescription(e.target.value)}
              placeholder="Token description..."
              className="bg-input border-border resize-none min-h-[80px]"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">Website</Label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={tokenWebsite}
                onChange={(e) => setTokenWebsite(e.target.value)}
                placeholder="https://example.com"
                className="bg-input border-border font-mono text-sm pl-10"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Twitter</Label>
              <div className="relative">
                <Twitter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={tokenTwitter}
                  onChange={(e) => setTokenTwitter(e.target.value)}
                  placeholder="https://x.com/..."
                  className="bg-input border-border font-mono text-sm pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold">Telegram</Label>
              <div className="relative">
                <Send className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={tokenTelegram}
                  onChange={(e) => setTokenTelegram(e.target.value)}
                  placeholder="https://t.me/..."
                  className="bg-input border-border font-mono text-sm pl-10"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="p-6 rounded-lg border border-vamp-red/30 bg-card space-y-5">
          <div className="flex items-center gap-2 text-vamp-red">
            <Rocket className="w-5 h-5" />
            <h3 className="font-mono font-bold text-lg">Launch Settings</h3>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">Platforms</Label>
            <div className="flex flex-wrap gap-2">
              {platforms.map((platform) => (
                <Button
                  key={platform.id}
                  variant={selectedPlatforms.includes(platform.id) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => togglePlatform(platform.id)}
                  className={cn(
                    'h-9 gap-1.5',
                    selectedPlatforms.includes(platform.id)
                      ? 'bg-vamp-red hover:bg-vamp-red-hover text-foreground'
                      : 'border-vamp-red/30 hover:border-vamp-red/60 hover:bg-vamp-red/10'
                  )}
                >
                  <img src={platform.logo} alt={platform.name} className="w-4 h-4" />
                  {selectedPlatforms.includes(platform.id) && (
                    <CheckCircle className="w-3 h-3" />
                  )}
                  {platform.name}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Wallet</Label>
              <Select value={selectedWallet} onValueChange={setSelectedWallet} disabled={isLoadingWallets}>
                <SelectTrigger className="bg-input border-border">
                  <SelectValue placeholder={isLoadingWallets ? "Loading..." : "Select wallet"} />
                </SelectTrigger>
                <SelectContent>
                  {wallets.map((wallet) => (
                    <SelectItem key={wallet.id} value={wallet.id.toString()}>
                      {wallet.name} ({wallet.balance.toFixed(2)} SOL)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold">Launch Count</Label>
              <div className="flex gap-1">
                {multiLaunchOptions.map((count) => (
                  <Button
                    key={count}
                    variant={launchCount === count ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setLaunchCount(count)}
                    className={cn(
                      'flex-1 h-9',
                      launchCount === count
                        ? 'bg-vamp-red hover:bg-vamp-red-hover text-foreground'
                        : 'border-vamp-red/30 hover:border-vamp-red/60 hover:bg-vamp-red/10'
                    )}
                  >
                    {count}x
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">Quick Deploy (SOL)</Label>
            <div className="flex gap-2">
              {devBuyPresets.map((preset) => (
                <Button
                  key={preset}
                  variant={devBuyAmount === preset ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setDevBuyAmount(preset);
                    setCustomAmount('');
                  }}
                  className={cn(
                    'flex-1 h-9',
                    devBuyAmount === preset
                      ? 'bg-vamp-red hover:bg-vamp-red-hover text-foreground'
                      : 'border-vamp-red/30 hover:border-vamp-red/60 hover:bg-vamp-red/10'
                  )}
                >
                  {preset}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">Custom Amount (SOL)</Label>
            <Input
              placeholder="0.1"
              value={customAmount}
              onChange={(e) => {
                setCustomAmount(e.target.value);
                setDevBuyAmount(null);
              }}
              type="number"
              step="0.01"
              className="bg-input border-border font-mono"
            />
          </div>

          <Button
            onClick={handleLaunch}
            disabled={isLaunching || !selectedWallet || selectedPlatforms.length === 0 || !tokenCA}
            className="w-full bg-vamp-red hover:bg-vamp-red-hover text-foreground font-bold h-11 text-base"
          >
            {isLaunching ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Launching {launchCount}x...
              </>
            ) : (
              <>
                <Rocket className="w-5 h-5 mr-2" />
                DEPLOY {launchCount > 1 ? `${launchCount}x` : ''}
              </>
            )}
          </Button>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-mono font-bold text-vamp-red">Launched Tokens</h2>
            {launchedTokens.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSellAll}
                className="border-vamp-red/30 hover:border-vamp-red/60 hover:bg-vamp-red/10 text-vamp-red"
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Sell All
              </Button>
            )}
          </div>

          {launchedTokens.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground border border-dashed border-border rounded-lg">
              No tokens launched yet
            </div>
          ) : (
            <div className="space-y-2">
              {launchedTokens.map((token) => (
                <div
                  key={token.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:border-vamp-red/30 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm">{token.name}</span>
                      <span className="text-xs text-muted-foreground font-mono">
                        {shortenAddress(token.ca)}
                      </span>
                    </div>
                    <div className="text-sm text-wallet-green font-mono">
                      {formatMarketCap(token.marketCap)}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSell(token.id)}
                    className="border-vamp-red/30 hover:border-vamp-red hover:bg-vamp-red/10 text-vamp-red"
                  >
                    Sell
                  </Button>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
