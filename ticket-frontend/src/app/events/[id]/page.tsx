'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getEvent, bookTicket, Event, Ticket } from '@/lib/api';
import { usePolling } from '@/hooks/usePolling';
import SeatMap from '@/components/SeatMap';
import OrderStatusBadge from '@/components/OrderStatusBadge';

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = Number(params.id);

  const [event, setEvent] = useState<Event | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const { order, isPolling, startPolling } = usePolling(2000);

  useEffect(() => {
    async function fetchEvent() {
      try {
        const data = await getEvent(eventId);
        setEvent(data.event);
        setTickets(data.tickets || []);
      } catch (err) {
        console.error('Failed to fetch event:', err);
      } finally {
        setLoading(false);
      }
    }
    if (eventId) fetchEvent();
  }, [eventId]);

  const toggleSeat = (seatCode: string) => {
    setSelectedSeats(prev =>
      prev.includes(seatCode)
        ? prev.filter(s => s !== seatCode)
        : [...prev, seatCode]
    );
  };

  const handleBook = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    if (selectedSeats.length === 0) {
      setError('Vui lòng chọn ít nhất 1 ghế');
      return;
    }

    setBooking(true);
    setError('');

    try {
      const data = await bookTicket(eventId, selectedSeats, token);
      setBookingSuccess(true);
      startPolling(data.order_ids[0]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đặt vé thất bại');
    } finally {
      setBooking(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center glass p-10">
          <div className="text-4xl mb-4">😕</div>
          <h2 className="text-xl font-bold mb-2">Không tìm thấy sự kiện</h2>
          <button onClick={() => router.push('/')} className="btn-primary mt-4">
            Về trang chủ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 pb-20">
      <div className="max-w-6xl mx-auto">
        {/* Event Header */}
        <div className="relative glass overflow-hidden mb-8 animate-fade-in-up">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-900/30 via-transparent to-cyan-900/30" />
          <div className="relative p-8">
            <button
              onClick={() => router.push('/')}
              className="text-sm text-gray-400 hover:text-white transition-colors mb-4 inline-flex items-center gap-1"
            >
              ← Quay lại
            </button>

            <h1 className="text-3xl md:text-4xl font-black mb-3">{event.name}</h1>
            <p className="text-gray-400 mb-4 max-w-2xl">{event.description}</p>

            <div className="flex flex-wrap gap-4 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <span>📍</span> {event.venue}
              </div>
              <div className="flex items-center gap-2">
                <span>📅</span> {formatDate(event.event_date)}
              </div>
              <div className="flex items-center gap-2">
                <span>🎫</span> Còn {event.available_tickets} / {event.total_tickets} vé
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold gradient-text">{formatPrice(event.price)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Seat Map */}
          <div className="lg:col-span-2">
            <div className="glass p-6 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
              <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                <span>💺</span> Chọn ghế ngồi
              </h2>
              <SeatMap
                tickets={tickets}
                selectedSeats={selectedSeats}
                onToggleSeat={toggleSeat}
              />
            </div>
          </div>

          {/* Booking Panel */}
          <div className="lg:col-span-1">
            <div className="glass-strong p-6 sticky top-24 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
              <h2 className="text-lg font-bold mb-4">Thông tin đặt vé</h2>

              {/* Booking Success - Polling */}
              {bookingSuccess ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-gradient-to-b from-purple-500/10 to-transparent border border-purple-500/20 text-center">
                    {isPolling ? (
                      <>
                        <div className="spinner mx-auto mb-3 !w-8 !h-8" />
                        <p className="text-sm text-gray-300">Đang xử lý đơn hàng...</p>
                        <p className="text-xs text-gray-500 mt-1">Vui lòng chờ trong giây lát</p>
                      </>
                    ) : order ? (
                      <>
                        <div className="text-3xl mb-2">
                          {order.status === 'confirmed' ? '🎉' : '😔'}
                        </div>
                        <OrderStatusBadge status={order.status} />
                        <p className="text-sm text-gray-400 mt-3">
                          {order.status === 'confirmed'
                            ? `Ghế ${order.seat_code} đã được xác nhận!`
                            : 'Ghế đã được người khác đặt trước. Vui lòng thử lại.'}
                        </p>
                        {order.status === 'confirmed' && (
                          <button
                            onClick={() => router.push('/dashboard')}
                            className="btn-primary mt-4 w-full text-sm"
                          >
                            Xem đơn hàng →
                          </button>
                        )}
                        {order.status === 'cancelled' && (
                          <button
                            onClick={() => {
                              setBookingSuccess(false);
                              setSelectedSeats([]);
                            }}
                            className="btn-secondary mt-4 w-full text-sm"
                          >
                            Chọn ghế khác
                          </button>
                        )}
                      </>
                    ) : null}
                  </div>
                </div>
              ) : (
                <>
                  <div className="p-4 rounded-xl bg-white/3 border border-white/5 mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-400">Ghế đã chọn</span>
                      <span className="text-lg font-bold text-cyan-400">
                        {selectedSeats.length > 0 ? selectedSeats.join(', ') : '—'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-400">Số lượng</span>
                      <span className="text-sm text-gray-300">{selectedSeats.length} vé</span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-400">Sự kiện</span>
                      <span className="text-sm text-gray-300 text-right max-w-[180px] truncate">
                        {event.name}
                      </span>
                    </div>
                    <div className="border-t border-white/5 pt-2 mt-2 flex justify-between items-center">
                      <span className="text-sm text-gray-400">Tổng cộng</span>
                      <span className="text-xl font-bold gradient-text">
                        {formatPrice(event.price * selectedSeats.length)}
                      </span>
                    </div>
                  </div>

                  {/* Error */}
                  {error && (
                    <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center animate-fade-in">
                      {error}
                    </div>
                  )}

                  {/* Book button */}
                  <button
                    id="book-ticket-btn"
                    onClick={handleBook}
                    disabled={selectedSeats.length === 0 || booking}
                    className="btn-primary w-full flex items-center justify-center gap-2 text-base"
                  >
                    {booking ? (
                      <>
                        <div className="spinner !w-4 !h-4 !border-2" />
                        Đang xử lý...
                      </>
                    ) : (
                      <>⚡ Đặt {selectedSeats.length} vé ngay</>
                    )}
                  </button>

                  <p className="text-xs text-gray-600 text-center mt-3">
                    Đơn hàng sẽ được xử lý tự động trong vài giây
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
