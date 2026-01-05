import { request } from '@/utils/request'
import type { ResponseBase, PaginatedResponse } from '@/types/api'

export interface Menu {
  id: string
  parent_id: string | null
  title: string
  name: string // route name
  path: string // route path
  component: string | null // component path
  icon: string | null
  sort: number
  type: 'catalog' | 'menu' | 'button'
  permission: string | null
  hidden: boolean
  is_active: boolean
  created_at: string
  children?: Menu[]
}

export interface MenuCreate {
  parent_id?: string | null
  title: string
  name: string
  path: string
  component?: string | null
  icon?: string | null
  sort?: number
  type: 'catalog' | 'menu' | 'button'
  permission?: string | null
  hidden?: boolean
  is_active?: boolean
}

export type MenuUpdate = Partial<MenuCreate>

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getMenus(params?: any) {
  return request<ResponseBase<PaginatedResponse<Menu>>>({
    url: '/menus/',
    method: 'get',
    params,
  })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getRecycleBinMenus(params?: any) {
  return request<ResponseBase<PaginatedResponse<Menu>>>({
    url: '/menus/recycle-bin',
    method: 'get',
    params,
  })
}

export function restoreMenu(id: string) {
  return request<ResponseBase<Menu>>({
    url: `/menus/${id}/restore`,
    method: 'post',
  })
}

export function createMenu(data: MenuCreate) {
  return request<ResponseBase<Menu>>({
    url: '/menus/',
    method: 'post',
    data,
  })
}

export function updateMenu(id: string, data: MenuUpdate) {
  return request<ResponseBase<Menu>>({
    url: `/menus/${id}`,
    method: 'put',
    data,
  })
}

export function deleteMenu(id: string) {
  return request<ResponseBase<unknown>>({
    url: `/menus/${id}`,
    method: 'delete',
  })
}

export function batchDeleteMenus(ids: string[], hard_delete: boolean = false) {
  return request<ResponseBase<unknown>>({
    url: '/menus/batch',
    method: 'delete',
    data: { ids, hard_delete },
  })
}

// 侧边栏菜单（当前用户可见）
export function getMyMenus() {
  return request<ResponseBase<Menu[]>>({
    url: '/menus/me',
    method: 'get',
  })
}

// 角色分配权限用的菜单树选项

export function getMenuOptions() {
  return request<ResponseBase<Menu[]>>({
    url: '/menus/options',
    method: 'get',
  })
}
