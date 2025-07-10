export const jwtService = {
  // Decode JWT payload
  decodeToken: (token) => {
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
      console.error('Error decoding token:', error)
      return null
    }
  },
  
  // Check if token is expired
  isTokenExpired: (token) => {
    const decoded = jwtService.decodeToken(token)
    if (!decoded || !decoded.exp) return true
    
    const currentTime = Date.now() / 1000
    return decoded.exp < currentTime
  },
  
  // Get token expiration time
  getTokenExpiration: (token) => {
    const decoded = jwtService.decodeToken(token)
    return decoded?.exp ? new Date(decoded.exp * 1000) : null
  },
  
  // Extract user info from token
  getUserFromToken: (token) => {
    const decoded = jwtService.decodeToken(token)
    if (!decoded) return null
    
    return {
      userId: decoded.userId,
      username: decoded.username,
      role: decoded.role
    }
  },
  
  // Check if token is valid (not expired and properly formatted)
  isTokenValid: (token) => {
    if (!token) return false
    
    const decoded = jwtService.decodeToken(token)
    if (!decoded) return false
    
    return !jwtService.isTokenExpired(token)
  },
  
  // Get time until token expires (in seconds)
  getTimeUntilExpiration: (token) => {
    const decoded = jwtService.decodeToken(token)
    if (!decoded || !decoded.exp) return 0
    
    const currentTime = Date.now() / 1000
    return Math.max(0, decoded.exp - currentTime)
  }
}