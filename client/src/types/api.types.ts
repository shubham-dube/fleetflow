export interface PaginationMeta {
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface ApiSuccess<T> {
  success: true
  data: T
  message?: string
  meta?: PaginationMeta
}

export interface ApiError {
  success: false
  error: {
    code: string
    message: string
    details?: Record<string, string[]>
  }
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError