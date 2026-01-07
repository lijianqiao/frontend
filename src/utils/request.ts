import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios'
import { $alert } from '@/utils/alert'
import router from '@/router'
import type { ResponseBase } from '@/types/api'

const service: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  timeout: 10000,
})

service.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// Refresh Token Logic
let isRefreshing = false

let requests: Array<(token: string) => void> = []

service.interceptors.response.use(
  (response: AxiosResponse<ResponseBase>) => {
    const res = response.data
    // Assuming 200 is success
    if (response.status === 200) {
      return res as unknown as AxiosResponse
    }
    $alert.error(res.message || '请求错误')
    return Promise.reject(new Error(res.message || '请求错误'))
  },
  async (error) => {
    const originalRequest = error.config
    // If error has no response, it might be network error.
    const msg = error.response?.data?.message || error.message || '请求失败'

    // Handle 401 Token Expired
    if (error.response?.status === 401 && !originalRequest._retry) {
      // If the failed request was a login or refresh request itself, do not retry.
      if (
        originalRequest.url?.includes('/auth/login') ||
        originalRequest.url?.includes('/auth/refresh')
      ) {
        return Promise.reject(error)
      }

      if (isRefreshing) {
        // Concurrency Lock: Queue other requests while refreshing
        return new Promise((resolve) => {
          requests.push((token) => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`
            resolve(service(originalRequest))
          })
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        // Dynamic import to avoid circular dependency (request <-> auth)
        const { refreshToken } = await import('@/api/auth')
        const oldRefreshToken = localStorage.getItem('refresh_token')

        if (!oldRefreshToken) {
          throw new Error('No refresh token available')
        }

        // Call Refresh API
        const res = await refreshToken(oldRefreshToken)

        // Spec: Backend returns new access_token AND new refresh_token (Rotation)
        const { access_token, refresh_token } = res.data

        if (access_token) {
          // Update Local Storage with BOTH tokens
          localStorage.setItem('access_token', access_token)
          if (refresh_token) {
            localStorage.setItem('refresh_token', refresh_token)
          }

          // Update default header
          service.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
          originalRequest.headers['Authorization'] = `Bearer ${access_token}`

          // Process Queue
          requests.forEach((cb) => cb(access_token))
          requests = []

          // Retry Original Request
          return service(originalRequest)
        }
      } catch (refreshErr) {
        console.error('RefreshToken Failed:', refreshErr)
        // Clear tokens
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')

        // Redirect to Login
        // Ensure we don't loop if we are already on login?
        if (router.currentRoute.value.name !== 'Login') {
          router.push({ name: 'Login', query: { redirect: router.currentRoute.value.fullPath } })
        }
        return Promise.reject(refreshErr)
      } finally {
        isRefreshing = false
      }
    } else if (error.response?.status === 403) {
      $alert.warning('权限不足')
    } else {
      // Default error handling
      if (error.response?.status && error.response.status >= 400) {
        // Use global alert
        $alert.error(msg)
      }
    }

    return Promise.reject(error)
  },
)

// Wrapper function for typing
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const request = <T = any>(config: AxiosRequestConfig): Promise<T> => {
  return service.request(config) as unknown as Promise<T>
}

export default service
