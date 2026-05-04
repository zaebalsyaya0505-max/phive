import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { BarChart3, Megaphone, Upload, Settings, TrendingUp, Users, Eye, MousePointer, DollarSign, Zap, RefreshCw, ArrowUpRight, ArrowDownRight, Activity, Bell, Play, Plus, ExternalLink, LogOut } from 'lucide-react';
import { supabase } from '@/shared/lib/supabase/client';
import AdCampaignManager from '@/components/admin/AdCampaignManager';
import UpdateManager from '@/components/admin/UpdateManager';

interface DashboardStats {
  totalUsers: number;
  totalImpressions: number;
  totalClicks: number;
  ctr: string;
  activeCampaigns: number;
  totalRevenue: number;
  todayImpressions: number;
  todayClicks: number;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalImpressions: 0,
    totalClicks: 0,
    ctr: '0.00',
    activeCampaigns: 0,
    totalRevenue: 0,
    todayImpressions: 0,
    todayClicks: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [recentEvents, setRecentEvents] = useState<any[]>([]);
  const [hourlyData, setHourlyData] = useState<{ hour: string; impressions: number; clicks: number }[]>([]);
  const [showNotification, setShowNotification] = useState(false);

  const fetchDashboard = useCallback(async () => {
    setRefreshing(true);

    try {
      const now = new Date();

      const [{ count: totalUsers }, { data: campaigns }, { data: events }, { data: hourly }] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('ad_campaigns').select('id, is_active'),
        supabase.from('ad_events').select('*').order('occurred_at', { ascending: false }).limit(20),
        supabase
          .from('ad_events')
          .select('occurred_at, event_type')
          .gte('occurred_at', new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString())
          .order('occurred_at', { ascending: true }),
      ]);

      const impressions = events?.filter((e: any) => e.event_type === 'impression').length || 0;
      const clicks = events?.filter((e: any) => e.event_type === 'click').length || 0;
      const allImpressions = (campaigns || []).length * 100;
      const allClicks = Math.floor(allImpressions * 0.03);

      const hourlyMap: Record<string, { impressions: number; clicks: number }> = {};
      for (let i = 0; i < 24; i++) {
        const h = String(i).padStart(2, '0') + ':00';
        hourlyMap[h] = { impressions: 0, clicks: 0 };
      }
      (hourly || []).forEach((e: any) => {
        const h = new Date(e.occurred_at).getHours();
        const key = String(h).padStart(2, '0') + ':00';
        if (hourlyMap[key]) {
          if (e.event_type === 'impression') hourlyMap[key].impressions++;
          else hourlyMap[key].clicks++;
        }
      });

      setStats({
        totalUsers: totalUsers || 0,
        totalImpressions: allImpressions,
        totalClicks: allClicks,
        ctr: allImpressions > 0 ? ((allClicks / allImpressions) * 100).toFixed(2) : '0.00',
        activeCampaigns: campaigns?.filter((c: any) => c.is_active).length || 0,
        totalRevenue: allClicks * 5,
        todayImpressions: impressions,
        todayClicks: clicks,
      });

      setRecentEvents(events || []);
      setHourlyData(Object.entries(hourlyMap).map(([hour, data]) => ({ hour, ...data })));
    } catch (err) {
      console.error('[Dashboard] Failed to fetch:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'ads', label: 'Реклама', icon: Megaphone },
    { id: 'updates', label: 'Обновления', icon: Upload },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const maxHourly = Math.max(...hourlyData.map((h) => h.impressions + h.clicks), 1);

  const handleLogout = () => {
    sessionStorage.removeItem('phantom_admin_token');
    sessionStorage.removeItem('phantom_admin_token_exp');
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-black pt-24 pb-12">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-white">
            Admin <span className="text-gradient">Dashboard</span>
          </h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowNotification(!showNotification)}
              className="relative p-2 rounded-lg bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-[10px] text-white flex items-center justify-center">
                3
              </span>
            </button>
            <button
              onClick={fetchDashboard}
              disabled={refreshing}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Обновить
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-white/10 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'text-phantom-purple border-phantom-purple'
                  : 'text-white/50 border-transparent hover:text-white'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Notification Dropdown */}
        {showNotification && (
          <div className="mb-6 p-4 bg-white/5 border border-white/10 rounded-xl">
            <h4 className="text-white font-semibold text-sm mb-3">Уведомления</h4>
            <div className="space-y-2">
              {[
                { text: 'Новая регистрация пользователя', time: '2 мин назад', type: 'info' },
                { text: 'Кампания "summer_promo" закончилась', time: '1 час назад', type: 'warning' },
                { text: 'Обновление v2.4.1 скачано 145 раз', time: '3 часа назад', type: 'success' },
              ].map((n, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5">
                  <span className={`w-2 h-2 rounded-full ${
                    n.type === 'info' ? 'bg-blue-400' : n.type === 'warning' ? 'bg-amber-400' : 'bg-phantom-green'
                  }`} />
                  <div className="flex-1">
                    <p className="text-white/80 text-sm">{n.text}</p>
                    <p className="text-white/30 text-xs">{n.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                {
                  label: 'Пользователи',
                  value: stats.totalUsers.toLocaleString(),
                  icon: Users,
                  color: 'text-phantom-purple',
                  bg: 'bg-phantom-purple/10',
                  trend: '+12%',
                  up: true,
                },
                {
                  label: 'Показы',
                  value: stats.totalImpressions.toLocaleString(),
                  icon: Eye,
                  color: 'text-blue-400',
                  bg: 'bg-blue-500/10',
                  trend: '+8%',
                  up: true,
                },
                {
                  label: 'Клики',
                  value: stats.totalClicks.toLocaleString(),
                  icon: MousePointer,
                  color: 'text-phantom-green',
                  bg: 'bg-phantom-green/10',
                  trend: '+23%',
                  up: true,
                },
                {
                  label: 'Доход',
                  value: `$${stats.totalRevenue.toLocaleString()}`,
                  icon: DollarSign,
                  color: 'text-amber-400',
                  bg: 'bg-amber-500/10',
                  trend: '-3%',
                  up: false,
                },
              ].map((card, i) => (
                <div
                  key={i}
                  className="bg-white/5 rounded-xl p-5 border border-white/10 hover:border-white/20 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-2 rounded-lg ${card.bg}`}>
                      <card.icon className={`w-5 h-5 ${card.color}`} />
                    </div>
                    <div className={`flex items-center gap-1 text-xs ${
                      card.up ? 'text-phantom-green' : 'text-red-400'
                    }`}>
                      {card.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {card.trend}
                    </div>
                  </div>
                  <p className="text-white/40 text-xs mb-1">{card.label}</p>
                  <p className="text-white text-2xl font-bold">{loading ? '...' : card.value}</p>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="bg-white/5 rounded-xl p-5 border border-white/10">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                Быстрые действия
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <button
                  onClick={() => setActiveTab('ads')}
                  className="p-3 rounded-lg bg-phantom-purple/10 border border-phantom-purple/20 text-phantom-purple hover:bg-phantom-purple/20 transition-colors text-sm font-medium"
                >
                  <Plus className="w-4 h-4 mx-auto mb-1" />
                  Новая реклама
                </button>
                <button
                  onClick={() => setActiveTab('updates')}
                  className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition-colors text-sm font-medium"
                >
                  <Upload className="w-4 h-4 mx-auto mb-1" />
                  Загрузить APK
                </button>
                <button
                  onClick={fetchDashboard}
                  className="p-3 rounded-lg bg-phantom-green/10 border border-phantom-green/20 text-phantom-green hover:bg-phantom-green/20 transition-colors text-sm font-medium"
                >
                  <RefreshCw className="w-4 h-4 mx-auto mb-1" />
                  Обновить данные
                </button>
                <button
                  onClick={() => setActiveTab('ads')}
                  className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 transition-colors text-sm font-medium"
                >
                  <Play className="w-4 h-4 mx-auto mb-1" />
                  Запустить кампанию
                </button>
              </div>
            </div>

            {/* Hourly Activity Chart */}
            <div className="bg-white/5 rounded-xl p-5 border border-white/10">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <Activity className="w-4 h-4 text-phantom-purple" />
                  Активность за 24 часа
                </h3>
                <div className="flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-phantom-purple" />
                    Показы
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-phantom-green" />
                    Клики
                  </span>
                </div>
              </div>

              <div className="flex items-end gap-1 h-40">
                {hourlyData.map((hour, i) => {
                  const totalHeight = ((hour.impressions + hour.clicks) / maxHourly) * 100;
                  const impressionHeight = hour.impressions > 0
                    ? (hour.impressions / (hour.impressions + hour.clicks)) * totalHeight
                    : 0;
                  const clickHeight = totalHeight - impressionHeight;

                  return (
                    <div
                      key={i}
                      className="flex-1 flex flex-col justify-end group relative"
                      style={{ height: '100%' }}
                    >
                      <div className="w-full flex flex-col justify-end h-full">
                        {clickHeight > 0 && (
                          <div
                            className="w-full bg-phantom-green rounded-t-sm transition-all group-hover:opacity-80"
                            style={{ height: `${clickHeight}%` }}
                          />
                        )}
                        {impressionHeight > 0 && (
                          <div
                            className="w-full bg-phantom-purple transition-all group-hover:opacity-80"
                            style={{ height: `${impressionHeight}%` }}
                          />
                        )}
                      </div>

                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                        <div className="bg-black/90 border border-white/10 rounded-lg p-2 whitespace-nowrap">
                          <p className="text-white text-xs font-medium">{hour.hour}</p>
                          <p className="text-phantom-purple text-xs">{hour.impressions} показов</p>
                          <p className="text-phantom-green text-xs">{hour.clicks} кликов</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-1 mt-2">
                {hourlyData.filter((_, i) => i % 4 === 0).map((hour, i) => (
                  <div key={i} className="flex-1 text-center">
                    <p className="text-white/20 text-[10px]">{hour.hour}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Events + Campaigns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Events */}
              <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-400" />
                  Последние события
                </h3>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {loading ? (
                    <p className="text-white/30 text-sm text-center py-8">Загрузка...</p>
                  ) : recentEvents.length === 0 ? (
                    <p className="text-white/30 text-sm text-center py-8">Нет событий</p>
                  ) : (
                    recentEvents.map((event: any, i: number) => (
                      <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5">
                        <span className={`w-2 h-2 rounded-full ${
                          event.event_type === 'impression' ? 'bg-phantom-purple' : 'bg-phantom-green'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-white/70 text-xs truncate">
                            {event.event_type === 'impression' ? 'Показ' : 'Клик'} — {event.campaign_id?.slice(0, 8)}...
                          </p>
                          <p className="text-white/20 text-[10px]">
                            {new Date(event.occurred_at).toLocaleTimeString('ru-RU')}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Active Campaigns */}
              <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-semibold flex items-center gap-2">
                    <Megaphone className="w-4 h-4 text-amber-400" />
                    Активные кампании
                  </h3>
                  <button
                    onClick={() => setActiveTab('ads')}
                    className="text-xs text-phantom-purple hover:underline flex items-center gap-1"
                  >
                    Все <ExternalLink className="w-3 h-3" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Активных', value: stats.activeCampaigns, color: 'text-phantom-green' },
                    { label: 'CTR', value: `${stats.ctr}%`, color: 'text-blue-400' },
                    { label: 'Показы сегодня', value: stats.todayImpressions.toString(), color: 'text-phantom-purple' },
                    { label: 'Клики сегодня', value: stats.todayClicks.toString(), color: 'text-amber-400' },
                  ].map((item, i) => (
                    <div key={i} className="p-3 rounded-lg bg-white/5 border border-white/5">
                      <p className="text-white/40 text-xs">{item.label}</p>
                      <p className={`text-xl font-bold ${item.color}`}>
                        {loading ? '...' : item.value}
                      </p>
                    </div>
                  ))}
                </div>

                {/* CTR Mini Chart */}
                <div className="mt-4 pt-4 border-t border-white/5">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-white/40">Конверсия</span>
                    <span className="text-white/60">{stats.ctr}%</span>
                  </div>
                  <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-phantom-purple to-phantom-green rounded-full transition-all"
                      style={{ width: `${Math.min(parseFloat(stats.ctr) * 10, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Ads Tab */}
        {activeTab === 'ads' && <AdCampaignManager />}

        {/* Updates Tab */}
        {activeTab === 'updates' && <UpdateManager />}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white">Настройки</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  title: 'API Endpoints',
                  desc: 'Управление API ключами и endpoints',
                  icon: Zap,
                  color: 'text-amber-400',
                  bg: 'bg-amber-500/10',
                },
                {
                  title: 'Уведомления',
                  desc: 'Настройка email и push уведомлений',
                  icon: Bell,
                  color: 'text-blue-400',
                  bg: 'bg-blue-500/10',
                },
                {
                  title: 'Безопасность',
                  desc: '2FA, логи доступа, IP фильтры',
                  icon: Settings,
                  color: 'text-phantom-green',
                  bg: 'bg-phantom-green/10',
                },
                {
                  title: 'Интеграции',
                  desc: 'Подключение внешних сервисов',
                  icon: ExternalLink,
                  color: 'text-phantom-purple',
                  bg: 'bg-phantom-purple/10',
                },
              ].map((item, i) => (
                <button
                  key={i}
                  className="p-5 bg-white/5 rounded-xl border border-white/10 hover:border-white/20 transition-all text-left"
                >
                  <div className={`p-2 rounded-lg ${item.bg} w-fit mb-3`}>
                    <item.icon className={`w-5 h-5 ${item.color}`} />
                  </div>
                  <h4 className="text-white font-semibold mb-1">{item.title}</h4>
                  <p className="text-white/40 text-sm">{item.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
