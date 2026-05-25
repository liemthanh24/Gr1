'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);

    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    window.location.href = '/';
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'glass-strong shadow-lg shadow-purple-900/10'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-400 flex items-center justify-center text-white font-bold text-sm group-hover:shadow-lg group-hover:shadow-purple-500/30 transition-shadow">
            T
          </div>
          <span className="text-lg font-bold gradient-text">TicketVN</span>
        </Link>

        {/* Navigation */}
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              pathname === '/'
                ? 'text-white bg-white/10'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Sự kiện
          </Link>

          {isLoggedIn ? (
            <>
              <Link
                href="/dashboard"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  pathname === '/dashboard'
                    ? 'text-white bg-white/10'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                Đơn hàng
              </Link>
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-400/10 transition-all"
              >
                Đăng xuất
              </button>
            </>
          ) : (
            <Link href="/login" className="btn-primary text-sm !py-2 !px-5">
              Đăng nhập
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
