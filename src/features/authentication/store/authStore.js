import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      
      // Actions
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setToken: (token) => set({ token, isAuthenticated: !!token }),
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      
      // Clear auth state
      logout: () => {
        localStorage.removeItem('jwt_token')
        localStorage.removeItem('user_data')
        set({ 
          user: null, 
          token: null, 
          isAuthenticated: false, 
          error: null 
        })
      },
      
      // Initialize from localStorage
      initializeAuth: () => {
        const token = localStorage.getItem('jwt_token')
        const userData = localStorage.getItem('user_data')
        
        if (token && userData) {
          try {
            const user = JSON.parse(userData)
            set({ 
              token, 
              user, 
              isAuthenticated: true 
            })
          } catch (error) {
            console.error('Error parsing stored user data:', error)
            get().logout()
          }
        }
      },
      
      // Async login action
      login: async (username, password) => {
        set({ isLoading: true, error: null })
        try {
          // Use dynamic import with proper handling
          const authServiceModule = await import('../services/authService')
          const authService = authServiceModule.authService
          const response = await authService.login(username, password)
          const { token, refreshToken } = response.data
          
          // Use dynamic import for JWT service
          const jwtServiceModule = await import('../services/jwtService')
          const jwtService = jwtServiceModule.jwtService
          const user = jwtService.getUserFromToken(token)
          
          // Store in localStorage
          localStorage.setItem('jwt_token', token)
          localStorage.setItem('user_data', JSON.stringify(user))
          if (refreshToken) {
            localStorage.setItem('refresh_token', refreshToken)
          }
          
          set({ 
            token, 
            user, 
            isAuthenticated: true, 
            isLoading: false,
            error: null
          })
          
          return { success: true }
        } catch (error) {
          const errorMessage = error.response?.data?.message || 'Login failed'
          set({ 
            error: errorMessage, 
            isLoading: false 
          })
          return { success: false, error: errorMessage }
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        token: state.token, 
        user: state.user, 
        isAuthenticated: state.isAuthenticated 
      })
    }
  )
)