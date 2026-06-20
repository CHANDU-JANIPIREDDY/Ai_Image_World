import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

import { cn } from '@/utils/cn';

/**
 * Toast system — ToastProvider supplies a context; useToast() exposes
 * success/error/info methods. Toasts auto-dismiss and render top-right.
 *
 * Mount <ToastProvider> near the app root (see main.jsx).
 */

const ToastContext = createContext(null);

const ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

const ACCENT = {
  success: 'text-emerald-400',
  error: 'text-red-400',
  info: 'text-secondary',
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (type, message, duration = 2500) => {
      const id = ++idRef.current;
      setToasts((prev) => [...prev, { id, type, message }]);
      setTimeout(() => remove(id), duration);
    },
    [remove]
  );

  const api = useRef({
    success: (msg, d) => addToast('success', msg, d),
    error: (msg, d) => addToast('error', msg, d),
    info: (msg, d) => addToast('info', msg, d),
  }).current;

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        className="pointer-events-none fixed right-4 top-4 z-[200] flex w-full max-w-sm flex-col gap-2"
        role="region"
        aria-label="Notifications"
      >
        <AnimatePresence>
          {toasts.map((t) => {
            const Icon = ICONS[t.type] || Info;
            return (
              <motion.div
                key={t.id}
                role="status"
                initial={{ opacity: 0, y: -12, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 40 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="pointer-events-auto flex items-center gap-3 rounded-2xl glass-panel px-4 py-3"
              >
                <Icon className={cn('h-5 w-5 shrink-0', ACCENT[t.type])} aria-hidden="true" />
                <span className="flex-1 text-sm text-content">{t.message}</span>
                <button
                  onClick={() => remove(t.id)}
                  aria-label="Dismiss"
                  className="text-content-muted transition-colors hover:text-content"
                >
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}
