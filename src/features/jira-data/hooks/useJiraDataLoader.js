import { useCallback, useRef } from 'react'
import { useJiraDataStore } from '../store/jiraDataStore'

/**
 * Custom hook for managing JIRA data loading with comprehensive progress tracking
 */
export const useJiraDataLoader = () => {
  const store = useJiraDataStore()
  const storeRef = useRef(store)
  storeRef.current = store
  
  const {
    // Loading state
    isLoading,
    loadingStage,
    currentOperation,
    overallProgress,
    downloadStats,
    currentDownloadingFile,
    downloadProgress,
    failedDownloads,
    
    // Data state
    allIssues,
    snapshots,
    currentQuarter,
    error
  } = store
  
  const startDataFetch = useCallback((filters = {}) => {
    return storeRef.current.fetchJiraDataWithProgress(filters)
  }, [])
  
  const retryFailed = useCallback(() => {
    return storeRef.current.retryFailedDownloads()
  }, [])
  
  const cancelDownload = useCallback(() => {
    // Reset loading states to cancel ongoing operations
    storeRef.current.resetLoadingStates()
    storeRef.current.clearError()
  }, [])
  
  const clearErrors = useCallback(() => {
    storeRef.current.clearError()
  }, [])
  
  // Get data summary
  const getDataSummary = useCallback(() => {
    if (!allIssues.length) return null
    
    // Simple summary calculation
    const summary = {
      total: allIssues.length,
      resolvedCount: 0,
      unresolvedCount: 0,
      projectCount: 0,
      projects: {}
    }
    
    const projectCounts = {}
    
    allIssues.forEach(issue => {
      const status = issue.fields?.status?.name
      const projectKey = issue.fields?.project?.key
      const projectName = issue.fields?.project?.name || projectKey
      
      // Count by status
      if (status && (status.toLowerCase().includes('done') || status.toLowerCase().includes('resolved') || status.toLowerCase().includes('closed'))) {
        summary.resolvedCount++
      } else {
        summary.unresolvedCount++
      }
      
      // Count by project
      if (projectKey) {
        if (!projectCounts[projectKey]) {
          projectCounts[projectKey] = {
            key: projectKey,
            name: projectName,
            issueCount: 0
          }
        }
        projectCounts[projectKey].issueCount++
      }
    })
    
    summary.projects = Object.values(projectCounts).sort((a, b) => b.issueCount - a.issueCount)
    summary.projectCount = summary.projects.length
    
    return summary
  }, [allIssues])
  
  // Computed values
  const hasFailedDownloads = failedDownloads.length > 0
  const isDownloading = loadingStage === 'downloading-files'
  const isProcessing = loadingStage === 'processing-data'
  const isFetchingUrls = loadingStage === 'fetching-urls'
  const canRetry = hasFailedDownloads && !isLoading
  const hasData = allIssues.length > 0
  
  // Progress statistics
  const progressStats = {
    totalFiles: downloadStats.totalFiles,
    completedFiles: downloadStats.completedFiles,
    failedFiles: downloadStats.failedFiles,
    totalSize: downloadStats.totalSize,
    downloadedSize: downloadStats.downloadedSize,
    estimatedTimeRemaining: downloadStats.estimatedTimeRemaining,
    completionRate: downloadStats.totalFiles > 0 ? 
      ((downloadStats.completedFiles / downloadStats.totalFiles) * 100) : 0
  }
  
  return {
    // Loading state
    isLoading,
    loadingStage,
    currentOperation,
    overallProgress,
    downloadStats,
    currentDownloadingFile,
    downloadProgress,
    failedDownloads,
    error,
    
    // Data state
    allIssues,
    snapshots,
    currentQuarter,
    hasData,
    totalRecords: allIssues.length,
    
    // Actions
    startDataFetch,
    retryFailed,
    cancelDownload,
    clearErrors,
    
    // Computed values
    hasFailedDownloads,
    isDownloading,
    isProcessing,
    isFetchingUrls,
    canRetry,
    progressStats,
    
    // Helper functions
    getDataSummary,
    isStageActive: (stage) => loadingStage === stage,
    getFailedDownloadCount: () => failedDownloads.length,
    getCompletionPercentage: () => {
      if (downloadStats.totalFiles === 0) return 0
      return Math.round((downloadStats.completedFiles / downloadStats.totalFiles) * 100)
    }
  }
}

export default useJiraDataLoader