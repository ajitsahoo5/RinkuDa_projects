import { IconCheck, IconX } from "./ActionIcons";

type Props = {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = false,
  busy = false,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <div className="glass-modal-backdrop" role="presentation" onClick={onCancel}>
      <div className="glass-modal glass-modal--compact" role="alertdialog" aria-modal onClick={(e) => e.stopPropagation()}>
        <h2 className="glass-modal-title">{title}</h2>
        <p className="glass-modal-message">{message}</p>
        <div className="glass-modal-footer">
          <button type="button" className="glass-btn-secondary" onClick={onCancel} disabled={busy}>
            <IconX />
            <span>{cancelLabel}</span>
          </button>
          <button
            type="button"
            className={danger ? "glass-btn-danger" : "glass-btn-primary"}
            onClick={onConfirm}
            disabled={busy}
          >
            <IconCheck />
            <span>{confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
