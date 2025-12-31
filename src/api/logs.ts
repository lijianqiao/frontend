import { request } from '@/utils/request'
import type { ResponseBase, PaginatedResponse } from '@/types/api'

export interface LoginLog {
  id: number
  user_id: string
  province: string | null
  city: string | null
  ip_address: string
  user_agent: string
  browser: string
  os: string
  device: string
  login_time: string
}

export interface OperationLog {
  id: number
  user_id: string
  username: string
  module: string
  summary: string
  method: string
  path: string
  status_code: number
  ip_address: string
  created_at: string
  latency: number
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getLoginLogs(params?: any) {
  return request<ResponseBase<PaginatedResponse<LoginLog>>>({
    url: '/logs/login',
    method: 'get',
    params,
  })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getOperationLogs(params?: any) {
  return request<ResponseBase<PaginatedResponse<OperationLog>>>({
    url: '/logs/operation',
    method: 'get',
    params,
  })
}
