'use client';

import { useState, useEffect } from 'react';
import { Skull, Rocket, Trash2, Loader2, Twitter, Send, Globe } from 'lucide-react';
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
  LaunchedToken,
  shortenAddress,
  formatMarketCap,
  generateSolanaAddress,
} from '@/lib/mock-data';

// API Client
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

interface VampPanelProps {
  onBack: () => void;
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

const devBuyPresets = ['0.1', '0.5', '1', '2', '5'];

export function VampPanel({ onBack }: VampPanelProps) {
  const [tokenCA, setTokenCA] = useState('');
  const [tokenMetadata, setTokenMetadata] = useState<TokenMetadata | null>(null);
  const [isFetchingMetadata, setIsFetchingMetadata] = useState(false);
  const [metadataError, setMetadataError] = useState<string | null>(null);
  
  const [selectedWallet, setSelectedWallet] = useState('');
  const [launchCount, setLaunchCount] = useState('1');
  const [devBuyAmount, setDevBuyAmount] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [launchedTokens, setLaunchedTokens] = useState<LaunchedToken[]>([]);
  const [isLaunching, setIsLaunching] = useState(false);
  
  const [wallets, setWallets] = useState(mockDevWallets);
  const [isLoadingWallets, setIsLoadingWallets] = useState(false);

  // Загрузка кошельков из API
  useEffect(() => {
    loadWalletsFromAPI();
  }, []);

  const loadWalletsFromAPI = async () => {
    try {
      setIsLoadingWallets(true);
      const response = await fetch(`${API_URL}/wallets?user_id=1&wallet_type=dev`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.wallets) {
          const apiWallets = data.wallets.map((w: any) => ({
            id: w.id.toString(),
            name: w.name,
            address: w.address,
            balance: w.balance || 0,
          }));
          setWallets(apiWallets);
        }
      } else {
        console.log('Backend unavailable, using mock data');
        setWallets(mockDevWallets);
      }
    } catch (error) {
      console.log('Backend unavailable, using mock data');
      setWallets(mockDevWallets);
    } finally {
      setIsLoadingWallets(false);
    }
  };

  // Автоматическая загрузка метаданных токена при вставке CA
  useEffect(() => {
    const trimmedCA = tokenCA.trim();
    
    // Проверяем что CA валидный (32-44 символа - это Solana адрес)
    if (trimmedCA.length >= 32 && trimmedCA.length <= 44) {
      setIsFetchingMetadata(true);
      setMetadataError(null);
      setTokenMetadata(null);
      
      // Запрашиваем метаданные
      fetch(`${API_URL}/vamp/metadata`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ca: trimmedCA }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data) {
            setTokenMetadata(data.data);
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
    } else {
      // CA невалидный - сбрасываем метаданные
      setTokenMetadata(null);
      setMetadataError(null);
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

  const handleLaunch = async () => {
    if (!tokenCA || !selectedWallet) return;
    
    setIsLaunching(true);

    try {
      const response = await fetch(`${API_URL}/vamp/launch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ca: tokenCA,
          dev_wallet_address: wallets.find(w => w.id === selectedWallet)?.address || '',
          dev_wallet_privkey: 'DEMO_KEY',
          dev_buy_sol: parseFloat(customAmount || devBuyAmount || '0'),
          launch_count: parseInt(launchCount),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.launched_tokens) {
          const newTokens = data.launched_tokens.map((ca: string) => ({
            id: Date.now().toString() + Math.random(),
            ca: ca,
            name: tokenMetadata?.name || `TOKEN${Math.floor(Math.random() * 1000)}`,
            marketCap: Math.floor(Math.random() * 100000) + 5000,
            launchedAt: new Date(),
          }));
          setLaunchedTokens([...newTokens, ...launchedTokens]);
          setTokenCA('');
          setTokenMetadata(null);
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
          name: tokenMetadata?.name || `TOKEN${Math.floor(Math.random() * 1000)}`,
          marketCap: Math.floor(Math.random() * 100000) + 5000,
          launchedAt: new Date(),
        };
        setLaunchedTokens([newToken, ...launchedTokens]);
        setTokenCA('');
        setTokenMetadata(null);
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
          wallet_address: wallets.find(w => w.id === selectedWallet)?.address || '',
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

  return (
    <div className="min-h-screen flex flex-col">
      <Header title="VAMP" showBack onBack={onBack} variant="vamp" />
      
      <main className="flex-1 container max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Token CA Input */}
        <section className="p-4 rounded-lg border border-vamp-red/30 bg-card space-y-4">
          <div className="flex items-center gap-2 text-vamp-red">
            <Skull className="w-5 h-5" />
            <h2 className="font-mono font-bold">Launch Token</h2>
          </div>

          <div className="space-y-2">
            <Label htmlFor="token-ca" className="text-sm text-muted-foreground">
              Token CA
            </Label>
            <Input
              id="token-ca"
              placeholder="Enter token contract address..."
              value={tokenCA}
              onChange={(e) => setTokenCA(e.target.value)}
              className="bg-input border-border focus:border-vamp-red/50 font-mono text-sm"
            />
          </div>

          {/* Loading State */}
          {isFetchingMetadata && (
            <div className="flex items-center justify-center gap-2 py-4">
              <Loader2 className="w-5 h-5 text-vamp-red animate-spin" />
              <span className="text-sm text-muted-foreground">Fetching token data...</span>
            </div>
          )}

          {/* Error State */}
          {metadataError && !isFetchingMetadata && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30">
              <span className="text-sm text-destructive">{metadataError}</span>
            </div>
          )}

          {/* Token Preview */}
          {tokenMetadata && !isFetchingMetadata && (
            <div className="p-4 rounded-lg border border-vamp-red/20 bg-card/50">
              <div className="flex gap-4">
                {/* Token Image */}
                <div className="w-20 h-20 rounded-lg overflow-hidden border border-vamp-red/30 flex-shrink-0">
                  <img
                    src={tokenMetadata.image_url}
                    alt={tokenMetadata.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="80"%3E%3Crect fill="%23333" width="80" height="80"/%3E%3C/svg%3E';
                    }}
                  />
                </div>
                
                {/* Token Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono font-bold text-base">{tokenMetadata.name}</span>
                    <span className="text-vamp-red font-mono text-sm">${tokenMetadata.ticker}</span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                    {tokenMetadata.description}
                  </p>
                  
                  {/* Social Links */}
                  <div className="flex items-center gap-3">
                    {tokenMetadata.twitter && (
                      <a
                        href={tokenMetadata.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-vamp-red transition-colors"
                      >
                        <Twitter className="w-4 h-4" />
                      </a>
                    )}
                    {tokenMetadata.telegram && (
                      <a
                        href={tokenMetadata.telegram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-vamp-red transition-colors"
                      >
                        <Send className="w-4 h-4" />
                      </a>
                    )}
                    {tokenMetadata.website && (
                      <a
                        href={tokenMetadata.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-vamp-red transition-colors"
                      >
                        <Globe className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Launch Controls - только показывать когда есть метаданные */}
        {tokenMetadata && !isFetchingMetadata && (
          <section className="p-4 rounded-lg border border-vamp-red/30 bg-card space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Wallet</Label>
                <Select value={selectedWallet} onValueChange={setSelectedWallet} disabled={isLoadingWallets}>
                  <SelectTrigger className="bg-input border-border">
                    <SelectValue placeholder={isLoadingWallets ? "Loading..." : "Select wallet"} />
                  </SelectTrigger>
                  <SelectContent>
                    {wallets.map((wallet) => (
                      <SelectItem key={wallet.id} value={wallet.id}>
                        {wallet.name} ({wallet.balance.toFixed(2)} SOL)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Launch Count</Label>
                <Select value={launchCount} onValueChange={setLaunchCount}>
                  <SelectTrigger className="bg-input border-border">
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

            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Dev Buy Amount (SOL)</Label>
              <div className="flex flex-wrap gap-2">
                {devBuyPresets.map((preset) => (
                  <Button
                    key={preset}
                    variant={devBuyAmount === preset ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handlePresetClick(preset)}
                    className={
                      devBuyAmount === preset
                        ? 'bg-vamp-red hover:bg-vamp-red-hover text-foreground'
                        : 'border-vamp-red/30 hover:border-vamp-red/60 hover:bg-vamp-red/10'
                    }
                  >
                    {preset}
                  </Button>
                ))}
              </div>
              <Input
                placeholder="Custom amount..."
                value={customAmount}
                onChange={(e) => handleCustomAmountChange(e.target.value)}
                type="number"
                step="0.01"
                className="bg-input border-border focus:border-vamp-red/50 font-mono text-sm mt-2"
              />
            </div>

            <Button
              onClick={handleLaunch}
              disabled={isLaunching || !selectedWallet}
              className="w-full bg-vamp-red hover:bg-vamp-red-hover text-foreground font-bold"
            >
              {isLaunching ? (
                <>Launching...</>
              ) : (
                <>
                  <Rocket className="w-4 h-4 mr-2" />
                  LAUNCH
                </>
              )}
            </Button>
          </section>
        )}

        {/* Launched Tokens */}
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
