'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, Check, Zap, Globe, Twitter, Send, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useWallets, usePortfolio } from '@/hooks/storage';

interface VampModalProps {
  onClose: () => void;
}

const PLATFORMS = [
  { id: 'pump',     label: 'Pump' },
  { id: 'bonk',     label: 'Bonk' },
  { id: 'studio',   label: 'Studio' },
  { id: 'bags',     label: 'Bags' },
  { id: 'raydium',  label: 'Raydium' },
  { id: 'meteora',  label: 'Meteora' },
];

export function VampModal({ onClose }: VampModalProps) {
  const { wallets } = useWallets();
  const { addToken } = usePortfolio();

  const [step, setStep] = useState<'input' | 'preview' | 'edit' | 'launch'>('input');
  const [tokenCA, setTokenCA] = useState('');
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);

  const [formData, setFormData] = useState({
    name:        '',
    symbol:      '',
    supply:      '',
    description: '',
    image:       '',
    website:     '',
    twitter:     '',
    telegram:    '',
  });
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['pump']);

  const devWallets = wallets.filter(w => w.type === 'dev');

  // Auto-fetch when CA entered
  useEffect(() => {
    if (!tokenCA || tokenCA.length < 20) return;
    const t = setTimeout(handleAutoFetch, 800);
    return () => clearTimeout(t);
  }, [tokenCA]);

  const handleAutoFetch = async () => {
    if (isFetching) return;
    setIsFetching(true);
    setTimeout(() => {
      setFormData({
        name:        'Test Token',
        symbol:      'TEST',
        supply:      '1000000000',
        description: 'A test token on Solana.',
        image:       '',
        website:     '',
        twitter:     '',
        telegram:    '',
      });
      setStep('preview');
      setIsFetching(false);
    }, 1200);
  };

  const togglePlatform = (id: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const handleLaunch = async () => {
    if (!selectedWallet) return;
    setIsLaunching(true);
    setTimeout(() => {
      addToken({
        id: Math.random().toString(),
        ca: tokenCA,
        name: formData.name,
        symbol: formData.symbol,
        launchPrice: 0.0001,
        currentPrice: 0.0001,
        bought: 0,
        sold: 0,
        profit: 0,
        launchedAt: Date.now(),
      });
      setIsLaunching(false);
      setStep('launch');
    }, 2000);
  };

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
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-red-500/10 text-white/60 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* ── STEP: INPUT ── */}
            {step === 'input' && (
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-base font-semibold text-white/90">Token Contract Address</Label>
                  <div className="relative">
                    <Input
                      value={tokenCA}
                      onChange={e => setTokenCA(e.target.value)}
                      placeholder="Paste token CA..."
                      className="bg-white/5 border-white/15 text-white placeholder:text-white/30 h-12 text-base font-mono"
                    />
                    {isFetching && <Loader2 className="absolute right-4 top-3.5 w-5 h-5 animate-spin text-red-500" />}
                  </div>
                  <p className="text-sm text-white/40">Вставь CA — метаданные загрузятся автоматически</p>
                </div>
              </div>
            )}

            {/* ── STEP: PREVIEW ── */}
            {step === 'preview' && (
              <div className="space-y-6">
                {/* Token card */}
                <div className="p-5 rounded-2xl border border-red-500/30 bg-red-500/5">
                  <div className="flex gap-4 items-start">
                    {/* Image */}
                    <div className="w-16 h-16 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0 overflow-hidden border border-white/10">
                      {formData.image
                        ? <img src={formData.image} alt={formData.name} className="w-full h-full object-cover" />
                        : <ImageIcon className="w-7 h-7 text-white/30" />
                      }
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-2xl font-black text-white">{formData.symbol}</span>
                        <span className="text-sm text-white/50">{formData.name}</span>
                      </div>
                      <p className="text-sm text-white/60 line-clamp-2">{formData.description}</p>
                      {/* Social icons */}
                      <div className="flex gap-3 mt-2">
                        {formData.website  && <Globe  className="w-4 h-4 text-white/40" />}
                        {formData.twitter  && <Twitter className="w-4 h-4 text-white/40" />}
                        {formData.telegram && <Send    className="w-4 h-4 text-white/40" />}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-white/10 flex gap-4 text-sm text-white/60">
                    <span>Supply: <b className="text-white">{Number(formData.supply).toLocaleString()}</b></span>
                    <span>CA: <b className="text-white font-mono text-xs">{tokenCA.slice(0,8)}…{tokenCA.slice(-6)}</b></span>
                  </div>
                </div>

                {/* Wallet selection */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold text-white/90">Dev Wallet ({devWallets.length})</Label>
                  {devWallets.length === 0 ? (
                    <div className="p-4 text-center text-white/40 border border-dashed border-white/15 rounded-xl text-sm">
                      Нет dev-кошельков — создай в разделе WALLETS
                    </div>
                  ) : (
                    <div className="space-y-2 border border-white/10 rounded-xl p-3 max-h-36 overflow-y-auto">
                      {devWallets.map(w => (
                        <button
                          key={w.id}
                          onClick={() => setSelectedWallet(w.id)}
                          className={cn(
                            'w-full flex items-center justify-between p-3 rounded-lg transition-all text-left',
                            selectedWallet === w.id
                              ? 'border-2 border-red-500 bg-red-500/10'
                              : 'border border-white/10 hover:border-white/25 bg-white/3'
                          )}
                        >
                          <div>
                            <div className="font-mono font-bold text-white text-sm">{w.name}</div>
                            <div className="text-xs text-white/40 font-mono">{w.address.slice(0,14)}…</div>
                          </div>
                          {selectedWallet === w.id && <Check className="w-4 h-4 text-red-500" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <Button
                    onClick={() => setStep('edit')}
                    variant="outline"
                    className="flex-1 border-white/20 h-11 font-mono"
                  >
                    EDIT
                  </Button>
                  <Button
                    onClick={handleLaunch}
                    disabled={!selectedWallet || isLaunching}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold h-11"
                  >
                    {isLaunching ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Launching…</>
                    ) : (
                      <><Zap className="w-4 h-4 mr-2" />FAST LAUNCH</>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* ── STEP: EDIT ── */}
            {step === 'edit' && (
              <div className="space-y-5">

                {/* Image URL */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-white/80">Token Image URL</Label>
                  <div className="flex gap-2">
                    {formData.image && (
                      <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/10 flex-shrink-0">
                        <img src={formData.image} alt="" className="w-full h-full object-cover"
                          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      </div>
                    )}
                    <Input
                      value={formData.image}
                      onChange={e => setFormData({ ...formData, image: e.target.value })}
                      placeholder="https://…/logo.png"
                      className="bg-white/5 border-white/15 text-white placeholder:text-white/30 h-10 font-mono text-sm flex-1"
                    />
                  </div>
                </div>

                {/* Name + Symbol */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-white/80">Token Name</Label>
                    <Input
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="bg-white/5 border-white/15 text-white h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-white/80">Symbol</Label>
                    <Input
                      value={formData.symbol}
                      onChange={e => setFormData({ ...formData, symbol: e.target.value })}
                      className="bg-white/5 border-white/15 text-white h-10 font-mono"
                    />
                  </div>
                </div>

                {/* Supply */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-white/80">Supply</Label>
                  <Input
                    value={formData.supply}
                    onChange={e => setFormData({ ...formData, supply: e.target.value })}
                    className="bg-white/5 border-white/15 text-white h-10 font-mono"
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-white/80">Description</Label>
                  <textarea
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full bg-white/5 border border-white/15 text-white rounded-xl p-3 text-sm resize-none focus:outline-none focus:border-red-500/50"
                  />
                </div>

                {/* Social Links */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-white/80">Links</Label>
                  <div className="space-y-2">
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                      <Input
                        value={formData.website}
                        onChange={e => setFormData({ ...formData, website: e.target.value })}
                        placeholder="Website (https://…)"
                        className="bg-white/5 border-white/15 text-white h-10 pl-9 text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="relative">
                        <Twitter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                        <Input
                          value={formData.twitter}
                          onChange={e => setFormData({ ...formData, twitter: e.target.value })}
                          placeholder="Twitter/X"
                          className="bg-white/5 border-white/15 text-white h-10 pl-9 text-sm"
                        />
                      </div>
                      <div className="relative">
                        <Send className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                        <Input
                          value={formData.telegram}
                          onChange={e => setFormData({ ...formData, telegram: e.target.value })}
                          placeholder="Telegram"
                          className="bg-white/5 border-white/15 text-white h-10 pl-9 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Platform Selection */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-white/80">Platforms</Label>
                  <div className="flex flex-wrap gap-2">
                    {PLATFORMS.map(p => (
                      <button
                        key={p.id}
                        onClick={() => togglePlatform(p.id)}
                        className={cn(
                          'px-4 py-2 rounded-lg text-sm font-bold border transition-all',
                          selectedPlatforms.includes(p.id)
                            ? 'bg-red-500 border-red-500 text-white'
                            : 'bg-white/5 border-white/15 text-white/60 hover:border-white/30 hover:text-white'
                        )}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Save / Back */}
                <div className="flex gap-3 pt-1">
                  <Button
                    onClick={() => setStep('preview')}
                    variant="outline"
                    className="flex-1 border-white/20 h-11"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={() => setStep('preview')}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold h-11"
                  >
                    Save & Preview
                  </Button>
                </div>
              </div>
            )}

            {/* ── STEP: LAUNCH SUCCESS ── */}
            {step === 'launch' && (
              <div className="text-center space-y-4 py-8">
                <div className="text-6xl">🚀</div>
                <h3 className="text-2xl font-bold text-white">Launch Successful!</h3>
                <p className="text-white/50">{formData.symbol} добавлен в Portfolio</p>
                <div className="flex justify-center gap-2 mt-4">
                  {[0, 100, 200].map(d => (
                    <div
                      key={d}
                      className="w-3 h-3 rounded-full bg-red-500 animate-bounce"
                      style={{ animationDelay: `${d}ms` }}
                    />
                  ))}
                </div>
                <Button
                  onClick={onClose}
                  className="w-full mt-6 bg-red-500 hover:bg-red-600 text-white font-bold h-11"
                >
                  Close
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
