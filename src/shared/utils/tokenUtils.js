// Import centralized JWT utilities
import { 
  isJwtExpired, 
  getJwtExpiration, 
  getTimeUntilJwtExpiration 
} from './dateUtils.js'

// Re-export centralized JWT functions
export { isJwtExpired as isTokenExpired, getJwtExpiration as getTokenExpiration }

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

// These functions are now handled by centralized date utilities above

export const getTimeUntilExpiration = (token) => {
  // Returns time in minutes until expiration (centralized function returns minutes)
  return Math.max(0, getTimeUntilJwtExpiration(token))
}

export const isTokenValid = (token) => {
  if (!token) return false
  
  const decoded = parseJwt(token)
  if (!decoded) return false
  
  return !isJwtExpired(token)
}

export const getUserFromToken = (token) => {
  const decoded = parseJwt(token)
  if (!decoded) return null
  
  return {
    userId: decoded.userId,
    username: decoded.username,
    role: decoded.role,
    iat: decoded.iat,
    exp: decoded.exp
  }
}