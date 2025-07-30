/**
 * Bug Analysis Processor
 * Generates JSON payload for bug analysis with correct business logic.
 * 
 * Business Logic:
 * 1. created count: Based on created date
 * 2. resolved count: Based on resolutiondate  
 * 3. Status counts (new, inProgress, notFix): Current status of bugs created in that period
 * 4. Bug Type/Root Cause/Severity: Counted based on created date
 * 5. Time periods: Each event counted only in the period where it happened
 */

import { parseSeverity } from '../../../shared/utils/severityParser.js'
import { getWeekFromDate } from '../../../shared/utils/timeUtils.js'
import { JIRA_CONSTANTS } from '../../../constants/jiraConstants'
import { mapBugTypeToCategory, memberConfiguration } from '../../../constants/memberConfiguration'

/**
 * MAIN PROCESSOR - Add to your main processing loop
 */
export const generateBugAnalysisJSON = {
  
  initialize: () => ({}),
  
  /**
   * Process single bug issue - CALL FOR EACH BUG IN MAIN LOOP
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
    
    // BUSINESS LOGIC: Process created event (if has created date)
    if (bugData.created) {
      const createdWeekKey = getWeekFromDate(bugData.created)
      const createdMonthKey = bugData.created.substring(0, 7)
      
      // Add to created counts and status counts
      processCreatedBug(bugAnalysisJSON[projectKey].week, createdWeekKey, bugData, 'week')
      processCreatedBug(bugAnalysisJSON[projectKey].month, createdMonthKey, bugData, 'month')
    }
    
    // BUSINESS LOGIC: Process resolved event (if has resolved date)
    if (bugData.resolved) {
      const resolvedWeekKey = getWeekFromDate(bugData.resolved)
      const resolvedMonthKey = bugData.resolved.substring(0, 7)
      
      // Add to resolved counts and resolution metrics
      processResolvedBug(bugAnalysisJSON[projectKey].week, resolvedWeekKey, bugData, 'week')
      processResolvedBug(bugAnalysisJSON[projectKey].month, resolvedMonthKey, bugData, 'month')
    }
  },
  
  finalize: (bugAnalysisJSON) => {
    Object.values(bugAnalysisJSON).forEach(projectData => {
      Object.values(projectData.week).forEach(calculateFinalMetrics)
      Object.values(projectData.month).forEach(calculateFinalMetrics)
    })
    
    return bugAnalysisJSON
  }
}

/**
 * Extract bug data from JIRA issue
 */
function extractBugData(issue) {
  const projectKey = issue.fields?.project?.key
  
  return {
    projectKey,
    bugType: extractBugType(issue),
    rootCause: extractRootCause(issue),
    severity: parseSeverity(issue, projectKey).severity,
    currentStatus: issue.fields?.status?.name || '',
    statusCategory: categorizeBugStatus(issue.fields?.status?.name),
    created: issue.fields?.created,
    resolved: issue.fields?.resolutiondate,
    timeSpent: issue.fields?.timespent || 0,
    issueKey: issue.key
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
 * Categorize bug status using existing BUG_STATUS_MAPPING
 */
function categorizeBugStatus(statusName) {
  if (!statusName) return 'unknown'
  
  const mapping = memberConfiguration.BUG_STATUS_MAPPING
  
  // Check each category
  if (mapping.resolved.includes(statusName)) return 'resolved'
  if (mapping.notFixed.includes(statusName)) return 'notFix'
  if (mapping.new.includes(statusName)) return 'new'
  if (mapping.inProgress.includes(statusName)) return 'inProgress'
  
  return 'unknown'
}

/**
 * Initialize period statistics
 */
function initializePeriodStats(periodKey, periodType) {
  const stats = {
    // BUSINESS LOGIC: Separate created and resolved events
    created: 0,        // Bugs created in this period
    resolved: 0,       // Bugs resolved in this period
    
    // STATUS COUNTS: Current status of bugs created in this period
    new: 0,
    inProgress: 0,
    notFix: 0,
    
    // METRICS: Will be calculated later
    totalTimeSpentHours: 0,
    reopenedCount: 0,
    overdueCount: 0,
    
    // TEMPORARY DATA: Removed in finalize
    _resolutionTimes: [],
    _createdBugStatuses: [], // Track current status of created bugs
    
    // METADATA
    lastUpdated: new Date().toISOString()
  }
  
  // Set period dates
  if (periodType === 'week') {
    const [year, week] = periodKey.split('-W')
    stats.periodStart = `${year}-01-01` // Simplified - you can improve this
    stats.periodEnd = `${year}-01-07`
  } else {
    stats.periodStart = `${periodKey}-01`
    stats.periodEnd = `${periodKey}-31`
  }
  
  return stats
}

/**
 * Process bug created event - BUSINESS LOGIC: Count created + current status + bug attributes
 */
function processCreatedBug(periodMap, periodKey, bugData, periodType) {
  // Initialize if needed
  if (!periodMap[periodKey]) {
    periodMap[periodKey] = initializePeriodStats(periodKey, periodType)
  }
  
  const stats = periodMap[periodKey]
  
  // BUSINESS LOGIC: Count created event
  stats.created++
  
  // BUSINESS LOGIC: Count current status of bugs created in this period
  switch (bugData.statusCategory) {
    case 'new':
      stats.new++
      break
    case 'inProgress':
      stats.inProgress++
      break
    case 'notFix':
      stats.notFix++
      break
    // Note: 'resolved' status counted separately in processResolvedBug
  }
  
  // BUSINESS LOGIC: Count bug attributes based on created date
  stats[bugData.bugType] = (stats[bugData.bugType] || 0) + 1
  stats[bugData.rootCause.replace(/\s+/g, '')] = (stats[bugData.rootCause.replace(/\s+/g, '')] || 0) + 1
  stats[bugData.severity] = (stats[bugData.severity] || 0) + 1
  
  // Track time spent for bugs created in this period
  stats.totalTimeSpentHours += (bugData.timeSpent / 3600) // Convert seconds to hours
  
  // Check for reopened bugs (simplified - can be enhanced)
  if (bugData.currentStatus.toLowerCase().includes('reopen')) {
    stats.reopenedCount++
  }
  
  // Update timestamp
  stats.lastUpdated = new Date().toISOString()
}

/**
 * Process bug resolved event - BUSINESS LOGIC: Count resolved + resolution metrics
 */
function processResolvedBug(periodMap, periodKey, bugData, periodType) {
  // Initialize if needed
  if (!periodMap[periodKey]) {
    periodMap[periodKey] = initializePeriodStats(periodKey, periodType)
  }
  
  const stats = periodMap[periodKey]
  
  // BUSINESS LOGIC: Count resolved event
  stats.resolved++
  
  // Calculate resolution time for bugs resolved in this period
  if (bugData.created && bugData.resolved) {
    const resolutionHours = (new Date(bugData.resolved) - new Date(bugData.created)) / (1000 * 60 * 60)
    if (resolutionHours >= 0) {
      stats._resolutionTimes.push(resolutionHours)
    }
  }
  
  // Update timestamp
  stats.lastUpdated = new Date().toISOString()
}

/**
 * Calculate final metrics for period
 */
function calculateFinalMetrics(stats) {
  // Average resolution time (only for bugs resolved in this period)
  if (stats._resolutionTimes && stats._resolutionTimes.length > 0) {
    const total = stats._resolutionTimes.reduce((sum, time) => sum + time, 0)
    stats.avgResolutionTimeHours = Math.round(total / stats._resolutionTimes.length * 10) / 10
  } else {
    stats.avgResolutionTimeHours = 0
  }
  
  // Reopen rate (reopened bugs / resolved bugs in this period)
  stats.reopenRate = stats.resolved > 0 ? 
    Math.round((stats.reopenedCount / stats.resolved) * 1000) / 10 : 0
  
  // Average time per bug (for bugs created in this period)
  stats.avgTimePerBug = stats.created > 0 ?
    Math.round(stats.totalTimeSpentHours / stats.created * 10) / 10 : 0
  
  // Remove temporary data
  delete stats._resolutionTimes
  delete stats._createdBugStatuses
}