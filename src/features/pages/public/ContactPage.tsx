import { useState, useEffect, useRef } from 'react';
import {
  Mail, MessageCircle, Send, CheckCircle2,
  Globe, AlertCircle
} from 'lucide-react';

export default function ContactPage() {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const contacts = [
    {
      icon: MessageCircle,
      label: 'Telegram',
      value: '@phantom_support',
      href: 'https://t.me/phantom_support',
      desc: 'Ответ за 5 минут',
    },
    {
      icon: Mail,
      label: 'Email',
      value: 'hello@phantom.net',
      href: 'mailto:hello@phantom.net',
      desc: 'Для общих вопросов',
    },
    {
      icon: Globe,
      label: 'Статус',
      value: 'Все системы работают',
      href: '#',
      desc: 'Мониторинг uptime',
    },
  ];

  return (
    <div ref={sectionRef} className="bg-black pt-24">
      {/* Hero */}
      <section className="py-16 lg:py-24">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-10">
          <div className="text-center max-w-2xl mx-auto animate-in opacity-0 translate-y-8 transition-all duration-700">
            <h1 className="text-4xl lg:text-[56px] font-bold text-white leading-tight mb-6">
              Свяжитесь с <span className="text-gradient">нами</span>
            </h1>
            <p className="text-white/50 text-lg">
              Есть вопросы или предложения? Мы всегда на связи через Telegram или email.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-12">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {contacts.map((contact, i) => (
              <a
                key={contact.label}
                href={contact.href}
                target="_blank"
                rel="noopener noreferrer"
                className="animate-in opacity-0 translate-y-8 transition-all duration-700 p-8 rounded-2xl glass glass-hover text-center group"
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <div className="w-14 h-14 rounded-xl bg-phantom-purple/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-phantom-purple/20 transition-colors">
                  <contact.icon className="w-7 h-7 text-phantom-purple" />
                </div>
                <h3 className="text-white font-bold mb-1">{contact.label}</h3>
                <p className="text-phantom-purple text-sm font-medium mb-1">{contact.value}</p>
                <p className="text-white/40 text-xs">{contact.desc}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Form */}
      <section className="py-24 lg:py-32">
        <div className="max-w-[600px] mx-auto px-6 lg:px-10">
          <div className="animate-in opacity-0 translate-y-8 transition-all duration-700 glass rounded-2xl p-8">
            {submitted ? (
              <div className="text-center py-12">
                <CheckCircle2 className="w-16 h-16 text-phantom-green mx-auto mb-4" />
                <h3 className="text-white text-2xl font-bold mb-2">Сообщение отправлено!</h3>
                <p className="text-white/50">Мы ответим вам в течение 24 часов.</p>
              </div>
            ) : (
              <>
                <h3 className="text-white text-xl font-bold mb-6">Форма обратной связи</h3>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="text-white/50 text-sm mb-2 block">Имя</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 bg-white/[0.05] border border-white/10 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-phantom-purple transition-colors"
                      placeholder="Ваше имя"
                    />
                  </div>
                  <div>
                    <label className="text-white/50 text-sm mb-2 block">Email</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 bg-white/[0.05] border border-white/10 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-phantom-purple transition-colors"
                      placeholder="your@email.com"
                    />
                  </div>
                  <div>
                    <label className="text-white/50 text-sm mb-2 block">Тема</label>
                    <select
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full px-4 py-3 bg-white/[0.05] border border-white/10 rounded-xl text-white focus:outline-none focus:border-phantom-purple transition-colors appearance-none"
                    >
                      <option value="" className="bg-black">Выберите тему</option>
                      <option value="general" className="bg-black">Общий вопрос</option>
                      <option value="support" className="bg-black">Техническая поддержка</option>
                      <option value="advertise" className="bg-black">Реклама</option>
                      <option value="partners" className="bg-black">Партнёрство</option>
                      <option value="bug" className="bg-black">Сообщить об ошибке</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-white/50 text-sm mb-2 block">Сообщение</label>
                    <textarea
                      required
                      rows={5}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full px-4 py-3 bg-white/[0.05] border border-white/10 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-phantom-purple transition-colors resize-none"
                      placeholder="Опишите ваш вопрос..."
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-4 bg-phantom-purple text-white font-semibold rounded-xl hover:bg-phantom-purple-deep transition-all hover:shadow-glow flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Отправить
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Status Banner */}
      <section className="py-12 pb-24">
        <div className="max-w-[800px] mx-auto px-6 lg:px-10">
          <div className="animate-in opacity-0 translate-y-8 transition-all duration-700 glass rounded-2xl p-6 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-phantom-green/10 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-phantom-green" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-phantom-green animate-pulse" />
                <span className="text-white font-medium text-sm">Все системы работают стабильно</span>
              </div>
              <p className="text-white/40 text-xs">
                Uptime: 99.97% · Последний инцидент: 45 дней назад
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
