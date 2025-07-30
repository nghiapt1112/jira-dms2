/**
 * Implementation Example - Following DRY & SOLID Principles
 * Shows how to use shared utilities in actual implementation
 */

// In developerQualityService.js - Modified to use shared utilities
import { 
  bugExtractors, 
  bugAggregators, 
  bugProcessingUtils 
} from '../../../shared/utils/bugUtilities'

// Don't duplicate - reuse existing imports
import { parseSeverity } from '../../../shared/utils/severityParser'
import { developerQualityIndexedDB } from './developerQualityIndexedDB'

/**
 * Modified processJiraIssuesForDeveloperQuality
 * Now uses shared utilities instead of duplicating logic
 */
export const processJiraIssuesForDeveloperQuality = async (issues) => {
  const developerQualityData = {
    // Existing structure...
    metrics: initializeMetrics(),
    chartData: initializeChartData(),
    indices: initializeIndices(),
    bugAnalysis: {} // Add bug analysis
  }
  
  // Single loop processing - DRY principle
  issues.forEach((issue, index) => {
    // Existing processing...
    processDeveloperQualityMetrics(issue, index, developerQualityData)
    buildFilterIndices(issue, index, developerQualityData.indices)
    
    // NEW: Process bug analysis using shared utilities
    if (issue.fields?.issuetype?.name === 'Bug') {
      // Don't duplicate extraction logic - use shared utility
      bugProcessingUtils.processBugForAnalysis(issue, developerQualityData.bugAnalysis)
    }
  })
  
  // Finalize bug analysis using shared aggregator
  Object.values(developerQualityData.bugAnalysis).forEach(projectData => {
    Object.values(projectData.week).forEach(weekStats => {
      bugAggregators.finalizePeriodStats(weekStats)
    })
    Object.values(projectData.month).forEach(monthStats => {
      bugAggregators.finalizePeriodStats(monthStats)
    })
  })
  
  // Save to cache - single responsibility
  await developerQualityIndexedDB.saveBugAnalysis(developerQualityData.bugAnalysis)
  
  return developerQualityData
}

// Remove duplicate methods - now using shared utilities
// REMOVED: extractBugType (use bugExtractors.extractBugType)
// REMOVED: extractRootCause (use bugExtractors.extractRootCause)

/**
 * In BugAnalysisPanel.jsx - Using shared components
 */
import React, { useState, useEffect, useMemo } from 'react'
import { 
  BaseChart,
  TimeSeriesChart,
  DistributionChart,
  ComparisonChart,
  SummaryCard,
  ChartContainer
} from '../components/charts/BaseChartComponents'
import { chartDataProcessors } from '../../../shared/utils/bugUtilities'
import { Bug, CheckCircle, Clock, Percent } from 'lucide-react'

export const BugAnalysisPanel = ({ projects = [], timeframe = 'week' }) => {
  const [bugData, setBugData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  
  // Load from cache - separation of concerns
  useEffect(() => {
    developerQualityIndexedDB.getBugAnalysis()
      .then(setBugData)
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [])
  
  // Process data for charts using shared processors
  const chartData = useMemo(() => {
    if (!bugData) return null
    
    // Filter by projects
    const filteredData = projects.length > 0
      ? Object.fromEntries(
          Object.entries(bugData).filter(([key]) => projects.includes(key))
        )
      : bugData
    
    // Aggregate across projects
    const aggregated = aggregateProjectData(filteredData, timeframe)
    
    // Use shared processors for chart data
    return {
      timeSeries: {
        labels: Object.keys(aggregated.periods).sort(),
        created: chartDataProcessors.processTimeSeriesData(aggregated.periods, 'created'),
        resolved: chartDataProcessors.processTimeSeriesData(aggregated.periods, 'resolved')
      },
      bugTypes: chartDataProcessors.processDistributionData(
        aggregated.bugTypes,
        ['Functional', 'UI', 'Performance', 'Security', 'Integration'],
        ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
      ),
      rootCauses: chartDataProcessors.processDistributionData(
        aggregated.rootCauses,
        ['CodeError', 'DesignIssue', 'Configuration', 'DataIssue', 'RequirementGap'],
        ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6']
      ),
      status: chartDataProcessors.processDistributionData(
        aggregated.status,
        ['Resolved', 'In Progress', 'New', 'Not Fix'],
        ['#10b981', '#f59e0b', '#3b82f6', '#ef4444']
      )
    }
  }, [bugData, projects, timeframe])
  
  if (isLoading) return <LoadingState />
  if (!chartData) return <EmptyState message="No bug data available" />
  
  // Calculate summary stats
  const summary = calculateSummaryStats(chartData)
  
  return (
    <div className="space-y-6">
      {/* Summary Cards - Reusable components */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard icon={Bug} label="Total Bugs" value={summary.totalBugs} color="blue" />
        <SummaryCard icon={CheckCircle} label="Resolved" value={summary.resolved} color="green" />
        <SummaryCard icon={Clock} label="In Progress" value={summary.inProgress} color="orange" />
        <SummaryCard icon={Percent} label="Resolution Rate" value={`${summary.resolutionRate}%`} color="purple" />
      </div>
      
      {/* Charts - Using reusable components */}
      <ChartContainer columns={2}>
        <TimeSeriesChart
          title="Bugs Created vs Resolved"
          subtitle={`${timeframe}ly trend`}
          data={chartData.timeSeries}
          datasets={[
            { label: 'Created', data: chartData.timeSeries.created.values, color: '#ef4444' },
            { label: 'Resolved', data: chartData.timeSeries.resolved.values, color: '#10b981' }
          ]}
        />
        
        <DistributionChart
          title="Bug Status Distribution"
          subtitle="Current status breakdown"
          data={chartData.status}
        />
        
        <DistributionChart
          title="Bug Type Distribution"
          subtitle="Types from customfield_10271"
          data={chartData.bugTypes}
        />
        
        <ComparisonChart
          title="Root Cause Analysis"
          subtitle="From customfield_10272"
          data={chartData.rootCauses}
        />
      </ChartContainer>
    </div>
  )
}

/**
 * Helper function using shared aggregators
 */
const aggregateProjectData = (projectData, timeframe) => {
  const aggregated = {
    periods: {},
    bugTypes: {},
    rootCauses: {},
    status: { resolved: 0, inProgress: 0, new: 0, notFix: 0 }
  }
  
  Object.values(projectData).forEach(project => {
    const periods = project[timeframe] || {}
    
    Object.entries(periods).forEach(([periodKey, stats]) => {
      if (!aggregated.periods[periodKey]) {
        aggregated.periods[periodKey] = { created: 0, resolved: 0 }
      }
      
      aggregated.periods[periodKey].created += stats.created || 0
      aggregated.periods[periodKey].resolved += stats.resolved || 0
      
      // Aggregate bug types using shared logic
      ['Functional', 'UI', 'Performance', 'Security', 'Integration'].forEach(type => {
        aggregated.bugTypes[type] = (aggregated.bugTypes[type] || 0) + (stats[type] || 0)
      })
      
      // Aggregate status
      aggregated.status.resolved += stats.resolved || 0
      aggregated.status.inProgress += stats.inProgress || 0
      aggregated.status.new += stats.new || 0
      aggregated.status.notFix += stats.notFix || 0
    })
  })
  
  return aggregated
}