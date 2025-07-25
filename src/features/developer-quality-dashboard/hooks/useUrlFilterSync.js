/**
 * URL Filter Synchronization Hook
 * 
 * Provides safe bidirectional synchronization between URL parameters and filter state
 * following project conventions: proper React patterns, performance optimization, DRY principles
 */

import { useEffect, useRef, useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { 
  encodeFiltersToUrlParams, 
  decodeUrlParamsToFilters, 
  validateUrlParams,
  detectUrlFeatures 
} from '../utils/urlFilterUtils'

/**
 * Safe URL Filter Synchronization Hook
 * Follows React conventions: useMemo for values, useCallback for functions
 * 
 * @param {Object} filters - Current filter state from store
 * @param {Function} setFilters - Filter setter function from store
 * @param {Object} options - Configuration options
 * @returns {Object} - Memoized URL sync utilities and state
 */
export const useUrlFilterSync = (filters, setFilters, options = {}) => {
  // Memoized configuration (performance optimization)
  const config = useMemo(() => ({
    enableUrlSync: true,
    debounceMs: 16, // requestAnimationFrame timing
    logOperations: true,
    ...options
  }), [options])

  // Refs for preventing circular updates and state management
  const refsCache = useMemo(() => ({
    isUrlUpdate: { current: false },
    isFilterUpdate: { current: false },
    lastUrlState: { current: '' },
    debounceTimeout: { current: null },
    mounted: { current: false },
    initialized: { current: false }
  }), [])

  // React Router hooks with feature detection
  const [searchParams, setSearchParams] = useSearchParams()

  // Memoized feature detection (performance optimization)
  const urlFeatures = useMemo(() => detectUrlFeatures(), [])
  const isUrlSyncAvailable = useMemo(() => 
    urlFeatures.URLSearchParams && urlFeatures.pushState && config.enableUrlSync,
    [urlFeatures, config.enableUrlSync]
  )

  /**
   * Safe URL parameter update with technical debounce
   * Uses requestAnimationFrame for optimal performance timing
   * Memoized callback for performance
   */
  const updateUrlFromFilters = useCallback((filtersToSync) => {
    if (!isUrlSyncAvailable || refsCache.isUrlUpdate.current || !refsCache.mounted.current) return

    try {
      // Clear any existing debounce
      if (refsCache.debounceTimeout.current) {
        cancelAnimationFrame(refsCache.debounceTimeout.current)
      }

      // Use requestAnimationFrame for optimal timing (follows performance conventions)
      refsCache.debounceTimeout.current = requestAnimationFrame(() => {
        try {
          const startTime = performance.now()
          
          // Prevent circular updates
          refsCache.isFilterUpdate.current = true
          
          // Encode filters to URL params
          const newParams = encodeFiltersToUrlParams(filtersToSync)
          const newUrlState = newParams.toString()
          
          // Only update if URL actually changed (performance optimization)
          if (newUrlState !== refsCache.lastUrlState.current) {
            refsCache.lastUrlState.current = newUrlState
            
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
            refsCache.isFilterUpdate.current = false
          }, 50)
        }
      })
      
    } catch (error) {
      console.warn('🚨 URL update scheduling failed:', error)
    }
  }, [isUrlSyncAvailable, setSearchParams, config, refsCache])

  /**
   * Safe filter update from URL parameters
   * Uses existing setFilters method with validation
   * Memoized callback for performance
   */
  const updateFiltersFromUrl = useCallback((urlParams) => {
    if (!isUrlSyncAvailable || refsCache.isFilterUpdate.current || !refsCache.mounted.current) return

    try {
      const startTime = performance.now()
      
      // Prevent circular updates
      refsCache.isUrlUpdate.current = true
      
      // Validate URL parameters first (security)
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
        refsCache.isUrlUpdate.current = false
      }, 50)
    }
  }, [isUrlSyncAvailable, setFilters, config, refsCache])

  /**
   * Initialize URL sync on component mount
   * Reads URL parameters and applies them to filters
   */
  useEffect(() => {
    if (!isUrlSyncAvailable) return

    try {
      refsCache.mounted.current = true
      
      // Check if URL has any filter parameters
      const urlState = searchParams.toString()
      const hasUrlParams = searchParams.has('timeframe') || 
                          searchParams.has('developers') || 
                          searchParams.has('projects')
      
      if (hasUrlParams && !refsCache.initialized.current) {
        console.log('🚀 Initializing filters from URL parameters:', urlState)
        refsCache.initialized.current = true
        refsCache.lastUrlState.current = urlState
        updateFiltersFromUrl(searchParams)
      } else if (!hasUrlParams && !refsCache.initialized.current) {
        console.log('🚀 No URL parameters found, using current filter state')
        refsCache.initialized.current = true
        // Initialize URL from current filters if no URL params exist
        const currentUrlState = encodeFiltersToUrlParams(filters).toString()
        if (currentUrlState) {
          refsCache.lastUrlState.current = currentUrlState
          setSearchParams(encodeFiltersToUrlParams(filters), { replace: true })
        }
      }
      
    } catch (error) {
      console.warn('🚨 URL sync initialization failed:', error)
    }
  }, [isUrlSyncAvailable, searchParams, filters, updateFiltersFromUrl, setSearchParams, refsCache])

  /**
   * Listen for filter changes and update URL
   * Memoized filter values for performance (follows conventions)
   */
  const filtersToSync = useMemo(() => ({
    timeframe: filters?.timeframe,
    developers: filters?.developers,
    projects: filters?.projects
  }), [filters?.timeframe, filters?.developers, filters?.projects])

  useEffect(() => {
    if (!isUrlSyncAvailable || !refsCache.mounted.current || refsCache.isUrlUpdate.current) return

    updateUrlFromFilters(filtersToSync)
  }, [filtersToSync, updateUrlFromFilters, isUrlSyncAvailable, refsCache])

  /**
   * Listen for URL changes (browser back/forward, direct URL changes)
   */
  useEffect(() => {
    if (!isUrlSyncAvailable || !refsCache.mounted.current || refsCache.isFilterUpdate.current) return

    const currentUrlState = searchParams.toString()
    
    // Only update if URL actually changed
    if (currentUrlState !== refsCache.lastUrlState.current) {
      console.log('🔄 URL changed externally, updating filters:', currentUrlState)
      refsCache.lastUrlState.current = currentUrlState
      updateFiltersFromUrl(searchParams)
    }
  }, [searchParams, updateFiltersFromUrl, isUrlSyncAvailable, refsCache])

  /**
   * Cleanup on unmount (memory leak prevention)
   */
  useEffect(() => {
    return () => {
      refsCache.mounted.current = false
      if (refsCache.debounceTimeout.current) {
        cancelAnimationFrame(refsCache.debounceTimeout.current)
      }
    }
  }, [refsCache])

  /**
   * Manual URL sync trigger (memoized callback)
   */
  const syncUrlFromFilters = useCallback(() => {
    if (!isUrlSyncAvailable) return false

    try {
      updateUrlFromFilters(filtersToSync)
      return true
    } catch (error) {
      console.warn('🚨 Manual URL sync failed:', error)
      return false
    }
  }, [filtersToSync, updateUrlFromFilters, isUrlSyncAvailable])

  /**
   * Manual filter sync trigger (memoized callback)
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
   * Get current shareable URL (memoized callback)
   */
  const getShareableUrl = useCallback(() => {
    try {
      const params = encodeFiltersToUrlParams(filtersToSync)
      const baseUrl = `${window.location.origin}${window.location.pathname}`
      return params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl
    } catch (error) {
      console.warn('🚨 Shareable URL creation failed:', error)
      return window.location.href
    }
  }, [filtersToSync])

  /**
   * Get URL sync status (memoized value)
   */
  const urlSyncStatus = useMemo(() => ({
    available: isUrlSyncAvailable,
    initialized: refsCache.initialized.current,
    features: urlFeatures,
    currentUrl: searchParams.toString()
  }), [isUrlSyncAvailable, urlFeatures, searchParams, refsCache])

  // Return memoized hook interface (performance optimization)
  return useMemo(() => ({
    // Status
    isUrlSyncAvailable,
    isInitialized: refsCache.initialized.current,
    
    // Manual controls (memoized callbacks)
    syncUrlFromFilters,
    syncFiltersFromUrl,
    getShareableUrl,
    
    // Status getter
    getUrlSyncStatus: () => urlSyncStatus,
    
    // Utilities (for debugging)
    currentUrlParams: searchParams.toString(),
    urlFeatures
  }), [
    isUrlSyncAvailable,
    refsCache,
    syncUrlFromFilters,
    syncFiltersFromUrl,
    getShareableUrl,
    urlSyncStatus,
    searchParams,
    urlFeatures
  ])
}

export default useUrlFilterSync