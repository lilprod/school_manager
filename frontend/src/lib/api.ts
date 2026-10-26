import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '../stores/auth-store'

export const api = axios.create({ baseURL: '/api' })

api.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState()
  if (accessToken) {
    config.headers.set('Authorization', `Bearer ${accessToken}`)
  }
  return config
})

let refreshPromise: Promise<string> | null = null

async function refreshAccessToken(): Promise<string> {
  const { refreshToken } = useAuthStore.getState()
  if (!refreshToken) {
    throw new Error('No refresh token available')
  }
  const response = await axios.post('/api/auth/refresh', { refreshToken })
  const { accessToken, refreshToken: newRefreshToken } = response.data as {
    accessToken: string
    refreshToken: string
  }
  useAuthStore.getState().setAccessToken(accessToken, newRefreshToken)
  return accessToken
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true
      try {
        refreshPromise ??= refreshAccessToken().finally(() => {
          refreshPromise = null
        })
        const newAccessToken = await refreshPromise
        originalRequest.headers.set('Authorization', `Bearer ${newAccessToken}`)
        return api(originalRequest)
      } catch {
        useAuthStore.getState().clear()
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  },
)
