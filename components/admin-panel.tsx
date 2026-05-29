'use client';

import { useState, useEffect } from 'react';
import { X, Users, Shield, Trash2, Crown, RefreshCw, AlertCircle, Ban, CheckCircle, Plus, Upload, Database, Eye, EyeOff, Copy } from 'lucide-react';
import { getAllUsers, deleteUserById, banUser, unbanUser, ADMIN_EMAILS, getPageViews } from '@/lib/auth';
import { getPumpCAStats, addPumpCAFromText, getAllPumpCAs, deletePumpCA, PumpCAEntry } from '@/lib/pump-ca';
import { cn } from '@/lib/utils';

interface AdminPanelProps { onClose: () => void; }

export function AdminPanel({ onClose }: AdminPanelProps) {
  const [tab, setTab]               = useState<'overview'|'users'|'pumpca'>('overview');
  const [users, setUsers]           = useState<ReturnType<typeof getAllUsers>>([]);
  const [pumpStats, setPumpStats]   = useState(getPumpCAStats());
  const [pumpEntries, setPumpEntries] = useState<PumpCAEntry[]>([]);
  const [confirmAction, setConfirmAction] = useState<{type:'delete'|'ban'; id:string; email:string}|null>(null);
  const [banReason, setBanReason]   = useState('');
  const [addText, setAddText]       = useState('');
  const [addResult, setAddResult]   = useState<{added:number;skipped:number;errors:string[]}|null>(null);
  const [isAdding, setIsAdding]     = useState(false);
  const [showPrivKeys, setShowPrivKeys] = useState(false);

  const reload = () => {
    setUsers(getAllUsers());
    setPumpStats(getPumpCAStats());
    setPumpEntries(getAllPumpCAs());
  };

  useEffect(() => { reload(); }, []);

  const pageViews = getPageViews();

  const portfolioCount = (() => { try { return JSON.parse(localStorage.getItem('vamp_portfolio')||'[]').length; } catch { return 0; } })();
  const sessionCount   = (() => { try { return JSON.parse(localStorage.getItem('vamp_volume_sessions')||'[]').length; } catch { return 0; } })();
  const walletCount    = (() => { try { return JSON.parse(localStorage.getItem('vamp_wallets')||'[]').length; } catch { return 0; } })();

  const handleBan = (id: string, email: string, reason: string) => {
    banUser(id, reason);
    setConfirmAction(null); setBanReason('');
    reload();
  };
  const handleUnban = (id: string) => { unbanUser(id); reload(); };
  const handleDelete = (id: string) => { deleteUserById(id); setConfirmAction(null); reload(); };

  const handleAddCAs = async () => {
    if (!addText.trim()) return;
    setIsAdding(true);
    const result = addPumpCAFromText(addText);
    setAddResult(result);
    setAddText('');
    reload();
    setIsAdding(false);
  };

  const TABS = [
    { id:'overview', label:'Overview'             },
    { id:'users',    label:`Users (${users.length})` },
    { id:'pumpca',   label:`Pump CA (${pumpStats.available} left)` },
  ] as const;

  return (
    <>
      <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[200]" onClick={onClose} />
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-[#0a0a0a] border border-yellow-400/30 rounded-3xl max-w-4xl w-full max-h-[88vh] flex flex-col pointer-events-auto shadow-2xl"
          onClick={e => e.stopPropagation()}>

          {/* Header */}
          <div className="flex items-center justify-between px-7 py-5 border-b border-white/8 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-yellow-400/15 border border-yellow-400/30 flex items-center justify-center">
                <Shield className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-yellow-400">Admin Panel</h2>
                <p className="text-xs text-white/30 font-mono">prod.by.shinsei@gmail.com</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={reload} className="p-2 rounded-xl hover:bg-white/10 text-white/40 hover:text-white transition-colors" title="Refresh">
                <RefreshCw className="w-4 h-4" />
              </button>
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 text-white/40 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-white/8 px-7 flex-shrink-0">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id as any)}
                className={cn('py-3 px-5 text-sm font-bold transition-all border-b-2 -mb-px',
                  tab===t.id ? 'border-yellow-400 text-yellow-400' : 'border-transparent text-white/40 hover:text-white/70')}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-7">

            {/* ── OVERVIEW ── */}
            {tab==='overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label:'Page Views',       val: pageViews,          color:'text-yellow-400', icon:'👁' },
                    { label:'Registered Users', val: users.length,       color:'text-white',      icon:'👥' },
                    { label:'Banned Users',     val: users.filter(u=>u.banned).length, color:'text-red-400', icon:'🚫' },
                    { label:'Pump CAs left',    val: pumpStats.available, color:'text-green-400', icon:'💎' },
                    { label:'Pump CAs used',    val: pumpStats.used,      color:'text-white/50',  icon:'✅' },
                    { label:'Wallets stored',   val: walletCount,         color:'text-blue-400',  icon:'🔐' },
                    { label:'Active Sessions',  val: sessionCount,        color:'text-blue-400',  icon:'⚡' },
                    { label:'Tokens launched',  val: portfolioCount,      color:'text-red-400',   icon:'🚀' },
                  ].map(s => (
                    <div key={s.label} className="p-4 rounded-2xl bg-white/4 border border-white/8">
                      <div className="text-lg mb-1">{s.icon}</div>
                      <div className={cn('text-3xl font-black', s.color)}>{s.val}</div>
                      <div className="text-white/40 text-xs mt-1">{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Security summary */}
                <div className="p-5 rounded-2xl bg-yellow-400/5 border border-yellow-400/20">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div className="space-y-1.5">
                      <p className="text-yellow-400 font-bold text-sm">Security Status</p>
                      <ul className="text-xs text-white/50 space-y-1">
                        <li>✅ Passwords hashed with SHA-256 (Phase 2: bcrypt on backend)</li>
                        <li>✅ Pump CA private keys stored in localStorage (visible only to owner of browser)</li>
                        <li>⚠️ Private keys NOT encrypted at rest — stored plaintext in localStorage</li>
                        <li>⚠️ localStorage is browser-scoped — only accessible on this device</li>
                        <li>⚠️ No rate limiting yet — Phase 2 will add</li>
                        <li>ℹ️ All data is local-only until Phase 2 backend</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── USERS ── */}
            {tab==='users' && (
              <div className="space-y-2">
                {users.length === 0 ? (
                  <div className="p-12 text-center text-white/30 border border-dashed border-white/10 rounded-2xl">No users yet</div>
                ) : users.map(u => (
                  <div key={u.id}
                    className={cn('flex items-center gap-4 p-4 rounded-xl border transition-all',
                      u.banned ? 'border-red-500/20 bg-red-500/5' :
                      u.isAdmin ? 'border-yellow-400/20 bg-yellow-400/5' :
                      'border-white/8 bg-white/3')}>
                    {/* Avatar */}
                    <div className={cn('w-10 h-10 rounded-full border flex items-center justify-center flex-shrink-0 text-lg',
                      u.isAdmin ? 'bg-yellow-400/15 border-yellow-400/30' :
                      u.banned  ? 'bg-red-500/15 border-red-500/30' :
                      'bg-white/5 border-white/15')}>
                      {u.isAdmin ? <Crown className="w-5 h-5 text-yellow-400" /> :
                       u.banned  ? '🚫' :
                       <span className="text-sm font-bold text-white/50">{(u.email||'?')[0].toUpperCase()}</span>}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-white text-sm truncate max-w-[240px]">{u.email}</span>
                        {u.isAdmin && <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-400/20 text-yellow-400 font-bold">ADMIN</span>}
                        {u.banned  && <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 font-bold">BANNED</span>}
                        {u.walletAddress && <span className="text-xs px-2 py-0.5 rounded-full bg-purple-400/20 text-purple-400">WALLET</span>}
                      </div>
                      <div className="text-xs text-white/30 mt-0.5 font-mono">
                        Joined {new Date(u.createdAt).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})}
                        {u.lastLogin && ` · Last login ${new Date(u.lastLogin).toLocaleDateString('en-GB',{day:'2-digit',month:'short'})}`}
                      </div>
                      {u.banned && u.bannedReason && (
                        <div className="text-xs text-red-400/70 mt-0.5">Reason: {u.bannedReason}</div>
                      )}
                    </div>

                    {/* Actions */}
                    {!u.isAdmin && (
                      <div className="flex gap-2 flex-shrink-0">
                        {u.banned ? (
                          <button onClick={() => handleUnban(u.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-400/10 hover:bg-green-400/20 text-green-400 text-xs font-bold transition-colors">
                            <CheckCircle className="w-3.5 h-3.5" /> Unban
                          </button>
                        ) : (
                          <button onClick={() => setConfirmAction({type:'ban', id:u.id, email:u.email})}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 text-xs font-bold transition-colors">
                            <Ban className="w-3.5 h-3.5" /> Ban
                          </button>
                        )}
                        <button onClick={() => setConfirmAction({type:'delete', id:u.id, email:u.email})}
                          className="p-1.5 rounded-lg hover:bg-red-500/15 text-white/20 hover:text-red-400 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* ── PUMP CA ── */}
            {tab==='pumpca' && (
              <div className="space-y-5">
                {/* Stats row */}
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label:'Available', val: pumpStats.available, color:'text-green-400' },
                    { label:'Used',      val: pumpStats.used,      color:'text-white/50'  },
                    { label:'Total',     val: pumpStats.total,     color:'text-white'     },
                  ].map(s => (
                    <div key={s.label} className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
                      <div className={cn('text-4xl font-black', s.color)}>{s.val}</div>
                      <div className="text-white/40 text-sm mt-1">{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Add new CAs */}
                <div className="p-5 rounded-2xl border border-white/10 bg-white/3 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-white">Add Pump CAs</p>
                    <span className="text-xs text-white/30">Format per line: <code className="text-white/50">address,privateKey</code> or <code className="text-white/50">address:privateKey</code></span>
                  </div>
                  <textarea
                    value={addText}
                    onChange={e => setAddText(e.target.value)}
                    placeholder={"HUk5Vz8ZpVkfnHbGM7wAFnj7KTepmSZSUbxQZD2cpump,5JxKzR...\nABC123...pump,4YqMnP...\n..."}
                    rows={5}
                    className="w-full bg-black/40 border border-white/15 text-white rounded-xl p-3 text-xs font-mono resize-none focus:outline-none focus:border-yellow-400/50 placeholder:text-white/20"
                  />
                  <div className="flex items-center gap-3">
                    <button onClick={handleAddCAs} disabled={!addText.trim() || isAdding}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black font-bold text-sm transition-all disabled:opacity-50">
                      <Plus className="w-4 h-4" />
                      {isAdding ? 'Adding…' : 'Add CAs'}
                    </button>
                    <p className="text-xs text-white/30">CAs with "pump" suffix only · Duplicates skipped automatically</p>
                  </div>
                  {addResult && (
                    <div className={cn('p-3 rounded-xl text-sm', addResult.added > 0 ? 'bg-green-400/10 border border-green-400/20 text-green-400' : 'bg-white/5 border border-white/10 text-white/50')}>
                      ✅ Added {addResult.added} · Skipped {addResult.skipped}
                      {addResult.errors.length > 0 && (
                        <div className="mt-1 text-yellow-400 text-xs">{addResult.errors.slice(0,3).join(' · ')}</div>
                      )}
                    </div>
                  )}
                </div>

                {/* CA list */}
                {pumpEntries.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-bold text-white/60">All CAs ({pumpEntries.length})</p>
                      <button onClick={() => setShowPrivKeys(v => !v)}
                        className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white transition-colors">
                        {showPrivKeys ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        {showPrivKeys ? 'Hide' : 'Show'} keys
                      </button>
                    </div>
                    <div className="space-y-1.5 max-h-64 overflow-y-auto">
                      {pumpEntries.map(e => (
                        <div key={e.id}
                          className={cn('flex items-center gap-3 px-3 py-2 rounded-lg border text-xs font-mono',
                            e.usedAt ? 'border-white/5 bg-white/2 opacity-40' : 'border-white/10 bg-white/4')}>
                          <div className={cn('w-2 h-2 rounded-full flex-shrink-0', e.usedAt ? 'bg-white/20' : 'bg-green-400')} />
                          <div className="flex-1 min-w-0">
                            <div className="text-white/70 truncate">{e.address}</div>
                            {showPrivKeys && (
                              <div className="text-white/30 truncate">{e.privateKey}</div>
                            )}
                          </div>
                          <span className={cn('text-xs px-1.5 py-0.5 rounded flex-shrink-0',
                            e.usedAt ? 'bg-white/5 text-white/30' : 'bg-green-400/15 text-green-400')}>
                            {e.usedAt ? 'used' : 'free'}
                          </span>
                          {!e.usedAt && (
                            <button onClick={() => { deletePumpCA(e.id); reload(); }}
                              className="text-white/20 hover:text-red-400 transition-colors flex-shrink-0">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirm modal */}
      {confirmAction && (
        <>
          <div className="fixed inset-0 bg-black/80 z-[300]" onClick={() => setConfirmAction(null)} />
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 pointer-events-none">
            <div className="bg-black border border-white/20 rounded-2xl max-w-sm w-full pointer-events-auto p-6 shadow-2xl"
              onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-black text-white mb-2">
                {confirmAction.type === 'ban' ? '🚫 Ban User' : '🗑 Delete User'}
              </h3>
              <p className="text-white/60 text-sm mb-4 font-mono">{confirmAction.email}</p>
              {confirmAction.type === 'ban' && (
                <input value={banReason} onChange={e => setBanReason(e.target.value)}
                  placeholder="Reason (optional)"
                  className="w-full bg-white/5 border border-white/15 text-white rounded-xl px-3 h-9 text-sm mb-4 focus:outline-none" />
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => confirmAction.type === 'ban'
                    ? handleBan(confirmAction.id, confirmAction.email, banReason)
                    : handleDelete(confirmAction.id)}
                  className={cn('flex-1 py-2.5 rounded-xl font-bold text-sm transition-all',
                    confirmAction.type === 'ban'
                      ? 'bg-orange-500 hover:bg-orange-400 text-white'
                      : 'bg-red-500 hover:bg-red-400 text-white')}>
                  {confirmAction.type === 'ban' ? 'Ban' : 'Delete'}
                </button>
                <button onClick={() => setConfirmAction(null)}
                  className="flex-1 py-2.5 rounded-xl border border-white/15 text-white/60 hover:text-white text-sm transition-all">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
