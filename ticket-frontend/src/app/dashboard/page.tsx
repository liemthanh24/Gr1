'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUserOrders, Order } from '@/lib/api';
import OrderStatusBadge from '@/components/OrderStatusBadge';

export default function DashboardPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (!token) {
      router.push('/login');
      return;
    }

    if (user) {
      try {
        setUserEmail(JSON.parse(user).email);
      } catch {}
    }

    async function fetchOrders() {
      try {
        const data = await getUserOrders(token!);
        setOrders(data.orders || []);
      } catch (err) {
        console.error('Failed to fetch orders:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchOrders();
  }, [router]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const stats = {
    total: orders.length,
    confirmed: orders.filter((o) => o.status === 'confirmed').length,
    pending: orders.filter((o) => o.status === 'pending').length,
    cancelled: orders.filter((o) => o.status === 'cancelled').length,
  };

  return (
    <div className="min-h-screen px-6 pb-20">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8 animate-fade-in-up">
          <h1 className="text-3xl font-black">Đơn hàng của tôi</h1>
          <p className="text-gray-500 mt-1">
            {userEmail && <span className="text-purple-400">{userEmail}</span>}
            {' '}• Quản lý vé đã đặt
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          {[
            { label: 'Tổng đơn', value: stats.total, icon: '📋', color: 'from-blue-500/20 to-blue-600/5' },
            { label: 'Đã xác nhận', value: stats.confirmed, icon: '✅', color: 'from-green-500/20 to-green-600/5' },
            { label: 'Đang chờ', value: stats.pending, icon: '⏳', color: 'from-yellow-500/20 to-yellow-600/5' },
            { label: 'Đã hủy', value: stats.cancelled, icon: '❌', color: 'from-red-500/20 to-red-600/5' },
          ].map((stat) => (
            <div key={stat.label} className={`glass p-4 bg-gradient-to-b ${stat.color}`}>
              <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
                <span>{stat.icon}</span>
                {stat.label}
              </div>
              <div className="text-2xl font-bold">{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="spinner" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 glass animate-fade-in-up">
            <div className="text-5xl mb-4">🎫</div>
            <h3 className="text-lg font-semibold mb-2">Chưa có đơn hàng nào</h3>
            <p className="text-sm text-gray-500 mb-4">Hãy đặt vé cho sự kiện yêu thích!</p>
            <button onClick={() => router.push('/')} className="btn-primary">
              Xem sự kiện →
            </button>
          </div>
        ) : (
          <div className="space-y-3 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            {orders.map((order, i) => (
              <div
                key={order.id}
                className="glass p-5 flex items-center justify-between hover:border-purple-500/20 transition-all animate-fade-in-up"
                style={{ animationDelay: `${(i + 3) * 50}ms`, animationFillMode: 'both' }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 flex items-center justify-center text-lg">
                    🎵
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">
                      {order.event_name || `Sự kiện #${order.event_id}`}
                    </h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-gray-500">
                        Ghế <span className="text-cyan-400 font-mono">{order.seat_code}</span>
                      </span>
                      <span className="text-xs text-gray-600">•</span>
                      <span className="text-xs text-gray-500">{formatDate(order.created_at)}</span>
                      <span className="text-xs text-gray-600">•</span>
                      <span className="text-xs text-gray-500">#{order.id}</span>
                    </div>
                  </div>
                </div>

                <OrderStatusBadge status={order.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
