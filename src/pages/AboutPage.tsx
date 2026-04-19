import { useEffect, useRef } from 'react';
import {
  Shield, Globe, Zap, Lock, Code, Cpu,
  Radio, Users, Target, Heart,
  FileKey, Network, RefreshCw
} from 'lucide-react';

export default function AboutPage() {
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

  const values = [
    { icon: Shield, title: 'Приватность', desc: 'Мы не собираем и не продаём данные пользователей. Всё шифруется end-to-end через Signal Protocol v4.' },
    { icon: Globe, title: 'Свобода', desc: 'Информация должна быть доступна каждому, независимо от географии и политики.' },
    { icon: Zap, title: 'Децентрализация', desc: 'Ни одна точка отказа. Сеть работает даже если часть узлов недоступна.' },
    { icon: Lock, title: 'Безопасность', desc: 'Rust и Kotlin обеспечивают memory safety. Пост-квантовая криптография ML-KEM/ML-DSA защищает от будущих угроз.' },
  ];

  const team = [
    { name: 'Алексей В.', role: 'Founder & CEO', icon: Users },
    { name: 'Мария К.', role: 'CTO', icon: Code },
    { name: 'Дмитрий С.', role: 'Lead Engineer', icon: Cpu },
    { name: 'Анна П.', role: 'Product Manager', icon: Target },
  ];

  const techStack = [
    { name: 'Rust', desc: 'Ядро сети, Phantom Tunnel, криптография', color: '#DEA584' },
    { name: 'Kotlin', desc: 'Android приложение', color: '#7F52FF' },
    { name: 'Jetpack Compose', desc: 'UI фреймворк', color: '#3DDC84' },
    { name: 'TON', desc: 'Блокчейн и платежи', color: '#0088CC' },
    { name: 'ML-KEM', desc: 'Пост-квантовый обмен ключами (NIST)', color: '#FF6B6B' },
    { name: 'Signal v4', desc: 'E2EE для мессенджера', color: '#A78BFA' },
  ];

  const roadmap = [
    { quarter: 'Q1 2026', title: 'Запуск v2.0', desc: 'Полная переработка ядра на Rust, пост-квантовая криптография, Smart Path', status: 'current' },
    { quarter: 'Q2 2026', title: 'iOS клиент', desc: 'Нативное приложение для iPhone и iPad', status: 'upcoming' },
    { quarter: 'Q3 2026', title: 'Desktop', desc: 'Клиенты для Windows и macOS', status: 'upcoming' },
    { quarter: 'Q4 2026', title: 'Экосистема', desc: 'Полноценная рекламная сеть и маркетплейс', status: 'upcoming' },
  ];

  return (
    <div ref={sectionRef} className="bg-black pt-24">
      {/* Hero */}
      <section className="py-16 lg:py-24">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-10">
          <div className="animate-in opacity-0 translate-y-8 transition-all duration-700">
            <span className="text-phantom-purple text-sm font-semibold uppercase tracking-wider mb-4 block">
              О проекте
            </span>
            <h1 className="text-4xl lg:text-[72px] font-bold text-white leading-[0.95] tracking-tight mb-6">
              Строим
              <br />
              <span className="text-gradient">свободный интернет</span>
            </h1>
            <p className="text-white/50 text-lg lg:text-xl max-w-2xl leading-relaxed">
              Phantom родился из идеи, что доступ к информации — это базовое право человека.
              Мы создаём децентрализованную инфраструктуру на базе P2P Mesh,
              которая делает интернет свободным, приватным и устойчивым к ограничениям.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-24 lg:py-32">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-10">
          <h2 className="text-3xl lg:text-[40px] font-bold text-white mb-12 animate-in opacity-0 translate-y-8 transition-all duration-700">
            Наши <span className="text-gradient">ценности</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {values.map((v, i) => (
              <div
                key={v.title}
                className="animate-in opacity-0 translate-y-8 transition-all duration-700 p-8 rounded-2xl glass glass-hover"
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <v.icon className="w-8 h-8 text-phantom-purple mb-4" />
                <h3 className="text-white text-xl font-bold mb-2">{v.title}</h3>
                <p className="text-white/50 text-base leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="py-24 lg:py-32 bg-phantom-darkblue">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <div className="animate-in opacity-0 translate-y-8 transition-all duration-700">
              <h2 className="text-3xl lg:text-[40px] font-bold text-white mb-6">
                Технологический <span className="text-gradient">стек</span>
              </h2>
              <p className="text-white/50 text-lg leading-relaxed mb-8">
                Мы используем современные языки и фреймворки, которые обеспечивают
                безопасность, производительность и надёжность.
              </p>
              <div className="space-y-4">
                {techStack.map((tech) => (
                  <div key={tech.name} className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.03]">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold"
                      style={{ backgroundColor: `${tech.color}20`, color: tech.color }}
                    >
                      {tech.name[0]}
                    </div>
                    <div>
                      <div className="text-white font-semibold text-sm">{tech.name}</div>
                      <div className="text-white/40 text-xs">{tech.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="animate-in opacity-0 translate-y-8 transition-all duration-700 delay-200">
              <div className="p-8 rounded-2xl glass">
                <h3 className="text-white text-xl font-bold mb-6">Архитектура</h3>
                <div className="space-y-6">
                  {[
                    { icon: Network, label: 'P2P Mesh Overlay', desc: 'Децентрализованная маршрутизация' },
                    { icon: FileKey, label: 'Phantom Tunnel', desc: 'TLS 1.4 + пост-квантовая криптография' },
                    { icon: Radio, label: 'Smart Path', desc: 'Адаптивная маршрутизация трафика' },
                    { icon: RefreshCw, label: 'Auto-Updater', desc: 'P2Mesh-распространение обновлений' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-phantom-purple/10 flex items-center justify-center flex-shrink-0">
                        <item.icon className="w-5 h-5 text-phantom-purple" />
                      </div>
                      <div>
                        <div className="text-white font-medium text-sm">{item.label}</div>
                        <div className="text-white/40 text-xs">{item.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Roadmap */}
      <section className="py-24 lg:py-32">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-10">
          <h2 className="text-3xl lg:text-[40px] font-bold text-white mb-12 animate-in opacity-0 translate-y-8 transition-all duration-700">
            Дорожная <span className="text-gradient">карта</span>
          </h2>

          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-px bg-white/10 hidden md:block" />
            <div className="space-y-8">
              {roadmap.map((item, i) => (
                <div
                  key={item.quarter}
                  className="animate-in opacity-0 translate-y-8 transition-all duration-700 relative md:pl-12"
                  style={{ transitionDelay: `${i * 150}ms` }}
                >
                  <div className={`absolute left-2 top-1 w-4 h-4 rounded-full border-2 hidden md:block ${
                    item.status === 'current'
                      ? 'bg-phantom-purple border-phantom-purple'
                      : 'bg-transparent border-white/30'
                  }`} />
                  <div className={`p-6 rounded-xl ${
                    item.status === 'current'
                      ? 'bg-phantom-purple/10 border border-phantom-purple/30'
                      : 'glass'
                  }`}>
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`text-sm font-bold ${
                        item.status === 'current' ? 'text-phantom-purple' : 'text-white/40'
                      }`}>{item.quarter}</span>
                      {item.status === 'current' && (
                        <span className="px-2 py-0.5 rounded-full bg-phantom-purple/20 text-phantom-purple text-xs font-semibold">
                          Текущий
                        </span>
                      )}
                    </div>
                    <h3 className="text-white font-bold text-lg mb-1">{item.title}</h3>
                    <p className="text-white/50 text-sm">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-24 lg:py-32 bg-phantom-darkblue">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-10">
          <h2 className="text-3xl lg:text-[40px] font-bold text-white text-center mb-12 animate-in opacity-0 translate-y-8 transition-all duration-700">
            Команда
          </h2>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map((member, i) => (
              <div
                key={member.name}
                className="animate-in opacity-0 translate-y-8 transition-all duration-700 text-center p-8 rounded-2xl glass glass-hover"
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <div className="w-16 h-16 rounded-full bg-phantom-purple/10 flex items-center justify-center mx-auto mb-4">
                  <member.icon className="w-8 h-8 text-phantom-purple" />
                </div>
                <h4 className="text-white font-bold mb-1">{member.name}</h4>
                <p className="text-white/50 text-sm">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 lg:py-32">
        <div className="max-w-[800px] mx-auto px-6 lg:px-10 text-center">
          <Heart className="w-12 h-12 text-phantom-purple mx-auto mb-6" />
          <h2 className="text-3xl lg:text-[48px] font-bold text-white mb-6">
            Присоединяйтесь к <span className="text-gradient">миссии</span>
          </h2>
          <p className="text-white/50 text-lg mb-10">
            Мы всегда ищем талантливых людей, которые разделяют наши ценности
          </p>
          <a
            href="mailto:careers@phantom.net"
            className="inline-flex items-center gap-2 px-10 py-5 bg-phantom-purple text-white font-semibold rounded-lg hover:bg-phantom-purple-deep transition-all hover:shadow-glow text-lg"
          >
            Открытые вакансии
          </a>
        </div>
      </section>
    </div>
  );
}
