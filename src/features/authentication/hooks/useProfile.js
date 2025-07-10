import { useState, useCallback } from 'react'
import { useAuth } from './useAuth'
import { authService } from '../services/authService'

export const useProfile = () => {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchProfile = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const profileData = await authService.getProfile()
      setProfile(profileData)
      return profileData
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch profile'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const updateProfile = useCallback(async (profileData) => {
    setIsLoading(true)
    setError(null)
    
    try {
      // This would typically be a PUT/PATCH request to update profile
      // For now, we'll just simulate the API call
      const updatedProfile = { ...profile, ...profileData }
      setProfile(updatedProfile)
      return updatedProfile
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to update profile'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [profile])

  const getUserInitials = useCallback(() => {
    if (user?.username) {
      return user.username
        .split(' ')
        .map(name => name.charAt(0).toUpperCase())
        .join('')
        .slice(0, 2)
    }
    return 'U'
  }, [user])

  const getUserDisplayName = useCallback(() => {
    return user?.username || 'Unknown User'
  }, [user])

  const getUserRole = useCallback(() => {
    return user?.role || 'User'
  }, [user])

  const isAdmin = useCallback(() => {
    return user?.role === 'ADMIN'
  }, [user])

  return {
    user,
    profile,
    isLoading,
    error,
    fetchProfile,
    updateProfile,
    getUserInitials,
    getUserDisplayName,
    getUserRole,
    isAdmin
  }
}