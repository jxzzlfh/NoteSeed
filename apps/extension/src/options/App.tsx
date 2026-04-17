import { useCallback, useEffect, useState } from 'react';
import type { SaveTarget, AIProviderType } from '@noteseed/shared-types';
import { SAVE_TARGETS, DEFAULT_ANTHROPIC_MODELS, DEFAULT_OPENAI_MODELS } from '@noteseed/shared-types';
import { TEMPLATE_OPTIONS } from '../side-panel/labels.js';

const SETTINGS_KEY = 'noteseed_settings_v1';

type TabId = 'general' | 'ai' | 'account' | 'credentials' | 'about';

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
  feishu: { appId: string; appSecret: string };
  get: { token: string };
  ksdoc: { token: string };
  aiProvider: AIProviderBlob;
};

type AccountBlob = {
  email: string | null;
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
  feishu: { appId: '', appSecret: '' },
  get: { token: '' },
  ksdoc: { token: '' },
  aiProvider: { ...DEFAULT_AI_PROVIDER },
};

const TARGET_LABEL: Record<SaveTarget, string> = {
  memos: 'Memos',
  feishu: '飞书',
  get: 'Get',
  ksdoc: '金山',
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

export function App() {
  const [tab, setTab] = useState<TabId>('general');
  const [settings, setSettings] = useState<SettingsBlob>(DEFAULT_SETTINGS);
  const [account, setAccount] = useState<AccountBlob>({ email: null });
  const [loaded, setLoaded] = useState(false);
  const [statusLine, setStatusLine] = useState<string | null>(null);
  const [testing, setTesting] = useState<'memos' | 'feishu' | null>(null);

  useEffect(() => {
    void chrome.storage.local.get([SETTINGS_KEY, 'noteseed_account']).then((raw) => {
      const s = raw[SETTINGS_KEY] as Partial<SettingsBlob> | undefined;
      const a = raw.noteseed_account as AccountBlob | undefined;
      if (s) {
        setSettings({
          ...DEFAULT_SETTINGS,
          ...s,
          memos: { ...DEFAULT_SETTINGS.memos, ...s.memos },
          feishu: { ...DEFAULT_SETTINGS.feishu, ...s.feishu },
          get: { ...DEFAULT_SETTINGS.get, ...s.get },
          ksdoc: { ...DEFAULT_SETTINGS.ksdoc, ...s.ksdoc },
          aiProvider: { ...DEFAULT_AI_PROVIDER, ...s.aiProvider },
        });
      }
      if (a?.email !== undefined) setAccount(a);
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
    flash('已保存通用设置');
  };

  const onSaveAI = () => {
    persistSettings(settings);
    flash('已保存 AI 配置');
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
      const root = baseUrl.replace(/\/$/, '');
      const res = await fetch(`${root}/api/v1/status`, {
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => null);
      if (res?.ok) {
        setStatusLine('Memos 连接成功');
      } else {
        setStatusLine('Memos 连接失败（请检查地址与 Token）');
      }
    } finally {
      setTesting(null);
    }
  };

  const testFeishu = async () => {
    setTesting('feishu');
    setStatusLine(null);
    try {
      const { appId, appSecret } = settings.feishu;
      if (!appId.trim() || !appSecret.trim()) {
        setStatusLine('请填写飞书 App ID 与 Secret');
        return;
      }
      await new Promise((r) => setTimeout(r, 400));
      setStatusLine('飞书凭证已记录（演示：未调用真实接口）');
    } finally {
      setTesting(null);
    }
  };

  const loginDemo = () => {
    const email = 'user@example.com';
    const next = { email };
    setAccount(next);
    void chrome.storage.local.set({ noteseed_account: next });
    setStatusLine('已登录（演示账号）');
  };

  const logout = () => {
    const next = { email: null };
    setAccount(next);
    void chrome.storage.local.set({ noteseed_account: next });
    setStatusLine('已退出');
  };

  const version = chrome.runtime.getManifest().version;

  if (!loaded) {
    return (
      <div className="min-h-screen bg-stone-50 p-6 text-stone-600 dark:bg-stone-950 dark:text-stone-300">
        加载中…
      </div>
    );
  }

  const inputCls =
    'w-full rounded-md border border-stone-200 px-3 py-2 font-mono text-sm focus:border-seed focus:outline-none focus:ring-1 focus:ring-seed dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100';
  const selectCls =
    'w-full rounded-md border border-stone-200 bg-white px-3 py-2 text-sm focus:border-seed focus:outline-none focus:ring-1 focus:ring-seed dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100';
  const labelCls = 'mb-1 block text-stone-600 dark:text-stone-400';
  const btnPrimary =
    'rounded-md bg-seed px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-seed/90 dark:shadow-none';
  const btnSecondary =
    'rounded-md border border-stone-200 px-3 py-2 text-sm hover:bg-stone-50 dark:border-stone-700 dark:hover:bg-stone-800';

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 dark:bg-stone-950 dark:text-stone-100">
      <div className="mx-auto max-w-3xl px-4 py-6">
        <header className="mb-6 border-b border-stone-200 pb-4 dark:border-stone-800">
          <h1 className="text-2xl font-semibold text-seed dark:text-emerald-400">NoteSeed 设置</h1>
          <p className="mt-1 text-sm text-soil dark:text-amber-200/90">配置模板、AI 提供者、账号与第三方凭证</p>
        </header>

        <nav
          className="mb-6 flex flex-wrap gap-1 rounded-lg border border-stone-200 bg-white p-1 dark:border-stone-800 dark:bg-stone-900/80"
          aria-label="设置分区"
        >
          {(
            [
              ['general', '通用'],
              ['ai', 'AI 模型'],
              ['account', '账号'],
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
                  ? 'bg-seed text-white shadow-sm dark:bg-emerald-800'
                  : 'text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800',
              )}
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          ))}
        </nav>

        {statusLine ? (
          <div className="mb-4 rounded-md border border-stone-200 bg-stone-100 px-3 py-2 text-sm text-stone-800 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200">
            {statusLine}
          </div>
        ) : null}

        {/* ── 通用 ── */}
        {tab === 'general' ? (
          <section className="space-y-4 rounded-xl border border-stone-200 bg-white p-5 shadow-sm dark:border-stone-800 dark:bg-stone-900/60">
            <h2 className="text-lg font-medium text-stone-900 dark:text-stone-100">通用</h2>
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
              <div className="mb-2 text-sm text-stone-600 dark:text-stone-400">默认保存目标</div>
              <div className="space-y-2">
                {SAVE_TARGETS.map((t) => (
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
          <section className="space-y-5 rounded-xl border border-stone-200 bg-white p-5 shadow-sm dark:border-stone-800 dark:bg-stone-900/60">
            <div>
              <h2 className="text-lg font-medium text-stone-900 dark:text-stone-100">AI 模型配置</h2>
              <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
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

            <div className="rounded-lg border border-stone-100 bg-stone-50 p-3 text-xs text-stone-500 dark:border-stone-800 dark:bg-stone-900/40 dark:text-stone-400">
              <p className="font-medium text-stone-700 dark:text-stone-300">兼容的 OpenAI 协议服务商：</p>
              <p className="mt-1">
                OpenAI / DeepSeek / Moonshot / 智谱 GLM / 通义千问 / Ollama / vLLM / LM Studio / Azure OpenAI 等
              </p>
            </div>

            <button type="button" className={btnPrimary} onClick={onSaveAI}>
              保存 AI 配置
            </button>
          </section>
        ) : null}

        {/* ── 账号 ── */}
        {tab === 'account' ? (
          <section className="space-y-4 rounded-xl border border-stone-200 bg-white p-5 shadow-sm dark:border-stone-800 dark:bg-stone-900/60">
            <h2 className="text-lg font-medium text-stone-900 dark:text-stone-100">账号</h2>
            <p className="text-sm text-stone-600 dark:text-stone-400">
              登录状态：
              <span className="ml-2 font-medium text-stone-900 dark:text-stone-100">
                {account.email ? '已登录' : '未登录'}
              </span>
            </p>
            {account.email ? (
              <p className="text-sm">
                邮箱：<span className="font-mono">{account.email}</span>
              </p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-md border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-800 hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100 dark:hover:bg-stone-900"
                onClick={loginDemo}
              >
                演示登录
              </button>
              <button
                type="button"
                className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-800 hover:bg-red-100 dark:border-red-900 dark:bg-red-950/60 dark:text-red-200 dark:hover:bg-red-950"
                onClick={logout}
                disabled={!account.email}
              >
                退出登录
              </button>
            </div>
          </section>
        ) : null}

        {/* ── 凭证 ── */}
        {tab === 'credentials' ? (
          <section className="space-y-6 rounded-xl border border-stone-200 bg-white p-5 shadow-sm dark:border-stone-800 dark:bg-stone-900/60">
            <h2 className="text-lg font-medium text-stone-900 dark:text-stone-100">凭证</h2>

            <div className="space-y-3 rounded-lg border border-stone-100 p-4 dark:border-stone-800">
              <h3 className="text-sm font-semibold text-stone-800 dark:text-stone-200">Memos</h3>
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
                <button type="button" className={btnSecondary} onClick={() => persistSettings(settings)}>
                  保存 Memos 配置
                </button>
              </div>
            </div>

            <div className="space-y-3 rounded-lg border border-stone-100 p-4 dark:border-stone-800">
              <h3 className="text-sm font-semibold text-stone-800 dark:text-stone-200">飞书</h3>
              <label className="block text-sm">
                <span className={labelCls}>App ID</span>
                <input
                  className={inputCls}
                  value={settings.feishu.appId}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, feishu: { ...s.feishu, appId: e.target.value } }))
                  }
                />
              </label>
              <label className="block text-sm">
                <span className={labelCls}>App Secret</span>
                <input
                  type="password"
                  className={inputCls}
                  autoComplete="off"
                  value={settings.feishu.appSecret}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      feishu: { ...s.feishu, appSecret: e.target.value },
                    }))
                  }
                />
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded-md bg-seed px-3 py-2 text-sm font-medium text-white hover:bg-seed/90 disabled:opacity-60"
                  onClick={() => void testFeishu()}
                  disabled={testing !== null}
                >
                  {testing === 'feishu' ? '测试中…' : '测试连接'}
                </button>
                <button type="button" className={btnSecondary} onClick={() => persistSettings(settings)}>
                  保存飞书配置
                </button>
              </div>
            </div>

            <p className="text-xs text-stone-500 dark:text-stone-500">
              Get / 金山文档 的凭证配置将随后续版本接入；侧栏中可通过可选 Token 显示连接状态。
            </p>
          </section>
        ) : null}

        {/* ── 关于 ── */}
        {tab === 'about' ? (
          <section className="space-y-3 rounded-xl border border-stone-200 bg-white p-5 shadow-sm dark:border-stone-800 dark:bg-stone-900/60">
            <h2 className="text-lg font-medium text-stone-900 dark:text-stone-100">关于</h2>
            <p className="text-sm text-stone-600 dark:text-stone-400">
              版本 <span className="font-mono text-stone-900 dark:text-stone-100">{version}</span>
            </p>
            <p className="text-sm">
              <a
                className="text-seed underline hover:text-seed/80 dark:text-emerald-400"
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
