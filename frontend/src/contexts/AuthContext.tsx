'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User } from '../../types'
import { authService } from '../services'
import { useNotification } from './NotificationContext'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; message?: string }>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { showNotification } = useNotification()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      setIsLoading(true)
      const userData = await authService.getProfile()
      setUser(userData)
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error)
      await authService.logout()
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    try {
      const response = await authService.login({ email, password })
      setUser(response.user)
      showNotification('Login realizado com sucesso!', 'success')
      return { success: true }
    } catch (error: any) {
      const message = error.message || 'Erro ao fazer login'
      showNotification(message, 'error')
      return { success: false, message }
    }
  }

  const register = async (name: string, email: string, password: string) => {
    try {
      await authService.register({ name, email, password })
      showNotification('Conta criada com sucesso! Faça login para continuar.', 'success')
      return { success: true }
    } catch (error: any) {
      const message = error.message || 'Erro ao criar conta'
      showNotification(message, 'error')
      return { success: false, message }
    }
  }

  const logout = async () => {
    try {
      await authService.logout()
      setUser(null)
      showNotification('Logout realizado com sucesso!', 'success')
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
      setUser(null)
    }
  }

  const refreshUser = async () => {
    try {
      const userData = await authService.getProfile()
      setUser(userData)
    } catch (error) {
      console.error('Erro ao atualizar dados do usuário:', error)
      setUser(null)
    }
  }

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refreshUser
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  return context
}
