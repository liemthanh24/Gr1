'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { login } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await login(email, password);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      {/* Decorative */}
      <div className="absolute top-1/4 left-1/3 w-80 h-80 bg-purple-600/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/3 w-60 h-60 bg-cyan-500/10 rounded-full blur-[100px]" />

      <div className="relative z-10 w-full max-w-md animate-fade-in-up">
        <div className="glass-strong p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-purple-500 to-cyan-400 flex items-center justify-center text-white text-2xl font-bold mb-4 animate-pulse-glow">
              T
            </div>
            <h1 className="text-2xl font-bold">Đăng nhập</h1>
            <p className="text-sm text-gray-500 mt-1">Chào mừng trở lại TicketVN</p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center animate-fade-in">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Email</label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="your@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Mật khẩu</label>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="spinner !w-4 !h-4 !border-2" />
                  Đang xử lý...
                </>
              ) : (
                'Đăng nhập →'
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            Chưa có tài khoản?{' '}
            <Link href="/register" className="text-purple-400 hover:text-purple-300 font-medium transition-colors">
              Đăng ký ngay
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
