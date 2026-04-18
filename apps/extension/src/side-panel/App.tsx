import { useCallback, useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import type { SaveTarget } from '@noteseed/shared-types';
import { getUserFriendlyError } from '@/shared/error-messages.js';
import { ActionBar } from './components/ActionBar.js';
import { CardPreview } from './components/CardPreview.js';
import { ExportBar } from './components/ExportBar.js';
import { LoadingProgress } from './components/LoadingProgress.js';
import { PageInfoPanel } from './components/PageInfoPanel.js';
import { ToastStack, type ToastItem } from './components/ToastStack.js';
import { TopBar } from './components/TopBar.js';
import { TargetPicker } from './components/TargetPicker.js';
import { PAGE_TYPE_LABELS } from './labels.js';
import { useCaptureStore } from './store/capture-store.js';
import { useCardStore } from './store/card-store.js';
import { useSaveStore } from './store/save-store.js';

const SETTINGS_KEY = 'noteseed_settings_v1';

type StoredSettings = {
  defaultTemplate?: string;
  defaultTarget?: SaveTarget;
  outputLanguage?: string;
};

function pushToast(
  setToasts: Dispatch<SetStateAction<ToastItem[]>>,
  message: string,
  variant: ToastItem['variant']
) {
  const id = crypto.randomUUID();
  setToasts((prev) => [...prev, { id, message, variant }]);
  window.setTimeout(() => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, 4200);
}

export function App() {
  const capture = useCaptureStore();
  const card = useCardStore();
  const save = useSaveStore();
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    void capture.capture();
  }, [capture.capture]);

  useEffect(() => {
    void chrome.storage.local.get(SETTINGS_KEY).then((raw) => {
      const s = raw[SETTINGS_KEY] as StoredSettings | undefined;
      if (s?.defaultTemplate) {
        card.setSelectedTemplate(s.defaultTemplate);
      }
      if (s?.defaultTarget) {
        save.setTargets([s.defaultTarget]);
      }
    });
  }, [card.setSelectedTemplate, save.setTargets]);

  const pageTypeLabel = useMemo(() => {
    if (card.pageType) return PAGE_TYPE_LABELS[card.pageType];
    return '未识别';
  }, [card.pageType]);

  const handleGenerate = useCallback(async () => {
    const src = capture.pageSource;
    if (!src) {
      pushToast(setToasts, '请先完成页面识别', 'error');
      return;
    }
    await card.generate(src);
  }, [capture.pageSource, card.generate]);

  useEffect(() => {
    if (card.status === 'error' && card.error) {
      const info = getUserFriendlyError(card.error, card.error);
      pushToast(setToasts, `${info.title}：${info.message}`, 'error');
    }
  }, [card.status, card.error]);

  useEffect(() => {
    if (capture.status === 'error' && capture.error) {
      const info = getUserFriendlyError(capture.error, capture.error);
      pushToast(setToasts, `${info.title}：${info.message}`, 'error');
    }
  }, [capture.status, capture.error]);

  useEffect(() => {
    if (save.status === 'success') {
      pushToast(setToasts, '已保存到所选目标', 'success');
    }
    if (save.status === 'error' && save.error) {
      const info = getUserFriendlyError(save.error, save.error);
      pushToast(setToasts, `${info.title}：${info.message}`, 'error');
    }
  }, [save.status, save.error]);

  const captureLoading = capture.status === 'loading';
  const captureReady = capture.status === 'success' && capture.pageSource !== null;

  return (
    <div className="flex h-screen min-h-0 flex-col bg-stone-50 text-stone-800">
      <TopBar pageTypeLabel={pageTypeLabel} />

      <main className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-3 py-3">
        <PageInfoPanel pageSource={capture.pageSource} loading={captureLoading} />

        <ActionBar
          templateId={card.selectedTemplate}
          onTemplateChange={(id) => card.setSelectedTemplate(id)}
          customPrompt={card.customPrompt}
          onCustomPromptChange={(p) => card.setCustomPrompt(p)}
          onGenerate={() => void handleGenerate()}
          onReRecognize={() => void capture.capture()}
          disabled={captureLoading}
          generating={card.status === 'generating'}
          captureReady={captureReady}
        />

        <LoadingProgress visible={card.status === 'generating'} pipeline={card.pipeline} />

        {card.status === 'ready' && card.card ? (
          <>
            <CardPreview
              card={card.card}
              markdown={card.markdown}
              onMarkdownChange={card.updateMarkdown}
              onTitleChange={card.updateTitle}
              onTagsChange={card.updateTags}
            />
            <TargetPicker selected={save.targets} onChange={save.setTargets} />
            <ExportBar
              markdown={card.markdown}
              card={card.card}
              saving={save.status === 'saving'}
              disabled={card.status !== 'ready'}
              onSave={() => void save.save(card.card!)}
            />
          </>
        ) : null}

        {card.status === 'error' ? (() => {
          const info = getUserFriendlyError(card.error ?? 'GENERATE_FAILED', card.error ?? undefined);
          return (
            <div className="space-y-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5">
              <p className="text-xs font-semibold text-red-700">{info.title}</p>
              <p className="text-xs text-red-600">{info.message}</p>
              {info.action === 'retry' && (
                <button type="button" className="text-xs font-semibold text-red-700 underline hover:text-red-500" onClick={() => void handleGenerate()}>
                  {info.actionLabel}
                </button>
              )}
              {info.action === 'options' && (
                <button type="button" className="text-xs font-semibold text-red-700 underline hover:text-red-500" onClick={() => void chrome.runtime.openOptionsPage()}>
                  {info.actionLabel}
                </button>
              )}
            </div>
          );
        })() : null}
      </main>

      <ToastStack toasts={toasts} />
    </div>
  );
}
