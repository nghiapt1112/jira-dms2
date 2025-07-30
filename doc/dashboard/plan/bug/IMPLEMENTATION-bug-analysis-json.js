/**
 * IMPLEMENTATION: Bug Analysis JSON Payload Generator
 * 
 * This is the ONLY file you need to implement.
 * Generates JSON payload for bug analysis - NO UI components.
 * 
 * Integration: Add these functions to developerQualityService.js
 */

import { parseSeverity } from '../../../shared/utils/severityParser.js'
import { getWeekFromDate } from '../../../shared/utils/timeUtils.js'
import { JIRA_CONSTANTS } from '../../../constants/jiraConstants'
import { mapBugTypeToCategory } from '../../../constants/memberConfiguration'

/**
 * STEP 1: Add to main processing loop in processJiraIssuesForDeveloperQuality()
 */
export const generateBugAnalysisJSON = {
  
  /**
   * Initialize bug analysis structure
   */
  initialize: () => ({}),
  
  /**
   * Process single bug issue - ADD THIS TO YOUR MAIN LOOP
   * @param {Object} issue - JIRA issue
   * @param {Object} bugAnalysisJSON - Bug analysis JSON structure
   */
  processBug: (issue, bugAnalysisJSON) => {
    // Only process Bug type issues
    if (issue.fields?.issuetype?.name !== 'Bug') return
    
    const projectKey = issue.fields?.project?.key
    if (!projectKey) return
    
    // Initialize project structure
    if (!bugAnalysisJSON[projectKey]) {
      bugAnalysisJSON[projectKey] = { week: {}, month: {} }
    }
    
    // Extract bug data using existing utilities
    const bugData = extractBugData(issue)
    
    // Get relevant date
    const relevantDate = getRelevantDate(bugData)
    if (!relevantDate) return
    
    // Process for week and month
    const weekKey = getWeekFromDate(relevantDate)
    const monthKey = relevantDate.substring(0, 7)
    
    updatePeriodStats(bugAnalysisJSON[projectKey].week, weekKey, bugData, 'week')
    updatePeriodStats(bugAnalysisJSON[projectKey].month, monthKey, bugData, 'month')
  },
  
  /**
   * Finalize JSON after processing all issues - CALL THIS AFTER LOOP
   * @param {Object} bugAnalysisJSON - Bug analysis JSON structure
   */
  finalize: (bugAnalysisJSON) => {
    Object.values(bugAnalysisJSON).forEach(projectData => {
      Object.values(projectData.week).forEach(calculateMetrics)
      Object.values(projectData.month).forEach(calculateMetrics)
    })
    
    return bugAnalysisJSON
  }
}

/**
 * Extract bug data from JIRA issue (reusing existing functions)
 */
function extractBugData(issue) {
  const projectKey = issue.fields?.project?.key
  
  return {
    projectKey,
    bugType: extractBugType(issue),
    rootCause: extractRootCause(issue),
    severity: parseSeverity(issue, projectKey).severity,
    status: issue.fields?.status?.name || '',
    created: issue.fields?.created,
    resolved: issue.fields?.resolutiondate,
    timeSpent: issue.fields?.timespent || 0
  }
}

/**
 * Extract bug type (from customfield_10271)
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
 * Extract root cause (from customfield_10272)
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
 * Get relevant date for bug based on status
 */
function getRelevantDate(bugData) {
  const status = bugData.status.toLowerCase()
  
  if ((status.includes('resolved') || status.includes('done')) && bugData.resolved) {
    return bugData.resolved
  }
  
  return bugData.created
}

/**
 * Initialize period statistics
 */
function initializePeriodStats(periodKey, periodType) {
  const stats = {
    // Basic counts
    created: 0,
    resolved: 0,
    new: 0,
    inProgress: 0,
    notFix: 0,
    
    // Metrics (calculated later)
    totalTimeSpentHours: 0,
    reopenedCount: 0,
    overdueCount: 0,
    
    // Temporary data (removed in finalize)
    _resolutionTimes: [],
    
    // Metadata
    lastUpdated: new Date().toISOString()
  }
  
  // Set period dates
  if (periodType === 'week') {
    const [year, week] = periodKey.split('-W')
    stats.periodStart = `${year}-01-01` // Simplified
    stats.periodEnd = `${year}-01-07`
  } else {
    stats.periodStart = `${periodKey}-01`
    stats.periodEnd = `${periodKey}-31`
  }
  
  return stats
}

/**
 * Update period statistics with bug data
 */
function updatePeriodStats(periodMap, periodKey, bugData, periodType) {
  // Initialize if needed
  if (!periodMap[periodKey]) {
    periodMap[periodKey] = initializePeriodStats(periodKey, periodType)
  }
  
  const stats = periodMap[periodKey]
  
  // Update basic counts
  stats.created++
  
  // Update status counts
  const status = bugData.status.toLowerCase()
  if (status.includes('resolved') || status.includes('done')) {
    stats.resolved++
    
    // Track resolution time
    if (bugData.created && bugData.resolved) {
      const resolutionHours = (new Date(bugData.resolved) - new Date(bugData.created)) / (1000 * 60 * 60)
      stats._resolutionTimes.push(resolutionHours)
    }
  } else if (status.includes('progress') || status.includes('review')) {
    stats.inProgress++
  } else if (status.includes('open') || status.includes('new')) {
    stats.new++
  } else if (status.includes('fix') && status.includes('not')) {
    stats.notFix++
  }
  
  // Update dynamic fields (NO PREFIXES - clean format)
  stats[bugData.bugType] = (stats[bugData.bugType] || 0) + 1
  stats[bugData.rootCause.replace(/\s+/g, '')] = (stats[bugData.rootCause.replace(/\s+/g, '')] || 0) + 1
  stats[bugData.severity] = (stats[bugData.severity] || 0) + 1
  
  // Update metrics
  stats.totalTimeSpentHours += (bugData.timeSpent / 3600) // Convert seconds to hours
  
  if (status.includes('reopen')) {
    stats.reopenedCount++
  }
  
  // Update timestamp
  stats.lastUpdated = new Date().toISOString()
}

/**
 * Calculate final metrics for period
 */
function calculateMetrics(stats) {
  // Average resolution time
  if (stats._resolutionTimes && stats._resolutionTimes.length > 0) {
    const total = stats._resolutionTimes.reduce((sum, time) => sum + time, 0)
    stats.avgResolutionTimeHours = Math.round(total / stats._resolutionTimes.length * 10) / 10
  } else {
    stats.avgResolutionTimeHours = 0
  }
  
  // Reopen rate
  stats.reopenRate = stats.resolved > 0 ? 
    Math.round((stats.reopenedCount / stats.resolved) * 1000) / 10 : 0
  
  // Average time per bug
  stats.avgTimePerBug = stats.created > 0 ?
    Math.round(stats.totalTimeSpentHours / stats.created * 10) / 10 : 0
  
  // Remove temporary data
  delete stats._resolutionTimes
}

/**
 * STEP 2: INTEGRATION EXAMPLE
 * 
 * Add this to your developerQualityService.js processJiraIssuesForDeveloperQuality function:
 */

/*
// Initialize bug analysis
const bugAnalysisJSON = generateBugAnalysisJSON.initialize()

// Add to your existing data structure
const developerQualityData = {
  metrics: initializeMetrics(),
  chartData: initializeChartData(),
  indices: initializeIndices(),
  filterOptions: initializeFilterOptions(),
  minimalIssues: [],
  bugAnalysis: bugAnalysisJSON  // ADD THIS
}

// In your main processing loop:
issues.forEach((issue, index) => {
  // Your existing processing...
  processDeveloperQualityMetrics(issue, index, developerQualityData)
  buildFilterIndices(issue, index, developerQualityData.indices)
  
  // ADD THIS LINE:
  generateBugAnalysisJSON.processBug(issue, bugAnalysisJSON)
})

// After the loop, finalize:
const finalBugAnalysisJSON = generateBugAnalysisJSON.finalize(bugAnalysisJSON)

// Cache the JSON:
await developerQualityIndexedDB.saveBugAnalysis(finalBugAnalysisJSON)

// Return with bug analysis included
return {
  ...developerQualityData,
  bugAnalysis: finalBugAnalysisJSON
}
*/

/**
 * STEP 3: CACHE INTEGRATION
 * 
 * Add to developerQualityIndexedDB.js:
 */

/*
// Add to STORES object:
BUG_ANALYSIS: 'bug_analysis'

// Add save method:
async saveBugAnalysis(bugAnalysisData) {
  const db = await this.openDB()
  const tx = db.transaction([STORES.BUG_ANALYSIS], 'readwrite')
  const store = tx.objectStore(STORES.BUG_ANALYSIS)
  
  await store.put({
    id: 'current',
    data: bugAnalysisData,
    timestamp: new Date().toISOString()
  })
  
  await tx.complete
}

// Add load method:
async getBugAnalysis() {
  const db = await this.openDB()
  const tx = db.transaction([STORES.BUG_ANALYSIS], 'readonly')
  const store = tx.objectStore(STORES.BUG_ANALYSIS)
  
  const result = await store.get('current')
  return result?.data || null
}
*/

/**
 * STEP 4: FILTER BY PROJECTS
 * 
 * When you need filtered data (by Filter.projects from Zustand):
 */

/*
const filterBugAnalysisByProjects = (bugAnalysisJSON, selectedProjects) => {
  if (!selectedProjects || selectedProjects.length === 0) {
    return bugAnalysisJSON
  }
  
  return Object.fromEntries(
    Object.entries(bugAnalysisJSON).filter(([projectKey]) => 
      selectedProjects.includes(projectKey)
    )
  )
}

// Usage:
const { filters } = useDeveloperQualityStore()
const allBugData = await developerQualityIndexedDB.getBugAnalysis()
const filteredBugData = filterBugAnalysisByProjects(allBugData, filters.projects)
*/

/**
 * EXPECTED JSON OUTPUT FORMAT:
 * 
 * {
 *   "WON": {
 *     "week": {
 *       "2025-W01": {
 *         "created": 45, "resolved": 38, "new": 12, "inProgress": 15, "notFix": 2,
 *         "Functional": 18, "UI": 12, "Performance": 8, "Security": 2,
 *         "CodeError": 15, "DesignIssue": 10, "Configuration": 7,
 *         "Critical": 3, "Major": 12, "Minor": 25, "Trivial": 5,
 *         "avgResolutionTimeHours": 28.5, "reopenRate": 7.9,
 *         "totalTimeSpentHours": 245.5, "avgTimePerBug": 5.5,
 *         "periodStart": "2025-01-01", "periodEnd": "2025-01-07",
 *         "lastUpdated": "2025-01-07T16:30:00Z"
 *       }
 *     },
 *     "month": {
 *       "2025-01": { ... }
 *     }
 *   },
 *   "YUIM": { ... },
 *   "STU": { ... }
 * }
 */