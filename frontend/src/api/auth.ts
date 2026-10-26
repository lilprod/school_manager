import { api } from '../lib/api'
import type { User } from '../types'

interface LoginResponse {
  accessToken: string
  refreshToken: string
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/auth/login', { email, password })
  return data
}

export async function fetchMe(): Promise<User> {
  const { data } = await api.get<User>('/users/me')
  return data
}

export async function logoutRequest(refreshToken: string): Promise<void> {
  await api.post('/auth/logout', { refreshToken })
}
