import axios from 'axios'
import { useUIStore } from '../store/uiStore'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'
const REQUEST_TIMEOUT = 600000 // 10 minutes for API debugging
const JWT_TOKEN = import.meta.env.VITE_JWT_TOKEN

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json, text/plain, */*'
  }
})

axiosInstance.interceptors.request.use(
  (config) => {
    // Get token from localStorage or fallback to env
    const token = localStorage.getItem('jwt_token') || JWT_TOKEN
    
    // Add token if available (simplified to avoid async issues)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    if (config.showGlobalLoading !== false) {
      useUIStore.getState().setGlobalLoading(true)
    }
    
    return config
  },
  (error) => {
    useUIStore.getState().setGlobalLoading(false)
    return Promise.reject(error)
  }
)

axiosInstance.interceptors.response.use(
  (response) => {
    useUIStore.getState().setGlobalLoading(false)
    return response
  },
  async (error) => {
    useUIStore.getState().setGlobalLoading(false)
    
    const originalRequest = error.config
    
    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      
      try {
        const refreshToken = localStorage.getItem('refresh_token')
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken
          })
          
          const { token } = response.data
          localStorage.setItem('jwt_token', token)
          
          originalRequest.headers.Authorization = `Bearer ${token}`
          return axiosInstance(originalRequest)
        }
      } catch (refreshError) {
        // Clear auth state and redirect to login
        localStorage.removeItem('jwt_token')
        localStorage.removeItem('user_data')
        localStorage.removeItem('refresh_token')
        
        // Redirect to login page
        window.location.href = '/login'
        
        return Promise.reject(refreshError)
      }
    }
    
    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      useUIStore.getState().addNotification({
        type: 'error',
        message: 'You do not have permission to perform this action'
      })
    }
    
    // Handle 429 Rate Limiting
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'] || 60
      useUIStore.getState().addNotification({
        type: 'warning',
        message: `Rate limit exceeded. Please try again in ${retryAfter} seconds`
      })
    }
    
    // Handle 5xx Server Errors
    if (error.response?.status >= 500) {
      useUIStore.getState().addNotification({
        type: 'error',
        message: 'Server error. Please try again later'
      })
    }
    
    // Handle Request Timeout
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      useUIStore.getState().addNotification({
        type: 'error',
        message: 'Request timeout. Please check your connection'
      })
    }
    
    // Handle Network Errors
    if (!error.response && error.message === 'Network Error') {
      useUIStore.getState().addNotification({
        type: 'error',
        message: 'Network error. Please check your internet connection'
      })
    }
    
    return Promise.reject(error)
  }
)

export const createAxiosInstance = (config = {}) => {
  return axios.create({
    ...axiosInstance.defaults,
    ...config
  })
}

export default axiosInstance