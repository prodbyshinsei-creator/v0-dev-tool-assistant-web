'use client';

import { useState, useEffect } from 'react';
import { X, Upload, Trash2, Key, Copy, RefreshCw, CheckCircle, AlertCircle, Loader2, Zap, Link } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useWallets, StoredWallet } from '@/hooks/storage';

interface WalletsModalProps { onClose: () => void; }

const ADAPTER_WALLETS = [
  { name: 'Phantom',  icon: 'https://raw.githubusercontent.com/solana-labs/wallet-adapter/master/packages/wallets/phantom/src/icon.png' },
  { name: 'Solflare', icon: 'https://raw.githubusercontent.com/solana-labs/wallet-adapter/master/packages/wallets/solflare/src/icon.svg' },
];

export function WalletsModal({ onClose }: WalletsModalProps) {
  const { wallets: storedWallets, addWallet, deleteWallet, updateWallet } = useWallets();
  const { select, wallets: adapterWallets, publicKey, disconnect, connected, wallet: activeWallet, signTransaction } = useWallet();

  const [tab, setTab]                   = useState<'dev' | 'volume'>('dev');
  const [mode, setMode]                 = useState<null | 'import' | 'create'>(null);
  const [importKey, setImportKey]       = useState('');
  const [walletName, setWalletName]     = useState('');
  const [isWorking, setIsWorking]       = useState(false);
  const [showKeyFor, setShowKeyFor]     = useState<string | null>(null);
  const [password, setPassword]         = useState('');
  const [keyVisible, setKeyVisible]     = useState(false);
  const [newKey, setNewKey]             = useState('');
  const [feedback, setFeedback]         = useState<{type:'ok'|'err';msg:string}|null>(null);
  const [refreshingId, setRefreshingId] = useState<string|null>(null);

  const filteredWallets = storedWallets.filter(w => w.type === tab);

  const flash = (type: 'ok'|'err', msg: string) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 4000);
  };
  const resetForm = () => { setMode(null); setImportKey(''); setWalletName(''); setNewKey(''); };

  // Auto-refresh balances on mount
  useEffect(() => {
    storedWallets.forEach(w => fetchBalance(w, false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When wallet-adapter connects, auto-add to dev wallets if not already there
  useEffect(() => {
    if (!connected || !publicKey || !activeWallet) return;
    const address = publicKey.toBase58();
    const exists  = storedWallets.find(w => w.address === address);
    if (!exists) {
      const newW: StoredWallet = {
        id: crypto.randomUUID(),
        name: activeWallet.adapter.name,
        address,
        balance: 0,
        type: 'dev',
        privateKeyEncrypted: '',
        connected: true,
        adapterName: activeWallet.adapter.name,
      };
      addWallet(newW);
      flash('ok', `${activeWallet.adapter.name} connected: ${address.slice(0,10)}…`);
    }
  }, [connected, publicKey]);

  const fetchBalance = async (w: StoredWallet, showSpinner = true) => {
    if (showSpinner) setRefreshingId(w.id);
    try {
      const r = await fetch(`/api/solana/balance?address=${w.address}`);
      const d = await r.json();
      updateWallet(w.id, { balance: d.balance ?? 0 });
    } catch {}
    finally { if (showSpinner) setRefreshingId(null); }
  };

  const handleCreate = async () => {
    if (!walletName.trim()) return;
    setIsWorking(true);
    try {
      const res = await fetch('/api/solana/generate', { method: 'POST' });
      const d   = await res.json();
      if (!d.address) throw new Error(d.error || 'Generate failed');
      const w: StoredWallet = { id: crypto.randomUUID(), name: walletName, address: d.address, balance: 0, type: tab, privateKeyEncrypted: d.privateKey };
      addWallet(w);
      setWalletName(''); setNewKey(d.privateKey);
      fetchBalance(w, false);
    } catch (e: any) { flash('err', e.message); }
    finally { setIsWorking(false); }
  };

  const handleImport = async () => {
    const key = importKey.trim();
    if (!key || !walletName.trim()) return;
    setIsWorking(true);
    try {
      const res = await fetch('/api/solana/validate-key', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ privateKey: key }),
      });
      const d = await res.json();
      if (!d.valid || !d.address) throw new Error(d.error || 'Invalid private key');
      const w: StoredWallet = { id: crypto.randomUUID(), name: walletName, address: d.address, balance: 0, type: tab, privateKeyEncrypted: key };
      addWallet(w);
      fetchBalance(w, false);
      flash('ok', `Imported: ${d.address.slice(0,14)}…`);
      resetForm();
    } catch (e: any) { flash('err', e.message); }
    finally { setIsWorking(false); }
  };

  const handleAdapterConnect = async (adapterName: string) => {
    const found = adapterWallets.find(w => w.adapter.name === adapterName);
    if (!found) { flash('err', `${adapterName} not installed`); return; }
    select(found.adapter.name as any);
    try { await found.adapter.connect(); }
    catch (e: any) { flash('err', e.message || 'Connection cancelled'); }
  };

  const handleAdapterDisconnect = async () => {
    if (!activeWallet || !publicKey) return;
    const address = publicKey.toBase58();
    await disconnect();
    const w = storedWallets.find(w => w.address === address && w.connected);
    if (w) deleteWallet(w.id);
    flash('ok', 'Wallet disconnected');
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-black/85 backdrop-blur-2xl border-2 border-green-400/30 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto pointer-events-auto shadow-2xl"
          onClick={e => e.stopPropagation()}>
          <div className="p-7">

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <img src="/vamp-fangs-silver.png" alt="" className="w-9 h-9" style={{ mixBlendMode: 'screen' }} />
                <h2 className="text-3xl font-mono font-bold text-green-400">WALLETS</h2>
              </div>
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 text-white/60 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Feedback */}
            {feedback && (
              <div className={cn('mb-4 flex items-center gap-2 px-4 py-2 rounded-xl text-sm border',
                feedback.type==='ok' ? 'bg-green-400/15 text-green-400 border-green-400/30' : 'bg-red-500/15 text-red-400 border-red-500/30')}>
                {feedback.type==='ok' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                {feedback.msg}
              </div>
            )}

            {/* Connect wallet-adapter section */}
            <div className="mb-5 p-4 rounded-2xl border border-white/10 bg-white/3">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-white/70 flex items-center gap-2">
                  <Link className="w-4 h-4" /> Connect Wallet
                </span>
                {connected && publicKey && (
                  <button onClick={handleAdapterDisconnect}
                    className="text-xs text-red-400 hover:text-red-300 font-mono border border-red-500/30 px-2 py-1 rounded-lg hover:border-red-500/50 transition-colors">
                    Disconnect
                  </button>
                )}
              </div>

              {connected && publicKey ? (
                <div className="flex items-center gap-3 px-3 py-2 bg-green-400/10 border border-green-400/20 rounded-xl">
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                  <span className="text-green-400 font-mono text-sm">{publicKey.toBase58().slice(0,16)}…</span>
                  <span className="text-xs text-green-400/60">{activeWallet?.adapter.name}</span>
                </div>
              ) : (
                <div className="flex gap-3">
                  {ADAPTER_WALLETS.map(aw => (
                    <button key={aw.name} onClick={() => handleAdapterConnect(aw.name)}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-white/15 bg-white/5 hover:border-white/30 hover:bg-white/8 transition-all">
                      <img src={aw.icon} alt={aw.name} className="w-5 h-5 rounded" onError={e => (e.currentTarget.style.display='none')} />
                      <span className="text-white/80 font-bold text-sm">{aw.name}</span>
                    </button>
                  ))}
                </div>
              )}
              <p className="text-xs text-white/25 mt-2">Connected wallet can be used as Dev wallet for VAMP launches</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-5">
              {(['dev', 'volume'] as const).map(t => (
                <button key={t} onClick={() => { setTab(t); resetForm(); }}
                  className={cn('flex-1 py-2.5 rounded-xl font-bold text-base transition-all',
                    tab===t
                      ? t==='dev' ? 'bg-green-400 text-black' : 'bg-blue-400 text-black'
                      : 'bg-white/5 border border-white/15 text-white/70 hover:border-white/30')}>
                  {t==='dev' ? 'Dev' : 'Volume'} Wallets ({storedWallets.filter(w=>w.type===t).length})
                </button>
              ))}
            </div>

            {/* Wallet list */}
            <div className="space-y-2 mb-5">
              {filteredWallets.length === 0 ? (
                <div className="p-8 text-center text-white/40 border border-dashed border-white/15 rounded-2xl">No {tab} wallets yet</div>
              ) : filteredWallets.map(w => (
                <div key={w.id}
                  className={cn('flex items-center gap-3 p-3 rounded-xl border transition-all',
                    w.connected ? 'border-purple-400/30 bg-purple-400/5' : 'border-white/10 bg-white/3 hover:border-white/20')}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="font-mono font-bold text-white text-sm">{w.name}</div>
                      {w.connected && (
                        <span className="text-xs px-1.5 py-0.5 rounded-md bg-purple-400/20 text-purple-400 font-bold">CONNECTED</span>
                      )}
                    </div>
                    <div className="text-xs text-white/40 font-mono truncate">{w.address}</div>
                    <div className="text-xs text-white/50 font-mono">{w.balance.toFixed(4)} SOL</div>
                  </div>
                  <button onClick={() => fetchBalance(w)}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors">
                    {refreshingId===w.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                  </button>
                  {!w.connected && (
                    <button onClick={() => { setShowKeyFor(w.id); setKeyVisible(false); setPassword(''); }}
                      className="p-1.5 rounded-lg hover:bg-green-400/10 text-white/40 hover:text-green-400 transition-colors">
                      <Key className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button onClick={() => deleteWallet(w.id)}
                    className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/40 hover:text-red-400 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Import / Create */}
            {!mode && !newKey && (
              <div className="flex gap-3">
                <Button onClick={() => setMode('import')} className="flex-1 bg-green-400 hover:bg-green-500 text-black font-bold h-11">
                  <Upload className="w-4 h-4 mr-2" />IMPORT
                </Button>
                <Button onClick={() => setMode('create')} className="flex-1 bg-blue-400 hover:bg-blue-500 text-black font-bold h-11">
                  + CREATE
                </Button>
              </div>
            )}

            {mode==='import' && (
              <div className="space-y-3">
                <div>
                  <Label className="text-sm text-white/70 mb-1 block">Private Key (Base58)</Label>
                  <Input value={importKey} onChange={e => setImportKey(e.target.value)}
                    placeholder="Paste base58 private key…" type="password"
                    className="bg-white/5 border-white/15 text-white h-10 font-mono text-sm" />
                </div>
                <div>
                  <Label className="text-sm text-white/70 mb-1 block">Wallet Name</Label>
                  <Input value={walletName} onChange={e => setWalletName(e.target.value)}
                    placeholder="e.g. Main Dev" className="bg-white/5 border-white/15 text-white h-10" />
                </div>
                <div className="flex gap-3">
                  <Button onClick={handleImport} disabled={!importKey || !walletName || isWorking}
                    className="flex-1 bg-green-400 hover:bg-green-500 text-black font-bold h-10">
                    {isWorking ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Checking…</> : 'Import'}
                  </Button>
                  <Button onClick={resetForm} variant="outline" className="flex-1 border-white/20 h-10">Cancel</Button>
                </div>
              </div>
            )}

            {mode==='create' && !newKey && (
              <div className="space-y-3">
                <div>
                  <Label className="text-sm text-white/70 mb-1 block">Wallet Name</Label>
                  <Input value={walletName} onChange={e => setWalletName(e.target.value)}
                    placeholder={tab==='dev' ? 'e.g. Dev Wallet 1' : 'e.g. Volume Bot 1'}
                    className="bg-white/5 border-white/15 text-white h-10" />
                </div>
                <div className="flex gap-3">
                  <Button onClick={handleCreate} disabled={!walletName || isWorking}
                    className="flex-1 bg-blue-400 hover:bg-blue-500 text-black font-bold h-10">
                    {isWorking ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating…</> : '⚡ Generate'}
                  </Button>
                  <Button onClick={resetForm} variant="outline" className="flex-1 border-white/20 h-10">Cancel</Button>
                </div>
              </div>
            )}

            {newKey && (
              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
                  <p className="text-yellow-400 font-bold text-sm mb-1">⚠️ Save your private key now!</p>
                  <p className="text-xs text-white break-all bg-black/40 rounded-lg p-3 select-all font-mono">{newKey}</p>
                  <Button onClick={() => navigator.clipboard.writeText(newKey)}
                    className="w-full mt-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold h-9">
                    <Copy className="w-4 h-4 mr-2" />Copy Key
                  </Button>
                </div>
                <Button onClick={() => { resetForm(); flash('ok', 'Wallet created!'); }}
                  className="w-full bg-green-400 hover:bg-green-500 text-black font-bold h-10">Done</Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showKeyFor && (
        <>
          <div className="fixed inset-0 bg-black/80 z-[60]" onClick={() => setShowKeyFor(null)} />
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none">
            <div className="bg-black/90 border-2 border-white/20 rounded-2xl max-w-sm w-full pointer-events-auto p-6"
              onClick={e => e.stopPropagation()}>
              <h3 className="text-xl font-bold text-white mb-4">🔐 Private Key</h3>
              {!keyVisible ? (
                <div className="space-y-3">
                  <p className="text-white/60 text-sm">Enter any password to reveal</p>
                  <Input type="password" value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="Password" className="bg-white/5 border-white/20 text-white h-10" />
                  <div className="flex gap-3">
                    <Button onClick={() => password.length > 0 && setKeyVisible(true)} className="flex-1 bg-green-400 text-black font-bold h-10">Reveal</Button>
                    <Button onClick={() => setShowKeyFor(null)} variant="outline" className="flex-1 border-white/20 h-10">Cancel</Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="font-mono text-xs text-white break-all bg-black/40 rounded-lg p-3 select-all">
                    {storedWallets.find(w => w.id === showKeyFor)?.privateKeyEncrypted}
                  </p>
                  <Button onClick={() => navigator.clipboard.writeText(storedWallets.find(w => w.id === showKeyFor)?.privateKeyEncrypted || '')}
                    className="w-full bg-green-400 text-black font-bold h-9"><Copy className="w-4 h-4 mr-2" />Copy</Button>
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
