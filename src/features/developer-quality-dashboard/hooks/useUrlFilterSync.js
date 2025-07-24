/**
 * URL Filter Synchronization Hook
 * 
 * Provides safe bidirectional synchronization between URL parameters and filter state
 * with comprehensive error handling and circular update prevention.
 * 
 * SAFETY REQUIREMENTS:
 * - Prevent infinite loops between URL ↔ filter updates
 * - Use ONLY existing setFilters method (no bypassing)
 * - Respect special project filter handling
 * - Zero impact on existing performance monitoring
 * - Graceful fallbacks for browser compatibility
 */

import { useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { 
  encodeFiltersToUrlParams, 
  decodeUrlParamsToFilters, 
  validateUrlParams,
  detectUrlFeatures 
} from '../utils/urlFilterUtils'

/**
 * Safe URL Filter Synchronization Hook
 * 
 * @param {Object} filters - Current filter state from store
 * @param {Function} setFilters - Filter setter function from store (must use existing method)
 * @param {Object} options - Configuration options
 * @returns {Object} - URL sync utilities and state
 */
export const useUrlFilterSync = (filters, setFilters, options = {}) => {
  // Configuration with safe defaults
  const config = {
    enableUrlSync: true,
    debounceMs: 16, // requestAnimationFrame timing
    logOperations: true,
    ...options
  }

  // Refs for preventing circular updates
  const isUrlUpdateRef = useRef(false)
  const isFilterUpdateRef = useRef(false)
  const lastUrlStateRef = useRef('')
  const debounceTimeoutRef = useRef(null)
  const mountedRef = useRef(false)
  const initializedRef = useRef(false)

  // React Router hooks with feature detection
  let searchParams, setSearchParams
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    [searchParams, setSearchParams] = useSearchParams()
  } catch (error) {
    console.warn('🚨 useSearchParams not available, URL sync disabled:', error)
    searchParams = new URLSearchParams()
    setSearchParams = () => {}
  }

  // Feature detection
  const urlFeatures = detectUrlFeatures()
  const isUrlSyncAvailable = urlFeatures.URLSearchParams && urlFeatures.pushState && config.enableUrlSync

  /**
   * Safe URL parameter update with technical debounce
   * Uses requestAnimationFrame for optimal performance timing
   */
  const updateUrlFromFilters = useCallback((filtersToSync) => {
    if (!isUrlSyncAvailable || isUrlUpdateRef.current || !mountedRef.current) return

    try {
      // Clear any existing debounce
      if (debounceTimeoutRef.current) {
        cancelAnimationFrame(debounceTimeoutRef.current)
      }

      // Use requestAnimationFrame for optimal timing (16ms debounce)
      debounceTimeoutRef.current = requestAnimationFrame(() => {
        try {
          const startTime = performance.now()
          
          // Prevent circular updates
          isFilterUpdateRef.current = true
          
          // Encode filters to URL params
          const newParams = encodeFiltersToUrlParams(filtersToSync)
          const newUrlState = newParams.toString()
          
          // Only update if URL actually changed
          if (newUrlState !== lastUrlStateRef.current) {
            lastUrlStateRef.current = newUrlState
            
            // Update URL without triggering navigation
            setSearchParams(newParams, { replace: true })
            
            if (config.logOperations) {
              const duration = performance.now() - startTime
              console.log(`🔄 URL updated from filters in ${duration.toFixed(2)}ms:`, newUrlState)
            }
          }
          
        } catch (error) {
          console.warn('🚨 URL update from filters failed:', error)
        } finally {
          // Reset flag after a brief delay to prevent rapid cycling
          setTimeout(() => {
            isFilterUpdateRef.current = false
          }, 50)
        }
      })
      
    } catch (error) {
      console.warn('🚨 URL update scheduling failed:', error)
    }
  }, [isUrlSyncAvailable, setSearchParams, config.logOperations])

  /**
   * Safe filter update from URL parameters
   * Uses existing setFilters method with validation
   */
  const updateFiltersFromUrl = useCallback((urlParams) => {
    if (!isUrlSyncAvailable || isFilterUpdateRef.current || !mountedRef.current) return

    try {
      const startTime = performance.now()
      
      // Prevent circular updates
      isUrlUpdateRef.current = true
      
      // Validate URL parameters first
      const validation = validateUrlParams(urlParams)
      if (!validation.isValid) {
        console.warn('🚨 Invalid URL parameters detected:', validation.errors)
        return
      }
      
      if (validation.warnings.length > 0) {
        console.warn('⚠️ URL parameter warnings:', validation.warnings)
      }
      
      // Decode URL parameters with smart matching
      const urlFilters = decodeUrlParamsToFilters(urlParams)
      
      // Only update if we got valid filters
      if (Object.keys(urlFilters).length > 0) {
        // Use existing setFilters method to maintain system integrity
        // This preserves special project handling and performance monitoring
        setFilters(currentFilters => {
          const newFilters = {
            ...currentFilters,
            ...urlFilters
          }
          
          if (config.logOperations) {
            const duration = performance.now() - startTime
            console.log(`🔄 Filters updated from URL in ${duration.toFixed(2)}ms:`, urlFilters)
          }
          
          return newFilters
        })
      }
      
    } catch (error) {
      console.warn('🚨 Filter update from URL failed, continuing with current state:', error)
    } finally {
      // Reset flag after a brief delay to prevent rapid cycling
      setTimeout(() => {
        isUrlUpdateRef.current = false
      }, 50)
    }
  }, [isUrlSyncAvailable, setFilters, config.logOperations])

  /**
   * Initialize URL sync on component mount
   * Reads URL parameters and applies them to filters with precedence over persisted state
   */
  useEffect(() => {
    if (!isUrlSyncAvailable) return

    try {
      mountedRef.current = true
      
      // Check if URL has any filter parameters
      const urlState = searchParams.toString()
      const hasUrlParams = searchParams.has('timeframe') || 
                          searchParams.has('developers') || 
                          searchParams.has('projects')
      
      if (hasUrlParams && !initializedRef.current) {
        console.log('🚀 Initializing filters from URL parameters:', urlState)
        initializedRef.current = true
        lastUrlStateRef.current = urlState
        updateFiltersFromUrl(searchParams)
      } else if (!hasUrlParams && !initializedRef.current) {
        console.log('🚀 No URL parameters found, using current filter state')
        initializedRef.current = true
        // Initialize URL from current filters if no URL params exist
        const currentUrlState = encodeFiltersToUrlParams(filters).toString()
        if (currentUrlState) {
          lastUrlStateRef.current = currentUrlState
          setSearchParams(encodeFiltersToUrlParams(filters), { replace: true })
        }
      }
      
    } catch (error) {
      console.warn('🚨 URL sync initialization failed:', error)
    }
  }, [isUrlSyncAvailable, searchParams, filters, updateFiltersFromUrl, setSearchParams])

  /**
   * Listen for filter changes and update URL
   * Uses deep comparison to prevent unnecessary updates
   */
  useEffect(() => {
    if (!isUrlSyncAvailable || !mountedRef.current || isUrlUpdateRef.current) return

    // Only sync the 3 main filters as specified
    const filtersToSync = {
      timeframe: filters.timeframe,
      developers: filters.developers,
      projects: filters.projects
    }

    updateUrlFromFilters(filtersToSync)
  }, [filters.timeframe, filters.developers, filters.projects, updateUrlFromFilters])

  /**
   * Listen for URL changes (browser back/forward, direct URL changes)
   */
  useEffect(() => {
    if (!isUrlSyncAvailable || !mountedRef.current || isFilterUpdateRef.current) return

    const currentUrlState = searchParams.toString()
    
    // Only update if URL actually changed
    if (currentUrlState !== lastUrlStateRef.current) {
      console.log('🔄 URL changed externally, updating filters:', currentUrlState)
      lastUrlStateRef.current = currentUrlState
      updateFiltersFromUrl(searchParams)
    }
  }, [searchParams, updateFiltersFromUrl])

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      mountedRef.current = false
      if (debounceTimeoutRef.current) {
        cancelAnimationFrame(debounceTimeoutRef.current)
      }
    }
  }, [])

  /**
   * Manual URL sync trigger (for edge cases)
   */
  const syncUrlFromFilters = useCallback(() => {
    if (!isUrlSyncAvailable) return false

    try {
      const filtersToSync = {
        timeframe: filters.timeframe,
        developers: filters.developers,
        projects: filters.projects
      }
      updateUrlFromFilters(filtersToSync)
      return true
    } catch (error) {
      console.warn('🚨 Manual URL sync failed:', error)
      return false
    }
  }, [filters, updateUrlFromFilters, isUrlSyncAvailable])

  /**
   * Manual filter sync trigger (for edge cases)
   */
  const syncFiltersFromUrl = useCallback(() => {
    if (!isUrlSyncAvailable) return false

    try {
      updateFiltersFromUrl(searchParams)
      return true
    } catch (error) {
      console.warn('🚨 Manual filter sync failed:', error)
      return false
    }
  }, [searchParams, updateFiltersFromUrl, isUrlSyncAvailable])

  /**
   * Get current shareable URL
   */
  const getShareableUrl = useCallback(() => {
    try {
      const filtersToSync = {
        timeframe: filters.timeframe,
        developers: filters.developers,
        projects: filters.projects
      }
      const params = encodeFiltersToUrlParams(filtersToSync)
      const baseUrl = `${window.location.origin}${window.location.pathname}`
      return params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl
    } catch (error) {
      console.warn('🚨 Shareable URL creation failed:', error)
      return window.location.href
    }
  }, [filters])

  /**
   * Check if URL sync is working
   */
  const getUrlSyncStatus = useCallback(() => {
    return {
      available: isUrlSyncAvailable,
      initialized: initializedRef.current,
      features: urlFeatures,
      currentUrl: searchParams.toString()
    }
  }, [isUrlSyncAvailable, urlFeatures, searchParams])

  // Return hook interface
  return {
    // Status
    isUrlSyncAvailable,
    isInitialized: initializedRef.current,
    
    // Manual controls
    syncUrlFromFilters,
    syncFiltersFromUrl,
    getShareableUrl,
    getUrlSyncStatus,
    
    // Utilities (for debugging)
    currentUrlParams: searchParams.toString(),
    urlFeatures
  }
}

export default useUrlFilterSync