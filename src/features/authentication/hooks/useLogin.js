import { useState, useCallback } from 'react'
import { useAuth } from './useAuth'

export const useLogin = () => {
  const { login, isLoading, error } = useAuth()
  const [validationErrors, setValidationErrors] = useState({})

  const validateCredentials = useCallback((username, password) => {
    const errors = {}
    
    if (!username?.trim()) {
      errors.username = 'Username is required'
    }
    
    if (!password?.trim()) {
      errors.password = 'Password is required'
    } else if (password.length < 3) {
      errors.password = 'Password must be at least 3 characters'
    }
    
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }, [])

  const handleLogin = useCallback(async (username, password) => {
    if (!validateCredentials(username, password)) {
      return { success: false, error: 'Validation failed' }
    }

    try {
      const result = await login(username, password)
      if (result.success) {
        setValidationErrors({})
      }
      return result
    } catch (error) {
      return { 
        success: false, 
        error: error.message || 'Login failed' 
      }
    }
  }, [login, validateCredentials])

  const clearValidationErrors = useCallback(() => {
    setValidationErrors({})
  }, [])

  return {
    login: handleLogin,
    isLoading,
    error,
    validationErrors,
    clearValidationErrors
  }
}