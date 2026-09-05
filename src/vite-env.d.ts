/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  readonly VITE_PAAS_AUTH_BASE_URL?: string
  readonly VITE_PAAS_API_BASE_URL?: string
  readonly VITE_APP_TITLE?: string
  readonly VITE_APP_VERSION?: string
  readonly VITE_APP_DESCRIPTION?: string
  readonly VITE_AUTH_ENABLED?: string
  readonly VITE_MOCK_ENABLE?: string
  readonly VITE_LOG_LEVEL?: string
  readonly VITE_ENABLE_ANALYTICS?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
