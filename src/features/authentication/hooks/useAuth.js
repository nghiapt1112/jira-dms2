import { useAuthStore } from '../store/authStore'
import { authService } from '../services/authService'

export const useAuth = () => {
  const {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    setError
  } = useAuthStore()

  const handleLogout = async () => {
    try {
      await authService.logout()
      logout()
    } catch (error) {
      console.error('Logout error:', error)
      // Force logout even if API call fails
      logout()
    }
  }

  const clearError = () => {
    setError(null)
  }

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout: handleLogout,
    clearError
  }
}