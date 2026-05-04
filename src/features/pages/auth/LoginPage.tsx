import { useState, useCallback, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router";
import { useSupabase } from '@/providers/SupabaseProvider';
import { useTonConnectUI, useTonWallet } from "@tonconnect/ui-react";
import { Mail, Lock, Wallet, AlertTriangle, Eye, EyeOff, Zap, ArrowLeft } from 'lucide-react';
import ParticleNetwork from '@/components/sections/ParticleNetwork';
import { supabase } from '@/shared/lib/supabase/client';

const TON_WALLET_EMAIL_SUFFIX = '@phantom.ton';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSupabase();

  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();

  const [mode, setMode] = useState<'email' | 'ton'>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [tonConnecting, setTonConnecting] = useState(false);
  const [tonSigning, setTonSigning] = useState(false);

  useEffect(() => {
    if (user) {
      const from = (location.state as any)?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [user, navigate, location]);

  const handleEmailLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) throw signInError;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка входа');
    } finally {
      setLoading(false);
    }
  }, [email, password]);

  const bridgeTonToSupabase = useCallback(async (address: string, publicKey: string) => {
    const email = `ton-${address}${TON_WALLET_EMAIL_SUFFIX}`;
    const password = `ton_${address.slice(-8)}_${publicKey.slice(0, 8)}`;

    const { data: existingUsers } = await supabase
      .from('profiles')
      .select('id')
      .eq('ton_address', address)
      .limit(1);

    if (existingUsers && existingUsers.length > 0) {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) throw new Error('Ошибка входа через TON: ' + signInError.message);
      return;
    }

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { ton_address: address, ton_public_key: publicKey },
      },
    });

    if (signUpError) throw new Error('Ошибка регистрации TON: ' + signUpError.message);

    await supabase.auth.signInWithPassword({ email, password });
  }, []);

  const handleTonConnect = useCallback(async () => {
    setTonConnecting(true);
    setError(null);
    try {
      await tonConnectUI.connectWallet();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка подключения кошелька');
    } finally {
      setTonConnecting(false);
    }
  }, [tonConnectUI]);

  const handleTonLogin = useCallback(async () => {
    if (!wallet) return;
    setTonSigning(true);
    setError(null);

    try {
      await bridgeTonToSupabase(wallet.account.address, wallet.account.publicKey || '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка аутентификации TON');
    } finally {
      setTonSigning(false);
    }
  }, [wallet, bridgeTonToSupabase]);

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
            <h1 className="text-3xl font-bold text-white">Вход в <span className="text-gradient">Phantom</span></h1>
            <p className="text-white/60">Выберите способ входа</p>
          </div>

          <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8">
            <div className="flex gap-2 mb-6 p-1 bg-white/5 rounded-xl">
              <button
                onClick={() => { setMode('email'); setError(null); }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  mode === 'email'
                    ? 'bg-phantom-purple text-white'
                    : 'text-white/40 hover:text-white/60'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email
                </div>
              </button>
              <button
                onClick={() => { setMode('ton'); setError(null); }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  mode === 'ton'
                    ? 'bg-phantom-purple text-white'
                    : 'text-white/40 hover:text-white/60'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Wallet className="w-4 h-4" />
                  TON
                </div>
              </button>
            </div>

            {error && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30 mb-6">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {mode === 'email' ? (
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div>
                  <label className="text-sm text-white/60 mb-2 block">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@phantom.net"
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
                      placeholder="••••••••"
                      className="w-full pl-10 pr-12 py-3 bg-white/[0.05] border border-white/10 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-phantom-purple transition-colors"
                      required
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
                      Вход...
                    </div>
                  ) : (
                    'Войти'
                  )}
                </button>

                <p className="text-center text-sm text-white/40">
                  Нет аккаунта?{' '}
                  <Link to="/auth/signup" className="text-phantom-purple hover:underline">
                    Зарегистрироваться
                  </Link>
                </p>
              </form>
            ) : (
              <div className="space-y-4">
                {wallet ? (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <p className="text-xs text-white/40 mb-1">Кошелёк подключён:</p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-white/80">TON Wallet</span>
                        <span className="w-2 h-2 rounded-full bg-phantom-green animate-pulse" />
                      </div>
                      <p className="text-xs font-mono text-white/50 mt-2 break-all">
                        {wallet.account.address}
                      </p>
                    </div>

                    <button
                      onClick={handleTonLogin}
                      disabled={tonSigning}
                      className="w-full py-4 bg-phantom-purple text-white font-semibold rounded-xl hover:bg-phantom-purple-deep transition-all hover:shadow-glow disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {tonSigning ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Привязка...
                        </>
                      ) : (
                        <>
                          <Zap className="w-5 h-5" />
                          Войти через TON
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleTonConnect}
                    disabled={tonConnecting}
                    className="w-full py-4 bg-phantom-purple text-white font-semibold rounded-xl hover:bg-phantom-purple-deep transition-all hover:shadow-glow disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {tonConnecting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Подключение...
                      </>
                    ) : (
                      <>
                        <Wallet className="w-5 h-5" />
                        Подключить кошелёк
                      </>
                    )}
                  </button>
                )}

                <p className="text-xs text-center text-white/30">
                  При первом входе через TON будет автоматически создан аккаунт, привязанный к вашему кошельку.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
