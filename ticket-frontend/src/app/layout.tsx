import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'TicketVN - Đặt vé Concert hàng đầu Việt Nam',
  description: 'Hệ thống đặt vé concert chịu tải cao. Đặt vé nhanh chóng, an toàn cho các sự kiện âm nhạc lớn nhất Việt Nam.',
  keywords: 'concert, ticket, vé, sự kiện, âm nhạc, Việt Nam',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className="bg-grid">
        <div className="bg-radial-glow fixed inset-0 pointer-events-none z-0" />
        <Navbar />
        <main className="relative z-10 pt-20">
          {children}
        </main>
      </body>
    </html>
  );
}
