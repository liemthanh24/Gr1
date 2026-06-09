'use client';

import { useEffect, useState, useMemo } from 'react';
import { getEvents, Event } from '@/lib/api';
import EventCard from '@/components/EventCard';

const PAGE_SIZE = 6;

export default function HomePage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem('token'));
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

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return events;
    return events.filter(e =>
      e.name.toLowerCase().includes(q) ||
      (e.venue || '').toLowerCase().includes(q) ||
      (e.description || '').toLowerCase().includes(q)
    );
  }, [events, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [search]);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative px-6 pt-16 pb-20 text-center">
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
            {!isLoggedIn && (
              <a href="/login" className="btn-secondary">
                Đăng nhập
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Events Section */}
      <section id="events" className="px-6 pb-20 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold">Sự kiện sắp diễn ra</h2>
            <p className="text-sm text-gray-500 mt-1">Chọn sự kiện yêu thích và đặt vé ngay!</p>
          </div>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="🔍 Tìm kiếm sự kiện..."
            className="input-field max-w-xs"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="spinner" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 glass">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-lg font-semibold mb-2">
              {search ? 'Không tìm thấy sự kiện phù hợp' : 'Chưa có sự kiện nào'}
            </h3>
            <p className="text-sm text-gray-500">
              {search ? 'Thử từ khóa khác hoặc xóa bộ lọc' : 'Các sự kiện sẽ sớm được cập nhật!'}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paged.map((event, index) => (
                <EventCard key={event.id} event={event} index={index} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-10">
                <button
                  className="btn-secondary"
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                >
                  ← Trước
                </button>
                <span className="text-sm text-gray-400">
                  {page} / {totalPages}
                </span>
                <button
                  className="btn-secondary"
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                >
                  Sau →
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
