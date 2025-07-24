/**
 * Unified Time Utilities
 * Consolidates all time period calculations to eliminate DRY violations
 * Following .cursorrules conventions - camelCase naming, performance optimizations
 */

/**
 * Get time period key from date string
 * Unified implementation replacing 4 different versions across the codebase
 * @param {string} dateString - ISO date string
 * @param {string} period - 'week', 'month', or 'quarter'
 * @returns {string} - Time period key (e.g., '2024-W12', '2024-03', '2024-Q1')
 */
export const getTimePeriodKey = (dateString, period) => {
  const date = new Date(dateString)
  
  switch (period) {
    case 'week': {
      // ISO week calculation - consistent across all components
      const thursday = new Date(date.getTime())
      thursday.setDate(date.getDate() - ((date.getDay() + 6) % 7) + 3)
      
      const year = thursday.getFullYear()
      const firstThursday = new Date(year, 0, 4)
      firstThursday.setDate(firstThursday.getDate() - ((firstThursday.getDay() + 6) % 7) + 3)
      
      const weekNum = Math.floor((thursday.getTime() - firstThursday.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1
      
      return `${year}-W${weekNum.toString().padStart(2, '0')}`
    }
    case 'quarter': {
      const quarter = Math.ceil((date.getMonth() + 1) / 3)
      return `${date.getFullYear()}-Q${quarter}`
    }
    case 'month':
    default:
      return dateString.substring(0, 7) // YYYY-MM
  }
}

/**
 * Get week date range from week string
 * @param {string} weekString - Week string (e.g., '2024-W12')
 * @returns {Object} - { startDate, endDate, formatted }
 */
export const getWeekDateRange = (weekString) => {
  if (!weekString || !weekString.includes('-W')) {
    return { startDate: null, endDate: null, formatted: weekString }
  }
  
  const [year, weekNum] = weekString.split('-W')
  const yearNum = parseInt(year)
  const week = parseInt(weekNum)
  
  // Calculate the date of the first day of the year
  const firstDayOfYear = new Date(yearNum, 0, 1)
  
  // Calculate the start date of the week (assuming Monday as start of week)
  const daysToAdd = (week - 1) * 7 - firstDayOfYear.getDay() + 1
  const startDate = new Date(yearNum, 0, 1 + daysToAdd)
  
  // Calculate end date (Sunday)
  const endDate = new Date(startDate)
  endDate.setDate(startDate.getDate() + 6)
  
  // Format dates as DD/MM/YYYY
  const formatDate = (date) => {
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  }
  
  return {
    startDate,
    endDate,
    formatted: `${formatDate(startDate)} - ${formatDate(endDate)}`
  }
}

/**
 * Format date to DD/MM/YYYY
 * @param {Date|string} date - Date object or ISO string
 * @returns {string} - Formatted date string
 */
export const formatDateDDMMYYYY = (date) => {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const day = dateObj.getDate().toString().padStart(2, '0')
  const month = (dateObj.getMonth() + 1).toString().padStart(2, '0')
  const year = dateObj.getFullYear()
  return `${day}/${month}/${year}`
}