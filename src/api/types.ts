/** Eruun 后端统一响应格式：code === 0 表示成功 */
export interface BaseResponse<T> {
  code: number
  message: string
  data: T
}
