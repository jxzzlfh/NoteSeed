type TopBarProps = {
  pageTypeLabel: string;
};

export function TopBar({ pageTypeLabel }: TopBarProps) {
  return (
    <header className="flex shrink-0 items-center justify-between gap-2 border-b border-stone-200 bg-white/90 px-3 py-2 backdrop-blur dark:border-stone-700 dark:bg-stone-900/90">
      <div className="flex min-w-0 items-center gap-2">
        <span className="truncate text-sm font-semibold text-seed dark:text-emerald-400" title="NoteSeed">
          🌱 NoteSeed
        </span>
        <span
          className="inline-flex max-w-[8rem] shrink-0 items-center rounded-full border border-soil/30 bg-soil/10 px-2 py-0.5 text-[11px] font-medium text-soil dark:border-amber-700/40 dark:bg-amber-900/30 dark:text-amber-200"
          title="页面类型"
        >
          {pageTypeLabel}
        </span>
      </div>
      <button
        type="button"
        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-stone-500 transition hover:bg-stone-100 hover:text-seed dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-emerald-400"
        title="设置"
        aria-label="打开设置"
        onClick={() => void chrome.runtime.openOptionsPage()}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="h-5 w-5"
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>
    </header>
  );
}
