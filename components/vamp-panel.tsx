'use client';

import { useState, useEffect } from 'react';
import { Skull, Rocket, Trash2, Loader2, Twitter, Send, Globe, AlertCircle } from 'lucide-react';
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
import { apiClient, TokenMetadata } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';

interface VampPanelProps {
  onBack: () => void;
}

interface LaunchedToken {
  id: string;
  ca: string;
  name: string;
  marketCap: number;
  launchedAt: Date;
}

const devBuyPresets = ['0.1', '0.5', '1', '2', '5'];

export function VampPanel({ onBack }: VampPanelProps) {
  const { toast } = useToast();
  const [tokenCA, setTokenCA] = useState('');
  const [tokenMetadata, setTokenMetadata] = useState<TokenMetadata | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  
  const [wallets, setWallets] = useState<any[]>([]);
  const [selectedWallet, setSelectedWallet] = useState('');
  const [launchCount, setLaunchCount] = useState('1');
  const [devBuyAmount, setDevBuyAmount] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [launchedTokens, setLaunchedTokens] = useState<LaunchedToken[]>([]);
  const [isLaunching, setIsLaunching] = useState(false);

  // Load wallets on mount
  useEffect(() => {
    loadWallets();
  }, []);

  const loadWallets = async () => {
    try {
      const walletList = await apiClient.listWallets(1, 'dev');
      setWallets(walletList);
    } catch (error) {
      console.error('Failed to load wallets:', error);
      toast({
        title: 'Error',
        description: 'Failed to load wallets',
        variant: 'destructive',
      });
    }
  };

  // Auto-fetch metadata when CA is pasted
  useEffect(() => {
    const trimmedCA = tokenCA.trim();
    
    if (trimmedCA.length >= 32 && trimmedCA.length <= 44) {
      setIsFetching(true);
      setFetchError(null);
      setTokenMetadata(null);
      
      apiClient
        .fetchTokenMetadata(trimmedCA)
        .then((metadata) => {
          setTokenMetadata(metadata);
          setIsFetching(false);
          toast({
            title: 'Success',
            description: `Loaded: ${metadata.name}`,
          });
        })
        .catch((error) => {
          setFetchError(error.message || 'Failed to fetch token data');
          setIsFetching(false);
          toast({
            title: 'Error',
            description: error.message || 'Failed to fetch token data',
            variant: 'destructive',
          });
        });
    } else {
      setTokenMetadata(null);
      setFetchError(null);
    }
  }, [tokenCA, toast]);

  const handlePresetClick = (amount: string) => {
    setDevBuyAmount(amount);
    setCustomAmount('');
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    setDevBuyAmount('');
  };

  const handleLaunch = async () => {
    if (!tokenCA || !selectedWallet || !tokenMetadata) return;
    
    const selectedWalletData = wallets.find(w => w.id.toString() === selectedWallet);
    if (!selectedWalletData) {
      toast({
        title: 'Error',
        description: 'Selected wallet not found',
        variant: 'destructive',
      });
      return;
    }

    const buyAmount = customAmount || devBuyAmount;
    if (!buyAmount || parseFloat(buyAmount) <= 0) {
      toast({
        title: 'Error',
        description: 'Please select a dev buy amount',
        variant: 'destructive',
      });
      return;
    }
    
    setIsLaunching(true);

    try {
      const launchedCAs = await apiClient.launchTokens({
        ca: tokenCA,
        dev_wallet_address: selectedWalletData.address,
        dev_wallet_privkey: selectedWalletData.privkey || 'DEMO_KEY', // В реальности нужно безопасно хранить
        dev_buy_sol: parseFloat(buyAmount),
        launch_count: parseInt(launchCount),
      });

      // Add to launched tokens list
      const newTokens = launchedCAs.map((ca) => ({
        id: Date.now().toString() + Math.random(),
        ca,
        name: tokenMetadata.ticker,
        marketCap: Math.floor(Math.random() * 100000) + 5000,
        launchedAt: new Date(),
      }));

      setLaunchedTokens([...newTokens, ...launchedTokens]);
      
      toast({
        title: 'Success! 🚀',
        description: `Launched ${launchedCAs.length} token(s)`,
      });

      // Reset form
      setTokenCA('');
      setTokenMetadata(null);
      setDevBuyAmount('');
      setCustomAmount('');
    } catch (error: any) {
      toast({
        title: 'Launch Failed',
        description: error.message || 'Failed to launch token',
        variant: 'destructive',
      });
    } finally {
      setIsLaunching(false);
    }
  };

  const handleSell = async (token: LaunchedToken) => {
    if (!selectedWallet) return;

    const selectedWalletData = wallets.find(w => w.id.toString() === selectedWallet);
    if (!selectedWalletData) return;

    try {
      await apiClient.sellToken({
        ca: token.ca,
        wallet_address: selectedWalletData.address,
        wallet_privkey: selectedWalletData.privkey || 'DEMO_KEY',
        slippage: 25,
      });

      setLaunchedTokens(launchedTokens.filter((t) => t.id !== token.id));
      
      toast({
        title: 'Success',
        description: `Sold ${token.name}`,
      });
    } catch (error: any) {
      toast({
        title: 'Sell Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleSellAll = async () => {
    for (const token of launchedTokens) {
      try {
        await handleSell(token);
      } catch (error) {
        console.error(`Failed to sell ${token.ca}:`, error);
      }
    }
  };

  const handleClear = () => {
    setTokenCA('');
    setTokenMetadata(null);
    setFetchError(null);
  };

  const shortenAddress = (addr: string) => {
    return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header title="VAMP" showBack onBack={onBack} variant="vamp" />
      
      <main className="flex-1 container max-w-xl mx-auto px-4 py-6 space-y-4">
        {/* CA Input */}
        <section className="p-4 rounded-lg border border-vamp-red/30 bg-card">
          <div className="flex items-center gap-2 text-vamp-red mb-3">
            <Skull className="w-4 h-4" />
            <span className="font-mono text-sm font-bold">Clone Token</span>
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
            <div className="mt-4 py-3 px-3 rounded bg-destructive/10 border border-destructive/20 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-destructive mt-0.5" />
              <span className="text-sm text-destructive font-mono">{fetchError}</span>
            </div>
          )}
        </section>

        {/* Token Preview */}
        {tokenMetadata && !isFetching && (
          <section className="p-4 rounded-lg border border-vamp-red/20 bg-card animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex gap-4">
              {/* Token Image */}
              <div className="w-16 h-16 rounded-lg overflow-hidden border border-vamp-red/30 bg-background flex-shrink-0">
                <img
                  src={tokenMetadata.image_url}
                  alt={tokenMetadata.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/placeholder.svg';
                  }}
                />
              </div>
              
              {/* Token Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-foreground">{tokenMetadata.name}</span>
                  <span className="text-vamp-red font-mono text-sm">{tokenMetadata.ticker}</span>
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

        {/* Launch Controls */}
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
                    {wallets.map((wallet) => (
                      <SelectItem key={wallet.id} value={wallet.id.toString()}>
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
              disabled={isLaunching || !selectedWallet || wallets.length === 0}
              className="w-full bg-vamp-red hover:bg-vamp-red-hover text-foreground font-mono font-bold h-10"
            >
              {isLaunching ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Cloning...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Rocket className="w-4 h-4" />
                  CLONE & LAUNCH
                </span>
              )}
            </Button>
          </section>
        )}

        {/* Launched Tokens */}
        {launchedTokens.length > 0 && (
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-sm text-vamp-red">Cloned Tokens</span>
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
                      ${(token.marketCap / 1000).toFixed(1)}K
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSell(token)}
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
