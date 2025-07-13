/**
 * Centralized date and time utilities for the JIRA DMS application
 * All date/time operations should use these utilities for consistency
 */

// Time constants
export const TIME_CONSTANTS = {
  MILLISECONDS_PER_SECOND: 1000,
  MILLISECONDS_PER_MINUTE: 1000 * 60,
  MILLISECONDS_PER_HOUR: 1000 * 60 * 60,
  MILLISECONDS_PER_DAY: 1000 * 60 * 60 * 24,
  SECONDS_PER_MINUTE: 60,
  SECONDS_PER_HOUR: 60 * 60,
  SECONDS_PER_DAY: 24 * 60 * 60,
  HOURS_PER_DAY: 24,
  DAYS_PER_WEEK: 7,
  DAYS_PER_MONTH: 30, // Average for calculations
  DAYS_PER_YEAR: 365,
  DEFAULT_CACHE_EXPIRY_HOURS: 24,
  DEFAULT_RECENT_ACTIVITY_DAYS: 30,
  JWT_BUFFER_MINUTES: 5 // Buffer time before JWT expiration
}

// Date formats
export const DATE_FORMATS = {
  ISO_DATE: 'YYYY-MM-DD',
  ISO_DATETIME: 'YYYY-MM-DDTHH:mm:ss.SSSZ',
  DISPLAY_DATE: 'MMM DD, YYYY',
  DISPLAY_DATETIME: 'MMM DD, YYYY HH:mm',
  MONTH_YEAR: 'YYYY-MM',
  YEAR_MONTH_DAY: 'YYYY/MM/DD',
  RELATIVE_TIME: 'relative'
}

// ==========================================
// CORE DATE OPERATIONS
// ==========================================

/**
 * Create a date safely with validation
 * @param {string|number|Date} input - Date input
 * @returns {Date|null} Valid date or null
 */
export const createDate = (input) => {
  if (!input) return null
  const date = new Date(input)
  return isValidDate(date) ? date : null
}

/**
 * Check if a date is valid
 * @param {Date} date - Date to validate
 * @returns {boolean} True if valid
 */
export const isValidDate = (date) => {
  return date instanceof Date && !isNaN(date.getTime())
}

/**
 * Get current date
 * @returns {Date} Current date
 */
export const getCurrentDate = () => new Date()

/**
 * Get current timestamp
 * @returns {number} Current timestamp in milliseconds
 */
export const getCurrentTimestamp = () => Date.now()

/**
 * Get current timestamp in seconds (for JWT)
 * @returns {number} Current timestamp in seconds
 */
export const getCurrentTimestampSeconds = () => Math.floor(Date.now() / 1000)

// ==========================================
// DATE CALCULATIONS
// ==========================================

/**
 * Calculate days between two dates
 * @param {Date|string} startDate - Start date
 * @param {Date|string} endDate - End date
 * @returns {number} Number of days (can be negative)
 */
export const daysBetween = (startDate, endDate) => {
  const start = createDate(startDate)
  const end = createDate(endDate)
  if (!start || !end) return 0
  
  return Math.ceil((end.getTime() - start.getTime()) / TIME_CONSTANTS.MILLISECONDS_PER_DAY)
}

/**
 * Calculate hours between two dates
 * @param {Date|string} startDate - Start date
 * @param {Date|string} endDate - End date
 * @returns {number} Number of hours (can be negative)
 */
export const hoursBetween = (startDate, endDate) => {
  const start = createDate(startDate)
  const end = createDate(endDate)
  if (!start || !end) return 0
  
  return Math.ceil((end.getTime() - start.getTime()) / TIME_CONSTANTS.MILLISECONDS_PER_HOUR)
}

/**
 * Add days to a date
 * @param {Date|string} date - Base date
 * @param {number} days - Days to add (can be negative)
 * @returns {Date|null} New date or null
 */
export const addDays = (date, days) => {
  const baseDate = createDate(date)
  if (!baseDate) return null
  
  const newDate = new Date(baseDate)
  newDate.setDate(newDate.getDate() + days)
  return newDate
}

/**
 * Subtract days from a date
 * @param {Date|string} date - Base date
 * @param {number} days - Days to subtract
 * @returns {Date|null} New date or null
 */
export const subtractDays = (date, days) => addDays(date, -days)

/**
 * Add hours to a date
 * @param {Date|string} date - Base date
 * @param {number} hours - Hours to add (can be negative)
 * @returns {Date|null} New date or null
 */
export const addHours = (date, hours) => {
  const baseDate = createDate(date)
  if (!baseDate) return null
  
  const newDate = new Date(baseDate)
  newDate.setTime(newDate.getTime() + (hours * TIME_CONSTANTS.MILLISECONDS_PER_HOUR))
  return newDate
}

/**
 * Get date N hours ago
 * @param {number} hours - Hours ago
 * @returns {Date} Date N hours ago
 */
export const hoursAgo = (hours) => addHours(getCurrentDate(), -hours)

/**
 * Get date N days ago
 * @param {number} days - Days ago
 * @returns {Date} Date N days ago
 */
export const daysAgo = (days) => addDays(getCurrentDate(), -days)

// ==========================================
// DATE COMPARISONS
// ==========================================

/**
 * Check if first date is after second date
 * @param {Date|string} date1 - First date
 * @param {Date|string} date2 - Second date
 * @returns {boolean} True if date1 is after date2
 */
export const isAfter = (date1, date2) => {
  const d1 = createDate(date1)
  const d2 = createDate(date2)
  if (!d1 || !d2) return false
  return d1.getTime() > d2.getTime()
}

/**
 * Check if first date is before second date
 * @param {Date|string} date1 - First date
 * @param {Date|string} date2 - Second date
 * @returns {boolean} True if date1 is before date2
 */
export const isBefore = (date1, date2) => {
  const d1 = createDate(date1)
  const d2 = createDate(date2)
  if (!d1 || !d2) return false
  return d1.getTime() < d2.getTime()
}

/**
 * Check if two dates are the same day
 * @param {Date|string} date1 - First date
 * @param {Date|string} date2 - Second date
 * @returns {boolean} True if same day
 */
export const isSameDay = (date1, date2) => {
  const d1 = createDate(date1)
  const d2 = createDate(date2)
  if (!d1 || !d2) return false
  
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate()
}

/**
 * Check if date is within range (inclusive)
 * @param {Date|string} date - Date to check
 * @param {Date|string} startDate - Range start
 * @param {Date|string} endDate - Range end
 * @returns {boolean} True if within range
 */
export const isWithinRange = (date, startDate, endDate) => {
  const d = createDate(date)
  const start = createDate(startDate)
  const end = createDate(endDate)
  if (!d || !start || !end) return false
  
  return d.getTime() >= start.getTime() && d.getTime() <= end.getTime()
}

// ==========================================
// AGE AND DURATION
// ==========================================

/**
 * Get age of date in days
 * @param {Date|string} date - Date to calculate age for
 * @returns {number} Age in days
 */
export const getAgeInDays = (date) => {
  return daysBetween(date, getCurrentDate())
}

/**
 * Get age of date in hours
 * @param {Date|string} date - Date to calculate age for
 * @returns {number} Age in hours
 */
export const getAgeInHours = (date) => {
  return hoursBetween(date, getCurrentDate())
}

/**
 * Get time until expiration
 * @param {Date|string} expirationDate - Expiration date
 * @returns {number} Days until expiration (negative if expired)
 */
export const getTimeUntilExpiration = (expirationDate) => {
  return daysBetween(getCurrentDate(), expirationDate)
}

// ==========================================
// MONTH/YEAR OPERATIONS
// ==========================================

/**
 * Get month key (YYYY-MM format)
 * @param {Date|string} date - Date to format
 * @returns {string} Month key or empty string
 */
export const getMonthKey = (date) => {
  const d = createDate(date)
  if (!d) return ''
  
  const year = d.getFullYear()
  const month = (d.getMonth() + 1).toString().padStart(2, '0')
  return `${year}-${month}`
}

/**
 * Get year-month key (same as getMonthKey, for compatibility)
 * @param {Date|string} date - Date to format
 * @returns {string} Year-month key
 */
export const getYearMonthKey = (date) => getMonthKey(date)

/**
 * Get start of month
 * @param {Date|string} date - Date to get start of month for
 * @returns {Date|null} Start of month or null
 */
export const startOfMonth = (date) => {
  const d = createDate(date)
  if (!d) return null
  
  const startDate = new Date(d)
  startDate.setDate(1)
  startDate.setHours(0, 0, 0, 0)
  return startDate
}

/**
 * Get end of month
 * @param {Date|string} date - Date to get end of month for
 * @returns {Date|null} End of month or null
 */
export const endOfMonth = (date) => {
  const d = createDate(date)
  if (!d) return null
  
  const endDate = new Date(d)
  endDate.setMonth(endDate.getMonth() + 1, 0)
  endDate.setHours(23, 59, 59, 999)
  return endDate
}

// ==========================================
// DATE FORMATTING
// ==========================================

/**
 * Format date to ISO string (YYYY-MM-DD)
 * @param {Date|string} date - Date to format
 * @returns {string} ISO date string or empty string
 */
export const formatToISODate = (date) => {
  const d = createDate(date)
  if (!d) return ''
  return d.toISOString().split('T')[0]
}

/**
 * Format date for display
 * @param {Date|string} date - Date to format
 * @param {string} format - Format type (default: 'DISPLAY_DATE')
 * @returns {string} Formatted date string
 */
export const formatDate = (date, format = DATE_FORMATS.DISPLAY_DATE) => {
  const d = createDate(date)
  if (!d) return ''
  
  switch (format) {
    case DATE_FORMATS.ISO_DATE:
      return formatToISODate(d)
    case DATE_FORMATS.ISO_DATETIME:
      return d.toISOString()
    case DATE_FORMATS.MONTH_YEAR:
      return getMonthKey(d)
    case DATE_FORMATS.YEAR_MONTH_DAY:
      return `${d.getFullYear()}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')}`
    case DATE_FORMATS.RELATIVE_TIME:
      return formatRelativeDate(d)
    case DATE_FORMATS.DISPLAY_DATETIME:
      return d.toLocaleString()
    default:
      return d.toLocaleDateString()
  }
}

/**
 * Format relative date (e.g., "2 days ago")
 * @param {Date|string} date - Date to format
 * @returns {string} Relative date string
 */
export const formatRelativeDate = (date) => {
  const d = createDate(date)
  if (!d) return ''
  
  const now = getCurrentDate()
  const diffMs = now.getTime() - d.getTime()
  const diffDays = Math.floor(diffMs / TIME_CONSTANTS.MILLISECONDS_PER_DAY)
  const diffHours = Math.floor(diffMs / TIME_CONSTANTS.MILLISECONDS_PER_HOUR)
  const diffMinutes = Math.floor(diffMs / TIME_CONSTANTS.MILLISECONDS_PER_MINUTE)
  
  if (diffDays > 30) {
    return formatDate(d, DATE_FORMATS.DISPLAY_DATE)
  } else if (diffDays > 0) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  } else if (diffHours > 0) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  } else if (diffMinutes > 0) {
    return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`
  } else {
    return 'Just now'
  }
}

/**
 * Format date range
 * @param {Date|string} startDate - Start date
 * @param {Date|string} endDate - End date
 * @param {string} format - Format type
 * @returns {string} Formatted date range
 */
export const formatDateRange = (startDate, endDate, format = DATE_FORMATS.DISPLAY_DATE) => {
  const start = formatDate(startDate, format)
  const end = formatDate(endDate, format)
  if (!start || !end) return start || end || ''
  return `${start} - ${end}`
}

// ==========================================
// SPECIALIZED FUNCTIONS
// ==========================================

/**
 * Check if JWT token is expired
 * @param {string} token - JWT token
 * @returns {boolean} True if expired
 */
export const isJwtExpired = (token) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    const expirationTime = payload.exp * 1000 // Convert to milliseconds
    const bufferTime = TIME_CONSTANTS.JWT_BUFFER_MINUTES * TIME_CONSTANTS.MILLISECONDS_PER_MINUTE
    return Date.now() >= (expirationTime - bufferTime)
  } catch (error) {
    return true // Treat invalid tokens as expired
  }
}

/**
 * Get JWT expiration date
 * @param {string} token - JWT token
 * @returns {Date|null} Expiration date or null
 */
export const getJwtExpiration = (token) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return new Date(payload.exp * 1000)
  } catch (error) {
    return null
  }
}

/**
 * Get time until JWT token expiration
 * @param {string} token - JWT token
 * @returns {number} Minutes until expiration (negative if expired)
 */
export const getTimeUntilJwtExpiration = (token) => {
  const expirationDate = getJwtExpiration(token)
  if (!expirationDate) return -1
  
  const diffMs = expirationDate.getTime() - Date.now()
  return Math.floor(diffMs / TIME_CONSTANTS.MILLISECONDS_PER_MINUTE)
}

/**
 * Check if cache is expired
 * @param {number} timestamp - Cache timestamp in milliseconds
 * @param {number} maxAgeHours - Maximum age in hours (default: 24)
 * @returns {boolean} True if expired
 */
export const isCacheExpired = (timestamp, maxAgeHours = TIME_CONSTANTS.DEFAULT_CACHE_EXPIRY_HOURS) => {
  const ageMs = Date.now() - timestamp
  const maxAgeMs = maxAgeHours * TIME_CONSTANTS.MILLISECONDS_PER_HOUR
  return ageMs > maxAgeMs
}

/**
 * Get cache age in hours
 * @param {number} timestamp - Cache timestamp in milliseconds
 * @returns {number} Age in hours
 */
export const getCacheAge = (timestamp) => {
  const ageMs = Date.now() - timestamp
  return Math.floor(ageMs / TIME_CONSTANTS.MILLISECONDS_PER_HOUR)
}

/**
 * Get recent activity cutoff date
 * @param {number} days - Number of days back (default: 30)
 * @returns {Date} Cutoff date
 */
export const getRecentActivityCutoff = (days = TIME_CONSTANTS.DEFAULT_RECENT_ACTIVITY_DAYS) => {
  return daysAgo(days)
}

/**
 * Calculate project delay in days
 * @param {Date|string} dueDate - Due date
 * @param {Date|string} completionDate - Completion date
 * @returns {number} Delay in days (negative if early, 0 if on time)
 */
export const calculateProjectDelayDays = (dueDate, completionDate) => {
  const due = createDate(dueDate)
  const completion = createDate(completionDate)
  if (!due || !completion) return 0
  
  return Math.max(0, daysBetween(due, completion))
}

/**
 * Get sprint metrics timeframe based on date
 * @param {Date|string} date - Date to get timeframe for
 * @returns {string} Timeframe identifier
 */
export const getSprintMetricsTimeframe = (date) => {
  const d = createDate(date)
  if (!d) return ''
  
  // Calculate week of year
  const startOfYear = new Date(d.getFullYear(), 0, 1)
  const dayOfYear = Math.floor((d.getTime() - startOfYear.getTime()) / TIME_CONSTANTS.MILLISECONDS_PER_DAY)
  const weekOfYear = Math.ceil((dayOfYear + startOfYear.getDay() + 1) / TIME_CONSTANTS.DAYS_PER_WEEK)
  
  return `${d.getFullYear()}-W${weekOfYear.toString().padStart(2, '0')}`
}

// ==========================================
// EXPORTS
// ==========================================

export default {
  // Constants
  TIME_CONSTANTS,
  DATE_FORMATS,
  
  // Core operations
  createDate,
  isValidDate,
  getCurrentDate,
  getCurrentTimestamp,
  getCurrentTimestampSeconds,
  
  // Calculations
  daysBetween,
  hoursBetween,
  addDays,
  subtractDays,
  addHours,
  hoursAgo,
  daysAgo,
  
  // Comparisons
  isAfter,
  isBefore,
  isSameDay,
  isWithinRange,
  
  // Age and duration
  getAgeInDays,
  getAgeInHours,
  getTimeUntilExpiration,
  
  // Month/year operations
  getMonthKey,
  getYearMonthKey,
  startOfMonth,
  endOfMonth,
  
  // Formatting
  formatToISODate,
  formatDate,
  formatRelativeDate,
  formatDateRange,
  
  // Specialized functions
  isJwtExpired,
  getJwtExpiration,
  getTimeUntilJwtExpiration,
  isCacheExpired,
  getCacheAge,
  getRecentActivityCutoff,
  calculateProjectDelayDays,
  getSprintMetricsTimeframe
}