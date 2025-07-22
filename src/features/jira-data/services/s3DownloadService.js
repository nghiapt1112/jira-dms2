import axios from 'axios'
import { JIRA_CONSTANTS } from '../../../constants/jiraConstants'

// Global controller for canceling downloads
let globalDownloadController = null

export const s3DownloadService = {
  // Download single snapshot from S3 with enhanced progress tracking
  downloadSnapshot: async (url, onProgress = null, customController = null) => {
    try {
      const controller = customController || new AbortController()
      globalDownloadController = controller
      
      const timeoutId = setTimeout(
        () => controller.abort(),
        JIRA_CONSTANTS.DOWNLOAD_SETTINGS.TIMEOUT
      )
      
      const startTime = Date.now()
      
      const response = await axios.get(url, {
        headers: {
          'Accept': 'application/json',
        },
        onDownloadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            )
            
            const elapsed = Date.now() - startTime
            const speed = progressEvent.loaded / (elapsed / 1000) // bytes per second
            const remainingBytes = progressEvent.total - progressEvent.loaded
            const eta = remainingBytes / speed // seconds remaining
            
            onProgress({
              loaded: progressEvent.loaded,
              total: progressEvent.total,
              percent: percentCompleted,
              speed,
              eta: isFinite(eta) ? eta : null,
              elapsed: elapsed / 1000
            })
          }
        },
        signal: controller.signal,
        responseType: 'json',
        timeout: JIRA_CONSTANTS.DOWNLOAD_SETTINGS.TIMEOUT,
      })
      
      clearTimeout(timeoutId)
      globalDownloadController = null
      
      // Validate response data
      if (!response.data) {
        throw new Error('No data received from S3')
      }
      
      // Handle different response formats
      if (Array.isArray(response.data)) {
        return response.data
      } else if (response.data.issues && Array.isArray(response.data.issues)) {
        return response.data.issues
      } else if (response.data.data && Array.isArray(response.data.data)) {
        return response.data.data
      } else {
        console.warn('Unexpected response format from S3:', response.data)
        return []
      }
      
    } catch (error) {
      globalDownloadController = null
      
      if (error.name === 'AbortError' || error.code === 'ECONNABORTED') {
        throw new Error('Download cancelled or timeout - file too large or connection slow')
      }
      if (error.response?.status === 403) {
        throw new Error('Access denied - S3 URL may have expired')
      }
      if (error.response?.status === 404) {
        throw new Error('File not found on S3')
      }
      throw new Error(`Download failed: ${error.message}`)
    }
  },
  
  // Download multiple snapshots with retry logic
  downloadMultipleSnapshots: async (snapshots, onProgress = null) => {
    const results = []
    const totalSnapshots = snapshots.length
    let successCount = 0
    let failCount = 0
    
    for (let i = 0; i < snapshots.length; i++) {
      const snapshot = snapshots[i]
      const snapshotName = `Q${snapshot.quarter} ${snapshot.year}`
      
      try {
        console.log(`Downloading ${snapshotName}...`)
        
        const data = await s3DownloadService.downloadSnapshotWithRetry(
          snapshot.url,
          (progress) => {
            if (onProgress) {
              onProgress({
                currentSnapshot: i + 1,
                totalSnapshots,
                snapshotName,
                progress,
                successCount,
                failCount
              })
            }
          }
        )
        
        successCount++
        results.push({
          ...snapshot,
          data,
          status: 'success'
        })
        
        console.log(`Successfully downloaded ${snapshotName}: ${data.length} issues`)
        
      } catch (error) {
        failCount++
        console.error(`Failed to download ${snapshotName}:`, error.message)
        results.push({
          ...snapshot,
          error: error.message,
          status: 'failed'
        })
      }
    }
    
    // Summary
    console.log(`Download complete: ${successCount} succeeded, ${failCount} failed`)
    
    return results
  },
  
  // Download with retry logic
  downloadSnapshotWithRetry: async (
    url, 
    onProgress = null, 
    maxRetries = JIRA_CONSTANTS.DOWNLOAD_SETTINGS.MAX_RETRIES
  ) => {
    let lastError
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Download attempt ${attempt}/${maxRetries}...`)
        return await s3DownloadService.downloadSnapshot(url, onProgress)
      } catch (error) {
        lastError = error
        console.warn(`Download attempt ${attempt} failed:`, error.message)
        
        if (attempt < maxRetries) {
          // Wait before retry with exponential backoff
          const delay = JIRA_CONSTANTS.DOWNLOAD_SETTINGS.RETRY_DELAY * attempt
          console.log(`Waiting ${delay}ms before retry...`)
          await new Promise(resolve => setTimeout(resolve, delay))
          
          // Reset progress for retry
          if (onProgress) {
            onProgress({ loaded: 0, total: 0, percent: 0 })
          }
        }
      }
    }
    
    throw lastError
  },
  
  // Check if URL is expired
  isUrlExpired: (snapshot) => {
    // S3 pre-signed URLs typically have expiration in the URL params
    // For now, we rely on the expiresIn field from the API
    if (!snapshot.expiresIn) {
      return false // Assume valid if no expiration info
    }
    
    // This is a simplified check - in reality, we'd need the creation time
    // For now, we assume the URL is fresh when we receive it
    return false
  },
  
  // Estimate download time
  estimateDownloadTime: (fileSize, connectionSpeed = JIRA_CONSTANTS.DOWNLOAD_SETTINGS.CONNECTION_SPEED) => {
    // Returns estimated time in seconds
    return Math.ceil(fileSize / connectionSpeed)
  },
  
  // Format file size for display
  formatFileSize: (bytes) => {
    if (bytes === 0) return '0 Bytes'
    
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  },
  
  // Calculate total download size
  calculateTotalSize: (snapshots) => {
    return snapshots.reduce((total, snapshot) => total + (snapshot.fileSize || 0), 0)
  },
  
  // Validate downloaded data
  validateDownloadedData: (data) => {
    if (!data) {
      return { isValid: false, reason: 'No data received' }
    }
    
    if (!Array.isArray(data)) {
      return { isValid: false, reason: 'Data is not an array' }
    }
    
    if (data.length === 0) {
      return { isValid: false, reason: 'Data array is empty' }
    }
    
    // Check if at least some items have expected structure
    const sampleSize = Math.min(10, data.length)
    const validItems = data.slice(0, sampleSize).filter(item => 
      item && 
      typeof item === 'object' && 
      item.key && 
      item.fields
    )
    
    if (validItems.length === 0) {
      return { isValid: false, reason: 'No valid JIRA issue structure found' }
    }
    
    return { isValid: true, validCount: data.length }
  },
  
  // Create download summary
  createDownloadSummary: (results) => {
    const successful = results.filter(r => r.status === 'success')
    const failed = results.filter(r => r.status === 'failed')
    const totalIssues = successful.reduce((sum, r) => sum + (r.data?.length || 0), 0)
    const totalSize = results.reduce((sum, r) => sum + (r.fileSize || 0), 0)
    
    return {
      totalSnapshots: results.length,
      successfulDownloads: successful.length,
      failedDownloads: failed.length,
      totalIssues,
      totalSize,
      formattedSize: s3DownloadService.formatFileSize(totalSize),
      failedSnapshots: failed.map(f => ({
        name: `Q${f.quarter} ${f.year}`,
        error: f.error
      }))
    }
  },
  
  // Cancel all active downloads
  cancelAllDownloads: () => {
    if (globalDownloadController) {
      globalDownloadController.abort()
      globalDownloadController = null
      console.log('All downloads cancelled')
    }
  },

  // Parallel download manager - Download multiple snapshots simultaneously
  downloadSnapshotsInParallel: async (snapshots, onProgressCallback = null, options = {}) => {
    const {
      maxConcurrent = JIRA_CONSTANTS.DOWNLOAD_SETTINGS.MAX_CONCURRENT_DOWNLOADS,
      enableParallel = JIRA_CONSTANTS.DOWNLOAD_SETTINGS.ENABLE_PARALLEL_DOWNLOADS,
      bandwidthLimit = JIRA_CONSTANTS.DOWNLOAD_SETTINGS.BANDWIDTH_LIMIT_MBPS
    } = options

    // Fallback to sequential download if parallel is disabled
    if (!enableParallel || snapshots.length === 1) {
      console.log('Using sequential download (parallel disabled or single file)')
      return await s3DownloadService.downloadMultipleSnapshots(snapshots, onProgressCallback)
    }

    console.log(`Starting parallel download of ${snapshots.length} snapshots (max concurrent: ${maxConcurrent})`)
    
    const results = []
    const downloadQueue = [...snapshots]
    const activeDownloads = new Map()
    const downloadStats = {
      totalFiles: snapshots.length,
      completedFiles: 0,
      failedFiles: 0,
      startTime: Date.now(),
      totalSize: s3DownloadService.calculateTotalSize(snapshots),
      downloadedSize: 0
    }

    // Progress aggregation for all downloads
    const aggregateProgress = () => {
      const activeProgresses = Array.from(activeDownloads.values())
      const totalLoaded = activeProgresses.reduce((sum, p) => sum + (p.loaded || 0), 0)
      const totalSize = activeProgresses.reduce((sum, p) => sum + (p.total || 0), 0)
      
      const overallProgress = {
        totalFiles: downloadStats.totalFiles,
        completedFiles: downloadStats.completedFiles,
        failedFiles: downloadStats.failedFiles,
        activeDownloads: activeDownloads.size,
        totalLoaded: totalLoaded + downloadStats.downloadedSize,
        totalSize: downloadStats.totalSize,
        percent: downloadStats.totalSize > 0 ? 
          Math.round(((totalLoaded + downloadStats.downloadedSize) / downloadStats.totalSize) * 100) : 0,
        estimatedTimeRemaining: s3DownloadService.calculateETA(
          totalLoaded + downloadStats.downloadedSize, 
          downloadStats.totalSize, 
          downloadStats.startTime
        ),
        downloadSpeed: s3DownloadService.calculateDownloadSpeed(
          totalLoaded + downloadStats.downloadedSize, 
          downloadStats.startTime
        )
      }

      if (onProgressCallback) {
        onProgressCallback(overallProgress)
      }
    }

    // Process download queue with concurrency control
    const processQueue = async () => {
      const promises = []

      // Start downloads up to maxConcurrent limit
      while (downloadQueue.length > 0 && activeDownloads.size < maxConcurrent) {
        const snapshot = downloadQueue.shift()
        const snapshotId = `${snapshot.year}-Q${snapshot.quarter}`
        
        console.log(`Starting download: Q${snapshot.quarter} ${snapshot.year}`)
        
        const downloadPromise = s3DownloadService.downloadSnapshotWithProgress(
          snapshot,
          (progress) => {
            activeDownloads.set(snapshotId, progress)
            aggregateProgress()
          }
        ).then(result => {
          // Download completed successfully
          activeDownloads.delete(snapshotId)
          downloadStats.completedFiles++
          downloadStats.downloadedSize += snapshot.fileSize || 0
          
          const successResult = {
            ...snapshot,
            data: result,
            status: 'success',
            downloadTime: Date.now() - downloadStats.startTime
          }
          results.push(successResult)
          
          console.log(`Completed: Q${snapshot.quarter} ${snapshot.year} (${result.length} issues)`)
          aggregateProgress()
          
          return successResult
        }).catch(error => {
          // Download failed
          activeDownloads.delete(snapshotId)
          downloadStats.failedFiles++
          
          const failedResult = {
            ...snapshot,
            error: error.message,
            status: 'failed',
            downloadTime: Date.now() - downloadStats.startTime
          }
          results.push(failedResult)
          
          console.error(`Failed: Q${snapshot.quarter} ${snapshot.year} - ${error.message}`)
          aggregateProgress()
          
          return failedResult
        })

        promises.push(downloadPromise)
      }

      // Wait for current batch to complete, then process remaining queue
      if (promises.length > 0) {
        await Promise.allSettled(promises)
        
        // Continue processing queue if there are more files
        if (downloadQueue.length > 0) {
          await processQueue()
        }
      }
    }

    try {
      // Start processing the download queue
      await processQueue()
      
      const summary = s3DownloadService.createDownloadSummary(results)
      console.log(`Parallel download completed: ${summary.successfulDownloads}/${summary.totalSnapshots} successful`)
      
      return results
    } catch (error) {
      console.error('Parallel download error:', error)
      throw error
    }
  },

  // Download single snapshot with enhanced progress tracking
  downloadSnapshotWithProgress: async (snapshot, onProgress = null) => {
    const controller = new AbortController()
    globalDownloadController = controller

    try {
      const data = await s3DownloadService.downloadSnapshot(
        snapshot.url,
        onProgress,
        controller
      )
      
      globalDownloadController = null
      return data
    } catch (error) {
      globalDownloadController = null
      throw error
    }
  },

  // Calculate download speed in MB/s
  calculateDownloadSpeed: (downloadedBytes, startTime) => {
    const elapsedSeconds = (Date.now() - startTime) / 1000
    if (elapsedSeconds === 0) return 0
    
    return (downloadedBytes / 1024 / 1024) / elapsedSeconds // MB/s
  },

  // Calculate estimated time remaining
  calculateETA: (downloadedBytes, totalBytes, startTime) => {
    if (downloadedBytes === 0 || totalBytes === 0) return null
    
    const elapsedSeconds = (Date.now() - startTime) / 1000
    const speed = downloadedBytes / elapsedSeconds // bytes per second
    const remainingBytes = totalBytes - downloadedBytes
    
    return remainingBytes / speed // seconds remaining
  },
  
  // Check if downloads are active
  isDownloading: () => {
    return globalDownloadController !== null
  },
  
  // Enhanced progress tracking utilities
  createProgressTracker: (onProgress) => {
    let startTime = Date.now()
    
    return (progressEvent) => {
      if (!progressEvent.total) return
      
      const elapsed = Date.now() - startTime
      const speed = progressEvent.loaded / (elapsed / 1000)
      const remainingBytes = progressEvent.total - progressEvent.loaded
      const eta = remainingBytes / speed
      
      const progress = {
        loaded: progressEvent.loaded,
        total: progressEvent.total,
        percent: Math.round((progressEvent.loaded * 100) / progressEvent.total),
        speed,
        eta: isFinite(eta) && eta > 0 ? eta : null,
        elapsed: elapsed / 1000,
        formattedSpeed: s3DownloadService.formatFileSize(speed) + '/s',
        formattedLoaded: s3DownloadService.formatFileSize(progressEvent.loaded),
        formattedTotal: s3DownloadService.formatFileSize(progressEvent.total)
      }
      
      if (onProgress) {
        onProgress(progress)
      }
      
      return progress
    }
  }
}