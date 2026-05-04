import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/shared/lib/supabase/client';
import { Plus, Edit2, Trash2, Eye, EyeOff, X, BarChart3 } from 'lucide-react';

interface AdCampaign {
  id: string;
  name: string;
  type: 'banner' | 'interstitial' | 'native' | 'subscription' | 'internal';
  image_url: string | null;
  title: string;
  description: string | null;
  click_url: string;
  width: number;
  height: number;
  priority: number;
  weight: number;
  is_active: boolean;
  is_internal: boolean;
  impressions: number;
  clicks: number;
  created_at: string;
}

const AD_TYPES = [
  { value: 'banner', label: 'Баннер' },
  { value: 'interstitial', label: 'Полноэкранная' },
  { value: 'native', label: 'Нативная' },
  { value: 'subscription', label: 'Подписка' },
  { value: 'internal', label: 'Внутренняя' },
] as const;

const EMPTY_CAMPAIGN: Omit<AdCampaign, 'id' | 'impressions' | 'clicks' | 'created_at'> = {
  name: '',
  type: 'banner',
  image_url: null,
  title: '',
  description: null,
  click_url: '',
  width: 320,
  height: 50,
  priority: 0,
  weight: 1,
  is_active: true,
  is_internal: false,
};

export default function AdCampaignManager() {
  const [campaigns, setCampaigns] = useState<AdCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<AdCampaign | null>(null);
  const [form, setForm] = useState<Omit<AdCampaign, 'id' | 'impressions' | 'clicks' | 'created_at'>>(EMPTY_CAMPAIGN);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    const { data, error: fetchError } = await supabase
      .from('ad_campaigns')
      .select('*')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setCampaigns(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const openCreate = () => {
    setForm(EMPTY_CAMPAIGN);
    setEditing(null);
    setShowForm(true);
  };

  const openEdit = (campaign: AdCampaign) => {
    setForm({
      name: campaign.name,
      type: campaign.type,
      image_url: campaign.image_url,
      title: campaign.title,
      description: campaign.description,
      click_url: campaign.click_url,
      width: campaign.width,
      height: campaign.height,
      priority: campaign.priority,
      weight: campaign.weight,
      is_active: campaign.is_active,
      is_internal: campaign.is_internal,
    });
    setEditing(campaign);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.title || !form.click_url) {
      setError('Название, заголовок и ссылка обязательны');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (editing) {
        const { error: updateError } = await supabase
          .from('ad_campaigns')
          .update(form)
          .eq('id', editing.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('ad_campaigns')
          .insert([form]);

        if (insertError) throw insertError;
      }

      setShowForm(false);
      setEditing(null);
      await fetchCampaigns();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить кампанию?')) return;

    const { error: deleteError } = await supabase
      .from('ad_campaigns')
      .delete()
      .eq('id', id);

    if (deleteError) {
      setError(deleteError.message);
    } else {
      await fetchCampaigns();
    }
  };

  const toggleActive = async (campaign: AdCampaign) => {
    const { error } = await supabase
      .from('ad_campaigns')
      .update({ is_active: !campaign.is_active })
      .eq('id', campaign.id);

    if (!error) await fetchCampaigns();
  };

  const totalImpressions = campaigns.reduce((sum, c) => sum + c.impressions, 0);
  const totalClicks = campaigns.reduce((sum, c) => sum + c.clicks, 0);
  const ctr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0.00';

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <p className="text-white/40 text-xs">Кампаний</p>
          <p className="text-white text-2xl font-bold">{campaigns.length}</p>
        </div>
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <p className="text-white/40 text-xs">Показов</p>
          <p className="text-white text-2xl font-bold">{totalImpressions.toLocaleString()}</p>
        </div>
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <p className="text-white/40 text-xs">Кликов</p>
          <p className="text-white text-2xl font-bold">{totalClicks.toLocaleString()}</p>
        </div>
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <p className="text-white/40 text-xs">CTR</p>
          <p className="text-phantom-purple text-2xl font-bold">{ctr}%</p>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">Рекламные кампании</h2>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-phantom-purple text-white rounded-lg hover:bg-phantom-purple-deep transition-colors"
        >
          <Plus className="w-4 h-4" />
          Создать
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-black/90 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h3 className="text-lg font-bold text-white">
                {editing ? 'Редактировать кампанию' : 'Новая кампания'}
              </h3>
              <button onClick={() => setShowForm(false)} className="text-white/40 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-white/60 mb-1 block">Название *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
                    placeholder="summer_promo_2026"
                  />
                </div>
                <div>
                  <label className="text-sm text-white/60 mb-1 block">Тип *</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value as any })}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
                  >
                    {AD_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm text-white/60 mb-1 block">Заголовок *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
                  placeholder="Скачайте премиум со скидкой"
                />
              </div>

              <div>
                <label className="text-sm text-white/60 mb-1 block">Описание</label>
                <textarea
                  value={form.description || ''}
                  onChange={(e) => setForm({ ...form, description: e.target.value || null })}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm h-20"
                  placeholder="Описание рекламы..."
                />
              </div>

              <div>
                <label className="text-sm text-white/60 mb-1 block">URL изображения</label>
                <input
                  type="url"
                  value={form.image_url || ''}
                  onChange={(e) => setForm({ ...form, image_url: e.target.value || null })}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="text-sm text-white/60 mb-1 block">Ссылка при клике *</label>
                <input
                  type="url"
                  value={form.click_url}
                  onChange={(e) => setForm({ ...form, click_url: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
                  placeholder="https://..."
                />
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="text-sm text-white/60 mb-1 block">Ширина</label>
                  <input
                    type="number"
                    value={form.width}
                    onChange={(e) => setForm({ ...form, width: parseInt(e.target.value) || 320 })}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm text-white/60 mb-1 block">Высота</label>
                  <input
                    type="number"
                    value={form.height}
                    onChange={(e) => setForm({ ...form, height: parseInt(e.target.value) || 50 })}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm text-white/60 mb-1 block">Приоритет</label>
                  <input
                    type="number"
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm text-white/60 mb-1 block">Вес</label>
                  <input
                    type="number"
                    value={form.weight}
                    onChange={(e) => setForm({ ...form, weight: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm text-white/60">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                    className="rounded"
                  />
                  Активна
                </label>
                <label className="flex items-center gap-2 text-sm text-white/60">
                  <input
                    type="checkbox"
                    checked={form.is_internal}
                    onChange={(e) => setForm({ ...form, is_internal: e.target.checked })}
                    className="rounded"
                  />
                  Внутренняя (наша)
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

      {/* Campaigns List */}
      {loading ? (
        <div className="text-center py-8 text-white/40">Загрузка...</div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-12 text-white/40">
          <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>Нет рекламных кампаний</p>
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map((campaign) => (
            <div
              key={campaign.id}
              className={`p-4 rounded-xl border transition-all ${
                campaign.is_active
                  ? 'bg-white/5 border-white/10'
                  : 'bg-white/[0.02] border-white/5 opacity-50'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h4 className="text-white font-semibold truncate">{campaign.name}</h4>
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      campaign.type === 'internal' ? 'bg-phantom-purple/20 text-phantom-purple' :
                      campaign.type === 'subscription' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-white/10 text-white/40'
                    }`}>
                      {AD_TYPES.find(t => t.value === campaign.type)?.label || campaign.type}
                    </span>
                    {campaign.is_internal && (
                      <span className="px-2 py-0.5 rounded text-xs bg-blue-500/20 text-blue-400">
                        Наша
                      </span>
                    )}
                  </div>
                  <p className="text-white/60 text-sm truncate">{campaign.title}</p>
                  <p className="text-white/30 text-xs mt-1 truncate">{campaign.click_url}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right text-xs text-white/40 mr-2">
                    <p>{campaign.impressions.toLocaleString()} показов</p>
                    <p>{campaign.clicks.toLocaleString()} кликов</p>
                  </div>

                  <button
                    onClick={() => toggleActive(campaign)}
                    className={`p-2 rounded-lg transition-colors ${
                      campaign.is_active
                        ? 'text-phantom-green hover:bg-phantom-green/10'
                        : 'text-white/20 hover:bg-white/5'
                    }`}
                  >
                    {campaign.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={() => openEdit(campaign)}
                    className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDelete(campaign.id)}
                    className="p-2 rounded-lg text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Preview */}
              <div className="mt-3 pt-3 border-t border-white/5">
                <div
                  className="flex items-center justify-center rounded-lg overflow-hidden bg-white/5"
                  style={{ width: Math.min(campaign.width, 320), height: campaign.height }}
                >
                  {campaign.image_url ? (
                    <img src={campaign.image_url} alt={campaign.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center">
                      <p className="text-white/60 text-xs font-semibold">{campaign.title}</p>
                      {campaign.description && (
                        <p className="text-white/30 text-[10px]">{campaign.description}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
