import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/shared/lib/supabase/client';
import { Plus, Trash2, Save, X, Upload, Smartphone, AlertTriangle } from 'lucide-react';

interface AppUpdate {
  id: string;
  version_code: number;
  version_name: string;
  platform: 'android' | 'ios';
  download_url: string;
  release_notes: string | null;
  min_version_code: number | null;
  is_critical: boolean;
  sha256_hash: string | null;
  file_size_bytes: number | null;
  rollout_percentage: number;
  is_active: boolean;
  published_at: string;
}

const EMPTY_UPDATE: Omit<AppUpdate, 'id' | 'published_at'> = {
  version_code: 0,
  version_name: '',
  platform: 'android',
  download_url: '',
  release_notes: null,
  min_version_code: null,
  is_critical: false,
  sha256_hash: null,
  file_size_bytes: null,
  rollout_percentage: 100,
  is_active: true,
};

export default function UpdateManager() {
  const [updates, setUpdates] = useState<AppUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<AppUpdate | null>(null);
  const [form, setForm] = useState<Omit<AppUpdate, 'id' | 'published_at'>>(EMPTY_UPDATE);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUpdates = useCallback(async () => {
    setLoading(true);
    const { data, error: fetchError } = await supabase
      .from('app_updates')
      .select('*')
      .order('version_code', { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setUpdates(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchUpdates();
  }, [fetchUpdates]);

  const openCreate = () => {
    setForm(EMPTY_UPDATE);
    setEditing(null);
    setShowForm(true);
  };

  const openEdit = (update: AppUpdate) => {
    setForm({
      version_code: update.version_code,
      version_name: update.version_name,
      platform: update.platform,
      download_url: update.download_url,
      release_notes: update.release_notes,
      min_version_code: update.min_version_code,
      is_critical: update.is_critical,
      sha256_hash: update.sha256_hash,
      file_size_bytes: update.file_size_bytes,
      rollout_percentage: update.rollout_percentage,
      is_active: update.is_active,
    });
    setEditing(update);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.version_name || !form.download_url || !form.version_code) {
      setError('Версия и ссылка обязательны');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (editing) {
        const { error: updateError } = await supabase
          .from('app_updates')
          .update(form)
          .eq('id', editing.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('app_updates')
          .insert([form]);

        if (insertError) throw insertError;
      }

      setShowForm(false);
      setEditing(null);
      await fetchUpdates();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить обновление?')) return;

    const { error: deleteError } = await supabase
      .from('app_updates')
      .delete()
      .eq('id', id);

    if (deleteError) {
      setError(deleteError.message);
    } else {
      await fetchUpdates();
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">Обновления приложения</h2>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-phantom-purple text-white rounded-lg hover:bg-phantom-purple-deep transition-colors"
        >
          <Plus className="w-4 h-4" />
          Добавить
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-black/90 border border-white/10 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h3 className="text-lg font-bold text-white">
                {editing ? 'Редактировать' : 'Новое обновление'}
              </h3>
              <button onClick={() => setShowForm(false)} className="text-white/40 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-white/60 mb-1 block">Version Code *</label>
                  <input
                    type="number"
                    value={form.version_code}
                    onChange={(e) => setForm({ ...form, version_code: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm text-white/60 mb-1 block">Version Name *</label>
                  <input
                    type="text"
                    value={form.version_name}
                    onChange={(e) => setForm({ ...form, version_name: e.target.value })}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
                    placeholder="2.4.1"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-white/60 mb-1 block">Платформа</label>
                <select
                  value={form.platform}
                  onChange={(e) => setForm({ ...form, platform: e.target.value as any })}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
                >
                  <option value="android">Android</option>
                  <option value="ios">iOS</option>
                </select>
              </div>

              <div>
                <label className="text-sm text-white/60 mb-1 block">Ссылка на APK *</label>
                <input
                  type="url"
                  value={form.download_url}
                  onChange={(e) => setForm({ ...form, download_url: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
                  placeholder="https://github.com/.../pH1VE.apk"
                />
              </div>

              <div>
                <label className="text-sm text-white/60 mb-1 block">Release Notes</label>
                <textarea
                  value={form.release_notes || ''}
                  onChange={(e) => setForm({ ...form, release_notes: e.target.value || null })}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm h-20"
                  placeholder="Что нового..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-white/60 mb-1 block">Min Version (force update)</label>
                  <input
                    type="number"
                    value={form.min_version_code || ''}
                    onChange={(e) => setForm({ ...form, min_version_code: e.target.value ? parseInt(e.target.value) : null })}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
                    placeholder="0 = no force"
                  />
                </div>
                <div>
                  <label className="text-sm text-white/60 mb-1 block">Rollout %</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={form.rollout_percentage}
                    onChange={(e) => setForm({ ...form, rollout_percentage: parseInt(e.target.value) || 100 })}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-white/60 mb-1 block">SHA-256 Hash</label>
                <input
                  type="text"
                  value={form.sha256_hash || ''}
                  onChange={(e) => setForm({ ...form, sha256_hash: e.target.value || null })}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm font-mono"
                  placeholder="sha256:..."
                />
              </div>

              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm text-white/60">
                  <input
                    type="checkbox"
                    checked={form.is_critical}
                    onChange={(e) => setForm({ ...form, is_critical: e.target.checked })}
                    className="rounded"
                  />
                  Критическое обновление
                </label>
                <label className="flex items-center gap-2 text-sm text-white/60">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                    className="rounded"
                  />
                  Активно
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-6 border-t border-white/10">
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-white/20 text-white/60 rounded-lg hover:bg-white/5"
              >
                Отмена
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-phantom-purple text-white rounded-lg hover:bg-phantom-purple-deep disabled:opacity-50"
              >
                {saving ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8 text-white/40">Загрузка...</div>
      ) : updates.length === 0 ? (
        <div className="text-center py-12 text-white/40">
          <Upload className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>Нет обновлений</p>
        </div>
      ) : (
        <div className="space-y-3">
          {updates.map((update) => (
            <div
              key={update.id}
              className={`p-4 rounded-xl border transition-all ${
                update.is_active ? 'bg-white/5 border-white/10' : 'bg-white/[0.02] border-white/5 opacity-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Smartphone className="w-5 h-5 text-phantom-purple" />
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-white font-semibold">{update.version_name}</h4>
                      <span className="text-white/30 text-xs">({update.version_code})</span>
                      {update.is_critical && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-red-500/20 text-red-400">
                          <AlertTriangle className="w-3 h-3" />
                          Critical
                        </span>
                      )}
                    </div>
                    <p className="text-white/40 text-xs">{update.platform} · {update.rollout_percentage}% rollout</p>
                    {update.min_version_code && (
                      <p className="text-amber-400/60 text-xs">Force update from v{update.min_version_code}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEdit(update)}
                    className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5"
                  >
                    <Save className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(update.id)}
                    className="p-2 rounded-lg text-red-400/60 hover:text-red-400 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {update.release_notes && (
                <p className="text-white/50 text-sm mt-2">{update.release_notes}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
