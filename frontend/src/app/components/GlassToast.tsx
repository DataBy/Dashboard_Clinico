import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

interface ToastItem {
  id: number;
  message: string;
  visible: boolean;
}

interface ToastContextValue {
  showToast: (message: string, durationMs?: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useGlassToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useGlassToast must be used inside GlassToastProvider.");
  }
  return context;
}

export function GlassToastProvider({ children }: PropsWithChildren) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, durationMs = 2300) => {
    const id = Date.now() + Math.floor(Math.random() * 10000);
    const fadeOutDelay = Math.max(durationMs - 300, 200);

    setToasts((prev) => [...prev, { id, message, visible: true }]);

    window.setTimeout(() => {
      setToasts((prev) =>
        prev.map((toast) =>
          toast.id === id ? { ...toast, visible: false } : toast
        )
      );
    }, fadeOutDelay);

    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, durationMs + 350);
  }, []);

  const contextValue = useMemo<ToastContextValue>(
    () => ({ showToast }),
    [showToast]
  );

  return (
    <ToastContext.Provider value={contextValue}>
      {children}

      <div className="pointer-events-none fixed top-5 right-5 z-[120] flex w-[320px] max-w-[calc(100vw-2rem)] flex-col gap-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`rounded-2xl border border-white/40 bg-white/65 px-4 py-3 text-sm font-medium text-gray-800 shadow-[0_16px_40px_rgba(31,41,55,0.18)] backdrop-blur-xl transition-all duration-300 ${
              toast.visible ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
