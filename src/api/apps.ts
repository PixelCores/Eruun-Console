import { request } from './request'

/** 与 Eruun 后端 dto/v1.ApplicationBase 对齐 */
export interface ApplicationResources {
  cpuReq: string
  memReq: string
  cpuLimit: string
  memLimit: string
  replicas: number
}

export interface Application {
  workspaceID: string
  id: string
  name: string
  namespace: string
  alias: string
  project: string
  version: string
  description: string
  createTime: string
  updateTime: string
  icon: string
  workflowId: string
  templateEnabled: boolean
  managementMode: string
  resources: ApplicationResources
}

export interface ListApplicationResponse {
  applications: Application[] | null
}

export const fetchApplications = (page = 1, pageSize = 100) =>
  request<ListApplicationResponse>(`/applications?page=${page}&pageSize=${pageSize}`)

/** SWR key 约定：直接使用接口路径，便于按前缀失效缓存 */
export const APPLICATIONS_KEY = '/applications'
