import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

/**
 * ConfirmDialog — confirm/cancel modal for destructive actions.
 */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message,
  confirmText = 'Confirm',
  loading = false,
  danger = true,
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} className="max-w-md">
      {message && <p className="text-sm text-content-muted">{message}</p>}
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="ghost" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>
          {confirmText}
        </Button>
      </div>
    </Modal>
  );
}
