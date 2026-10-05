"use client";

/**
 * Simple in-app toast / notification system.
 * Usage: import { useToast } from "@/src/components/ui/Toast"
 *        const { toast } = useToast();
 *        toast.success("Saved!");
 */

import {
  createContext,
  useCallback,
  useContext,
  useState,
  useEffect,
} from "react";
import { cn } from "@/src/lib/utils";

type ToastType = "success" | "error" | "info";

interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  toast: {
    success: (message: string) => void;
    error: (message: string) => void;
    info: (message: string) => void;
  };
}

const ToastContext = createContext<ToastContextValue | null>(null);

const TYPE_CLASSES: Record<ToastType, string> = {
  success: "bg-success text-white",
  error: "bg-error text-white",
  info: "bg-navy text-white",
};

const TYPE_ICON: Record<ToastType, string> = {
  success: "✓",
  error: "✕",
  info: "i",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const add = useCallback((type: ToastType, message: string) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const value: ToastContextValue = {
    toast: {
      success: (m) => add("success", m),
      error: (m) => add("error", m),
      info: (m) => add("info", m),
    },
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Toast container — fixed, top-right */}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="fixed top-4 right-4 z-[var(--z-toast)] flex flex-col gap-2 pointer-events-none"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={cn(
              "flex items-center gap-2 px-4 py-3 rounded-md text-small font-medium",
              "pointer-events-auto shadow-none",
              TYPE_CLASSES[t.type],
            )}
          >
            <span
              className="w-5 h-5 flex items-center justify-center rounded-full bg-white/20 text-caption font-bold shrink-0"
              aria-hidden="true"
            >
              {TYPE_ICON[t.type]}
            </span>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
