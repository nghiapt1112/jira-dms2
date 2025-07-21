/**
 * Centralized Severity Calculation Utilities
 * Weighted calculation functions and severity breakdown utilities
 * Consolidates logic from ProjectHealthTable.jsx, BugRateAnalysisTable.jsx, and EffortEffectivenessChart.jsx
 * Following .cursorrules conventions with comprehensive performance optimization and error handling
 */

import { parseSeverity, parseSeverityBatch } from './severityParser.js'
import { 
  SEVERITY_LEVELS, 
  getSeverityWeight, 
  initializeSeverityBreakdown,
  calculateWeightedSeverityScore,
  getSeverityStatistics
} from '../constants/severityConstants.js'

/**
 * Calculate severity breakdown from array of bugs/issues
 * @param {Array} bugs - Array of JIRA bug objects
 * @param {string|null} projectKey - Project key for project-specific configuration (optional)
 * @returns {Object} - Severity breakdown with counts for each level
 */
export const calculateSeverityBreakdown = (bugs, projectKey = null) => {
  if (!Array.isArray(bugs) || bugs.length === 0) {
    return initializeSeverityBreakdown()
  }

  // Initialize breakdown with all severity levels set to 0
  const breakdown = initializeSeverityBreakdown()

  // Parse severity for all bugs in batch for performance
  const severityResults = parseSeverityBatch(bugs, projectKey)

  // Count occurrences of each severity level
  severityResults.forEach(result => {
    const severity = result.severity || SEVERITY_LEVELS.UNKNOWN
    breakdown[severity] = (breakdown[severity] || 0) + 1
  })

  return breakdown
}

/**
 * Calculate simple bug rate (percentage)
 * @param {Array} bugs - Array of bug objects
 * @param {number} totalIssues - Total number of issues
 * @returns {number} - Bug rate as percentage (0-100)
 */
export const calculateSimpleBugRate = (bugs, totalIssues) => {
  if (!Array.isArray(bugs) || totalIssues <= 0) {
    return 0
  }

  return (bugs.length / totalIssues) * 100
}

/**
 * Calculate weighted bug rate using severity weights
 * @param {Array} bugs - Array of JIRA bug objects
 * @param {number} totalIssues - Total number of issues
 * @param {string|null} projectKey - Project key for project-specific configuration (optional)
 * @returns {number} - Weighted bug rate as percentage (0-100+)
 */
export const calculateWeightedBugRate = (bugs, totalIssues, projectKey = null) => {
  if (!Array.isArray(bugs) || bugs.length === 0 || totalIssues <= 0) {
    return 0
  }

  try {
    // Get severity breakdown
    const severityBreakdown = calculateSeverityBreakdown(bugs, projectKey)
    
    // Calculate weighted bug count
    const weightedBugCount = calculateWeightedSeverityScore(severityBreakdown)
    
    // Return as percentage
    return (weightedBugCount / totalIssues) * 100

  } catch (error) {
    console.warn('Weighted bug rate calculation failed:', error)
    return calculateSimpleBugRate(bugs, totalIssues)
  }
}

/**
 * Calculate quality efficiency score based on weighted bug rate
 * @param {Array} bugs - Array of JIRA bug objects
 * @param {number} totalIssues - Total number of issues
 * @param {string|null} projectKey - Project key for project-specific configuration (optional)
 * @returns {number} - Quality efficiency percentage (0-100)
 */
export const calculateQualityEfficiency = (bugs, totalIssues, projectKey = null) => {
  const weightedBugRate = calculateWeightedBugRate(bugs, totalIssues, projectKey)
  return Math.max(0, 100 - weightedBugRate)
}

/**
 * Calculate comprehensive bug rate metrics
 * @param {Array} bugs - Array of JIRA bug objects
 * @param {number} totalIssues - Total number of issues
 * @param {string|null} projectKey - Project key for project-specific configuration (optional)
 * @returns {Object} - Comprehensive bug rate metrics
 */
export const calculateBugRateMetrics = (bugs, totalIssues, projectKey = null) => {
  if (!Array.isArray(bugs) || totalIssues <= 0) {
    return {
      simpleBugRate: 0,
      weightedBugRate: 0,
      qualityEfficiency: 100,
      totalBugs: 0,
      totalIssues: 0,
      severityBreakdown: initializeSeverityBreakdown(),
      severityStats: getSeverityStatistics({}),
      projectKey
    }
  }

  try {
    const simpleBugRate = calculateSimpleBugRate(bugs, totalIssues)
    const weightedBugRate = calculateWeightedBugRate(bugs, totalIssues, projectKey)
    const qualityEfficiency = calculateQualityEfficiency(bugs, totalIssues, projectKey)
    const severityBreakdown = calculateSeverityBreakdown(bugs, projectKey)
    const severityStats = getSeverityStatistics(severityBreakdown)

    return {
      simpleBugRate,
      weightedBugRate,
      qualityEfficiency,
      totalBugs: bugs.length,
      totalIssues,
      severityBreakdown,
      severityStats,
      projectKey,
      // Additional derived metrics
      bugRateDifference: weightedBugRate - simpleBugRate,
      riskLevel: getRiskLevel(weightedBugRate),
      qualityGrade: getQualityGrade(qualityEfficiency)
    }

  } catch (error) {
    console.warn('Bug rate metrics calculation failed:', error)
    return {
      simpleBugRate: 0,
      weightedBugRate: 0,
      qualityEfficiency: 100,
      totalBugs: bugs.length,
      totalIssues,
      severityBreakdown: initializeSeverityBreakdown(),
      severityStats: getSeverityStatistics({}),
      projectKey,
      error: error.message
    }
  }
}

/**
 * Calculate developer-specific bug rate metrics
 * @param {Object} developerData - Developer data object with bugs and issues
 * @param {string|null} projectKey - Project key for project-specific configuration (optional)
 * @returns {Object} - Developer bug rate metrics
 */
export const calculateDeveloperBugRateMetrics = (developerData, projectKey = null) => {
  if (!developerData || typeof developerData !== 'object') {
    return calculateBugRateMetrics([], 0, projectKey)
  }

  const bugs = developerData.bugs || []
  const totalIssues = developerData.totalIssues || 0
  const developerName = developerData.developer || developerData.name || 'Unknown'

  const metrics = calculateBugRateMetrics(bugs, totalIssues, projectKey)

  return {
    ...metrics,
    developer: developerName,
    // Additional developer-specific metrics
    bugsPerWeek: calculateBugsPerTimeframe(bugs, 'week'),
    bugsPerMonth: calculateBugsPerTimeframe(bugs, 'month'),
    averageSeverity: calculateAverageSeverity(metrics.severityBreakdown),
    trendDirection: calculateTrendDirection(bugs)
  }
}

/**
 * Calculate project-level severity rate data for cross-dashboard integration
 * @param {Array} projectData - Array of project objects
 * @returns {Array} - Array of project severity rate data
 */
export const calculateProjectSeverityRates = (projectData) => {
  if (!Array.isArray(projectData) || projectData.length === 0) {
    return []
  }

  return projectData.map(project => {
    const projectKey = project.projectKey || project.id || project.key
    const bugs = project.bugs || []
    const totalIssues = project.totalIssues || project.issues?.length || 0

    const metrics = calculateBugRateMetrics(bugs, totalIssues, projectKey)

    return {
      projectId: projectKey,
      projectName: project.name || projectKey,
      ...metrics,
      // Additional project metadata
      progress: project.progress || 0,
      healthScore: project.healthScore || project.health || 0,
      qualityScore: project.qualityScore || metrics.qualityEfficiency
    }
  })
}

/**
 * Helper function to determine risk level based on weighted bug rate
 * @param {number} weightedBugRate - Weighted bug rate percentage
 * @returns {string} - Risk level classification
 */
const getRiskLevel = (weightedBugRate) => {
  if (weightedBugRate >= 20) return 'high'
  if (weightedBugRate >= 10) return 'medium'
  if (weightedBugRate >= 5) return 'low'
  return 'minimal'
}

/**
 * Helper function to determine quality grade based on efficiency score
 * @param {number} qualityEfficiency - Quality efficiency percentage
 * @returns {string} - Quality grade classification
 */
const getQualityGrade = (qualityEfficiency) => {
  if (qualityEfficiency >= 95) return 'A+'
  if (qualityEfficiency >= 90) return 'A'
  if (qualityEfficiency >= 85) return 'B+'
  if (qualityEfficiency >= 80) return 'B'
  if (qualityEfficiency >= 75) return 'C+'
  if (qualityEfficiency >= 70) return 'C'
  if (qualityEfficiency >= 65) return 'D+'
  if (qualityEfficiency >= 60) return 'D'
  return 'F'
}

/**
 * Helper function to calculate bugs per timeframe
 * @param {Array} bugs - Array of bug objects
 * @param {string} timeframe - 'week' or 'month'
 * @returns {number} - Average bugs per timeframe
 */
const calculateBugsPerTimeframe = (bugs, timeframe) => {
  if (!Array.isArray(bugs) || bugs.length === 0) {
    return 0
  }

  // Get date range of bugs
  const dates = bugs
    .map(bug => bug.fields?.created ? new Date(bug.fields.created) : null)
    .filter(date => date !== null)
    .sort((a, b) => a - b)

  if (dates.length === 0) {
    return 0
  }

  const firstDate = dates[0]
  const lastDate = dates[dates.length - 1]
  const timeDiff = lastDate - firstDate
  
  // Calculate timeframe duration in milliseconds
  const timeframeDuration = timeframe === 'week' ? 7 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000
  
  if (timeDiff < timeframeDuration) {
    return bugs.length // All bugs within one timeframe
  }

  const timeframeCount = timeDiff / timeframeDuration
  return bugs.length / timeframeCount
}

/**
 * Helper function to calculate average severity weight
 * @param {Object} severityBreakdown - Severity breakdown object
 * @returns {number} - Average severity weight
 */
const calculateAverageSeverity = (severityBreakdown) => {
  if (!severityBreakdown || typeof severityBreakdown !== 'object') {
    return 0
  }

  const totalCount = Object.values(severityBreakdown).reduce((sum, count) => sum + count, 0)
  
  if (totalCount === 0) {
    return 0
  }

  const weightedSum = Object.entries(severityBreakdown).reduce((sum, [severity, count]) => {
    const weight = getSeverityWeight(severity)
    return sum + (weight * count)
  }, 0)

  return weightedSum / totalCount
}

/**
 * Helper function to calculate trend direction (simplified)
 * @param {Array} bugs - Array of bug objects
 * @returns {string} - Trend direction: 'improving', 'stable', or 'declining'
 */
const calculateTrendDirection = (bugs) => {
  if (!Array.isArray(bugs) || bugs.length < 2) {
    return 'stable'
  }

  // Simple trend calculation based on creation dates
  const sortedBugs = bugs
    .filter(bug => bug.fields?.created)
    .sort((a, b) => new Date(a.fields.created) - new Date(b.fields.created))

  if (sortedBugs.length < 2) {
    return 'stable'
  }

  const midpoint = Math.floor(sortedBugs.length / 2)
  const firstHalf = sortedBugs.slice(0, midpoint).length
  const secondHalf = sortedBugs.slice(midpoint).length

  if (secondHalf > firstHalf * 1.2) {
    return 'declining'
  } else if (firstHalf > secondHalf * 1.2) {
    return 'improving'
  }
  
  return 'stable'
}

/**
 * Batch calculate metrics for multiple entities (developers, projects, etc.)
 * @param {Array} entities - Array of entity objects with bugs and totalIssues
 * @param {string|null} projectKey - Project key for project-specific configuration (optional)
 * @param {Function} entityProcessor - Optional function to process each entity
 * @returns {Array} - Array of calculated metrics for each entity
 */
export const calculateBatchMetrics = (entities, projectKey = null, entityProcessor = null) => {
  if (!Array.isArray(entities)) {
    return []
  }

  return entities.map(entity => {
    const bugs = entity.bugs || []
    const totalIssues = entity.totalIssues || 0
    const metrics = calculateBugRateMetrics(bugs, totalIssues, projectKey)

    // Apply custom entity processor if provided
    const processedEntity = entityProcessor ? entityProcessor(entity, metrics) : { ...entity, ...metrics }

    return processedEntity
  })
} 