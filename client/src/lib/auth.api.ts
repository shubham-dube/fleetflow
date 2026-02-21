import api from './api'
import type { User } from '@/types/models.types'
import type { ApiSuccess } from '@/types/api.types'

export const authApi = {
  login: (data: {
    email: string
    password: string
  }): Promise<ApiSuccess<{ user: User; accessToken: string }>> => api.post('/auth/login', data),

  logout: (): Promise<ApiSuccess<null>> => api.post('/auth/logout'),

  me: (): Promise<ApiSuccess<{ user: User; accessToken: string }>> => api.get('/auth/me'),

  changePassword: (data: {
    currentPassword: string
    newPassword: string
    confirmPassword: string
  }): Promise<ApiSuccess<null>> => api.patch('/auth/change-password', data),

  register: (data: {
    name: string
    email: string
    password: string
    role: string
  }): Promise<ApiSuccess<{ user: User }>> => api.post('/auth/register', data),
}