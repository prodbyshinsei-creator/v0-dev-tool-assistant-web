'use client';

import { useState } from 'react';
import { Wallet, Plus, Trash2, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Header } from '@/components/header';
import {
  mockDevWallets,
  mockVolumeWallets,
  Wallet as WalletType,
  shortenAddress,
  generateSolanaAddress,
} from '@/lib/mock-data';
import { cn } from '@/lib/utils';

interface WalletsPanelProps {
  onBack: () => void;
}

export function WalletsPanel({ onBack }: WalletsPanelProps) {
  const [devWallets, setDevWallets] = useState<WalletType[]>(mockDevWallets);
  const [volumeWallets, setVolumeWallets] = useState<WalletType[]>(mockVolumeWallets);
  const [newWalletName, setNewWalletName] = useState('');
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'dev' | 'volume'>('dev');

  const handleCopyAddress = async (address: string) => {
    await navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const handleAddWallet = () => {
    if (!newWalletName.trim()) return;

    const newWallet: WalletType = {
      id: Date.now().toString(),
      name: newWalletName,
      address: generateSolanaAddress(),
      balance: Math.random() * 5,
      type: dialogType,
    };

    if (dialogType === 'dev') {
      setDevWallets([...devWallets, newWallet]);
    } else {
      setVolumeWallets([...volumeWallets, newWallet]);
    }

    setNewWalletName('');
    setIsDialogOpen(false);
  };

  const handleDeleteWallet = (id: string, type: 'dev' | 'volume') => {
    if (type === 'dev') {
      setDevWallets(devWallets.filter((w) => w.id !== id));
    } else {
      setVolumeWallets(volumeWallets.filter((w) => w.id !== id));
    }
  };

  const openAddDialog = (type: 'dev' | 'volume') => {
    setDialogType(type);
    setNewWalletName('');
    setIsDialogOpen(true);
  };

  const WalletCard = ({ wallet }: { wallet: WalletType }) => (
    <div
      className={cn(
        'flex items-center justify-between p-3 rounded-lg border bg-card transition-colors',
        wallet.type === 'dev'
          ? 'border-vamp-red/20 hover:border-vamp-red/40'
          : 'border-wallet-green/20 hover:border-wallet-green/40'
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={cn(
            'p-2 rounded-lg',
            wallet.type === 'dev' ? 'bg-vamp-red/10' : 'bg-wallet-green/10'
          )}
        >
          <Wallet
            className={cn(
              'w-4 h-4',
              wallet.type === 'dev' ? 'text-vamp-red' : 'text-wallet-green'
            )}
          />
        </div>
        <div className="min-w-0">
          <div className="font-medium text-sm truncate">{wallet.name}</div>
          <button
            onClick={() => handleCopyAddress(wallet.address)}
            className="flex items-center gap-1 text-xs text-muted-foreground font-mono hover:text-foreground transition-colors"
          >
            {shortenAddress(wallet.address)}
            {copiedAddress === wallet.address ? (
              <Check className="w-3 h-3 text-wallet-green" />
            ) : (
              <Copy className="w-3 h-3" />
            )}
          </button>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div
          className={cn(
            'text-sm font-mono font-bold',
            wallet.type === 'dev' ? 'text-vamp-red' : 'text-wallet-green'
          )}
        >
          {wallet.balance.toFixed(2)} SOL
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleDeleteWallet(wallet.id, wallet.type)}
          className="h-8 w-8 text-muted-foreground hover:text-vamp-red hover:bg-vamp-red/10"
        >
          <Trash2 className="w-4 h-4" />
          <span className="sr-only">Delete wallet</span>
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Header title="WALLETS" showBack onBack={onBack} variant="wallet" />

      <main className="flex-1 container max-w-2xl mx-auto px-4 py-6">
        <Tabs defaultValue="dev" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-secondary">
            <TabsTrigger
              value="dev"
              className="data-[state=active]:bg-vamp-red/20 data-[state=active]:text-vamp-red"
            >
              Dev Wallets
            </TabsTrigger>
            <TabsTrigger
              value="volume"
              className="data-[state=active]:bg-wallet-green/20 data-[state=active]:text-wallet-green"
            >
              Volume Wallets
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dev" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {devWallets.length} wallet{devWallets.length !== 1 ? 's' : ''}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => openAddDialog('dev')}
                className="border-vamp-red/30 hover:border-vamp-red/60 hover:bg-vamp-red/10 text-vamp-red"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Wallet
              </Button>
            </div>

            {devWallets.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground border border-dashed border-border rounded-lg">
                No dev wallets added yet
              </div>
            ) : (
              <div className="space-y-2">
                {devWallets.map((wallet) => (
                  <WalletCard key={wallet.id} wallet={wallet} />
                ))}
              </div>
            )}

            {/* Total Balance */}
            <div className="p-4 rounded-lg border border-vamp-red/30 bg-card">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Balance</span>
                <span className="text-xl font-mono font-bold text-vamp-red">
                  {devWallets.reduce((sum, w) => sum + w.balance, 0).toFixed(2)} SOL
                </span>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="volume" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {volumeWallets.length} wallet{volumeWallets.length !== 1 ? 's' : ''}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => openAddDialog('volume')}
                className="border-wallet-green/30 hover:border-wallet-green/60 hover:bg-wallet-green/10 text-wallet-green"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Wallet
              </Button>
            </div>

            {volumeWallets.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground border border-dashed border-border rounded-lg">
                No volume wallets added yet
              </div>
            ) : (
              <div className="space-y-2">
                {volumeWallets.map((wallet) => (
                  <WalletCard key={wallet.id} wallet={wallet} />
                ))}
              </div>
            )}

            {/* Total Balance */}
            <div className="p-4 rounded-lg border border-wallet-green/30 bg-card">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Balance</span>
                <span className="text-xl font-mono font-bold text-wallet-green">
                  {volumeWallets.reduce((sum, w) => sum + w.balance, 0).toFixed(2)} SOL
                </span>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Add Wallet Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className={dialogType === 'dev' ? 'text-vamp-red' : 'text-wallet-green'}>
                Add {dialogType === 'dev' ? 'Dev' : 'Volume'} Wallet
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="wallet-name" className="text-sm text-muted-foreground">
                  Wallet Name
                </Label>
                <Input
                  id="wallet-name"
                  placeholder="Enter wallet name..."
                  value={newWalletName}
                  onChange={(e) => setNewWalletName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddWallet()}
                  className={cn(
                    'bg-input border-border',
                    dialogType === 'dev'
                      ? 'focus:border-vamp-red/50'
                      : 'focus:border-wallet-green/50'
                  )}
                />
              </div>
              <Button
                onClick={handleAddWallet}
                disabled={!newWalletName.trim()}
                className={cn(
                  'w-full font-bold text-foreground',
                  dialogType === 'dev'
                    ? 'bg-vamp-red hover:bg-vamp-red-hover'
                    : 'bg-wallet-green hover:bg-wallet-green-hover'
                )}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Wallet
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
