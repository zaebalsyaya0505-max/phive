import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import {
  BarChart3, Megaphone, Upload, Settings, TrendingUp, Users, Eye,
  MousePointer, DollarSign, Zap, RefreshCw,
  Activity, Bell, Plus, ExternalLink, LogOut, AlertTriangle,
  Shield, FileText, CheckCircle2, XCircle, AlertCircle,
} from 'lucide-react';
import { supabase } from '@/shared/lib/supabase/client';
import AdCampaignManager from '@/components/admin/AdCampaignManager';
import UpdateManager from '@/components/admin/UpdateManager';
import NotificationsManager from '@/components/admin/NotificationsManager';
import SettingsManager from '@/components/admin/SettingsManager';
import UsersManager from '@/components/admin/UsersManager';
import AuditLogViewer from '@/components/admin/AuditLogViewer';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  bannedUsers: number;
  totalImpressions: number;
  totalClicks: number;
  ctr: string;
  activeCampaigns: number;
  totalRevenue: number;
  todayImpressions: number;
  todayClicks: number;
  unreadNotifications: number;
  pendingUpdates: number;
}

interface HealthStatus {
  component: string;
  status: string;
  latency: number | null;
  uptime: number;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0, activeUsers: 0, bannedUsers: 0,
    totalImpressions: 0, totalClicks: 0, ctr: '0.00',
    activeCampaigns: 0, totalRevenue: 0,
    todayImpressions: 0, todayClicks: 0,
    unreadNotifications: 0, pendingUpdates: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [health, setHealth] = useState<HealthStatus[]>([]);
  const [hourlyData, setHourlyData] = useState<{ hour: string; impressions: number; clicks: number }[]>([]);
  const [showNotification, setShowNotification] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [recentEvents, setRecentEvents] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  const fetchDashboard = useCallback(async () => {
    setRefreshing(true);
    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

      const [
        { count: totalUsers },
        { data: campaigns },
        { data: events },
        { data: hourly },
        { data: bans },
        { data: notifCount },
        { data: updateCount },
        { data: healthData },
        { data: activityLogs },
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('ad_campaigns').select('id, is_active'),
        supabase.from('ad_events').select('*').order('occurred_at', { ascending: false }).limit(50),
        supabase
          .from('ad_events')
          .select('occurred_at, event_type')
          .gte('occurred_at', new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString())
          .order('occurred_at', { ascending: true }),
        supabase.from('user_bans').select('id').eq('is_active', true),
        supabase.from('notifications').select('id').eq('is_sent', false),
        supabase.from('app_updates').select('id').eq('is_active', true).eq('is_critical', false),
        supabase.from('system_health').select('*').order('checked_at', { ascending: false }),
        supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(10),
      ]);

      const allImpressions = events?.filter((e: any) => e.event_type === 'impression').length || 0;
      const allClicks = events?.filter((e: any) => e.event_type === 'click').length || 0;
      const todayEvents = events?.filter((e: any) => new Date(e.occurred_at) >= new Date(todayStart)) || [];
      const todayImp = todayEvents.filter((e: any) => e.event_type === 'impression').length;
      const todayClk = todayEvents.filter((e: any) => e.event_type === 'click').length;

      const hourlyMap: Record<string, { impressions: number; clicks: number }> = {};
      for (let i = 0; i < 24; i++) {
        hourlyMap[String(i).padStart(2, '0') + ':00'] = { impressions: 0, clicks: 0 };
      }
      (hourly || []).forEach((e: any) => {
        const h = String(new Date(e.occurred_at).getHours()).padStart(2, '0') + ':00';
        if (hourlyMap[h]) {
          if (e.event_type === 'impression') hourlyMap[h].impressions++;
          else hourlyMap[h].clicks++;
        }
      });

      // Deduplicate health data by component (keep latest)
      const latestHealth: Record<string, HealthStatus> = {};
      (healthData || []).forEach((h: any) => {
        if (!latestHealth[h.component]) {
          latestHealth[h.component] = {
            component: h.component,
            status: h.status,
            latency: h.latency_ms,
            uptime: parseFloat(h.uptime_percent) || 100,
          };
        }
      });

      setStats({
        totalUsers: totalUsers || 0,
        activeUsers: (totalUsers || 0) - (bans?.length || 0),
        bannedUsers: bans?.length || 0,
        totalImpressions: allImpressions,
        totalClicks: allClicks,
        ctr: allImpressions > 0 ? ((allClicks / allImpressions) * 100).toFixed(2) : '0.00',
        activeCampaigns: campaigns?.filter((c: any) => c.is_active).length || 0,
        totalRevenue: allClicks * 5,
        todayImpressions: todayImp,
        todayClicks: todayClk,
        unreadNotifications: notifCount?.length || 0,
        pendingUpdates: updateCount?.length || 0,
      });

      setHealth(Object.values(latestHealth));
      setRecentEvents(events || []);
      setHourlyData(Object.entries(hourlyMap).map(([hour, data]) => ({ hour, ...data })));
      setNotifications(notifCount || []);
      setRecentActivity(activityLogs || []);
    } catch (err) {
      console.error('[Dashboard] Failed:', err);
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
    { id: 'users', label: 'Пользователи', icon: Users },
    { id: 'ads', label: 'Реклама', icon: Megaphone },
    { id: 'updates', label: 'Обновления', icon: Upload },
    { id: 'notifications', label: 'Уведомления', icon: Bell },
    { id: 'settings', label: 'Настройки', icon: Settings },
    { id: 'audit', label: 'Логи', icon: FileText },
  ];

  const maxHourly = Math.max(...hourlyData.map((h) => h.impressions + h.clicks), 1);

  const healthIcon = (status: string) => {
    switch (status) {
      case 'ok': return <CheckCircle2 className="w-4 h-4 text-phantom-green" />;
      case 'degraded': return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      case 'down': return <XCircle className="w-4 h-4 text-red-400" />;
      default: return <AlertCircle className="w-4 h-4 text-white/30" />;
    }
  };

  const healthLabel = (status: string) => {
    switch (status) {
      case 'ok': return 'OK';
      case 'degraded': return 'Degraded';
      case 'down': return 'Down';
      default: return 'Unknown';
    }
  };

  return (
    <div className="min-h-screen bg-black pt-24 pb-12">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
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
              {stats.unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-[10px] text-white flex items-center justify-center">
                  {stats.unreadNotifications}
                </span>
              )}
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
              onClick={() => {
                sessionStorage.removeItem('phantom_admin_token');
                sessionStorage.removeItem('phantom_admin_token_exp');
                navigate('/admin/login');
              }}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Notification Dropdown */}
        {showNotification && (
          <div className="mb-6 p-4 bg-white/5 border border-white/10 rounded-xl">
            <h4 className="text-white font-semibold text-sm mb-3">Уведомления</h4>
            {notifications.length === 0 ? (
              <p className="text-white/30 text-sm">Нет новых уведомлений</p>
            ) : (
              <div className="space-y-2">
                {notifications.slice(0, 5).map((n: any) => (
                  <div key={n.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5">
                    <span className={`w-2 h-2 rounded-full ${
                      n.type === 'info' ? 'bg-blue-400' : n.type === 'warning' ? 'bg-amber-400' : n.type === 'error' ? 'bg-red-400' : 'bg-phantom-green'
                    }`} />
                    <div className="flex-1">
                      <p className="text-white/80 text-sm">{n.title}</p>
                      <p className="text-white/30 text-xs">{n.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-white/10 overflow-x-auto pb-1">
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
              {tab.id === 'notifications' && stats.unreadNotifications > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[10px]">
                  {stats.unreadNotifications}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Пользователи', value: stats.totalUsers, icon: Users, color: 'text-phantom-purple', bg: 'bg-phantom-purple/10', detail: `${stats.activeUsers} активн., ${stats.bannedUsers} забан.` },
                { label: 'Показы', value: stats.totalImpressions, icon: Eye, color: 'text-blue-400', bg: 'bg-blue-500/10', detail: `${stats.todayImpressions} сегодня` },
                { label: 'Клики', value: stats.totalClicks, icon: MousePointer, color: 'text-phantom-green', bg: 'bg-phantom-green/10', detail: `CTR ${stats.ctr}%` },
                { label: 'Доход', value: `$${stats.totalRevenue}`, icon: DollarSign, color: 'text-amber-400', bg: 'bg-amber-500/10', detail: `${stats.activeCampaigns} кампаний` },
              ].map((card, i) => (
                <div key={i} className="bg-white/5 rounded-xl p-5 border border-white/10 hover:border-white/20 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-2 rounded-lg ${card.bg}`}>
                      <card.icon className={`w-5 h-5 ${card.color}`} />
                    </div>
                  </div>
                  <p className="text-white/40 text-xs mb-1">{card.label}</p>
                  <p className="text-white text-2xl font-bold">{loading ? '...' : card.value}</p>
                  <p className="text-white/30 text-[11px] mt-1">{card.detail}</p>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="bg-white/5 rounded-xl p-5 border border-white/10">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                Быстрые действия
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                  { label: 'Новая реклама', icon: Plus, color: 'text-phantom-purple', bg: 'bg-phantom-purple/10', border: 'border-phantom-purple/20', action: () => setActiveTab('ads') },
                  { label: 'Загрузить APK', icon: Upload, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', action: () => setActiveTab('updates') },
                  { label: 'Уведомление', icon: Bell, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', action: () => setActiveTab('notifications') },
                  { label: 'Пользователи', icon: Users, color: 'text-phantom-green', bg: 'bg-phantom-green/10', border: 'border-phantom-green/20', action: () => setActiveTab('users') },
                  { label: 'Настройки', icon: Settings, color: 'text-white/60', bg: 'bg-white/5', border: 'border-white/10', action: () => setActiveTab('settings') },
                ].map((btn, i) => (
                  <button key={i} onClick={btn.action}
                    className={`p-3 rounded-lg ${btn.bg} border ${btn.border} ${btn.color} hover:opacity-80 transition-all text-sm font-medium`}>
                    <btn.icon className="w-4 h-4 mx-auto mb-1" />
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>

            {/* System Health */}
            <div className="bg-white/5 rounded-xl p-5 border border-white/10">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4 text-phantom-purple" />
                Системное здоровье
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {loading ? (
                  <p className="text-white/30 text-sm col-span-5">Загрузка...</p>
                ) : health.map((h, i) => (
                  <div key={i} className="p-3 rounded-lg bg-white/5 border border-white/5">
                    <div className="flex items-center gap-2 mb-2">
                      {healthIcon(h.status)}
                      <span className="text-white text-xs font-medium capitalize">{h.component.replace('_', ' ')}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white/40">{healthLabel(h.status)}</span>
                      {h.latency !== null && <span className="text-white/30">{h.latency}ms</span>}
                    </div>
                    <div className="mt-2 w-full h-1 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-phantom-green rounded-full" style={{ width: `${h.uptime}%` }} />
                    </div>
                    <p className="text-white/20 text-[10px] mt-1">{h.uptime}% uptime</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Hourly Activity Chart */}
            <div className="bg-white/5 rounded-xl p-5 border border-white/10">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-400" />
                  Активность за 24 часа
                </h3>
                <div className="flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-phantom-purple" />Показы</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-phantom-green" />Клики</span>
                </div>
              </div>
              <div className="flex items-end gap-1 h-40">
                {hourlyData.map((hour, i) => {
                  const totalHeight = ((hour.impressions + hour.clicks) / maxHourly) * 100;
                  const impressionHeight = hour.impressions > 0 ? (hour.impressions / (hour.impressions + hour.clicks)) * totalHeight : 0;
                  const clickHeight = totalHeight - impressionHeight;
                  return (
                    <div key={i} className="flex-1 flex flex-col justify-end group relative" style={{ height: '100%' }}>
                      <div className="w-full flex flex-col justify-end h-full">
                        {clickHeight > 0 && <div className="w-full bg-phantom-green rounded-t-sm transition-all group-hover:opacity-80" style={{ height: `${clickHeight}%` }} />}
                        {impressionHeight > 0 && <div className="w-full bg-phantom-purple transition-all group-hover:opacity-80" style={{ height: `${impressionHeight}%` }} />}
                      </div>
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
            </div>

            {/* Recent Activity + Events */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Events */}
              <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-phantom-green" />
                  Последние события
                </h3>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {loading ? (
                    <p className="text-white/30 text-sm text-center py-8">Загрузка...</p>
                  ) : recentEvents.length === 0 ? (
                    <p className="text-white/30 text-sm text-center py-8">Нет событий</p>
                  ) : (
                    recentEvents.slice(0, 15).map((event: any, i: number) => (
                      <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5">
                        <span className={`w-2 h-2 rounded-full ${event.event_type === 'impression' ? 'bg-phantom-purple' : 'bg-phantom-green'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-white/70 text-xs truncate">{event.event_type === 'impression' ? 'Показ' : 'Клик'} — {event.campaign_id?.slice(0, 8)}...</p>
                          <p className="text-white/20 text-[10px]">{new Date(event.occurred_at).toLocaleString('ru-RU')}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Audit Log */}
              <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-semibold flex items-center gap-2">
                    <FileText className="w-4 h-4 text-amber-400" />
                    Журнал действий
                  </h3>
                  <button onClick={() => setActiveTab('audit')} className="text-xs text-phantom-purple hover:underline flex items-center gap-1">
                    Все <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {loading ? (
                    <p className="text-white/30 text-sm text-center py-8">Загрузка...</p>
                  ) : recentActivity.length === 0 ? (
                    <p className="text-white/30 text-sm text-center py-8">Нет записей</p>
                  ) : (
                    recentActivity.map((log: any, i: number) => (
                      <div key={i} className="flex items-start gap-3 p-2 rounded-lg hover:bg-white/5">
                        <Shield className="w-3 h-3 text-amber-400 mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-white/70 text-xs">{log.action}</p>
                          <p className="text-white/20 text-[10px]">{new Date(log.created_at).toLocaleString('ru-RU')}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Other Tabs */}
        {activeTab === 'users' && <UsersManager onRefresh={fetchDashboard} />}
        {activeTab === 'ads' && <AdCampaignManager />}
        {activeTab === 'updates' && <UpdateManager />}
        {activeTab === 'notifications' && <NotificationsManager />}
        {activeTab === 'settings' && <SettingsManager />}
        {activeTab === 'audit' && <AuditLogViewer />}
      </div>
    </div>
  );
}
