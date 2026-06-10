'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminGetAllOrders, Order } from '@/lib/api';
import OrderStatusBadge from '@/components/OrderStatusBadge';

export default function AdminOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) { router.push('/login'); return; }
    try {
      const u = JSON.parse(userStr);
      if (u.role !== 'admin') { router.push('/'); return; }
    } catch { router.push('/'); return; }

    const token = localStorage.getItem('token');
    if (!token) return;

    (async () => {
      try {
        const data = await adminGetAllOrders(token);
        setOrders(data.orders || []);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('vi-VN', {
      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
    });

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="spinner" /></div>;

  return (
    <div className="min-h-screen pt-24 px-6 pb-20 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Quản lý đơn hàng</h1>
          <p className="text-gray-500 mt-1 text-sm">Tổng số: {orders.length} đơn hàng</p>
        </div>
        <button onClick={() => router.push('/admin')} className="btn-secondary text-sm">← Dashboard</button>
      </div>

      <div className="glass overflow-hidden rounded-xl">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/5 border-b border-white/5">
            <tr>
              <th className="p-4 font-medium text-gray-400">ID</th>
              <th className="p-4 font-medium text-gray-400">Sự kiện</th>
              <th className="p-4 font-medium text-gray-400">Ghế</th>
              <th className="p-4 font-medium text-gray-400">Trạng thái</th>
              <th className="p-4 font-medium text-gray-400">Ngày đặt</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-white/5 transition-colors">
                <td className="p-4 text-gray-500 font-mono">#{order.id}</td>
                <td className="p-4 font-medium">{order.event_name || `Sự kiện #${order.event_id}`}</td>
                <td className="p-4 text-gray-400 font-mono">{order.seat_code}</td>
                <td className="p-4"><OrderStatusBadge status={order.status} /></td>
                <td className="p-4 text-gray-500 text-xs">{formatDate(order.created_at)}</td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500">Không có đơn hàng nào.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
