type ErrorInfo = {
  title: string;
  message: string;
  action?: string;
  actionLabel?: string;
};

const ERROR_MAP: Record<string, ErrorInfo> = {
  CAPTURE_FAILED: {
    title: '页面识别失败',
    message: '无法提取页面内容。页面可能尚未加载完毕，或为纯 JS 渲染的 SPA。',
    action: 'retry',
    actionLabel: '等待后重试',
  },
  NO_TAB: {
    title: '未找到标签页',
    message: '请确保至少有一个活动的网页标签页。',
  },
  UNAUTHORIZED: {
    title: '登录已过期',
    message: '请重新登录以继续使用。',
    action: 'options',
    actionLabel: '前往设置',
  },
  GENERATE_FAILED: {
    title: '制卡失败',
    message: 'AI 处理出错，请稍后重试。',
    action: 'retry',
    actionLabel: '重试',
  },
  SAVE_FAILED: {
    title: '保存失败',
    message: '卡片已暂存到本地，请检查凭证配置后重试。',
    action: 'options',
    actionLabel: '检查凭证',
  },
  RATE_LIMITED: {
    title: 'AI 服务繁忙',
    message: '请求过于频繁，已自动排队。请稍等片刻。',
    action: 'wait',
    actionLabel: '稍候重试',
  },
  NETWORK_ERROR: {
    title: '网络连接失败',
    message: '无法连接到后端服务，请检查网络和服务状态。',
    action: 'retry',
    actionLabel: '重试',
  },
  EMPTY_CONTENT: {
    title: '页面内容为空',
    message: '未能提取到有效内容。请等待页面完全加载后重试。',
    action: 'retry',
    actionLabel: '重新识别',
  },
  CREDENTIAL_MISSING: {
    title: '凭证未配置',
    message: '目标平台的连接凭证尚未设置。',
    action: 'options',
    actionLabel: '去配置',
  },
};

export function getUserFriendlyError(code: string, rawMessage?: string): ErrorInfo {
  if (ERROR_MAP[code]) return ERROR_MAP[code];

  if (rawMessage?.includes('429') || rawMessage?.toLowerCase().includes('rate limit')) {
    return ERROR_MAP.RATE_LIMITED;
  }
  if (rawMessage?.includes('401') || rawMessage?.toLowerCase().includes('unauthorized')) {
    return ERROR_MAP.UNAUTHORIZED;
  }
  if (rawMessage?.toLowerCase().includes('fetch') || rawMessage?.toLowerCase().includes('network')) {
    return ERROR_MAP.NETWORK_ERROR;
  }

  return {
    title: '操作失败',
    message: rawMessage ?? '发生未知错误，请重试。',
    action: 'retry',
    actionLabel: '重试',
  };
}
