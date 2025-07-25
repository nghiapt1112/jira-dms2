/**
 * Ticket Grouping Service
 * Provides utility functions for grouping and sorting ticket data by time periods
 * Following .cursorrules conventions - camelCase naming, performance optimizations
 */

import { getTimePeriodKey } from '../../../shared/utils/timeUtils'

/**
 * Group tickets by timeframe using existing time utilities
 * @param {Array} tickets - Array of ticket objects with date fields
 * @param {string} timeframe - 'week', 'month', or 'quarter'
 * @param {Object} options - Optional configuration
 * @returns {Map} - Map of periodKey -> tickets array
 */
export const groupTicketsByTimeframe = (tickets, timeframe = 'month', options = {}) => {
  const {
    dateField = 'auto', // 'auto', 'resolved', 'updated', 'created'
    includeEmptyPeriods = false,
    sortPeriods = true
  } = options
  
  if (!Array.isArray(tickets)) {
    console.warn('groupTicketsByTimeframe: tickets must be an array')
    return new Map()
  }
  
  if (!['week', 'month', 'quarter'].includes(timeframe)) {
    console.warn(`groupTicketsByTimeframe: invalid timeframe '${timeframe}', defaulting to 'month'`)
    timeframe = 'month'
  }
  
  const groupedTickets = new Map()
  const skippedTickets = []
  
  tickets.forEach(ticket => {
    if (!ticket) {
      skippedTickets.push({ reason: 'null_ticket', ticket: null })
      return
    }
    
    // Determine which date to use
    let dateToUse = null
    switch (dateField) {
      case 'resolved':
        dateToUse = ticket.resolved
        break
      case 'updated':
        dateToUse = ticket.updated
        break
      case 'created':
        dateToUse = ticket.created
        break
      case 'auto':
      default:
        // Auto mode: use resolved first, fall back to updated, then created
        dateToUse = ticket.resolved || ticket.updated || ticket.created
        break
    }
    
    if (!dateToUse) {
      skippedTickets.push({ 
        reason: 'no_date', 
        ticket: { key: ticket.key, id: ticket.id },
        availableDates: {
          resolved: !!ticket.resolved,
          updated: !!ticket.updated,
          created: !!ticket.created
        }
      })
      return
    }
    
    // Get time period key using existing utility
    const periodKey = getTimePeriodKey(dateToUse, timeframe)
    
    if (!periodKey) {
      skippedTickets.push({ 
        reason: 'invalid_period', 
        ticket: { key: ticket.key, id: ticket.id },
        dateToUse,
        timeframe
      })
      return
    }
    
    // Initialize group if it doesn't exist
    if (!groupedTickets.has(periodKey)) {
      groupedTickets.set(periodKey, [])
    }
    
    // Add ticket to group
    groupedTickets.get(periodKey).push(ticket)
  })
  
  // Log skipped tickets if any (for debugging)
  if (skippedTickets.length > 0) {
    console.warn(`groupTicketsByTimeframe: skipped ${skippedTickets.length} tickets`, {
      totalTickets: tickets.length,
      skippedCount: skippedTickets.length,
      skippedReasons: skippedTickets.reduce((acc, item) => {
        acc[item.reason] = (acc[item.reason] || 0) + 1
        return acc
      }, {}),
      skippedTickets: skippedTickets.slice(0, 5) // Show first 5 for debugging
    })
  }
  
  // Sort period keys if requested
  if (sortPeriods && groupedTickets.size > 0) {
    return sortGroupedTicketsByPeriod(groupedTickets, 'desc')
  }
  
  return groupedTickets
}

/**
 * Sort tickets within each time period
 * @param {Array} tickets - Array of tickets to sort
 * @param {Object} options - Sort configuration
 * @returns {Array} - Sorted tickets array
 */
export const sortTicketsWithinPeriod = (tickets, options = {}) => {
  const {
    sortBy = 'date', // 'date', 'storyPoints', 'key', 'status', 'type'
    order = 'desc', // 'desc', 'asc'
    dateField = 'auto' // 'auto', 'resolved', 'updated', 'created'
  } = options
  
  if (!Array.isArray(tickets)) {
    console.warn('sortTicketsWithinPeriod: tickets must be an array')
    return []
  }
  
  const sortedTickets = [...tickets] // Create a copy to avoid mutating original
  
  sortedTickets.sort((a, b) => {
    let comparison = 0
    
    switch (sortBy) {
      case 'date': {
        // Get dates for comparison
        let aDate, bDate
        
        switch (dateField) {
          case 'resolved':
            aDate = a.resolved ? new Date(a.resolved) : null
            bDate = b.resolved ? new Date(b.resolved) : null
            break
          case 'updated':
            aDate = a.updated ? new Date(a.updated) : null
            bDate = b.updated ? new Date(b.updated) : null
            break
          case 'created':
            aDate = a.created ? new Date(a.created) : null
            bDate = b.created ? new Date(b.created) : null
            break
          case 'auto':
          default:
            aDate = a.resolved ? new Date(a.resolved) : (a.updated ? new Date(a.updated) : null)
            bDate = b.resolved ? new Date(b.resolved) : (b.updated ? new Date(b.updated) : null)
            break
        }
        
        // Handle null dates
        if (aDate && bDate) {
          comparison = bDate - aDate // Default to descending (newest first)
        } else if (aDate && !bDate) {
          comparison = -1 // a has date, b doesn't - a comes first
        } else if (!aDate && bDate) {
          comparison = 1 // b has date, a doesn't - b comes first
        } else {
          comparison = 0 // Neither has date
        }
        break
      }
      
      case 'storyPoints': {
        const aPoints = a.storyPoints || 0
        const bPoints = b.storyPoints || 0
        comparison = bPoints - aPoints // Default descending (higher points first)
        break
      }
      
      case 'key': {
        comparison = (a.key || '').localeCompare(b.key || '')
        break
      }
      
      case 'status': {
        comparison = (a.status || '').localeCompare(b.status || '')
        break
      }
      
      case 'type': {
        comparison = (a.issueType || '').localeCompare(b.issueType || '')
        break
      }
      
      default:
        console.warn(`sortTicketsWithinPeriod: invalid sortBy '${sortBy}', falling back to key`)
        comparison = (a.key || '').localeCompare(b.key || '')
        break
    }
    
    // Apply order
    if (order === 'asc') {
      comparison = -comparison
    }
    
    // Secondary sort by key for consistency when primary values are equal
    if (comparison === 0) {
      comparison = (a.key || '').localeCompare(b.key || '')
    }
    
    return comparison
  })
  
  return sortedTickets
}

/**
 * Sort grouped tickets Map by period keys
 * @param {Map} groupedTickets - Map of periodKey -> tickets array
 * @param {string} order - 'desc' (newest first) or 'asc' (oldest first)
 * @returns {Map} - New Map with sorted keys
 */
export const sortGroupedTicketsByPeriod = (groupedTickets, order = 'desc') => {
  if (!(groupedTickets instanceof Map)) {
    console.warn('sortGroupedTicketsByPeriod: groupedTickets must be a Map')
    return new Map()
  }
  
  // Sort period keys
  const sortedPeriods = Array.from(groupedTickets.keys()).sort((a, b) => {
    const comparison = a.localeCompare(b)
    return order === 'desc' ? -comparison : comparison
  })
  
  // Create new Map with sorted keys
  const sortedGroupedTickets = new Map()
  sortedPeriods.forEach(periodKey => {
    sortedGroupedTickets.set(periodKey, groupedTickets.get(periodKey))
  })
  
  return sortedGroupedTickets
}

/**
 * Get ticket statistics for a group of tickets
 * @param {Array} tickets - Array of tickets
 * @returns {Object} - Statistics object
 */
export const getTicketGroupStatistics = (tickets) => {
  if (!Array.isArray(tickets) || tickets.length === 0) {
    return {
      count: 0,
      totalStoryPoints: 0,
      averageStoryPoints: 0,
      typeBreakdown: new Map(),
      statusBreakdown: new Map(),
      severityBreakdown: new Map()
    }
  }
  
  const stats = {
    count: tickets.length,
    totalStoryPoints: 0,
    typeBreakdown: new Map(),
    statusBreakdown: new Map(),
    severityBreakdown: new Map()
  }
  
  tickets.forEach(ticket => {
    // Sum story points
    stats.totalStoryPoints += ticket.storyPoints || 0
    
    // Count by type
    const type = ticket.issueType || 'Unknown'
    stats.typeBreakdown.set(type, (stats.typeBreakdown.get(type) || 0) + 1)
    
    // Count by status
    const status = ticket.status || 'Unknown'
    stats.statusBreakdown.set(status, (stats.statusBreakdown.get(status) || 0) + 1)
    
    // Count by severity
    const severity = ticket.severity || 'Unknown'
    stats.severityBreakdown.set(severity, (stats.severityBreakdown.get(severity) || 0) + 1)
  })
  
  stats.averageStoryPoints = stats.count > 0 ? stats.totalStoryPoints / stats.count : 0
  
  return stats
}

/**
 * Filter tickets by multiple criteria
 * @param {Array} tickets - Array of tickets
 * @param {Object} filters - Filter criteria
 * @returns {Array} - Filtered tickets
 */
export const filterTicketsByCriteria = (tickets, filters = {}) => {
  if (!Array.isArray(tickets)) return []
  
  const {
    issueTypes = [],
    statuses = [],
    severities = [],
    projects = [],
    storyPointRange = null, // { min: number, max: number }
    dateRange = null // { startDate: string, endDate: string }
  } = filters
  
  return tickets.filter(ticket => {
    // Filter by issue type
    if (issueTypes.length > 0 && !issueTypes.includes(ticket.issueType)) {
      return false
    }
    
    // Filter by status
    if (statuses.length > 0 && !statuses.includes(ticket.status)) {
      return false
    }
    
    // Filter by severity
    if (severities.length > 0 && !severities.includes(ticket.severity)) {
      return false
    }
    
    // Filter by project
    if (projects.length > 0 && !projects.includes(ticket.project)) {
      return false
    }
    
    // Filter by story point range
    if (storyPointRange) {
      const points = ticket.storyPoints || 0
      if (points < storyPointRange.min || points > storyPointRange.max) {
        return false
      }
    }
    
    // Filter by date range
    if (dateRange) {
      const ticketDate = ticket.resolved || ticket.updated || ticket.created
      if (ticketDate) {
        const date = new Date(ticketDate)
        const startDate = new Date(dateRange.startDate)
        const endDate = new Date(dateRange.endDate)
        
        if (date < startDate || date > endDate) {
          return false
        }
      }
    }
    
    return true
  })
}

// Export all functions as a service object for easy importing
export const ticketGroupingService = {
  groupTicketsByTimeframe,
  sortTicketsWithinPeriod,
  sortGroupedTicketsByPeriod,
  getTicketGroupStatistics,
  filterTicketsByCriteria
}

export default ticketGroupingService