import { request } from '@/utils/request'
import type { ResponseBase, PaginatedResponse } from '@/types/api'

export interface User {
  id: string
  username: string
  email: string | null
  phone: string | null
  nickname: string | null
  gender: string | null
  is_active: boolean
  is_superuser: boolean
  created_at: string
  updated_at: string | null
}

export interface UserCreate {
  username: string
  password: string
  email?: string
  phone: string
  nickname?: string
  gender?: string
  is_active?: boolean
  is_superuser?: boolean
}

export type UserUpdate = Partial<UserCreate>

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getUsers(params?: any) {
  return request<ResponseBase<PaginatedResponse<User>>>({
    url: '/users/',
    method: 'get',
    params,
  })
}

export function createUser(data: UserCreate) {
  return request<ResponseBase<User>>({
    url: '/users/',
    method: 'post',
    data,
  })
}

export function updateUser(id: string | number, data: UserUpdate) {
  return request<ResponseBase<User>>({
    url: `/users/${id}`,
    method: 'put',
    data,
  })
}

export function batchDeleteUsers(ids: string[], hard_delete: boolean = false) {
  return request<ResponseBase<unknown>>({
    url: '/users/batch',
    method: 'delete',
    data: { ids, hard_delete },
  })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getRecycleBinUsers(params?: any) {
  return request<ResponseBase<PaginatedResponse<User>>>({
    url: '/users/recycle-bin',
    method: 'get',
    params,
  })
}

export function restoreUser(id: string) {
  return request<ResponseBase<User>>({
    url: `/users/${id}/restore`,
    method: 'post',
  })
}

export function resetUserPassword(userId: string, newPassword: string) {
  return request<ResponseBase<User>>({
    url: `/users/${userId}/password`,
    method: 'put',
    data: { new_password: newPassword },
  })
}
