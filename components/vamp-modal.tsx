'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Loader2, Check, Zap, Globe, Twitter, Send, Upload, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useWallets, usePortfolio } from '@/hooks/storage';

interface VampModalProps { onClose: () => void; }

const PLATFORMS = [
  { id: 'pump',    label: 'Pump',    logo: '/platforms/pump.png'    },
  { id: 'bonk',    label: 'Bonk',    logo: '/platforms/bonk.png'    },
  { id: 'studio',  label: 'Studio',  logo: '/platforms/studio.jpg'  },
  { id: 'bags',    label: 'Bags',    logo: '/platforms/bags.png'     },
  { id: 'raydium', label: 'Raydium', logo: '/platforms/raydium.jpg'  },
  { id: 'meteora', label: 'Meteora', logo: '/platforms/meteora.png'  },
];

export function VampModal({ onClose }: VampModalProps) {
  const { wallets } = useWallets();
  const { addToken } = usePortfolio();
  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep]                   = useState<'input'|'preview'|'edit'|'launch'>('input');
  const [tokenCA, setTokenCA]             = useState('');
  const [selectedWallet, setSelectedWallet] = useState<string|null>(null);
  const [isFetching, setIsFetching]       = useState(false);
  const [isLaunching, setIsLaunching]     = useState(false);
  const [launchError, setLaunchError]     = useState('');
  const [imageFile, setImageFile]         = useState<File|null>(null);
  const [previewImage, setPreviewImage]   = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['pump']);

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
    setIsFetching(true);
    setLaunchError('');
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
    } catch (e: any) {
      setLaunchError(e.message || 'Token not found');
    } finally {
      setIsFetching(false);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setPreviewImage(URL.createObjectURL(file));
  };

  const handleLaunch = async () => {
    if (!selectedWallet) return;
    setIsLaunching(true);
    setLaunchError('');
    try {
      const wallet = wallets.find(w => w.id === selectedWallet);
      if (!wallet) throw new Error('Wallet not found');

      const ipfsForm = new FormData();
      if (imageFile) ipfsForm.append('file', imageFile);
      ipfsForm.append('name',        form.name);
      ipfsForm.append('symbol',      form.symbol);
      ipfsForm.append('description', form.description);
      if (form.website)  ipfsForm.append('website',  form.website);
      if (form.twitter)  ipfsForm.append('twitter',  form.twitter);
      if (form.telegram) ipfsForm.append('telegram', form.telegram);

      const ipfsRes = await fetch('/api/solana/upload-ipfs', { method: 'POST', body: ipfsForm });
      const { uri, error: ipfsErr } = await ipfsRes.json();
      if (ipfsErr || !uri) throw new Error(ipfsErr || 'IPFS upload failed');

      const createRes = await fetch('/api/solana/create-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ privateKey: wallet.privateKeyEncrypted, name: form.name, symbol: form.symbol, uri, buyAmountSol: 0 }),
      });
      const createData = await createRes.json();
      if (!createData.success) throw new Error(createData.error || 'Create failed');

      addToken({
        id: createData.mintAddress, ca: createData.mintAddress,
        name: form.name, symbol: form.symbol,
        launchPrice: 0.000001, currentPrice: 0.000001,
        bought: 0, sold: 0, profit: 0,
        image: previewImage, launchedAt: Date.now(),
      });
      setStep('launch');
    } catch (e: any) {
      setLaunchError(e.message || 'Launch failed');
    } finally {
      setIsLaunching(false);
    }
  };

  const togglePlatform = (id: string) =>
    setSelectedPlatforms(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  return (
    <>
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-black/85 backdrop-blur-2xl border-2 border-red-500/30 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto pointer-events-auto shadow-2xl"
          onClick={e => e.stopPropagation()}
        >
          <div className="p-7">

            {/* Header */}
            <div className="flex items-center justify-between mb-7">
              <div className="flex items-center gap-3">
                <img src="/vamp-fangs-silver.png" alt="VAMP" className="w-9 h-9" />
                <h2 className="text-3xl font-mono font-bold text-red-500">VAMP</h2>
              </div>
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 text-white/60 hover:text-white">
                <X className="w-5 h-5" />
              </button>
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
                <div className="p-5 rounded-2xl border border-red-500/30 bg-red-500/5">
                  <div className="flex gap-4">
                    <div className="w-16 h-16 rounded-xl overflow-hidden border border-white/10 flex-shrink-0 bg-white/5 flex items-center justify-center">
                      {previewImage ? <img src={previewImage} className="w-full h-full object-cover" alt="" /> : <span className="text-2xl">🪙</span>}
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
                  <div className="mt-3 pt-3 border-t border-white/10 text-sm text-white/50">
                    CA: <span className="font-mono text-white/70">{tokenCA.slice(0,10)}…{tokenCA.slice(-8)}</span>
                  </div>
                </div>

                {/* Wallet select */}
                <div>
                  <Label className="text-base font-semibold text-white/90 mb-2 block">Dev Wallet</Label>
                  {devWallets.length === 0 ? (
                    <div className="p-4 text-center text-white/40 border border-dashed border-white/15 rounded-xl text-sm">Создай Dev Wallet в WALLETS</div>
                  ) : (
                    <div className="space-y-2 border border-white/10 rounded-xl p-3 max-h-40 overflow-y-auto">
                      {devWallets.map(w => (
                        <button key={w.id} onClick={() => setSelectedWallet(w.id)}
                          className={cn('w-full flex items-center justify-between p-3 rounded-lg transition-all',
                            selectedWallet === w.id ? 'border-2 border-red-500 bg-red-500/10' : 'border border-white/10 hover:border-white/25')}>
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

                <div className="flex gap-3">
                  <Button onClick={() => setStep('edit')} variant="outline" className="flex-1 border-white/20 h-11 font-mono">EDIT</Button>
                  <Button onClick={handleLaunch} disabled={!selectedWallet || isLaunching}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold h-11">
                    {isLaunching ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Launching…</> : <><Zap className="w-4 h-4 mr-2" />FAST LAUNCH</>}
                  </Button>
                </div>
              </div>
            )}

            {/* EDIT */}
            {step === 'edit' && (
              <div className="space-y-4">

                {/* Image upload */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold text-white/80">Token Image</Label>
                  <div
                    className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-dashed border-white/20 cursor-pointer hover:border-red-500/60 transition-colors group"
                    onClick={() => fileRef.current?.click()}
                  >
                    {previewImage
                      ? <img src={previewImage} className="w-full h-full object-cover" alt="" />
                      : <div className="w-full h-full flex items-center justify-center text-3xl">🪙</div>}
                    <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-1 transition-opacity">
                      <Upload className="w-5 h-5 text-white" />
                      <span className="text-xs text-white">Change</span>
                    </div>
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
                  <p className="text-xs text-white/40">Click to upload from computer</p>
                </div>

                {/* Name + Symbol */}
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

                {/* Description */}
                <div>
                  <Label className="text-sm text-white/70 mb-1 block">Description</Label>
                  <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                    rows={3}
                    className="w-full bg-white/5 border border-white/15 text-white rounded-xl p-3 text-sm resize-none focus:outline-none focus:border-red-500/50" />
                </div>

                {/* Links */}
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

                {/* Platforms — round logos */}
                <div>
                  <Label className="text-sm text-white/70 mb-2 block">Platforms</Label>
                  <div className="flex flex-wrap gap-3">
                    {PLATFORMS.map(p => {
                      const active = selectedPlatforms.includes(p.id);
                      return (
                        <button
                          key={p.id}
                          onClick={() => togglePlatform(p.id)}
                          className={cn(
                            'flex flex-col items-center gap-1.5 transition-all',
                          )}
                        >
                          <div className={cn(
                            'w-11 h-11 rounded-full overflow-hidden border-2 transition-all',
                            active
                              ? 'border-red-500 ring-2 ring-red-500/30'
                              : 'border-white/15 opacity-50 hover:opacity-80 hover:border-white/30'
                          )}>
                            <img src={p.logo} alt={p.label} className="w-full h-full object-cover" />
                          </div>
                          <span className={cn('text-xs font-medium', active ? 'text-red-400' : 'text-white/40')}>
                            {p.label}
                          </span>
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
              <div className="text-center py-8 space-y-4">
                <div className="text-6xl">🚀</div>
                <h3 className="text-2xl font-bold text-white">Token Launched!</h3>
                <p className="text-white/50">{form.symbol} добавлен в Portfolio</p>
                <div className="flex justify-center gap-2">
                  {[0,100,200].map(d => (
                    <div key={d} className="w-3 h-3 rounded-full bg-red-500 animate-bounce" style={{animationDelay:`${d}ms`}} />
                  ))}
                </div>
                <Button onClick={onClose} className="w-full mt-4 bg-red-500 hover:bg-red-600 text-white font-bold h-11">Close</Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
