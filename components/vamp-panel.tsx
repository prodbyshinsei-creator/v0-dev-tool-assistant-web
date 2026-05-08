'use client';

import { useState } from 'react';
import { Skull, Rocket, Trash2 } from 'lucide-react';
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

const devBuyPresets = ['0.1', '0.5', '1', '2', '5'];

export function VampPanel({ onBack }: VampPanelProps) {
  const [tokenCA, setTokenCA] = useState('');
  const [selectedWallet, setSelectedWallet] = useState('');
  const [launchCount, setLaunchCount] = useState('1');
  const [devBuyAmount, setDevBuyAmount] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [launchedTokens, setLaunchedTokens] = useState<LaunchedToken[]>(mockLaunchedTokens);
  const [isLaunching, setIsLaunching] = useState(false);

  const handlePresetClick = (amount: string) => {
    setDevBuyAmount(amount);
    setCustomAmount('');
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    setDevBuyAmount('');
  };

  const handleLaunch = () => {
    if (!tokenCA || !selectedWallet) return;
    
    setIsLaunching(true);
    setTimeout(() => {
      const newToken: LaunchedToken = {
        id: Date.now().toString(),
        ca: tokenCA || generateSolanaAddress(),
        name: `TOKEN${Math.floor(Math.random() * 1000)}`,
        marketCap: Math.floor(Math.random() * 100000) + 5000,
        launchedAt: new Date(),
      };
      setLaunchedTokens([newToken, ...launchedTokens]);
      setTokenCA('');
      setIsLaunching(false);
    }, 1500);
  };

  const handleSell = (id: string) => {
    setLaunchedTokens(launchedTokens.filter((t) => t.id !== id));
  };

  const handleSellAll = () => {
    setLaunchedTokens([]);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header title="VAMP" showBack onBack={onBack} variant="vamp" />
      
      <main className="flex-1 container max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Launch Form */}
        <section className="p-4 rounded-lg border border-vamp-red/30 bg-card space-y-4">
          <div className="flex items-center gap-2 text-vamp-red">
            <Skull className="w-5 h-5" />
            <h2 className="font-mono font-bold">Launch Token</h2>
          </div>

          <div className="space-y-4">
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Wallet</Label>
                <Select value={selectedWallet} onValueChange={setSelectedWallet}>
                  <SelectTrigger className="bg-input border-border">
                    <SelectValue placeholder="Select wallet" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockDevWallets.map((wallet) => (
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
              disabled={isLaunching || !tokenCA || !selectedWallet}
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
          </div>
        </section>

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
