import { useEffect, useState } from 'react';
import type { SaveTarget } from '@noteseed/shared-types';
import { SAVE_TARGETS } from '@noteseed/shared-types';

const TARGET_LABEL: Record<SaveTarget, string> = {
  memos: 'Memos',
  feishu: '飞书',
  get: 'Get',
  ksdoc: '金山',
};

const STORAGE_KEY = 'noteseed_settings_v1';

type SettingsShape = {
  memos?: { baseUrl?: string; token?: string };
  feishu?: { appId?: string; appSecret?: string };
  get?: { token?: string };
  ksdoc?: { token?: string };
};

function readConnection(settings: SettingsShape | null, target: SaveTarget): boolean {
  if (!settings) return false;
  switch (target) {
    case 'memos':
      return Boolean(settings.memos?.baseUrl?.trim() && settings.memos?.token?.trim());
    case 'feishu':
      return Boolean(settings.feishu?.appId?.trim() && settings.feishu?.appSecret?.trim());
    case 'get':
      return Boolean(settings.get?.token?.trim());
    case 'ksdoc':
      return Boolean(settings.ksdoc?.token?.trim());
    default:
      return false;
  }
}

type TargetPickerProps = {
  selected: SaveTarget[];
  onChange: (next: SaveTarget[]) => void;
};

export function TargetPicker({ selected, onChange }: TargetPickerProps) {
  const [connected, setConnected] = useState<Record<SaveTarget, boolean>>({
    memos: false,
    feishu: false,
    get: false,
    ksdoc: false,
  });

  useEffect(() => {
    void chrome.storage.local.get(STORAGE_KEY).then((raw) => {
      const settings = (raw[STORAGE_KEY] as SettingsShape | undefined) ?? null;
      const next = {} as Record<SaveTarget, boolean>;
      for (const t of SAVE_TARGETS) {
        next[t] = readConnection(settings, t);
      }
      setConnected(next);
    });
    const listener: Parameters<typeof chrome.storage.onChanged.addListener>[0] = (changes, area) => {
      if (area !== 'local' || !changes[STORAGE_KEY]) return;
      const settings = changes[STORAGE_KEY].newValue as SettingsShape | undefined;
      const next = {} as Record<SaveTarget, boolean>;
      for (const t of SAVE_TARGETS) {
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
    <fieldset className="rounded-lg border border-stone-200 bg-stone-50/80 p-3 dark:border-stone-700 dark:bg-stone-900/50">
      <legend className="px-1 text-xs font-medium text-stone-600 dark:text-stone-300">保存目标</legend>
      <ul className="space-y-2">
        {SAVE_TARGETS.map((t) => {
          const checked = selected.includes(t);
          const ok = connected[t];
          return (
            <li key={t} className="flex items-center justify-between gap-2">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-stone-800 dark:text-stone-200">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-stone-300 text-seed focus:ring-seed dark:border-stone-600 dark:bg-stone-900"
                  checked={checked}
                  onChange={() => toggle(t)}
                />
                <span>{TARGET_LABEL[t]}</span>
              </label>
              <span
                className={`inline-flex items-center gap-1 text-[10px] font-medium ${
                  ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-stone-400 dark:text-stone-500'
                }`}
                title={ok ? '已配置凭证' : '未配置凭证'}
              >
                <span className={`h-2 w-2 rounded-full ${ok ? 'bg-emerald-500' : 'bg-stone-300 dark:bg-stone-600'}`} />
                {ok ? '已连接' : '未连接'}
              </span>
            </li>
          );
        })}
      </ul>
    </fieldset>
  );
}
