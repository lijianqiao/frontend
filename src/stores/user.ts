import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getUserInfo } from '@/api/auth'
import { getMyMenus, type Menu } from '@/api/menus'

export const useUserStore = defineStore('user', () => {
  const token = ref<string | null>(localStorage.getItem('access_token'))
  const userInfo = ref<Record<string, unknown> | null>(null)
  const permissions = ref<string[]>([])
  const userMenus = ref<Menu[]>([])

  function setToken(newToken: string) {
    token.value = newToken
    localStorage.setItem('access_token', newToken)
  }

  function clearToken() {
    token.value = null
    userInfo.value = null
    permissions.value = []
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
  }

  function setUserInfo(info: Record<string, unknown>) {
    userInfo.value = info
  }

  function setPermissions(perms: string[]) {
    permissions.value = perms
  }

  async function fetchUserInfo() {
    try {
      const res = await getUserInfo()
      const data = res.data as unknown as Record<string, unknown>
      userInfo.value = data
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((data as any).permissions) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        permissions.value = (data as any).permissions
      }
      return res.data
    } catch (error) {
      clearToken()
      throw error
    }
  }

  async function fetchUserMenus() {
    try {
      const res = await getMyMenus()
      if (res.data) {
        userMenus.value = res.data

        // Extract permissions from menus
        const perms: string[] = []
        const extractPermissions = (menus: Menu[]) => {
          menus.forEach((menu) => {
            if (menu.permission) {
              perms.push(menu.permission)
            }
            if (menu.children && menu.children.length > 0) {
              extractPermissions(menu.children)
            }
          })
        }
        extractPermissions(res.data)

        // Merge with existing permissions (from userInfo if any, though likely empty)
        // Use Set to ensure uniqueness
        const uniquePerms = Array.from(new Set([...permissions.value, ...perms]))
        permissions.value = uniquePerms
      }
      return res.data
    } catch (error) {
      console.error('Failed to fetch user menus', error)
      return []
    }
  }

  function logout() {
    clearToken()
    window.location.href = '/login'
  }

  function hasMenu(routeName: string): boolean {
    const checkMenu = (menus: Menu[]): boolean => {
      for (const menu of menus) {
        if (menu.name === routeName) return true
        if (menu.children && menu.children.length > 0) {
          if (checkMenu(menu.children)) return true
        }
      }
      return false
    }
    return checkMenu(userMenus.value)
  }

  return {
    token,
    userInfo,
    permissions,
    userMenus,
    setToken,
    clearToken,
    setUserInfo,
    setPermissions,
    fetchUserInfo,
    fetchUserMenus,
    logout,
    hasMenu,
  }
})
