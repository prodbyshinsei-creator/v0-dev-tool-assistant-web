'use client';

import { useState } from 'react';
import { X, Plus, Upload, Trash2, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface Wallet {
  id: string;
  name: string;
  address: string;
  balance: number;
  type: 'dev' | 'volume';
}

interface WalletsModalProps {
  onClose: () => void;
}

export function WalletsModal({ onClose }: WalletsModalProps) {
  const [tab, setTab] = useState<'dev' | 'volume'>('dev');
  const [showImport, setShowImport] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [importKey, setImportKey] = useState('');
  const [walletName, setWalletName] = useState('');
  const [newWalletName, setNewWalletName] = useState('');
  const [showPrivateKey, setShowPrivateKey] = useState<string | null>(null);
  const [generatedKey, setGeneratedKey] = useState('');

  const [wallets, setWallets] = useState<Wallet[]>([
    {
      id: '1',
      name: 'Dev Wallet 1',
      address: '6w5kU8WqQwWHzniJQzJuLXE8R2PuU4ENPC1S5zw7pump',
      balance: 5.23,
      type: 'dev',
    },
  ]);

  const filteredWallets = wallets.filter(w => w.type === tab);

  const handleImport = () => {
    if (!importKey || !walletName) return;
    
    const newWallet: Wallet = {
      id: Math.random().toString(),
      name: walletName,
      address: importKey.slice(0, 44),
      balance: 0,
      type: tab,
    };
    
    setWallets([...wallets, newWallet]);
    setImportKey('');
    setWalletName('');
    setShowImport(false);
  };

  const handleCreate = () => {
    if (!newWalletName) return;
    
    const mockKey = 'PrIVaTe_KeY_bAsE58_' + Math.random().toString(36).substring(7).toUpperCase();
    setGeneratedKey(mockKey);
    
    const newWallet: Wallet = {
      id: Math.random().toString(),
      name: newWalletName,
      address: 'soL' + Math.random().toString(36).substring(2, 40).toUpperCase(),
      balance: 0,
      type: tab,
    };
    
    setWallets([...wallets, newWallet]);
    setNewWalletName('');
  };

  const handleDelete = (id: string) => {
    setWallets(wallets.filter(w => w.id !== id));
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
        onClick={onClose}
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-black/80 backdrop-blur-2xl border-2 border-green-400/30 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto pointer-events-auto shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <img src="/vamp-blood.png" alt="Wallets" className="w-10 h-10" />
                <h2 className="text-3xl font-mono font-bold text-green-400">WALLETS</h2>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="hover:bg-green-400/10"
              >
                <X className="w-6 h-6" />
              </Button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setTab('dev')}
                className={cn(
                  'flex-1 py-3 px-6 rounded-xl font-bold transition-all text-lg',
                  tab === 'dev'
                    ? 'bg-green-400 text-black'
                    : 'bg-white/10 border border-white/20 text-white hover:border-white/40'
                )}
              >
                Dev Wallets
              </button>
              <button
                onClick={() => setTab('volume')}
                className={cn(
                  'flex-1 py-3 px-6 rounded-xl font-bold transition-all text-lg',
                  tab === 'volume'
                    ? 'bg-blue-400 text-black'
                    : 'bg-white/10 border border-white/20 text-white hover:border-white/40'
                )}
              >
                Volume Wallets
              </button>
            </div>

            {/* Wallet List */}
            <div className="space-y-3 mb-6">
              {filteredWallets.length === 0 ? (
                <div className="p-8 text-center text-white/50 border border-dashed border-white/20 rounded-2xl">
                  No {tab} wallets yet
                </div>
              ) : (
                filteredWallets.map((wallet) => (
                  <div
                    key={wallet.id}
                    className="flex items-center justify-between p-4 rounded-xl border border-white/10 bg-white/5 hover:border-white/30 transition-all"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-lg font-mono font-bold text-white">{wallet.name}</div>
                      <div className="text-sm text-white/60 font-mono">{wallet.address}</div>
                      <div className="text-sm text-white/40">Balance: {wallet.balance} SOL</div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowPrivateKey(showPrivateKey === wallet.id ? null : wallet.id)}
                        className="border-green-400/30 hover:border-green-400/60 h-9"
                        title="Show private key"
                      >
                        <Key className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(wallet.id)}
                        className="border-destructive/30 hover:border-destructive/60 hover:bg-destructive/10 text-destructive h-9"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    {showPrivateKey === wallet.id && (
                      <div className="absolute mt-12 bg-black/90 border border-white/20 rounded-lg p-4 text-white/80 text-sm max-w-xs">
                        <div className="font-mono break-all">Private Key: mock_key_****</div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              {!showImport && !showCreate && (
                <>
                  <Button
                    onClick={() => setShowImport(true)}
                    className="flex-1 bg-green-400 hover:bg-green-400/80 text-black font-bold py-3 h-12 text-base"
                  >
                    <Upload className="w-5 h-5 mr-2" />
                    IMPORT
                  </Button>
                  <Button
                    onClick={() => setShowCreate(true)}
                    className="flex-1 bg-blue-400 hover:bg-blue-400/80 text-black font-bold py-3 h-12 text-base"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    CREATE
                  </Button>
                </>
              )}

              {showImport && (
                <div className="w-full space-y-4">
                  <div className="space-y-2">
                    <Label className="text-white/80">Private Key (Base58)</Label>
                    <Input
                      value={importKey}
                      onChange={(e) => setImportKey(e.target.value)}
                      placeholder="Paste your base58 private key here"
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/40 h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/80">Wallet Name</Label>
                    <Input
                      value={walletName}
                      onChange={(e) => setWalletName(e.target.value)}
                      placeholder="Give it a name"
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/40 h-10"
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button
                      onClick={handleImport}
                      disabled={!importKey || !walletName}
                      className="flex-1 bg-green-400 hover:bg-green-400/80 text-black font-bold h-10"
                    >
                      Import
                    </Button>
                    <Button
                      onClick={() => setShowImport(false)}
                      variant="outline"
                      className="flex-1 border-white/20 h-10"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {showCreate && (
                <div className="w-full space-y-4">
                  {!generatedKey ? (
                    <>
                      <div className="space-y-2">
                        <Label className="text-white/80">Wallet Name</Label>
                        <Input
                          value={newWalletName}
                          onChange={(e) => setNewWalletName(e.target.value)}
                          placeholder="Name for new wallet"
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/40 h-10"
                        />
                      </div>
                      <div className="flex gap-3">
                        <Button
                          onClick={handleCreate}
                          disabled={!newWalletName}
                          className="flex-1 bg-blue-400 hover:bg-blue-400/80 text-black font-bold h-10"
                        >
                          Generate
                        </Button>
                        <Button
                          onClick={() => setShowCreate(false)}
                          variant="outline"
                          className="flex-1 border-white/20 h-10"
                        >
                          Cancel
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="p-4 rounded-lg bg-blue-400/10 border border-blue-400/30">
                        <p className="text-sm text-white/80 mb-2">Your Private Key (save it safely!):</p>
                        <p className="font-mono text-sm text-white break-all mb-4">{generatedKey}</p>
                        <Button
                          onClick={() => {
                            navigator.clipboard.writeText(generatedKey);
                          }}
                          className="w-full bg-blue-400 hover:bg-blue-400/80 text-black font-bold h-10"
                        >
                          Copy to Clipboard
                        </Button>
                      </div>
                      <Button
                        onClick={() => {
                          setGeneratedKey('');
                          setShowCreate(false);
                        }}
                        className="w-full bg-green-400 hover:bg-green-400/80 text-black font-bold h-10"
                      >
                        Done
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
