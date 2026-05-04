import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { supabase } from '@/shared/lib/supabase/client';
import { Shield, Eye, EyeOff, ArrowLeft, Mail, Lock } from 'lucide-react';

const SESSION_KEY = 'phantom_admin_token';
const SESSION_DURATION_MS = 8 * 60 * 60 * 1000;

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'supabase' | 'code'>('supabase');

  const handleSupabaseLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError || !data.session) {
        setError(authError?.message || 'Не удалось войти');
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.session.user.id)
        .single();

      if (profile?.role !== 'admin') {
        setError('У вас нет прав администратора');
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      setStep('code');
      setLoading(false);
        return;
      }

      setStep('code');
      setLoading(false);
    } catch {
      setError('Не удалось подключиться к серверу');
      setLoading(false);
    }
  }, [email, password]);

  const handleCodeSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/v1/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim() }),
      });

      const data = await res.json();

      if (res.ok && data.token) {
        sessionStorage.setItem(SESSION_KEY, data.token);
        sessionStorage.setItem(`${SESSION_KEY}_exp`, String(data.expiresAt || Date.now() + SESSION_DURATION_MS));
        navigate('/admin', { replace: true });
      } else {
        setError(data.error === 'invalid_code' ? 'Неверный код доступа' : 'Ошибка сервера');
      }
    } catch {
      setError('Не удалось подключиться к серверу');
    } finally {
      setLoading(false);
    }
  }, [code, navigate]);

  const handleSwitchBack = useCallback(async () => {
    await supabase.auth.signOut();
    setStep('supabase');
    setEmail('');
    setPassword('');
  }, []);

  return (
    <div className="min-h-screen bg-black pt-24 pb-12 flex items-center justify-center">
      <div className="max-w-md w-full px-6">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-white/50 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          На главную
        </button>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 mb-4">
            <Shield className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Admin <span className="text-red-400">Access</span>
          </h1>
          <p className="text-white/40 text-sm">
            {step === 'supabase' ? 'Войдите через аккаунт администратора' : 'Введите секретный код'}
          </p>
        </div>

        {step === 'supabase' ? (
          <form onSubmit={handleSupabaseLogin} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-red-400/50 focus:ring-1 focus:ring-red-400/20 transition-colors"
                autoFocus
                autoComplete="email"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Пароль"
                className="w-full pl-10 pr-12 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-red-400/50 focus:ring-1 focus:ring-red-400/20 transition-colors"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-white/30 hover:text-white/60 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {error && <p className="text-red-400 text-sm text-center">{error}</p>}
            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full py-3 bg-red-500 hover:bg-red-600 disabled:bg-white/5 disabled:text-white/30 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  Войти
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleCodeSubmit} className="space-y-4">
            <div className="relative">
              <input
                type={showCode ? 'text' : 'password'}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Секретный код"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-red-400/50 focus:ring-1 focus:ring-red-400/20 transition-colors pr-12"
                autoFocus
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => setShowCode(!showCode)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-white/30 hover:text-white/60 transition-colors"
              >
                {showCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {error && <p className="text-red-400 text-sm text-center">{error}</p>}
            <button
              type="submit"
              disabled={loading || !code.trim()}
              className="w-full py-3 bg-red-500 hover:bg-red-600 disabled:bg-white/5 disabled:text-white/30 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  Войти
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleSwitchBack}
              className="w-full py-2 bg-white/5 text-white/40 hover:text-white/60 rounded-xl text-sm transition-colors"
            >
              Сменить аккаунт
            </button>
          </form>
        )}

        <p className="text-white/20 text-xs text-center mt-6">
          Сессия истекает через 8 часов
        </p>
      </div>
    </div>
  );
}
