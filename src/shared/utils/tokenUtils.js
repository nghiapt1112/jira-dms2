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

export const getTokenExpiration = (token) => {
  const decoded = parseJwt(token)
  return decoded?.exp ? new Date(decoded.exp * 1000) : null
}

export const getTimeUntilExpiration = (token) => {
  const decoded = parseJwt(token)
  if (!decoded || !decoded.exp) return 0
  
  const currentTime = Date.now() / 1000
  return Math.max(0, decoded.exp - currentTime)
}

export const isTokenValid = (token) => {
  if (!token) return false
  
  const decoded = parseJwt(token)
  if (!decoded) return false
  
  return !isTokenExpired(token)
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