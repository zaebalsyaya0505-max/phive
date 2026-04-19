import { useState, useEffect, useRef } from 'react';
import {
  Smartphone, Monitor, Apple, Check, Lock,
  Download, Calendar, FileText, ArrowRight, Copy, CheckCircle2
} from 'lucide-react';

export default function DownloadPage() {
  const [copied, setCopied] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('opacity-100', 'translate-y-0');
            entry.target.classList.remove('opacity-0', 'translate-y-8');
          }
        });
      },
      { threshold: 0.1 }
    );

    const elements = sectionRef.current?.querySelectorAll('.animate-in');
    elements?.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const platforms = [
    {
      icon: Smartphone,
      name: 'Android',
      ext: 'APK',
      version: '2.4.1',
      size: '24 MB',
      req: 'Android 7.0+',
      features: ['Phantom Hive Tunnel', 'Smart Path', 'P2P Mesh', 'TON кошелёк', 'Автообновление'],
      primary: true,
      url: '#download-android',
    },
    {
      icon: Apple,
      name: 'iOS',
      ext: 'IPA',
      version: '2.4.0',
      size: '32 MB',
      req: 'iOS 14.0+',
      features: ['Phantom Hive Tunnel', 'Smart Path', 'P2P Mesh', 'TON кошелёк'],
      primary: false,
      url: '#download-ios',
    },
    {
      icon: Monitor,
      name: 'Windows',
      ext: 'EXE',
      version: '2.3.2',
      size: '45 MB',
      req: 'Windows 10+',
      features: ['Phantom Hive Tunnel', 'P2P Mesh', 'TON кошелёк'],
      primary: false,
      url: '#download-windows',
    },
  ];

  const releases = [
    { version: 'v2.4.1', date: '15 апреля 2026', type: 'major', notes: 'Пост-квантовая криптография ML-KEM/ML-DSA, улучшена стабильность P2P Mesh' },
    { version: 'v2.4.0', date: '28 марта 2026', type: 'feature', notes: 'TON кошелёк 2.0, поддержка NFT, интеграция с DeFi' },
    { version: 'v2.3.2', date: '10 марта 2026', type: 'fix', notes: 'Исправлены утечки памяти, оптимизирована батарея' },
    { version: 'v2.3.1', date: '1 марта 2026', type: 'fix', notes: 'Hotfix: исправление падения при смене сети' },
    { version: 'v2.3.0', date: '20 февраля 2026', type: 'feature', notes: 'Рекламная сеть, монетизация для пользователей' },
  ];

  const handleCopyHash = () => {
    navigator.clipboard.writeText('sha256:a1b2c3d4e5f6...');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div ref={sectionRef} className="bg-black pt-24">
      {/* Hero */}
      <section className="py-16 lg:py-24">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-10 text-center">
          <div className="animate-in opacity-0 translate-y-8 transition-all duration-700">
            <Download className="w-12 h-12 text-phantom-purple mx-auto mb-6" />
            <h1 className="text-4xl lg:text-[72px] font-bold text-white leading-[0.95] tracking-tight mb-6">
              Скачать <span className="text-gradient">Phantom</span>
            </h1>
            <p className="text-white/50 text-lg max-w-xl mx-auto mb-4">
              Последняя версия: 2.4.1 от 15 апреля 2026
            </p>
            <div className="flex items-center justify-center gap-2 text-phantom-green text-sm">
              <CheckCircle2 className="w-4 h-4" />
              Все системы работают стабильно
            </div>
          </div>
        </div>
      </section>

      {/* Platforms */}
      <section className="py-12 pb-24">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {platforms.map((platform, i) => (
              <div
                key={platform.name}
                className={`animate-in opacity-0 translate-y-8 transition-all duration-700 p-8 rounded-2xl ${
                  platform.primary
                    ? 'bg-phantom-purple/10 border-2 border-phantom-purple'
                    : 'glass glass-hover'
                }`}
                style={{ transitionDelay: `${i * 150}ms` }}
              >
                {platform.primary && (
                  <div className="inline-block px-3 py-1 rounded-full bg-phantom-purple text-white text-xs font-semibold mb-4">
                    Рекомендуем
                  </div>
                )}
                <div className="flex items-center gap-4 mb-6">
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                    platform.primary ? 'bg-phantom-purple' : 'bg-white/5'
                  }`}>
                    <platform.icon className={`w-7 h-7 ${platform.primary ? 'text-white' : 'text-phantom-purple'}`} />
                  </div>
                  <div>
                    <h3 className="text-white text-xl font-bold">{platform.name}</h3>
                    <span className="text-white/40 text-sm">{platform.ext} · {platform.size}</span>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  {platform.features.map((f) => (
                    <div key={f} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-phantom-purple flex-shrink-0" />
                      <span className="text-white/70 text-sm">{f}</span>
                    </div>
                  ))}
                </div>

                <div className="text-white/40 text-xs mb-6">
                  Требования: {platform.req}
                </div>

                <button
                  className={`w-full py-4 rounded-xl font-semibold transition-all ${
                    platform.primary
                      ? 'bg-phantom-purple text-white hover:bg-phantom-purple-deep hover:shadow-glow'
                      : 'bg-white/5 text-white hover:bg-white/10'
                  }`}
                >
                  Скачать {platform.ext}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Note */}
      <section className="py-24 bg-phantom-darkblue">
        <div className="max-w-[800px] mx-auto px-6 lg:px-10">
          <div className="animate-in opacity-0 translate-y-8 transition-all duration-700 glass rounded-2xl p-8">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-phantom-purple/10 flex items-center justify-center flex-shrink-0">
                <Lock className="w-5 h-5 text-phantom-purple" />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-bold text-lg mb-2">Проверьте подлинность</h3>
                <p className="text-white/50 text-sm mb-4">
                  Всегда проверяйте SHA-256 хеш загруженного файла, чтобы убедиться в его подлинности.
                  Phantom использует цифровые подписи для верификации всех сборок.
                </p>
                <div className="flex items-center gap-3 p-4 rounded-xl bg-black/30">
                  <code className="text-phantom-purple text-sm font-mono flex-1 truncate">
                    sha256:a1b2c3d4e5f6789...
                  </code>
                  <button
                    onClick={handleCopyHash}
                    className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    {copied ? (
                      <CheckCircle2 className="w-5 h-5 text-phantom-green" />
                    ) : (
                      <Copy className="w-5 h-5 text-white/40" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Release Notes */}
      <section className="py-24">
        <div className="max-w-[800px] mx-auto px-6 lg:px-10">
          <h2 className="text-3xl lg:text-[40px] font-bold text-white mb-12 animate-in opacity-0 translate-y-8 transition-all duration-700">
            История <span className="text-gradient">обновлений</span>
          </h2>

          <div className="space-y-4">
            {releases.map((release, i) => (
              <div
                key={release.version}
                className="animate-in opacity-0 translate-y-8 transition-all duration-700 flex gap-4 p-6 rounded-xl glass"
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <div className="flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full ${
                    release.type === 'major' ? 'bg-phantom-purple' :
                    release.type === 'feature' ? 'bg-phantom-green' : 'bg-white/30'
                  }`} />
                  {i < releases.length - 1 && (
                    <div className="w-px flex-1 bg-white/10 mt-2" />
                  )}
                </div>
                <div className="flex-1 pb-4">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="text-white font-bold">{release.version}</h4>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      release.type === 'major' ? 'bg-phantom-purple/20 text-phantom-purple' :
                      release.type === 'feature' ? 'bg-phantom-green/20 text-phantom-green' :
                      'bg-white/5 text-white/40'
                    }`}>
                      {release.type === 'major' ? 'Major' : release.type === 'feature' ? 'Feature' : 'Fix'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-white/30 text-xs mb-2">
                    <Calendar className="w-3 h-3" />
                    {release.date}
                  </div>
                  <p className="text-white/60 text-sm">{release.notes}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Need Help */}
      <section className="py-24 bg-phantom-darkblue">
        <div className="max-w-[800px] mx-auto px-6 lg:px-10 text-center">
          <FileText className="w-10 h-10 text-phantom-purple mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-4">
            Нужна помощь с установкой?
          </h2>
          <p className="text-white/50 mb-6">
            Ознакомьтесь с подробным руководством или свяжитесь с поддержкой
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="/docs"
              className="inline-flex items-center gap-2 px-6 py-3 bg-phantom-purple text-white font-semibold rounded-lg hover:bg-phantom-purple-deep transition-all"
            >
              Документация
              <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 border border-white/20 text-white font-semibold rounded-lg hover:border-phantom-purple transition-all"
            >
              Поддержка
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
