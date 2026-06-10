'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { adminGetStats, AdminStats } from '@/lib/api';

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) { router.push('/login'); return; }
    try {
      const u = JSON.parse(userStr);
      if (u.role !== 'admin') { router.push('/'); return; }
      setUser(u);
    } catch { router.push('/'); return; }

    const token = localStorage.getItem('token');
    if (!token) return;

    (async () => {
      try {
        const data = await adminGetStats(token);
        setStats(data);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  if (!user || loading) return <div className="min-h-screen flex items-center justify-center"><div className="spinner" /></div>;

  const statCards = [
    { label: 'Tổng sự kiện', value: stats?.total_events ?? '—', icon: '📅', color: 'from-purple-500/20 to-purple-600/5', link: '/admin/events' },
    { label: 'Tổng đơn hàng', value: stats?.total_orders ?? '—', icon: '📋', color: 'from-cyan-500/20 to-cyan-600/5', link: '/admin/orders' },
    { label: 'Người dùng', value: stats?.total_users ?? '—', icon: '👥', color: 'from-green-500/20 to-green-600/5', link: '/admin/users' },
    { label: 'Doanh thu', value: stats ? new Intl.NumberFormat('vi-VN').format(stats.total_revenue) + 'đ' : '—', icon: '💰', color: 'from-orange-500/20 to-orange-600/5', link: '/admin/orders' },
  ];

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-500/20 text-yellow-400',
    confirmed: 'bg-green-500/20 text-green-400',
    cancelled: 'bg-red-500/20 text-red-400',
  };

  const statusLabels: Record<string, string> = {
    pending: 'Đang chờ',
    confirmed: 'Đã xác nhận',
    cancelled: 'Đã hủy',
  };

  return (
    <div className="min-h-screen pt-24 px-6 pb-20 max-w-7xl mx-auto">
      <div className="mb-8 animate-fade-in-up">
        <h1 className="text-3xl font-bold">Dashboard Admin</h1>
        <p className="text-gray-500 mt-1">
          {user?.email && <span className="text-purple-400">{user.email}</span>} • Quản trị hệ thống
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {statCards.map((card) => (
          <Link
            key={card.label}
            href={card.link || '#'}
            className={`glass p-6 rounded-2xl bg-gradient-to-b ${card.color} block hover:brightness-110 transition-all`}
          >
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
              <span>{card.icon}</span>
              {card.label}
            </div>
            <p className="text-3xl font-bold">{card.value}</p>
          </Link>
        ))}
      </div>

      {stats?.orders_by_status && (
        <div className="glass p-6 rounded-2xl mb-10">
          <h3 className="font-semibold mb-4">Thống kê đơn hàng theo trạng thái</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(stats.orders_by_status).map(([status, count]) => (
              <div key={status} className={`p-4 rounded-xl ${statusColors[status] || 'bg-white/5 text-gray-400'}`}>
                <div className="text-sm mb-1">{statusLabels[status] || status}</div>
                <div className="text-2xl font-bold">{count}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-4 flex-wrap">
        <Link href="/admin/events" className="btn-primary">📅 Quản lý sự kiện</Link>
        <Link href="/admin/users" className="btn-secondary">👥 Quản lý người dùng</Link>
        <Link href="/admin/orders" className="btn-secondary">📋 Quản lý đơn hàng</Link>
      </div>
    </div>
  );
}
