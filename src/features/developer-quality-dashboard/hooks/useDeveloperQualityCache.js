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

  // Auto-load cached data on mount if no data exists
  useEffect(() => {
    if (!hasData && !jiraLoading && !jiraError && !data && !isLoading) {
      // Try to load from cache first
      loadCachedData()
    }
  }, [hasData, jiraLoading, jiraError, data, isLoading, loadCachedData])

  // Load developer quality data when JIRA data becomes available
  useEffect(() => {
    console.log('Developer Quality Cache - JIRA data effect:', {
      hasJiraData: !!jiraData,
      jiraDataLength: Array.isArray(jiraData) ? jiraData.length : 'not array',
      jiraDataType: typeof jiraData,
      hasProcessedData: !!data,
      isLoading,
      shouldProcess: jiraData && Array.isArray(jiraData) && jiraData.length > 0 && !data && !isLoading
    })
    
    if (jiraData && Array.isArray(jiraData) && jiraData.length > 0 && !data && !isLoading) {
      console.log('Developer Quality Cache - Processing JIRA data:', jiraData.length, 'issues')
      // Process raw JIRA issues for developer quality
      loadData(jiraData)
    }
  }, [jiraData, data, isLoading, loadData])

  // Auto-refresh when JIRA data updates
  useEffect(() => {
    if (jiraData && data && lastUpdated && hasData) {
      // Simple check - if we have new JIRA data and it's different length than cached
      const currentCount = Array.isArray(jiraData) ? jiraData.length : 0
      const cachedCount = data?.metadata?.totalIssues || 0
      
      if (currentCount > 0 && currentCount !== cachedCount) {
        console.log('JIRA data updated, refreshing developer quality data')
        refreshData()
      }
    }
  }, [jiraData, data, lastUpdated, refreshData, hasData])

  // Refresh data callback
  const handleRefresh = useCallback(async () => {
    try {
      await refreshData()
    } catch (error) {
      console.error('Failed to refresh developer quality data:', error)
    }
  }, [refreshData])

  // Force reload callback - this will trigger S3 download
  const handleForceReload = useCallback(async () => {
    try {
      reset()
      // Trigger fresh data fetch from S3
      await fetchData()
    } catch (error) {
      console.error('Failed to force reload developer quality data:', error)
    }
  }, [reset, fetchData])

  // Clear cache callback
  const handleClearCache = useCallback(() => {
    reset()
  }, [reset])

  // Check if cache is stale (older than 1 hour)
  const isCacheStale = useMemo(() => {
    if (!lastUpdated) return false
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    return new Date(lastUpdated) < oneHourAgo
  }, [lastUpdated])

  // Check if cache needs initialization
  const needsInitialization = useMemo(() => {
    return !data && !hasData && !jiraLoading && !error
  }, [data, hasData, jiraLoading, error])

  // Get effective error (prioritize developer quality errors, fallback to JIRA errors)
  const effectiveError = useMemo(() => {
    return error || jiraError
  }, [error, jiraError])

  // Get effective loading state
  const effectiveLoading = useMemo(() => {
    return isLoading || (jiraLoading && !hasData)
  }, [isLoading, jiraLoading, hasData])

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