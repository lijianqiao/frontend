import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getUserInfo, logout as logoutApi } from '@/api/auth'
import { getMyMenus, type Menu } from '@/api/menus'
import type { User } from '@/api/users'
import { generateRoutes } from '@/router/utils'

export const useUserStore = defineStore('user', () => {
  const token = ref<string | null>(localStorage.getItem('access_token'))
  const userInfo = ref<User | null>(null)
  const permissions = ref<string[]>([])
  const userMenus = ref<Menu[]>([])
  const isRoutesLoaded = ref(false)

  function setToken(accessToken: string, refreshToken: string) {
    token.value = accessToken
    localStorage.setItem('access_token', accessToken)
    localStorage.setItem('refresh_token', refreshToken)
  }

  function clearToken() {
    token.value = null
    userInfo.value = null
    permissions.value = []
    userMenus.value = []
    isRoutesLoaded.value = false
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
  }

  function setUserInfo(info: User) {
    userInfo.value = info
  }

  function setPermissions(perms: string[]) {
    permissions.value = perms
  }

  // Attempt to refresh token using existing refresh_token
  async function initialTokenRefresh(): Promise<boolean> {
    const refreshTokenStr = localStorage.getItem('refresh_token')
    if (!refreshTokenStr) return false

    try {
      // Dynamic import to avoid circular dependency if needed, but here we can import API directly
      // However, auth.ts imports request.ts which imports router... circular risk is high.
      // Use dynamic import for safety.
      const { refreshToken } = await import('@/api/auth')
      const res = await refreshToken(refreshTokenStr)

      const { access_token, refresh_token } = res.data
      if (access_token) {
        setToken(access_token, refresh_token || refreshTokenStr)
        return true
      }
      return false
    } catch {
      clearToken()
      return false
    }
  }

  async function fetchUserInfo() {
    try {
      const res = await getUserInfo()
      const data = res.data
      userInfo.value = data
      if (data.permissions) {
        permissions.value = data.permissions
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

      // Generate Routes
      const routes = generateRoutes(res.data || [])
      isRoutesLoaded.value = true

      return { menus: res.data, routes }
    } catch (error) {
      console.error('Failed to fetch user menus', error)
      return { menus: [], routes: [] }
    }
  }

  async function logout() {
    try {
      await logoutApi()
    } catch (error) {
      console.error('Logout failed:', error)
    } finally {
      clearToken()
      window.location.href = '/login'
    }
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
    initialTokenRefresh,
    fetchUserInfo,
    fetchUserMenus,
    logout,
    hasMenu,
    isRoutesLoaded,
  }
})
