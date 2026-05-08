'use client';

import { useState } from 'react';
import { Wallet, Plus, Trash2, Copy, Check, Eye, EyeOff, Download, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Header } from '@/components/header';
import { useWalletStore, shortenAddress, shortenPrivateKey, BurnerWallet } from '@/lib/wallet-store';
import { cn } from '@/lib/utils';

interface WalletsPanelProps {
  onBack: () => void;
}

type DialogMode = 'generate' | 'import' | 'edit' | null;

export function WalletsPanel({ onBack }: WalletsPanelProps) {
  const { wallets, isLoaded, generateWallet, importWallet, updateLabel, deleteWallet } = useWalletStore();
  
  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [walletLabel, setWalletLabel] = useState('');
  const [privateKeyInput, setPrivateKeyInput] = useState('');
  const [editingWallet, setEditingWallet] = useState<BurnerWallet | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const handleCopy = async (text: string, fieldId: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const toggleKeyVisibility = (walletId: string) => {
    setVisibleKeys((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(walletId)) {
        newSet.delete(walletId);
      } else {
        newSet.add(walletId);
      }
      return newSet;
    });
  };

  const openGenerateDialog = () => {
    setDialogMode('generate');
    setWalletLabel('');
    setError(null);
  };

  const openImportDialog = () => {
    setDialogMode('import');
    setWalletLabel('');
    setPrivateKeyInput('');
    setError(null);
  };

  const openEditDialog = (wallet: BurnerWallet) => {
    setDialogMode('edit');
    setEditingWallet(wallet);
    setWalletLabel(wallet.label);
    setError(null);
  };

  const closeDialog = () => {
    setDialogMode(null);
    setWalletLabel('');
    setPrivateKeyInput('');
    setEditingWallet(null);
    setError(null);
  };

  const handleGenerate = () => {
    if (!walletLabel.trim()) {
      setError('Label is required');
      return;
    }
    generateWallet(walletLabel.trim());
    closeDialog();
  };

  const handleImport = () => {
    if (!walletLabel.trim()) {
      setError('Label is required');
      return;
    }
    if (!privateKeyInput.trim()) {
      setError('Private key is required');
      return;
    }
    
    const result = importWallet(walletLabel.trim(), privateKeyInput.trim());
    if (!result) {
      setError('Invalid private key format');
      return;
    }
    closeDialog();
  };

  const handleUpdateLabel = () => {
    if (!walletLabel.trim() || !editingWallet) {
      setError('Label is required');
      return;
    }
    updateLabel(editingWallet.id, walletLabel.trim());
    closeDialog();
  };

  const handleDelete = (id: string) => {
    deleteWallet(id);
  };

  const totalBalance = wallets.reduce((sum, w) => sum + w.balance, 0);

  const WalletCard = ({ wallet }: { wallet: BurnerWallet }) => {
    const isKeyVisible = visibleKeys.has(wallet.id);
    
    return (
      <div className="p-4 rounded-lg border border-wallet-green/20 bg-card hover:border-wallet-green/40 transition-colors">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="p-2 rounded-lg bg-wallet-green/10 flex-shrink-0">
              <Wallet className="w-4 h-4 text-wallet-green" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm truncate">{wallet.label}</span>
                <button
                  onClick={() => openEditDialog(wallet)}
                  className="text-muted-foreground hover:text-wallet-green transition-colors"
                >
                  <Pencil className="w-3 h-3" />
                </button>
              </div>
              
              {/* Address */}
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-xs text-muted-foreground font-mono">
                  {shortenAddress(wallet.address)}
                </span>
                <button
                  onClick={() => handleCopy(wallet.address, `addr_${wallet.id}`)}
                  className="text-muted-foreground hover:text-wallet-green transition-colors"
                >
                  {copiedField === `addr_${wallet.id}` ? (
                    <Check className="w-3 h-3 text-wallet-green" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              </div>
              
              {/* Private Key */}
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-xs text-muted-foreground/60 font-mono">
                  {isKeyVisible ? shortenPrivateKey(wallet.privateKey) : '••••••••...••••••••'}
                </span>
                <button
                  onClick={() => toggleKeyVisibility(wallet.id)}
                  className="text-muted-foreground hover:text-wallet-green transition-colors"
                >
                  {isKeyVisible ? (
                    <EyeOff className="w-3 h-3" />
                  ) : (
                    <Eye className="w-3 h-3" />
                  )}
                </button>
                <button
                  onClick={() => handleCopy(wallet.privateKey, `key_${wallet.id}`)}
                  className="text-muted-foreground hover:text-wallet-green transition-colors"
                >
                  {copiedField === `key_${wallet.id}` ? (
                    <Check className="w-3 h-3 text-wallet-green" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-2">
            <span className="text-sm font-mono font-bold text-wallet-green">
              {wallet.balance.toFixed(3)} SOL
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDelete(wallet.id)}
              className="h-7 w-7 text-muted-foreground hover:text-vamp-red hover:bg-vamp-red/10"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="sr-only">Delete wallet</span>
            </Button>
          </div>
        </div>
      </div>
    );
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header title="WALLETS" showBack onBack={onBack} variant="wallet" />
        <main className="flex-1 flex items-center justify-center">
          <span className="text-muted-foreground font-mono">Loading...</span>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header title="WALLETS" showBack onBack={onBack} variant="wallet" />

      <main className="flex-1 container max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={openGenerateDialog}
            className="border-wallet-green/30 hover:border-wallet-green/60 hover:bg-wallet-green/10 text-wallet-green"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Generate
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={openImportDialog}
            className="border-wallet-green/30 hover:border-wallet-green/60 hover:bg-wallet-green/10 text-wallet-green"
          >
            <Download className="w-4 h-4 mr-1.5" />
            Import
          </Button>
        </div>

        {/* Wallet List */}
        {wallets.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground border border-dashed border-border rounded-lg">
            <Wallet className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="font-mono text-sm">No wallets yet</p>
            <p className="text-xs mt-1">Generate or import a wallet to get started</p>
          </div>
        ) : (
          <div className="space-y-2">
            {wallets.map((wallet) => (
              <WalletCard key={wallet.id} wallet={wallet} />
            ))}
          </div>
        )}

        {/* Total Balance */}
        {wallets.length > 0 && (
          <div className="p-4 rounded-lg border border-wallet-green/30 bg-card">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {wallets.length} wallet{wallets.length !== 1 ? 's' : ''} • Total Balance
              </span>
              <span className="text-xl font-mono font-bold text-wallet-green">
                {totalBalance.toFixed(3)} SOL
              </span>
            </div>
          </div>
        )}

        {/* Dialogs */}
        <Dialog open={dialogMode !== null} onOpenChange={(open) => !open && closeDialog()}>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-wallet-green">
                {dialogMode === 'generate' && 'Generate New Wallet'}
                {dialogMode === 'import' && 'Import Wallet'}
                {dialogMode === 'edit' && 'Edit Wallet Label'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 pt-4">
              {/* Label Input (all modes) */}
              <div className="space-y-2">
                <Label htmlFor="wallet-label" className="text-sm text-muted-foreground">
                  Wallet Label
                </Label>
                <Input
                  id="wallet-label"
                  placeholder="e.g., Main Dev, Sniper 1..."
                  value={walletLabel}
                  onChange={(e) => setWalletLabel(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (dialogMode === 'generate') handleGenerate();
                      else if (dialogMode === 'import') handleImport();
                      else if (dialogMode === 'edit') handleUpdateLabel();
                    }
                  }}
                  className="bg-input border-border focus:border-wallet-green/50"
                />
              </div>

              {/* Private Key Input (import mode only) */}
              {dialogMode === 'import' && (
                <div className="space-y-2">
                  <Label htmlFor="private-key" className="text-sm text-muted-foreground">
                    Private Key
                  </Label>
                  <Input
                    id="private-key"
                    placeholder="Paste your private key..."
                    value={privateKeyInput}
                    onChange={(e) => setPrivateKeyInput(e.target.value)}
                    type="password"
                    className="bg-input border-border focus:border-wallet-green/50 font-mono text-sm"
                  />
                </div>
              )}

              {/* Error */}
              {error && (
                <p className="text-xs text-vamp-red">{error}</p>
              )}

              {/* Submit Button */}
              <Button
                onClick={() => {
                  if (dialogMode === 'generate') handleGenerate();
                  else if (dialogMode === 'import') handleImport();
                  else if (dialogMode === 'edit') handleUpdateLabel();
                }}
                className="w-full font-bold text-foreground bg-wallet-green hover:bg-wallet-green-hover"
              >
                {dialogMode === 'generate' && (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Generate Wallet
                  </>
                )}
                {dialogMode === 'import' && (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Import Wallet
                  </>
                )}
                {dialogMode === 'edit' && (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Save Label
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
