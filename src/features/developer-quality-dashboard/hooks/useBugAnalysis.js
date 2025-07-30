/**
 * Custom Hook for Bug Analysis Data
 * Provides filtered bug analysis data with centralized preprocessing
 * Follows caching strategy: process data once, provide chart-ready data
 */

import { useMemo, useEffect } from 'react'
import { useDeveloperQualityStore } from '../store/developerQualityStore'
import { preprocessBugAnalysisData, transformForChartJs } from '../services/bugAnalysisChartDataService'

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
  
  // CACHING STRATEGY: Process data once with centralized service
  const preprocessedData = useMemo(() => {
    if (!filteredBugAnalysis) return null
    return preprocessBugAnalysisData(filteredBugAnalysis, timeframe)
  }, [filteredBugAnalysis, timeframe])
  
  // Pre-processed chart data for Chart.js (memoized for performance)
  const chartData = useMemo(() => {
    if (!preprocessedData) return null
    
    return {
      lineChart: transformForChartJs(preprocessedData, 'line'),
      statusPie: transformForChartJs(preprocessedData, 'statusPie'),
      typePie: transformForChartJs(preprocessedData, 'typePie'), 
      rootCauseBar: transformForChartJs(preprocessedData, 'rootCauseBar')
    }
  }, [preprocessedData])
  
  // Enhanced summary with resolution rate calculation
  const summary = useMemo(() => {
    if (!preprocessedData) return null
    
    const { summary: baseSummary } = preprocessedData
    
    return {
      ...baseSummary,
      resolutionRate: baseSummary.totalCreated > 0 ? 
        Math.round((baseSummary.totalResolved / baseSummary.totalCreated) * 100) : 0
    }
  }, [preprocessedData])
  
  return {
    // Raw data (for backwards compatibility)
    bugAnalysis: filteredBugAnalysis,
    
    // Pre-processed chart data (NEW - follows caching strategy)
    chartData,
    
    // Summary statistics
    summary,
    
    // Loading states
    isLoading: bugAnalysisLoading,
    error: bugAnalysisError,
    reload: loadBugAnalysis
  }
}