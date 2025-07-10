/**
 * Utility functions for progress calculations and formatting
 */

/**
 * Format file size in human readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Format time duration in human readable format
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted time duration
 */
export const formatDuration = (seconds) => {
  if (!seconds || !isFinite(seconds) || seconds < 0) return 'Calculating...'
  
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  } else {
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }
}

/**
 * Calculate download speed in human readable format
 * @param {number} downloadedBytes - Bytes downloaded
 * @param {number} elapsedTimeMs - Elapsed time in milliseconds
 * @returns {string} Formatted download speed
 */
export const calculateDownloadSpeed = (downloadedBytes, elapsedTimeMs) => {
  if (!downloadedBytes || !elapsedTimeMs || elapsedTimeMs === 0) return '0 B/s'
  
  const bytesPerSecond = downloadedBytes / (elapsedTimeMs / 1000)
  return `${formatFileSize(bytesPerSecond)}/s`
}

/**
 * Calculate estimated time remaining
 * @param {number} totalBytes - Total bytes to download
 * @param {number} downloadedBytes - Bytes already downloaded
 * @param {number} elapsedTimeMs - Elapsed time in milliseconds
 * @returns {number|null} Estimated time remaining in seconds, or null if cannot calculate
 */
export const calculateETA = (totalBytes, downloadedBytes, elapsedTimeMs) => {
  if (!totalBytes || !downloadedBytes || !elapsedTimeMs || elapsedTimeMs === 0) return null
  
  const bytesPerSecond = downloadedBytes / (elapsedTimeMs / 1000)
  const remainingBytes = totalBytes - downloadedBytes
  
  if (remainingBytes <= 0) return 0
  if (bytesPerSecond <= 0) return null
  
  const eta = remainingBytes / bytesPerSecond
  return isFinite(eta) && eta > 0 ? eta : null
}

/**
 * Calculate overall progress percentage
 * @param {Object} downloadProgress - Download progress object
 * @returns {number} Overall progress percentage (0-100)
 */
export const calculateOverallProgress = (downloadProgress) => {
  if (!downloadProgress || typeof downloadProgress !== 'object') return 0
  
  const progressEntries = Object.values(downloadProgress)
  if (progressEntries.length === 0) return 0
  
  const totalProgress = progressEntries.reduce((sum, progress) => {
    return sum + (progress.percent || 0)
  }, 0)
  
  return Math.round(totalProgress / progressEntries.length)
}

/**
 * Get download statistics summary
 * @param {Object} downloadProgress - Download progress object
 * @returns {Object} Download statistics
 */
export const getDownloadStats = (downloadProgress) => {
  if (!downloadProgress || typeof downloadProgress !== 'object') {
    return {
      totalFiles: 0,
      completedFiles: 0,
      failedFiles: 0,
      inProgressFiles: 0,
      pendingFiles: 0,
      totalBytes: 0,
      downloadedBytes: 0
    }
  }
  
  const progressEntries = Object.values(downloadProgress)
  
  return {
    totalFiles: progressEntries.length,
    completedFiles: progressEntries.filter(p => p.status === 'completed').length,
    failedFiles: progressEntries.filter(p => p.status === 'failed').length,
    inProgressFiles: progressEntries.filter(p => p.status === 'downloading').length,
    pendingFiles: progressEntries.filter(p => p.status === 'pending').length,
    totalBytes: progressEntries.reduce((sum, p) => sum + (p.total || 0), 0),
    downloadedBytes: progressEntries.reduce((sum, p) => sum + (p.loaded || 0), 0)
  }
}

/**
 * Format numbers with thousands separators
 * @param {number} num - Number to format
 * @returns {string} Formatted number
 */
export const formatNumber = (num) => {
  if (num === null || num === undefined) return '0'
  return num.toLocaleString()
}

/**
 * Get status color for Material-UI components
 * @param {string} status - Download status
 * @returns {string} Material-UI color
 */
export const getStatusColor = (status) => {
  switch (status) {
    case 'completed':
      return 'success'
    case 'failed':
      return 'error'
    case 'downloading':
      return 'primary'
    case 'pending':
      return 'default'
    default:
      return 'default'
  }
}

/**
 * Get loading stage display information
 * @param {string} stage - Loading stage
 * @returns {Object} Display information with text and color
 */
export const getStageDisplay = (stage) => {
  switch (stage) {
    case 'fetching-urls':
      return { text: 'Fetching URLs', color: 'info' }
    case 'downloading-files':
      return { text: 'Downloading Files', color: 'primary' }
    case 'processing-data':
      return { text: 'Processing Data', color: 'secondary' }
    default:
      return { text: 'Loading', color: 'primary' }
  }
}

/**
 * Validate progress data
 * @param {Object} progress - Progress data object
 * @returns {boolean} Whether progress data is valid
 */
export const isValidProgress = (progress) => {
  if (!progress || typeof progress !== 'object') return false
  
  const { percent, loaded, total, status } = progress
  
  // Check if percent is valid
  if (typeof percent !== 'number' || percent < 0 || percent > 100) return false
  
  // Check if loaded/total are valid numbers
  if (typeof loaded !== 'number' || typeof total !== 'number') return false
  if (loaded < 0 || total < 0 || loaded > total) return false
  
  // Check if status is valid
  const validStatuses = ['pending', 'downloading', 'completed', 'failed']
  if (!validStatuses.includes(status)) return false
  
  return true
}

/**
 * Create progress object with defaults
 * @param {Object} overrides - Override values
 * @returns {Object} Progress object with defaults
 */
export const createProgressObject = (overrides = {}) => {
  return {
    percent: 0,
    loaded: 0,
    total: 0,
    status: 'pending',
    fileName: '',
    error: null,
    ...overrides
  }
}