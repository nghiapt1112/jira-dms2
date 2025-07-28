/**
 * Issue Utilities Class
 * 
 * Centralized utilities for JIRA issue processing following DRY and SOLID principles.
 * This class contains all issue-related calculations and data extraction logic.
 * 
 * Key Principles:
 * 1. Single Responsibility - Each method has one clear purpose
 * 2. DRY - No repeated logic across the application
 * 3. Centralized date logic - One method determines delivered date
 * 4. Delivered statuses are always mandatory (no optional parameter)
 */

import { memberConfiguration } from '../../constants/memberConfiguration'
import { getTimePeriodKey } from './timeUtils'

export class IssueUtils {
  /**
   * Get delivered statuses from central configuration
   * @returns {Array<string>} Array of delivered status strings
   */
  static getDeliveredStatuses() {
    return memberConfiguration.filterDefaults.statusFilter
  }

  /**
   * Get the appropriate date for delivered work calculation
   * Priority: resolved -> updated -> created
   * @param {Object} issue - Issue object with date fields
   * @returns {string|null} ISO date string or null if no valid date
   */
  static getDeliveredDate(issue) {
    return issue.resolved || issue.updated || issue.created || null
  }

  /**
   * Check if an issue has delivered status (mandatory for all calculations)
   * @param {Object} issue - Issue object with status field
   * @returns {boolean} True if issue has delivered status
   */
  static isDeliveredStatus(issue) {
    const deliveredStatuses = this.getDeliveredStatuses()
    return deliveredStatuses.includes(issue.status)
  }

  /**
   * Filter issues to delivered ones with valid dates
   * @param {Array} issues - Array of issues to filter
   * @param {Object} filters - Additional filters (project, developer, etc.)
   * @returns {Array} Filtered issues with deliveredDate field added
   */
  static filterDeliveredIssues(issues, filters = {}) {
    if (!Array.isArray(issues)) {
      console.warn('IssueUtils.filterDeliveredIssues: issues parameter must be an array')
      return []
    }

    const { projectFilter = null, developerFilter = null, statusFilter = null, issueTypeFilter = null } = filters

    return issues.filter(issue => {
      // Must have delivered status (mandatory)
      if (!this.isDeliveredStatus(issue)) {
        return false
      }

      // Must have valid delivered date
      const deliveredDate = this.getDeliveredDate(issue)
      if (!deliveredDate) {
        return false
      }

      // Project filter
      if (projectFilter && projectFilter.length > 0) {
        if (!projectFilter.includes(issue.project)) {
          return false
        }
      }

      // Developer filter
      if (developerFilter && developerFilter.length > 0) {
        if (!developerFilter.includes(issue.assignee)) {
          return false
        }
      }

      // User-selected status filter
      if (statusFilter && statusFilter.length > 0) {
        if (!statusFilter.includes(issue.status)) {
          return false
        }
      }

      // Issue type filter
      if (issueTypeFilter && issueTypeFilter.length > 0) {
        if (!issueTypeFilter.includes(issue.issueType)) {
          return false
        }
      }

      // Skip unassigned and zero story points
      if (issue.assignee === 'Unassigned' || !issue.storyPoints || issue.storyPoints === 0) {
        return false
      }

      return true
    }).map(issue => ({
      ...issue,
      // Add standardized delivered date for consistent calculations
      deliveredDate: this.getDeliveredDate(issue)
    }))
  }

  /**
   * Calculate story points by time period and developer
   * Core function for Team Contribution Chart
   * @param {Array} issues - Array of issues to process
   * @param {string} timeframe - Time period from Zustand filters ('week', 'month', 'quarter')
   * @param {Object} filters - Filter options (project, developer, etc.)
   * @returns {Array} Array of time period data with developer story points
   */
  static calculateStoryPointsByTimePeriod(issues, timeframe, filters = {}) {
    // Validate required timeframe parameter
    if (!timeframe) {
      console.error('IssueUtils.calculateStoryPointsByTimePeriod: timeframe is required from Zustand filters.timeframe')
      return []
    }

    // Validate timeframe is valid
    const validTimeframes = ['week', 'month', 'quarter']
    if (!validTimeframes.includes(timeframe)) {
      console.error(`IssueUtils.calculateStoryPointsByTimePeriod: Invalid timeframe "${timeframe}". Must be one of: ${validTimeframes.join(', ')}`)
      return []
    }

    // Filter to delivered issues
    const deliveredIssues = this.filterDeliveredIssues(issues, filters)

    // Group by time period and developer
    const timeBasedData = new Map()

    deliveredIssues.forEach(issue => {
      const assignee = issue.assignee
      const storyPoints = issue.storyPoints

      // Get time period using delivered date
      const timePeriod = getTimePeriodKey(issue.deliveredDate, timeframe)
      
      if (!timePeriod) {
        console.warn(`Could not determine time period for issue ${issue.key}`, {
          deliveredDate: issue.deliveredDate,
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
   * Calculate developer tickets grouped by time period
   * Core function for Individual Tickets component
   * @param {Array} issues - Array of issues to process
   * @param {string} developerName - Name of developer to filter by
   * @param {string} timeframe - Time period from Zustand filters ('week', 'month', 'quarter')
   * @param {Object} filters - Filter options (project, etc.)
   * @returns {Map} Map of time period -> array of tickets
   */
  static calculateDeveloperTicketsByTimePeriod(issues, developerName, timeframe, filters = {}) {
    // Validate required parameters
    if (!timeframe) {
      console.error('IssueUtils.calculateDeveloperTicketsByTimePeriod: timeframe is required from Zustand filters.timeframe')
      return new Map()
    }

    if (!developerName) {
      return new Map()
    }

    // Filter by developer first, then apply delivered filter
    const developerIssues = issues.filter(issue => issue.assignee === developerName)
    const deliveredIssues = this.filterDeliveredIssues(developerIssues, filters)
    
    // Apply user-selected status filter if provided
    let finalIssues = deliveredIssues
    if (filters.statusFilter && filters.statusFilter.length > 0) {
      finalIssues = deliveredIssues.filter(issue => 
        filters.statusFilter.includes(issue.status)
      )
    }

    // Group by time period
    const groupedTickets = new Map()

    finalIssues.forEach(issue => {
      const timePeriod = getTimePeriodKey(issue.deliveredDate, timeframe)
      
      if (!timePeriod) {
        console.warn(`Could not determine time period for ticket ${issue.key}`, {
          deliveredDate: issue.deliveredDate,
          timeframe
        })
        return
      }

      if (!groupedTickets.has(timePeriod)) {
        groupedTickets.set(timePeriod, [])
      }

      groupedTickets.get(timePeriod).push(issue)
    })

    // Sort tickets within each period by delivered date (descending - most recent first)
    groupedTickets.forEach((tickets, timePeriod) => {
      tickets.sort((a, b) => {
        const dateA = new Date(a.deliveredDate)
        const dateB = new Date(b.deliveredDate)
        return dateB - dateA // Descending order
      })
    })

    // Sort time periods in descending order (most recent period first)
    const sortedGroupedTickets = new Map([...groupedTickets.entries()].sort((a, b) => {
      // Compare time period keys in descending order
      const periodA = a[0] // e.g., "2024-03" 
      const periodB = b[0] // e.g., "2024-01"
      return periodB.localeCompare(periodA) // Descending order (2024-03 before 2024-01)
    }))

    return sortedGroupedTickets
  }

  /**
   * Calculate total story points for a developer or all developers
   * @param {Array} issues - Array of issues
   * @param {string|null} developerName - Developer name (null for all developers)
   * @param {Object} filters - Filter options
   * @returns {number} Total story points
   */
  static calculateTotalStoryPoints(issues, developerName = null, filters = {}) {
    let filteredIssues = issues

    // Filter by developer if specified
    if (developerName) {
      filteredIssues = issues.filter(issue => issue.assignee === developerName)
    }

    // Apply delivered filter (mandatory) - now includes status filter
    const deliveredIssues = this.filterDeliveredIssues(filteredIssues, filters)

    // Sum story points
    return deliveredIssues.reduce((total, issue) => total + (issue.storyPoints || 0), 0)
  }

  /**
   * Get summary statistics for issues
   * @param {Array} issues - Array of issues
   * @param {Object} filters - Filter options
   * @returns {Object} Summary statistics
   */
  static getIssueSummary(issues, filters = {}) {
    const deliveredIssues = this.filterDeliveredIssues(issues, filters)
    
    const summary = {
      totalIssues: deliveredIssues.length,
      totalStoryPoints: this.calculateTotalStoryPoints(issues, null, filters),
      developers: new Set(deliveredIssues.map(issue => issue.assignee)).size,
      projects: new Set(deliveredIssues.map(issue => issue.project)).size,
      dateRange: {
        earliest: null,
        latest: null
      }
    }

    // Calculate date range
    if (deliveredIssues.length > 0) {
      const dates = deliveredIssues
        .map(issue => new Date(issue.deliveredDate))
        .sort((a, b) => a - b)
      
      summary.dateRange.earliest = dates[0].toISOString()
      summary.dateRange.latest = dates[dates.length - 1].toISOString()
    }

    return summary
  }

  /**
   * Validate story point consistency across different calculations
   * @param {Object} calculations - Object containing different calculation results
   * @returns {Object} Validation results
   */
  static validateStoryPointConsistency(calculations) {
    const { teamData, individualData, velocityData } = calculations
    
    const inconsistencies = []
    
    // Calculate totals from different sources
    const teamTotal = teamData ? this.calculateTotalFromTimeBasedData(teamData) : 0
    const individualTotal = individualData ? this.calculateTotalFromGroupedTickets(individualData) : 0
    const velocityTotal = velocityData ? this.calculateTotalStoryPoints(velocityData) : 0
    
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
        teamDataPeriods: teamData ? teamData.length : 0,
        individualDataPeriods: individualData ? individualData.size : 0,
        velocityDataIssues: velocityData ? velocityData.length : 0
      }
    }
  }

  /**
   * Debug utility: Log calculation details for troubleshooting
   * @param {Array} issues - Original issues array
   * @param {Array} filteredIssues - Filtered issues array
   * @param {string} componentName - Name of component doing the calculation
   */
  static debugCalculation(issues, filteredIssues, componentName) {
    const deliveredStatuses = this.getDeliveredStatuses()
    
    console.group(`📊 Story Point Calculation Debug - ${componentName}`)
    console.log('Delivered Statuses:', deliveredStatuses)
    console.log('Original Issues:', issues.length)
    console.log('Filtered Issues:', filteredIssues.length)
    console.log('Total Story Points:', this.calculateTotalStoryPoints(filteredIssues))
    
    // Status breakdown
    const statusBreakdown = {}
    issues.forEach(issue => {
      statusBreakdown[issue.status] = (statusBreakdown[issue.status] || 0) + 1
    })
    console.log('Status Breakdown:', statusBreakdown)
    
    // Date field analysis
    const dateAnalysis = {
      hasResolved: issues.filter(i => i.resolved).length,
      hasUpdated: issues.filter(i => i.updated).length,
      hasCreated: issues.filter(i => i.created).length,
      hasAnyDate: issues.filter(i => this.getDeliveredDate(i)).length
    }
    console.log('Date Field Analysis:', dateAnalysis)
    
    console.groupEnd()
  }

  // Private helper methods
  
  /**
   * Helper: Calculate total story points from time-based chart data
   * @private
   * @param {Array} timeBasedData - Array of time period data
   * @returns {number} Total story points
   */
  static calculateTotalFromTimeBasedData(timeBasedData) {
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
   * @private
   * @param {Map} groupedTickets - Map of time period -> tickets
   * @returns {number} Total story points
   */
  static calculateTotalFromGroupedTickets(groupedTickets) {
    let total = 0
    groupedTickets.forEach((tickets) => {
      tickets.forEach(ticket => {
        total += ticket.storyPoints || 0
      })
    })
    return total
  }
}

export default IssueUtils