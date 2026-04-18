import { useEffect, useState } from 'react';
import type { SaveTarget } from '@noteseed/shared-types';

const TARGET_LABEL: Partial<Record<SaveTarget, string>> = {
  memos: 'Memos',
};

const VISIBLE_TARGETS: SaveTarget[] = ['memos'];

const STORAGE_KEY = 'noteseed_settings_v1';

type SettingsShape = {
  memos?: { baseUrl?: string; token?: string };
};

function readConnection(settings: SettingsShape | null, target: SaveTarget): boolean {
  if (!settings) return false;
  switch (target) {
    case 'memos':
      return Boolean(settings.memos?.baseUrl?.trim() && settings.memos?.token?.trim());
    default:
      return false;
  }
}

type TargetPickerProps = {
  selected: SaveTarget[];
  onChange: (next: SaveTarget[]) => void;
};

export function TargetPicker({ selected, onChange }: TargetPickerProps) {
  const [connected, setConnected] = useState<Partial<Record<SaveTarget, boolean>>>({});

  useEffect(() => {
    void chrome.storage.local.get(STORAGE_KEY).then((raw) => {
      const settings = (raw[STORAGE_KEY] as SettingsShape | undefined) ?? null;
      const next: Partial<Record<SaveTarget, boolean>> = {};
      for (const t of VISIBLE_TARGETS) {
        next[t] = readConnection(settings, t);
      }
      setConnected(next);
    });
    const listener: Parameters<typeof chrome.storage.onChanged.addListener>[0] = (changes, area) => {
      if (area !== 'local' || !changes[STORAGE_KEY]) return;
      const settings = changes[STORAGE_KEY].newValue as SettingsShape | undefined;
      const next: Partial<Record<SaveTarget, boolean>> = {};
      for (const t of VISIBLE_TARGETS) {
        next[t] = readConnection(settings ?? null, t);
      }
      setConnected(next);
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, []);

  const toggle = (t: SaveTarget) => {
    if (selected.includes(t)) {
      onChange(selected.filter((x) => x !== t));
    } else {
      onChange([...selected, t]);
    }
  };

  return (
    <fieldset className="rounded-xl border border-stone-200 bg-white p-3 shadow-sm">
      <legend className="px-1 text-[11px] font-semibold text-stone-400">保存目标</legend>
      <ul className="space-y-1.5">
        {VISIBLE_TARGETS.map((t) => {
          const checked = selected.includes(t);
          const ok = connected[t] ?? false;
          return (
            <li key={t} className="flex items-center justify-between gap-2">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-stone-700">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-stone-300 text-seed focus:ring-seed/30"
                  checked={checked}
                  onChange={() => toggle(t)}
                />
                <span className="font-medium">{TARGET_LABEL[t] ?? t}</span>
              </label>
              <span
                className={`inline-flex items-center gap-1.5 text-[10px] font-medium ${
                  ok ? 'text-seed' : 'text-stone-400'
                }`}
                title={ok ? '已配置凭证' : '未配置凭证'}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${ok ? 'bg-seed' : 'bg-stone-300'}`} />
                {ok ? '已连接' : '未连接'}
              </span>
            </li>
          );
        })}
      </ul>
    </fieldset>
  );
}
