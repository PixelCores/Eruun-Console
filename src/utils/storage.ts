/**
 * localStorage 约定：所有键统一使用 `eruun_` 前缀。
 * 新增持久化键时在 storageKeys 中登记，避免散落硬编码。
 */
const PREFIX = 'eruun_'

export const storageKeys = {
  settings: `${PREFIX}settings`,
  session: `${PREFIX}paas_session`,
} as const

const isStorageAvailable = () => typeof window !== 'undefined'

export function readJson<T>(key: string): T | null {
  if (!isStorageAvailable()) return null
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

export function writeJson(key: string, value: unknown) {
  if (!isStorageAvailable()) return
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // 隐私模式等场景下存储可能不可用，静默降级
  }
}

export function removeItem(key: string) {
  if (!isStorageAvailable()) return
  try {
    window.localStorage.removeItem(key)
    window.sessionStorage.removeItem(key)
  } catch {
    // ignore
  }
}
