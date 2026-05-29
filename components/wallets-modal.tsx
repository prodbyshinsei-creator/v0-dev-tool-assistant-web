'use client';

import { useState } from 'react';
import { X, Plus, Upload, Trash2, Key, Copy, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useWallets, StoredWallet } from '@/hooks/storage';

interface WalletsModalProps { onClose: () => void; }

export function WalletsModal({ onClose }: WalletsModalProps) {
  const { wallets, addWallet, deleteWallet, updateWallet } = useWallets();
  const [tab, setTab]           = useState<'dev' | 'volume'>('dev');
  const [mode, setMode]         = useState<null | 'import' | 'create'>('create');
  const [importKey, setImportKey]   = useState('');
  const [walletName, setWalletName] = useState('');
  const [isWorking, setIsWorking]   = useState(false);
  const [showKeyFor, setShowKeyFor] = useState<string | null>(null);
  const [password, setPassword]     = useState('');
  const [keyVisible, setKeyVisible] = useState(false);
  const [newKey, setNewKey]         = useState('');      // shown after create
  const [feedback, setFeedback]     = useState<{type:'ok'|'err'; msg:string}|null>(null);

  const filteredWallets = wallets.filter(w => w.type === tab);

  const showFeedback = (type: 'ok'|'err', msg: string) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 3000);
  };

  /* ── Real keypair generation ──────────────────────────────────────── */
  const handleCreate = async () => {
    if (!walletName.trim()) return;
    setIsWorking(true);
    try {
      const res = await fetch('/api/solana/generate', { method: 'POST' });
      const { address, privateKey, error } = await res.json();
      if (error || !address) throw new Error(error || 'Generate failed');

      const w: StoredWallet = {
        id: crypto.randomUUID(),
        name: walletName,
        address,
        balance: 0,
        type: tab,
        privateKeyEncrypted: privateKey,
      };
      addWallet(w);
      setNewKey(privateKey);
      setWalletName('');
    } catch (e: any) {
      showFeedback('err', e.message);
    } finally {
      setIsWorking(false);
    }
  };

  /* ── Real import (validate key → derive address) ──────────────────── */
  const handleImport = async () => {
    if (!importKey.trim() || !walletName.trim()) return;
    setIsWorking(true);
    try {
      const res  = await fetch('/api/solana/validate-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ privateKey: importKey.trim() }),
      });
      const { valid, address, error } = await res.json();
      if (!valid || !address) throw new Error(error || 'Invalid private key');

      const w: StoredWallet = {
        id: crypto.randomUUID(),
        name: walletName,
        address,
        balance: 0,
        type: tab,
        privateKeyEncrypted: importKey.trim(),
      };
      addWallet(w);
      setImportKey('');
      setWalletName('');
      setMode(null);
      showFeedback('ok', 'Wallet imported!');
    } catch (e: any) {
      showFeedback('err', e.message);
    } finally {
      setIsWorking(false);
    }
  };

  /* ── Refresh SOL balance ──────────────────────────────────────────── */
  const refreshBalance = async (wallet: StoredWallet) => {
    try {
      const res = await fetch(`/api/solana/balance?address=${wallet.address}`);
      const { balance } = await res.json();
      updateWallet(wallet.id, { balance });
    } catch {}
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-black/85 backdrop-blur-2xl border-2 border-green-400/30 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto pointer-events-auto shadow-2xl"
          onClick={e => e.stopPropagation()}
        >
          <div className="p-7">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <img src="/vamp-fangs-silver.png" alt="" className="w-9 h-9" />
                <h2 className="text-3xl font-mono font-bold text-green-400">WALLETS</h2>
              </div>
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 text-white/60 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Feedback */}
            {feedback && (
              <div className={cn(
                'mb-4 flex items-center gap-2 px-4 py-2 rounded-xl text-sm',
                feedback.type === 'ok' ? 'bg-green-400/15 text-green-400 border border-green-400/30' : 'bg-red-500/15 text-red-400 border border-red-500/30'
              )}>
                {feedback.type === 'ok' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                {feedback.msg}
              </div>
            )}

            {/* Tabs */}
            <div className="flex gap-2 mb-5">
              {(['dev','volume'] as const).map(t => (
                <button key={t} onClick={() => { setTab(t); setMode(null); setNewKey(''); }}
                  className={cn('flex-1 py-2.5 rounded-xl font-bold text-base transition-all',
                    tab === t
                      ? t === 'dev' ? 'bg-green-400 text-black' : 'bg-blue-400 text-black'
                      : 'bg-white/5 border border-white/15 text-white/70 hover:border-white/30'
                  )}
                >
                  {t === 'dev' ? 'Dev' : 'Volume'} Wallets ({wallets.filter(w => w.type === t).length})
                </button>
              ))}
            </div>

            {/* Wallet list */}
            <div className="space-y-2 mb-5">
              {filteredWallets.length === 0 ? (
                <div className="p-8 text-center text-white/40 border border-dashed border-white/15 rounded-2xl">
                  No {tab} wallets yet
                </div>
              ) : filteredWallets.map(wallet => (
                <div key={wallet.id}
                  className="flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-white/3 hover:border-white/20 transition-all"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-mono font-bold text-white text-sm">{wallet.name}</div>
                    <div className="text-xs text-white/40 font-mono truncate">{wallet.address}</div>
                    <div className="text-xs text-white/50">{wallet.balance.toFixed(4)} SOL</div>
                  </div>
                  <button onClick={() => refreshBalance(wallet)}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors" title="Refresh balance">
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => { setShowKeyFor(wallet.id); setKeyVisible(false); setPassword(''); }}
                    className="p-1.5 rounded-lg hover:bg-green-400/10 text-white/40 hover:text-green-400 transition-colors">
                    <Key className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => deleteWallet(wallet.id)}
                    className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/40 hover:text-red-400 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Action buttons */}
            {!mode && !newKey && (
              <div className="flex gap-3">
                <Button onClick={() => setMode('import')}
                  className="flex-1 bg-green-400 hover:bg-green-500 text-black font-bold h-11">
                  <Upload className="w-4 h-4 mr-2" />IMPORT
                </Button>
                <Button onClick={() => setMode('create')}
                  className="flex-1 bg-blue-400 hover:bg-blue-500 text-black font-bold h-11">
                  <Plus className="w-4 h-4 mr-2" />CREATE
                </Button>
              </div>
            )}

            {/* Import form */}
            {mode === 'import' && (
              <div className="space-y-3">
                <div>
                  <Label className="text-sm text-white/70 mb-1 block">Private Key (Base58)</Label>
                  <Input value={importKey} onChange={e => setImportKey(e.target.value)}
                    placeholder="Paste base58 private key" type="password"
                    className="bg-white/5 border-white/15 text-white h-10 font-mono text-sm" />
                </div>
                <div>
                  <Label className="text-sm text-white/70 mb-1 block">Wallet Name</Label>
                  <Input value={walletName} onChange={e => setWalletName(e.target.value)}
                    placeholder="e.g. Dev Wallet 1"
                    className="bg-white/5 border-white/15 text-white h-10" />
                </div>
                <div className="flex gap-3">
                  <Button onClick={handleImport} disabled={!importKey || !walletName || isWorking}
                    className="flex-1 bg-green-400 hover:bg-green-500 text-black font-bold h-10">
                    {isWorking ? 'Validating…' : 'Import'}
                  </Button>
                  <Button onClick={() => { setMode(null); setImportKey(''); setWalletName(''); }}
                    variant="outline" className="flex-1 border-white/20 h-10">Cancel</Button>
                </div>
              </div>
            )}

            {/* Create form */}
            {mode === 'create' && !newKey && (
              <div className="space-y-3">
                <div>
                  <Label className="text-sm text-white/70 mb-1 block">Wallet Name</Label>
                  <Input value={walletName} onChange={e => setWalletName(e.target.value)}
                    placeholder="e.g. Volume Bot 1"
                    className="bg-white/5 border-white/15 text-white h-10" />
                </div>
                <div className="flex gap-3">
                  <Button onClick={handleCreate} disabled={!walletName || isWorking}
                    className="flex-1 bg-blue-400 hover:bg-blue-500 text-black font-bold h-10">
                    {isWorking ? 'Generating…' : '⚡ Generate'}
                  </Button>
                  <Button onClick={() => { setMode(null); setWalletName(''); }}
                    variant="outline" className="flex-1 border-white/20 h-10">Cancel</Button>
                </div>
              </div>
            )}

            {/* Show new key after creation */}
            {newKey && (
              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
                  <p className="text-yellow-400 font-bold text-sm mb-1">⚠️ Save your private key now!</p>
                  <p className="text-white/60 text-xs mb-3">It will not be shown again outside this app.</p>
                  <p className="font-mono text-xs text-white break-all bg-black/40 rounded-lg p-3">{newKey}</p>
                  <Button onClick={() => navigator.clipboard.writeText(newKey)}
                    className="w-full mt-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold h-9">
                    <Copy className="w-4 h-4 mr-2" />Copy Private Key
                  </Button>
                </div>
                <Button onClick={() => { setNewKey(''); setMode(null); showFeedback('ok', 'Wallet created!'); }}
                  className="w-full bg-green-400 hover:bg-green-500 text-black font-bold h-10">Done</Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Private key modal */}
      {showKeyFor && (
        <>
          <div className="fixed inset-0 bg-black/80 z-[60]" onClick={() => setShowKeyFor(null)} />
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none">
            <div
              className="bg-black/90 border-2 border-white/20 rounded-2xl max-w-sm w-full pointer-events-auto p-6 shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-white mb-4">🔐 Private Key</h3>
              {!keyVisible ? (
                <div className="space-y-3">
                  <p className="text-white/60 text-sm">Enter any password to reveal (mock auth for now)</p>
                  <Input type="password" value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="Password" className="bg-white/5 border-white/20 text-white h-10" />
                  <div className="flex gap-3">
                    <Button onClick={() => password.length > 0 && setKeyVisible(true)}
                      className="flex-1 bg-green-400 text-black font-bold h-10">Reveal</Button>
                    <Button onClick={() => setShowKeyFor(null)} variant="outline" className="flex-1 border-white/20 h-10">Cancel</Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="font-mono text-xs text-white break-all bg-black/40 rounded-lg p-3">
                    {wallets.find(w => w.id === showKeyFor)?.privateKeyEncrypted}
                  </p>
                  <Button
                    onClick={() => navigator.clipboard.writeText(wallets.find(w => w.id === showKeyFor)?.privateKeyEncrypted || '')}
                    className="w-full bg-green-400 text-black font-bold h-9">
                    <Copy className="w-4 h-4 mr-2" />Copy
                  </Button>
                  <Button onClick={() => setShowKeyFor(null)} variant="outline" className="w-full border-white/20 h-9">Close</Button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
