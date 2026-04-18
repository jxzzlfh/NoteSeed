import { useCallback, useEffect, useState } from 'react';
import type { SaveTarget, AIProviderType } from '@noteseed/shared-types';
import { SAVE_TARGETS, DEFAULT_ANTHROPIC_MODELS, DEFAULT_OPENAI_MODELS } from '@noteseed/shared-types';
import { TEMPLATE_OPTIONS } from '../side-panel/labels.js';

const SETTINGS_KEY = 'noteseed_settings_v1';

type TabId = 'general' | 'ai' | 'credentials' | 'about';

type AIProviderBlob = {
  provider: AIProviderType;
  apiKey: string;
  baseUrl: string;
  fastModel: string;
  powerfulModel: string;
};

type SettingsBlob = {
  defaultTemplate: string;
  defaultTarget: SaveTarget;
  outputLanguage: string;
  memos: { baseUrl: string; token: string };
  aiProvider: AIProviderBlob;
};

const DEFAULT_AI_PROVIDER: AIProviderBlob = {
  provider: 'anthropic',
  apiKey: '',
  baseUrl: '',
  fastModel: DEFAULT_ANTHROPIC_MODELS.fast,
  powerfulModel: DEFAULT_ANTHROPIC_MODELS.powerful,
};

const DEFAULT_SETTINGS: SettingsBlob = {
  defaultTemplate: 'balanced',
  defaultTarget: 'memos',
  outputLanguage: 'zh-CN',
  memos: { baseUrl: '', token: '' },
  aiProvider: { ...DEFAULT_AI_PROVIDER },
};

const TARGET_LABEL: Partial<Record<SaveTarget, string>> = {
  memos: 'Memos',
};

const PROVIDER_PRESETS: Record<
  string,
  { label: string; baseUrl: string; fast: string; powerful: string }
> = {
  anthropic: {
    label: 'Anthropic (Claude)',
    baseUrl: '',
    fast: DEFAULT_ANTHROPIC_MODELS.fast,
    powerful: DEFAULT_ANTHROPIC_MODELS.powerful,
  },
  openai: {
    label: 'OpenAI (GPT)',
    baseUrl: 'https://api.openai.com/v1',
    fast: DEFAULT_OPENAI_MODELS.fast,
    powerful: DEFAULT_OPENAI_MODELS.powerful,
  },
  'openai-deepseek': {
    label: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1',
    fast: 'deepseek-chat',
    powerful: 'deepseek-chat',
  },
  'openai-moonshot': {
    label: 'Moonshot (月之暗面)',
    baseUrl: 'https://api.moonshot.cn/v1',
    fast: 'moonshot-v1-8k',
    powerful: 'moonshot-v1-32k',
  },
  'openai-zhipu': {
    label: '智谱 (GLM)',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    fast: 'glm-4-flash',
    powerful: 'glm-4-plus',
  },
  'openai-custom': {
    label: '自定义 OpenAI 兼容',
    baseUrl: '',
    fast: '',
    powerful: '',
  },
};

function cn(...parts: (string | false | undefined)[]): string {
  return parts.filter(Boolean).join(' ');
}

const API_BASE_KEY = 'apiBaseUrl';
const DEFAULT_API_BASE = 'http://localhost:3000';

export function App() {
  const [tab, setTab] = useState<TabId>('general');
  const [settings, setSettings] = useState<SettingsBlob>(DEFAULT_SETTINGS);
  const [apiBaseUrl, setApiBaseUrl] = useState(DEFAULT_API_BASE);
  const [loaded, setLoaded] = useState(false);
  const [statusLine, setStatusLine] = useState<string | null>(null);
  const [testing, setTesting] = useState<'memos' | null>(null);

  useEffect(() => {
    void Promise.all([
      chrome.storage.local.get(SETTINGS_KEY),
      chrome.storage.local.get(API_BASE_KEY),
    ]).then(([rawSettings, rawApi]) => {
      const s = rawSettings[SETTINGS_KEY] as Partial<SettingsBlob> | undefined;
      if (s) {
        setSettings({
          ...DEFAULT_SETTINGS,
          ...s,
          memos: { ...DEFAULT_SETTINGS.memos, ...s.memos },
          aiProvider: { ...DEFAULT_AI_PROVIDER, ...s.aiProvider },
        });
      }
      const apiVal = rawApi[API_BASE_KEY];
      if (typeof apiVal === 'string' && apiVal.trim()) {
        setApiBaseUrl(apiVal.trim());
      }
      setLoaded(true);
    });
  }, []);

  const persistSettings = useCallback((next: SettingsBlob) => {
    setSettings(next);
    void chrome.storage.local.set({ [SETTINGS_KEY]: next });
  }, []);

  const flash = (msg: string) => {
    setStatusLine(msg);
    window.setTimeout(() => setStatusLine(null), 2500);
  };

  const onSaveGeneral = () => {
    persistSettings(settings);
    const trimmed = apiBaseUrl.trim().replace(/\/$/, '') || DEFAULT_API_BASE;
    setApiBaseUrl(trimmed);
    void chrome.storage.local.set({ [API_BASE_KEY]: trimmed });
    flash('已保存通用设置');
  };

  const onSaveAI = () => {
    persistSettings(settings);
    flash('已保存 AI 配置');
  };

  const saveMemosCreds = async () => {
    const { baseUrl, token } = settings.memos;
    persistSettings(settings);
    if (!baseUrl.trim() || !token.trim()) {
      flash('已保存本地设置（Memos 地址或 Token 为空，未同步到后端）');
      return;
    }
    const apiBase = apiBaseUrl.replace(/\/$/, '');
    try {
      const res = await fetch(
        `${apiBase}/api/v1/credentials`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            target: 'memos',
            data: { baseUrl: baseUrl.trim(), accessToken: token.trim() },
          }),
        },
      );
      if (res.ok) {
        flash('Memos 配置已保存并同步到后端');
      } else {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        flash(`本地已保存，但同步后端失败：${body.error ?? res.statusText}`);
      }
    } catch (err) {
      flash(`本地已保存，但无法访问后端：${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const onPresetChange = (presetKey: string) => {
    const preset = PROVIDER_PRESETS[presetKey];
    if (!preset) return;
    const provider: AIProviderType =
      presetKey === 'anthropic' ? 'anthropic' : 'openai';
    setSettings((s) => ({
      ...s,
      aiProvider: {
        ...s.aiProvider,
        provider,
        baseUrl: preset.baseUrl,
        fastModel: preset.fast,
        powerfulModel: preset.powerful,
      },
    }));
  };

  const testMemos = async () => {
    setTesting('memos');
    setStatusLine(null);
    try {
      const { baseUrl, token } = settings.memos;
      if (!baseUrl.trim() || !token.trim()) {
        setStatusLine('请填写 Memos 地址与 Token');
        return;
      }
      const apiBase = apiBaseUrl.replace(/\/$/, '');
      try {
        const res = await fetch(
          `${apiBase}/api/v1/credentials/test`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              target: 'memos',
              data: { baseUrl: baseUrl.trim(), token: token.trim() },
            }),
          },
        );
        const data = (await res.json().catch(() => ({}))) as {
          ok?: boolean;
          user?: string | null;
          error?: string;
          endpoint?: string;
          status?: number;
        };
        if (data.ok) {
          setStatusLine(
            `Memos 连接成功${data.user ? `（用户：${data.user}）` : ''}`,
          );
        } else {
          setStatusLine(
            `Memos 连接失败：${data.error ?? '未知错误'}${data.endpoint ? `（探测 ${data.endpoint}）` : ''}`,
          );
        }
      } catch (err) {
        setStatusLine(
          `Memos 测试失败：无法访问后端 ${apiBase}（${err instanceof Error ? err.message : String(err)}）`,
        );
      }
    } finally {
      setTesting(null);
    }
  };

  const version = chrome.runtime.getManifest().version;

  if (!loaded) {
    return (
      <div className="min-h-screen bg-stone-50 p-6 text-stone-600">
        加载中…
      </div>
    );
  }

  const inputCls =
    'w-full rounded-md border border-stone-200 bg-white px-3 py-2 font-mono text-sm text-stone-800 focus:border-seed focus:outline-none focus:ring-1 focus:ring-seed';
  const selectCls =
    'w-full rounded-md border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 focus:border-seed focus:outline-none focus:ring-1 focus:ring-seed';
  const labelCls = 'mb-1 block text-stone-500';
  const btnPrimary =
    'rounded-md bg-seed px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-seed/90';
  const btnSecondary =
    'rounded-md border border-stone-200 px-3 py-2 text-sm hover:bg-stone-50';

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800">
      <div className="mx-auto max-w-3xl px-4 py-6">
        <header className="mb-6 border-b border-stone-200 pb-4">
          <h1 className="text-2xl font-bold text-seed">NoteSeed 设置</h1>
          <p className="mt-1 text-sm text-stone-500">配置模板、AI 提供者与第三方凭证</p>
        </header>

        <nav
          className="mb-6 flex flex-wrap gap-1 rounded-lg border border-stone-200 bg-white p-1"
          aria-label="设置分区"
        >
          {(
            [
              ['general', '通用'],
              ['ai', 'AI 模型'],
              ['credentials', '凭证'],
              ['about', '关于'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={cn(
                'rounded-md px-3 py-2 text-sm font-medium transition',
                tab === id
                  ? 'bg-seed text-white shadow-sm'
                  : 'text-stone-500 hover:bg-stone-100 hover:text-stone-700',
              )}
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          ))}
        </nav>

        {statusLine ? (
          <div className="mb-4 rounded-md border border-stone-200 bg-stone-100 px-3 py-2 text-sm text-stone-700">
            {statusLine}
          </div>
        ) : null}

        {/* ── 通用 ── */}
        {tab === 'general' ? (
          <section className="space-y-4 rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-stone-800">通用</h2>

            <label className="block text-sm">
              <span className={labelCls}>
                NoteSeed 后端地址
                <span className="ml-1 text-xs text-stone-400">(本地开发默认 http://localhost:3000)</span>
              </span>
              <input
                className={inputCls}
                placeholder="http://localhost:3000"
                value={apiBaseUrl}
                onChange={(e) => setApiBaseUrl(e.target.value)}
              />
            </label>

            <label className="block text-sm">
              <span className={labelCls}>默认模板</span>
              <select
                className={selectCls}
                value={settings.defaultTemplate}
                onChange={(e) => setSettings((s) => ({ ...s, defaultTemplate: e.target.value }))}
              >
                {TEMPLATE_OPTIONS.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>

            <div>
              <div className="mb-2 text-sm text-stone-500">默认保存目标</div>
              <div className="space-y-2">
                {SAVE_TARGETS.filter((t) => TARGET_LABEL[t]).map((t) => (
                  <label key={t} className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="defaultTarget"
                      className="text-seed focus:ring-seed"
                      checked={settings.defaultTarget === t}
                      onChange={() => setSettings((s) => ({ ...s, defaultTarget: t }))}
                    />
                    {TARGET_LABEL[t]}
                  </label>
                ))}
              </div>
            </div>

            <label className="block text-sm">
              <span className={labelCls}>输出语言</span>
              <select
                className={selectCls}
                value={settings.outputLanguage}
                onChange={(e) => setSettings((s) => ({ ...s, outputLanguage: e.target.value }))}
              >
                <option value="zh-CN">简体中文</option>
                <option value="en">English</option>
              </select>
            </label>

            <button type="button" className={btnPrimary} onClick={onSaveGeneral}>
              保存
            </button>
          </section>
        ) : null}

        {/* ── AI 模型 ── */}
        {tab === 'ai' ? (
          <section className="space-y-5 rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
            <div>
              <h2 className="text-lg font-semibold text-stone-800">AI 模型配置</h2>
              <p className="mt-1 text-sm text-stone-500">
                选择 AI 提供者并配置 API 密钥。支持 Anthropic 和所有 OpenAI 协议兼容的服务。
              </p>
            </div>

            <label className="block text-sm">
              <span className={labelCls}>快速选择</span>
              <select
                className={selectCls}
                value=""
                onChange={(e) => {
                  if (e.target.value) onPresetChange(e.target.value);
                }}
              >
                <option value="">-- 选择预设 --</option>
                {Object.entries(PROVIDER_PRESETS).map(([key, { label }]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm">
              <span className={labelCls}>协议类型</span>
              <select
                className={selectCls}
                value={settings.aiProvider.provider}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    aiProvider: { ...s.aiProvider, provider: e.target.value as AIProviderType },
                  }))
                }
              >
                <option value="anthropic">Anthropic 协议</option>
                <option value="openai">OpenAI 协议</option>
              </select>
            </label>

            <label className="block text-sm">
              <span className={labelCls}>API Key</span>
              <input
                type="password"
                className={inputCls}
                autoComplete="off"
                placeholder={
                  settings.aiProvider.provider === 'anthropic'
                    ? 'sk-ant-...'
                    : 'sk-...'
                }
                value={settings.aiProvider.apiKey}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    aiProvider: { ...s.aiProvider, apiKey: e.target.value },
                  }))
                }
              />
            </label>

            <label className="block text-sm">
              <span className={labelCls}>
                API Base URL
                <span className="ml-1 text-xs text-stone-400">
                  {settings.aiProvider.provider === 'anthropic'
                    ? '(留空使用官方 api.anthropic.com)'
                    : '(留空使用 api.openai.com/v1)'}
                </span>
              </span>
              <input
                className={inputCls}
                placeholder={
                  settings.aiProvider.provider === 'anthropic'
                    ? 'https://api.anthropic.com'
                    : 'https://api.openai.com/v1'
                }
                value={settings.aiProvider.baseUrl}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    aiProvider: { ...s.aiProvider, baseUrl: e.target.value },
                  }))
                }
              />
            </label>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="block text-sm">
                <span className={labelCls}>
                  快速模型 <span className="text-xs text-stone-400">(分类/标签/元数据)</span>
                </span>
                <input
                  className={inputCls}
                  placeholder="e.g. gpt-4o-mini"
                  value={settings.aiProvider.fastModel}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      aiProvider: { ...s.aiProvider, fastModel: e.target.value },
                    }))
                  }
                />
              </label>
              <label className="block text-sm">
                <span className={labelCls}>
                  强力模型 <span className="text-xs text-stone-400">(内容蒸馏)</span>
                </span>
                <input
                  className={inputCls}
                  placeholder="e.g. gpt-4o"
                  value={settings.aiProvider.powerfulModel}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      aiProvider: { ...s.aiProvider, powerfulModel: e.target.value },
                    }))
                  }
                />
              </label>
            </div>

            <div className="rounded-lg border border-stone-100 bg-stone-50 p-3 text-xs text-stone-500">
              <p className="font-medium text-stone-600">兼容的 OpenAI 协议服务商：</p>
              <p className="mt-1">
                OpenAI / DeepSeek / Moonshot / 智谱 GLM / 通义千问 / Ollama / vLLM / LM Studio / Azure OpenAI 等
              </p>
            </div>

            <button type="button" className={btnPrimary} onClick={onSaveAI}>
              保存 AI 配置
            </button>
          </section>
        ) : null}

        {/* ── 凭证 ── */}
        {tab === 'credentials' ? (
          <section className="space-y-6 rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-stone-800">凭证</h2>

            <div className="space-y-3 rounded-lg border border-stone-100 p-4">
              <h3 className="text-sm font-semibold text-stone-700">Memos</h3>
              <label className="block text-sm">
                <span className={labelCls}>Base URL</span>
                <input
                  className={inputCls}
                  placeholder="https://memos.example.com"
                  value={settings.memos.baseUrl}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, memos: { ...s.memos, baseUrl: e.target.value } }))
                  }
                />
              </label>
              <label className="block text-sm">
                <span className={labelCls}>Token</span>
                <input
                  type="password"
                  className={inputCls}
                  autoComplete="off"
                  value={settings.memos.token}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, memos: { ...s.memos, token: e.target.value } }))
                  }
                />
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded-md bg-seed px-3 py-2 text-sm font-medium text-white hover:bg-seed/90 disabled:opacity-60"
                  onClick={() => void testMemos()}
                  disabled={testing !== null}
                >
                  {testing === 'memos' ? '测试中…' : '测试连接'}
                </button>
                <button type="button" className={btnSecondary} onClick={() => void saveMemosCreds()}>
                  保存 Memos 配置
                </button>
              </div>
            </div>
          </section>
        ) : null}

        {/* ── 关于 ── */}
        {tab === 'about' ? (
          <section className="space-y-3 rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-stone-800">关于</h2>
            <p className="text-sm text-stone-500">
              版本 <span className="font-mono text-stone-800">{version}</span>
            </p>
            <p className="text-sm">
              <a
                className="text-seed underline hover:text-seed/80"
                href="mailto:feedback@noteseed.app?subject=NoteSeed%20反馈"
              >
                反馈与建议
              </a>
            </p>
          </section>
        ) : null}
      </div>
    </div>
  );
}
