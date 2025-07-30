/**
 * Bug Analysis Service - Sample Implementation
 * Generates detailed bug analysis JSON for projects
 */

import { parseSeverity } from '../../../shared/utils/severityParser.js'
import { getWeekFromDate } from '../../../shared/utils/timeUtils.js'
import { JIRA_CONSTANTS } from '../../../constants/jiraConstants'
import { mapBugTypeToCategory } from '../../../constants/memberConfiguration'

// Helper to extract bug type
const extractBugType = (issue) => {
  const projectKey = issue.fields?.project?.key
  const bugTypeField = issue.fields?.[JIRA_CONSTANTS.CUSTOM_FIELDS.BUG_TYPE]
  
  if (!bugTypeField) return 'Unknown'
  
  let rawValue = null
  
  // Handle different field formats
  if (Array.isArray(bugTypeField) && bugTypeField[0]) {
    rawValue = bugTypeField[0].value || bugTypeField[0].name || bugTypeField[0]
  } else if (typeof bugTypeField === 'object') {
    rawValue = bugTypeField.value || bugTypeField.name
  } else {
    rawValue = bugTypeField
  }
  
  // Map to standard category
  return mapBugTypeToCategory(rawValue, projectKey)
}

// Helper to extract root cause
const extractRootCause = (issue) => {
  const rootCauseField = issue.fields?.[JIRA_CONSTANTS.CUSTOM_FIELDS.ROOT_CAUSE]
  
  if (!rootCauseField) return 'Unknown'
  
  // Handle array field
  if (Array.isArray(rootCauseField) && rootCauseField[0]) {
    const firstCause = rootCauseField[0]
    return typeof firstCause === 'object' ? 
      (firstCause.value || firstCause.name || 'Unknown') : 
      firstCause
  }
  
  return 'Unknown'
}

// Categorize bug status
const categorizeBugStatus = (status) => {
  if (!status) return 'unknown'
  
  const lowerStatus = status.toLowerCase()
  
  if (lowerStatus.includes('open') || lowerStatus.includes('new')) return 'new'
  if (lowerStatus.includes('progress') || lowerStatus.includes('review')) return 'inProgress'
  if (lowerStatus.includes('resolved') || lowerStatus.includes('done') || lowerStatus.includes('closed')) return 'resolved'
  if (lowerStatus.includes('fix') && lowerStatus.includes('not')) return 'notFix'
  
  return 'other'
}

// Check if bug was reopened
const checkIfReopened = (issue) => {
  const status = issue.fields?.status?.name?.toLowerCase() || ''
  const resolution = issue.fields?.resolution?.name?.toLowerCase() || ''
  
  return status.includes('reopen') || 
    (status.includes('open') && resolution !== '')
}

// Calculate resolution time in hours
const calculateResolutionTime = (issue) => {
  const created = issue.fields?.created
  const resolved = issue.fields?.resolutiondate
  
  if (!created || !resolved) return 0
  
  const createdDate = new Date(created)
  const resolvedDate = new Date(resolved)
  
  const diffMs = resolvedDate - createdDate
  return Math.round(diffMs / (1000 * 60 * 60)) // Convert to hours
}

// Initialize period data structure
const initializePeriodData = () => ({
  // Basic counts
  created: 0,
  resolved: 0,
  new: 0,
  inProgress: 0,
  notFix: 0,
  
  // Bug types (will be dynamically added)
  // Functional: 0,
  
  // Root causes (will be dynamically added)  
  // CodeError: 0,
  
  // Severities (will be dynamically added)
  // Critical: 0,
  
  // Resolution metrics
  resolutionTimes: [],
  reopenedCount: 0,
  overdueCount: 0,
  
  // Time tracking
  totalTimeSpentHours: 0,
  bugCount: 0,
  
  // Period metadata
  periodStart: null,
  periodEnd: null,
  lastUpdated: new Date().toISOString()
})

// Update period data with bug information
const updatePeriodData = (periodMap, periodKey, bugData, periodType) => {
  // Initialize period if not exists
  if (!periodMap[periodKey]) {
    periodMap[periodKey] = initializePeriodData()
    
    // Set period dates
    if (periodType === 'week') {
      // Parse week format "2025-W01"
      const [year, week] = periodKey.split('-W')
      // Calculate start/end dates (simplified)
      periodMap[periodKey].periodStart = `${year}-01-01` // Simplified
      periodMap[periodKey].periodEnd = `${year}-01-07`   // Simplified
    } else {
      // Month format "2025-01"
      periodMap[periodKey].periodStart = `${periodKey}-01`
      periodMap[periodKey].periodEnd = `${periodKey}-31` // Simplified
    }
  }
  
  const period = periodMap[periodKey]
  
  // Update basic counts based on status
  period.created++
  period.bugCount++
  
  switch (bugData.statusCategory) {
    case 'new':
      period.new++
      break
    case 'inProgress':
      period.inProgress++
      break
    case 'resolved':
      period.resolved++
      if (bugData.resolutionTimeHours > 0) {
        period.resolutionTimes.push(bugData.resolutionTimeHours)
      }
      break
    case 'notFix':
      period.notFix++
      break
  }
  
  // Update bug type count
  const bugTypeKey = bugData.bugType
  period[bugTypeKey] = (period[bugTypeKey] || 0) + 1
  
  // Update root cause count
  const rootCauseKey = bugData.rootCause.replace(/\s+/g, '')
  period[rootCauseKey] = (period[rootCauseKey] || 0) + 1
  
  // Update severity count
  const severityKey = bugData.severity
  period[severityKey] = (period[severityKey] || 0) + 1
  
  // Update resolution metrics
  if (bugData.isReopened) {
    period.reopenedCount++
  }
  
  if (bugData.isOverdue) {
    period.overdueCount++
  }
  
  // Update time tracking
  if (bugData.timeSpentHours > 0) {
    period.totalTimeSpentHours += bugData.timeSpentHours
  }
  
  // Update timestamp
  period.lastUpdated = new Date().toISOString()
}

// Finalize period calculations
const finalizePeriodData = (periodMap) => {
  Object.values(periodMap).forEach(period => {
    // Calculate average resolution time
    if (period.resolutionTimes.length > 0) {
      const totalTime = period.resolutionTimes.reduce((sum, time) => sum + time, 0)
      period.avgResolutionTimeHours = Math.round(totalTime / period.resolutionTimes.length * 10) / 10
    } else {
      period.avgResolutionTimeHours = 0
    }
    
    // Calculate reopen rate
    period.reopenRate = period.resolved > 0 ? 
      Math.round((period.reopenedCount / period.resolved) * 1000) / 10 : 0
    
    // Calculate average time per bug
    period.avgTimePerBug = period.bugCount > 0 ?
      Math.round(period.totalTimeSpentHours / period.bugCount * 10) / 10 : 0
    
    // Remove temporary arrays
    delete period.resolutionTimes
    delete period.bugCount
  })
}

// Main service
export const bugAnalysisService = {
  /**
   * Generate bug analysis data for filtered projects
   */
  generateProjectBugAnalysis: (issues, projectFilter = []) => {
    const analysis = {}
    
    // Filter to bug issues only
    const bugIssues = issues.filter(issue => 
      issue.fields?.issuetype?.name === 'Bug'
    )
    
    console.log(`Processing ${bugIssues.length} bug issues`)
    
    // Process each bug
    bugIssues.forEach(issue => {
      const projectKey = issue.fields?.project?.key
      
      // Skip if project not in filter (when filter is applied)
      if (projectFilter.length > 0 && !projectFilter.includes(projectKey)) {
        return
      }
      
      // Initialize project structure
      if (!analysis[projectKey]) {
        analysis[projectKey] = {
          week: {},
          month: {}
        }
      }
      
      // Extract bug metadata
      const bugData = {
        bugType: extractBugType(issue),
        rootCause: extractRootCause(issue),
        severity: parseSeverity(issue, projectKey).severity,
        statusCategory: categorizeBugStatus(issue.fields?.status?.name),
        created: issue.fields?.created,
        resolved: issue.fields?.resolutiondate,
        updated: issue.fields?.updated,
        timeSpentHours: (issue.fields?.timespent || 0) / 3600, // Convert seconds to hours
        isReopened: checkIfReopened(issue),
        resolutionTimeHours: calculateResolutionTime(issue),
        isOverdue: false // Simplified for now
      }
      
      // Determine relevant date based on status
      let relevantDate = bugData.created
      if (bugData.statusCategory === 'resolved' && bugData.resolved) {
        relevantDate = bugData.resolved
      } else if (bugData.updated) {
        relevantDate = bugData.updated
      }
      
      if (!relevantDate) return
      
      // Process for week
      const weekKey = getWeekFromDate(relevantDate)
      updatePeriodData(analysis[projectKey].week, weekKey, bugData, 'week')
      
      // Process for month
      const monthKey = relevantDate.substring(0, 7)
      updatePeriodData(analysis[projectKey].month, monthKey, bugData, 'month')
    })
    
    // Finalize calculations for all projects
    Object.values(analysis).forEach(projectData => {
      finalizePeriodData(projectData.week)
      finalizePeriodData(projectData.month)
    })
    
    return analysis
  },
  
  /**
   * Get summary statistics for the analysis
   */
  getAnalysisSummary: (analysis) => {
    const summary = {
      totalProjects: Object.keys(analysis).length,
      totalBugs: 0,
      projectStats: {}
    }
    
    Object.entries(analysis).forEach(([projectKey, data]) => {
      let projectBugCount = 0
      
      // Count bugs from monthly data (to avoid double counting)
      Object.values(data.month).forEach(monthData => {
        projectBugCount += monthData.created
      })
      
      summary.projectStats[projectKey] = {
        totalBugs: projectBugCount,
        monthsCovered: Object.keys(data.month).length,
        weeksCovered: Object.keys(data.week).length
      }
      
      summary.totalBugs += projectBugCount
    })
    
    return summary
  }
}

// Example usage:
/*
const { data, filters } = useDeveloperQualityStore()
const bugAnalysis = bugAnalysisService.generateProjectBugAnalysis(
  data.minimalIssues,
  filters.projects
)
console.log('Bug Analysis:', bugAnalysis)
console.log('Summary:', bugAnalysisService.getAnalysisSummary(bugAnalysis))
*/