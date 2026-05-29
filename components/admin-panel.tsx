'use client';

import { useState, useEffect } from 'react';
import { X, Users, Shield, Trash2, Crown, RefreshCw, AlertCircle } from 'lucide-react';
import { getAllUsers, deleteUserById, ADMIN_EMAILS } from '@/lib/auth';
import { cn } from '@/lib/utils';

interface AdminPanelProps { onClose: () => void; }

export function AdminPanel({ onClose }: AdminPanelProps) {
  const [users, setUsers]         = useState<ReturnType<typeof getAllUsers>>([]);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [tab, setTab]             = useState<'users' | 'stats'>('users');

  const reload = () => setUsers(getAllUsers());

  useEffect(() => { reload(); }, []);

  const handleDelete = (id: string) => {
    deleteUserById(id);
    setConfirmDelete(null);
    reload();
  };

  // Stats from localStorage
  const portfolioCount = (() => {
    try { return JSON.parse(localStorage.getItem('vamp_portfolio') || '[]').length; } catch { return 0; }
  })();
  const sessionCount = (() => {
    try { return JSON.parse(localStorage.getItem('vamp_volume_sessions') || '[]').length; } catch { return 0; }
  })();
  const walletCount = (() => {
    try { return JSON.parse(localStorage.getItem('vamp_wallets') || '[]').length; } catch { return 0; }
  })();

  return (
    <>
      <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[200]" onClick={onClose} />
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-black border-2 border-yellow-400/40 rounded-3xl max-w-3xl w-full max-h-[85vh] overflow-hidden pointer-events-auto shadow-2xl flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-7 py-5 border-b border-white/8 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-yellow-400/15 border border-yellow-400/30 flex items-center justify-center">
                <Shield className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-yellow-400">Admin Panel</h2>
                <p className="text-xs text-white/30">prod.by.shinsei@gmail.com</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 text-white/40 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 px-7 py-4 border-b border-white/8 flex-shrink-0">
            {(['users', 'stats'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={cn('px-5 py-2 rounded-xl font-bold text-sm transition-all',
                  tab === t ? 'bg-yellow-400 text-black' : 'bg-white/5 border border-white/15 text-white/60 hover:border-white/30')}>
                {t === 'users' ? `Users (${users.length})` : 'Stats'}
              </button>
            ))}
            <button onClick={reload} className="ml-auto p-2 rounded-xl hover:bg-white/10 text-white/40 hover:text-white transition-colors" title="Refresh">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-7 py-5">

            {/* USERS TAB */}
            {tab === 'users' && (
              <div className="space-y-2">
                {users.length === 0 ? (
                  <div className="p-10 text-center text-white/30 border border-dashed border-white/10 rounded-2xl">
                    No registered users yet
                  </div>
                ) : users.map(u => (
                  <div key={u.id}
                    className={cn(
                      'flex items-center gap-4 p-4 rounded-xl border transition-all',
                      u.isAdmin ? 'border-yellow-400/20 bg-yellow-400/5' : 'border-white/10 bg-white/3'
                    )}>
                    {/* Avatar */}
                    <div className={cn(
                      'w-10 h-10 rounded-full border flex items-center justify-center flex-shrink-0',
                      u.isAdmin ? 'bg-yellow-400/15 border-yellow-400/30' : 'bg-white/5 border-white/15'
                    )}>
                      {u.isAdmin
                        ? <Crown className="w-5 h-5 text-yellow-400" />
                        : <span className="text-sm font-bold text-white/50">{u.email[0].toUpperCase()}</span>}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-white text-sm truncate">{u.email}</span>
                        {u.isAdmin && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-400/20 text-yellow-400 font-bold flex-shrink-0">
                            ADMIN
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-white/30 mt-0.5 font-mono">
                        Registered: {new Date(u.createdAt).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })}
                      </div>
                    </div>

                    {/* Delete (not for admin) */}
                    {!u.isAdmin && (
                      confirmDelete === u.id ? (
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-xs text-red-400">Sure?</span>
                          <button onClick={() => handleDelete(u.id)}
                            className="px-3 py-1 rounded-lg bg-red-500 text-white text-xs font-bold hover:bg-red-400 transition-colors">
                            Delete
                          </button>
                          <button onClick={() => setConfirmDelete(null)}
                            className="px-3 py-1 rounded-lg bg-white/10 text-white/60 text-xs hover:bg-white/15 transition-colors">
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => setConfirmDelete(u.id)}
                          className="p-2 rounded-lg hover:bg-red-500/15 text-white/20 hover:text-red-400 transition-colors flex-shrink-0">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* STATS TAB */}
            {tab === 'stats' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Total Users',       value: users.length,    color: 'text-yellow-400' },
                    { label: 'Tokens in Portfolio', value: portfolioCount, color: 'text-red-400'    },
                    { label: 'Wallets Stored',    value: walletCount,     color: 'text-green-400'  },
                    { label: 'Volume Sessions',   value: sessionCount,    color: 'text-blue-400'   },
                  ].map(s => (
                    <div key={s.label} className="p-5 rounded-2xl bg-white/5 border border-white/10">
                      <p className="text-white/40 text-xs mb-2">{s.label}</p>
                      <p className={cn('text-4xl font-black', s.color)}>{s.value}</p>
                    </div>
                  ))}
                </div>

                <div className="p-4 rounded-2xl bg-yellow-400/5 border border-yellow-400/20">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-yellow-400 font-bold text-sm mb-1">Note: Local data only</p>
                      <p className="text-white/40 text-xs leading-relaxed">
                        Stats are read from this browser's localStorage. Phase 2 will add a real backend database with cross-device sync, real user count, and full analytics.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
