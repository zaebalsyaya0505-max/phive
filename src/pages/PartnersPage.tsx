import { useEffect, useRef } from 'react';
import {
  Server, Video, Code, Database, Globe,
  ArrowRight, Check, Layers, Cpu, Lock, Zap
} from 'lucide-react';

export default function PartnersPage() {
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

  const partnerTypes = [
    {
      icon: Server,
      title: 'P2P Mesh-узлы',
      desc: 'Подключите свой сервер к сети pHive и зарабатывайте на распределении трафика. Чем выше аптайм и пропускная способность — тем больше доход.',
      benefits: ['Пассивный доход', 'Низкие требования', 'Автоматические выплаты в TON'],
      cta: 'Подключить узел',
    },
    {
      icon: Video,
      title: 'Контент-провайдеры',
      desc: 'Размещайте видео и музыку в децентрализованной сети pHive. Ваш контент доступен пользователям по всему миру без ограничений.',
      benefits: ['Глобальный охват', 'Защита от ограничений', 'Монетизация просмотров'],
      cta: 'Разместить контент',
    },
    {
      icon: Code,
      title: 'API для разработчиков',
      desc: 'Интегрируйте pHive в свои приложения. REST API для управления Phantom Hive Tunnel, P2P Mesh-узлами и платежами.',
      benefits: ['REST API', 'WebSocket events', 'SDK для Android/iOS'],
      cta: 'Документация API',
    },
  ];

  const apiCode = `// Инициализация pHive SDK
import { PHiveSDK } from '@phive/sdk';

const phive = new PHiveSDK({
  apiKey: 'your_api_key',
  network: 'mainnet'
});

// Подключение Phantom Hive Tunnel
await phive.tunnel.connect({
  region: 'europe',
  protocol: 'wireguard'
});

// Отправка P2P-платежа
const tx = await phive.payments.send({
  recipient: 'EQD...xyz',
  amount: '10',
  currency: 'TON'
});

console.log('Transaction:', tx.hash);`;

  return (
    <div ref={sectionRef} className="bg-black pt-24">
      {/* Hero */}
      <section className="py-16 lg:py-24">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-10">
          <div className="animate-in opacity-0 translate-y-8 transition-all duration-700">
            <span className="text-phantom-purple text-sm font-semibold uppercase tracking-wider mb-4 block">
              Для партнёров
            </span>
            <h1 className="text-4xl lg:text-[72px] font-bold text-white leading-[0.95] tracking-tight mb-6">
              Расширяйте
              <br />
              <span className="text-gradient">экосистему</span>
            </h1>
            <p className="text-white/50 text-lg lg:text-xl max-w-xl leading-relaxed">
              Присоединяйтесь к децентрализованной сети pHive как поставщик инфраструктуры,
              контента или разработчик интеграций.
            </p>
          </div>
        </div>
      </section>

      {/* Partner Types */}
      <section className="py-24 lg:py-32">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {partnerTypes.map((type, i) => (
              <div
                key={type.title}
                className="animate-in opacity-0 translate-y-8 transition-all duration-700 p-8 rounded-2xl glass glass-hover"
                style={{ transitionDelay: `${i * 150}ms` }}
              >
                <div className="w-14 h-14 rounded-xl bg-phantom-purple/10 flex items-center justify-center mb-6">
                  <type.icon className="w-7 h-7 text-phantom-purple" />
                </div>
                <h3 className="text-white text-2xl font-bold mb-4">{type.title}</h3>
                <p className="text-white/50 text-base leading-relaxed mb-6">{type.desc}</p>
                <ul className="space-y-2 mb-8">
                  {type.benefits.map((b) => (
                    <li key={b} className="flex items-center gap-2 text-white/70 text-sm">
                      <Check className="w-4 h-4 text-phantom-purple flex-shrink-0" />
                      {b}
                    </li>
                  ))}
                </ul>
                <button className="inline-flex items-center gap-2 text-phantom-purple font-semibold text-sm hover:gap-3 transition-all">
                  {type.cta}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* API Section */}
      <section className="py-24 lg:py-32 bg-phantom-darkblue">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="animate-in opacity-0 translate-y-8 transition-all duration-700">
              <span className="text-phantom-purple text-sm font-semibold uppercase tracking-wider mb-4 block">
                API
              </span>
              <h2 className="text-3xl lg:text-[40px] font-bold text-white mb-6">
                Мощный <span className="text-gradient">SDK</span> для разработчиков
              </h2>
              <p className="text-white/50 text-lg leading-relaxed mb-8">
                Полный доступ к функциям pHive через REST API и JavaScript SDK.
                Управляйте Phantom Hive Tunnel, P2P Mesh-узлами и платежами программно.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: Layers, label: 'REST API v2' },
                  { icon: Cpu, label: 'WebSocket' },
                  { icon: Lock, label: 'OAuth 2.0' },
                  { icon: Zap, label: '99.9% Uptime' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.03]">
                    <item.icon className="w-5 h-5 text-phantom-purple" />
                    <span className="text-white text-sm font-medium">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="animate-in opacity-0 translate-y-8 transition-all duration-700 delay-200">
              <div className="rounded-2xl overflow-hidden bg-[#0d1117] border border-white/10">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                  <span className="text-white/30 text-xs ml-2">phantom-sdk.js</span>
                </div>
                <pre className="p-6 overflow-x-auto">
                  <code className="text-sm leading-relaxed" style={{ color: '#A78BFA' }}>
                    {apiCode}
                  </code>
                </pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Network Stats */}
      <section className="py-24 lg:py-32">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-10">
          <h2 className="text-3xl lg:text-[40px] font-bold text-white text-center mb-12 animate-in opacity-0 translate-y-8 transition-all duration-700">
            Сеть <span className="text-gradient">pHive</span>
          </h2>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Globe, value: '50+', label: 'Стран' },
              { icon: Server, value: '12K+', label: 'Активных узлов' },
              { icon: Database, value: '2.5 PB', label: 'Трафика/месяц' },
              { icon: Zap, value: '<50ms', label: 'Средняя задержка' },
            ].map((stat, i) => (
              <div
                key={stat.label}
                className="animate-in opacity-0 translate-y-8 transition-all duration-700 text-center p-8 rounded-2xl glass"
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <stat.icon className="w-8 h-8 text-phantom-purple mx-auto mb-4" />
                <div className="text-white text-3xl lg:text-[40px] font-bold">{stat.value}</div>
                <div className="text-white/50 text-sm mt-2">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How to Connect */}
      <section className="py-24 lg:py-32 bg-phantom-darkblue">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-10">
          <h2 className="text-3xl lg:text-[40px] font-bold text-white mb-12 animate-in opacity-0 translate-y-8 transition-all duration-700">
            Как подключиться
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { step: '01', title: 'Заявка', desc: 'Заполните форму партнёра на сайте' },
              { step: '02', title: 'Верификация', desc: 'Мы проверяем вашу инфраструктуру' },
              { step: '03', title: 'Интеграция', desc: 'Подключаем по API или SDK' },
              { step: '04', title: 'Запуск', desc: 'Начинаете зарабатывать на трафике' },
            ].map((item, i) => (
              <div
                key={item.step}
                className="animate-in opacity-0 translate-y-8 transition-all duration-700 relative"
                style={{ transitionDelay: `${i * 150}ms` }}
              >
                {i < 3 && (
                  <div className="hidden md:block absolute top-8 left-full w-full h-px bg-gradient-to-r from-phantom-purple/50 to-transparent" />
                )}
                <div className="text-phantom-purple text-sm font-bold mb-3">{item.step}</div>
                <h3 className="text-white text-xl font-bold mb-2">{item.title}</h3>
                <p className="text-white/50 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 lg:py-32">
        <div className="max-w-[800px] mx-auto px-6 lg:px-10 text-center">
          <h2 className="text-3xl lg:text-[48px] font-bold text-white mb-6">
            Станьте частью <span className="text-gradient">сети</span>
          </h2>
          <p className="text-white/50 text-lg mb-10">
            Подайте заявку на партнёрство и начните зарабатывать вместе с pHive
          </p>
          <a
            href="mailto:partners@phive.net"
            className="inline-flex items-center gap-2 px-10 py-5 bg-phantom-purple text-white font-semibold rounded-lg hover:bg-phantom-purple-deep transition-all hover:shadow-glow text-lg"
          >
            Подать заявку
            <ArrowRight className="w-5 h-5" />
          </a>
        </div>
      </section>
    </div>
  );
}
