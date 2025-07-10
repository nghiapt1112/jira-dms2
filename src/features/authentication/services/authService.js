import axiosInstance from '../../../shared/services/axiosConfig'

export const authService = {
  // Login function based on the provided curl
  login: async (username, password) => {
    const response = await axiosInstance.post('/auth/login', {
      username,
      password
    }, {
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json'
      }
    })
    return response
  },
  
  // Logout function
  logout: async () => {
    try {
      await axiosInstance.post('/auth/logout')
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // Clear local storage regardless
      localStorage.removeItem('jwt_token')
      localStorage.removeItem('user_data')
      localStorage.removeItem('refresh_token')
    }
  },
  
  // Refresh token
  refreshToken: async () => {
    const refreshToken = localStorage.getItem('refresh_token')
    if (!refreshToken) {
      throw new Error('No refresh token available')
    }
    
    const response = await axiosInstance.post('/auth/refresh', {
      refreshToken
    })
    return response.data
  },
  
  // Validate token
  validateToken: async (token) => {
    const response = await axiosInstance.get('/auth/validate', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    return response.data
  },
  
  // Get user profile
  getProfile: async () => {
    const response = await axiosInstance.get('/auth/profile')
    return response.data
  },
  
  // Check if user is authenticated
  isAuthenticated: () => {
    const token = localStorage.getItem('jwt_token')
    if (!token) return false
    
    // Simple token validation without importing jwtService to avoid circular dependency
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      return payload.exp > Date.now() / 1000
    } catch {
      return false
    }
  },
  
  // Get current user from token
  getCurrentUser: () => {
    const token = localStorage.getItem('jwt_token')
    if (!token) return null
    
    // Simple token parsing without importing jwtService to avoid circular dependency
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      return {
        userId: payload.userId,
        username: payload.username,
        role: payload.role
      }
    } catch {
      return null
    }
  }
}