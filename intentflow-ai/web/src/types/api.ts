// types/api.ts — API response wrappers

export interface APIResponse<T> {
  data: T
  error: null | string
}

export interface APIListResponse<T> {
  data: T[]
  count: number
  error: null | string
}

export interface APIError {
  error: string
  code?: string
  details?: string
}

export interface WorkflowTriggerResponse {
  triggered: boolean
  execution_id?: string
  error?: string
}
