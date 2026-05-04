import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { useSupabase } from '@/providers/SupabaseProvider';
import { supabase } from '@/shared/lib/supabase/client';
import { User, Wallet, Shield, LogOut, Save, CheckCircle2, AlertCircle } from 'lucide-react';

interface Profile {
  id: string;
  email: string | null;
  display_name: string | null;
  role: string;
  ton_address: string | null;
  ton_public_key: string | null;
  is_premium: boolean;
  created_at: string;
}

export default function ProfilePage() {
  const { user, signOut, role } = useSupabase();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (data) {
        setProfile(data);
        setDisplayName(data.display_name || '');
      }
      setLoading(false);
    };

    fetchProfile();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setError(null);
    setSuccess(false);

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ display_name: displayName })
      .eq('id', user.id);

    setSaving(false);

    if (updateError) {
      setError(updateError.message);
    } else {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black pt-24 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-phantom-purple border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/50 text-sm">Загрузка профиля...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pt-24 pb-12">
      <div className="max-w-[800px] mx-auto px-6 lg:px-10">
        <h1 className="text-4xl font-bold text-white mb-8">
          Личный <span className="text-gradient">кабинет</span>
        </h1>

        <div className="space-y-6">
          {/* Profile Card */}
          <div className="glass rounded-2xl p-8 border border-white/10">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-phantom-purple/20 flex items-center justify-center">
                <User className="w-8 h-8 text-phantom-purple" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  {profile?.display_name || 'Пользователь'}
                </h2>
                <p className="text-white/50 text-sm">{user?.email}</p>
              </div>
              <div className="ml-auto">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  role === 'admin' ? 'bg-red-500/20 text-red-400' :
                  role === 'moderator' ? 'bg-amber-500/20 text-amber-400' :
                  'bg-white/10 text-white/60'
                }`}>
                  {role === 'admin' ? 'Admin' : role === 'moderator' ? 'Moderator' : 'User'}
                </span>
              </div>
            </div>

            {/* Display Name */}
            <div className="mb-4">
              <label className="text-sm text-white/60 mb-2 block">Отображаемое имя</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Ваше имя"
                className="w-full px-4 py-3 bg-white/[0.05] border border-white/10 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-phantom-purple transition-colors"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 bg-phantom-purple text-white font-semibold rounded-xl hover:bg-phantom-purple-deep transition-all disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Сохранение...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Сохранить
                  </>
                )}
              </button>
            </div>

            {success && (
              <div className="mt-4 flex items-center gap-2 text-phantom-green text-sm">
                <CheckCircle2 className="w-4 h-4" />
                Профиль обновлён
              </div>
            )}

            {error && (
              <div className="mt-4 flex items-center gap-2 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}
          </div>

          {/* TON Wallet */}
          <div className="glass rounded-2xl p-8 border border-white/10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-phantom-purple/10 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-phantom-purple" />
              </div>
              <h3 className="text-white font-bold text-lg">TON кошелёк</h3>
            </div>

            {profile?.ton_address ? (
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <p className="text-xs text-white/40 mb-1">Адрес</p>
                <p className="text-sm font-mono text-white/80 break-all">{profile.ton_address}</p>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
                <p className="text-white/50 text-sm">Кошелёк не привязан</p>
                <Link
                  to="/auth/ton"
                  className="inline-block mt-3 text-phantom-purple text-sm hover:underline"
                >
                  Привязать TON кошелёк
                </Link>
              </div>
            )}
          </div>

          {/* Account Info */}
          <div className="glass rounded-2xl p-8 border border-white/10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-phantom-purple/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-phantom-purple" />
              </div>
              <h3 className="text-white font-bold text-lg">Информация</h3>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="text-white/40 text-sm">Email</span>
                <span className="text-white text-sm">{user?.email || 'Не указан'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="text-white/40 text-sm">Premium</span>
                <span className={`text-sm font-medium ${profile?.is_premium ? 'text-amber-400' : 'text-white/50'}`}>
                  {profile?.is_premium ? 'Да' : 'Нет'}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="text-white/40 text-sm">Роль</span>
                <span className="text-white text-sm capitalize">{role}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-white/40 text-sm">Дата регистрации</span>
                <span className="text-white text-sm">
                  {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('ru-RU') : '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Sign Out */}
          <button
            onClick={signOut}
            className="w-full py-4 border border-red-500/30 text-red-400 font-semibold rounded-xl hover:bg-red-500/10 transition-all flex items-center justify-center gap-2"
          >
            <LogOut className="w-5 h-5" />
            Выйти
          </button>
        </div>
      </div>
    </div>
  );
}
