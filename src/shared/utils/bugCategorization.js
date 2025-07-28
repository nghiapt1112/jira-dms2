/**
 * Bug Categorization Utility
 * Categorizes bugs according to BUG_STATUS_MAPPING from memberConfiguration
 * Following .cursorrules conventions - camelCase naming, performance optimizations
 */

import { memberConfiguration } from '../../constants/memberConfiguration.js'

/**
 * Get bug status mapping from memberConfiguration
 * @returns {Object} Bug status mapping object
 */
export const getBugStatusMapping = () => {
  return memberConfiguration.BUG_STATUS_MAPPING || {
    resolved: ["Done", "Resolved", "Closed", "Fixed"],
    notFixed: ["Won't Fix", "Duplicate", "Cannot Reproduce", "Invalid"],
    new: ["To Do", "Open"],
    inProgress: ["In Progress", "In Review", "Testing"]
  }
}

/**
 * Categorize a bug based on its status
 * @param {string} status - The bug status from JIRA
 * @returns {string} Category: 'resolved', 'notFixed', 'new', 'inProgress', or 'unknown'
 */
export const categorizeBugStatus = (status) => {
  if (!status) return 'unknown'
  
  const statusMapping = getBugStatusMapping()
  
  // Check each category
  for (const [category, statuses] of Object.entries(statusMapping)) {
    if (statuses.includes(status)) {
      return category
    }
  }
  
  return 'unknown'
}

/**
 * Get bug trend data structure with all categories
 * @returns {Object} Initial bug trend data structure
 */
export const getInitialBugTrendData = () => {
  return {
    total: 0,
    resolved: 0,
    notFixed: 0,
    new: 0,
    inProgress: 0
  }
}

/**
 * Categorize bug status and return category
 * @param {Object} issue - JIRA issue object
 * @returns {string} Category: 'resolved', 'notFixed', 'new', 'inProgress'
 */
export const categorizeBugForTrend = (issue) => {
  try {
    if (!issue || !issue.fields) {
      console.warn('Invalid issue object provided to categorizeBugForTrend:', issue)
      return 'inProgress' // Default fallback
    }
    
    const status = issue.fields?.status?.name || 'Unknown'
    const category = categorizeBugStatus(status)
    
    // For unknown statuses, categorize based on resolution date
    if (category === 'unknown') {
      return issue.fields?.resolutiondate ? 'resolved' : 'inProgress'
    }
    
    return category
  } catch (error) {
    console.error('Error in categorizeBugForTrend:', error, issue)
    return 'inProgress' // Safe fallback
  }
}

/**
 * Process bug for trend analysis with new categorization
 * @param {Object} issue - JIRA issue object
 * @param {Object} periodData - Current period data object
 * @param {string} periodKey - Time period key (month, week, quarter)
 */
export const processBugForTrendAnalysis = (issue, periodData, periodKey) => {
  const category = categorizeBugForTrend(issue)
  
  // Always increment total
  periodData.total += 1
  
  // Increment appropriate category
  periodData[category] += 1
}

/**
 * Convert legacy bug trend data to new format
 * @param {Object} legacyData - Data with 'pending' field
 * @returns {Object} Data with new categorization
 */
export const convertLegacyBugTrendData = (legacyData) => {
  if (!legacyData) return getInitialBugTrendData()
  
  return {
    total: legacyData.total || 0,
    resolved: legacyData.resolved || 0,
    notFixed: legacyData.notFixed || 0,
    new: legacyData.new || 0,
    inProgress: legacyData.inProgress || (legacyData.pending || 0) // Convert pending to inProgress
  }
}

/**
 * Validate bug trend data structure
 * @param {Object} data - Bug trend data to validate
 * @returns {boolean} True if valid
 */
export const validateBugTrendData = (data) => {
  if (!data || typeof data !== 'object') return false
  
  const requiredFields = ['total', 'resolved', 'notFixed', 'new', 'inProgress']
  return requiredFields.every(field => typeof data[field] === 'number')
}

/**
 * Get bug trend summary statistics
 * @param {Object} data - Bug trend data
 * @returns {Object} Summary statistics
 */
export const getBugTrendSummary = (data) => {
  if (!validateBugTrendData(data)) return null
  
  const total = data.total || 0
  const resolved = data.resolved || 0
  const notFixed = data.notFixed || 0
  const newBugs = data.new || 0
  const inProgress = data.inProgress || 0
  
  return {
    total,
    resolved,
    notFixed,
    new: newBugs,
    inProgress,
    resolutionRate: total > 0 ? (resolved / total * 100) : 0,
    rejectionRate: total > 0 ? (notFixed / total * 100) : 0,
    newBugRate: total > 0 ? (newBugs / total * 100) : 0,
    inProgressRate: total > 0 ? (inProgress / total * 100) : 0
  }
} 