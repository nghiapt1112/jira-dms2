import { useEffect, useCallback } from 'react'
import { useDataStore } from '../store/dataStore'
import jiraDataService from '../services/jiraDataService'
import { useApi } from './useApi'

export const useJiraData = (autoFetch = true) => {
  const {
    snapshots,
    currentQuarter,
    allIssues,
    isLoading,
    error,
    downloadProgress,
    fetchJiraData,
    clearError
  } = useDataStore()
  
  const {
    execute: fetchSnapshots,
    loading: fetchingSnapshots
  } = useApi(
    jiraDataService.fetchJiraSnapshots.bind(jiraDataService),
    {
      onSuccess: (data) => {
        useDataStore.getState().setSnapshots(data.data.snapshots)
      }
    }
  )
  
  useEffect(() => {
    if (autoFetch && !allIssues.length && !isLoading && !error) {
      fetchJiraData()
    }
  }, [autoFetch, allIssues.length, isLoading, error, fetchJiraData])
  
  const refetchData = useCallback(async () => {
    clearError()
    await fetchJiraData()
  }, [fetchJiraData, clearError])
  
  const cancelDownloads = useCallback(() => {
    jiraDataService.cancelAllDownloads()
  }, [])
  
  const getFilteredIssues = useCallback((filters = {}) => {
    let filtered = [...allIssues]
    
    if (filters.project) {
      filtered = filtered.filter(issue => 
        issue.fields?.project?.key === filters.project
      )
    }
    
    if (filters.status) {
      filtered = filtered.filter(issue => 
        issue.fields?.status?.name === filters.status
      )
    }
    
    if (filters.assignee) {
      filtered = filtered.filter(issue => 
        issue.fields?.assignee?.key === filters.assignee
      )
    }
    
    if (filters.dateFrom) {
      filtered = filtered.filter(issue => 
        new Date(issue.fields?.created) >= new Date(filters.dateFrom)
      )
    }
    
    if (filters.dateTo) {
      filtered = filtered.filter(issue => 
        new Date(issue.fields?.created) <= new Date(filters.dateTo)
      )
    }
    
    return filtered
  }, [allIssues])
  
  const getIssueStats = useCallback(() => {
    const stats = {
      total: allIssues.length,
      byStatus: {},
      byProject: {},
      byPriority: {},
      byType: {}
    }
    
    allIssues.forEach(issue => {
      const status = issue.fields?.status?.name || 'Unknown'
      const project = issue.fields?.project?.key || 'Unknown'
      const priority = issue.fields?.priority?.name || 'Unknown'
      const type = issue.fields?.issuetype?.name || 'Unknown'
      
      stats.byStatus[status] = (stats.byStatus[status] || 0) + 1
      stats.byProject[project] = (stats.byProject[project] || 0) + 1
      stats.byPriority[priority] = (stats.byPriority[priority] || 0) + 1
      stats.byType[type] = (stats.byType[type] || 0) + 1
    })
    
    return stats
  }, [allIssues])
  
  return {
    snapshots,
    currentQuarter,
    allIssues,
    isLoading: isLoading || fetchingSnapshots,
    error,
    downloadProgress,
    refetchData,
    cancelDownloads,
    getFilteredIssues,
    getIssueStats,
    totalRecords: allIssues.length
  }
}