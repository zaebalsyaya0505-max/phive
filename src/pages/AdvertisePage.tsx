import { useState, useRef, useEffect } from 'react';
import {
  TrendingUp, Users, Target, BarChart3, Globe,
  DollarSign, Check, ArrowRight,
  Bitcoin, Gamepad2, GraduationCap, Landmark,
  Zap, Shield
} from 'lucide-react';

function ROICalculator() {
  const [budget, setBudget] = useState(5000);
  const [model, setModel] = useState<'cpa' | 'cpm' | 'revshare'>('cpa');

  const installs = Math.floor(budget / 0.5);
  const revenueCPA = Math.floor(budget * 2.5);
  const impressions = Math.floor(budget * 200);
  const clicks = Math.floor(budget * 8);
  const users = Math.floor(budget / 2);
  const revenueRev = Math.floor(budget * 3);
  const roi = model === 'cpa' ? 250 : model === 'cpm' ? 180 : 300;

  return (
    <div className="glass rounded-2xl p-8">
      <h3 className="text-white text-xl font-bold mb-6">ROI Калькулятор</h3>

      <div className="flex gap-2 mb-8">
        {(['cpa', 'cpm', 'revshare'] as const).map((m) => (
          <button
            key={m}
            onClick={() => setModel(m)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
              model === m
                ? 'bg-phantom-purple text-white'
                : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'
            }`}
          >
            {m === 'cpa' ? 'CPA' : m === 'cpm' ? 'CPM' : 'RevShare'}
          </button>
        ))}
      </div>

      <div className="mb-8">
        <div className="flex justify-between mb-2">
          <span className="text-white/50 text-sm">Бюджет кампании</span>
          <span className="text-white font-bold">${budget.toLocaleString()}</span>
        </div>
        <input
          type="range"
          min={1000}
          max={50000}
          step={1000}
          value={budget}
          onChange={(e) => setBudget(Number(e.target.value))}
          className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-phantom-purple"
        />
        <div className="flex justify-between mt-1">
          <span className="text-white/30 text-xs">$1K</span>
          <span className="text-white/30 text-xs">$50K</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {model === 'cpa' && (
          <>
            <div className="p-4 rounded-xl bg-white/[0.03]">
              <div className="text-phantom-purple text-2xl font-bold">{installs.toLocaleString()}</div>
              <div className="text-white/40 text-xs mt-1">Установок</div>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.03]">
              <div className="text-phantom-green text-2xl font-bold">${revenueCPA.toLocaleString()}</div>
              <div className="text-white/40 text-xs mt-1">Прогноз дохода</div>
            </div>
          </>
        )}
        {model === 'cpm' && (
          <>
            <div className="p-4 rounded-xl bg-white/[0.03]">
              <div className="text-phantom-purple text-2xl font-bold">{impressions.toLocaleString()}</div>
              <div className="text-white/40 text-xs mt-1">Показов</div>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.03]">
              <div className="text-phantom-green text-2xl font-bold">{clicks.toLocaleString()}</div>
              <div className="text-white/40 text-xs mt-1">Кликов</div>
            </div>
          </>
        )}
        {model === 'revshare' && (
          <>
            <div className="p-4 rounded-xl bg-white/[0.03]">
              <div className="text-phantom-purple text-2xl font-bold">{users.toLocaleString()}</div>
              <div className="text-white/40 text-xs mt-1">Привлечено пользователей</div>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.03]">
              <div className="text-phantom-green text-2xl font-bold">${revenueRev.toLocaleString()}</div>
              <div className="text-white/40 text-xs mt-1">Доля дохода</div>
            </div>
          </>
        )}
        <div className="col-span-2 p-4 rounded-xl bg-phantom-purple/10 border border-phantom-purple/20">
          <div className="flex items-center justify-between">
            <span className="text-white/60 text-sm">Прогноз ROI</span>
            <span className="text-phantom-purple text-3xl font-bold">{roi}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdvertisePage() {
  const [activeTab, setActiveTab] = useState<'betting' | 'crypto' | 'fintech' | 'edtech'>('betting');
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

  const verticals = {
    betting: {
      icon: Gamepad2,
      label: 'Букмекеры',
      cr: '12%',
      epc: '$2.5',
      geo: 'СНГ, Бразилия, Индия',
      case: 'Кампания для букмекера: 50K установок, ROI 340%',
    },
    crypto: {
      icon: Bitcoin,
      label: 'Крипто-биржи',
      cr: '8%',
      epc: '$4.2',
      geo: 'Глобально',
      case: 'Листинг биржи: 30K регистраций, $180K выручка',
    },
    fintech: {
      icon: Landmark,
      label: 'Финтех',
      cr: '6%',
      epc: '$3.1',
      geo: 'СНГ, Азия',
      case: 'Кредитное приложение: 25K установок, ROI 280%',
    },
    edtech: {
      icon: GraduationCap,
      label: 'EdTech',
      cr: '10%',
      epc: '$1.8',
      geo: 'СНГ, Ближний Восток',
      case: 'Онлайн-курсы: 40K регистраций, CPA снижен на 35%',
    },
  };

  const v = verticals[activeTab];

  return (
    <div ref={sectionRef} className="bg-black pt-24">
      {/* Hero */}
      <section className="py-16 lg:py-24">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-10">
          <div className="animate-in opacity-0 translate-y-8 transition-all duration-700">
            <span className="text-phantom-purple text-sm font-semibold uppercase tracking-wider mb-4 block">
              Для рекламодателей
            </span>
            <h1 className="text-4xl lg:text-[72px] font-bold text-white leading-[0.95] tracking-tight mb-6">
              Монетизируйте
              <br />
              <span className="text-gradient">P2P-трафик</span>
            </h1>
            <p className="text-white/50 text-lg lg:text-xl max-w-xl leading-relaxed">
              Доступ к аудитории из 100K+ активных пользователей ежедневно.
              Гибкие модели оплаты: CPA, CPM, RevShare.
            </p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-y border-white/5">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { value: '100K+', label: 'DAU', icon: Users },
              { value: '15%', label: 'Средний ARPU рост', icon: TrendingUp },
              { value: '50+', label: 'Вертикалей', icon: Target },
              { value: '300%', label: 'Средний ROI', icon: BarChart3 },
            ].map((stat, i) => (
              <div
                key={stat.label}
                className="animate-in opacity-0 translate-y-8 transition-all duration-700"
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <stat.icon className="w-6 h-6 text-phantom-purple mb-3" />
                <div className="text-3xl lg:text-[48px] font-bold text-white">{stat.value}</div>
                <div className="text-white/50 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ROI Calculator + Pricing */}
      <section className="py-24 lg:py-32">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="animate-in opacity-0 translate-y-8 transition-all duration-700">
              <h2 className="text-3xl lg:text-[40px] font-bold text-white mb-6">
                Рассчитайте <span className="text-gradient">прибыль</span>
              </h2>
              <p className="text-white/50 text-lg mb-8">
                Используйте калькулятор для оценки потенциальной выручки от рекламной кампании в Phantom.
              </p>
              <div className="space-y-4">
                {[
                  { icon: DollarSign, text: 'Минимальный бюджет от $1,000' },
                  { icon: Globe, text: 'Гео: СНГ, Азия, Ближний Восток, ЛатАмерика' },
                  { icon: Zap, text: 'Запуск кампании за 24 часа' },
                  { icon: Shield, text: 'Антифрод-защита и верификация трафика' },
                ].map((item) => (
                  <div key={item.text} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-phantom-purple/10 flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-4 h-4 text-phantom-purple" />
                    </div>
                    <span className="text-white/70 text-sm">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="animate-in opacity-0 translate-y-8 transition-all duration-700 delay-200">
              <ROICalculator />
            </div>
          </div>
        </div>
      </section>

      {/* Verticals */}
      <section className="py-24 lg:py-32 bg-phantom-darkblue">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-10">
          <h2 className="text-3xl lg:text-[40px] font-bold text-white mb-8 animate-in opacity-0 translate-y-8 transition-all duration-700">
            Вертикали
          </h2>

          <div className="flex flex-wrap gap-2 mb-10 animate-in opacity-0 translate-y-8 transition-all duration-700">
            {(Object.keys(verticals) as Array<keyof typeof verticals>).map((key) => {
              const vert = verticals[key];
              return (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium transition-all ${
                    activeTab === key
                      ? 'bg-phantom-purple text-white'
                      : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <vert.icon className="w-4 h-4" />
                  {vert.label}
                </button>
              );
            })}
          </div>

          <div className="glass rounded-2xl p-8 animate-in opacity-0 translate-y-8 transition-all duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <div className="text-white/40 text-xs uppercase tracking-wider mb-2">Конверсия</div>
                <div className="text-white text-2xl font-bold">{v.cr}</div>
              </div>
              <div>
                <div className="text-white/40 text-xs uppercase tracking-wider mb-2">EPC</div>
                <div className="text-white text-2xl font-bold">{v.epc}</div>
              </div>
              <div>
                <div className="text-white/40 text-xs uppercase tracking-wider mb-2">География</div>
                <div className="text-white text-lg font-medium">{v.geo}</div>
              </div>
              <div>
                <div className="text-white/40 text-xs uppercase tracking-wider mb-2">Кейс</div>
                <div className="text-white/70 text-sm">{v.case}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cases */}
      <section className="py-24 lg:py-32">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-10">
          <h2 className="text-3xl lg:text-[40px] font-bold text-white mb-12 animate-in opacity-0 translate-y-8 transition-all duration-700">
            Кейсы
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: 'Криптобиржа DeFiX',
                metric: '340% ROI',
                desc: 'Кампания на CPA-модели привлекла 45K регистраций. Стоимость привлечения на 40% ниже, чем в Facebook.',
                tags: ['CPA', 'Крипто', 'СНГ'],
              },
              {
                title: 'Букмекер BetPro',
                metric: '$280K выручки',
                desc: 'RevShare кампания за 3 месяца. 80K установок, 25% конверсия в первый депозит.',
                tags: ['RevShare', 'Ставки', 'Бразилия'],
              },
              {
                title: 'EdTech Platform',
                metric: '-35% CPA',
                desc: 'Снижение стоимости привлечения студента на 35% по сравнению с другими источниками трафика.',
                tags: ['CPA', 'EdTech', 'СНГ'],
              },
            ].map((c, i) => (
              <div
                key={c.title}
                className="animate-in opacity-0 translate-y-8 transition-all duration-700 p-8 rounded-2xl glass glass-hover"
                style={{ transitionDelay: `${i * 150}ms` }}
              >
                <div className="flex items-center gap-2 mb-4">
                  {c.tags.map((tag) => (
                    <span key={tag} className="px-2 py-1 rounded-md bg-phantom-purple/10 text-phantom-purple text-xs font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
                <h3 className="text-white font-bold text-lg mb-2">{c.title}</h3>
                <div className="text-phantom-purple text-3xl font-bold mb-4">{c.metric}</div>
                <p className="text-white/50 text-sm leading-relaxed">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 lg:py-32 bg-phantom-darkblue">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-10">
          <h2 className="text-3xl lg:text-[40px] font-bold text-white text-center mb-12 animate-in opacity-0 translate-y-8 transition-all duration-700">
            Модели <span className="text-gradient">оплаты</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: 'CPA',
                desc: 'Оплата за действие',
                price: 'от $0.50',
                features: ['Установка приложения', 'Регистрация', 'Первый депозит', 'Персональный менеджер'],
                popular: false,
              },
              {
                name: 'CPM',
                desc: 'Оплата за показы',
                price: 'от $5',
                features: ['1,000 показов', 'Таргетинг по гео', 'Таргетинг по интересам', 'Real-time статистика'],
                popular: true,
              },
              {
                name: 'RevShare',
                desc: 'Делим доход',
                price: '50/50',
                features: ['Долгосрочное партнёрство', 'Высокий lifetime value', 'Ежемесячные выплаты', 'Приоритетная поддержка'],
                popular: false,
              },
            ].map((plan, i) => (
              <div
                key={plan.name}
                className={`animate-in opacity-0 translate-y-8 transition-all duration-700 relative p-8 rounded-2xl ${
                  plan.popular
                    ? 'bg-phantom-purple/10 border-2 border-phantom-purple'
                    : 'glass glass-hover'
                }`}
                style={{ transitionDelay: `${i * 150}ms` }}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-phantom-purple rounded-full text-white text-xs font-semibold">
                    Популярное
                  </div>
                )}
                <h3 className="text-white text-xl font-bold mb-1">{plan.name}</h3>
                <p className="text-white/50 text-sm mb-4">{plan.desc}</p>
                <div className="text-white text-3xl font-bold mb-6">{plan.price}</div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-white/70 text-sm">
                      <Check className="w-4 h-4 text-phantom-purple flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button className={`w-full py-3 rounded-lg font-semibold text-sm transition-all ${
                  plan.popular
                    ? 'bg-phantom-purple text-white hover:bg-phantom-purple-deep'
                    : 'bg-white/5 text-white hover:bg-white/10'
                }`}>
                  Выбрать
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 lg:py-32">
        <div className="max-w-[800px] mx-auto px-6 lg:px-10 text-center">
          <h2 className="text-3xl lg:text-[48px] font-bold text-white mb-6">
            Готовы <span className="text-gradient">начать</span>?
          </h2>
          <p className="text-white/50 text-lg mb-10">
            Свяжитесь с нашим менеджером для обсуждения деталей кампании
          </p>
          <a
            href="mailto:ads@phantom.net"
            className="inline-flex items-center gap-2 px-10 py-5 bg-phantom-purple text-white font-semibold rounded-lg hover:bg-phantom-purple-deep transition-all hover:shadow-glow text-lg"
          >
            Связаться с менеджером
            <ArrowRight className="w-5 h-5" />
          </a>
        </div>
      </section>
    </div>
  );
}
