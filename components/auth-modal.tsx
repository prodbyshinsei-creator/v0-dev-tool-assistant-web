'use client';

import { useState } from 'react';
import { X, Eye, EyeOff, Loader2, Mail, Lock, AlertCircle, CheckCircle, Wallet } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { loginUser, registerUser, loginOrRegisterWithWallet } from '@/lib/auth';

interface AuthModalProps {
  mode: 'login' | 'register';
  onSuccess: () => void;
  onSwitchMode: (m: 'login' | 'register') => void;
  onClose: () => void;
}

function generateCaptcha() {
  const a = Math.floor(Math.random() * 9) + 1;
  const b = Math.floor(Math.random() * 9) + 1;
  return { question: `${a} + ${b}`, answer: String(a + b) };
}

const ADAPTER_WALLETS = [
  { name: 'Phantom',  icon: '/phantom-icon.png',  fallback: '👻' },
  { name: 'Solflare', icon: '/solflare-icon.png',  fallback: '☀️' },
];

export function AuthModal({ mode, onSuccess, onSwitchMode, onClose }: AuthModalProps) {
  // step: 'choose' → pick wallet or email | 'email' → email form
  const [step, setStep]               = useState<'choose' | 'email'>('choose');
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [confirm, setConfirm]         = useState('');
  const [showPwd, setShowPwd]         = useState(false);
  const [captcha]                     = useState(generateCaptcha);
  const [captchaInput, setCaptchaInput] = useState('');
  const [isLoading, setIsLoading]     = useState(false);
  const [connectingWallet, setConnectingWallet] = useState('');
  const [error, setError]             = useState('');
  const [success, setSuccess]         = useState('');

  const { select, wallets: adapterWallets, connect, publicKey, connected, wallet: activeWallet } = useWallet();

  const isLogin = mode === 'login';

  // ── Connect wallet adapter ────────────────────────────────────────────────
  const handleWalletConnect = async (walletName: string) => {
    setError(''); setConnectingWallet(walletName);
    try {
      const found = adapterWallets.find(w => w.adapter.name === walletName);
      if (!found) {
        setError(`${walletName} extension not found. Please install it first.`);
        setConnectingWallet('');
        return;
      }
      select(found.adapter.name as any);
      await found.adapter.connect();
      const address = found.adapter.publicKey?.toBase58();
      if (!address) throw new Error('No public key returned');
      loginOrRegisterWithWallet(address, walletName);
      setSuccess(`${walletName} connected!`);
      setTimeout(onSuccess, 600);
    } catch (e: any) {
      if (!e.message?.includes('User rejected')) setError(e.message || 'Connection failed');
    } finally { setConnectingWallet(''); }
  };

  // ── Email form submit ─────────────────────────────────────────────────────
  const handleEmailSubmit = async () => {
    if (!email.includes('@')) { setError('Invalid email'); return; }
    if (password.length < 8)  { setError('Password must be at least 8 characters'); return; }
    if (!isLogin && password !== confirm) { setError('Passwords do not match'); return; }
    if (!isLogin && captchaInput !== captcha.answer) { setError('Wrong captcha'); return; }
    setIsLoading(true); setError('');
    const result = isLogin ? await loginUser(email, password) : await registerUser(email, password);
    setIsLoading(false);
    if (!result.ok) { setError(result.error || 'Error'); return; }
    setSuccess(isLogin ? 'Welcome back!' : 'Account created!');
    setTimeout(onSuccess, 700);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100]" onClick={onClose} />
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pointer-events-none">
        <div
          className={cn('bg-black border-2 rounded-3xl max-w-md w-full pointer-events-auto shadow-2xl transition-all',
            isLogin ? 'border-red-500/30' : 'border-green-400/30'
          )}
          onClick={e => e.stopPropagation()}
        >
          <div className="p-8">

            {/* Header */}
            <div className="flex items-center justify-between mb-7">
              <div>
                <h2 className={cn('text-3xl font-black', isLogin ? 'text-red-500' : 'text-green-400')}>
                  {isLogin ? 'Login' : 'Register'}
                </h2>
                <p className="text-white/40 text-sm mt-1">
                  {step === 'choose'
                    ? isLogin ? 'Choose how to login' : 'Choose how to register'
                    : isLogin ? 'Login with email' : 'Create email account'}
                </p>
              </div>
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 text-white/40 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error / Success */}
            {error && (
              <div className="mb-5 flex items-center gap-2 px-4 py-3 bg-red-500/15 border border-red-500/30 rounded-xl text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
              </div>
            )}
            {success && (
              <div className="mb-5 flex items-center gap-2 px-4 py-3 bg-green-400/15 border border-green-400/30 rounded-xl text-green-400 text-sm">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />{success}
              </div>
            )}

            {/* ── STEP: CHOOSE ── */}
            {step === 'choose' && (
              <div className="space-y-3">

                {/* Wallet options */}
                <p className="text-xs text-white/30 uppercase tracking-wider font-bold mb-2">Connect Wallet</p>
                {ADAPTER_WALLETS.map(aw => (
                  <button
                    key={aw.name}
                    onClick={() => handleWalletConnect(aw.name)}
                    disabled={!!connectingWallet || !!success}
                    className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl border border-white/15 bg-white/5 hover:border-white/30 hover:bg-white/8 transition-all group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0 text-xl">
                      {aw.fallback}
                    </div>
                    <div className="text-left flex-1">
                      <div className="text-white font-bold">{aw.name}</div>
                      <div className="text-white/40 text-xs">No password needed</div>
                    </div>
                    {connectingWallet === aw.name
                      ? <Loader2 className="w-5 h-5 text-white/40 animate-spin" />
                      : <span className="text-white/20 group-hover:text-white/60 text-lg">→</span>}
                  </button>
                ))}

                {/* Divider */}
                <div className="flex items-center gap-3 py-2">
                  <div className="flex-1 h-px bg-white/10" />
                  <span className="text-white/30 text-xs">or</span>
                  <div className="flex-1 h-px bg-white/10" />
                </div>

                {/* Email option */}
                <button
                  onClick={() => { setStep('email'); setError(''); }}
                  className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl border border-white/10 bg-white/3 hover:border-white/25 hover:bg-white/6 transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-white/8 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 text-white/60" />
                  </div>
                  <div className="text-left flex-1">
                    <div className="text-white font-bold">Email & Password</div>
                    <div className="text-white/40 text-xs">Classic registration</div>
                  </div>
                  <span className="text-white/20 group-hover:text-white/60 text-lg">→</span>
                </button>

                {/* Switch login/register */}
                <p className="text-center text-sm text-white/40 pt-2">
                  {isLogin ? "Don't have an account? " : 'Already have an account? '}
                  <button onClick={() => { setError(''); onSwitchMode(isLogin ? 'register' : 'login'); }}
                    className={cn('font-bold hover:underline', isLogin ? 'text-red-400' : 'text-green-400')}>
                    {isLogin ? 'Register' : 'Login'}
                  </button>
                </p>
              </div>
            )}

            {/* ── STEP: EMAIL FORM ── */}
            {step === 'email' && (
              <div className="space-y-4">
                <button onClick={() => { setStep('choose'); setError(''); }}
                  className="flex items-center gap-1 text-white/40 hover:text-white text-sm transition-colors mb-1">
                  ← Back
                </button>

                <div>
                  <Label className="text-sm font-semibold text-white/70 mb-1.5 block">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <Input type="email" value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="bg-white/5 border-white/15 text-white h-11 pl-10 focus:border-white/30" />
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-semibold text-white/70 mb-1.5 block">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <Input type={showPwd ? 'text' : 'password'} value={password}
                      onChange={e => setPassword(e.target.value)} placeholder="8+ characters"
                      className="bg-white/5 border-white/15 text-white h-11 pl-10 pr-10 focus:border-white/30" />
                    <button type="button" onClick={() => setShowPwd(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                      {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {!isLogin && (
                  <>
                    <div>
                      <Label className="text-sm font-semibold text-white/70 mb-1.5 block">Confirm Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                        <Input type={showPwd ? 'text' : 'password'} value={confirm}
                          onChange={e => setConfirm(e.target.value)} placeholder="Repeat password"
                          className="bg-white/5 border-white/15 text-white h-11 pl-10 focus:border-white/30" />
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-white/70 mb-1.5 block">
                        Captcha: What is <span className="text-white font-mono">{captcha.question}</span>?
                      </Label>
                      <Input type="text" value={captchaInput} onChange={e => setCaptchaInput(e.target.value)}
                        placeholder="Answer" className="bg-white/5 border-white/15 text-white h-11 font-mono w-32 focus:border-green-400/50" />
                    </div>
                  </>
                )}

                <Button onClick={handleEmailSubmit} disabled={isLoading || !!success}
                  className={cn('w-full font-bold h-12 text-base mt-1',
                    isLogin ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-green-400 hover:bg-green-500 text-black')}>
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : isLogin ? 'Login' : 'Create Account'}
                </Button>

                <p className="text-center text-sm text-white/40">
                  {isLogin ? "Don't have an account? " : 'Already have an account? '}
                  <button onClick={() => { setError(''); onSwitchMode(isLogin ? 'register' : 'login'); setStep('choose'); }}
                    className={cn('font-bold hover:underline', isLogin ? 'text-red-400' : 'text-green-400')}>
                    {isLogin ? 'Register' : 'Login'}
                  </button>
                </p>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}
