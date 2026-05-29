'use client';

import { useState } from 'react';
import { X, Eye, EyeOff, Loader2, Mail, Lock, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { loginUser, registerUser } from '@/lib/auth';

interface AuthModalsProps {
  mode: 'login' | 'register';
  onSuccess: () => void;
  onSwitchMode: (m: 'login' | 'register') => void;
  onClose: () => void;
}

// Simple math captcha — no external service needed
function generateCaptcha() {
  const a = Math.floor(Math.random() * 9) + 1;
  const b = Math.floor(Math.random() * 9) + 1;
  return { question: `${a} + ${b}`, answer: String(a + b) };
}

export function AuthModal({ mode, onSuccess, onSwitchMode, onClose }: AuthModalsProps) {
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [confirm, setConfirm]         = useState('');
  const [showPwd, setShowPwd]         = useState(false);
  const [captcha]                     = useState(generateCaptcha);
  const [captchaInput, setCaptchaInput] = useState('');
  const [isLoading, setIsLoading]     = useState(false);
  const [error, setError]             = useState('');
  const [success, setSuccess]         = useState('');

  const isLogin = mode === 'login';

  const validate = () => {
    if (!email.includes('@')) return 'Invalid email';
    if (password.length < 8)  return 'Password must be at least 8 characters';
    if (!isLogin && password !== confirm) return 'Passwords do not match';
    if (!isLogin && captchaInput !== captcha.answer) return 'Wrong captcha answer';
    return null;
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setIsLoading(true); setError('');
    const result = isLogin
      ? await loginUser(email, password)
      : await registerUser(email, password);
    setIsLoading(false);
    if (!result.ok) { setError(result.error || 'Error'); return; }
    setSuccess(isLogin ? 'Welcome back!' : 'Account created!');
    setTimeout(onSuccess, 800);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100]" onClick={onClose} />
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pointer-events-none">
        <div
          className={cn(
            'bg-black border-2 rounded-3xl max-w-md w-full pointer-events-auto shadow-2xl',
            isLogin ? 'border-red-500/30' : 'border-green-400/30'
          )}
          onClick={e => e.stopPropagation()}
        >
          <div className="p-8">

            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className={cn('text-3xl font-black', isLogin ? 'text-red-500' : 'text-green-400')}>
                  {isLogin ? 'Login' : 'Register'}
                </h2>
                <p className="text-white/40 text-sm mt-1">
                  {isLogin ? 'Welcome back' : 'Create your account'}
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

            <div className="space-y-4">
              {/* Email */}
              <div>
                <Label className="text-sm font-semibold text-white/70 mb-1.5 block">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <Input
                    type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="bg-white/5 border-white/15 text-white h-11 pl-10 focus:border-white/30"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <Label className="text-sm font-semibold text-white/70 mb-1.5 block">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <Input
                    type={showPwd ? 'text' : 'password'} value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="8+ characters"
                    className="bg-white/5 border-white/15 text-white h-11 pl-10 pr-10 focus:border-white/30"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                  >
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm password (register only) */}
              {!isLogin && (
                <div>
                  <Label className="text-sm font-semibold text-white/70 mb-1.5 block">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <Input
                      type={showPwd ? 'text' : 'password'} value={confirm}
                      onChange={e => setConfirm(e.target.value)}
                      placeholder="Repeat password"
                      className="bg-white/5 border-white/15 text-white h-11 pl-10 focus:border-white/30"
                    />
                  </div>
                </div>
              )}

              {/* Captcha (register only) */}
              {!isLogin && (
                <div>
                  <Label className="text-sm font-semibold text-white/70 mb-1.5 block">
                    Captcha: What is <span className="text-white font-mono">{captcha.question}</span>?
                  </Label>
                  <Input
                    type="text" value={captchaInput}
                    onChange={e => setCaptchaInput(e.target.value)}
                    placeholder="Answer"
                    className="bg-white/5 border-white/15 text-white h-11 font-mono w-32 focus:border-green-400/50"
                  />
                </div>
              )}

              {/* Submit */}
              <Button
                onClick={handleSubmit}
                disabled={isLoading || !!success}
                className={cn(
                  'w-full font-bold h-12 mt-2 text-base',
                  isLogin
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-green-400 hover:bg-green-500 text-black'
                )}
              >
                {isLoading
                  ? <Loader2 className="w-5 h-5 animate-spin" />
                  : isLogin ? 'Login' : 'Create Account'
                }
              </Button>

              {/* Switch */}
              <p className="text-center text-sm text-white/40 pt-1">
                {isLogin ? "Don't have an account? " : 'Already have an account? '}
                <button
                  onClick={() => { setError(''); onSwitchMode(isLogin ? 'register' : 'login'); }}
                  className={cn('font-bold hover:underline', isLogin ? 'text-red-400' : 'text-green-400')}
                >
                  {isLogin ? 'Register' : 'Login'}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
