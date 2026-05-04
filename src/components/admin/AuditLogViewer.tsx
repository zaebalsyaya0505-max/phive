import { useState, useEffect, useCallback } from 'react';
import { FileText, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/shared/lib/supabase/client';

interface AuditLog {
  id: number;
  admin_id: string | null;
  action: string;
  entity: string | null;
  entity_id: string | null;
  details: any;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export default function AuditLogViewer() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const PAGE_SIZE = 50;

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabase.from('audit_logs').select('*', { count: 'exact' });

    if (filterAction !== 'all') query = query.eq('action', filterAction);
    if (search) query = query.ilike('action', `%${search}%`);

    const { data, count } = await query.range(from, to).order('created_at', { ascending: false });

    if (data) { setLogs(data as AuditLog[]); setTotal(count || 0); }
    setLoading(false);
  }, [page, search, filterAction]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const actionColor = (action: string) => {
    if (action.includes('ban') || action.includes('delete')) return 'text-red-400';
    if (action.includes('create') || action.includes('add')) return 'text-phantom-green';
    if (action.includes('update') || action.includes('edit')) return 'text-amber-400';
    if (action.includes('login') || action.includes('auth')) return 'text-blue-400';
    return 'text-white/60';
  };

  const uniqueActions = [...new Set(logs.map(l => l.action))];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FileText className="w-5 h-5 text-phantom-purple" />
          Журнал действий
        </h2>
        <p className="text-white/40 text-sm mt-1">Все действия администраторов в системе</p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Поиск по действию..."
            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-phantom-purple/50" />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-white/30" />
          <select value={filterAction} onChange={e => { setFilterAction(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none">
            <option value="all">Все действия</option>
            {uniqueActions.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      </div>

      {/* Log List */}
      <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
        <div className="max-h-[600px] overflow-y-auto">
          {loading ? (
            <div className="text-center py-12 text-white/30">Загрузка...</div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-white/30">Нет записей</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-[#0a0a0f] z-10">
                <tr className="border-b border-white/10">
                  <th className="text-left px-4 py-3 text-white/40 text-xs font-medium">Время</th>
                  <th className="text-left px-4 py-3 text-white/40 text-xs font-medium">Действие</th>
                  <th className="text-left px-4 py-3 text-white/40 text-xs font-medium">Сущность</th>
                  <th className="text-left px-4 py-3 text-white/40 text-xs font-medium">IP</th>
                  <th className="text-right px-4 py-3 text-white/40 text-xs font-medium">Детали</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} onClick={() => setSelectedLog(selectedLog?.id === log.id ? null : log)}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer">
                    <td className="px-4 py-3 text-white/30 text-xs whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString('ru-RU')}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium ${actionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white/40 text-xs">
                      {log.entity ? `${log.entity}${log.entity_id ? ` #${log.entity_id.slice(0, 8)}` : ''}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-white/30 text-xs font-mono">
                      {log.ip_address || '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button className="text-phantom-purple text-xs hover:underline">Подробнее</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Detail Panel */}
        {selectedLog && (
          <div className="border-t border-white/10 p-5 bg-white/5">
            <h4 className="text-white text-sm font-semibold mb-3">Детали записи</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-white/30 block mb-1">Action</span>
                <span className={`font-medium ${actionColor(selectedLog.action)}`}>{selectedLog.action}</span>
              </div>
              <div>
                <span className="text-white/30 block mb-1">Entity</span>
                <span className="text-white/60">{selectedLog.entity || '—'}</span>
              </div>
              <div>
                <span className="text-white/30 block mb-1">Admin ID</span>
                <span className="text-white/60 font-mono">{selectedLog.admin_id?.slice(0, 8) || '—'}</span>
              </div>
              <div>
                <span className="text-white/30 block mb-1">IP Address</span>
                <span className="text-white/60 font-mono">{selectedLog.ip_address || '—'}</span>
              </div>
              <div className="col-span-2">
                <span className="text-white/30 block mb-1">User Agent</span>
                <span className="text-white/40">{selectedLog.user_agent || '—'}</span>
              </div>
              <div className="col-span-2">
                <span className="text-white/30 block mb-1">Details</span>
                <pre className="text-white/50 text-[10px] overflow-x-auto">{selectedLog.details ? JSON.stringify(selectedLog.details, null, 2) : '—'}</pre>
              </div>
            </div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/10">
            <span className="text-white/30 text-xs">
              {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, total)} из {total}
            </span>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="p-1.5 rounded bg-white/5 text-white/40 hover:text-white disabled:opacity-30">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-white/40 text-xs">Стр. {page} / {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="p-1.5 rounded bg-white/5 text-white/40 hover:text-white disabled:opacity-30">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
