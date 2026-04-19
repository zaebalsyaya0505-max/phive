import { Link } from 'react-router';
import { Mail, MessageCircle, Twitter, Github } from 'lucide-react';

const footerLinks = {
  product: [
    { label: 'Возможности', href: '/#features' },
    { label: 'Монетизация', href: '/advertise' },
    { label: 'Скачать', href: '/download' },
    { label: 'Документация', href: '/docs' },
  ],
  company: [
    { label: 'О проекте', href: '/about' },
    { label: 'Блог', href: '/blog' },
    { label: 'Карьера', href: '/about#careers' },
    { label: 'Контакты', href: '/contact' },
  ],
};

const socialLinks = [
  { icon: MessageCircle, href: 'https://t.me/phive', label: 'Telegram' },
  { icon: Twitter, href: 'https://twitter.com/phive', label: 'Twitter' },
  { icon: Github, href: 'https://github.com/phive', label: 'GitHub' },
  { icon: Mail, href: 'mailto:hello@phive.net', label: 'Email' },
];

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-black">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-10 pt-20 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 group mb-4">
              <img
                src="/images/logo-light.png"
                alt="pHive"
                className="w-6 h-6 transition-transform group-hover:scale-110"
              />
              <span className="text-lg font-bold text-white">pHive</span>
            </Link>
            <p className="text-white/40 text-sm leading-relaxed mb-6">
              Свобода информации без границ. Децентрализованная медиа-платформа нового поколения.
            </p>
            <div className="flex items-center gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-white/40 hover:text-phantom-purple hover:bg-phantom-purple/10 transition-all"
                  aria-label={social.label}
                >
                  <social.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Продукт</h4>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-white/40 text-sm hover:text-phantom-purple transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Компания</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-white/40 text-sm hover:text-phantom-purple transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Контакты</h4>
            <div className="space-y-3">
              <a
                href="mailto:hello@phive.net"
                className="flex items-center gap-2 text-phantom-purple text-sm hover:underline"
              >
                <Mail className="w-4 h-4" />
                hello@phive.net
              </a>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-phantom-green animate-pulse" />
                <span className="text-white/40 text-sm">Все системы работают</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-white/30 text-sm">
            2026 pHive. Все права защищены.
          </p>
          <div className="flex items-center gap-6">
            <Link to="/privacy" className="text-white/30 text-sm hover:text-white/50 transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-white/30 text-sm hover:text-white/50 transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
