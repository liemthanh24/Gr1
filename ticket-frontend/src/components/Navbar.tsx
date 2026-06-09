'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export default function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<{name: string, email: string, role?: string} | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    setIsLoggedIn(!!token);
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch {
        // ignore parsing errors
      }
    }

    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    setUser(null);
    setMenuOpen(false);
    router.push('/');
  };

  const linkClass = (active: boolean) =>
    `block px-4 py-2 rounded-lg text-sm font-medium transition-all ${
      active
        ? 'text-white bg-white/10'
        : 'text-gray-400 hover:text-white hover:bg-white/5'
    }`;

  const closeMenu = () => setMenuOpen(false);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'glass-strong shadow-lg shadow-purple-900/10'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-400 flex items-center justify-center text-white font-bold text-sm group-hover:shadow-lg group-hover:shadow-purple-500/30 transition-shadow">
            T
          </div>
          <span className="text-lg font-bold gradient-text">TicketVN</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-2">
          <Link href="/" className={linkClass(pathname === '/')}>
            Sự kiện
          </Link>
          {isLoggedIn ? (
            <div className="flex items-center gap-2">
              {user?.role === 'admin' && (
                <Link
                  href="/admin"
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    pathname.startsWith('/admin')
                      ? 'text-purple-400 bg-purple-400/10'
                      : 'text-gray-400 hover:text-purple-400 hover:bg-purple-400/5'
                  }`}
                >
                  Quản trị
                </Link>
              )}
              <Link
                href="/dashboard"
                className={linkClass(pathname === '/dashboard')}
              >
                Đơn hàng
              </Link>
              <Link
                href="/profile"
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  pathname === '/profile'
                    ? 'text-white bg-white/10'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-cyan-400 flex items-center justify-center text-xs text-white">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                {user?.name || 'Hồ sơ'}
              </Link>
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-400/10 transition-all flex items-center justify-center"
                title="Đăng xuất"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
              </button>
            </div>
          ) : (
            <Link href="/login" className="btn-primary text-sm !py-2 !px-5">
              Đăng nhập
            </Link>
          )}
        </div>

        {/* Hamburger */}
        <button
          className="md:hidden p-2 text-gray-400 hover:text-white"
          onClick={() => setMenuOpen(o => !o)}
          aria-label="Toggle menu"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {menuOpen ? (
              <>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </>
            ) : (
              <>
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </>
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden glass-strong border-t border-white/5 px-6 py-4 space-y-2 animate-fade-in">
          <Link href="/" onClick={closeMenu} className={linkClass(pathname === '/')}>
            Sự kiện
          </Link>
          {isLoggedIn ? (
            <>
              {user?.role === 'admin' && (
                <Link href="/admin" onClick={closeMenu} className={linkClass(pathname.startsWith('/admin'))}>
                  Quản trị
                </Link>
              )}
              <Link href="/dashboard" onClick={closeMenu} className={linkClass(pathname === '/dashboard')}>
                Đơn hàng
              </Link>
              <Link href="/profile" onClick={closeMenu} className={`flex items-center gap-2 ${linkClass(pathname === '/profile')}`}>
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-cyan-400 flex items-center justify-center text-xs text-white">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                {user?.name || 'Hồ sơ'}
              </Link>
              <button onClick={handleLogout} className="block w-full text-left px-4 py-2 rounded-lg text-sm font-medium text-red-400 hover:bg-red-400/10 transition-all">
                Đăng xuất
              </button>
            </>
          ) : (
            <Link href="/login" onClick={closeMenu} className={linkClass(pathname === '/login')}>
              Đăng nhập
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
