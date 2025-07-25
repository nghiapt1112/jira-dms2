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
  if (!dateString) return ''
  
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return ''
  
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
 * Get week date range from week string using ISO week calculation
 * FIXED: Now uses consistent ISO week algorithm matching services
 * @param {string} weekString - Week string (e.g., '2024-W12')
 * @returns {Object} - { startDate, endDate, formatted }
 */
export const getWeekDateRange = (weekString) => {
  if (!weekString || !weekString.includes('-W')) {
    return { startDate: null, endDate: null, formatted: weekString }
  }
  
  const [yearStr, weekStr] = weekString.split('-W')
  const year = parseInt(yearStr)
  const week = parseInt(weekStr)
  
  // ISO week calculation - consistent with getTimePeriodKey
  // Find first Thursday of the year
  const firstThursday = new Date(year, 0, 4)
  firstThursday.setDate(firstThursday.getDate() - ((firstThursday.getDay() + 6) % 7) + 3)
  
  // Calculate the Thursday of the target week
  const targetThursday = new Date(firstThursday.getTime() + (week - 1) * 7 * 24 * 60 * 60 * 1000)
  
  // Week runs from Monday to Sunday
  const startDate = new Date(targetThursday)
  startDate.setDate(targetThursday.getDate() - 3) // Monday
  
  const endDate = new Date(targetThursday)
  endDate.setDate(targetThursday.getDate() + 3) // Sunday
  
  return {
    startDate,
    endDate,
    formatted: `${formatDateDDMMYYYY(startDate)} - ${formatDateDDMMYYYY(endDate)}`
  }
}

/**
 * Format date to DD/MM/YYYY
 * @param {Date|string} date - Date object or ISO string
 * @returns {string} - Formatted date string
 */
export const formatDateDDMMYYYY = (date) => {
  if (!date || (!(date instanceof Date) && typeof date !== 'string')) return 'Invalid Date'
  
  const dateObj = typeof date === 'string' ? new Date(date) : date
  if (isNaN(dateObj.getTime())) return 'Invalid Date'
  
  const day = dateObj.getDate().toString().padStart(2, '0')
  const month = (dateObj.getMonth() + 1).toString().padStart(2, '0')
  const year = dateObj.getFullYear()
  return `${day}/${month}/${year}`
}

// ==========================================
// CONSOLIDATION WRAPPER FUNCTIONS
// Replacing duplicate functions from services
// ==========================================

/**
 * Get week from date string - WRAPPER for getTimePeriodKey
 * Replaces duplicate implementations in developerQualityService.js and filterService.js
 * @param {string} dateString - ISO date string
 * @returns {string} - Week identifier (e.g., '2024-W12')
 */
export const getWeekFromDate = (dateString) => {
  return getTimePeriodKey(dateString, 'week')
}

/**
 * Get quarter from date string - WRAPPER for getTimePeriodKey
 * Replaces duplicate implementations in developerQualityService.js and filterService.js
 * @param {string} dateString - ISO date string
 * @returns {string} - Quarter identifier (e.g., '2024-Q1')
 */
export const getQuarterFromDate = (dateString) => {
  return getTimePeriodKey(dateString, 'quarter')
}

/**
 * Get months for a quarter
 * Moved from developerQualityService.js for reusability
 * @param {string} quarter - Quarter string (e.g., '2024-Q1')
 * @returns {Array} - Array of month strings (e.g., ['2024-01', '2024-02', '2024-03'])
 */
export const getMonthsInQuarter = (quarter) => {
  const [year, q] = quarter.split('-Q')
  const quarterNum = parseInt(q)
  const startMonth = (quarterNum - 1) * 3 + 1
  
  return [
    `${year}-${startMonth.toString().padStart(2, '0')}`,
    `${year}-${(startMonth + 1).toString().padStart(2, '0')}`,
    `${year}-${(startMonth + 2).toString().padStart(2, '0')}`
  ]
}

/**
 * Get quarter from month string
 * Helper function for month-to-quarter conversion
 * @param {string} month - Month string (e.g., '2024-03')
 * @returns {string} - Quarter string (e.g., '2024-Q1')
 */
export const getQuarterFromMonth = (month) => {
  const [year, monthNum] = month.split('-')
  const quarter = Math.ceil(parseInt(monthNum) / 3)
  return `${year}-Q${quarter}`
}

/**
 * Generate quarter data from monthly data
 * Moved from developerQualityService.js for reusability
 * @param {Map} monthlyData - Monthly story points data (Map<month, Map<developer, points>>)
 * @param {string} targetQuarter - Target quarter (e.g., '2024-Q1')
 * @returns {Array} - Quarter chart data array
 */
export const generateQuarterDataFromMonths = (monthlyData, targetQuarter) => {
  const quarterMonths = getMonthsInQuarter(targetQuarter)
  const quarterData = new Map()
  
  quarterMonths.forEach(month => {
    const monthData = monthlyData.get(month) || new Map()
    monthData.forEach((storyPoints, developer) => {
      if (!quarterData.has(developer)) {
        quarterData.set(developer, 0)
      }
      quarterData.set(developer, quarterData.get(developer) + storyPoints)
    })
  })
  
  return Array.from(quarterData.entries()).map(([developer, storyPoints]) => ({
    timePeriod: targetQuarter,
    developer,
    storyPoints
  }))
}