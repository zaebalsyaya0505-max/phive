import { useState, useEffect, useCallback } from 'react';
import { Bell, Send, Plus, Trash2, Edit, AlertTriangle, XCircle, Info, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/shared/lib/supabase/client';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  channel: string[];
  target: string;
  is_sent: boolean;
  sent_at: string | null;
  created_at: string;
}

export default function NotificationsManager() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<NotificationItem | null>(null);
  const [sending, setSending] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: '', message: '', type: 'info' as NotificationItem['type'],
    channel: ['in_app'] as string[], target: 'all',
  });

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setNotifications(data as NotificationItem[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const handleSubmit = async () => {
    if (!form.title || !form.message) return;
    const payload = { ...form, channels: form.channel };
    if (editing) {
      await supabase.from('notifications').update(payload).eq('id', editing.id);
    } else {
      await supabase.from('notifications').insert(payload);
    }
    setForm({ title: '', message: '', type: 'info', channel: ['in_app'], target: 'all' });
    setShowForm(false);
    setEditing(null);
    fetchNotifications();
  };

  const handleSend = async (id: string) => {
    setSending(id);
    await supabase.from('notifications').update({ is_sent: true, sent_at: new Date().toISOString() }).eq('id', id);
    setSending(null);
    fetchNotifications();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Удалить уведомление?')) {
      await supabase.from('notifications').delete().eq('id', id);
      fetchNotifications();
    }
  };

  const typeIcon = (type: string) => {
    switch (type) {
      case 'info': return <Info className="w-4 h-4 text-blue-400" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-400" />;
      case 'success': return <CheckCircle2 className="w-4 h-4 text-phantom-green" />;
      default: return <Info className="w-4 h-4 text-white/30" />;
    }
  };

  const typeColor = (type: string) => {
    switch (type) {
      case 'info': return 'border-blue-500/20 bg-blue-500/5';
      case 'warning': return 'border-amber-500/20 bg-amber-500/5';
      case 'error': return 'border-red-500/20 bg-red-500/5';
      case 'success': return 'border-phantom-green/20 bg-phantom-green/5';
      default: return 'border-white/10 bg-white/5';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-phantom-purple" />
            Уведомления
          </h2>
          <p className="text-white/40 text-sm mt-1">Создавайте и отправляйте уведомления пользователям</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditing(null); setForm({ title: '', message: '', type: 'info', channel: ['in_app'], target: 'all' }); }}
          className="flex items-center gap-2 px-4 py-2 bg-phantom-purple text-white rounded-lg hover:bg-phantom-purple/80 transition-colors text-sm font-medium">
          <Plus className="w-4 h-4" /> Новое
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white/5 rounded-xl p-6 border border-white/10 space-y-4">
          <h3 className="text-white font-semibold">{editing ? 'Редактировать' : 'Новое уведомление'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-white/60 text-xs mb-1 block">Заголовок</label>
              <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-phantom-purple/50"
                placeholder="Важное обновление" />
            </div>
            <div>
              <label className="text-white/60 text-xs mb-1 block">Тип</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as any })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-phantom-purple/50">
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="error">Error</option>
                <option value="success">Success</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-white/60 text-xs mb-1 block">Сообщение</label>
            <textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} rows={3}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-phantom-purple/50 resize-none"
              placeholder="Текст уведомления..." />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-white/60 text-xs mb-1 block">Каналы</label>
              <div className="flex gap-3">
                {['in_app', 'email', 'push'].map(ch => (
                  <label key={ch} className="flex items-center gap-1.5 text-white/60 text-xs cursor-pointer">
                    <input type="checkbox" checked={form.channel.includes(ch)}
                      onChange={e => setForm({ ...form, channel: e.target.checked ? [...form.channel, ch] : form.channel.filter(c => c !== ch) })}
                      className="accent-phantom-purple" />
                    {ch === 'in_app' ? 'В приложении' : ch === 'email' ? 'Email' : 'Push'}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="text-white/60 text-xs mb-1 block">Целевая аудитория</label>
              <select value={form.target} onChange={e => setForm({ ...form, target: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-phantom-purple/50">
                <option value="all">Все пользователи</option>
                <option value="premium">Только Premium</option>
                <option value="free">Только Free</option>
                <option value="banned">Забаненные</option>
                <option value="admin">Только админы</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={handleSubmit}
              className="px-4 py-2 bg-phantom-purple text-white rounded-lg hover:bg-phantom-purple/80 transition-colors text-sm font-medium">
              {editing ? 'Сохранить' : 'Создать'}
            </button>
            <button onClick={() => { setShowForm(false); setEditing(null); }}
              className="px-4 py-2 bg-white/5 text-white/60 rounded-lg hover:bg-white/10 transition-colors text-sm">
              Отмена
            </button>
          </div>
        </div>
      )}

      {/* List */}
      <div className="space-y-3">
        {loading ? (
          <p className="text-white/30 text-center py-12">Загрузка...</p>
        ) : notifications.length === 0 ? (
          <p className="text-white/30 text-center py-12">Нет уведомлений. Создайте первое!</p>
        ) : (
          notifications.map((n) => (
            <div key={n.id} className={`p-4 rounded-xl border ${typeColor(n.type)} hover:border-white/20 transition-colors`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  {typeIcon(n.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-white font-medium text-sm">{n.title}</h4>
                      {n.is_sent && <span className="px-2 py-0.5 rounded-full bg-phantom-green/10 text-phantom-green text-[10px]">Отправлено</span>}
                    </div>
                    <p className="text-white/50 text-xs">{n.message}</p>
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-white/30">
                      <span>{n.channel.map(c => c === 'in_app' ? 'Приложение' : c).join(', ')}</span>
                      <span>•</span>
                      <span>Для: {n.target}</span>
                      <span>•</span>
                      <span>{new Date(n.created_at).toLocaleString('ru-RU')}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {!n.is_sent && (
                    <button onClick={() => handleSend(n.id)} disabled={sending === n.id}
                      className="p-1.5 rounded-lg bg-phantom-green/10 text-phantom-green hover:bg-phantom-green/20 transition-colors">
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button onClick={() => { setEditing(n); setForm({ title: n.title, message: n.message, type: n.type, channel: n.channel, target: n.target }); setShowForm(true); }}
                    className="p-1.5 rounded-lg bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-colors">
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(n.id)}
                    className="p-1.5 rounded-lg bg-white/5 text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
