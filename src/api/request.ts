import type { BaseResponse } from './types'
import { config } from '../config'
import { useSettingsStore } from '../stores/settingsStore'
import { useAuthStore } from '../stores/authStore'

/**
 * 统一请求入口：所有业务 API 必须走这里。
 * - 自动拼接 baseURL（settingsStore 可覆盖 env 默认值）
 * - 自动携带登录 token
 * - 拆包 BaseResponse：code !== 0 时抛出业务错误
 */
export async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const dynamicBaseUrl = useSettingsStore.getState().apiBaseUrl || config.apiBaseUrl
  const url = path.startsWith('http') ? path : `${dynamicBaseUrl}${path}`

  const session = useAuthStore.getState().session
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (session?.accessToken) {
    headers['Authorization'] = `Bearer ${session.accessToken}`
  }

  const response = await fetch(url, { ...options, headers })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(errorText || `Request failed with status ${response.status}`)
  }

  const result: BaseResponse<T> = await response.json()

  if (result.code !== 0) {
    throw new Error(result.message || 'API Error')
  }

  return result.data
}
