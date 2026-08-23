import type { ReactNode } from "react";

type Props = {
  title: string;
  children: ReactNode;
  onClose: () => void;
  footer?: ReactNode;
  subtitle?: string;
};

export function GlassModal({ title, children, onClose, footer, subtitle }: Props) {
  return (
    <div className="glass-modal-backdrop" role="presentation" onClick={onClose}>
      <div className="glass-modal" role="dialog" aria-modal aria-labelledby="glass-modal-title" onClick={(e) => e.stopPropagation()}>
        <h2 id="glass-modal-title" className="glass-modal-title">
          {title}
        </h2>
        {subtitle ? <p className="glass-modal-subtitle">{subtitle}</p> : null}
        <div className="glass-modal-body">{children}</div>
        {footer ? <div className="glass-modal-footer">{footer}</div> : null}
      </div>
    </div>
  );
}
