/**
 * 集中管理前端环境配置（全部来自 import.meta.env，见 .env / .env.development / .env.production）
 */
export const config = {
  /** Eruun API 基础地址，默认走 Vite 代理 /api/v1 */
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  /** 认证服务地址（/auth/login、/auth/logout 等），后端未实现前默认同 apiBaseUrl */
  paasAuthBaseUrl:
    import.meta.env.VITE_PAAS_AUTH_BASE_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    '/api/v1',
  appTitle: import.meta.env.VITE_APP_TITLE || 'Eruun Console',
  appVersion: import.meta.env.VITE_APP_VERSION || '0.0.0',
  /** 登录守卫开关：开发默认 false（Eruun 后端认证接口就绪后置 true） */
  authEnabled: import.meta.env.VITE_AUTH_ENABLED === 'true',
} as const
