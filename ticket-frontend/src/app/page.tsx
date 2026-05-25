'use client';

import { useEffect, useState } from 'react';
import { getEvents, Event } from '@/lib/api';
import EventCard from '@/components/EventCard';

export default function HomePage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEvents() {
      try {
        const data = await getEvents();
        setEvents(data.events || []);
      } catch (err) {
        console.error('Failed to fetch events:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchEvents();
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative px-6 pt-16 pb-20 text-center">
        {/* Decorative orbs */}
        <div className="absolute top-10 left-1/4 w-72 h-72 bg-purple-600/10 rounded-full blur-[100px] animate-float" />
        <div className="absolute top-20 right-1/4 w-60 h-60 bg-cyan-500/10 rounded-full blur-[100px] animate-float" style={{ animationDelay: '3s' }} />

        <div className="relative z-10 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-xs text-purple-300 mb-6 animate-fade-in-up">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            Hệ thống đang hoạt động • Flash Sale Ready
          </div>

          <h1 className="text-5xl md:text-6xl font-black mb-4 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            Đặt vé Concert
            <br />
            <span className="gradient-text">Nhanh như Chớp ⚡</span>
          </h1>

          <p className="text-lg text-gray-400 max-w-xl mx-auto mb-8 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            Hệ thống chịu tải cao, xử lý hàng nghìn đơn đặt vé đồng thời.
            Không lag, không crash, không mất vé.
          </p>

          <div className="flex justify-center gap-4 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
            <a href="#events" className="btn-primary">
              Xem sự kiện 🎶
            </a>
            <a href="/login" className="btn-secondary">
              Đăng nhập
            </a>
          </div>
        </div>

        {/* Stats */}
        <div className="relative z-10 max-w-2xl mx-auto mt-16 grid grid-cols-3 gap-4 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
          {[
            { value: '1000+', label: 'Concurrent Users' },
            { value: '<50ms', label: 'Response Time' },
            { value: '99.9%', label: 'Uptime' },
          ].map((stat) => (
            <div key={stat.label} className="glass p-4 text-center">
              <div className="text-2xl font-bold gradient-text">{stat.value}</div>
              <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Events Section */}
      <section id="events" className="px-6 pb-20 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold">Sự kiện sắp diễn ra</h2>
            <p className="text-sm text-gray-500 mt-1">Chọn sự kiện yêu thích và đặt vé ngay!</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            Live cập nhật
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="spinner" />
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-20 glass">
            <div className="text-4xl mb-4">🎵</div>
            <h3 className="text-lg font-semibold mb-2">Chưa có sự kiện nào</h3>
            <p className="text-sm text-gray-500">Các sự kiện sẽ sớm được cập nhật!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event, index) => (
              <EventCard key={event.id} event={event} index={index} />
            ))}
          </div>
        )}
      </section>

      {/* Architecture Section */}
      <section className="px-6 pb-20 max-w-5xl mx-auto">
        <div className="glass p-8">
          <h2 className="text-xl font-bold mb-6 text-center">Kiến trúc hệ thống</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { icon: '🌐', title: 'Frontend', desc: 'Next.js 14', color: 'from-blue-500/20 to-blue-600/5' },
              { icon: '⚡', title: 'API Server', desc: 'Golang + Fiber', color: 'from-purple-500/20 to-purple-600/5' },
              { icon: '📮', title: 'Message Queue', desc: 'Redis List', color: 'from-red-500/20 to-red-600/5' },
              { icon: '🏭', title: 'Worker', desc: 'Background Process', color: 'from-cyan-500/20 to-cyan-600/5' },
            ].map((item, i) => (
              <div key={item.title} className="relative">
                <div className={`p-4 rounded-xl bg-gradient-to-b ${item.color} border border-white/5 text-center`}>
                  <div className="text-2xl mb-2">{item.icon}</div>
                  <div className="text-sm font-semibold">{item.title}</div>
                  <div className="text-xs text-gray-500 mt-1">{item.desc}</div>
                </div>
                {i < 3 && (
                  <div className="hidden md:flex absolute top-1/2 -right-3 text-gray-600 text-sm">→</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
