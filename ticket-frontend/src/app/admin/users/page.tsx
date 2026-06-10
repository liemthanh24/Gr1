'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminGetAllUsers, adminUpdateUserRole, User } from '@/lib/api';

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) { router.push('/login'); return; }
    try {
      const u = JSON.parse(userStr);
      if (u.role !== 'admin') { router.push('/'); return; }
    } catch { router.push('/'); return; }

    const token = localStorage.getItem('token');
    if (!token) return;

    (async () => {
      try {
        const data = await adminGetAllUsers(token);
        setUsers(data.users || []);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const handleToggleRole = async (userId: number, currentRole: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setUpdatingId(userId);
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    try {
      await adminUpdateUserRole(userId, newRole, token);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch {
      alert('Lỗi khi cập nhật quyền');
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="spinner" /></div>;

  return (
    <div className="min-h-screen pt-24 px-6 pb-20 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Quản lý người dùng</h1>
          <p className="text-gray-500 mt-1 text-sm">Tổng số: {users.length} người dùng</p>
        </div>
        <button onClick={() => router.push('/admin')} className="btn-secondary text-sm">← Dashboard</button>
      </div>

      <div className="glass overflow-hidden rounded-xl">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/5 border-b border-white/5">
            <tr>
              <th className="p-4 font-medium text-gray-400">ID</th>
              <th className="p-4 font-medium text-gray-400">Tên</th>
              <th className="p-4 font-medium text-gray-400">Email</th>
              <th className="p-4 font-medium text-gray-400">Vai trò</th>
              <th className="p-4 font-medium text-gray-400 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-white/5 transition-colors">
                <td className="p-4 text-gray-500">#{u.id}</td>
                <td className="p-4 font-medium">{u.name}</td>
                <td className="p-4 text-gray-400">{u.email}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    u.role === 'admin'
                      ? 'bg-purple-500/20 text-purple-400'
                      : 'bg-gray-500/20 text-gray-400'
                  }`}>
                    {u.role === 'admin' ? 'Admin' : 'User'}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <button
                    className={`text-sm disabled:opacity-50 ${
                      u.role === 'admin' ? 'text-orange-400 hover:text-orange-300' : 'text-purple-400 hover:text-purple-300'
                    }`}
                    disabled={updatingId === u.id}
                    onClick={() => handleToggleRole(u.id, u.role)}
                  >
                    {updatingId === u.id ? 'Đang cập nhật...' : u.role === 'admin' ? 'Hạ xuống User' : 'Nâng lên Admin'}
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500">Không có người dùng nào.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
