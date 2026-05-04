import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router';
import { useSupabase } from '@/providers/SupabaseProvider';
import { Menu, X, User, Shield } from 'lucide-react';

const navLinks = [
  { label: 'Главная', href: '/' },
  { label: 'Монетизация', href: '/advertise' },
  { label: 'Партнёрам', href: '/partners' },
  { label: 'Документация', href: '/docs' },
  { label: 'Скачать', href: '/download' },
];

const ADMIN_SESSION_KEY = 'phantom_admin_token';

function isAdminLoggedIn(): boolean {
  try {
    const token = sessionStorage.getItem(ADMIN_SESSION_KEY);
    const exp = sessionStorage.getItem(`${ADMIN_SESSION_KEY}_exp`);
    if (!token || !exp) return false;
    return Date.now() < Number(exp);
  } catch {
    return false;
  }
}

export default function Navbar() {
  const { user, signOut } = useSupabase();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [adminAccess, setAdminAccess] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setAdminAccess(isAdminLoggedIn());
  }, [location.pathname]);

  const isActive = (href: string) => {
    if (href === '/') return location.pathname === '/';
    return location.pathname.startsWith(href);
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-black/80 backdrop-blur-xl border-b border-white/5'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-[1440px] mx-auto px-6 lg:px-10">
        <div className="flex items-center justify-between h-16 lg:h-20">
          <Link to="/" className="flex items-center gap-3 group">
            <img
              src="/images/logo-light.png"
              alt="Phantom"
              className="w-8 h-8 transition-transform group-hover:scale-110"
            />
            <span className="text-xl font-bold text-white tracking-tight">Phantom</span>
          </Link>

          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive(link.href)
                    ? 'text-phantom-purple bg-phantom-purple/10'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-3">
            {adminAccess && (
              <Link
                to="/admin"
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
              >
                <Shield className="w-3 h-3" />
                Admin
              </Link>
            )}
            {user ? (
              <>
                <Link
                  to="/profile"
                  className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-all"
                >
                  <User className="w-5 h-5" />
                </Link>
                <button
                  onClick={signOut}
                  className="px-4 py-2 text-sm text-white/40 hover:text-white transition-colors"
                >
                  Выйти
                </button>
              </>
            ) : (
              <Link
                to="/auth/login"
                className="px-5 py-2.5 bg-phantom-purple text-white text-sm font-semibold rounded-lg hover:bg-phantom-purple-deep transition-colors"
              >
                Войти
              </Link>
            )}
          </div>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 text-white/70 hover:text-white"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="lg:hidden bg-black/95 backdrop-blur-xl border-t border-white/5">
          <div className="px-6 py-4 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`block px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  isActive(link.href)
                    ? 'text-phantom-purple bg-phantom-purple/10'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                {link.label}
              </Link>
            ))}

            {user ? (
              <>
                {adminAccess && (
                  <Link
                    to="/admin"
                    className="flex items-center gap-1.5 px-4 py-3 rounded-lg text-sm font-medium text-red-400 bg-red-500/10"
                  >
                    <Shield className="w-3 h-3" />
                    Admin Panel
                  </Link>
                )}
                <Link
                  to="/profile"
                  className="block px-4 py-3 rounded-lg text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 transition-all"
                >
                  Профиль
                </Link>
                <button
                  onClick={signOut}
                  className="block w-full text-left px-4 py-3 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all"
                >
                  Выйти
                </button>
              </>
            ) : (
              <div className="pt-3 space-y-2">
                <Link
                  to="/auth/login"
                  className="block w-full text-center px-5 py-3 bg-phantom-purple text-white text-sm font-semibold rounded-lg hover:bg-phantom-purple-deep transition-colors"
                >
                  Войти
                </Link>
                <Link
                  to="/auth/signup"
                  className="block w-full text-center px-5 py-3 border border-white/20 text-white text-sm font-semibold rounded-lg hover:bg-white/5 transition-colors"
                >
                  Регистрация
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
