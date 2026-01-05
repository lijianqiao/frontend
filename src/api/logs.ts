import { request } from '@/utils/request'
import type { ResponseBase, PaginatedResponse } from '@/types/api'

export interface LoginLog {
  id: string
  user_id: string
  username: string
  ip: string
  user_agent: string
  browser: string
  os: string
  device: string
  status: boolean
  msg: string
  created_at: string
}

export interface OperationLog {
  id: string
  user_id: string
  username: string
  ip: string
  module: string
  summary: string
  method: string
  path: string
  response_code: number
  duration: number
  created_at: string
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
