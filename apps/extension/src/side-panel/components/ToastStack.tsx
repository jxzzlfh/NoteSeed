export type ToastItem = {
  id: string;
  message: string;
  variant: 'success' | 'error' | 'info';
};

type ToastStackProps = {
  toasts: ToastItem[];
};

export function ToastStack({ toasts }: ToastStackProps) {
  if (toasts.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed bottom-3 left-1/2 z-50 flex w-[min(100%,22rem)] -translate-x-1/2 flex-col gap-2 px-2"
      aria-live="polite"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto rounded-lg border px-3 py-2 text-xs font-medium shadow-lg ${
            t.variant === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : t.variant === 'error'
                ? 'border-red-200 bg-red-50 text-red-800'
                : 'border-stone-200 bg-white text-stone-700'
          }`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
