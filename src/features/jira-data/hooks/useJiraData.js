import { useCallback, useEffect } from 'react'
import { useJiraDataStore } from '../store/jiraDataStore'

export const useJiraData = () => {
  const {
    // State
    snapshots,
    currentQuarter,
    allIssues,
    isLoading,
    error,
    downloadProgress,
    metadata,
    lastFetched,
    totalSnapshots,
    completedSnapshots,
    currentDownload,
    estimatedTotalRecords,
    processedRecords,
    filters,
    
    // Actions
    fetchJiraData,
    loadFromCache,
    resetData,
    clearError,
    setFilters,
    resetFilters
  } = useJiraDataStore()
  
  // Initialize cache loading on mount
  useEffect(() => {
    console.log(`🔍 useJiraData useEffect: allIssues.length=${allIssues.length}, isLoading=${isLoading}, error=${error}`)
    if (allIssues.length === 0 && !isLoading && !error) {
      console.log('🔍 Conditions met, calling loadFromCache...')
      loadFromCache()
    } else {
      console.log('🔍 Conditions not met for loading cache')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allIssues.length, isLoading, error])
  
  // Fetch data with filters
  const fetchData = useCallback(async (filterOverrides = {}) => {
    try {
      await fetchJiraData(filterOverrides)
    } catch (error) {
      console.error('Failed to fetch JIRA data:', error)
      throw error
    }
  }, [fetchJiraData])
  
  // Refresh data (force new fetch)
  const refreshData = useCallback(async (filterOverrides = {}) => {
    resetData()
    clearError()
    return fetchData(filterOverrides)
  }, [fetchData, resetData, clearError])
  
  // Load from cache if available
  const loadCachedData = useCallback(async () => {
    try {
      const loaded = await loadFromCache()
      return loaded
    } catch (error) {
      console.error('Failed to load cached data:', error)
      return false
    }
  }, [loadFromCache])
  
  // Update filters and optionally refetch
  const updateFilters = useCallback((newFilters, shouldRefetch = false) => {
    setFilters(newFilters)
    
    if (shouldRefetch) {
      fetchData(newFilters)
    }
  }, [setFilters, fetchData])
  
  // Get data summary
  const getDataSummary = useCallback(() => {
    if (!allIssues.length) return null
    
    const { dataProcessingService } = require('../services/dataProcessingService')
    return dataProcessingService.createSummaryStatistics(allIssues)
  }, [allIssues])
  
  // Get filtered issues
  const getFilteredIssues = useCallback((customFilters = {}) => {
    if (!allIssues.length) return []
    
    let filtered = [...allIssues]
    
    // Apply project filter
    if (customFilters.projects && customFilters.projects.length > 0) {
      filtered = filtered.filter(issue => 
        customFilters.projects.includes(issue.displayFields?.projectKey)
      )
    }
    
    // Apply issue type filter
    if (customFilters.issueTypes && customFilters.issueTypes.length > 0) {
      filtered = filtered.filter(issue => 
        customFilters.issueTypes.includes(issue.displayFields?.issueType)
      )
    }
    
    // Apply status filter
    if (customFilters.statuses && customFilters.statuses.length > 0) {
      filtered = filtered.filter(issue => 
        customFilters.statuses.includes(issue.displayFields?.status)
      )
    }
    
    // Apply date range filter
    if (customFilters.fromDate || customFilters.toDate) {
      filtered = filtered.filter(issue => {
        const createdDate = new Date(issue.fields.created)
        
        if (customFilters.fromDate && createdDate < new Date(customFilters.fromDate)) {
          return false
        }
        
        if (customFilters.toDate && createdDate > new Date(customFilters.toDate)) {
          return false
        }
        
        return true
      })
    }
    
    return filtered
  }, [allIssues])
  
  // Get progress percentage
  const getProgressPercentage = useCallback(() => {
    if (totalSnapshots === 0) return 0
    return (completedSnapshots / totalSnapshots) * 100
  }, [completedSnapshots, totalSnapshots])
  
  // Check if data is stale (needs refresh)
  const isDataStale = useCallback(() => {
    if (!lastFetched) return true
    
    const lastFetchedDate = new Date(lastFetched)
    const now = new Date()
    const hoursDiff = (now - lastFetchedDate) / (1000 * 60 * 60)
    
    return hoursDiff > 6 // Consider stale after 6 hours
  }, [lastFetched])
  
  // Get cache status
  const getCacheStatus = useCallback(() => {
    if (!lastFetched) return 'none'
    
    const stale = isDataStale()
    return stale ? 'stale' : 'fresh'
  }, [isDataStale, lastFetched])
  
  return {
    // Data state
    issues: allIssues,
    snapshots,
    currentQuarter,
    metadata,
    lastFetched,
    filters,
    
    // Loading state
    isLoading,
    error,
    downloadProgress,
    currentDownload,
    completedSnapshots,
    totalSnapshots,
    estimatedTotalRecords,
    processedRecords,
    
    // Computed values
    hasData: allIssues.length > 0,
    progressPercentage: getProgressPercentage(),
    isDataStale: isDataStale,
    cacheStatus: getCacheStatus(),
    
    // Actions
    fetchData,
    refreshData,
    loadCachedData,
    updateFilters,
    resetFilters,
    resetData,
    clearError,
    
    // Helper functions
    getDataSummary,
    getFilteredIssues
  }
}