import axios from 'axios'
import { JIRA_CONSTANTS } from '../../../constants/jiraConstants'

export const s3DownloadService = {
  // Download single snapshot from S3
  downloadSnapshot: async (url, onProgress = null) => {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(
        () => controller.abort(),
        JIRA_CONSTANTS.DOWNLOAD_SETTINGS.TIMEOUT
      )
      
      const response = await axios.get(url, {
        headers: {
          'Accept': 'application/json',
        },
        onDownloadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            )
            onProgress({
              loaded: progressEvent.loaded,
              total: progressEvent.total,
              percent: percentCompleted
            })
          }
        },
        signal: controller.signal,
        responseType: 'json',
        timeout: JIRA_CONSTANTS.DOWNLOAD_SETTINGS.TIMEOUT,
      })
      
      clearTimeout(timeoutId)
      
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
      if (error.name === 'AbortError' || error.code === 'ECONNABORTED') {
        throw new Error('Download timeout - file too large or connection slow')
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
  }
}