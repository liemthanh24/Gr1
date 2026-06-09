'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) { router.push('/login'); return; }
    try {
      const u = JSON.parse(userStr);
      if (u.role !== 'admin') { router.push('/'); return; }
      setUser(u);
    } catch { router.push('/'); }
  }, [router]);

  if (!user) return <div className="min-h-screen flex items-center justify-center"><div className="spinner" /></div>;

  return (
    <div className="min-h-screen pt-24 px-6 pb-20 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Dashboard Admin</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="glass p-6 rounded-2xl">
          <p className="text-gray-400 text-sm">Tổng sự kiện</p>
          <p className="text-3xl font-bold text-purple-400 mt-2">—</p>
        </div>
        <div className="glass p-6 rounded-2xl">
          <p className="text-gray-400 text-sm">Tổng đơn hàng</p>
          <p className="text-3xl font-bold text-cyan-400 mt-2">—</p>
        </div>
        <div className="glass p-6 rounded-2xl">
          <p className="text-gray-400 text-sm">Người dùng</p>
          <p className="text-3xl font-bold text-green-400 mt-2">—</p>
        </div>
        <div className="glass p-6 rounded-2xl">
          <p className="text-gray-400 text-sm">Doanh thu</p>
          <p className="text-3xl font-bold text-orange-400 mt-2">—</p>
        </div>
      </div>

      <div className="glass p-8 rounded-2xl text-center text-gray-500">
        <p className="mb-4">Chi tiết thống kê đang được phát triển</p>
        <p className="text-sm">Quản lý sự kiện tại <a href="/admin/events" className="text-cyan-400 hover:underline">Quản trị Sự kiện</a></p>
      </div>
    </div>
  );
}
