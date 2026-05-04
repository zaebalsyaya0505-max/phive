import { useRef, useEffect } from 'react';
import { Link } from 'react-router';
import {
  Shield, Zap, Globe, Lock, Smartphone, Server,
  ChevronRight, Download, Play, Check, X,
  Video, Music, MessageCircle, Wallet, RefreshCw,
  Network, Eye, FileKey
} from 'lucide-react';
import ParticleNetwork from '@/components/sections/ParticleNetwork';

function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-end overflow-hidden bg-phantom-darkblue">
      <ParticleNetwork />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

      <div className="relative z-10 max-w-[1440px] mx-auto px-6 lg:px-10 pb-20 lg:pb-32 w-full">
        <div className="max-w-2xl">
          <div className="flex items-center gap-3 mb-6">
            <img src="/images/logo-light.png" alt="" className="w-10 h-10 opacity-60" />
            <span className="text-white/40 text-sm font-medium tracking-wider uppercase">Phantom Network</span>
          </div>
          <h1 className="text-5xl sm:text-6xl lg:text-[72px] font-bold text-white leading-[0.95] tracking-tight">
            Свобода контента
            <br />
            <span className="text-gradient">без границ</span>
          </h1>
          <p className="mt-6 text-xl lg:text-2xl text-white/70 font-normal">
            P2P Mesh / Phantom Hive Tunnel / Оптимизация Медиа
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              to="/download"
              className="inline-flex items-center gap-2 px-8 py-4 bg-phantom-purple text-white font-semibold rounded-lg hover:bg-phantom-purple-deep transition-all hover:shadow-glow"
            >
              <Download className="w-5 h-5" />
              Скачать для Android
            </Link>
            <button
              onClick={() => {
                const el = document.getElementById('screenshots');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="inline-flex items-center gap-2 px-8 py-4 border border-white/30 text-white font-semibold rounded-lg hover:border-phantom-purple hover:bg-phantom-purple/10 transition-all"
            >
              <Play className="w-5 h-5" />
              Смотреть демо
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function ProblemSolutionSection() {
  const sectionRef = useRef<HTMLDivElement>(null);

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
      { threshold: 0.2 }
    );

    const elements = sectionRef.current?.querySelectorAll('.animate-in');
    elements?.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="bg-black py-24 lg:py-32">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24">
          {/* Problem */}
          <div className="animate-in opacity-0 translate-y-8 transition-all duration-700">
            <div className="flex items-center gap-3 mb-6">
              <Eye className="w-6 h-6 text-phantom-red" />
              <span className="text-phantom-red text-sm font-semibold uppercase tracking-wider">Проблема</span>
            </div>
            <h2 className="text-3xl lg:text-[40px] font-bold text-white leading-tight mb-6">
              Ваш интернет
              <br />
              под контролем
            </h2>
            <p className="text-white/50 text-lg leading-relaxed">
              Государственные ограничения отрезают доступ к мессенджерам, видео и музыке.
              Системы глубокого анализа трафика контролируют каждое соединение,
              ограничивая свободу информации. Пользователи вынуждены искать
              сложные и ненадёжные способы получения контента.
            </p>
          </div>

          {/* Solution */}
          <div className="animate-in opacity-0 translate-y-8 transition-all duration-700 delay-200">
            <div className="flex items-center gap-3 mb-6">
              <Shield className="w-6 h-6 text-phantom-purple" />
              <span className="text-phantom-purple text-sm font-semibold uppercase tracking-wider">Решение</span>
            </div>
            <h2 className="text-3xl lg:text-[40px] font-bold text-white leading-tight mb-6">
              Phantom
              <br />
              открывает доступ
            </h2>
            <p className="text-white/50 text-lg leading-relaxed mb-8">
              Децентрализованная P2P Mesh-сеть со встроенным Phantom Hive Tunnel.
              Автоматические обновления даже без прямого подключения.
              TON-кошелёк и система P2P-платежей в одном приложении.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { icon: Lock, title: 'Phantom Hive Tunnel', desc: 'Пост-квантовая защита' },
                { icon: Zap, title: 'Smart Path', desc: 'Адаптивная маршрутизация' },
                { icon: Globe, title: 'P2P Mesh', desc: 'Децентрализованная сеть' },
              ].map((item) => (
                <div
                  key={item.title}
                  className="p-6 rounded-xl bg-white/[0.03] border border-white/5 hover:border-phantom-purple/30 hover:-translate-y-1 hover:shadow-glow transition-all duration-300"
                >
                  <item.icon className="w-8 h-8 text-phantom-purple mb-4" />
                  <h4 className="text-white font-bold text-base mb-1">{item.title}</h4>
                  <p className="text-white/50 text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  const sectionRef = useRef<HTMLDivElement>(null);

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

  const features = [
    {
      icon: Video,
      title: 'Phantom Stream',
      desc: 'Видеоконтент без ограничений',
      color: '#3B82F6',
      details: 'Доступ к видеоплатформам через P2Mesh-релеи. Буферизация минимальна благодаря распределённой сети узлов.',
    },
    {
      icon: Music,
      title: 'Phantom Audio',
      desc: 'Музыка без границ',
      color: '#10B981',
      details: 'Предоставляем доступ к музыкальным сервисам через защищённые туннели с пост-квантовым шифрованием.',
    },
    {
      icon: MessageCircle,
      title: 'Phantom Messenger',
      desc: 'Защищённые коммуникации',
      color: '#CA8A04',
      details: 'Signal Protocol v4 с E2EE. Сообщения работают стабильно даже при сетевых ограничениях.',
    },
  ];

  return (
    <section id="features" ref={sectionRef} className="bg-black py-24 lg:py-32">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-10">
        <div className="text-center mb-16 animate-in opacity-0 translate-y-8 transition-all duration-700">
          <h2 className="text-3xl lg:text-[48px] font-bold text-white mb-4">
            Всё в одном <span className="text-gradient">приложении</span>
          </h2>
          <p className="text-white/50 text-lg max-w-xl mx-auto">
            Медиаплатформа, защищённые коммуникации и криптокошелёк
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, i) => (
            <div
              key={feature.title}
              className="animate-in opacity-0 translate-y-8 transition-all duration-700 group"
              style={{ transitionDelay: `${200 + i * 100}ms` }}
            >
              <div
                className="relative p-8 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-all duration-300 hover:-translate-y-2"
              >
                <div
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ boxShadow: `inset 0 0 60px ${feature.color}10` }}
                />
                <div
                  className="w-16 h-16 rounded-xl flex items-center justify-center mb-6"
                  style={{ backgroundColor: `${feature.color}15` }}
                >
                  <feature.icon className="w-8 h-8" style={{ color: feature.color }} />
                </div>
                <h3 className="text-white text-2xl font-bold mb-2">{feature.title}</h3>
                <p className="text-white/70 text-base mb-4">{feature.desc}</p>
                <p className="text-white/40 text-sm leading-relaxed">{feature.details}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Additional features row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
          {[
            { icon: Wallet, title: 'TON Кошелёк', desc: 'P2P-платежи' },
            { icon: FileKey, title: 'Phantom Hive Tunnel', desc: 'TLS 1.4 + PQ Crypto' },
            { icon: RefreshCw, title: 'Автообновление', desc: 'P2Mesh-распространение' },
            { icon: Network, title: 'P2P Mesh', desc: 'Децентрализовано' },
          ].map((item, i) => (
            <div
              key={item.title}
              className="animate-in opacity-0 translate-y-8 transition-all duration-500 p-6 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-phantom-purple/20"
              style={{ transitionDelay: `${500 + i * 100}ms` }}
            >
              <item.icon className="w-6 h-6 text-phantom-purple mb-3" />
              <h4 className="text-white font-semibold text-sm mb-1">{item.title}</h4>
              <p className="text-white/40 text-xs">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ScreenshotsSection() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const screenshots = [
    { src: '/images/screenshot-wallet.jpg', label: 'TON Кошелёк' },
    { src: '/images/screenshot-video.jpg', label: 'Phantom Stream' },
    { src: '/images/screenshot-music.jpg', label: 'Phantom Audio' },
    { src: '/images/screenshot-p2p.jpg', label: 'P2P Mesh' },
    { src: '/images/screenshot-messenger.jpg', label: 'Phantom Messenger' },
    { src: '/images/screenshot-vpn.jpg', label: 'Phantom Hive Tunnel' },
  ];

  return (
    <section id="screenshots" className="bg-phantom-darkblue py-24 lg:py-32 overflow-hidden">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-10 mb-12">
        <h2 className="text-3xl lg:text-[48px] font-bold text-white mb-4">
          Как это <span className="text-gradient">выглядит</span>
        </h2>
        <p className="text-white/50 text-lg">
          Интерфейс Phantom — минималистичный, интуитивно понятный
        </p>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-6 overflow-x-auto pb-8 px-6 lg:px-10 scrollbar-hide"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {screenshots.map((shot) => (
          <div
            key={shot.label}
            className="flex-shrink-0 w-[280px] lg:w-[320px] rounded-2xl overflow-hidden border-2 border-phantom-purple/30 hover:border-phantom-purple transition-all duration-300 hover:shadow-glow-lg group"
            style={{ scrollSnapAlign: 'start' }}
          >
            <div className="relative">
              <img
                src={shot.src}
                alt={shot.label}
                className="w-full aspect-[9/16] object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                <span className="text-white font-semibold text-sm">{shot.label}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function MonetizationPreviewSection() {
  return (
    <section className="bg-black py-24 lg:py-32">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <span className="text-phantom-purple text-sm font-semibold uppercase tracking-wider mb-4 block">
              Монетизация
            </span>
            <h2 className="text-3xl lg:text-[56px] font-bold text-white leading-tight mb-6">
              Зарабатывайте
              <br />
              <span className="text-gradient">с Phantom</span>
            </h2>
            <p className="text-white/50 text-lg leading-relaxed mb-8">
              Подключайте свои офферы к аудитории из 100K+ ежедневных активных пользователей.
              CPA, CPM, RevShare — выбирайте модель, которая работает для вас.
            </p>
            <div className="flex flex-wrap gap-8 mb-10">
              {[
                { value: '100K+', label: 'DAU' },
                { value: '15%', label: 'ARPU рост' },
                { value: '50+', label: 'вертикалей' },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="text-3xl lg:text-[48px] font-bold text-phantom-purple">{stat.value}</div>
                  <div className="text-white/50 text-sm">{stat.label}</div>
                </div>
              ))}
            </div>
            <Link
              to="/advertise"
              className="inline-flex items-center gap-2 px-8 py-4 bg-phantom-purple text-white font-semibold rounded-lg hover:bg-phantom-purple-deep transition-all hover:shadow-glow"
            >
              Начать кампанию
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { title: 'CPA-модель', desc: 'Плати только за результат', icon: Zap },
              { title: 'RevShare', desc: 'Делим доход 50/50', icon: Wallet },
              { title: 'CPM', desc: 'Оплата за показы', icon: Eye },
              { title: 'ROI 300%+', desc: 'Средняя окупаемость', icon: Shield },
            ].map((item, i) => (
              <div
                key={item.title}
                className="p-6 rounded-xl glass glass-hover transition-all duration-300"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <item.icon className="w-6 h-6 text-phantom-purple mb-4" />
                <h4 className="text-white font-bold text-sm mb-1">{item.title}</h4>
                <p className="text-white/40 text-xs">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function SecuritySection() {
  const sectionRef = useRef<HTMLDivElement>(null);

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

  const protocols = [
    {
      name: 'TLS 1.4',
      desc: 'Perfect Forward Secrecy на каждое соединение',
      status: 'active',
    },
    {
      name: 'ML-KEM / ML-DSA',
      desc: 'Пост-квантовая криптография (стандарты NIST 2024)',
      status: 'active',
    },
    {
      name: 'Signal Protocol v4',
      desc: 'End-to-end encryption для мессенджера',
      status: 'active',
    },
    {
      name: 'Noise Protocol Framework',
      desc: 'Криптографический handshake для P2P Mesh',
      status: 'active',
    },
    {
      name: 'QUIC + HTTP/3',
      desc: 'Современный транспортный протокол',
      status: 'active',
    },
    {
      name: 'MLS',
      desc: 'Messaging Layer Security для групповых чатов',
      status: 'active',
    },
  ];

  return (
    <section ref={sectionRef} className="bg-phantom-darkblue py-24 lg:py-32">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-10">
        <div className="text-center mb-16 animate-in opacity-0 translate-y-8 transition-all duration-700">
          <span className="text-phantom-purple text-sm font-semibold uppercase tracking-wider mb-4 block">
            Протоколы апреля 2026
          </span>
          <h2 className="text-3xl lg:text-[48px] font-bold text-white mb-4">
            Современная <span className="text-gradient">криптография</span>
          </h2>
          <p className="text-white/50 text-lg max-w-xl mx-auto">
            Phantom использует передовые протоколы безопасности,
            включая пост-квантовую криптографию
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {protocols.map((protocol, i) => (
            <div
              key={protocol.name}
              className="animate-in opacity-0 translate-y-8 transition-all duration-500 p-6 rounded-xl glass glass-hover"
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="w-2 h-2 rounded-full bg-phantom-green" />
                <h4 className="text-white font-bold text-sm">{protocol.name}</h4>
              </div>
              <p className="text-white/50 text-sm">{protocol.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function RequirementsSection() {
  const platforms = [
    { name: 'Android', version: '7+', tunnel: true, smartpath: true, icon: Smartphone },
    { name: 'iOS', version: '14+', tunnel: true, smartpath: true, icon: Smartphone },
    { name: 'Windows', version: '10+', tunnel: true, smartpath: false, icon: Server },
    { name: 'macOS', version: '12+', tunnel: true, smartpath: false, icon: Server },
  ];

  return (
    <section className="bg-black py-24 lg:py-32">
      <div className="max-w-[800px] mx-auto px-6 lg:px-10">
        <h2 className="text-3xl lg:text-[40px] font-bold text-white text-center mb-12">
          Совместимость
        </h2>

        <div className="space-y-3">
          <div className="grid grid-cols-4 gap-4 px-6 py-3">
            <span className="text-white/30 text-xs uppercase tracking-wider font-semibold">Платформа</span>
            <span className="text-white/30 text-xs uppercase tracking-wider font-semibold text-center">Версия</span>
            <span className="text-white/30 text-xs uppercase tracking-wider font-semibold text-center">Phantom Hive Tunnel</span>
            <span className="text-white/30 text-xs uppercase tracking-wider font-semibold text-center">Smart Path</span>
          </div>

          {platforms.map((platform) => (
            <div
              key={platform.name}
              className="grid grid-cols-4 gap-4 px-6 py-4 rounded-lg bg-white/[0.03] hover:bg-white/[0.07] transition-colors items-center"
            >
              <div className="flex items-center gap-3">
                <platform.icon className="w-5 h-5 text-phantom-purple" />
                <span className="text-white font-medium">{platform.name}</span>
              </div>
              <span className="text-white/50 text-sm text-center">{platform.version}</span>
              <div className="flex justify-center">
                {platform.tunnel ? (
                  <Check className="w-5 h-5 text-phantom-purple" />
                ) : (
                  <X className="w-5 h-5 text-phantom-red" />
                )}
              </div>
              <div className="flex justify-center">
                {platform.smartpath ? (
                  <Check className="w-5 h-5 text-phantom-purple" />
                ) : (
                  <X className="w-5 h-5 text-phantom-red" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="bg-phantom-darkblue py-24 lg:py-32 relative overflow-hidden">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-phantom-purple/20 blur-[120px]" />
      </div>
      <div className="relative z-10 max-w-[800px] mx-auto px-6 lg:px-10 text-center">
        <h2 className="text-3xl lg:text-[56px] font-bold text-white leading-tight mb-6">
          Следуй за <span className="text-gradient">белым кроликом</span>
        </h2>
        <p className="text-white/50 text-lg mb-10 max-w-lg mx-auto">
          Скачайте pHive прямо сейчас и получите неограниченный доступ к контенту
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            to="/download"
            className="inline-flex items-center gap-2 px-10 py-5 bg-phantom-purple text-white font-semibold rounded-lg hover:bg-phantom-purple-deep transition-all hover:shadow-glow text-lg"
          >
            <Download className="w-6 h-6" />
            Скачать Phantom
          </Link>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 px-10 py-5 border border-white/30 text-white font-semibold rounded-lg hover:border-phantom-purple hover:bg-phantom-purple/10 transition-all text-lg"
          >
            Связаться с нами
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <div className="bg-black">
      <HeroSection />
      <ProblemSolutionSection />
      <FeaturesSection />
      <ScreenshotsSection />
      <SecuritySection />
      <MonetizationPreviewSection />
      <RequirementsSection />
      <CTASection />
    </div>
  );
}
