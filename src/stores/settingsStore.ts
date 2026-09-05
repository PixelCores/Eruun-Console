import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { storageKeys } from '../utils/storage'

export type Locale = 'zh-CN' | 'en'
export type TimeZoneOffset = number

export const DEFAULT_TIME_ZONE: TimeZoneOffset = 8
export const TIME_ZONE_OPTIONS: TimeZoneOffset[] = Array.from(
  { length: 27 },
  (_, index) => index - 12
)

export const formatTimeZoneOffset = (timeZone: TimeZoneOffset) =>
  timeZone === 0 ? 'UTC' : `UTC${timeZone > 0 ? '+' : ''}${timeZone}`

export const getIntlTimeZone = (timeZone: TimeZoneOffset) =>
  timeZone === 0
    ? 'UTC'
    : `Etc/GMT${timeZone > 0 ? '-' : '+'}${Math.abs(timeZone)}`

interface SettingsState {
  locale: Locale
  timeZone: TimeZoneOffset
  /** 运行时覆盖 API 地址；空串表示使用 env 默认值 */
  apiBaseUrl: string
  setLocale: (locale: Locale) => void
  setTimeZone: (timeZone: TimeZoneOffset) => void
  setApiBaseUrl: (apiBaseUrl: string) => void
}

const getDefaultLocale = (): Locale => {
  if (typeof navigator === 'undefined') return 'zh-CN'
  return navigator.language.toLowerCase().startsWith('zh') ? 'zh-CN' : 'en'
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    set => ({
      locale: getDefaultLocale(),
      timeZone: DEFAULT_TIME_ZONE,
      apiBaseUrl: '',
      setLocale: locale => set({ locale }),
      setTimeZone: timeZone => set({ timeZone }),
      setApiBaseUrl: apiBaseUrl => set({ apiBaseUrl }),
    }),
    {
      name: storageKeys.settings,
      storage: createJSONStorage(() => window.localStorage),
    }
  )
)
