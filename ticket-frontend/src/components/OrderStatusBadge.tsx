'use client';

import { Order } from '@/lib/api';

interface OrderStatusBadgeProps {
  status: Order['status'];
}

export default function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  const config = {
    pending: {
      className: 'badge-pending',
      label: 'Đang chờ',
      icon: '⏳',
    },
    confirmed: {
      className: 'badge-confirmed',
      label: 'Đã xác nhận',
      icon: '✅',
    },
    cancelled: {
      className: 'badge-cancelled',
      label: 'Đã hủy',
      icon: '❌',
    },
  };

  const { className, label, icon } = config[status] || config.pending;

  return (
    <span className={`badge ${className}`}>
      <span>{icon}</span>
      {label}
    </span>
  );
}
