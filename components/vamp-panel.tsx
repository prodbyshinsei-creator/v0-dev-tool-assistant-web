'use client';

import { useState, useEffect } from 'react';
import { Skull, Rocket, Trash2, Loader2, Twitter, Send, Globe, Edit2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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

export function VampPanel({ onBack }: VampPanelProps) {
  // Token metadata
  const [tokenCA, setTokenCA] = useState('');
  const [tokenMetadata, setTokenMetadata] = useState<TokenMetadata | null>(null);
  const [isFetchingMetadata, setIsFetchingMetadata] = useState(false);
  const [metadataError, setMetadataError] = useState<string | null>(null);
  
  // Editable token data
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedTicker, setEditedTicker] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [editedWebsite, setEditedWebsite] = useState('');
  const [editedTwitter, setEditedTwitter] = useState('');
  const [editedTelegram, setEditedTelegram] = useState('');
  
  // Launch settings
  const [selectedWallet, setSelectedWallet] = useState('');
  const [launchCount, setLaunchCount] = useState(1);
  const [devBuyAmount, setDevBuyAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['pump']);
  
  // State
  const [wallets, setWallets] = useState<WalletType[]>([]);
  const [isLoadingWallets, setIsLoadingWallets] = useState(false);
  const [launchedTokens, setLaunchedTokens] = useState<LaunchedToken[]>([]);
  const [isLaunching, setIsLaunching] = useState(false);

  useEffect(() => {
    loadWallets();
  }, []);

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

  // Auto-fetch metadata when CA changes
  useEffect(() => {
    const trimmedCA = tokenCA.trim();
    
    if (trimmedCA.length >= 32 && trimmedCA.length <= 44) {
      setIsFetchingMetadata(true);
      setMetadataError(null);
      setTokenMetadata(null);
      setIsEditing(false);
      
      fetch(`${API_URL}/vamp/metadata`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ca: trimmedCA }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data) {
            setTokenMetadata(data.data);
            setEditedName(data.data.name);
            setEditedTicker(data.data.ticker);
            setEditedDescription(data.data.description);
            setEditedWebsite(data.data.website || '');
            setEditedTwitter(data.data.twitter || '');
            setEditedTelegram(data.data.telegram || '');
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
      setTokenMetadata(null);
      setMetadataError(null);
      setIsEditing(false);
    }
  }, [tokenCA]);

  const handleEditToggle = () => {
    if (!isEditing && tokenMetadata) {
      setEditedName(tokenMetadata.name);
      setEditedTicker(tokenMetadata.ticker);
      setEditedDescription(tokenMetadata.description);
      setEditedWebsite(tokenMetadata.website || '');
      setEditedTwitter(tokenMetadata.twitter || '');
      setEditedTelegram(tokenMetadata.telegram || '');
    }
    setIsEditing(!isEditing);
  };

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
          // Edited metadata
          name: editedName,
          ticker: editedTicker,
          description: editedDescription,
          website: editedWebsite,
          twitter: editedTwitter,
          telegram: editedTelegram,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.launched_tokens) {
          const newTokens = data.launched_tokens.map((ca: string) => ({
            id: Date.now().toString() + Math.random(),
            ca: ca,
            name: editedName || tokenMetadata?.name || `TOKEN${Math.floor(Math.random() * 1000)}`,
            marketCap: Math.floor(Math.random() * 100000) + 5000,
            launchedAt: new Date(),
          }));
          setLaunchedTokens([...newTokens, ...launchedTokens]);
          
          // Reset form
          setTokenCA('');
          setTokenMetadata(null);
          setIsEditing(false);
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
          name: editedName || tokenMetadata?.name || `TOKEN${Math.floor(Math.random() * 1000)}`,
          marketCap: Math.floor(Math.random() * 100000) + 5000,
          launchedAt: new Date(),
        };
        setLaunchedTokens([newToken, ...launchedTokens]);
        
        // Reset
        setTokenCA('');
        setTokenMetadata(null);
        setIsEditing(false);
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
        {/* Token CA Input */}
        <section className="p-4 rounded-lg border border-vamp-red/30 bg-card space-y-4">
          <div className="flex items-center gap-2 text-vamp-red">
            <Skull className="w-5 h-5" />
            <h2 className="font-mono font-bold">Vamp Coin</h2>
          </div>

          <div className="space-y-2">
            <Label htmlFor="token-ca" className="text-sm text-muted-foreground">
              Contract Address
            </Label>
            <Input
              id="token-ca"
              placeholder="4npUgkbThRtWjY5QVKzpHD8DJGKeLXxmrVgJx5yAQtjA"
              value={tokenCA}
              onChange={(e) => setTokenCA(e.target.value)}
              className="bg-input border-border focus:border-vamp-red/50 font-mono text-sm"
            />
          </div>

          {/* Loading */}
          {isFetchingMetadata && (
            <div className="flex items-center justify-center gap-2 py-4">
              <Loader2 className="w-5 h-5 text-vamp-red animate-spin" />
              <span className="text-sm text-muted-foreground">Fetching data...</span>
            </div>
          )}

          {/* Error */}
          {metadataError && !isFetchingMetadata && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30">
              <span className="text-sm text-destructive">{metadataError}</span>
            </div>
          )}

          {/* Token Preview - Compact */}
          {tokenMetadata && !isFetchingMetadata && !isEditing && (
            <div className="p-4 rounded-lg border border-vamp-red/20 bg-card/50">
              <div className="flex gap-4 items-start">
                <div className="w-16 h-16 rounded-lg overflow-hidden border border-vamp-red/30 flex-shrink-0">
                  <img
                    src={tokenMetadata.image_url}
                    alt={tokenMetadata.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="64" height="64"%3E%3Crect fill="%23333" width="64" height="64"/%3E%3C/svg%3E';
                    }}
                  />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono font-bold text-base">{tokenMetadata.name}</span>
                    <span className="text-vamp-red font-mono text-sm">${tokenMetadata.ticker}</span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {tokenMetadata.description}
                  </p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEditToggle}
                  className="border-vamp-red/30 hover:border-vamp-red/60 hover:bg-vamp-red/10 text-vamp-red flex-shrink-0"
                >
                  <Edit2 className="w-3 h-3 mr-1" />
                  Edit
                </Button>
              </div>
            </div>
          )}

          {/* Full Edit Form */}
          {tokenMetadata && !isFetchingMetadata && isEditing && (
            <div className="space-y-4 p-4 rounded-lg border border-vamp-red/20 bg-card/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-vamp-red">Edit Token Details</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleEditToggle}
                  className="h-7 text-xs"
                >
                  Cancel
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Name</Label>
                  <Input
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    placeholder="Token Name"
                    className="h-9 text-sm bg-input border-border"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Ticker</Label>
                  <Input
                    value={editedTicker}
                    onChange={(e) => setEditedTicker(e.target.value)}
                    placeholder="TICK"
                    className="h-9 text-sm bg-input border-border"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Description</Label>
                <Textarea
                  value={editedDescription}
                  onChange={(e) => setEditedDescription(e.target.value)}
                  placeholder="Token description..."
                  className="text-sm bg-input border-border resize-none"
                  rows={2}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Website</Label>
                <Input
                  value={editedWebsite}
                  onChange={(e) => setEditedWebsite(e.target.value)}
                  placeholder="https://example.com"
                  className="h-9 text-sm font-mono bg-input border-border"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Twitter</Label>
                  <Input
                    value={editedTwitter}
                    onChange={(e) => setEditedTwitter(e.target.value)}
                    placeholder="https://x.com/..."
                    className="h-9 text-sm font-mono bg-input border-border"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Telegram</Label>
                  <Input
                    value={editedTelegram}
                    onChange={(e) => setEditedTelegram(e.target.value)}
                    placeholder="https://t.me/..."
                    className="h-9 text-sm font-mono bg-input border-border"
                  />
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Launch Settings - Only show when metadata loaded */}
        {tokenMetadata && !isFetchingMetadata && (
          <section className="p-4 rounded-lg border border-vamp-red/30 bg-card space-y-4">
            <div className="flex items-center gap-2 text-vamp-red">
              <Rocket className="w-5 h-5" />
              <h3 className="font-mono font-bold">Launch Settings</h3>
            </div>

            {/* Platforms */}
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Platforms</Label>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'pump', name: 'Pump' },
                  { id: 'bonk', name: 'Bonk' },
                  { id: 'studio', name: 'Studio' },
                  { id: 'bags', name: 'Bags' },
                ].map((platform) => (
                  <Button
                    key={platform.id}
                    variant={selectedPlatforms.includes(platform.id) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => togglePlatform(platform.id)}
                    className={cn(
                      'h-8',
                      selectedPlatforms.includes(platform.id)
                        ? 'bg-vamp-red hover:bg-vamp-red-hover text-foreground'
                        : 'border-vamp-red/30 hover:border-vamp-red/60 hover:bg-vamp-red/10'
                    )}
                  >
                    {selectedPlatforms.includes(platform.id) && (
                      <CheckCircle className="w-3 h-3 mr-1" />
                    )}
                    {platform.name}
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Wallet */}
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Wallet</Label>
                <Select value={selectedWallet} onValueChange={setSelectedWallet} disabled={isLoadingWallets}>
                  <SelectTrigger className="bg-input border-border h-9">
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

              {/* Multi-Launch */}
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Launch Count</Label>
                <div className="flex gap-1">
                  {multiLaunchOptions.map((count) => (
                    <Button
                      key={count}
                      variant={launchCount === count ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setLaunchCount(count)}
                      className={cn(
                        'flex-1 h-9 text-xs',
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

            {/* Dev Buy Amount */}
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Quick Deploy (SOL)</Label>
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

            {/* Custom Amount */}
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Custom Amount (SOL)</Label>
              <Input
                placeholder="0.1"
                value={customAmount}
                onChange={(e) => {
                  setCustomAmount(e.target.value);
                  setDevBuyAmount(null);
                }}
                type="number"
                step="0.01"
                className="bg-input border-border font-mono text-sm h-9"
              />
            </div>

            {/* Deploy Button */}
            <Button
              onClick={handleLaunch}
              disabled={isLaunching || !selectedWallet || selectedPlatforms.length === 0}
              className="w-full bg-vamp-red hover:bg-vamp-red-hover text-foreground font-bold h-10"
            >
              {isLaunching ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Launching {launchCount}x...
                </>
              ) : (
                <>
                  <Rocket className="w-4 h-4 mr-2" />
                  DEPLOY {launchCount > 1 ? `${launchCount}x` : ''}
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
