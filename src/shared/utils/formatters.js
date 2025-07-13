export const formatNumber = (num) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

export const formatPercentage = (num) => {
  return `${(num * 100).toFixed(1)}%`
}

export const formatCurrency = (num, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(num)
}

// Re-export date formatting functions from centralized date utilities
export { formatDate, formatRelativeDate, formatDateRange } from './dateUtils.js'

// Enhanced time formatting using centralized utilities
export const formatTime = (date) => {
  const d = new Date(date)
  if (!d || isNaN(d.getTime())) return ''
  
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}