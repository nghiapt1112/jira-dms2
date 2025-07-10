import React from 'react'
import PropTypes from 'prop-types'
import { Navigate, useLocation } from 'react-router-dom'
import { Box, CircularProgress, Typography } from '@mui/material'
import { useAuthStore } from '../../store/authStore'
import { jwtService } from '../../services/jwtService'

const ProtectedRoute = React.memo(({ children, requiredRole = null }) => {
  const { isAuthenticated, user, token, isLoading, initializeAuth } = useAuthStore()
  const location = useLocation()
  const [isInitializing, setIsInitializing] = React.useState(true)
  
  React.useEffect(() => {
    const initialize = async () => {
      // Initialize auth state from localStorage
      initializeAuth()
      
      // Additional token validation
      const storedToken = localStorage.getItem('jwt_token')
      if (storedToken && !jwtService.isTokenExpired(storedToken)) {
        // Token is valid, auth should be set
        setIsInitializing(false)
      } else if (storedToken && jwtService.isTokenExpired(storedToken)) {
        // Token is expired, clear auth state
        useAuthStore.getState().logout()
        setIsInitializing(false)
      } else {
        // No token found
        setIsInitializing(false)
      }
    }
    
    initialize()
  }, [initializeAuth])
  
  // Show loading while initializing
  if (isInitializing || isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          gap: 2
        }}
      >
        <CircularProgress size={40} />
        <Typography variant="body1" color="text.secondary">
          Loading...
        </Typography>
      </Box>
    )
  }
  
  // Check if user is authenticated
  if (!isAuthenticated || !token) {
    return (
      <Navigate 
        to="/login" 
        state={{ from: location }} 
        replace 
      />
    )
  }
  
  // Check role-based access if required
  if (requiredRole && user?.role !== requiredRole) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          gap: 2,
          p: 3
        }}
      >
        <Typography variant="h5" color="error">
          Access Denied
        </Typography>
        <Typography variant="body1" color="text.secondary" textAlign="center">
          You do not have the required permissions to access this page.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Required role: {requiredRole} | Your role: {user?.role || 'Unknown'}
        </Typography>
      </Box>
    )
  }
  
  // User is authenticated and has required role
  return children
})

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  requiredRole: PropTypes.string
}

ProtectedRoute.displayName = 'ProtectedRoute'

export default ProtectedRoute