'use client';

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function ConfirmModal({
  open, title, message,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Hủy',
  onConfirm, onCancel, loading
}: ConfirmModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="glass p-8 rounded-2xl w-full max-w-sm relative z-10">
        <h3 className="text-lg font-bold mb-3">{title}</h3>
        <p className="text-gray-400 text-sm mb-6">{message}</p>
        <div className="flex items-center gap-3">
          <button className="btn-primary" disabled={loading} onClick={onConfirm}>
            {loading ? 'Đang xử lý...' : confirmLabel}
          </button>
          <button className="btn-secondary" disabled={loading} onClick={onCancel}>
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
