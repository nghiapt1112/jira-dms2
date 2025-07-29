import { useEffect, useCallback, useMemo } from 'react'
import { useDeveloperQualityStore } from '../store/developerQualityStore'
import { useJiraData } from '../../jira-data/hooks/useJiraData'

export const useDeveloperQualityCache = () => {
  // Get JIRA data from existing system with S3 downloading capability
  const { 
    issues: jiraData, 
    isLoading: jiraLoading, 
    error: jiraError,
    hasData,
    fetchData,
    loadCachedData
  } = useJiraData()
  
  // Get developer quality store
  const {
    data,
    isLoading,
    error,
    lastUpdated,
    cacheSize,
    processingTime,
    loadData,
    refreshData,
    reset
  } = useDeveloperQualityStore()

  // Memoized cache status
  const cacheStatus = useMemo(() => {
    if (error) return 'error'
    if (isLoading || jiraLoading) return 'loading'
    if (!data && !jiraData) return 'empty'
    if (data && lastUpdated) return 'ready'
    if (jiraData && !data) return 'needs-processing'
    return 'unknown'
  }, [data, isLoading, jiraLoading, error, jiraData, lastUpdated])

  // Memoized cache metadata
  const cacheMetadata = useMemo(() => ({
    lastUpdated,
    cacheSize,
    processingTime,
    hasJiraData: !!jiraData,
    hasDeveloperQualityData: !!data,
    status: cacheStatus
  }), [lastUpdated, cacheSize, processingTime, jiraData, data, cacheStatus])

  // Proactive data loading logic - similar to MainDashboard approach
  useEffect(() => {
    // Skip if already loading, data exists, or there's an error
    if (isLoading || data || error) return
    
    // Skip if JIRA is still loading
    if (jiraLoading) return
    
    console.log('🔍 CACHE HOOK: Checking data availability:', {
      hasData: !!data,
      hasJiraData: !!jiraData && jiraData.length > 0,
      jiraDataLength: jiraData?.length || 0,
      isLoading,
      jiraLoading,
      hasError: !!error
    })
    
    // If we have JIRA data, just process it - don't worry about cached processed data
    if (jiraData && Array.isArray(jiraData) && jiraData.length > 0) {

      try {
        loadData(jiraData)
      } catch (loadError) {
        console.error('🔍 CACHE HOOK: Error calling loadData:', loadError)
      }
      return
    }
    
    // Proactively try to load cached data (like MainDashboard does)
    if (!jiraData) {

      try {
        loadCachedData()
      } catch (cacheError) {
        console.error('🔍 CACHE HOOK: Error calling loadCachedData:', cacheError)
      }
      return
    }
  }, [data, isLoading, jiraData, jiraLoading, error])

  // Additional mount effect to be more proactive (like MainDashboard)
  useEffect(() => {
    if (!data && !isLoading && !error && !jiraLoading) {

      loadCachedData()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto-refresh when JIRA data updates - disable for now to prevent loops
  // useEffect(() => {
  //   if (jiraData && data && lastUpdated && hasData) {
  //     // Simple check - if we have new JIRA data and it's different length than cached
  //     const currentCount = Array.isArray(jiraData) ? jiraData.length : 0
  //     const cachedCount = data?.metadata?.totalIssues || 0
      
  //     if (currentCount > 0 && currentCount !== cachedCount) {
  
  //       refreshData()
  //     }
  //   }
  // }, [jiraData, data, lastUpdated, hasData])

  // Refresh data callback
  const handleRefresh = useCallback(async () => {
    try {
      await refreshData()
    } catch (error) {
      console.error('Failed to refresh developer quality data:', error)
    }
  }, [])

  // Force reload callback - this will trigger S3 download
  const handleForceReload = useCallback(async () => {
    try {
      reset()
      // Trigger fresh data fetch from S3
      await fetchData()
    } catch (error) {
      console.error('Failed to force reload developer quality data:', error)
    }
  }, [])

  // Clear cache callback
  const handleClearCache = useCallback(async () => {
    try {
      // Clear both the store and the IndexedDB cache
      await loadData(null) // This will try to load from cache and fail, then clear
      const { developerQualityService } = await import('../services/developerQualityService')
      await developerQualityService.clearCachedData()
      reset()
  
    } catch (error) {
      console.error('Failed to clear cache:', error)
      reset() // Fallback to just clearing the store
    }
  }, [])

  // Check if cache is stale (older than 1 hour)
  const isCacheStale = useMemo(() => {
    if (!lastUpdated) return false
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    return new Date(lastUpdated) < oneHourAgo
  }, [lastUpdated])

  // Check if cache needs initialization
  const needsInitialization = useMemo(() => {
    // Show "needs initialization" only if we have no data, no cache, and no JIRA data
    return !data && !lastUpdated && !hasData && !jiraLoading && !error && !isLoading
  }, [data, lastUpdated, hasData, jiraLoading, error, isLoading])

  // Get effective error (prioritize developer quality errors, fallback to JIRA errors)
  const effectiveError = useMemo(() => {
    return error || jiraError
  }, [error, jiraError])

  // Get effective loading state
  const effectiveLoading = useMemo(() => {
    // Show loading if developer quality is loading or JIRA data is loading
    // Also show loading if we have cache metadata but no data (loading from IndexedDB)
    return isLoading || jiraLoading || (lastUpdated && !data && !error)
  }, [isLoading, jiraLoading, lastUpdated, data, error])

  return {
    // Data
    data,
    
    // Status
    isLoading: effectiveLoading,
    error: effectiveError,
    cacheStatus,
    cacheMetadata,
    isCacheStale,
    needsInitialization,
    
    // Actions
    handleRefresh,
    handleForceReload,
    handleClearCache,
    refresh: handleRefresh,
    forceReload: handleForceReload,
    clearCache: handleClearCache,
    
    // Additional JIRA data properties
    hasData,
    jiraData,
    fetchData,
    loadCachedData,
    
    // Computed values
    isReady: cacheStatus === 'ready',
    isEmpty: cacheStatus === 'empty',
    hasError: cacheStatus === 'error',
    needsProcessing: cacheStatus === 'needs-processing'
  }
} 