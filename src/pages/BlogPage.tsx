import { useEffect, useRef } from 'react';
import {
  ArrowRight, Calendar, Clock, Shield, Wifi, Lock, Server
} from 'lucide-react';

export default function BlogPage() {
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

  const featuredPost = {
    title: 'Как работает DPI-байпас: технический разбор',
    excerpt: 'Deep Packet Inspection — один из главных инструментов цензуры в современном интернете. Разбираем, как Phantom обходит DPI-системы и защищает ваш трафик от анализа.',
    date: '12 января 2026',
    readTime: '8 минут',
    icon: Shield,
    category: 'Технологии',
  };

  const posts = [
    {
      title: 'P2P-сети: будущее интернета',
      excerpt: 'Почему децентрализованные сети становятся всё более важными в мире, где цензура усиливается с каждым днём.',
      date: '8 января 2026',
      readTime: '5 минут',
      icon: Wifi,
      category: 'P2P',
    },
    {
      title: 'TON-платежи в Phantom: безопасно и быстро',
      excerpt: 'Интеграция TON блокчейна позволяет совершать мгновенные P2P-платежи прямо в приложении.',
      date: '3 января 2026',
      readTime: '4 минуты',
      icon: Lock,
      category: 'Крипто',
    },
    {
      title: 'Запуск рекламной сети: возможности для рекламодателей',
      excerpt: 'Phantom открывает рекламную сеть с доступом к 100K+ активных пользователей ежедневно.',
      date: '28 декабря 2025',
      readTime: '6 минут',
      icon: Server,
      category: 'Монетизация',
    },
    {
      title: 'Приватность в 2026: угрозы и решения',
      excerpt: 'Обзор текущей ситуации с интернет-цензурой и инструменты для защиты приватности.',
      date: '20 декабря 2025',
      readTime: '7 минут',
      icon: Shield,
      category: 'Приватность',
    },
    {
      title: 'Rust в Phantom: почему мы выбрали этот язык',
      excerpt: 'Рассказываем, почему для ядра Phantom был выбран Rust и какие преимущества это даёт.',
      date: '15 декабря 2025',
      readTime: '10 минут',
      icon: Server,
      category: 'Разработка',
    },
    {
      title: 'Как обходят блокировки: гайд для пользователей',
      excerpt: 'Пошаговое руководство по использованию Phantom в странах с жёсткой интернет-цензурой.',
      date: '10 декабря 2025',
      readTime: '5 минут',
      icon: Wifi,
      category: 'Гайд',
    },
  ];

  return (
    <div ref={sectionRef} className="bg-black pt-24">
      {/* Hero */}
      <section className="py-16 lg:py-24">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-10">
          <div className="animate-in opacity-0 translate-y-8 transition-all duration-700">
            <span className="text-phantom-purple text-sm font-semibold uppercase tracking-wider mb-4 block">
              Блог
            </span>
            <h1 className="text-4xl lg:text-[56px] font-bold text-white leading-tight mb-6">
              Статьи о <span className="text-gradient">технологиях</span>,
              <br />
              приватности и P2P
            </h1>
          </div>
        </div>
      </section>

      {/* Featured Post */}
      <section className="pb-12">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-10">
          <div className="animate-in opacity-0 translate-y-8 transition-all duration-700 glass rounded-2xl overflow-hidden cursor-pointer glass-hover">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              <div className="p-10 lg:p-12 flex flex-col justify-center">
                <span className="inline-block px-3 py-1 rounded-full bg-phantom-purple/20 text-phantom-purple text-xs font-semibold w-fit mb-4">
                  {featuredPost.category}
                </span>
                <h2 className="text-white text-2xl lg:text-3xl font-bold mb-4">
                  {featuredPost.title}
                </h2>
                <p className="text-white/50 text-base leading-relaxed mb-6">
                  {featuredPost.excerpt}
                </p>
                <div className="flex items-center gap-4 text-white/30 text-sm mb-6">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {featuredPost.date}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {featuredPost.readTime}
                  </span>
                </div>
                <span className="inline-flex items-center gap-2 text-phantom-purple font-semibold text-sm">
                  Читать статью <ArrowRight className="w-4 h-4" />
                </span>
              </div>
              <div className="bg-phantom-darkblue flex items-center justify-center p-12">
                <featuredPost.icon className="w-32 h-32 text-phantom-purple/20" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Posts Grid */}
      <section className="py-12 pb-24">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post, i) => (
              <div
                key={post.title}
                className="animate-in opacity-0 translate-y-8 transition-all duration-700 p-8 rounded-2xl glass glass-hover cursor-pointer"
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-phantom-purple/10 flex items-center justify-center">
                    <post.icon className="w-5 h-5 text-phantom-purple" />
                  </div>
                  <span className="px-2 py-1 rounded-full bg-white/5 text-white/50 text-xs font-medium">
                    {post.category}
                  </span>
                </div>
                <h3 className="text-white font-bold text-lg mb-3 leading-tight">{post.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed mb-6">{post.excerpt}</p>
                <div className="flex items-center gap-4 text-white/30 text-xs">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {post.date}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {post.readTime}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
