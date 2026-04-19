import { useState, useEffect, useRef } from 'react';
import {
  BookOpen, HelpCircle, Code, ChevronRight, ChevronDown,
  Search, Shield, Smartphone, Server, Wallet, Globe, Zap
} from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

const faqData: Record<string, FAQItem[]> = {
  users: [
    {
      question: 'Как установить Phantom на Android?',
      answer: 'Скачайте APK-файл со страницы загрузки. Разрешите установку из неизвестных источников в настройках устройства. Откройте APK и следуйте инструкциям установщика. Приложение готово к использованию сразу после установки.',
    },
    {
      question: 'Как работает Phantom Hive Tunnel?',
      answer: 'Phantom Hive Tunnel создаёт защищённое соединение с использованием TLS 1.4 и пост-квантовой криптографии ML-KEM. Нажмите кнопку «Подключить» на главном экране — приложение автоматически выберет оптимальный маршрут через P2P Mesh-сеть.',
    },
    {
      question: 'Что делать, если Smart Path не работает?',
      answer: 'Попробуйте следующее: 1) Обновите приложение до последней версии. 2) В настройках включите режим «Адаптивный». 3) Смените порт подключения на 443 или 8443. 4) Если ничего не помогает — свяжитесь с поддержкой через Telegram.',
    },
    {
      question: 'Как работают автообновления без интернета?',
      answer: 'Phantom использует P2P Mesh-сеть для распространения обновлений. Даже если ваш провайдер ограничивает доступ к серверам обновлений, приложение получает новые версии через других пользователей сети — напрямую, без центрального сервера.',
    },
    {
      question: 'Как создать TON-кошелёк?',
      answer: 'В приложении перейдите в раздел «Кошелёк» и нажмите «Создать кошелёк». Запишите seed-фразу из 24 слов и храните её в безопасном месте. Кошелёк готов к использованию — вы можете отправлять и получать TON.',
    },
    {
      question: 'Насколько безопасен Phantom?',
      answer: 'Phantom использует TLS 1.4 с Perfect Forward Secrecy, пост-квантовую криптографию ML-KEM/ML-DSA (стандарты NIST 2024), и Signal Protocol v4 для end-to-end шифрования сообщений. Мы не собираем логи активности и не храним данные пользователей на центральных серверах.',
    },
  ],
  advertisers: [
    {
      question: 'Как начать рекламную кампанию?',
      answer: 'Свяжитесь с нашим менеджером через форму на странице монетизации. Мы обсудим ваши цели, подберём оптимальную модель (CPA/CPM/RevShare) и запустим кампанию в течение 24 часов.',
    },
    {
      question: 'Какие вертикали работают лучше всего?',
      answer: 'Наиболее эффективные вертикали: *** (ROI 300%+), *** (CR 12%), финтех-приложения (CR 6%), EdTech (CR 10%). География: СНГ, Бразилия, Индия, страны Ближнего Востока.',
    },
    {
      question: 'Как отслеживать результаты кампании?',
      answer: 'В личном кабинете рекламодателя доступна real-time аналитика: количество показов, кликов, установок, конверсий. Интеграция с AppsFlyer, Adjust и собственным postback-URL.',
    },
    {
      question: 'Какие гео доступны?',
      answer: 'Phantom работает в 50+ странах. Наибольшая концентрация пользователей в СНГ, Азии, Ближнем Востоке и Латинской Америке. Можно настроить таргетинг по стране, городу и даже провайдеру.',
    },
  ],
  developers: [
    {
      question: 'Как получить API-ключ?',
      answer: 'Зарегистрируйтесь как партнёр на странице partners.phantom.net. После верификации вам будет выдан API-ключ с доступом к выбранным эндпоинтам.',
    },
    {
      question: 'Есть ли SDK для мобильных платформ?',
      answer: 'Да. Мы предоставляем нативные SDK для Android (Kotlin) и iOS (Swift), а также React Native и Flutter обёртки. SDK включает управление Phantom Hive Tunnel, P2P Mesh-функции и платежи.',
    },
    {
      question: 'Как работает WebSocket API?',
      answer: 'WebSocket API предоставляет real-time события: подключение/отключение Phantom Hive Tunnel, изменение статуса P2P Mesh-узла, входящие платежи. Endpoint: wss://api.phive.net/v2/ws. Авторизация через Bearer token.',
    },
    {
      question: 'Какие лимиты у API?',
      answer: 'Базовый тариф: 1,000 запросов/минуту. Pro тариф: 10,000 запросов/минуту. Enterprise: безлимитно. Лимиты применяются per API key.',
    },
  ],
};

function AccordionItem({ item, isOpen, onClick }: { item: FAQItem; isOpen: boolean; onClick: () => void }) {
  return (
    <div className="rounded-lg bg-white/[0.03] overflow-hidden">
      <button
        onClick={onClick}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-white/[0.05] transition-colors"
      >
        <span className="text-white font-medium text-base pr-4">{item.question}</span>
        {isOpen ? (
          <ChevronDown className="w-5 h-5 text-phantom-purple flex-shrink-0" />
        ) : (
          <ChevronRight className="w-5 h-5 text-white/40 flex-shrink-0" />
        )}
      </button>
      {isOpen && (
        <div className="px-5 pb-5">
          <p className="text-white/50 text-sm leading-relaxed">{item.answer}</p>
        </div>
      )}
    </div>
  );
}

export default function DocsPage() {
  const [activeTab, setActiveTab] = useState<'users' | 'advertisers' | 'developers'>('users');
  const [openIndex, setOpenIndex] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState('');
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    setOpenIndex(0);
  }, [activeTab]);

  const filteredFAQ = faqData[activeTab].filter(
    (item) =>
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const tabs = [
    { key: 'users' as const, label: 'Для пользователей', icon: Smartphone },
    { key: 'advertisers' as const, label: 'Для рекламодателей', icon: Globe },
    { key: 'developers' as const, label: 'Для разработчиков', icon: Code },
  ];

  return (
    <div ref={sectionRef} className="bg-black pt-24 min-h-screen">
      {/* Hero */}
      <section className="py-16 lg:py-24">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-10">
          <div className="max-w-2xl">
            <span className="text-phantom-purple text-sm font-semibold uppercase tracking-wider mb-4 block">
              Документация
            </span>
            <h1 className="text-4xl lg:text-[56px] font-bold text-white leading-tight mb-6">
              Knowledge <span className="text-gradient">Base</span>
            </h1>
            <p className="text-white/50 text-lg mb-8">
              Ответы на частые вопросы, руководства и техническая документация
            </p>

            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
              <input
                type="text"
                placeholder="Поиск по документации..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white/[0.05] border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-phantom-purple transition-colors"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="pb-12">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: BookOpen, title: 'Руководство пользователя', desc: 'Пошаговые инструкции' },
              { icon: HelpCircle, title: 'FAQ', desc: 'Ответы на вопросы' },
              { icon: Code, title: 'API Reference', desc: 'Документация для dev' },
              { icon: Shield, title: 'Безопасность', desc: 'Протоколы и стандарты' },
            ].map((link) => (
              <div
                key={link.title}
                className="p-6 rounded-xl glass glass-hover cursor-pointer transition-all"
              >
                <link.icon className="w-6 h-6 text-phantom-purple mb-3" />
                <h4 className="text-white font-semibold text-sm mb-1">{link.title}</h4>
                <p className="text-white/40 text-xs">{link.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-12 pb-24">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-10">
          <div className="flex flex-wrap gap-2 mb-10 border-b border-white/10 pb-6">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium transition-all ${
                  activeTab === tab.key
                    ? 'bg-phantom-purple text-white'
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {filteredFAQ.map((item, i) => (
              <AccordionItem
                key={item.question}
                item={item}
                isOpen={openIndex === i}
                onClick={() => setOpenIndex(openIndex === i ? -1 : i)}
              />
            ))}
            {filteredFAQ.length === 0 && (
              <div className="text-center py-12">
                <p className="text-white/30">Ничего не найдено</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Tech Docs Preview */}
      <section className="py-24 bg-phantom-darkblue">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-10">
          <h2 className="text-3xl lg:text-[40px] font-bold text-white mb-12">
            Техническая <span className="text-gradient">документация</span>
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Server,
                title: 'REST API v2',
                desc: 'Полный reference всех эндпоинтов: Phantom Hive Tunnel, P2P Mesh, платежи, аналитика.',
                link: '#',
              },
              {
                icon: Zap,
                title: 'WebSocket Events',
                desc: 'Real-time события: подключения, транзакции, статус узлов.',
                link: '#',
              },
              {
                icon: Wallet,
                title: 'SDK Integration',
                desc: 'Android, iOS, React Native, Flutter — примеры кода и best practices.',
                link: '#',
              },
            ].map((doc) => (
              <div
                key={doc.title}
                className="p-8 rounded-2xl glass glass-hover cursor-pointer"
              >
                <doc.icon className="w-8 h-8 text-phantom-purple mb-4" />
                <h3 className="text-white font-bold text-lg mb-2">{doc.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed mb-4">{doc.desc}</p>
                <span className="text-phantom-purple text-sm font-semibold inline-flex items-center gap-1">
                  Читать <ChevronRight className="w-4 h-4" />
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
