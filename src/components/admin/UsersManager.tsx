import { useState, useEffect, useCallback } from 'react';
import { Users, Search, Ban, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/shared/lib/supabase/client';

interface UserProfile {
  id: string;
  login: string | null;
  ton_address: string | null;
  is_premium: boolean;
  role: string;
  created_at: string;
  email?: string;
}

interface BanRecord {
  id: string;
  user_id: string;
  reason: string;
  expires_at: string | null;
  is_active: boolean;
}

export default function UsersManager({ onRefresh }: { onRefresh?: () => void }) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [bans, setBans] = useState<BanRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [banModal, setBanModal] = useState<{ userId: string; userName: string } | null>(null);
  const [banReason, setBanReason] = useState('');
  const [banExpiry, setBanExpiry] = useState('');

  const PAGE_SIZE = 20;

  const fetchData = useCallback(async () => {
    setLoading(true);
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabase.from('profiles').select('*', { count: 'exact' });

    if (filter === 'premium') query = query.eq('is_premium', true);
    else if (filter === 'free') query = query.eq('is_premium', false);
    else if (filter === 'admin') query = query.eq('role', 'admin');
    else if (filter === 'banned') query = query.eq('role', 'banned');

    if (search) {
      query = query.or(`login.ilike.%${search}%,ton_address.ilike.%${search}%`);
    }

    const { data, count, error } = await query.range(from, to).order('created_at', { ascending: false });

    if (!error && data) {
      setUsers(data as UserProfile[]);
      setTotal(count || 0);
    }

    const { data: banData } = await supabase.from('user_bans').select('*').eq('is_active', true);
    if (banData) setBans(banData as BanRecord[]);

    setLoading(false);
  }, [page, search, filter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const isBanned = (userId: string) => bans.some(b => b.user_id === userId && b.is_active);

  const handleBan = async () => {
    if (!banModal || !banReason) return;
    await supabase.from('user_bans').insert({
      user_id: banModal.userId,
      reason: banReason,
      expires_at: banExpiry || null,
    });
    await supabase.from('profiles').update({ role: 'banned' }).eq('id', banModal.userId);
    setBanModal(null);
    setBanReason('');
    setBanExpiry('');
    fetchData();
    onRefresh?.();
  };

  const handleUnban = async (userId: string) => {
    await supabase.from('user_bans').update({ is_active: false }).eq('user_id', userId).eq('is_active', true);
    await supabase.from('profiles').update({ role: 'user' }).eq('id', userId);
    fetchData();
    onRefresh?.();
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
    fetchData();
  };

  const handlePremiumToggle = async (userId: string, current: boolean) => {
    await supabase.from('profiles').update({ is_premium: !current }).eq('id', userId);
    fetchData();
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-phantom-purple" />
            Пользователи
          </h2>
          <p className="text-white/40 text-sm mt-1">Всего: {total} | Активных: {total - bans.filter(b => b.is_active).length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Поиск по login или TON..."
            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-phantom-purple/50" />
        </div>
        <div className="flex gap-1">
          {[
            { id: 'all', label: 'Все' },
            { id: 'premium', label: 'Premium' },
            { id: 'free', label: 'Free' },
            { id: 'admin', label: 'Admin' },
            { id: 'banned', label: 'Banned' },
          ].map(f => (
            <button key={f.id} onClick={() => { setFilter(f.id); setPage(1); }}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                filter === f.id ? 'bg-phantom-purple/10 text-phantom-purple border border-phantom-purple/20' : 'bg-white/5 text-white/40 hover:text-white hover:bg-white/10'
              }`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left px-4 py-3 text-white/40 text-xs font-medium">Пользователь</th>
                <th className="text-left px-4 py-3 text-white/40 text-xs font-medium">TON</th>
                <th className="text-left px-4 py-3 text-white/40 text-xs font-medium">Роль</th>
                <th className="text-left px-4 py-3 text-white/40 text-xs font-medium">Подписка</th>
                <th className="text-left px-4 py-3 text-white/40 text-xs font-medium">Статус</th>
                <th className="text-left px-4 py-3 text-white/40 text-xs font-medium">Регистрация</th>
                <th className="text-right px-4 py-3 text-white/40 text-xs font-medium">Действия</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12 text-white/30">Загрузка...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-white/30">Пользователи не найдены</td></tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-phantom-purple/20 flex items-center justify-center text-phantom-purple text-xs font-bold">
                          {u.login?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="text-white text-xs font-medium">{u.login || 'N/A'}</p>
                          <p className="text-white/30 text-[10px]">{u.id.slice(0, 8)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {u.ton_address ? (
                        <p className="text-white/50 text-xs font-mono">{u.ton_address.slice(0, 12)}...</p>
                      ) : (
                        <span className="text-white/20 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <select value={u.role} onChange={e => handleRoleChange(u.id, e.target.value)}
                        className="px-2 py-1 bg-white/5 border border-white/10 rounded text-white/70 text-xs focus:outline-none">
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                        <option value="moderator">Moderator</option>
                        <option value="banned">Banned</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => handlePremiumToggle(u.id, u.is_premium)}
                        className={`px-2 py-1 rounded-full text-[10px] font-medium ${
                          u.is_premium ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-white/5 text-white/30 border border-white/10'
                        }`}>
                        {u.is_premium ? '★ Premium' : 'Free'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      {isBanned(u.id) ? (
                        <span className="flex items-center gap-1 text-red-400 text-xs"><Ban className="w-3 h-3" /> Ban</span>
                      ) : (
                        <span className="flex items-center gap-1 text-phantom-green text-xs"><CheckCircle2 className="w-3 h-3" /> Active</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-white/30 text-xs">{new Date(u.created_at).toLocaleDateString('ru-RU')}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {isBanned(u.id) ? (
                          <button onClick={() => handleUnban(u.id)}
                            className="px-2 py-1 rounded bg-phantom-green/10 text-phantom-green text-[10px] hover:bg-phantom-green/20 transition-colors">
                            Разбанить
                          </button>
                        ) : (
                          <button onClick={() => setBanModal({ userId: u.id, userName: u.login || u.id })}
                            className="px-2 py-1 rounded bg-red-500/10 text-red-400 text-[10px] hover:bg-red-500/20 transition-colors">
                            Забанить
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/10">
            <span className="text-white/30 text-xs">
              Показаны {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, total)} из {total}
            </span>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="p-1.5 rounded bg-white/5 text-white/40 hover:text-white disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                if (p > totalPages) return null;
                return (
                  <button key={p} onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded text-xs font-medium ${page === p ? 'bg-phantom-purple text-white' : 'bg-white/5 text-white/40 hover:text-white'}`}>
                    {p}
                  </button>
                );
              })}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="p-1.5 rounded bg-white/5 text-white/40 hover:text-white disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>

      {/* Ban Modal */}
      {banModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a2e] rounded-2xl p-6 w-full max-w-md border border-red-500/20">
            <h3 className="text-white font-bold text-lg mb-1">Заблокировать пользователя</h3>
            <p className="text-white/40 text-sm mb-4">{banModal.userName}</p>
            <div className="space-y-3">
              <div>
                <label className="text-white/60 text-xs mb-1 block">Причина</label>
                <input value={banReason} onChange={e => setBanReason(e.target.value)}
                  placeholder="Нарушение правил..."
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-red-400/50" />
              </div>
              <div>
                <label className="text-white/60 text-xs mb-1 block">Срок (необязательно)</label>
                <input type="datetime-local" value={banExpiry} onChange={e => setBanExpiry(e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-red-400/50" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleBan} disabled={!banReason}
                className="flex-1 py-2.5 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors disabled:opacity-50">
                Заблокировать
              </button>
              <button onClick={() => { setBanModal(null); setBanReason(''); setBanExpiry(''); }}
                className="px-6 py-2.5 bg-white/5 text-white/60 rounded-xl hover:bg-white/10 transition-colors">
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
