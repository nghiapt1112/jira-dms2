import {
  formatFileSize,
  formatDuration,
  calculateDownloadSpeed,
  calculateETA,
  calculateOverallProgress,
  getDownloadStats,
  formatNumber,
  getStatusColor,
  getStageDisplay,
  isValidProgress,
  createProgressObject
} from './progressUtils'

describe('progressUtils', () => {
  describe('formatFileSize', () => {
    it('formats bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 Bytes')
      expect(formatFileSize(1024)).toBe('1 KB')
      expect(formatFileSize(1048576)).toBe('1 MB')
      expect(formatFileSize(1073741824)).toBe('1 GB')
      expect(formatFileSize(1500000)).toBe('1.43 MB')
    })
  })

  describe('formatDuration', () => {
    it('formats duration correctly', () => {
      expect(formatDuration(0)).toBe('0:00')
      expect(formatDuration(30)).toBe('0:30')
      expect(formatDuration(60)).toBe('1:00')
      expect(formatDuration(90)).toBe('1:30')
      expect(formatDuration(3661)).toBe('1:01:01')
      expect(formatDuration(null)).toBe('Calculating...')
      expect(formatDuration(Infinity)).toBe('Calculating...')
    })
  })

  describe('calculateDownloadSpeed', () => {
    it('calculates download speed correctly', () => {
      expect(calculateDownloadSpeed(1024000, 1000)).toBe('1 MB/s')
      expect(calculateDownloadSpeed(0, 1000)).toBe('0 B/s')
      expect(calculateDownloadSpeed(1024000, 0)).toBe('0 B/s')
    })
  })

  describe('calculateETA', () => {
    it('calculates ETA correctly', () => {
      expect(calculateETA(1000000, 500000, 1000)).toBe(0.5) // 0.5 seconds
      expect(calculateETA(1000000, 1000000, 1000)).toBe(0) // Complete
      expect(calculateETA(0, 0, 0)).toBe(null) // Invalid input
      expect(calculateETA(1000000, 0, 1000)).toBe(null) // No progress
    })
  })

  describe('calculateOverallProgress', () => {
    it('calculates overall progress correctly', () => {
      const downloadProgress = {
        'url1': { percent: 100 },
        'url2': { percent: 50 },
        'url3': { percent: 0 }
      }
      
      expect(calculateOverallProgress(downloadProgress)).toBe(50) // (100+50+0)/3
      expect(calculateOverallProgress({})).toBe(0)
      expect(calculateOverallProgress(null)).toBe(0)
    })
  })

  describe('getDownloadStats', () => {
    it('returns correct download statistics', () => {
      const downloadProgress = {
        'url1': { status: 'completed', total: 1000000, loaded: 1000000 },
        'url2': { status: 'downloading', total: 2000000, loaded: 1000000 },
        'url3': { status: 'failed', total: 500000, loaded: 100000 },
        'url4': { status: 'pending', total: 800000, loaded: 0 }
      }
      
      const stats = getDownloadStats(downloadProgress)
      
      expect(stats.totalFiles).toBe(4)
      expect(stats.completedFiles).toBe(1)
      expect(stats.failedFiles).toBe(1)
      expect(stats.inProgressFiles).toBe(1)
      expect(stats.pendingFiles).toBe(1)
      expect(stats.totalBytes).toBe(4300000)
      expect(stats.downloadedBytes).toBe(2100000)
    })

    it('handles empty download progress', () => {
      const stats = getDownloadStats({})
      
      expect(stats.totalFiles).toBe(0)
      expect(stats.completedFiles).toBe(0)
      expect(stats.failedFiles).toBe(0)
      expect(stats.inProgressFiles).toBe(0)
      expect(stats.pendingFiles).toBe(0)
      expect(stats.totalBytes).toBe(0)
      expect(stats.downloadedBytes).toBe(0)
    })
  })

  describe('formatNumber', () => {
    it('formats numbers with locale separators', () => {
      expect(formatNumber(1000)).toBe('1,000')
      expect(formatNumber(1234567)).toBe('1,234,567')
      expect(formatNumber(null)).toBe('0')
      expect(formatNumber(undefined)).toBe('0')
    })
  })

  describe('getStatusColor', () => {
    it('returns correct colors for statuses', () => {
      expect(getStatusColor('completed')).toBe('success')
      expect(getStatusColor('failed')).toBe('error')
      expect(getStatusColor('downloading')).toBe('primary')
      expect(getStatusColor('pending')).toBe('default')
      expect(getStatusColor('unknown')).toBe('default')
    })
  })

  describe('getStageDisplay', () => {
    it('returns correct display info for stages', () => {
      expect(getStageDisplay('fetching-urls')).toEqual({ text: 'Fetching URLs', color: 'info' })
      expect(getStageDisplay('downloading-files')).toEqual({ text: 'Downloading Files', color: 'primary' })
      expect(getStageDisplay('processing-data')).toEqual({ text: 'Processing Data', color: 'secondary' })
      expect(getStageDisplay('unknown')).toEqual({ text: 'Loading', color: 'primary' })
    })
  })

  describe('isValidProgress', () => {
    it('validates progress objects correctly', () => {
      const validProgress = {
        percent: 50,
        loaded: 500,
        total: 1000,
        status: 'downloading'
      }
      
      expect(isValidProgress(validProgress)).toBe(true)
      
      // Invalid cases
      expect(isValidProgress(null)).toBe(false)
      expect(isValidProgress({ percent: -1, loaded: 0, total: 100, status: 'pending' })).toBe(false)
      expect(isValidProgress({ percent: 101, loaded: 0, total: 100, status: 'pending' })).toBe(false)
      expect(isValidProgress({ percent: 50, loaded: 1000, total: 500, status: 'pending' })).toBe(false)
      expect(isValidProgress({ percent: 50, loaded: 500, total: 1000, status: 'invalid' })).toBe(false)
    })
  })

  describe('createProgressObject', () => {
    it('creates progress object with defaults', () => {
      const progress = createProgressObject()
      
      expect(progress).toEqual({
        percent: 0,
        loaded: 0,
        total: 0,
        status: 'pending',
        fileName: '',
        error: null
      })
    })

    it('creates progress object with overrides', () => {
      const progress = createProgressObject({
        percent: 50,
        fileName: 'test.json',
        status: 'downloading'
      })
      
      expect(progress).toEqual({
        percent: 50,
        loaded: 0,
        total: 0,
        status: 'downloading',
        fileName: 'test.json',
        error: null
      })
    })
  })
})