import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router";
import { useTonConnectUI, useTonWallet } from "@tonconnect/ui-react";
import {
  Wallet, Shield, Zap, Lock, AlertTriangle,
  CheckCircle2, ChevronRight, Key, RefreshCw,
  Clock, Fingerprint
} from "lucide-react";
import ParticleNetwork from '@/components/sections/ParticleNetwork';
import { api, ApiError } from '@/shared/api';
import { supabase } from '@/shared/lib/supabase/client';

const TON_AUTH_TOKEN_KEY = "phantom_ton_token";
const TON_AUTH_USER_KEY = "phantom_ton_user";

interface TonAuthUser {
  address: string;
  publicKey: string;
  isPremium: boolean;
  role: string;
}

export default function TonLoginPage() {
  const navigate = useNavigate();
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();

  const [isConnecting, setIsConnecting] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [authUser, setAuthUser] = useState<TonAuthUser | null>(null);

  useEffect(() => {
    const token = localStorage.getItem(TON_AUTH_TOKEN_KEY);
    const userStr = localStorage.getItem(TON_AUTH_USER_KEY);
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr) as TonAuthUser;
        setAuthUser(user);
        setAuthenticated(true);
      } catch {
        localStorage.removeItem(TON_AUTH_TOKEN_KEY);
        localStorage.removeItem(TON_AUTH_USER_KEY);
      }
    }
  }, []);

  const syncProfileWithSupabase = useCallback(async (address: string, publicKey: string) => {
    try {
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('ton_address', address)
        .single();

      if (existing) return;

      const { data: session } = await supabase.auth.getSession();
      if (session?.session?.user) {
        await supabase
          .from('profiles')
          .update({ ton_address: address, ton_public_key: publicKey })
          .eq('id', session.session.user.id);
      }
    } catch {
      // Profile sync is non-critical — auth still works
    }
  }, []);

  const finalizeAuth = useCallback(async (walletAddress: string, walletPublicKey: string, walletChain: string) => {
    setIsSigning(true);
    setError(null);

    try {
      const nonce = crypto.randomUUID();
      const timestamp = Math.floor(Date.now() / 1000);

      const challenge = await api.post<{ payload: string }>(
        '/api/auth/ton/challenge',
        { address: walletAddress, domain: window.location.hostname, nonce, timestamp }
      );

      const result = await tonConnectUI.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 300,
        messages: [{
          address: walletAddress,
          amount: "0",
          payload: challenge.payload,
        }],
      });

      const proof = {
        address: walletAddress,
        network: walletChain,
        public_key: walletPublicKey,
        proof: {
          timestamp,
          domain: {
            lengthBytes: window.location.hostname.length,
            value: window.location.hostname,
          },
          payload: challenge.payload,
          signature: result.boc,
          state_init: "",
        },
      };

      const authResult = await api.post<{ token: string; user?: TonAuthUser }>('/api/auth/ton', proof);

      const user: TonAuthUser = authResult.user ?? {
        address: walletAddress,
        publicKey: walletPublicKey,
        isPremium: false,
        role: 'user',
      };

      localStorage.setItem(TON_AUTH_TOKEN_KEY, authResult.token);
      localStorage.setItem(TON_AUTH_USER_KEY, JSON.stringify(user));
      setAuthUser(user);
      setAuthenticated(true);

      await syncProfileWithSupabase(walletAddress, walletPublicKey);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(`Ошибка ${err.status}: ${err.message}`);
      } else {
        setError(err instanceof Error ? err.message : "Ошибка аутентификации");
      }
    } finally {
      setIsSigning(false);
    }
  }, [tonConnectUI, syncProfileWithSupabase]);

  const handleConnect = useCallback(async () => {
    setIsConnecting(true);
    setError(null);
    try {
      await tonConnectUI.connectWallet();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка подключения кошелька");
    } finally {
      setIsConnecting(false);
    }
  }, [tonConnectUI]);

  const handleSignAndLogin = useCallback(async () => {
    if (!wallet) return;
    await finalizeAuth(wallet.account.address, wallet.account.publicKey || "", String(wallet.account.chain));
  }, [wallet, finalizeAuth]);

  const handleDisconnect = useCallback(async () => {
    await tonConnectUI.disconnect();
    setAuthenticated(false);
    setAuthUser(null);
    localStorage.removeItem(TON_AUTH_TOKEN_KEY);
    localStorage.removeItem(TON_AUTH_USER_KEY);
  }, [tonConnectUI]);

  const securityFeatures = [
    { icon: Fingerprint, label: "Биометрия", desc: "Верификация кошельком" },
    { icon: Shield, label: "Шифрование", desc: "End-to-end" },
    { icon: Clock, label: "Ограничение", desc: "5 мин на challenge" },
    { icon: RefreshCw, label: "Обновление", desc: "Авто-рефреш сессии" },
  ];

  if (authenticated && authUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden">
        <ParticleNetwork />
        <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/60 to-black/80" />

        <div className="relative z-10 w-full max-w-md mx-4">
          <div className="bg-black/60 backdrop-blur-xl border border-phantom-purple/30 rounded-2xl p-8">
            <div className="text-center">
              <div className="mx-auto w-20 h-20 rounded-full bg-phantom-purple/20 flex items-center justify-center mb-6">
                <CheckCircle2 className="w-10 h-10 text-phantom-purple" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Аутентификация успешна
              </h2>
              <p className="text-white/60 mb-6">
                Ваш TON кошелёк подключён
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/10 mb-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-white/60">Кошелёк</span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  authUser.isPremium
                    ? "bg-amber-500/20 text-amber-400"
                    : "bg-white/10 text-white/60"
                }`}>
                  {authUser.isPremium ? "Premium" : "Free"}
                </span>
              </div>
              <p className="text-sm font-mono text-white/80 break-all">
                {authUser.address}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              {securityFeatures.map((feature, i) => (
                <div key={i} className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <feature.icon className="w-4 h-4 text-phantom-purple mb-1" />
                  <p className="text-xs text-white/80">{feature.label}</p>
                  <p className="text-[10px] text-white/40">{feature.desc}</p>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => navigate("/")}
                className="flex-1 py-4 bg-phantom-purple text-white font-semibold rounded-xl hover:bg-phantom-purple-deep transition-all hover:shadow-glow flex items-center justify-center gap-2"
              >
                Продолжить
                <ChevronRight className="w-5 h-5" />
              </button>
              <button
                onClick={handleDisconnect}
                className="px-4 py-4 border border-white/20 text-white/60 rounded-xl hover:bg-white/5 transition-all"
              >
                Выйти
              </button>
            </div>
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
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-phantom-purple/20 border border-phantom-purple/30">
              <Key className="w-12 h-12 text-phantom-purple" />
            </div>
            <h1 className="text-3xl font-bold text-white">TON Auth</h1>
            <p className="text-white/60">Web3 аутентификация через TON кошелёк</p>
          </div>

          <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-phantom-purple/20 flex items-center justify-center">
                <Wallet className="w-6 h-6 text-phantom-purple" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Подключить кошелёк</h2>
                <p className="text-white/60 text-sm">Выберите ваш TON кошелёк</p>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 mb-6">
              {securityFeatures.map((feature, i) => (
                <div key={i} className="text-center p-2 rounded-lg bg-white/5">
                  <feature.icon className="w-4 h-4 text-phantom-purple mx-auto mb-1" />
                  <p className="text-[10px] text-white/60">{feature.label}</p>
                </div>
              ))}
            </div>

            <div className="flex items-start gap-3 p-4 rounded-xl bg-phantom-purple/10 border border-phantom-purple/20 mb-6">
              <Shield className="w-5 h-5 text-phantom-purple shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="text-white font-medium">Challenge-Response протокол</p>
                <p className="text-white/60 mt-1">
                  Nonce генерируется криптографически. Приватный ключ никогда не покидает устройство.
                </p>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30 mb-6">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <div className="flex items-center gap-2 mb-6">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                !wallet
                  ? "bg-phantom-purple text-white"
                  : "bg-white/10 text-white/40"
              }`}>
                1. Connect
              </span>
              <ChevronRight className="w-4 h-4 text-white/30" />
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                wallet && !isSigning && !authenticated
                  ? "bg-phantom-purple text-white"
                  : "bg-white/10 text-white/40"
              }`}>
                2. Sign
              </span>
              <ChevronRight className="w-4 h-4 text-white/30" />
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                authenticated
                  ? "bg-phantom-purple text-white"
                  : "bg-white/10 text-white/40"
              }`}>
                3. Done
              </span>
            </div>

            {wallet ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <p className="text-xs text-white/40 mb-1">Подключено:</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/80">TON Wallet</span>
                    <span className="w-2 h-2 rounded-full bg-phantom-green animate-pulse" />
                  </div>
                  <p className="text-xs font-mono text-white/50 mt-2 break-all">
                    {wallet.account.address}
                  </p>
                </div>

                <button
                  onClick={handleSignAndLogin}
                  disabled={isSigning}
                  className="w-full py-4 bg-phantom-purple text-white font-semibold rounded-xl hover:bg-phantom-purple-deep transition-all hover:shadow-glow disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSigning ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Подписание...
                    </>
                  ) : (
                    <>
                      <Lock className="w-5 h-5" />
                      Подписать и войти
                    </>
                  )}
                </button>
              </div>
            ) : (
              <button
                onClick={handleConnect}
                disabled={isConnecting}
                className="w-full py-4 bg-phantom-purple text-white font-semibold rounded-xl hover:bg-phantom-purple-deep transition-all hover:shadow-glow disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isConnecting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Подключение...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    Подключить кошелёк
                  </>
                )}
              </button>
            )}

            <p className="text-xs text-center text-white/30 mt-6">
              Подключая кошелёк, вы соглашаетесь подписать challenge-сообщение для верификации владения кошельком. Средства не будут переведены.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
