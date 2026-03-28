'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

export type ToastTone = 'default' | 'success' | 'achievement';

export interface ToastInput {
  title: string;
  description?: string;
  icon?: string;
  tone?: ToastTone;
  durationMs?: number;
}

interface Toast extends ToastInput {
  id: string;
}

interface ToastContextValue {
  showToast: (toast: ToastInput) => string;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

function getToastToneClasses(tone: ToastTone) {
  switch (tone) {
    case 'achievement':
      return 'border-amber-200 dark:border-amber-500/60 bg-amber-50/80 dark:bg-amber-900/30';
    case 'success':
      return 'border-green-200 dark:border-green-500/60 bg-green-50/80 dark:bg-green-900/30';
    case 'default':
    default:
      return 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900';
  }
}

function getToastIconClasses(tone: ToastTone) {
  switch (tone) {
    case 'achievement':
      return 'bg-amber-200/70 text-amber-900 dark:bg-amber-500/30 dark:text-amber-100';
    case 'success':
      return 'bg-green-200/70 text-green-900 dark:bg-green-500/30 dark:text-green-100';
    case 'default':
    default:
      return 'bg-gray-200/70 text-gray-900 dark:bg-gray-700 dark:text-gray-100';
  }
}

function buildToastId() {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  return `toast-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function ToastCard({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const tone = toast.tone ?? 'default';

  return (
    <div
      className={`pointer-events-auto w-full rounded-xl border shadow-lg transition-all duration-300 ${
        entered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      } ${getToastToneClasses(tone)}`}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-3 p-4">
        {toast.icon ? (
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-full text-xl ${getToastIconClasses(tone)}`}
          >
            {toast.icon}
          </div>
        ) : null}
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{toast.title}</p>
          {toast.description ? (
            <p className="mt-1 text-xs text-gray-700 dark:text-gray-300">{toast.description}</p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => onDismiss(toast.id)}
          className="rounded-full px-2 py-1 text-xs font-semibold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          aria-label="Dismiss notification"
        >
          X
        </button>
      </div>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Map<string, number>>(new Map());

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      window.clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const showToast = useCallback(
    (toast: ToastInput) => {
      const id = buildToastId();
      const nextToast: Toast = {
        id,
        tone: toast.tone ?? 'default',
        ...toast,
      };

      setToasts(prev => {
        const next = [...prev, nextToast];
        if (next.length <= 4) return next;

        const overflow = next.slice(0, next.length - 4);
        overflow.forEach(item => {
          const timer = timersRef.current.get(item.id);
          if (timer) {
            window.clearTimeout(timer);
            timersRef.current.delete(item.id);
          }
        });
        return next.slice(-4);
      });

      const durationMs = toast.durationMs ?? 5500;
      const timer = window.setTimeout(() => dismissToast(id), durationMs);
      timersRef.current.set(id, timer);
      return id;
    },
    [dismissToast]
  );

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach(timer => window.clearTimeout(timer));
      timers.clear();
    };
  }, []);

  const contextValue = useMemo(() => ({ showToast, dismissToast }), [showToast, dismissToast]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div
        className="fixed left-4 right-4 top-4 z-50 flex flex-col gap-3 pointer-events-none sm:left-auto sm:right-4 sm:w-full sm:max-w-sm"
        aria-live="polite"
      >
        {toasts.map(toast => (
          <ToastCard key={toast.id} toast={toast} onDismiss={dismissToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}
