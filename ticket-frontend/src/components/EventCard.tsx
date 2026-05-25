'use client';

import Link from 'next/link';
import { Event } from '@/lib/api';

interface EventCardProps {
  event: Event;
  index: number;
}

export default function EventCard({ event, index }: EventCardProps) {
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

  const soldPercent = Math.round(
    ((event.total_tickets - event.available_tickets) / event.total_tickets) * 100
  );

  return (
    <Link href={`/events/${event.id}`}>
      <div
        className="glass group relative overflow-hidden cursor-pointer transition-all duration-500 hover:border-purple-500/30 hover:shadow-xl hover:shadow-purple-900/20 animate-fade-in-up"
        style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'both' }}
      >
        {/* Image area */}
        <div className="h-48 relative overflow-hidden rounded-t-2xl bg-gradient-to-br from-purple-900/50 to-cyan-900/50">
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-transparent to-transparent z-10" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-6xl opacity-30 group-hover:scale-110 transition-transform duration-700">
              🎵
            </div>
          </div>
          {/* Hot badge */}
          {soldPercent > 60 && (
            <div className="absolute top-3 right-3 z-20 bg-gradient-to-r from-pink-500 to-red-500 text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse">
              🔥 HOT
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5">
          <h3 className="text-lg font-bold text-white group-hover:gradient-text transition-all duration-300 mb-2 line-clamp-1">
            {event.name}
          </h3>

          <p className="text-sm text-gray-400 mb-3 line-clamp-2">
            {event.description}
          </p>

          <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {event.venue}
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {formatDate(event.event_date)}
          </div>

          {/* Progress bar */}
          <div className="mb-3">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-400">
                Còn <span className="text-cyan-400 font-semibold">{event.available_tickets}</span> / {event.total_tickets} vé
              </span>
              <span className="text-gray-500">{soldPercent}% đã bán</span>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-purple-500 to-cyan-400 transition-all duration-1000"
                style={{ width: `${soldPercent}%` }}
              />
            </div>
          </div>

          {/* Price */}
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold gradient-text">
              {formatPrice(event.price)}
            </span>
            <span className="text-xs text-purple-400 font-medium group-hover:text-cyan-400 transition-colors">
              Đặt vé →
            </span>
          </div>
        </div>

        {/* Hover glow */}
        <div className="absolute -inset-px rounded-2xl bg-gradient-to-r from-purple-500/0 via-cyan-500/0 to-purple-500/0 group-hover:from-purple-500/10 group-hover:via-cyan-500/5 group-hover:to-purple-500/10 transition-all duration-500 pointer-events-none" />
      </div>
    </Link>
  );
}
