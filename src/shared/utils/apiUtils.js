export const handleApiError = (error) => {
  if (error.response) {
    const { status, data } = error.response
    
    switch (status) {
      case 400:
        return {
          type: 'validation',
          message: data.message || 'Invalid request data',
          errors: data.errors || {}
        }
      
      case 401:
        return {
          type: 'authentication',
          message: 'Please log in to continue'
        }
      
      case 403:
        return {
          type: 'authorization',
          message: 'You do not have permission to perform this action'
        }
      
      case 404:
        return {
          type: 'not_found',
          message: data.message || 'Resource not found'
        }
      
      case 429:
        return {
          type: 'rate_limit',
          message: 'Too many requests. Please try again later',
          retryAfter: error.response.headers['retry-after']
        }
      
      case 500:
      case 502:
      case 503:
      case 504:
        return {
          type: 'server',
          message: 'Server error. Please try again later'
        }
      
      default:
        return {
          type: 'unknown',
          message: data.message || 'An unexpected error occurred'
        }
    }
  }
  
  if (error.code === 'ECONNABORTED') {
    return {
      type: 'timeout',
      message: 'Request timeout. Please check your connection'
    }
  }
  
  if (error.message === 'Network Error') {
    return {
      type: 'network',
      message: 'Network error. Please check your internet connection'
    }
  }
  
  return {
    type: 'unknown',
    message: error.message || 'An unexpected error occurred'
  }
}

export const createQueryParams = (params = {}) => {
  const queryParams = new URLSearchParams()
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      if (Array.isArray(value)) {
        queryParams.append(key, value.join(','))
      } else {
        queryParams.append(key, value)
      }
    }
  })
  
  return queryParams.toString()
}

export const parseJwt = (token) => {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    
    return JSON.parse(jsonPayload)
  } catch (error) {
    console.error('Failed to parse JWT:', error)
    return null
  }
}

export const isTokenExpired = (token) => {
  const decoded = parseJwt(token)
  if (!decoded || !decoded.exp) {
    return true
  }
  
  const currentTime = Date.now() / 1000
  return decoded.exp < currentTime
}

export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}