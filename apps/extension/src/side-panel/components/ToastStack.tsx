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
          className={`pointer-events-auto rounded-md border px-3 py-2 text-xs shadow-lg backdrop-blur ${
            t.variant === 'success'
              ? 'border-emerald-200 bg-emerald-50/95 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/90 dark:text-emerald-100'
              : t.variant === 'error'
                ? 'border-red-200 bg-red-50/95 text-red-900 dark:border-red-800 dark:bg-red-950/90 dark:text-red-100'
                : 'border-stone-200 bg-white/95 text-stone-800 dark:border-stone-700 dark:bg-stone-900/95 dark:text-stone-100'
          }`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
