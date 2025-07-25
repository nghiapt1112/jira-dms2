/**
 * Ticket Table Utilities
 * Helper functions for formatting and displaying ticket data in tables
 * Following .cursorrules conventions - camelCase naming, performance optimizations
 */

import { formatDateDDMMYYYY, getWeekDateRange } from '../../../shared/utils/timeUtils'

/**
 * Format ticket date with fallback logic
 * Uses resolved date first, then updated date, then created date
 * @param {Object} ticket - Ticket object with date fields
 * @param {Object} options - Formatting options
 * @returns {string} - Formatted date string
 */
export const formatTicketDate = (ticket, options = {}) => {
  const {
    preferResolved = true,
    format = 'DD/MM/YYYY',
    fallbackText = 'No date',
    includeTime = false
  } = options
  
  if (!ticket) return fallbackText
  
  let dateToUse = null
  
  if (preferResolved) {
    // Use resolved date first, fall back to updated, then created
    dateToUse = ticket.resolved || ticket.updated || ticket.created
  } else {
    // Use updated date first, fall back to resolved, then created
    dateToUse = ticket.updated || ticket.resolved || ticket.created
  }
  
  if (!dateToUse) return fallbackText
  
  switch (format) {
    case 'DD/MM/YYYY':
      return formatDateDDMMYYYY(dateToUse)
    case 'relative': {
      const date = new Date(dateToUse)
      const now = new Date()
      const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24))
      
      if (diffInDays === 0) return 'Today'
      if (diffInDays === 1) return 'Yesterday'
      if (diffInDays < 7) return `${diffInDays} days ago`
      if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`
      if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`
      return `${Math.floor(diffInDays / 365)} years ago`
    }
    case 'ISO':
      return new Date(dateToUse).toISOString().split('T')[0]
    default:
      return formatDateDDMMYYYY(dateToUse)
  }
}

/**
 * Get display properties for issue type
 * @param {string} issueType - Issue type string
 * @returns {Object} - Display properties with icon, color, label
 */
export const getIssueTypeDisplay = (issueType) => {
  const normalizedType = (issueType || 'unknown').toLowerCase()
  
  const typeMap = {
    bug: {
      label: 'Bug',
      color: 'error',
      icon: 'BugReport',
      priority: 1
    },
    story: {
      label: 'Story',
      color: 'primary',
      icon: 'History',
      priority: 2
    },
    task: {
      label: 'Task',
      color: 'default',
      icon: 'Assignment',
      priority: 3
    },
    epic: {
      label: 'Epic',
      color: 'secondary',
      icon: 'Flag',
      priority: 4
    },
    subtask: {
      label: 'Sub-task',
      color: 'info',
      icon: 'SubdirectoryArrowRight',
      priority: 5
    },
    improvement: {
      label: 'Improvement',
      color: 'success',
      icon: 'TrendingUp',
      priority: 6
    },
    unknown: {
      label: 'Unknown',
      color: 'default',
      icon: 'Help',
      priority: 99
    }
  }
  
  return typeMap[normalizedType] || typeMap.unknown
}

/**
 * Get display properties for status
 * @param {string} status - Status string
 * @returns {Object} - Display properties with icon, color, label
 */
export const getStatusDisplay = (status) => {
  const normalizedStatus = (status || 'unknown').toLowerCase()
  
  const statusMap = {
    'done': {
      label: 'Done',
      color: 'success',
      icon: 'CheckCircle',
      category: 'completed',
      priority: 1
    },
    'closed': {
      label: 'Closed',
      color: 'success',
      icon: 'CheckCircle',
      category: 'completed',
      priority: 1
    },
    'resolved': {
      label: 'Resolved',
      color: 'success',
      icon: 'CheckCircle',
      category: 'completed',
      priority: 1
    },
    'in progress': {
      label: 'In Progress',
      color: 'primary',
      icon: 'Schedule',
      category: 'active',
      priority: 2
    },
    'in review': {
      label: 'In Review',
      color: 'primary',
      icon: 'RateReview',
      category: 'active',
      priority: 2
    },
    'to do': {
      label: 'To Do',
      color: 'default',
      icon: 'Pause',
      category: 'pending',
      priority: 3
    },
    'open': {
      label: 'Open',
      color: 'default',
      icon: 'RadioButtonUnchecked',
      category: 'pending',
      priority: 3
    },
    'new': {
      label: 'New',
      color: 'info',
      icon: 'FiberNew',
      category: 'pending',
      priority: 3
    },
    'blocked': {
      label: 'Blocked',
      color: 'error',
      icon: 'Block',
      category: 'blocked',
      priority: 4
    },
    'unknown': {
      label: 'Unknown',
      color: 'default',
      icon: 'Help',
      category: 'unknown',
      priority: 99
    }
  }
  
  return statusMap[normalizedStatus] || statusMap.unknown
}

/**
 * Get display properties for severity
 * @param {string} severity - Severity string
 * @returns {Object} - Display properties with color, weight, label
 */
export const getSeverityDisplay = (severity) => {
  const normalizedSeverity = (severity || 'unknown').toLowerCase()
  
  const severityMap = {
    critical: {
      label: 'Critical',
      color: 'error',
      weight: 4,
      priority: 1
    },
    major: {
      label: 'Major',
      color: 'warning',
      weight: 3,
      priority: 2
    },
    minor: {
      label: 'Minor',
      color: 'info',
      weight: 2,
      priority: 3
    },
    trivial: {
      label: 'Trivial',
      color: 'default',
      weight: 1,
      priority: 4
    },
    unknown: {
      label: 'Unknown',
      color: 'default',
      weight: 0,
      priority: 99
    }
  }
  
  return severityMap[normalizedSeverity] || severityMap.unknown
}

/**
 * Format story points with appropriate display
 * @param {number} storyPoints - Story points value
 * @param {Object} options - Formatting options
 * @returns {Object} - Formatted story points with display properties
 */
export const formatStoryPoints = (storyPoints, options = {}) => {
  const {
    showZero = false,
    emptyText = '-',
    addSuffix = false
  } = options
  
  if (!storyPoints && storyPoints !== 0) {
    return {
      display: emptyText,
      value: 0,
      color: 'text.secondary',
      weight: 'normal'
    }
  }
  
  if (storyPoints === 0 && !showZero) {
    return {
      display: emptyText,
      value: 0,
      color: 'text.secondary',
      weight: 'normal'
    }
  }
  
  const suffix = addSuffix ? ' SP' : ''
  
  return {
    display: `${storyPoints}${suffix}`,
    value: storyPoints,
    color: storyPoints > 0 ? 'text.primary' : 'text.secondary',
    weight: storyPoints > 0 ? 'medium' : 'normal'
  }
}

/**
 * Format time period label for display
 * @param {string} periodKey - Period key (e.g., '2024-01', '2024-W12', '2024-Q1')
 * @param {string} timeframe - Timeframe type ('week', 'month', 'quarter')
 * @returns {string} - Formatted period label
 */
export const formatPeriodLabel = (periodKey, timeframe) => {
  if (!periodKey) return 'Unknown Period'
  
  switch (timeframe) {
    case 'week': {
      const weekRange = getWeekDateRange(periodKey)
      if (weekRange.formatted === periodKey) {
        // Fallback if week range calculation fails
        return `Week ${periodKey}`
      }
      return `Week ${periodKey} (${weekRange.formatted})`
    }
    case 'quarter': {
      const [year, quarter] = periodKey.split('-Q')
      return `Q${quarter} ${year}`
    }
    case 'month':
    default: {
      const [year, month] = periodKey.split('-')
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ]
      const monthIndex = parseInt(month) - 1
      if (monthIndex >= 0 && monthIndex < 12) {
        return `${monthNames[monthIndex]} ${year}`
      }
      return periodKey // Fallback to raw key
    }
  }
}

/**
 * Sort tickets by various criteria
 * @param {Array} tickets - Array of tickets to sort
 * @param {string} sortBy - Sort criteria
 * @param {string} order - Sort order ('asc' or 'desc')
 * @returns {Array} - Sorted tickets array
 */
export const sortTickets = (tickets, sortBy = 'date', order = 'desc') => {
  if (!Array.isArray(tickets)) return []
  
  const sortedTickets = [...tickets]
  
  sortedTickets.sort((a, b) => {
    let comparison = 0
    
    switch (sortBy) {
      case 'key':
        comparison = (a.key || '').localeCompare(b.key || '')
        break
      case 'type':
        const aTypePriority = getIssueTypeDisplay(a.issueType).priority
        const bTypePriority = getIssueTypeDisplay(b.issueType).priority
        comparison = aTypePriority - bTypePriority
        break
      case 'status':
        const aStatusPriority = getStatusDisplay(a.status).priority
        const bStatusPriority = getStatusDisplay(b.status).priority
        comparison = aStatusPriority - bStatusPriority
        break
      case 'storyPoints':
        comparison = (a.storyPoints || 0) - (b.storyPoints || 0)
        break
      case 'date': {
        const aDate = new Date(a.resolved || a.updated || a.created || 0)
        const bDate = new Date(b.resolved || b.updated || b.created || 0)
        comparison = aDate - bDate
        break
      }
      case 'project':
        comparison = (a.project || '').localeCompare(b.project || '')
        break
      case 'severity':
        const aSeverityPriority = getSeverityDisplay(a.severity).priority
        const bSeverityPriority = getSeverityDisplay(b.severity).priority
        comparison = aSeverityPriority - bSeverityPriority
        break
      default:
        comparison = (a.key || '').localeCompare(b.key || '')
        break
    }
    
    // Apply order
    if (order === 'desc') {
      comparison = -comparison
    }
    
    // Secondary sort by key for consistency
    if (comparison === 0) {
      comparison = (a.key || '').localeCompare(b.key || '')
    }
    
    return comparison
  })
  
  return sortedTickets
}

/**
 * Get ticket summary statistics
 * @param {Array} tickets - Array of tickets
 * @returns {Object} - Statistics object
 */
export const getTicketSummaryStats = (tickets) => {
  if (!Array.isArray(tickets) || tickets.length === 0) {
    return {
      count: 0,
      totalStoryPoints: 0,
      averageStoryPoints: 0,
      typeBreakdown: {},
      statusBreakdown: {},
      severityBreakdown: {}
    }
  }
  
  const stats = {
    count: tickets.length,
    totalStoryPoints: 0,
    typeBreakdown: {},
    statusBreakdown: {},
    severityBreakdown: {}
  }
  
  tickets.forEach(ticket => {
    // Sum story points
    stats.totalStoryPoints += ticket.storyPoints || 0
    
    // Count by type
    const type = ticket.issueType || 'Unknown'
    stats.typeBreakdown[type] = (stats.typeBreakdown[type] || 0) + 1
    
    // Count by status
    const status = ticket.status || 'Unknown'
    stats.statusBreakdown[status] = (stats.statusBreakdown[status] || 0) + 1
    
    // Count by severity
    const severity = ticket.severity || 'Unknown'
    stats.severityBreakdown[severity] = (stats.severityBreakdown[severity] || 0) + 1
  })
  
  stats.averageStoryPoints = stats.count > 0 ? stats.totalStoryPoints / stats.count : 0
  
  return stats
}

/**
 * Check if a ticket matches search criteria
 * @param {Object} ticket - Ticket object
 * @param {string} searchTerm - Search term
 * @returns {boolean} - Whether ticket matches search
 */
export const matchesSearch = (ticket, searchTerm) => {
  if (!searchTerm || !ticket) return true
  
  const term = searchTerm.toLowerCase()
  
  const searchableFields = [
    ticket.key,
    ticket.summary,
    ticket.issueType,
    ticket.status,
    ticket.severity,
    ticket.project,
    ticket.assignee,
    ticket.rootCause
  ]
  
  return searchableFields.some(field => 
    field && field.toString().toLowerCase().includes(term)
  )
}

/**
 * Export all utilities as a single object for easy importing
 */
export const ticketTableUtils = {
  formatTicketDate,
  getIssueTypeDisplay,
  getStatusDisplay,
  getSeverityDisplay,
  formatStoryPoints,
  formatPeriodLabel,
  sortTickets,
  getTicketSummaryStats,
  matchesSearch
}

export default ticketTableUtils