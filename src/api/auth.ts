import { request } from '@/utils/request'
import type { ResponseBase } from '@/types/api'
import type { User } from '@/api/users'

export interface LoginParams {
  username: string
  password: string
}

export interface LoginResult {
  access_token: string
  refresh_token: string
  token_type: string
}

export function login(data: LoginParams) {
  // OAuth2 password flow usually uses x-www-form-urlencoded
  const params = new URLSearchParams()
  params.append('username', data.username)
  params.append('password', data.password)

  return request<ResponseBase<LoginResult>>({
    url: '/auth/login',
    method: 'post',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    data: params,
  })
}

export function getUserInfo() {
  return request<ResponseBase<User>>({
    url: '/auth/test-token',
    method: 'post',
  })
}

export function refreshToken(token: string) {
  return request<ResponseBase<LoginResult>>({
    url: '/auth/refresh',
    method: 'post',
    data: {
      refresh_token: token,
    },
  })
}
