'use client';

import { useState } from 'react';
import { X, Loader2, Check, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useWallets, usePortfolio } from '@/hooks/storage';

interface VampModalProps {
  onClose: () => void;
}

export function VampModal({ onClose }: VampModalProps) {
  const { wallets } = useWallets();
  const { addToken } = usePortfolio();
  
  const [tokenCA, setTokenCA] = useState('');
  const [tokenData, setTokenData] = useState<any>(null);
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);

  const devWallets = wallets.filter(w => w.type === 'dev');

  const handleFetchToken = async (ca: string) => {
    if (!ca || ca.length < 20) return;
    
    setIsFetching(true);
    setTimeout(() => {
      setTokenData({
        name: 'Cwardin',
        symbol: 'Cwardin',
        description: 'Engineered as the definitive infrastructure for modern finance...',
        image: '◯',
        supply: '1000000',
      });
      setIsFetching(false);
    }, 1200);
  };

  const handleCAChange = (value: string) => {
    setTokenCA(value);
    if (value.length > 30) {
      handleFetchToken(value);
    }
  };

  const handleLaunch = async () => {
    if (!selectedWallet || !tokenData) return;
    
    setIsLaunching(true);
    setTimeout(() => {
      addToken({
        id: Math.random().toString(),
        ca: tokenCA,
        name: tokenData.name,
        symbol: tokenData.symbol,
        launchPrice: 0.0001,
        currentPrice: 0.0001,
        bought: 0,
        sold: 0,
        profit: 0,
        launchedAt: Date.now(),
      });
      setIsLaunching(false);
      alert('Token launched!');
      onClose();
    }, 1500);
  };

  if (!tokenData || tokenCA.length < 20) {
    return (
      <>
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50" onClick={onClose} />
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
          <div className="bg-black/80 backdrop-blur-2xl border-2 border-red-500/30 rounded-3xl max-w-2xl w-full pointer-events-auto shadow-2xl p-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <img src="/vamp-fangs-silver.png" alt="VAMP" className="w-10 h-10" />
                <h2 className="text-3xl font-mono font-bold text-red-500">VAMP</h2>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-red-500/10"><X className="w-6 h-6" /></Button>
            </div>
            <div className="space-y-4">
              <div>
                <Label className="text-lg font-semibold text-white/90">Contract Address</Label>
                <Input value={tokenCA} onChange={(e) => handleCAChange(e.target.value)} placeholder="Paste token CA..." className="bg-white/10 border-white/20 text-white h-11 mt-2" />
              </div>
              {isFetching && (<div className="flex items-center justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-red-500" /></div>)}
            </div>
          </div>
        </div>
      </>
    );
  }

  if (isEditing) {
    return (
      <>
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50" onClick={onClose} />
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
          <div className="bg-black/80 backdrop-blur-2xl border-2 border-red-500/30 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto pointer-events-auto shadow-2xl p-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-mono font-bold text-red-500">EDIT TOKEN</h2>
              <Button variant="ghost" size="icon" onClick={() => setIsEditing(false)}><X className="w-6 h-6" /></Button>
            </div>
            <div className="space-y-4">
              <div><Label>Token Name</Label><Input value={tokenData.name} onChange={(e) => setTokenData({...tokenData, name: e.target.value})} className="bg-white/10 border-white/20 h-10 mt-1" /></div>
              <div><Label>Symbol</Label><Input value={tokenData.symbol} onChange={(e) => setTokenData({...tokenData, symbol: e.target.value})} className="bg-white/10 border-white/20 h-10 mt-1" /></div>
              <div><Label>Description</Label><textarea value={tokenData.description} onChange={(e) => setTokenData({...tokenData, description: e.target.value})} className="w-full bg-white/10 border border-white/20 rounded p-2 text-white h-24" /></div>
              <div><Label>Supply</Label><Input value={tokenData.supply} onChange={(e) => setTokenData({...tokenData, supply: e.target.value})} className="bg-white/10 border-white/20 h-10 mt-1" /></div>
              <Button onClick={() => setIsEditing(false)} className="w-full bg-red-500 hover:bg-red-500/80 text-white font-bold h-11 mt-6">Done Editing</Button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-black/80 backdrop-blur-2xl border-2 border-red-500/30 rounded-3xl max-w-2xl w-full pointer-events-auto shadow-2xl p-8" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <img src="/vamp-fangs-silver.png" alt="VAMP" className="w-10 h-10" />
              <h2 className="text-3xl font-mono font-bold text-red-500">VAMP</h2>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-red-500/10"><X className="w-6 h-6" /></Button>
          </div>
          <div className="space-y-6">
            <div><Label className="text-white/80">Contract Address</Label><Input value={tokenCA} disabled className="bg-white/10 border-white/20 text-white/60 h-11 mt-2" /></div>
            {tokenData && (<div className="p-6 rounded-xl border border-red-500/30 bg-red-500/10"><div className="flex items-start gap-4 mb-4"><div className="text-4xl">{tokenData.image}</div><div><h3 className="text-2xl font-bold text-white">{tokenData.symbol}</h3><p className="text-white/70">{tokenData.name}</p></div></div><p className="text-white/60 text-sm line-clamp-3">{tokenData.description}</p></div>)}
            <div className="space-y-3"><Label className="text-lg font-semibold text-white/90">Select Dev Wallet ({devWallets.length})</Label>{devWallets.length === 0 ? (<div className="p-4 rounded-lg border border-dashed border-white/20 text-white/50 text-center">No dev wallets</div>) : (<div className="space-y-2">{devWallets.map((wallet) => (<button key={wallet.id} onClick={() => setSelectedWallet(wallet.id)} className={cn('w-full flex items-center justify-between p-3 rounded-lg transition-all', selectedWallet === wallet.id ? 'border-2 border-red-500 bg-red-500/10' : 'border border-white/10 hover:border-white/30')}><div className="text-left"><div className="font-bold text-white">{wallet.name}</div><div className="text-sm text-white/50 font-mono">{wallet.address}</div></div>{selectedWallet === wallet.id && <Check className="w-5 h-5 text-red-500" />}</button>))}</div>)}</div>
            <div className="flex gap-3"><Button onClick={() => setIsEditing(true)} variant="outline" className="flex-1 border-white/20 h-11"><Edit2 className="w-4 h-4 mr-2" />EDIT</Button><Button onClick={handleLaunch} disabled={!selectedWallet || isLaunching} className="flex-1 bg-red-500 hover:bg-red-500/80 text-white font-bold h-11">{isLaunching ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Launching...</>) : ('⚡ FAST LAUNCH')}</Button></div>\n          </div>\n        </div>\n      </div>\n    </>\n  );\n}
