import { JIRA_CONSTANTS } from '../../../constants/jiraConstants'

export const cacheService = {
  // Cache JIRA data to localStorage with compression
  cacheJiraData: async (data, metadata) => {
    try {
      const cacheKey = JIRA_CONSTANTS.CACHE_SETTINGS.STORAGE_KEY
      const metadataKey = JIRA_CONSTANTS.CACHE_SETTINGS.METADATA_KEY
      const timestamp = new Date().toISOString()
      
      // Prepare cache object
      const cacheObject = {
        timestamp,
        version: '1.0',
        dataLength: data.length,
        metadata,
        compressed: false
      }
      
      // Try to store data
      try {
        // For large datasets, we might need to chunk the data
        const dataString = JSON.stringify(data)
        const dataSizeMB = new Blob([dataString]).size / (1024 * 1024)
        
        console.log(`Caching ${data.length} issues (${dataSizeMB.toFixed(2)} MB)...`)
        
        if (dataSizeMB > JIRA_CONSTANTS.CACHE_SETTINGS.MAX_SIZE_MB) {
          console.warn(`Data size (${dataSizeMB.toFixed(2)} MB) exceeds cache limit (${JIRA_CONSTANTS.CACHE_SETTINGS.MAX_SIZE_MB} MB)`)
          
          // Store only essential data for large datasets
          const essentialData = cacheService.extractEssentialData(data)
          localStorage.setItem(cacheKey, JSON.stringify(essentialData))
          cacheObject.compressed = true
          cacheObject.dataLength = essentialData.length
        } else {
          localStorage.setItem(cacheKey, dataString)
        }
        
        // Store metadata separately
        localStorage.setItem(metadataKey, JSON.stringify(cacheObject))
        
        console.log('Data cached successfully')
        return true
        
      } catch (storageError) {
        if (storageError.name === 'QuotaExceededError') {
          console.error('localStorage quota exceeded. Clearing old cache...')
          
          // Try to clear old cache and retry
          cacheService.clearOldCache()
          
          // Try one more time with essential data only
          const essentialData = cacheService.extractEssentialData(data)
          localStorage.setItem(cacheKey, JSON.stringify(essentialData))
          
          cacheObject.compressed = true
          cacheObject.dataLength = essentialData.length
          localStorage.setItem(metadataKey, JSON.stringify(cacheObject))
          
          console.log('Cached essential data only due to storage limitations')
          return true
        }
        
        throw storageError
      }
      
    } catch (error) {
      console.error('Failed to cache JIRA data:', error)
      return false
    }
  },
  
  // Get cached JIRA data
  getCachedJiraData: async () => {
    try {
      const cacheKey = JIRA_CONSTANTS.CACHE_SETTINGS.STORAGE_KEY
      const metadataKey = JIRA_CONSTANTS.CACHE_SETTINGS.METADATA_KEY
      
      // Check metadata first
      const metadataString = localStorage.getItem(metadataKey)
      if (!metadataString) {
        console.log('No cached metadata found')
        return null
      }
      
      const metadata = JSON.parse(metadataString)
      
      // Check if cache is expired
      if (cacheService.isCacheExpired(metadata.timestamp)) {
        console.log('Cache is expired')
        cacheService.clearCache()
        return null
      }
      
      // Get cached data
      const dataString = localStorage.getItem(cacheKey)
      if (!dataString) {
        console.log('No cached data found')
        return null
      }
      
      const data = JSON.parse(dataString)
      
      console.log(`Loaded ${data.length} issues from cache (cached at ${metadata.timestamp})`)
      
      return {
        data,
        metadata: metadata.metadata,
        timestamp: metadata.timestamp,
        compressed: metadata.compressed
      }
      
    } catch (error) {
      console.error('Failed to load cached data:', error)
      // Clear corrupted cache
      cacheService.clearCache()
      return null
    }
  },
  
  // Check if cache is expired
  isCacheExpired: (timestamp) => {
    if (!timestamp) return true
    
    try {
      const cachedTime = new Date(timestamp)
      const now = new Date()
      const hoursDiff = (now - cachedTime) / (1000 * 60 * 60)
      
      return hoursDiff > JIRA_CONSTANTS.CACHE_SETTINGS.EXPIRY_HOURS
    } catch (error) {
      return true
    }
  },
  
  // Clear cache
  clearCache: () => {
    try {
      localStorage.removeItem(JIRA_CONSTANTS.CACHE_SETTINGS.STORAGE_KEY)
      localStorage.removeItem(JIRA_CONSTANTS.CACHE_SETTINGS.METADATA_KEY)
      console.log('Cache cleared')
      return true
    } catch (error) {
      console.error('Failed to clear cache:', error)
      return false
    }
  },
  
  // Clear old cache entries
  clearOldCache: () => {
    try {
      const keysToRemove = []
      
      // Find all cache-related keys
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && (key.includes('jira') || key.includes('cache'))) {
          keysToRemove.push(key)
        }
      }
      
      // Remove old cache entries
      keysToRemove.forEach(key => {
        localStorage.removeItem(key)
      })
      
      console.log(`Cleared ${keysToRemove.length} old cache entries`)
      return true
      
    } catch (error) {
      console.error('Failed to clear old cache:', error)
      return false
    }
  },
  
  // Extract essential data for large datasets
  extractEssentialData: (data) => {
    // Keep only essential fields to reduce size
    return data.map(issue => ({
      key: issue.key,
      fields: {
        summary: issue.fields.summary,
        created: issue.fields.created,
        updated: issue.fields.updated,
        resolutiondate: issue.fields.resolutiondate,
        project: {
          key: issue.fields.project?.key,
          name: issue.fields.project?.name
        },
        issuetype: {
          name: issue.fields.issuetype?.name
        },
        status: {
          name: issue.fields.status?.name
        },
        priority: {
          name: issue.fields.priority?.name
        },
        assignee: {
          displayName: issue.fields.assignee?.displayName
        },
        reporter: {
          displayName: issue.fields.reporter?.displayName
        }
      },
      displayFields: issue.displayFields,
      calculatedFields: issue.calculatedFields
    }))
  },
  
  // Get cache size
  getCacheSize: () => {
    try {
      const cacheKey = JIRA_CONSTANTS.CACHE_SETTINGS.STORAGE_KEY
      const metadataKey = JIRA_CONSTANTS.CACHE_SETTINGS.METADATA_KEY
      
      const dataSize = new Blob([localStorage.getItem(cacheKey) || '']).size
      const metadataSize = new Blob([localStorage.getItem(metadataKey) || '']).size
      
      const totalSize = dataSize + metadataSize
      const totalSizeMB = totalSize / (1024 * 1024)
      
      return {
        dataSize,
        metadataSize,
        totalSize,
        totalSizeMB: totalSizeMB.toFixed(2),
        percentage: ((totalSizeMB / JIRA_CONSTANTS.CACHE_SETTINGS.MAX_SIZE_MB) * 100).toFixed(1)
      }
      
    } catch (error) {
      console.error('Failed to get cache size:', error)
      return null
    }
  },
  
  // Check if cache is available
  isCacheAvailable: () => {
    try {
      const metadataKey = JIRA_CONSTANTS.CACHE_SETTINGS.METADATA_KEY
      const metadataString = localStorage.getItem(metadataKey)
      
      if (!metadataString) return false
      
      const metadata = JSON.parse(metadataString)
      return !cacheService.isCacheExpired(metadata.timestamp)
      
    } catch (error) {
      return false
    }
  },
  
  // Get cache metadata
  getCacheMetadata: () => {
    try {
      const metadataKey = JIRA_CONSTANTS.CACHE_SETTINGS.METADATA_KEY
      const metadataString = localStorage.getItem(metadataKey)
      
      if (!metadataString) return null
      
      return JSON.parse(metadataString)
      
    } catch (error) {
      return null
    }
  },
  
  // Update cache metadata
  updateCacheMetadata: (updates) => {
    try {
      const metadataKey = JIRA_CONSTANTS.CACHE_SETTINGS.METADATA_KEY
      const existing = cacheService.getCacheMetadata() || {}
      
      const updated = {
        ...existing,
        ...updates,
        lastUpdated: new Date().toISOString()
      }
      
      localStorage.setItem(metadataKey, JSON.stringify(updated))
      return true
      
    } catch (error) {
      console.error('Failed to update cache metadata:', error)
      return false
    }
  }
}