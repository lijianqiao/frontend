import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getUserInfo } from '@/api/auth'

export const useUserStore = defineStore('user', () => {
  const token = ref<string | null>(localStorage.getItem('access_token'))
  const userInfo = ref<Record<string, unknown> | null>(null)
  const permissions = ref<string[]>([])

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
      userInfo.value = res.data as unknown as Record<string, unknown>
      // In a real app, backend might return permissions list.
      // For now we rely on is_superuser or assume fetch returns perms if structured that way.
      // If the backend User object doesn't have 'permissions', we might need another API or standard.
      // Is permissions derived from roles? based on previous context, userStore.permissions was manual.
      // Let's assume for now we just want userInfo for is_superuser.
      return res.data
    } catch (error) {
      clearToken()
      throw error
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
    setToken,
    clearToken,
    setUserInfo,
    setPermissions,
    fetchUserInfo,
    logout,
  }
})
