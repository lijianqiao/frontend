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
      // Ensure we handle the response correctly. Standard ResponseBase<Menu[]>
      if (res.data) {
        userMenus.value = res.data
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
  }
})
