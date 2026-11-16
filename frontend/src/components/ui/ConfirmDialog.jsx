import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { AlertTriangle } from 'lucide-react';

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  loading = false,
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={null} maxWidth="max-w-sm">
      <div className="flex flex-col items-center text-center gap-4">
        <div className={`p-3 rounded-full ${variant === 'danger' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
          <AlertTriangle size={24} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-ink mb-1">{title}</h3>
          {message && <p className="text-sm text-muted">{message}</p>}
        </div>
        <div className="flex gap-3 w-full">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant={variant} className="flex-1" onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
