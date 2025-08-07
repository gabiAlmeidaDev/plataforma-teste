import { apiClient } from '../../lib/api'
import { LoginRequest, RegisterRequest, AuthResponse, User } from '../../types'

export class AuthService {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    return apiClient.login(credentials)
  }

  async register(userData: RegisterRequest): Promise<void> {
    await apiClient.register(userData)
  }

  async getProfile(): Promise<User> {
    return apiClient.getProfile()
  }

  async logout(): Promise<void> {
    await apiClient.logout()
  }

  async forgotPassword(email: string): Promise<void> {
    return apiClient.post('/auth/forgot-password', { email })
  }

  async resetPassword(token: string, password: string): Promise<void> {
    return apiClient.post('/auth/reset-password', { token, password })
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    return apiClient.post('/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword
    })
  }

  async updateProfile(userData: Partial<User>): Promise<User> {
    return apiClient.put('/auth/profile', userData)
  }

  isAuthenticated(): boolean {
    return apiClient.isAuthenticated()
  }
}

export const authService = new AuthService()
