'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Event } from '@/lib/api';
import { adminGetEvents, deleteEvent, createEvent, updateEvent } from '@/lib/api';
import EventFormModal from '@/components/EventFormModal';

export default function AdminEventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  function getToken() { return typeof window !== 'undefined' ? localStorage.getItem('token') : null; }

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) { router.push('/login'); return; }
    try {
      const user = JSON.parse(userStr);
      if (user.role !== 'admin') { router.push('/'); return; }
    } catch { router.push('/'); return; }

    (async () => {
      const token = getToken();
      if (!token) return;
      try {
        const data = await adminGetEvents(token);
        setEvents(data.events || []);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const handleDelete = async (id: number) => {
    const token = getToken();
    if (!token) return;
    setDeletingId(id);
    try {
      await deleteEvent(id, token);
      setEvents(prev => prev.filter(e => e.id !== id));
    } catch {
      alert('Lỗi khi xóa sự kiện');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSave = async (data: Partial<Event>) => {
    const token = getToken();
    if (!token) return;
    if (modalMode === 'create') {
      await createEvent(data, token);
    } else if (modalMode === 'edit' && editingEvent) {
      await updateEvent(editingEvent.id, data, token);
    }
    await adminGetEvents(token).then(r => setEvents(r.events || [])).catch(() => {});
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="spinner" /></div>;

  return (
    <div className="min-h-screen pt-24 px-6 pb-20 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Quản trị Sự kiện</h1>
        <button className="btn-primary" onClick={() => { setEditingEvent(null); setModalMode('create'); }}>
          + Thêm sự kiện
        </button>
      </div>

      {modalMode && (
        <EventFormModal
          mode={modalMode}
          event={editingEvent}
          onClose={() => { setModalMode(null); setEditingEvent(null); }}
          onSave={handleSave}
        />
      )}

      <div className="glass overflow-hidden rounded-xl">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/5 border-b border-white/5">
            <tr>
              <th className="p-4 font-medium text-gray-400">ID</th>
              <th className="p-4 font-medium text-gray-400">Tên sự kiện</th>
              <th className="p-4 font-medium text-gray-400">Địa điểm</th>
              <th className="p-4 font-medium text-gray-400">Vé</th>
              <th className="p-4 font-medium text-gray-400">Giá</th>
              <th className="p-4 font-medium text-gray-400 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {events.map((event) => (
              <tr key={event.id} className="hover:bg-white/5 transition-colors">
                <td className="p-4 text-gray-500">#{event.id}</td>
                <td className="p-4 font-medium">{event.name}</td>
                <td className="p-4 text-gray-400">{event.venue}</td>
                <td className="p-4">
                  <span className={event.available_tickets < 50 ? 'text-orange-400' : 'text-green-400'}>
                    {event.available_tickets}
                  </span>
                  <span className="text-gray-500"> / {event.total_tickets}</span>
                </td>
                <td className="p-4 text-cyan-400">{event.price.toLocaleString()}đ</td>
                <td className="p-4 text-right space-x-3">
                  <button
                    className="text-purple-400 hover:text-purple-300"
                    onClick={() => { setEditingEvent(event); setModalMode('edit'); }}
                  >
                    Sửa
                  </button>
                  <button
                    className="text-red-400 hover:text-red-300 disabled:opacity-50"
                    disabled={deletingId === event.id}
                    onClick={() => handleDelete(event.id)}
                  >
                    {deletingId === event.id ? 'Đang xóa...' : 'Xóa'}
                  </button>
                </td>
              </tr>
            ))}
            {events.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500">Không có sự kiện nào.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
