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
 * @param {number} activeTab - Current active tab (optional)
 * @param {Function} setActiveTab - Tab setter function (optional)
 * @returns {Object} - Memoized URL sync utilities and state
 */
export const useUrlFilterSync = (filters, setFilters, options = {}, activeTab = null, setActiveTab = null) => {
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
  const updateUrlFromFilters = useCallback((filtersToSync, tabToSync = null) => {
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
          
          // Encode filters and tab to URL params
          const newParams = encodeFiltersToUrlParams(filtersToSync, tabToSync)
          const newUrlState = newParams.toString()
          
          // Only update if URL actually changed (performance optimization)
          if (newUrlState !== refsCache.lastUrlState.current) {
            refsCache.lastUrlState.current = newUrlState
            
            // Update URL without triggering navigation
            setSearchParams(newParams, { replace: true })
            
            if (config.logOperations) {
              const duration = performance.now() - startTime
              console.log(`🔄 URL updated from filters/tab in ${duration.toFixed(2)}ms:`, newUrlState)
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
      const decodedData = decodeUrlParamsToFilters(urlParams)
      const { filters: urlFilters, activeTab: urlActiveTab } = decodedData
      
      // Update filters if we got valid ones
      if (urlFilters && Object.keys(urlFilters).length > 0) {
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
      
      // Update tab if we have a tab setter and valid tab from URL
      if (setActiveTab && urlActiveTab !== undefined && urlActiveTab !== activeTab) {
        setActiveTab(urlActiveTab)
        
        if (config.logOperations) {
          console.log(`🔄 Tab updated from URL: ${urlActiveTab}`)
        }
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
      
      // Check if URL has any filter or tab parameters
      const urlState = searchParams.toString()
      const hasUrlParams = searchParams.has('timeframe') || 
                          searchParams.has('developers') || 
                          searchParams.has('projects') ||
                          searchParams.has('tab')
      
      if (hasUrlParams && !refsCache.initialized.current) {
        console.log('🚀 Initializing filters/tab from URL parameters:', urlState)
        refsCache.initialized.current = true
        refsCache.lastUrlState.current = urlState
        updateFiltersFromUrl(searchParams)
      } else if (!hasUrlParams && !refsCache.initialized.current) {
        console.log('🚀 No URL parameters found, using current filter/tab state')
        refsCache.initialized.current = true
        // Initialize URL from current filters and tab if no URL params exist
        const currentUrlState = encodeFiltersToUrlParams(filters, activeTab).toString()
        if (currentUrlState) {
          refsCache.lastUrlState.current = currentUrlState
          setSearchParams(encodeFiltersToUrlParams(filters, activeTab), { replace: true })
        }
      }
      
    } catch (error) {
      console.warn('🚨 URL sync initialization failed:', error)
    }
  }, [isUrlSyncAvailable, searchParams, filters, activeTab, updateFiltersFromUrl, setSearchParams, refsCache])

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

    updateUrlFromFilters(filtersToSync, activeTab)
  }, [filtersToSync, activeTab, updateUrlFromFilters, isUrlSyncAvailable, refsCache])

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
      updateUrlFromFilters(filtersToSync, activeTab)
      return true
    } catch (error) {
      console.warn('🚨 Manual URL sync failed:', error)
      return false
    }
  }, [filtersToSync, activeTab, updateUrlFromFilters, isUrlSyncAvailable])

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
      const params = encodeFiltersToUrlParams(filtersToSync, activeTab)
      const baseUrl = `${window.location.origin}${window.location.pathname}`
      return params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl
    } catch (error) {
      console.warn('🚨 Shareable URL creation failed:', error)
      return window.location.href
    }
  }, [filtersToSync, activeTab])

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