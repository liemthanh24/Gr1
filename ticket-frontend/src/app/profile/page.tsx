'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getProfile, updateProfile } from '@/lib/api';
import type { User } from '@/lib/api';
import { useToast } from '@/lib/toast';

export default function ProfilePage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [cccd, setCccd] = useState('');
  const [dob, setDob] = useState('');
  const [address, setAddress] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  function getToken() { return typeof window !== 'undefined' ? localStorage.getItem('token') : null; }

  useEffect(() => {
    const token = getToken();
    if (!token) { router.push('/login'); return; }

    (async () => {
      try {
        const data = await getProfile(token);
        const u = data.user;
        setUser(u);
        setName(u.name || '');
        setEmail(u.email || '');
        setPhone(u.phone || '');
        setCccd(u.cccd || '');
        setDob(u.dob || '');
        setAddress(u.address || '');
        localStorage.setItem('user', JSON.stringify(u));
      } catch {
        addToast('Không thể tải hồ sơ', 'error');
      }
    })();
  }, [router, addToast]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getToken();
    if (!token) return;

    setSaving(true);
    try {
      const updated = await updateProfile({ name, phone, cccd, dob, address }, token);
      setUser(updated);
      localStorage.setItem('user', JSON.stringify(updated));
      setIsEditing(false);
      addToast('Đã cập nhật hồ sơ thành công!', 'success');
    } catch {
      addToast('Cập nhật thất bại', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 px-6 pb-20">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Hồ sơ cá nhân</h1>

        <div className="glass p-8 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-[80px]" />

          <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start">
            <div className="flex flex-col items-center gap-4">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-500 to-cyan-400 p-1">
                <div className="w-full h-full rounded-full bg-gray-900 flex items-center justify-center text-4xl font-bold text-white">
                  {user.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              </div>
              <button
                className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                onClick={() => addToast('Tính năng thay đổi ảnh đại diện đang được phát triển', 'info')}
              >
                Đổi ảnh
              </button>
            </div>

            <div className="flex-1 w-full">
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">Họ và tên</label>
                  {isEditing ? (
                    <input type="text" value={name} onChange={e => setName(e.target.value)} className="input-field" placeholder="Nhập họ và tên..." required />
                  ) : (
                    <div className="px-4 py-3 rounded-lg bg-white/5 border border-white/5 text-white">{user.name}</div>
                  )}
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">Email</label>
                  {isEditing ? (
                    <input type="email" value={email} className="input-field opacity-70 cursor-not-allowed" disabled title="Không thể thay đổi email" />
                  ) : (
                    <div className="px-4 py-3 rounded-lg bg-white/5 border border-white/5 text-gray-400">{user.email}</div>
                  )}
                  {isEditing && <p className="text-xs text-gray-500 mt-1">Email đăng nhập không thể thay đổi.</p>}
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">Số điện thoại</label>
                  {isEditing ? (
                    <input type="text" value={phone} onChange={e => setPhone(e.target.value)} className="input-field" placeholder="09xxxxxxx" />
                  ) : (
                    <div className="px-4 py-3 rounded-lg bg-white/5 border border-white/5 text-white">{user.phone || 'Chưa cập nhật'}</div>
                  )}
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">CCCD/CMND</label>
                  {isEditing ? (
                    <input type="text" value={cccd} onChange={e => setCccd(e.target.value)} className="input-field" placeholder="Nhập CCCD..." />
                  ) : (
                    <div className="px-4 py-3 rounded-lg bg-white/5 border border-white/5 text-white">{user.cccd || 'Chưa cập nhật'}</div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1.5">Ngày sinh</label>
                    {isEditing ? (
                      <input type="date" value={dob} onChange={e => setDob(e.target.value)} className="input-field" />
                    ) : (
                      <div className="px-4 py-3 rounded-lg bg-white/5 border border-white/5 text-white">{user.dob !== '1900-01-01' ? user.dob : 'Chưa cập nhật'}</div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1.5">Vai trò</label>
                    <div className="px-4 py-3 rounded-lg bg-white/5 border border-white/5 text-purple-400 font-bold uppercase">{user.role}</div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">Địa chỉ</label>
                  {isEditing ? (
                    <input type="text" value={address} onChange={e => setAddress(e.target.value)} className="input-field" placeholder="Nhập địa chỉ..." />
                  ) : (
                    <div className="px-4 py-3 rounded-lg bg-white/5 border border-white/5 text-white">{user.address || 'Chưa cập nhật'}</div>
                  )}
                </div>

                <div className="pt-4 flex items-center gap-3">
                  {isEditing ? (
                    <>
                      <button type="submit" className="btn-primary" disabled={saving}>
                        {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                      </button>
                      <button type="button" onClick={() => { setIsEditing(false); setName(user.name); }} className="btn-secondary" disabled={saving}>
                        Hủy
                      </button>
                    </>
                  ) : (
                    <button type="button" onClick={() => setIsEditing(true)} className="btn-primary">
                      Chỉnh sửa hồ sơ
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
