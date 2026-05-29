'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Loader2, Check, Zap, Globe, Twitter, Send, Upload, AlertCircle, Plus, Minus, ExternalLink, Key, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useWallets, usePortfolio } from '@/hooks/storage';
import { getAvailablePumpCA, markPumpCAUsed } from '@/lib/pump-ca';

interface VampModalProps {
  onClose:          () => void;
  onOpenPortfolio?: () => void;
}

const PLATFORMS = [
  { id: 'pump',    label: 'Pump',    logo: '/platforms/pump.png',    soon: false },
  { id: 'bonk',    label: 'Bonk',    logo: '/platforms/bonk.png',    soon: true  },
  { id: 'studio',  label: 'Studio',  logo: '/platforms/studio.jpg',  soon: true  },
  { id: 'bags',    label: 'Bags',    logo: '/platforms/bags.png',     soon: true  },
  { id: 'raydium', label: 'Raydium', logo: '/platforms/raydium.jpg',  soon: true  },
  { id: 'meteora', label: 'Meteora', logo: '/platforms/meteora.png',  soon: true  },
];

export function VampModal({ onClose, onOpenPortfolio }: VampModalProps) {
  const { wallets } = useWallets();
  const { addToken } = usePortfolio();
  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep]                           = useState<'input'|'preview'|'edit'|'launch'>('input');
  const [tokenCA, setTokenCA]                     = useState('');
  const [selectedWallet, setSelectedWallet]       = useState<string|null>(null);
  const [isFetching, setIsFetching]               = useState(false);
  const [isLaunching, setIsLaunching]             = useState(false);
  const [launchProgress, setLaunchProgress]       = useState({ done: 0, total: 0 });
  const [launchError, setLaunchError]             = useState('');
  const [launchedMint, setLaunchedMint]           = useState('');  // ← FIXED
  const [launchType, setLaunchType]               = useState<'pump'|'custom'>('pump');
  const [mintPrivateKey, setMintPrivateKey]       = useState('');
  const [mintPreviewCA, setMintPreviewCA]         = useState('');
  const [showMintKey, setShowMintKey]             = useState(false);
  const [previewingMint, setPreviewingMint]       = useState(false);
  const [imageFile, setImageFile]                 = useState<File|null>(null);
  const [previewImage, setPreviewImage]           = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['pump']);
  const [launches, setLaunches]                   = useState(1);
  const [devBuySOL, setDevBuySOL]                 = useState('');

  const [form, setForm] = useState({
    name: '', symbol: '', description: '',
    website: '', twitter: '', telegram: '',
  });

  const devWallets = wallets.filter(w => w.type === 'dev');

  useEffect(() => {
    if (tokenCA.length < 20) return;
    const t = setTimeout(fetchTokenInfo, 800);
    return () => clearTimeout(t);
  }, [tokenCA]);

  const fetchTokenInfo = async () => {
    if (isFetching) return;
    setIsFetching(true); setLaunchError('');
    try {
      const res  = await fetch(`/api/solana/token-info?ca=${tokenCA}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setForm({
        name:        data.name        || '',
        symbol:      data.symbol      || '',
        description: data.description || '',
        website:     data.website     || '',
        twitter:     data.twitter     || '',
        telegram:    data.telegram    || '',
      });
      if (data.image) setPreviewImage(data.image);
      setStep('preview');
    } catch (e: any) { setLaunchError(e.message || 'Token not found'); }
    finally { setIsFetching(false); }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setPreviewImage(URL.createObjectURL(file));
  };

  const handleLaunch = async () => {
    if (!selectedWallet) return;
    const wallet = wallets.find(w => w.id === selectedWallet);
    if (!wallet) return;

    setIsLaunching(true); setLaunchError('');
    setLaunchProgress({ done: 0, total: launches });

    try {
      // 1. Upload to IPFS once
      const ipfsForm = new FormData();
      if (imageFile)     ipfsForm.append('file', imageFile);
      else if (previewImage) ipfsForm.append('imageUrl', previewImage);
      ipfsForm.append('name',        form.name);
      ipfsForm.append('symbol',      form.symbol);
      ipfsForm.append('description', form.description);
      if (form.website)  ipfsForm.append('website',  form.website);
      if (form.twitter)  ipfsForm.append('twitter',  form.twitter);
      if (form.telegram) ipfsForm.append('telegram', form.telegram);

      const ipfsRes = await fetch('/api/solana/upload-ipfs', { method: 'POST', body: ipfsForm });
      const { uri, error: ipfsErr } = await ipfsRes.json();
      if (ipfsErr || !uri) throw new Error(ipfsErr || 'IPFS upload failed');

      // 2. Launch N times
      const mintAddresses: string[] = [];
      const buyAmt = parseFloat(devBuySOL) || 0;

      for (let i = 0; i < launches; i++) {
        // For pump launch: auto-pick a CA from the pool
        let finalMintKey = launchType === 'custom' && mintPrivateKey ? mintPrivateKey : undefined;
        let pumpCAId: string | null = null;
        if (launchType === 'pump') {
          const poolEntry = getAvailablePumpCA();
          if (poolEntry) { finalMintKey = poolEntry.privateKey; pumpCAId = poolEntry.id; }
        }
        const createRes = await fetch('/api/solana/create-token', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            privateKey:     wallet.privateKeyEncrypted,
            name:           form.name,
            symbol:         form.symbol,
            uri,
            buyAmountSol:   buyAmt,
            mintPrivateKey: finalMintKey,
          }),
        });
        const createData = await createRes.json();
        if (!createData.success) throw new Error(`Launch ${i+1}: ${createData.error}`);
        mintAddresses.push(createData.mintAddress);
        setLaunchProgress({ done: i + 1, total: launches });

        addToken({
          id: createData.mintAddress, ca: createData.mintAddress,
          name: form.name, symbol: form.symbol,
          launchPrice: 0.000001, currentPrice: 0.000001,
          bought: buyAmt, sold: 0, profit: 0,
          image: previewImage, launchedAt: Date.now(),
        });
      }

      setLaunchedMint(mintAddresses[mintAddresses.length - 1] || '');
      if (pumpCAId) markPumpCAUsed(pumpCAId);
      setStep('launch');
    } catch (e: any) {
      setLaunchError(e.message || 'Launch failed');
    } finally { setIsLaunching(false); }
  };

  const togglePlatform = (id: string) =>
    setSelectedPlatforms(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const devBuyNum = parseFloat(devBuySOL) || 0;
  const totalSOL  = (devBuyNum * launches).toFixed(4);

  return (
    <>
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-black/85 backdrop-blur-2xl border-2 border-red-500/30 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto pointer-events-auto shadow-2xl"
          onClick={e => e.stopPropagation()}>
          <div className="p-7">

            {/* Header */}
            <div className="flex items-center justify-between mb-7">
              <div className="flex items-center gap-3">
                <img src="/vamp-fangs-silver.png" alt="VAMP" className="w-9 h-9" style={{ mixBlendMode: 'screen' }} />
                <h2 className="text-3xl font-mono font-bold text-red-500">VAMP</h2>
              </div>
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 text-white/60 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            {launchError && (
              <div className="mb-5 flex items-center gap-2 px-4 py-2 bg-red-500/15 border border-red-500/30 rounded-xl text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />{launchError}
              </div>
            )}

            {/* INPUT */}
            {step === 'input' && (
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-semibold text-white/90 mb-2 block">Token Contract Address</Label>
                  <div className="relative">
                    <Input value={tokenCA} onChange={e => setTokenCA(e.target.value)}
                      placeholder="Paste token CA…"
                      className="bg-white/5 border-white/15 text-white placeholder:text-white/30 h-12 font-mono" />
                    {isFetching && <Loader2 className="absolute right-4 top-3.5 w-5 h-5 animate-spin text-red-500" />}
                  </div>
                  <p className="text-sm text-white/40 mt-1">Данные загрузятся автоматически</p>
                </div>
              </div>
            )}

            {/* PREVIEW */}
            {step === 'preview' && (
              <div className="space-y-5">
                {/* Token card */}
                <div className="p-5 rounded-2xl border border-red-500/30 bg-red-500/5">
                  <div className="flex gap-4">
                    <div className="w-16 h-16 rounded-xl overflow-hidden border border-white/10 flex-shrink-0 bg-white/5 flex items-center justify-center">
                      {previewImage
                        ? <img src={previewImage} className="w-full h-full object-cover" alt="" onError={e => (e.currentTarget.style.display='none')} />
                        : <span className="text-2xl">🪙</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-white">{form.symbol}</span>
                        <span className="text-white/50 text-sm">{form.name}</span>
                      </div>
                      {form.description && <p className="text-sm text-white/60 line-clamp-2 mt-1">{form.description}</p>}
                      <div className="flex gap-3 mt-2">
                        {form.website  && <Globe   className="w-4 h-4 text-white/40" />}
                        {form.twitter  && <Twitter className="w-4 h-4 text-white/40" />}
                        {form.telegram && <Send    className="w-4 h-4 text-white/40" />}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-white/10 text-xs text-white/40 font-mono">
                    CA: {tokenCA.slice(0,10)}…{tokenCA.slice(-8)}
                  </div>
                </div>

                {/* Launch Type Selector */}
                <div>
                  <Label className="text-base font-semibold text-white/90 mb-2 block">Launch Type</Label>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    {(['pump','custom'] as const).map(lt => (
                      <button key={lt} onClick={() => { setLaunchType(lt); setMintPrivateKey(''); setMintPreviewCA(''); }}
                        className={cn('p-4 rounded-xl border-2 text-center transition-all',
                          launchType===lt ? 'border-red-500 bg-red-500/10' : 'border-white/10 hover:border-white/25')}>
                        <div className="text-2xl mb-1">{lt==='pump' ? '💎' : '✨'}</div>
                        <div className="font-bold text-white text-sm">{lt==='pump' ? 'Default Launch' : 'Custom CA'}</div>
                        <div className="text-xs text-white/40 mt-0.5">
                          {lt==='pump' ? 'with pump CA' : 'Your vanity keypair'}
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Custom CA — mint private key input */}
                  {launchType==='custom' && (
                    <div className="p-4 rounded-xl border border-yellow-400/30 bg-yellow-400/5 space-y-3">
                      <p className="text-yellow-400 text-sm font-bold flex items-center gap-2">
                        <Key className="w-4 h-4" /> Mint Keypair (Vanity)
                      </p>
                      <div className="relative">
                        <input
                          value={mintPrivateKey}
                          onChange={e => { setMintPrivateKey(e.target.value); setMintPreviewCA(''); }}
                          placeholder="Paste mint private key (base58)…"
                          type={showMintKey ? 'text' : 'password'}
                          className="w-full bg-black/40 border border-white/15 text-white rounded-xl px-3 pr-9 h-10 font-mono text-xs focus:outline-none focus:border-yellow-400/50 placeholder:text-white/20"
                        />
                        <button type="button" onClick={() => setShowMintKey(v => !v)}
                          className="absolute right-2.5 top-2.5 text-white/30 hover:text-white/60">
                          {showMintKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {mintPrivateKey && !mintPreviewCA && (
                        <button
                          onClick={async () => {
                            setPreviewingMint(true);
                            try {
                              const r = await fetch('/api/solana/validate-mint-key', {
                                method: 'POST', headers: {'Content-Type':'application/json'},
                                body: JSON.stringify({ mintPrivateKey }),
                              });
                              const d = await r.json();
                              if (d.valid) setMintPreviewCA(d.mintAddress);
                              else setLaunchError('Invalid mint keypair');
                            } catch { setLaunchError('Validation failed'); }
                            setPreviewingMint(false);
                          }}
                          disabled={previewingMint}
                          className="w-full h-9 rounded-xl bg-yellow-400/15 hover:bg-yellow-400/25 text-yellow-400 font-bold text-sm transition-all"
                        >
                          {previewingMint ? <><Loader2 className="w-3 h-3 animate-spin inline mr-1" />Checking…</> : 'Preview CA →'}
                        </button>
                      )}
                      {mintPreviewCA && (
                        <div className="p-3 rounded-lg bg-green-400/10 border border-green-400/20">
                          <p className="text-xs text-green-400/60 mb-1">Token will launch as:</p>
                          <p className="font-mono text-green-400 text-xs break-all">{mintPreviewCA}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Wallet select */}
                <div>
                  <Label className="text-base font-semibold text-white/90 mb-2 block">Dev Wallet</Label>
                  {devWallets.length === 0 ? (
                    <div className="p-4 text-center text-white/40 border border-dashed border-white/15 rounded-xl text-sm">
                      Создай Dev Wallet в разделе WALLETS
                    </div>
                  ) : (
                    <div className="space-y-2 border border-white/10 rounded-xl p-3 max-h-36 overflow-y-auto">
                      {devWallets.map(w => (
                        <button key={w.id} onClick={() => setSelectedWallet(w.id)}
                          className={cn('w-full flex items-center justify-between p-3 rounded-lg transition-all',
                            selectedWallet === w.id
                              ? 'border-2 border-red-500 bg-red-500/10'
                              : 'border border-white/10 hover:border-white/25')}>
                          <div className="text-left">
                            <div className="font-mono font-bold text-white text-sm">{w.name}</div>
                            <div className="text-xs text-white/40">{w.address.slice(0,14)}… · {w.balance.toFixed(4)} SOL</div>
                          </div>
                          {selectedWallet === w.id && <Check className="w-4 h-4 text-red-500" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Launch settings */}
                <div className="p-4 rounded-2xl border border-white/10 bg-white/3 space-y-4">
                  <h3 className="text-xs font-bold text-white/50 uppercase tracking-wider">Launch Settings</h3>

                  {/* Launches counter */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold text-white/80">Launches</div>
                      <div className="text-xs text-white/40">Кол-во одинаковых токенов</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={() => setLaunches(l => Math.max(1, l - 1))}
                        className="w-8 h-8 rounded-lg bg-white/10 hover:bg-red-500/20 flex items-center justify-center text-white transition-colors">
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="text-2xl font-black text-white w-8 text-center">{launches}</span>
                      <button onClick={() => setLaunches(l => Math.min(10, l + 1))}
                        className="w-8 h-8 rounded-lg bg-white/10 hover:bg-red-500/20 flex items-center justify-center text-white transition-colors">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Dev buy — plain input, no spinners */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-white/80">Dev Buy per launch</div>
                      <div className="text-xs text-white/40">0 или пусто — без дев бая</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        value={devBuySOL}
                        onChange={e => setDevBuySOL(e.target.value)}
                        placeholder="0"
                        inputMode="decimal"
                        className="w-24 bg-white/5 border border-white/15 text-white rounded-xl px-3 h-9 font-mono text-right focus:outline-none focus:border-red-500/50 placeholder:text-white/20"
                      />
                      <span className="text-white/50 text-sm font-mono">SOL</span>
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/10">
                    <span className="text-sm text-white/50">
                      {launches} × {devBuyNum > 0 ? `${devBuySOL} SOL` : '0 SOL'}
                    </span>
                    <span className="font-black text-white">
                      = <span className="text-red-400">{totalSOL} SOL</span>
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <Button onClick={() => setStep('edit')} variant="outline" className="flex-1 border-white/20 h-11 font-mono">
                    EDIT
                  </Button>
                  <Button onClick={handleLaunch} disabled={!selectedWallet || isLaunching}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold h-11">
                    {isLaunching ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {launchProgress.total > 1 ? `${launchProgress.done}/${launchProgress.total}…` : 'Launching…'}
                      </>
                    ) : (
                      <><Zap className="w-4 h-4 mr-2" />
                        {launches > 1 ? `LAUNCH × ${launches}` : 'FAST LAUNCH'}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* EDIT */}
            {step === 'edit' && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold text-white/80">Token Image</Label>
                  <div className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-dashed border-white/20 cursor-pointer hover:border-red-500/60 transition-colors group"
                    onClick={() => fileRef.current?.click()}>
                    {previewImage
                      ? <img src={previewImage} className="w-full h-full object-cover" alt="" />
                      : <div className="w-full h-full flex items-center justify-center text-3xl">🪙</div>}
                    <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-1 transition-opacity">
                      <Upload className="w-5 h-5 text-white" />
                      <span className="text-xs text-white">Change</span>
                    </div>
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
                  <p className="text-xs text-white/40">Нажми чтобы загрузить с компьютера</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm text-white/70 mb-1 block">Name</Label>
                    <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                      className="bg-white/5 border-white/15 text-white h-10" />
                  </div>
                  <div>
                    <Label className="text-sm text-white/70 mb-1 block">Symbol</Label>
                    <Input value={form.symbol} onChange={e => setForm({...form, symbol: e.target.value})}
                      className="bg-white/5 border-white/15 text-white h-10 font-mono" />
                  </div>
                </div>

                <div>
                  <Label className="text-sm text-white/70 mb-1 block">Description</Label>
                  <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                    rows={3}
                    className="w-full bg-white/5 border border-white/15 text-white rounded-xl p-3 text-sm resize-none focus:outline-none focus:border-red-500/50" />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm text-white/70 block">Links</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <Input value={form.website} onChange={e => setForm({...form, website: e.target.value})}
                      placeholder="Website" className="bg-white/5 border-white/15 text-white h-9 pl-9 text-sm" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="relative">
                      <Twitter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                      <Input value={form.twitter} onChange={e => setForm({...form, twitter: e.target.value})}
                        placeholder="Twitter/X" className="bg-white/5 border-white/15 text-white h-9 pl-9 text-sm" />
                    </div>
                    <div className="relative">
                      <Send className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                      <Input value={form.telegram} onChange={e => setForm({...form, telegram: e.target.value})}
                        placeholder="Telegram" className="bg-white/5 border-white/15 text-white h-9 pl-9 text-sm" />
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-sm text-white/70 mb-2 block">Platforms</Label>
                  <div className="flex flex-wrap gap-3">
                    {PLATFORMS.map(p => {
                      const active = selectedPlatforms.includes(p.id);
                      if (p.soon) {
                        return (
                          <div key={p.id} className="flex flex-col items-center gap-1.5 relative group">
                            <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-white/10 opacity-30 cursor-not-allowed grayscale">
                              <img src={p.logo} alt={p.label} className="w-full h-full object-cover" />
                            </div>
                            <span className="text-xs font-medium text-white/20">{p.label}</span>
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-black border border-white/20 rounded-lg text-xs text-white/60 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                              Soon
                            </div>
                          </div>
                        );
                      }
                      return (
                        <button key={p.id} onClick={() => togglePlatform(p.id)} className="flex flex-col items-center gap-1.5 transition-all">
                          <div className={cn('w-11 h-11 rounded-full overflow-hidden border-2 transition-all',
                            active ? 'border-red-500 ring-2 ring-red-500/30' : 'border-white/15 opacity-50 hover:opacity-80')}>
                            <img src={p.logo} alt={p.label} className="w-full h-full object-cover" />
                          </div>
                          <span className={cn('text-xs font-medium', active ? 'text-red-400' : 'text-white/40')}>{p.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-3 pt-1">
                  <Button onClick={() => setStep('preview')} variant="outline" className="flex-1 border-white/20 h-11">Back</Button>
                  <Button onClick={() => setStep('preview')} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold h-11">Save & Preview</Button>
                </div>
              </div>
            )}

            {/* LAUNCH SUCCESS */}
            {step === 'launch' && (
              <div className="text-center py-6 space-y-3">
                <div className="text-6xl">🚀</div>
                <h3 className="text-2xl font-bold text-white">
                  {launches > 1 ? `${launches} Tokens Launched!` : 'Token Launched!'}
                </h3>
                <p className="text-white/50 text-sm">
                  {form.symbol} добавлен в Portfolio{devBuyNum > 0 ? ` · Dev buy: ${totalSOL} SOL` : ''}
                </p>
                {launchedMint && (
                  <p className="text-xs text-white/25 font-mono break-all px-2">{launchedMint}</p>
                )}
                <div className="flex justify-center gap-2 py-1">
                  {[0,100,200].map(d => (
                    <div key={d} className="w-3 h-3 rounded-full bg-red-500 animate-bounce" style={{animationDelay:`${d}ms`}} />
                  ))}
                </div>
                <div className="flex flex-col gap-2 pt-1">
                  <Button onClick={onClose} className="w-full bg-red-500 hover:bg-red-600 text-white font-bold h-11">
                    Close
                  </Button>
                  <a href={launchedMint ? `https://gmgn.ai/sol/token/${launchedMint}` : 'https://gmgn.ai'}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold text-sm text-white transition-colors"
                    style={{ background: '#0d9488' }}>
                    <ExternalLink className="w-4 h-4" /> Open GMGN
                  </a>
                  <button onClick={() => { onClose(); onOpenPortfolio?.(); }}
                    className="w-full py-3 rounded-xl bg-white/8 hover:bg-white/12 text-white font-bold text-sm border border-white/15 transition-colors">
                    📊 Open Portfolio
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}




