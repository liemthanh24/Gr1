'use client';

import { useState, useEffect } from 'react';
import type { Event } from '@/lib/api';

interface EventFormModalProps {
  mode: 'create' | 'edit';
  event?: Event | null;
  onClose: () => void;
  onSave: (data: Partial<Event>) => Promise<void>;
}

export default function EventFormModal({ mode, event, onClose, onSave }: EventFormModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [venue, setVenue] = useState('');
  const [totalTickets, setTotalTickets] = useState(100);
  const [price, setPrice] = useState(0);
  const [eventDate, setEventDate] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (mode === 'edit' && event) {
      setName(event.name || '');
      setDescription(event.description || '');
      setVenue(event.venue || '');
      setTotalTickets(event.total_tickets || 100);
      setPrice(event.price || 0);
      setEventDate(event.event_date ? event.event_date.slice(0, 16) : '');
      setImageUrl(event.image_url || '');
    }
  }, [mode, event]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) { setError('Tên sự kiện không được để trống'); return; }
    if (totalTickets <= 0) { setError('Số vé phải lớn hơn 0'); return; }
    if (price < 0) { setError('Giá không được âm'); return; }

    setSaving(true);
    try {
      await onSave({
        name,
        description,
        venue,
        total_tickets: Number(totalTickets),
        available_tickets: Number(totalTickets),
        price: Number(price),
        event_date: eventDate ? new Date(eventDate).toISOString() : '',
        image_url: imageUrl,
      });
      onClose();
    } catch {
      setError('Lưu thất bại, vui lòng thử lại');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="glass p-8 rounded-2xl w-full max-w-lg relative z-10 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6">
          {mode === 'create' ? 'Thêm sự kiện mới' : 'Chỉnh sửa sự kiện'}
        </h2>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Tên sự kiện *</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} className="input-field" placeholder="Nhập tên sự kiện..." required />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Mô tả</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} className="input-field min-h-[80px]" placeholder="Mô tả sự kiện..." />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Địa điểm</label>
            <input type="text" value={venue} onChange={e => setVenue(e.target.value)} className="input-field" placeholder="Địa điểm..." />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Tổng số vé *</label>
              <input type="number" value={totalTickets} onChange={e => setTotalTickets(Number(e.target.value))} className="input-field" min="1" required />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Giá (VND)</label>
              <input type="number" value={price} onChange={e => setPrice(Number(e.target.value))} className="input-field" min="0" />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Ngày diễn ra</label>
            <input type="datetime-local" value={eventDate} onChange={e => setEventDate(e.target.value)} className="input-field" />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1.5">URL hình ảnh</label>
            <input type="text" value={imageUrl} onChange={e => setImageUrl(e.target.value)} className="input-field" placeholder="https://..." />
          </div>

          <div className="flex items-center gap-3 pt-4">
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Đang lưu...' : (mode === 'create' ? 'Tạo sự kiện' : 'Lưu thay đổi')}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary">
              Hủy
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
