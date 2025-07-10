import { useState, useCallback, useEffect, useRef } from 'react'
import { useUIStore } from '../store/uiStore'

export const useApi = (apiCall, options = {}) => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const mountedRef = useRef(true)
  const abortControllerRef = useRef(null)
  
  const { addNotification } = useUIStore()
  const { 
    onSuccess, 
    onError, 
    showErrorNotification = true,
    initialData = null
  } = options
  
  useEffect(() => {
    setData(initialData)
    return () => {
      mountedRef.current = false
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [initialData])
  
  const execute = useCallback(async (...args) => {
    try {
      setLoading(true)
      setError(null)
      
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      
      abortControllerRef.current = new AbortController()
      
      const result = await apiCall(...args, {
        signal: abortControllerRef.current.signal
      })
      
      if (mountedRef.current) {
        setData(result.data || result)
        if (onSuccess) {
          onSuccess(result.data || result)
        }
      }
      
      return result
    } catch (err) {
      if (mountedRef.current && err.name !== 'CanceledError') {
        const errorMessage = err.response?.data?.message || err.message || 'An error occurred'
        setError(errorMessage)
        
        if (showErrorNotification) {
          addNotification({
            type: 'error',
            message: errorMessage
          })
        }
        
        if (onError) {
          onError(err)
        }
      }
      throw err
    } finally {
      if (mountedRef.current) {
        setLoading(false)
      }
    }
  }, [apiCall, onSuccess, onError, showErrorNotification, addNotification])
  
  const reset = useCallback(() => {
    setData(initialData)
    setError(null)
    setLoading(false)
  }, [initialData])
  
  return {
    data,
    loading,
    error,
    execute,
    reset,
    setData
  }
}