import { JIRA_CONSTANTS } from '../../../constants/jiraConstants'
import { hybridCacheService, indexedDBCache } from './indexedDBCache'
import { getCurrentDate, isCacheExpired as isExpired } from '../../../shared/utils/dateUtils.js'
import { parseSeverity } from '../../../shared/utils/severityParser.js'

export const cacheService = {
  // Cache JIRA data using hybrid storage (IndexedDB for large data, localStorage for small)
  cacheJiraData: async (data, metadata) => {
    try {
      const cacheKey = JIRA_CONSTANTS.CACHE_SETTINGS.STORAGE_KEY
      const timestamp = getCurrentDate().toISOString()
      
      // Prepare metadata
      const cacheMetadata = {
        timestamp,
        version: '1.0',
        dataLength: data.length,
        ...metadata
      }
      
      const dataString = JSON.stringify(data)
      const dataSizeMB = new Blob([dataString]).size / (1024 * 1024)
      
      console.log(`Caching ${data.length} issues (${dataSizeMB.toFixed(2)} MB)...`)
      
      // Use hybrid cache service (automatically chooses IndexedDB vs localStorage)
      const success = await hybridCacheService.cacheData(cacheKey, data, cacheMetadata)
      
      if (success) {
        console.log('✅ Data cached successfully using hybrid storage')
        return true
      } else {
        console.error('❌ Failed to cache data with hybrid storage')
        return false
      }
      
    } catch (error) {
      console.error('Failed to cache JIRA data:', error)
      return false
    }
  },
  
  // Get cached JIRA data
  getCachedJiraData: async () => {
    try {
      console.log('🔍 getCachedJiraData: Starting cache retrieval...')
      const cacheKey = JIRA_CONSTANTS.CACHE_SETTINGS.STORAGE_KEY
      const maxAgeHours = JIRA_CONSTANTS.CACHE_SETTINGS.EXPIRY_HOURS
      const allowStaleData = JIRA_CONSTANTS.CACHE_SETTINGS.ALLOW_STALE_DATA
      
      console.log(`🔍 Cache settings: key=${cacheKey}, maxAge=${maxAgeHours}h, allowStale=${allowStaleData}`)
      
      // First try to get data within expiry time
      console.log('🔍 Attempting to load fresh cached data...')
      let result = await hybridCacheService.getCachedData(cacheKey, maxAgeHours)
      
      if (result) {
        console.log(`✅ Found fresh cached data: ${result.data.length} issues, ${result.age.toFixed(1)}h old`)
        if (result.data.length === 0) {
          console.warn('⚠️ Cache contains 0 issues - this may indicate empty or corrupted cache')
          console.log('🔍 Cache metadata:', result.metadata)
          console.log('🔍 Cache timestamp:', new Date(result.timestamp).toISOString())
        }
      } else {
        console.log('❌ No fresh cached data found')
      }
      
      // If no fresh data but stale data is allowed, try to get any cached data
      if (!result && allowStaleData) {
        console.log('🔄 Attempting to load stale cached data...')
        // Try with a very large maxAge to get any cached data
        result = await hybridCacheService.getCachedData(cacheKey, 365 * 24) // 1 year
        
        if (result) {
          console.warn(`⚠️ Found stale cache data: ${result.data.length} issues, ${result.age.toFixed(1)}h old`)
        } else {
          console.log('❌ No stale cached data found either')
        }
      }
      
      if (!result) {
        console.log('❌ No cached data found at all')
        return null
      }
      
      const isStale = result.age > maxAgeHours
      console.log(`✅ Returning cached data: ${result.data.length} issues (${result.age.toFixed(1)}h old)${isStale ? ' [STALE]' : ' [FRESH]'}`)
      
      return {
        data: result.data,
        metadata: result.metadata,
        timestamp: result.timestamp,
        age: result.age,
        isStale
      }
      
    } catch (error) {
      console.error('❌ Failed to load cached data:', error)
      console.error('Error details:', error.stack)
      // Clear corrupted cache
      await cacheService.clearCache()
      return null
    }
  },
  
  // Check if cache is expired
  isCacheExpired: (timestamp) => {
    if (!timestamp) return true
    
    try {
      const timestampMs = new Date(timestamp).getTime()
      return isExpired(timestampMs, JIRA_CONSTANTS.CACHE_SETTINGS.EXPIRY_HOURS)
    } catch (error) {
      return true
    }
  },
  
  // Clear cache
  clearCache: async () => {
    try {
      // Use hybrid cache service to clear all data
      await hybridCacheService.clearCache()
      console.log('✅ Cache cleared')
      return true
    } catch (error) {
      console.error('❌ Failed to clear cache:', error)
      return false
    }
  },
  
  // Clear old cache entries (older than specified hours)
  clearOldCache: async (olderThanHours = 48) => {
    try {
      // Use hybrid cache service to clear old entries
      await hybridCacheService.clearCache(olderThanHours)
      console.log(`✅ Cleared cache entries older than ${olderThanHours} hours`)
      return true
      
    } catch (error) {
      console.error('❌ Failed to clear old cache:', error)
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
        severity: {
          name: parseSeverity(issue, issue.fields.project?.key).severity
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
  
  // Get cache size (uses IndexedDB cache stats)
  getCacheSize: async () => {
    try {
      // Get stats from IndexedDB
      const stats = await indexedDBCache.getCacheStats()
      
      const totalSizeMB = parseFloat(stats.totalSizeMB) || 0
      
      return {
        entries: stats.entries,
        totalSizeBytes: stats.totalSizeBytes,
        totalSize: stats.totalSizeBytes,
        totalSizeMB: stats.totalSizeMB,
        percentage: ((totalSizeMB / JIRA_CONSTANTS.CACHE_SETTINGS.MAX_SIZE_MB) * 100).toFixed(1)
      }
      
    } catch (error) {
      console.error('❌ Failed to get cache size:', error)
      return {
        entries: 0,
        totalSizeBytes: 0,
        totalSize: 0,
        totalSizeMB: '0.00',
        percentage: '0.0'
      }
    }
  },
  
  // Check if cache is available
  isCacheAvailable: async () => {
    try {
      const cacheKey = JIRA_CONSTANTS.CACHE_SETTINGS.STORAGE_KEY
      const maxAgeHours = JIRA_CONSTANTS.CACHE_SETTINGS.EXPIRY_HOURS
      
      // Check using hybrid cache service
      const result = await hybridCacheService.getCachedData(cacheKey, maxAgeHours)
      return result !== null
      
    } catch (error) {
      return false
    }
  },
  
  // Get cache metadata
  getCacheMetadata: async () => {
    try {
      const cacheKey = JIRA_CONSTANTS.CACHE_SETTINGS.STORAGE_KEY
      const maxAgeHours = JIRA_CONSTANTS.CACHE_SETTINGS.EXPIRY_HOURS
      
      // Get metadata from hybrid cache service
      const result = await hybridCacheService.getCachedData(cacheKey, maxAgeHours)
      return result ? result.metadata : null
      
    } catch (error) {
      return null
    }
  },
  
  // Update cache metadata (Note: IndexedDB stores metadata automatically)
  updateCacheMetadata: async (updates) => {
    try {
      // Note: In the hybrid storage system, metadata is stored automatically
      // when caching data. This method is kept for compatibility but doesn't
      // perform any action since metadata is managed by the storage layer.
      console.log('ℹ️ Metadata updates are handled automatically by hybrid storage')
      return true
      
    } catch (error) {
      console.error('❌ Failed to update cache metadata:', error)
      return false
    }
  }
}