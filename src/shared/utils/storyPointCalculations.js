/**
 * Centralized Story Point Calculation Utilities
 * 
 * This module provides a single source of truth for all story point calculations
 * across the Developer Quality Dashboard. It ensures consistent status filtering
 * and date field usage across all components.
 * 
 * Key Principles:
 * 1. All story points MUST be based on delivered statuses ($deliveredStatuses)
 * 2. All calculations MUST use 'updated' as primary date field
 * 3. All calculations MUST use 'resolved' as fallback date field
 * 4. All status filtering MUST use memberConfiguration.filterDefaults.statusFilter
 */

import { memberConfiguration } from '../../constants/memberConfiguration'
import { getTimePeriodKey } from './timeUtils'

/**
 * Get delivered statuses from central configuration
 * @returns {Array} Array of delivered status strings
 */
export const getDeliveredStatuses = () => {
  return memberConfiguration.filterDefaults.statusFilter
}

/**
 * Check if an issue has delivered status
 * @param {Object} issue - Issue object with status field
 * @returns {boolean} True if issue has delivered status
 */
export const isDeliveredStatus = (issue) => {
  const deliveredStatuses = getDeliveredStatuses()
  return deliveredStatuses.includes(issue.status)
}

/**
 * Get standardized date from issue using consistent priority
 * Priority: updated -> resolved -> created
 * @param {Object} issue - Issue object with date fields
 * @returns {string|null} ISO date string or null if no valid date
 */
export const getStandardizedDate = (issue) => {
  return issue.updated || issue.resolved || issue.created || null
}

/**
 * Filter issues by delivered status and valid dates
 * @param {Array} issues - Array of issues to filter
 * @param {Object} options - Filtering options
 * @returns {Array} Filtered issues with standardized dates
 */
export const filterDeliveredIssues = (issues, options = {}) => {
  const {
    requireDeliveredStatus = true,
    requireValidDate = true,
    customStatusFilter = null
  } = options

  if (!Array.isArray(issues)) {
    console.warn('filterDeliveredIssues: issues parameter must be an array')
    return []
  }

  return issues.filter(issue => {
    // Status filtering
    if (requireDeliveredStatus) {
      const statusFilter = customStatusFilter || getDeliveredStatuses()
      if (!statusFilter.includes(issue.status)) {
        return false
      }
    }

    // Date filtering
    if (requireValidDate) {
      const standardizedDate = getStandardizedDate(issue)
      if (!standardizedDate) {
        return false
      }
    }

    return true
  }).map(issue => ({
    ...issue,
    // Add standardized date field for consistent time period calculations
    standardizedDate: getStandardizedDate(issue)
  }))
}

/**
 * Calculate story points by time period and developer
 * This is the core function that ALL components should use
 * @param {Array} issues - Array of issues to process
 * @param {Object} options - Calculation options
 * @param {string} options.timeframe - Time period from Zustand filters state ('week', 'month', 'quarter')
 * @returns {Array} Array of time period data with developer story points
 */
export const calculateStoryPointsByTimePeriod = (issues, options = {}) => {
  const {
    timeframe, // REQUIRED: Must be passed from Zustand filters.timeframe
    projectFilter = null,
    developerFilter = null,
    customStatusFilter = null,
    requireDeliveredStatus = true
  } = options

  // Validate required timeframe parameter
  if (!timeframe) {
    console.error('calculateStoryPointsByTimePeriod: timeframe is required and must come from Zustand filters.timeframe')
    return []
  }

  // Filter issues using consistent logic
  const filteredIssues = filterDeliveredIssues(issues, {
    requireDeliveredStatus,
    customStatusFilter
  })

  // Apply additional filters
  let processedIssues = filteredIssues

  if (projectFilter && projectFilter.length > 0) {
    const projectSet = new Set(projectFilter)
    processedIssues = processedIssues.filter(issue => projectSet.has(issue.project))
  }

  if (developerFilter && developerFilter.length > 0) {
    const developerSet = new Set(developerFilter)
    processedIssues = processedIssues.filter(issue => developerSet.has(issue.assignee))
  }

  // Group by time period
  const timeBasedData = new Map()

  processedIssues.forEach(issue => {
    const assignee = issue.assignee || 'Unassigned'
    const storyPoints = issue.storyPoints || 0

    // Skip if no assignee or story points
    if (assignee === 'Unassigned' || storyPoints === 0) {
      return
    }

    // Get time period using standardized date
    const timePeriod = getTimePeriodKey(issue.standardizedDate, timeframe)
    
    if (!timePeriod) {
      console.warn(`Could not determine time period for issue ${issue.key}`, {
        date: issue.standardizedDate,
        timeframe
      })
      return
    }

    // Initialize time period if not exists
    if (!timeBasedData.has(timePeriod)) {
      timeBasedData.set(timePeriod, new Map())
    }

    // Add story points to developer total for this period
    const periodData = timeBasedData.get(timePeriod)
    periodData.set(assignee, (periodData.get(assignee) || 0) + storyPoints)
  })

  // Convert to chart data format
  const result = Array.from(timeBasedData.entries())
    .map(([timePeriod, developersMap]) => {
      const periodData = { timePeriod }
      developersMap.forEach((storyPoints, developer) => {
        periodData[developer] = storyPoints
      })
      return periodData
    })
    .sort((a, b) => a.timePeriod.localeCompare(b.timePeriod))

  return result
}

/**
 * Calculate story points for individual developer tickets grouped by time period
 * Used by Individual Tickets component (DeveloperTicketTable)
 * @param {Array} issues - Array of issues to process
 * @param {string} developerName - Name of developer to filter by
 * @param {Object} options - Calculation options
 * @param {string} options.timeframe - Time period from Zustand filters state ('week', 'month', 'quarter')
 * @returns {Map} Map of time period -> array of tickets
 */
export const calculateDeveloperTicketsByTimePeriod = (issues, developerName, options = {}) => {
  const {
    timeframe, // REQUIRED: Must be passed from Zustand filters.timeframe
    projectFilter = null,
    customStatusFilter = null,
    requireDeliveredStatus = true
  } = options

  // Validate required timeframe parameter
  if (!timeframe) {
    console.error('calculateDeveloperTicketsByTimePeriod: timeframe is required and must come from Zustand filters.timeframe')
    return new Map()
  }

  if (!developerName) {
    return new Map()
  }

  // Filter by developer first
  const developerIssues = issues.filter(issue => issue.assignee === developerName)

  // Apply consistent delivered status filtering
  const filteredIssues = filterDeliveredIssues(developerIssues, {
    requireDeliveredStatus,
    customStatusFilter
  })

  // Apply project filter if specified
  let processedIssues = filteredIssues
  if (projectFilter && projectFilter.length > 0) {
    const projectSet = new Set(projectFilter)
    processedIssues = processedIssues.filter(issue => projectSet.has(issue.project))
  }

  // Group by time period
  const groupedTickets = new Map()

  processedIssues.forEach(issue => {
    const timePeriod = getTimePeriodKey(issue.standardizedDate, timeframe)
    
    if (!timePeriod) {
      console.warn(`Could not determine time period for ticket ${issue.key}`, {
        date: issue.standardizedDate,
        timeframe
      })
      return
    }

    if (!groupedTickets.has(timePeriod)) {
      groupedTickets.set(timePeriod, [])
    }

    groupedTickets.get(timePeriod).push(issue)
  })

  // Sort tickets within each period by standardized date (descending)
  groupedTickets.forEach((tickets, timePeriod) => {
    tickets.sort((a, b) => {
      const dateA = new Date(a.standardizedDate)
      const dateB = new Date(b.standardizedDate)
      return dateB - dateA // Descending order (most recent first)
    })
  })

  return groupedTickets
}

/**
 * Calculate total story points for a developer
 * @param {Array} issues - Array of issues
 * @param {string} developerName - Developer name
 * @param {Object} options - Calculation options
 * @returns {number} Total story points
 */
export const calculateTotalStoryPoints = (issues, developerName = null, options = {}) => {
  let filteredIssues = issues

  // Filter by developer if specified
  if (developerName) {
    filteredIssues = issues.filter(issue => issue.assignee === developerName)
  }

  // Apply consistent delivered status filtering
  const deliveredIssues = filterDeliveredIssues(filteredIssues, options)

  // Sum story points
  return deliveredIssues.reduce((total, issue) => total + (issue.storyPoints || 0), 0)
}

/**
 * Validate story point consistency across different calculations
 * @param {Object} calculations - Object containing different calculation results
 * @returns {Object} Validation results
 */
export const validateStoryPointConsistency = (calculations) => {
  const { teamData, individualData, velocityData } = calculations
  
  const inconsistencies = []
  
  // Calculate totals from different sources
  const teamTotal = teamData ? calculateTotalFromTimeBasedData(teamData) : 0
  const individualTotal = individualData ? calculateTotalFromGroupedTickets(individualData) : 0
  const velocityTotal = velocityData ? calculateTotalStoryPoints(velocityData) : 0
  
  // Check for inconsistencies
  if (teamTotal !== individualTotal) {
    inconsistencies.push(`Team vs Individual: ${teamTotal} !== ${individualTotal}`)
  }
  
  if (teamTotal !== velocityTotal) {
    inconsistencies.push(`Team vs Velocity: ${teamTotal} !== ${velocityTotal}`)
  }
  
  return {
    isConsistent: inconsistencies.length === 0,
    inconsistencies,
    totals: { teamTotal, individualTotal, velocityTotal },
    details: {
      teamData: teamData ? teamData.length : 0,
      individualData: individualData ? individualData.size : 0,
      velocityData: velocityData ? velocityData.length : 0
    }
  }
}

/**
 * Helper: Calculate total story points from time-based chart data
 * @param {Array} timeBasedData - Array of time period data
 * @returns {number} Total story points
 */
const calculateTotalFromTimeBasedData = (timeBasedData) => {
  return timeBasedData.reduce((total, periodData) => {
    Object.keys(periodData).forEach(key => {
      if (key !== 'timePeriod') {
        total += periodData[key] || 0
      }
    })
    return total
  }, 0)
}

/**
 * Helper: Calculate total story points from grouped tickets
 * @param {Map} groupedTickets - Map of time period -> tickets
 * @returns {number} Total story points
 */
const calculateTotalFromGroupedTickets = (groupedTickets) => {
  let total = 0
  groupedTickets.forEach((tickets) => {
    tickets.forEach(ticket => {
      total += ticket.storyPoints || 0
    })
  })
  return total
}

/**
 * Debug utility: Log story point calculation details
 * @param {Array} issues - Original issues array
 * @param {Array} filteredIssues - Filtered issues array
 * @param {string} componentName - Name of component doing the calculation
 */
export const debugStoryPointCalculation = (issues, filteredIssues, componentName) => {
  const deliveredStatuses = getDeliveredStatuses()
  
  console.group(`📊 Story Point Calculation Debug - ${componentName}`)
  console.log('Delivered Statuses:', deliveredStatuses)
  console.log('Original Issues:', issues.length)
  console.log('Filtered Issues:', filteredIssues.length)
  console.log('Total Story Points:', calculateTotalStoryPoints(filteredIssues))
  
  // Status breakdown
  const statusBreakdown = {}
  issues.forEach(issue => {
    statusBreakdown[issue.status] = (statusBreakdown[issue.status] || 0) + 1
  })
  console.log('Status Breakdown:', statusBreakdown)
  
  // Filtered vs Excluded
  const excludedByStatus = issues.filter(issue => !deliveredStatuses.includes(issue.status))
  const excludedByDate = issues.filter(issue => !getStandardizedDate(issue))
  
  console.log('Excluded by Status:', excludedByStatus.length)
  console.log('Excluded by Date:', excludedByDate.length)
  console.groupEnd()
}

export default {
  getDeliveredStatuses,
  isDeliveredStatus,
  getStandardizedDate,
  filterDeliveredIssues,
  calculateStoryPointsByTimePeriod,
  calculateDeveloperTicketsByTimePeriod,
  calculateTotalStoryPoints,
  validateStoryPointConsistency,
  debugStoryPointCalculation
}