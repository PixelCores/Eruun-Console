import { config } from '../config'
import type { BaseResponse } from './types'

/**
 * 认证服务客户端（/auth/* 端点）。
 * 注意：Eruun 后端的认证接口尚未实现，此处的契约（token / expiresIn / user.role）
 * 对齐参考实现，后端就绪后可能需要调整。
 */

export interface PaaSLoginRequest {
  identifier: string
  password: string
}

export type PaaSRole = 1 | 2 | 3 | 4

export interface PaaSLoginResponse {
  token: string
  expiresIn: number
  user?: {
    role?: number | string
  }
}

export const parsePaaSRole = (raw: unknown): PaaSRole | null => {
  const value = typeof raw === 'string' ? Number(raw) : raw
  return value === 1 || value === 2 || value === 3 || value === 4
    ? (value as PaaSRole)
    : null
}

async function post<T>(path: string, body: unknown, token?: string): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const response = await fetch(`${config.paasAuthBaseUrl}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(errorText || `Request failed with status ${response.status}`)
  }

  const result: BaseResponse<T> = await response.json()
  if (result.code !== 0) {
    throw new Error(result.message || 'Auth Error')
  }
  return result.data
}

export const loginWithPaaS = (req: PaaSLoginRequest, remember: boolean) =>
  post<PaaSLoginResponse>('/auth/login', { ...req, remember })

export const logoutFromPaaS = (token: string) =>
  post<unknown>('/auth/logout', {}, token)
