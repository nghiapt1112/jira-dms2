/**
 * Shared Bug Utilities - Following DRY Principle
 * Consolidates bug-related logic to avoid code duplication
 */

import { parseSeverity } from '../../../shared/utils/severityParser.js'
import { getWeekFromDate, getTimePeriodKey } from '../../../shared/utils/timeUtils.js'
import { JIRA_CONSTANTS } from '../../../constants/jiraConstants'
import { mapBugTypeToCategory } from '../../../constants/memberConfiguration'
import { categorizeBugStatus } from '../../../shared/utils/bugCategorization.js'

/**
 * Bug Field Extractors - Single Responsibility: Extract bug field values
 */
export const bugExtractors = {
  /**
   * Extract bug type from issue (moved from developerQualityService.js)
   * @param {Object} issue - JIRA issue
   * @returns {string} Bug type category
   */
  extractBugType: (issue) => {
    const projectKey = issue.fields?.project?.key
    const bugTypeField = issue.fields?.[JIRA_CONSTANTS.CUSTOM_FIELDS.BUG_TYPE]
    
    if (!bugTypeField) return 'Unknown'
    
    let rawValue = null
    
    // Handle different field formats
    if (Array.isArray(bugTypeField) && bugTypeField[0]) {
      const firstOption = bugTypeField[0]
      rawValue = firstOption.value || firstOption.name || firstOption
    } else if (typeof bugTypeField === 'object') {
      rawValue = bugTypeField.value || bugTypeField.name
    } else {
      rawValue = bugTypeField
    }
    
    // Use existing mapping function
    return mapBugTypeToCategory(rawValue, projectKey)
  },
  
  /**
   * Extract root cause from issue (moved from developerQualityService.js)
   * @param {Object} issue - JIRA issue
   * @returns {string} Root cause
   */
  extractRootCause: (issue) => {
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
  },
  
  /**
   * Extract all bug metadata in one pass (DRY - single extraction)
   * @param {Object} issue - JIRA issue
   * @returns {Object} Complete bug metadata
   */
  extractBugMetadata: (issue) => {
    const projectKey = issue.fields?.project?.key
    
    return {
      projectKey,
      bugType: bugExtractors.extractBugType(issue),
      rootCause: bugExtractors.extractRootCause(issue),
      severity: parseSeverity(issue, projectKey).severity,
      status: issue.fields?.status?.name,
      statusCategory: categorizeBugStatus(issue.fields?.status?.name),
      created: issue.fields?.created,
      resolved: issue.fields?.resolutiondate,
      updated: issue.fields?.updated,
      timeSpentHours: (issue.fields?.timespent || 0) / 3600,
      issueKey: issue.key
    }
  }
}

/**
 * Bug Aggregators - Single Responsibility: Aggregate bug statistics
 */
export const bugAggregators = {
  /**
   * Generic field aggregator (Open/Closed - extensible for any field)
   * @param {Array} items - Items to aggregate
   * @param {Function} fieldExtractor - Function to extract field value
   * @returns {Object} Aggregated counts by field value
   */
  aggregateByField: (items, fieldExtractor) => {
    const aggregation = {}
    
    items.forEach(item => {
      const fieldValue = fieldExtractor(item)
      aggregation[fieldValue] = (aggregation[fieldValue] || 0) + 1
    })
    
    return aggregation
  },
  
  /**
   * Initialize period statistics structure
   * @returns {Object} Empty period stats
   */
  initializePeriodStats: () => ({
    // Basic counts
    created: 0,
    resolved: 0,
    new: 0,
    inProgress: 0,
    notFix: 0,
    
    // Aggregations (will be populated dynamically)
    // Bug types, root causes, severities added as encountered
    
    // Metrics
    totalTimeSpentHours: 0,
    resolutionTimes: [],
    reopenedCount: 0,
    overdueCount: 0
  }),
  
  /**
   * Update period statistics with bug data
   * @param {Object} periodStats - Period statistics to update
   * @param {Object} bugMetadata - Bug metadata from extractBugMetadata
   */
  updatePeriodStats: (periodStats, bugMetadata) => {
    // Update basic counts
    periodStats.created++
    
    // Update status counts
    switch (bugMetadata.statusCategory) {
      case 'new':
        periodStats.new++
        break
      case 'inProgress':
        periodStats.inProgress++
        break
      case 'resolved':
        periodStats.resolved++
        if (bugMetadata.resolved && bugMetadata.created) {
          const resolutionHours = (new Date(bugMetadata.resolved) - new Date(bugMetadata.created)) / (1000 * 60 * 60)
          periodStats.resolutionTimes.push(resolutionHours)
        }
        break
      case 'notFix':
        periodStats.notFix++
        break
    }
    
    // Update dynamic fields (bug type, root cause, severity)
    periodStats[bugMetadata.bugType] = (periodStats[bugMetadata.bugType] || 0) + 1
    periodStats[bugMetadata.rootCause.replace(/\s+/g, '')] = (periodStats[bugMetadata.rootCause.replace(/\s+/g, '')] || 0) + 1
    periodStats[bugMetadata.severity] = (periodStats[bugMetadata.severity] || 0) + 1
    
    // Update time tracking
    periodStats.totalTimeSpentHours += bugMetadata.timeSpentHours
  },
  
  /**
   * Finalize period statistics (calculate averages, remove temp data)
   * @param {Object} periodStats - Period statistics to finalize
   */
  finalizePeriodStats: (periodStats) => {
    // Calculate average resolution time
    if (periodStats.resolutionTimes.length > 0) {
      const totalTime = periodStats.resolutionTimes.reduce((sum, time) => sum + time, 0)
      periodStats.avgResolutionTimeHours = Math.round(totalTime / periodStats.resolutionTimes.length * 10) / 10
    } else {
      periodStats.avgResolutionTimeHours = 0
    }
    
    // Calculate reopen rate
    periodStats.reopenRate = periodStats.resolved > 0 ? 
      Math.round((periodStats.reopenedCount / periodStats.resolved) * 1000) / 10 : 0
    
    // Calculate average time per bug
    periodStats.avgTimePerBug = periodStats.created > 0 ?
      Math.round(periodStats.totalTimeSpentHours / periodStats.created * 10) / 10 : 0
    
    // Remove temporary arrays
    delete periodStats.resolutionTimes
    
    // Add metadata
    periodStats.lastUpdated = new Date().toISOString()
  }
}

/**
 * Bug Processing Utilities - Orchestration helpers
 */
export const bugProcessingUtils = {
  /**
   * Determine relevant date based on bug status
   * @param {Object} bugMetadata - Bug metadata
   * @returns {string|null} Relevant date
   */
  getRelevantDateForBug: (bugMetadata) => {
    if (bugMetadata.statusCategory === 'resolved' && bugMetadata.resolved) {
      return bugMetadata.resolved
    } else if (bugMetadata.updated) {
      return bugMetadata.updated
    } else {
      return bugMetadata.created
    }
  },
  
  /**
   * Check if bug was reopened
   * @param {string} status - Bug status
   * @param {string} resolution - Bug resolution
   * @returns {boolean} True if reopened
   */
  isReopened: (status, resolution) => {
    const lowerStatus = (status || '').toLowerCase()
    return lowerStatus.includes('reopen') || 
      (lowerStatus.includes('open') && resolution)
  },
  
  /**
   * Process bug for analysis (main orchestration)
   * @param {Object} issue - JIRA issue
   * @param {Object} analysisData - Analysis data structure
   */
  processBugForAnalysis: (issue, analysisData) => {
    // Extract metadata once (DRY)
    const metadata = bugExtractors.extractBugMetadata(issue)
    
    if (!metadata.projectKey) return
    
    // Initialize project if needed
    if (!analysisData[metadata.projectKey]) {
      analysisData[metadata.projectKey] = {
        week: {},
        month: {}
      }
    }
    
    // Get relevant date
    const relevantDate = bugProcessingUtils.getRelevantDateForBug(metadata)
    if (!relevantDate) return
    
    // Process for different time periods
    const weekKey = getWeekFromDate(relevantDate)
    const monthKey = relevantDate.substring(0, 7)
    
    // Update week stats
    if (!analysisData[metadata.projectKey].week[weekKey]) {
      analysisData[metadata.projectKey].week[weekKey] = bugAggregators.initializePeriodStats()
    }
    bugAggregators.updatePeriodStats(
      analysisData[metadata.projectKey].week[weekKey],
      metadata
    )
    
    // Update month stats
    if (!analysisData[metadata.projectKey].month[monthKey]) {
      analysisData[metadata.projectKey].month[monthKey] = bugAggregators.initializePeriodStats()
    }
    bugAggregators.updatePeriodStats(
      analysisData[metadata.projectKey].month[monthKey],
      metadata
    )
  }
}

/**
 * Chart Data Processors - Single Responsibility: Transform data for charts
 */
export const chartDataProcessors = {
  /**
   * Process time series data for line charts
   * @param {Object} periodData - Period data object
   * @param {string} metric - Metric to extract (created, resolved)
   * @returns {Object} Chart-ready data
   */
  processTimeSeriesData: (periodData, metric) => {
    const periods = Object.keys(periodData).sort()
    return {
      labels: periods,
      values: periods.map(period => periodData[period][metric] || 0)
    }
  },
  
  /**
   * Process distribution data for pie/bar charts
   * @param {Object} aggregatedData - Aggregated counts
   * @param {Array} categories - Categories to include
   * @param {Array} colors - Colors for each category
   * @returns {Object} Chart-ready data
   */
  processDistributionData: (aggregatedData, categories, colors) => {
    return {
      labels: categories,
      data: categories.map(cat => aggregatedData[cat] || 0),
      colors: colors || categories.map(() => '#' + Math.floor(Math.random()*16777215).toString(16))
    }
  }
}