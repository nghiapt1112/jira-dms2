/**
 * Metric Calculations Utility
 * Helper functions for calculating extended developer quality metrics
 * Following .cursorrules conventions - camelCase naming, performance optimizations
 */

import { getReopenDetectionConfig, getSeverityConfig } from '../../../constants/memberConfiguration.js'

/**
 * Calculate reopen rate based on issue changelog
 * @param {Object} issue - JIRA issue object
 * @param {string} projectKey - Project key for configuration (optional)
 * @returns {Object} Reopen analysis data
 */
export const calculateReopenMetrics = (issue, projectKey = null) => {
  // Only process Bug tickets
  const issueType = issue.fields?.issuetype?.name || issue.issueType
  if (issueType !== 'Bug') {
    return {
      reopenCount: 0,
      isReopened: false,
      lastReopenDate: null,
      hasReopenHistory: false
    }
  }

  const changelog = issue.changelog?.histories || []
  let reopenCount = 0
  let isReopened = false
  let lastReopenDate = null

  // Get configurable reopen detection settings
  const reopenConfig = getReopenDetectionConfig(projectKey)
  const { reopenStatuses, reopenTransitions } = reopenConfig

  // Check for status changes in changelog
  changelog.forEach(history => {
    const statusChanges = history.items?.filter(item => item.field === 'status') || []

    statusChanges.forEach(statusChange => {
      const fromStatus = statusChange.fromString
      const toStatus = statusChange.toString

      // Check for explicit reopen statuses
      if (reopenStatuses.some(status => 
        toStatus?.toLowerCase() === status.toLowerCase()
      )) {
        reopenCount += 1
        isReopened = true
        lastReopenDate = history.created
        return
      }

      // Check for reopen transitions (from closed states back to active)
      reopenTransitions.forEach(transition => {
        const matchesFromStatus = transition.from.some(fromState => 
          fromStatus?.toLowerCase().includes(fromState.toLowerCase())
        )
        const matchesToStatus = transition.to.some(toState => 
          toStatus?.toLowerCase().includes(toState.toLowerCase())
        )

        if (matchesFromStatus && matchesToStatus) {
          reopenCount += 1
          isReopened = true
          lastReopenDate = history.created
        }
      })
    })
  })

  return {
    reopenCount,
    isReopened,
    lastReopenDate,
    hasReopenHistory: reopenCount > 0
  }
}

/**
 * Calculate resolution time metrics
 * @param {Object} issue - JIRA issue object
 * @returns {Object} Resolution time analysis data
 */
export const calculateResolutionTimeMetrics = (issue) => {
  const created = issue.fields?.created
  const resolved = issue.fields?.resolutiondate
  const severity = issue.fields?.priority?.name || 'Unknown'

  if (!created || !resolved) {
    return {
      resolutionTimeHours: null,
      resolutionTimeDays: null,
      isOverdue: false,
      efficiencyScore: null
    }
  }

  const createdDate = new Date(created)
  const resolvedDate = new Date(resolved)
  const timeDiffMs = resolvedDate.getTime() - createdDate.getTime()
  const resolutionTimeHours = timeDiffMs / (1000 * 60 * 60)
  const resolutionTimeDays = timeDiffMs / (1000 * 60 * 60 * 24)

  // Define SLA targets by severity (in hours)
  const slaTargets = {
    'Critical': 4,    // 4 hours
    'High': 24,       // 1 day
    'Medium': 72,     // 3 days
    'Low': 168,       // 1 week
    'Unknown': 72     // Default to 3 days
  }

  const slaTarget = slaTargets[severity] || slaTargets['Unknown']
  const isOverdue = resolutionTimeHours > slaTarget
  
  // Calculate efficiency score (0-100, higher is better)
  const efficiencyScore = Math.max(0, Math.min(100, 
    100 - ((resolutionTimeHours - slaTarget) / slaTarget * 100)
  ))

  return {
    resolutionTimeHours: Math.round(resolutionTimeHours * 100) / 100,
    resolutionTimeDays: Math.round(resolutionTimeDays * 100) / 100,
    isOverdue,
    efficiencyScore: Math.round(efficiencyScore),
    slaTarget
  }
}

/**
 * Extract and categorize root cause from issue
 * Enhanced version of the existing extractRootCause function
 * @param {Object} issue - JIRA issue object
 * @returns {Object} Root cause analysis data
 */
export const extractRootCauseAnalysis = (issue) => {
  // Check if there's a specific root cause field (customfield_10636 as mentioned in docs)
  const rootCauseField = issue.fields?.customfield_10636
  if (rootCauseField && rootCauseField.value) {
    return {
      rootCause: rootCauseField.value,
      confidence: 'high',
      source: 'field'
    }
  }

  // Fallback to text analysis
  const summary = issue.fields?.summary || ''
  const description = issue.fields?.description || ''
  const text = `${summary} ${description}`.toLowerCase()

  // Enhanced keyword matching with confidence scores
  const patterns = [
    { keywords: ['logic', 'algorithm', 'calculation', 'formula'], category: 'Logic Error', confidence: 'medium' },
    { keywords: ['integration', 'api', 'service', 'endpoint'], category: 'Integration Issue', confidence: 'medium' },
    { keywords: ['performance', 'slow', 'timeout', 'memory', 'cpu'], category: 'Performance', confidence: 'medium' },
    { keywords: ['ui', 'ux', 'interface', 'frontend', 'display'], category: 'UI/UX', confidence: 'medium' },
    { keywords: ['data', 'database', 'query', 'sql', 'migration'], category: 'Data Issue', confidence: 'medium' },
    { keywords: ['security', 'vulnerability', 'auth', 'permission'], category: 'Security', confidence: 'medium' },
    { keywords: ['config', 'configuration', 'environment', 'deploy'], category: 'Configuration', confidence: 'medium' },
    { keywords: ['test', 'testing', 'unit test', 'integration test'], category: 'Test Issue', confidence: 'low' }
  ]

  for (const pattern of patterns) {
    if (pattern.keywords.some(keyword => text.includes(keyword))) {
      return {
        rootCause: pattern.category,
        confidence: pattern.confidence,
        source: 'text_analysis'
      }
    }
  }

  return {
    rootCause: 'Unknown',
    confidence: 'low',
    source: 'default'
  }
}

/**
 * Calculate quality trend based on recent issues
 * @param {Array} recentIssues - Array of recent issues for a developer
 * @param {number} timeWindowDays - Number of days to look back (default 30)
 * @returns {Object} Quality trend analysis
 */
export const calculateQualityTrend = (recentIssues, timeWindowDays = 30) => {
  if (!recentIssues || recentIssues.length === 0) {
    return {
      trend: 'stable',
      trendValue: 0,
      trendPercentage: 0,
      dataPoints: []
    }
  }

  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - timeWindowDays)

  // Group issues by week
  const weeklyData = new Map()
  
  recentIssues.forEach(issue => {
    const createdDate = new Date(issue.created)
    if (createdDate >= cutoffDate) {
      const weekKey = getWeekKey(createdDate)
      if (!weeklyData.has(weekKey)) {
        weeklyData.set(weekKey, { total: 0, bugs: 0 })
      }
      const weekData = weeklyData.get(weekKey)
      weekData.total += 1
      if (issue.issueType === 'Bug') {
        weekData.bugs += 1
      }
    }
  })

  // Calculate bug rates for each week
  const dataPoints = Array.from(weeklyData.entries())
    .map(([week, data]) => ({
      week,
      bugRate: data.total > 0 ? (data.bugs / data.total) * 100 : 0,
      total: data.total,
      bugs: data.bugs
    }))
    .sort((a, b) => a.week.localeCompare(b.week))

  if (dataPoints.length < 2) {
    return {
      trend: 'stable',
      trendValue: 0,
      trendPercentage: 0,
      dataPoints
    }
  }

  // Calculate trend using linear regression on bug rates
  const trendValue = calculateLinearTrend(dataPoints.map(d => d.bugRate))
  const firstRate = dataPoints[0].bugRate
  const lastRate = dataPoints[dataPoints.length - 1].bugRate
  
  let trend = 'stable'
  if (trendValue < -1) trend = 'improving'  // Bug rate decreasing is improving
  else if (trendValue > 1) trend = 'declining'  // Bug rate increasing is declining

  const trendPercentage = firstRate > 0 ? ((lastRate - firstRate) / firstRate) * 100 : 0

  return {
    trend,
    trendValue,
    trendPercentage: Math.round(trendPercentage),
    dataPoints
  }
}

/**
 * Calculate time efficiency score based on resolution times
 * @param {Array} resolutionTimes - Array of resolution time objects
 * @returns {number} Efficiency score (0-100)
 */
export const calculateTimeEfficiency = (resolutionTimes) => {
  if (!resolutionTimes || resolutionTimes.length === 0) {
    return 0
  }

  const validTimes = resolutionTimes.filter(t => t.efficiencyScore !== null)
  if (validTimes.length === 0) {
    return 0
  }

  const averageEfficiency = validTimes.reduce((sum, t) => sum + t.efficiencyScore, 0) / validTimes.length
  return Math.round(averageEfficiency)
}

/**
 * Helper function to get week key from date
 * @param {Date} date - Date object
 * @returns {string} Week key in format YYYY-WNN
 */
const getWeekKey = (date) => {
  const year = date.getFullYear()
  const week = Math.ceil((date.getTime() - new Date(year, 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000))
  return `${year}-W${week.toString().padStart(2, '0')}`
}

/**
 * Calculate linear trend using simple linear regression
 * @param {Array} values - Array of numeric values
 * @returns {number} Trend value (positive = increasing, negative = decreasing)
 */
const calculateLinearTrend = (values) => {
  if (values.length < 2) return 0

  const n = values.length
  const x = Array.from({ length: n }, (_, i) => i)
  const y = values

  const sumX = x.reduce((a, b) => a + b, 0)
  const sumY = y.reduce((a, b) => a + b, 0)
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0)
  const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0)

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
  return slope
}

/**
 * Aggregate severity breakdown for multiple issues
 * @param {Array} issues - Array of issues
 * @param {string} projectKey - Project key for configuration (optional)
 * @returns {Object} Severity breakdown object
 */
export const aggregateSeverityBreakdown = (issues, projectKey = null) => {
  // Get configurable severity settings
  const severityConfig = getSeverityConfig(projectKey)
  const { severityField, usePriorityFallback, severityMapping, severityLevels } = severityConfig
  
  // Initialize breakdown with correct severity levels
  const breakdown = {}
  severityLevels.forEach(level => {
    breakdown[level] = 0
  })
  breakdown['Unknown'] = 0

  issues.forEach(issue => {
    let severityValue = null
    
    // Try to get severity from configured custom field
    if (severityField && issue.fields?.[severityField]) {
      const customFieldValue = issue.fields[severityField]
      severityValue = typeof customFieldValue === 'object' ? customFieldValue.value : customFieldValue
    }
    
    // Fallback to priority field if configured and severity field is empty
    if (!severityValue && usePriorityFallback && issue.fields?.priority?.name) {
      severityValue = issue.fields.priority.name
    }
    
    // Map the severity value to standardized levels
    let mappedSeverity = 'Unknown'
    if (severityValue && severityMapping[severityValue]) {
      mappedSeverity = severityMapping[severityValue]
    }
    
    // Increment the count for the mapped severity
    if (Object.prototype.hasOwnProperty.call(breakdown, mappedSeverity)) {
      breakdown[mappedSeverity] += 1
    } else {
      breakdown['Unknown'] += 1
    }
  })

  return breakdown
}

/**
 * Aggregate root cause breakdown for multiple issues
 * @param {Array} issues - Array of issues with root cause analysis
 * @returns {Object} Root cause breakdown object
 */
export const aggregateRootCauseBreakdown = (issues) => {
  const breakdown = {}

  issues.forEach(issue => {
    const rootCauseAnalysis = extractRootCauseAnalysis(issue)
    const rootCause = rootCauseAnalysis.rootCause
    
    if (!breakdown[rootCause]) {
      breakdown[rootCause] = 0
    }
    breakdown[rootCause] += 1
  })

  return breakdown
}

/**
 * Calculate time tracking metrics from issue
 * @param {Object} issue - JIRA issue object
 * @returns {Object} Time tracking analysis data
 */
export const calculateTimeTrackingMetrics = (issue) => {
  const timetracking = issue.fields?.timetracking || {}
  const timeSpentSeconds = timetracking.timeSpentSeconds || 0
  const remainingEstimateSeconds = timetracking.remainingEstimateSeconds || 0
  const originalEstimateSeconds = timetracking.originalEstimateSeconds || 0


  return {
    timeSpentHours: timeSpentSeconds / 3600,
    timeSpentSeconds,
    remainingEstimateHours: remainingEstimateSeconds / 3600,
    originalEstimateHours: originalEstimateSeconds / 3600,
    hasTimeLogged: timeSpentSeconds > 0,
    hasEstimate: originalEstimateSeconds > 0,
    estimationAccuracy: originalEstimateSeconds > 0 ? 
      (timeSpentSeconds / originalEstimateSeconds) * 100 : null
  }
}

/**
 * Aggregate time tracking data by time period
 * @param {Array} issues - Array of issues with time tracking
 * @param {string} timePeriod - 'week' or 'month'
 * @returns {Map} Time tracking data grouped by period
 */
export const aggregateTimeTrackingByPeriod = (issues, timePeriod = 'week') => {
  const aggregated = new Map()
  
  issues.forEach(issue => {
    const created = issue.fields?.created
    if (!created) return
    
    const timeKey = timePeriod === 'week' 
      ? getWeekKey(new Date(created))
      : created.substring(0, 7) // YYYY-MM format
    
    if (!aggregated.has(timeKey)) {
      aggregated.set(timeKey, {
        totalTimeSpent: 0,
        totalStoryPoints: 0,
        issueCount: 0,
        timePerStoryPoint: 0
      })
    }
    
    const periodData = aggregated.get(timeKey)
    const timeMetrics = calculateTimeTrackingMetrics(issue)
    const storyPoints = issue.fields?.customfield_10028 || 0
    
    periodData.totalTimeSpent += timeMetrics.timeSpentHours
    periodData.totalStoryPoints += storyPoints
    periodData.issueCount += 1
    
    if (periodData.totalStoryPoints > 0) {
      periodData.timePerStoryPoint = periodData.totalTimeSpent / periodData.totalStoryPoints
    }
  })
  
  return aggregated
}

/**
 * Calculate time efficiency metrics for a developer
 * @param {Array} timeTrackingData - Array of time tracking objects
 * @returns {Object} Time efficiency analysis
 */
export const calculateDeveloperTimeEfficiency = (timeTrackingData) => {
  if (!timeTrackingData || timeTrackingData.length === 0) {
    return {
      averageTimePerStoryPoint: 0,
      estimationAccuracy: 0,
      timeEfficiencyScore: 0,
      totalTimeSpent: 0
    }
  }
  
  const totalTime = timeTrackingData.reduce((sum, data) => sum + data.timeSpentHours, 0)
  const totalStoryPoints = timeTrackingData.reduce((sum, data) => sum + (data.storyPoints || 0), 0)
  const accuracyData = timeTrackingData.filter(data => data.estimationAccuracy !== null)
  
  const averageTimePerStoryPoint = totalStoryPoints > 0 ? totalTime / totalStoryPoints : 0
  const estimationAccuracy = accuracyData.length > 0 ? 
    accuracyData.reduce((sum, data) => sum + data.estimationAccuracy, 0) / accuracyData.length : 0
  
  // Calculate efficiency score (0-100, higher is better)
  let timeEfficiencyScore = 0
  if (averageTimePerStoryPoint > 0) {
    // Ideal: 4 hours per story point, acceptable: 8 hours per story point
    timeEfficiencyScore = Math.max(0, Math.min(100, 
      100 - ((averageTimePerStoryPoint - 4) / 4 * 100)
    ))
  }
  
  return {
    averageTimePerStoryPoint,
    estimationAccuracy,
    timeEfficiencyScore: Math.round(timeEfficiencyScore),
    totalTimeSpent: totalTime
  }
}