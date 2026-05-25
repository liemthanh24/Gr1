'use client';

import { Ticket } from '@/lib/api';

interface SeatMapProps {
  tickets: Ticket[];
  selectedSeat: string | null;
  onSelectSeat: (seatCode: string) => void;
}

export default function SeatMap({ tickets, selectedSeat, onSelectSeat }: SeatMapProps) {
  // Group tickets by row (first character of seat_code)
  const rows: { [key: string]: Ticket[] } = {};
  tickets.forEach((ticket) => {
    const row = ticket.seat_code.charAt(0);
    if (!rows[row]) rows[row] = [];
    rows[row].push(ticket);
  });

  // Sort rows alphabetically and seats numerically
  const sortedRows = Object.keys(rows).sort();
  sortedRows.forEach((row) => {
    rows[row].sort((a, b) => {
      const numA = parseInt(a.seat_code.substring(1));
      const numB = parseInt(b.seat_code.substring(1));
      return numA - numB;
    });
  });

  return (
    <div className="w-full">
      {/* Stage */}
      <div className="mb-8 flex justify-center">
        <div className="relative">
          <div className="w-64 h-10 bg-gradient-to-r from-purple-500/20 via-cyan-500/30 to-purple-500/20 rounded-b-[50%] border border-purple-500/20 flex items-center justify-center">
            <span className="text-xs font-semibold text-purple-300 tracking-widest uppercase">
              Sân khấu
            </span>
          </div>
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-32 h-4 bg-gradient-to-b from-cyan-500/10 to-transparent blur-sm" />
        </div>
      </div>

      {/* Seats */}
      <div className="flex flex-col items-center gap-2">
        {sortedRows.map((row) => (
          <div key={row} className="flex items-center gap-1">
            <span className="w-6 text-xs text-gray-500 font-mono text-right mr-2">
              {row}
            </span>
            <div className="flex gap-1.5">
              {rows[row].map((ticket) => {
                const seatNum = ticket.seat_code.substring(1);
                const isSelected = selectedSeat === ticket.seat_code;
                const isLocked = ticket.is_locked;

                return (
                  <button
                    key={ticket.id}
                    className={`seat ${
                      isLocked
                        ? 'seat-locked'
                        : isSelected
                        ? 'seat-selected'
                        : 'seat-available'
                    }`}
                    onClick={() => !isLocked && onSelectSeat(ticket.seat_code)}
                    disabled={isLocked}
                    title={isLocked ? 'Đã bán' : `Ghế ${ticket.seat_code}`}
                  >
                    {seatNum}
                  </button>
                );
              })}
            </div>
            <span className="w-6 text-xs text-gray-500 font-mono ml-2">
              {row}
            </span>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-6 flex justify-center gap-6 text-xs text-gray-400">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded seat-available" />
          <span>Còn trống</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded seat-selected" />
          <span>Đang chọn</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded seat-locked" />
          <span>Đã bán</span>
        </div>
      </div>
    </div>
  );
}
