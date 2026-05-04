import { useState, useCallback } from "react";
import { Link, useNavigate } from "react-router";
import { supabase } from '@/shared/lib/supabase/client';
import { Mail, Lock, User, AlertTriangle, Eye, EyeOff, ArrowLeft, CheckCircle2 } from 'lucide-react';
import ParticleNetwork from '@/components/sections/ParticleNetwork';

export default function SignUpPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSignUp = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (password.length < 6) {
        throw new Error('Пароль должен быть не менее 6 символов');
      }

      const { error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { display_name: displayName || null },
        },
      });

      if (signUpError) throw signUpError;
      setSuccess(true);

      setTimeout(() => {
        navigate('/auth/login');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка регистрации');
    } finally {
      setLoading(false);
    }
  }, [email, password, displayName, navigate]);

  if (success) {
    return (
      <div className="min-h-screen bg-black relative overflow-hidden">
        <ParticleNetwork />
        <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/60 to-black/80" />
        <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
          <div className="w-full max-w-md text-center space-y-6">
            <CheckCircle2 className="w-16 h-16 text-phantom-green mx-auto" />
            <h2 className="text-2xl font-bold text-white">Регистрация успешна</h2>
            <p className="text-white/60">Перенаправляем на страницу входа...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <ParticleNetwork />
      <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/60 to-black/80" />

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          <Link to="/" className="inline-flex items-center gap-2 text-white/40 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">На главную</span>
          </Link>

          <div className="text-center space-y-3">
            <h1 className="text-3xl font-bold text-white">Регистрация</h1>
            <p className="text-white/60">Создайте аккаунт Phantom</p>
          </div>

          <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8">
            <form onSubmit={handleSignUp} className="space-y-4">
              {error && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30">
                  <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              <div>
                <label className="text-sm text-white/60 mb-2 block">Отображаемое имя</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Ваше имя"
                    className="w-full pl-10 pr-4 py-3 bg-white/[0.05] border border-white/10 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-phantom-purple transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-white/60 mb-2 block">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full pl-10 pr-4 py-3 bg-white/[0.05] border border-white/10 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-phantom-purple transition-colors"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-white/60 mb-2 block">Пароль</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Минимум 6 символов"
                    className="w-full pl-10 pr-12 py-3 bg-white/[0.05] border border-white/10 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-phantom-purple transition-colors"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-phantom-purple text-white font-semibold rounded-xl hover:bg-phantom-purple-deep transition-all hover:shadow-glow disabled:opacity-50"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Регистрация...
                  </div>
                ) : (
                  'Зарегистрироваться'
                )}
              </button>

              <p className="text-center text-sm text-white/40">
                Уже есть аккаунт?{' '}
                <Link to="/auth/login" className="text-phantom-purple hover:underline">
                  Войти
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
