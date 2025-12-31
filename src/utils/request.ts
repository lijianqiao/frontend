import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios'
import { createDiscreteApi } from 'naive-ui'
import type { ResponseBase } from '@/types/api'

const { message } = createDiscreteApi(['message'])

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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return res as any
    }
    message.error(res.message || '请求错误')
    return Promise.reject(new Error(res.message || '请求错误'))
  },
  async (error) => {
    const originalRequest = error.config
    const msg = error.response?.data?.message || error.message || '请求失败'

    // Handle 401 Token Expired
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
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
        // Dynamically import to avoid circular dependency
        const { refreshToken } = await import('@/api/auth')
        const token = localStorage.getItem('refresh_token')

        if (!token) {
          throw new Error('No refresh token')
        }

        const res = await refreshToken(token)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const newToken = (res as any).access_token

        if (newToken) {
          localStorage.setItem('access_token', newToken)
          service.defaults.headers.common['Authorization'] = `Bearer ${newToken}`

          // Process Queue
          requests.forEach((cb) => cb(newToken))
          requests = []

          return service(originalRequest)
        }
      } catch (refreshErr) {
        console.error('RefreshToken Failed:', refreshErr)
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        window.location.href = '/login'
        return Promise.reject(refreshErr)
      } finally {
        isRefreshing = false
      }
    } else if (error.response?.status === 403) {
      message.error('无权访问')
    } else {
      message.error(msg)
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
