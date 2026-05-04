import { useState, useEffect, useCallback } from 'react';
import { Settings, Globe, Mail, Shield, Zap, Save, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/shared/lib/supabase/client';

interface Setting {
  id: string;
  category: string;
  key: string;
  value: string;
}

const categories = [
  { id: 'general', label: 'Общие', icon: Globe },
  { id: 'smtp', label: 'Email (SMTP)', icon: Mail },
  { id: 'security', label: 'Безопасность', icon: Shield },
  { id: 'analytics', label: 'Аналитика', icon: Zap },
  { id: 'webhooks', label: 'Webhooks', icon: Zap },
];

export default function SettingsManager() {
  const [activeCategory, setActiveCategory] = useState('general');
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('app_settings').select('*').eq('category', activeCategory);
    if (data) setSettings(data as Setting[]);
    setLoading(false);
  }, [activeCategory]);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const updateSetting = async (key: string, value: string) => {
    setSettings(prev => prev.map(s => s.key === key ? { ...s, value } : s));
  };

  const handleSave = async () => {
    setSaving(true);
    for (const s of settings) {
      await supabase.from('app_settings').update({ value: s.value }).eq('id', s.id);
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => { fetchSettings(); };

  const isSensitive = (key: string) => ['password', 'secret', 'token', 'key'].some(w => key.toLowerCase().includes(w));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-phantom-purple" />
            Настройки
          </h2>
          <p className="text-white/40 text-sm mt-1">Конфигурация системы и интеграций</p>
        </div>
        <div className="flex items-center gap-3">
          {saved && <span className="text-phantom-green text-sm">✓ Сохранено</span>}
          <button onClick={handleReset} className="flex items-center gap-2 px-3 py-2 bg-white/5 text-white/60 rounded-lg hover:bg-white/10 transition-colors text-sm">
            <RefreshCw className="w-3.5 h-3.5" /> Сбросить
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-phantom-purple text-white rounded-lg hover:bg-phantom-purple/80 transition-colors text-sm font-medium disabled:opacity-50">
            <Save className="w-3.5 h-3.5" /> {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {categories.map(cat => (
          <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              activeCategory === cat.id ? 'bg-phantom-purple/10 text-phantom-purple border border-phantom-purple/20' : 'bg-white/5 text-white/50 hover:text-white hover:bg-white/10'
            }`}>
            <cat.icon className="w-4 h-4" />
            {cat.label}
          </button>
        ))}
      </div>

      {/* Settings Form */}
      {loading ? (
        <div className="bg-white/5 rounded-xl p-8 text-center">
          <RefreshCw className="w-6 h-6 text-white/20 mx-auto mb-3 animate-spin" />
          <p className="text-white/40 text-sm">Загрузка настроек...</p>
        </div>
      ) : settings.length === 0 ? (
        <div className="bg-white/5 rounded-xl p-8 text-center">
          <p className="text-white/40 text-sm">Нет настроек в этой категории</p>
        </div>
      ) : (
        <div className="bg-white/5 rounded-xl border border-white/10 divide-y divide-white/5">
          {settings.map((s) => (
            <div key={s.id} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <label className="text-white text-sm font-medium block mb-1 capitalize">
                    {s.key.replace(/_/g, ' ')}
                  </label>
                  <p className="text-white/30 text-xs">
                    {s.category === 'general' && 'Общие параметры приложения'}
                    {s.category === 'smtp' && 'Настройки SMTP сервера для отправки email'}
                    {s.category === 'security' && 'Параметры безопасности и аутентификации'}
                    {s.category === 'analytics' && 'Конфигурация аналитики'}
                    {s.category === 'webhooks' && 'URL для webhook-уведомлений'}
                  </p>
                </div>
                <div className="w-64 flex items-center gap-2">
                  {['true', 'false'].includes(s.value) ? (
                    <select value={s.value} onChange={e => updateSetting(s.key, e.target.value)}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-phantom-purple/50">
                      <option value="true">Включено</option>
                      <option value="false">Отключено</option>
                    </select>
                  ) : isSensitive(s.key) ? (
                    <div className="relative w-full">
                      <input type={showPasswords ? 'text' : 'password'} value={s.value}
                        onChange={e => updateSetting(s.key, e.target.value)}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-phantom-purple/50 pr-10" />
                      <button onClick={() => setShowPasswords(!showPasswords)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                        {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  ) : (
                    <input type={s.key.includes('port') || s.key.includes('size') ? 'number' : 'text'} value={s.value}
                      onChange={e => updateSetting(s.key, e.target.value)}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-phantom-purple/50" />
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
