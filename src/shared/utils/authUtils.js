export const AUTH_STORAGE_KEYS = {
  TOKEN: 'jwt_token',
  USER: 'user_data',
  REFRESH_TOKEN: 'refresh_token'
}

export const clearAuthStorage = () => {
  Object.values(AUTH_STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key)
  })
}

export const setAuthStorage = (token, user, refreshToken = null) => {
  localStorage.setItem(AUTH_STORAGE_KEYS.TOKEN, token)
  localStorage.setItem(AUTH_STORAGE_KEYS.USER, JSON.stringify(user))
  
  if (refreshToken) {
    localStorage.setItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN, refreshToken)
  }
}

export const getAuthStorage = () => {
  try {
    const token = localStorage.getItem(AUTH_STORAGE_KEYS.TOKEN)
    const userStr = localStorage.getItem(AUTH_STORAGE_KEYS.USER)
    const refreshToken = localStorage.getItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN)
    
    const user = userStr ? JSON.parse(userStr) : null
    
    return {
      token,
      user,
      refreshToken
    }
  } catch (error) {
    console.error('Error reading auth storage:', error)
    clearAuthStorage()
    return {
      token: null,
      user: null,
      refreshToken: null
    }
  }
}

export const validateRole = (userRole, requiredRole) => {
  if (!requiredRole) return true
  if (!userRole) return false
  
  return userRole === requiredRole
}

export const hasPermission = (userRole, permission) => {
  const rolePermissions = {
    'ADMIN': ['read', 'write', 'delete', 'admin'],
    'USER': ['read', 'write'],
    'VIEWER': ['read']
  }
  
  const permissions = rolePermissions[userRole] || []
  return permissions.includes(permission)
}

export const formatUserDisplayName = (user) => {
  if (!user) return 'Unknown User'
  
  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`
  }
  
  if (user.username) {
    return user.username
  }
  
  return 'Unknown User'
}

export const getUserInitials = (user) => {
  if (!user) return 'U'
  
  if (user.firstName && user.lastName) {
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
  }
  
  if (user.username) {
    return user.username.charAt(0).toUpperCase()
  }
  
  return 'U'
}