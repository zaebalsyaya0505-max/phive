/**
 * TON Login Page
 * Web3 authentication via TON wallet with Challenge-Response protocol
 */

import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  Wallet, Shield, Zap, Lock, AlertTriangle,
  CheckCircle2, ChevronRight, Key, Eye, EyeOff,
  Clock, Fingerprint, RefreshCw
} from "lucide-react";
import ParticleNetwork from "../components/ParticleNetwork";
import { useTonAuth } from "../hooks/useTonAuth";

interface DemoWallet {
  label: string;
  address: string;
  publicKey: string;
}

const demoWallets: DemoWallet[] = [
  {
    label: "Wallet 1",
    address: "UQDRblFMJF5ZrXnzBbPJ6sZYxKfpWk1E5CQ-d2VlPSqfkOwE",
    publicKey: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
  },
  {
    label: "Wallet 2",
    address: "UQCTn7agoubqGyusmD4s5gY9XPSo0UtKwsCVLUfHnS1rVQny",
    publicKey: "fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210"
  }
];

export default function TonLoginPage() {
  const navigate = useNavigate();
  const { 
    user, 
    isAuthenticated, 
    isConnecting, 
    error, 
    connect, 
    disconnect
  } = useTonAuth();
  
  const [walletAddress, setWalletAddress] = useState("");
  const [publicKey, setPublicKey] = useState("");
  const [showPublicKey, setShowPublicKey] = useState(false);
  const [step, setStep] = useState<"connect" | "sign" | "complete">("connect");

  // Update step based on connection state
  useEffect(() => {
    if (isConnecting) {
      setStep("sign");
    } else if (isAuthenticated) {
      setStep("complete");
    } else {
      setStep("connect");
    }
  }, [isConnecting, isAuthenticated]);

  const handleConnect = useCallback(async () => {
    if (!walletAddress.trim() || !publicKey.trim()) {
      return;
    }

    try {
      await connect(walletAddress.trim(), publicKey.trim());
    } catch {
      // Error is handled by the hook
    }
  }, [walletAddress, publicKey, connect]);

  const handleDisconnect = useCallback(() => {
    disconnect();
    setWalletAddress("");
    setPublicKey("");
    setStep("connect");
  }, [disconnect]);

  // Security features display
  const securityFeatures = [
    { icon: Fingerprint, label: "Biometric", desc: "Wallet-based verification" },
    { icon: Shield, label: "Encrypted", desc: "End-to-end encryption" },
    { icon: Clock, label: "Time-limited", desc: "5 min challenge window" },
    { icon: RefreshCw, label: "Auto-refresh", desc: "Session renewal" },
  ];

  if (isAuthenticated && user) {
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
                  user.isPremium 
                    ? "bg-amber-500/20 text-amber-400" 
                    : "bg-white/10 text-white/60"
                }`}>
                  {user.isPremium ? "Premium" : "Free"}
                </span>
              </div>
              <p className="text-sm font-mono text-white/80 break-all">
                {user.address}
              </p>
            </div>

            {/* Security status */}
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
          {/* Logo */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-phantom-purple/20 border border-phantom-purple/30">
              <Key className="w-12 h-12 text-phantom-purple" />
            </div>
            <h1 className="text-3xl font-bold text-white">TON Auth</h1>
            <p className="text-white/60">Web3 аутентификация через TON кошелёк</p>
          </div>

          <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-phantom-purple/20 flex items-center justify-center">
                <Wallet className="w-6 h-6 text-phantom-purple" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Подключить кошелёк</h2>
                <p className="text-white/60 text-sm">Войдите через TON кошелёк</p>
              </div>
            </div>

            {/* Security Features */}
            <div className="grid grid-cols-4 gap-2 mb-6">
              {securityFeatures.map((feature, i) => (
                <div key={i} className="text-center p-2 rounded-lg bg-white/5">
                  <feature.icon className="w-4 h-4 text-phantom-purple mx-auto mb-1" />
                  <p className="text-[10px] text-white/60">{feature.label}</p>
                </div>
              ))}
            </div>

            {/* Security info */}
            <div className="flex items-start gap-3 p-4 rounded-xl bg-phantom-purple/10 border border-phantom-purple/20 mb-6">
              <Shield className="w-5 h-5 text-phantom-purple shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="text-white font-medium">Challenge-Response протокол</p>
                <p className="text-white/60 mt-1">
                  Nonce генерируется криптографически. Приватный ключ никогда не покидает устройство.
                </p>
              </div>
            </div>

            {/* Error display */}
            {error && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30 mb-6">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {/* Step indicator */}
            <div className="flex items-center gap-2 mb-6">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                step === "connect" 
                  ? "bg-phantom-purple text-white" 
                  : "bg-white/10 text-white/40"
              }`}>
                1. Connect
              </span>
              <ChevronRight className="w-4 h-4 text-white/30" />
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                step === "sign" 
                  ? "bg-phantom-purple text-white" 
                  : "bg-white/10 text-white/40"
              }`}>
                2. Sign
              </span>
              <ChevronRight className="w-4 h-4 text-white/30" />
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                step === "complete" 
                  ? "bg-phantom-purple text-white" 
                  : "bg-white/10 text-white/40"
              }`}>
                3. Done
              </span>
            </div>

            {/* Input fields */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="text-sm font-medium text-white/80 mb-2 block">
                  TON адрес кошелька
                </label>
                <input
                  type="text"
                  placeholder="EQ... или UQ..."
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-phantom-purple/50 focus:border-phantom-purple/50 transition-all"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-white/80 mb-2 block">
                  Public Key (hex)
                </label>
                <div className="relative">
                  <input
                    type={showPublicKey ? "text" : "password"}
                    placeholder="a1b2c3d4..."
                    value={publicKey}
                    onChange={(e) => setPublicKey(e.target.value)}
                    className="w-full px-4 py-3 pr-12 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-phantom-purple/50 focus:border-phantom-purple/50 transition-all font-mono text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPublicKey(!showPublicKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60"
                  >
                    {showPublicKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Connect button */}
            <button
              onClick={handleConnect}
              disabled={isConnecting || !walletAddress.trim() || !publicKey.trim()}
              className="w-full py-4 bg-phantom-purple text-white font-semibold rounded-xl hover:bg-phantom-purple-deep transition-all hover:shadow-glow disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isConnecting ? (
                <span className="flex items-center gap-2">
                  <Zap className="w-5 h-5 animate-pulse" />
                  Подписание...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  Аутентифицировать через TON
                </span>
              )}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-white/40 text-sm">или</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* Demo wallets */}
            <div className="space-y-3">
              <p className="text-xs text-white/40 uppercase tracking-wider font-medium">
                Demo кошельки (для тестирования)
              </p>
              {demoWallets.map((wallet) => (
                <button
                  key={wallet.label}
                  onClick={() => {
                    setWalletAddress(wallet.address);
                    setPublicKey(wallet.publicKey);
                  }}
                  className="w-full p-4 rounded-xl bg-white/5 border border-white/10 hover:border-phantom-purple/30 hover:bg-white/10 transition-all text-left"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-white">
                      {wallet.label}
                    </span>
                    <ChevronRight className="w-4 h-4 text-white/40" />
                  </div>
                  <p className="text-xs text-white/40 mt-2 font-mono truncate">
                    {wallet.address}
                  </p>
                </button>
              ))}
            </div>

            {/* Info */}
            <p className="text-xs text-center text-white/30 mt-6">
              Подключая кошелёк, вы соглашаетесь подписать challenge-сообщение для верификации владения кошельком. Средства не будут переведены.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}