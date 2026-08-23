import type { ReactNode } from "react";
import { IconX } from "./ActionIcons";

type Props = {
  message: string;
  variant?: "info" | "error" | "success";
  onClose?: () => void;
};

export function GlassAlert({ message, variant = "info", onClose }: Props) {
  return (
    <div className={`glass-alert glass-alert--${variant}`} role="alert">
      <span>{message}</span>
      {onClose ? (
        <button type="button" className="glass-alert-close" aria-label="Dismiss" onClick={onClose}>
          <IconX />
        </button>
      ) : null}
    </div>
  );
}

type ToastProps = {
  message: string;
  onClose?: () => void;
};

export function GlassToast({ message, onClose }: ToastProps) {
  return (
    <div className="glass-toast" role="status">
      <span>{message}</span>
      {onClose ? (
        <button type="button" className="glass-alert-close" aria-label="Dismiss" onClick={onClose}>
          <IconX />
        </button>
      ) : null}
    </div>
  );
}

type BannerProps = {
  children: ReactNode;
  variant?: "error" | "info";
};

export function GlassBanner({ children, variant = "info" }: BannerProps) {
  return <div className={`glass-banner glass-banner--${variant}`}>{children}</div>;
}
