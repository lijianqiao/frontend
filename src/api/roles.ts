import { request } from '@/utils/request'
import type { ResponseBase, PaginatedResponse } from '@/types/api'

export interface Role {
  id: string
  name: string
  code: string
  description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface RoleCreate {
  name: string
  code: string
  description?: string
  is_active?: boolean
}

export type RoleUpdate = Partial<RoleCreate>

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getRoles(params?: any) {
  return request<ResponseBase<PaginatedResponse<Role>>>({
    url: '/roles/',
    method: 'get',
    params,
  })
}

export function createRole(data: RoleCreate) {
  return request<ResponseBase<Role>>({
    url: '/roles/',
    method: 'post',
    data,
  })
}

export function updateRole(id: string, data: RoleUpdate) {
  return request<ResponseBase<Role>>({
    url: `/roles/${id}`,
    method: 'put',
    data,
  })
}

export function deleteRole(id: string) {
  return request<ResponseBase<unknown>>({
    url: `/roles/${id}`,
    method: 'delete',
  })
}

// Permission related APIs (placeholder for now)
export function getRoleMenus(roleId: string) {
  return request<ResponseBase<unknown>>({
    url: `/roles/${roleId}/menus`,
    method: 'get',
  })
}

export function updateRoleMenus(roleId: string, menuIds: string[]) {
  return request<ResponseBase<unknown>>({
    url: `/roles/${roleId}/menus`,
    method: 'put',
    data: { menu_ids: menuIds },
  })
}
