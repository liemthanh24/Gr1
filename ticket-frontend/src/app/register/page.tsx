'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { register } from '@/lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    if (password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    setLoading(true);

    try {
      const data = await register(email, password);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="absolute top-1/4 right-1/3 w-80 h-80 bg-purple-600/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 left-1/3 w-60 h-60 bg-cyan-500/10 rounded-full blur-[100px]" />

      <div className="relative z-10 w-full max-w-md animate-fade-in-up">
        <div className="glass-strong p-8">
          <div className="text-center mb-8">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center text-white text-2xl font-bold mb-4 animate-pulse-glow">
              ✦
            </div>
            <h1 className="text-2xl font-bold">Tạo tài khoản</h1>
            <p className="text-sm text-gray-500 mt-1">Tham gia TicketVN để đặt vé concert</p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center animate-fade-in">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Email</label>
              <input
                id="register-email"
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
                id="register-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="Tối thiểu 6 ký tự"
                required
                minLength={6}
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Xác nhận mật khẩu</label>
              <input
                id="register-confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input-field"
                placeholder="Nhập lại mật khẩu"
                required
              />
            </div>

            <button
              id="register-submit"
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
                'Đăng ký →'
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            Đã có tài khoản?{' '}
            <Link href="/login" className="text-purple-400 hover:text-purple-300 font-medium transition-colors">
              Đăng nhập
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
