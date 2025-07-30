/**
 * Bug Analysis - JSON Processing Functions Only
 * No UI components - just the data processing logic
 */

import { parseSeverity } from '../../../shared/utils/severityParser.js'
import { getWeekFromDate } from '../../../shared/utils/timeUtils.js'
import { JIRA_CONSTANTS } from '../../../constants/jiraConstants'
import { mapBugTypeToCategory } from '../../../constants/memberConfiguration'

/**
 * Add to developerQualityService.js main processing loop
 */
export const bugAnalysisProcessors = {
  /**
   * Process bug for JSON analysis - ADD TO MAIN LOOP
   * @param {Object} issue - JIRA issue
   * @param {Object} bugAnalysisData - Bug analysis JSON structure
   */
  processBugForAnalysis: (issue, bugAnalysisData) => {
    // Only process Bug type issues
    if (issue.fields?.issuetype?.name !== 'Bug') return
    
    const projectKey = issue.fields?.project?.key
    if (!projectKey) return
    
    // Initialize project structure if needed
    if (!bugAnalysisData[projectKey]) {
      bugAnalysisData[projectKey] = {
        week: {},
        month: {}
      }
    }
    
    // Extract bug metadata (reuse existing functions)
    const bugData = {
      bugType: extractBugType(issue),
      rootCause: extractRootCause(issue),
      severity: parseSeverity(issue, projectKey).severity,
      status: issue.fields?.status?.name,
      created: issue.fields?.created,
      resolved: issue.fields?.resolutiondate,
      timeSpent: issue.fields?.timespent || 0
    }
    
    // Determine relevant date based on status
    const relevantDate = getRelevantDate(bugData)
    if (!relevantDate) return
    
    // Process for both week and month
    const weekKey = getWeekFromDate(relevantDate)
    const monthKey = relevantDate.substring(0, 7)
    
    // Update week data
    updatePeriodData(bugAnalysisData[projectKey].week, weekKey, bugData, 'week')
    
    // Update month data  
    updatePeriodData(bugAnalysisData[projectKey].month, monthKey, bugData, 'month')
  },
  
  /**
   * Finalize bug analysis JSON after processing all issues
   * @param {Object} bugAnalysisData - Bug analysis JSON structure
   */
  finalizeBugAnalysis: (bugAnalysisData) => {
    Object.values(bugAnalysisData).forEach(projectData => {
      // Finalize week data
      Object.values(projectData.week).forEach(weekStats => {
        calculateFinalMetrics(weekStats)
      })
      
      // Finalize month data
      Object.values(projectData.month).forEach(monthStats => {
        calculateFinalMetrics(monthStats)
      })
    })
  }
}

/**
 * Extract bug type (reuse from existing developerQualityService.js)
 */
function extractBugType(issue) {
  const projectKey = issue.fields?.project?.key
  const bugTypeField = issue.fields?.[JIRA_CONSTANTS.CUSTOM_FIELDS.BUG_TYPE]
  
  if (!bugTypeField) return 'Unknown'
  
  let rawValue = null
  
  if (Array.isArray(bugTypeField) && bugTypeField[0]) {
    const firstOption = bugTypeField[0]
    rawValue = firstOption.value || firstOption.name || firstOption
  } else if (typeof bugTypeField === 'object') {
    rawValue = bugTypeField.value || bugTypeField.name
  } else {
    rawValue = bugTypeField
  }
  
  return mapBugTypeToCategory(rawValue, projectKey)
}

/**
 * Extract root cause (reuse from existing developerQualityService.js)
 */
function extractRootCause(issue) {
  const rootCauseField = issue.fields?.[JIRA_CONSTANTS.CUSTOM_FIELDS.ROOT_CAUSE]
  
  if (!rootCauseField || !Array.isArray(rootCauseField) || rootCauseField.length === 0) {
    return 'Unknown'
  }
  
  const firstRootCause = rootCauseField[0]
  
  if (typeof firstRootCause === 'string') {
    return firstRootCause
  } else if (firstRootCause && typeof firstRootCause === 'object' && firstRootCause.value) {
    return firstRootCause.value
  }
  
  return 'Unknown'
}

/**
 * Get relevant date based on bug data
 */
function getRelevantDate(bugData) {
  if (bugData.status?.toLowerCase().includes('resolved') && bugData.resolved) {
    return bugData.resolved
  } else if (bugData.created) {
    return bugData.created
  }
  return null
}

/**
 * Initialize period statistics
 */
function initializePeriodStats() {
  return {
    // Basic counts
    created: 0,
    resolved: 0,
    new: 0,
    inProgress: 0,
    notFix: 0,
    
    // Dynamic fields (added as encountered)
    // Bug types: Functional, UI, Performance, etc.
    // Root causes: CodeError, DesignIssue, etc.
    // Severities: Critical, Major, Minor, Trivial
    
    // Metrics
    totalTimeSpentHours: 0,
    resolutionTimes: [], // Temporary - removed in finalize
    reopenedCount: 0,
    overdueCount: 0
  }
}

/**
 * Update period data with bug information
 */
function updatePeriodData(periodMap, periodKey, bugData, periodType) {
  // Initialize period if not exists
  if (!periodMap[periodKey]) {
    periodMap[periodKey] = initializePeriodStats()
    
    // Set period dates
    if (periodType === 'week') {
      const [year, week] = periodKey.split('-W')
      periodMap[periodKey].periodStart = `${year}-01-01` // Simplified
      periodMap[periodKey].periodEnd = `${year}-01-07`
    } else {
      periodMap[periodKey].periodStart = `${periodKey}-01`
      periodMap[periodKey].periodEnd = `${periodKey}-31`
    }
  }
  
  const period = periodMap[periodKey]
  
  // Update basic counts
  period.created++
  
  // Update status counts based on current status
  const status = bugData.status?.toLowerCase() || ''
  if (status.includes('resolved') || status.includes('done')) {
    period.resolved++
    if (bugData.created && bugData.resolved) {
      const resolutionHours = (new Date(bugData.resolved) - new Date(bugData.created)) / (1000 * 60 * 60)
      period.resolutionTimes.push(resolutionHours)
    }
  } else if (status.includes('progress') || status.includes('review')) {
    period.inProgress++
  } else if (status.includes('open') || status.includes('new')) {
    period.new++
  } else if (status.includes('fix') && status.includes('not')) {
    period.notFix++
  }
  
  // Update dynamic fields (no prefixes)
  period[bugData.bugType] = (period[bugData.bugType] || 0) + 1
  period[bugData.rootCause.replace(/\s+/g, '')] = (period[bugData.rootCause.replace(/\s+/g, '')] || 0) + 1
  period[bugData.severity] = (period[bugData.severity] || 0) + 1
  
  // Update metrics
  period.totalTimeSpentHours += (bugData.timeSpent || 0) / 3600 // Convert seconds to hours
  
  // Check for reopened bugs
  if (status.includes('reopen')) {
    period.reopenedCount++
  }
  
  // Update timestamp
  period.lastUpdated = new Date().toISOString()
}

/**
 * Calculate final metrics for a period
 */
function calculateFinalMetrics(periodStats) {
  // Calculate average resolution time
  if (periodStats.resolutionTimes && periodStats.resolutionTimes.length > 0) {
    const totalTime = periodStats.resolutionTimes.reduce((sum, time) => sum + time, 0)
    periodStats.avgResolutionTimeHours = Math.round(totalTime / periodStats.resolutionTimes.length * 10) / 10
  } else {
    periodStats.avgResolutionTimeHours = 0
  }
  
  // Calculate reopen rate
  if (periodStats.resolved > 0) {
    periodStats.reopenRate = Math.round((periodStats.reopenedCount / periodStats.resolved) * 1000) / 10
  } else {
    periodStats.reopenRate = 0
  }
  
  // Calculate average time per bug
  if (periodStats.created > 0) {
    periodStats.avgTimePerBug = Math.round(periodStats.totalTimeSpentHours / periodStats.created * 10) / 10
  } else {
    periodStats.avgTimePerBug = 0
  }
  
  // Remove temporary arrays
  delete periodStats.resolutionTimes
}

/**
 * INTEGRATION EXAMPLE - Add to developerQualityService.js
 */
/*
// In processJiraIssuesForDeveloperQuality function:

const developerQualityData = {
  metrics: initializeMetrics(),
  chartData: initializeChartData(), 
  indices: initializeIndices(),
  // ADD THIS:
  bugAnalysis: {}
}

// In the main processing loop:
issues.forEach((issue, index) => {
  // Existing processing...
  processDeveloperQualityMetrics(issue, index, developerQualityData)
  buildFilterIndices(issue, index, developerQualityData.indices)
  
  // ADD THIS:
  bugAnalysisProcessors.processBugForAnalysis(issue, developerQualityData.bugAnalysis)
})

// After the loop:
bugAnalysisProcessors.finalizeBugAnalysis(developerQualityData.bugAnalysis)

// Cache the JSON:
await developerQualityIndexedDB.saveBugAnalysis(developerQualityData.bugAnalysis)

return developerQualityData
*/