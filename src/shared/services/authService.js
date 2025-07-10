import apiService from './apiService'

class AuthService {
  async login(credentials) {
    try {
      const response = await apiService.post('/auth/login', credentials)
      const { token, refreshToken, user } = response.data
      
      localStorage.setItem('jira-dms-token', token)
      localStorage.setItem('jira-dms-refresh-token', refreshToken)
      localStorage.setItem('jira-dms-user', JSON.stringify(user))
      
      apiService.setAuthToken(token)
      
      return { success: true, user }
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Login failed' 
      }
    }
  }

  async logout() {
    try {
      await apiService.post('/auth/logout')
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      this.clearAuth()
    }
  }

  async refreshToken() {
    const refreshToken = localStorage.getItem('jira-dms-refresh-token')
    if (!refreshToken) {
      throw new Error('No refresh token available')
    }
    
    try {
      const response = await apiService.post('/auth/refresh', { refreshToken })
      const { token } = response.data
      
      localStorage.setItem('jira-dms-token', token)
      apiService.setAuthToken(token)
      
      return token
    } catch (error) {
      this.clearAuth()
      throw error
    }
  }

  async getCurrentUser() {
    try {
      const cachedUser = localStorage.getItem('jira-dms-user')
      if (cachedUser) {
        return JSON.parse(cachedUser)
      }
      
      const response = await apiService.get('/auth/me')
      const user = response.data
      
      localStorage.setItem('jira-dms-user', JSON.stringify(user))
      return user
    } catch (error) {
      return null
    }
  }

  isAuthenticated() {
    return apiService.isAuthenticated()
  }

  clearAuth() {
    localStorage.removeItem('jira-dms-token')
    localStorage.removeItem('jira-dms-refresh-token')
    localStorage.removeItem('jira-dms-user')
    apiService.clearAuthToken()
  }

  getAuthToken() {
    return localStorage.getItem('jira-dms-token')
  }
}

export default new AuthService()