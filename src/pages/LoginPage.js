import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Box, Container } from '@mui/material'
import LoginForm from '../features/authentication/components/LoginForm'
import { useAuthStore } from '../features/authentication/store/authStore'

const LoginPage = React.memo(() => {
  const { login, isLoading, error, isAuthenticated } = useAuthStore()
  const location = useLocation()
  
  // Redirect to intended page after login or to dashboard
  const from = location.state?.from?.pathname || '/main-dashboard'
  
  // If already authenticated, redirect to dashboard
  if (isAuthenticated) {
    return <Navigate to={from} replace />
  }
  
  const handleLogin = React.useCallback(async (username, password) => {
    const result = await login(username, password)
    if (result.success) {
      // Navigation will be handled by the redirect above
      console.log('Login successful')
    }
  }, [login])
  
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'grey.50',
        py: 12,
        px: 4
      }}
    >
      <Container maxWidth="sm">
        <LoginForm
          onLogin={handleLogin}
          isLoading={isLoading}
          error={error}
        />
      </Container>
    </Box>
  )
})

LoginPage.displayName = 'LoginPage'

export default LoginPage