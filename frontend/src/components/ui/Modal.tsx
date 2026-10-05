"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/src/lib/utils";
import { Button } from "./Button";
import { COPY } from "@/src/content";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg";
}

const SIZE_CLASSES: Record<string, string> = {
  sm: "w-full max-w-sm",
  md: "w-full max-w-md",
  lg: "w-full max-w-2xl",
};

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) { if (!dialog.open) dialog.showModal(); }
    else { dialog.close(); }
  }, [open]);

  function handleBackdropClick(e: React.MouseEvent<HTMLDialogElement>) {
    const rect = dialogRef.current?.getBoundingClientRect();
    if (!rect) return;
    const { clientX: x, clientY: y } = e;
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      onClose();
    }
  }

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handler = () => onClose();
    dialog.addEventListener("cancel", handler);
    return () => dialog.removeEventListener("cancel", handler);
  }, [onClose]);

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      className={cn(
        "mx-auto my-auto p-0 bg-transparent focus:outline-none",
        "backdrop:bg-navy/70 backdrop:backdrop-blur-sm",
        SIZE_CLASSES[size],
      )}
    >
      {/* Card — navy background matching login/register pages */}
      <div className="flex flex-col bg-navy max-h-[90dvh] sm:max-h-[85dvh] overflow-hidden border border-white/10">

        {/* ── Header — gold accent line + gold title ──────────────── */}
        <div className="shrink-0 border-b border-white/10">
          {/* Gold top accent bar */}
          <div className="h-0.5 w-full bg-gold" />
          <div className="flex items-start justify-between gap-4 px-5 py-4 sm:px-6 sm:py-5">
            <div className="min-w-0">
              <h2 className="font-serif font-bold text-gold text-[1.1rem] leading-tight tracking-wide">
                {title}
              </h2>
              {description && (
                <p className="text-small text-white/50 mt-1 leading-relaxed">
                  {description}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              aria-label={COPY.actions.close}
              className="shrink-0 w-8 h-8 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/8 transition-colors mt-0.5"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* ── Body — scrollable, navy bg ───────────────────────────── */}
        {children && (
          <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
            {children}
          </div>
        )}

        {/* ── Footer — slightly lighter navy ───────────────────────── */}
        <div className="shrink-0 flex items-center justify-end gap-3 px-5 py-4 sm:px-6 border-t border-white/10 bg-white/4">
          {footer ?? (
            <Button variant="ghost" size="sm" onClick={onClose}>
              {COPY.actions.close}
            </Button>
          )}
        </div>

      </div>
    </dialog>
  );
}

/** Convenience confirm modal */
interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  loading?: boolean;
  destructive?: boolean;
}

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = COPY.actions.confirm,
  loading = false,
  destructive = false,
}: ConfirmModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={loading}>
            {COPY.actions.cancel}
          </Button>
          <Button
            variant={destructive ? "danger" : "secondary"}
            size="sm"
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-small text-white/70 leading-relaxed">{description}</p>
    </Modal>
  );
}
