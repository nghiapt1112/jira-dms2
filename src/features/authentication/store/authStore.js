import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authService } from '../services/authService'
import { jwtService } from '../services/jwtService'

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
      logout: async () => {
        set({ isLoading: true })
        try {
          // Call logout API
          await authService.logout()
        } catch (error) {
          console.error('Logout API error:', error)
        } finally {
          // Clear local storage regardless of API response
          localStorage.removeItem('jwt_token')
          localStorage.removeItem('user_data')
          localStorage.removeItem('refresh_token')
          
          set({ 
            user: null, 
            token: null, 
            isAuthenticated: false, 
            error: null,
            isLoading: false
          })
          
          // Redirect to login page
          window.location.href = '/login'
        }
      },
      
      // Initialize from localStorage on app start
      initializeAuth: () => {
        const token = localStorage.getItem('jwt_token')
        const userData = localStorage.getItem('user_data')
        
        if (token && userData) {
          try {
            // Validate token is not expired
            if (!jwtService.isTokenExpired(token)) {
              const user = JSON.parse(userData)
              set({ 
                token, 
                user, 
                isAuthenticated: true 
              })
            } else {
              // Token expired, clear auth state
              get().logout()
            }
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
          const response = await authService.login(username, password)
          const { token, refreshToken } = response.data
          
          // Extract user info from JWT token
          const user = jwtService.getUserFromToken(token)
          
          if (!user) {
            throw new Error('Invalid token received')
          }
          
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
          
          return { success: true, user }
        } catch (error) {
          const errorMessage = error.response?.data?.message || error.message || 'Login failed'
          set({ 
            error: errorMessage, 
            isLoading: false,
            isAuthenticated: false,
            user: null,
            token: null
          })
          return { success: false, error: errorMessage }
        }
      },
      
      // Update user profile
      updateUser: (userData) => {
        const currentUser = get().user
        if (currentUser) {
          const updatedUser = { ...currentUser, ...userData }
          localStorage.setItem('user_data', JSON.stringify(updatedUser))
          set({ user: updatedUser })
        }
      },
      
      // Clear error state
      clearError: () => set({ error: null })
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