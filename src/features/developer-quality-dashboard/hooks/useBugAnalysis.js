/**
 * Custom Hook for Bug Analysis Data
 * Provides filtered bug analysis data with project and timeframe filtering
 */

import { useMemo, useEffect } from 'react'
import { useDeveloperQualityStore } from '../store/developerQualityStore'

export const useBugAnalysis = (projects = [], timeframe = 'month') => {
  const { 
    bugAnalysis, 
    bugAnalysisLoading, 
    bugAnalysisError,
    loadBugAnalysis 
  } = useDeveloperQualityStore()
  
  // Auto-load bug analysis when store data is available
  useEffect(() => {
    if (!bugAnalysis && !bugAnalysisLoading) {
      loadBugAnalysis()
    }
  }, [bugAnalysis, bugAnalysisLoading, loadBugAnalysis])
  
  // Filter bug analysis by selected projects
  const filteredBugAnalysis = useMemo(() => {
    if (!bugAnalysis) return null
    
    if (projects.length === 0) {
      return bugAnalysis
    }
    
    return Object.fromEntries(
      Object.entries(bugAnalysis).filter(([projectKey]) => 
        projects.includes(projectKey)
      )
    )
  }, [bugAnalysis, projects])
  
  // Calculate summary statistics
  const summary = useMemo(() => {
    if (!filteredBugAnalysis) return null
    
    let totalCreated = 0
    let totalResolved = 0
    let totalInProgress = 0
    let totalNew = 0
    let totalNotFix = 0
    
    Object.values(filteredBugAnalysis).forEach(projectData => {
      const periods = projectData[timeframe] || {}
      Object.values(periods).forEach(periodData => {
        totalCreated += periodData.created || 0
        totalResolved += periodData.resolved || 0
        totalInProgress += periodData.inProgress || 0
        totalNew += periodData.new || 0
        totalNotFix += periodData.notFix || 0
      })
    })
    
    return {
      totalBugs: totalCreated,
      resolved: totalResolved,
      inProgress: totalInProgress,
      new: totalNew,
      notFix: totalNotFix,
      resolutionRate: totalCreated > 0 ? 
        Math.round((totalResolved / totalCreated) * 100) : 0
    }
  }, [filteredBugAnalysis, timeframe])
  
  return {
    bugAnalysis: filteredBugAnalysis,
    summary,
    isLoading: bugAnalysisLoading,
    error: bugAnalysisError,
    reload: loadBugAnalysis
  }
}