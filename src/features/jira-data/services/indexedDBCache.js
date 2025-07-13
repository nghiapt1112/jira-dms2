// IndexedDB-based cache service for large JIRA datasets
// This replaces localStorage for large data storage

const DB_NAME = 'jira_data_cache'
const DB_VERSION = 1
const STORE_NAME = 'issues'
const METADATA_STORE = 'metadata'

class IndexedDBCache {
  constructor() {
    this.db = null
    this.isSupported = this.checkSupport()
  }

  checkSupport() {
    return typeof window !== 'undefined' && 'indexedDB' in window
  }

  async init() {
    if (!this.isSupported) {
      throw new Error('IndexedDB not supported')
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)
      
      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve(this.db)
      }
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result
        
        // Create issues store
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const issuesStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
          issuesStore.createIndex('timestamp', 'timestamp', { unique: false })
        }
        
        // Create metadata store
        if (!db.objectStoreNames.contains(METADATA_STORE)) {
          db.createObjectStore(METADATA_STORE, { keyPath: 'key' })
        }
      }
    })
  }

  async cacheData(key, data, metadata = {}) {
    if (!this.db) {
      await this.init()
    }

    const transaction = this.db.transaction([STORE_NAME, METADATA_STORE], 'readwrite')
    
    try {
      // Store the main data
      const issuesStore = transaction.objectStore(STORE_NAME)
      const dataEntry = {
        id: key,
        data: data,
        timestamp: Date.now(),
        size: JSON.stringify(data).length
      }
      
      await new Promise((resolve, reject) => {
        const request = issuesStore.put(dataEntry)
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })
      
      // Store metadata
      const metadataStore = transaction.objectStore(METADATA_STORE)
      const metadataEntry = {
        key: key,
        ...metadata,
        timestamp: Date.now(),
        dataSize: dataEntry.size
      }
      
      await new Promise((resolve, reject) => {
        const request = metadataStore.put(metadataEntry)
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })
      
      console.log(`✅ Cached ${data.length} issues to IndexedDB (${(dataEntry.size / (1024 * 1024)).toFixed(2)} MB)`)
      return true
      
    } catch (error) {
      console.error('❌ Failed to cache to IndexedDB:', error)
      return false
    }
  }

  async getCachedData(key, maxAgeHours = 24) {
    if (!this.db) {
      await this.init()
    }

    const transaction = this.db.transaction([STORE_NAME, METADATA_STORE], 'readonly')
    
    try {
      // Get the data
      const issuesStore = transaction.objectStore(STORE_NAME)
      const dataEntry = await new Promise((resolve, reject) => {
        const request = issuesStore.get(key)
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      })
      
      if (!dataEntry) {
        return null
      }
      
      // Check if data is still fresh
      const ageHours = (Date.now() - dataEntry.timestamp) / (1000 * 60 * 60)
      if (ageHours > maxAgeHours) {
        console.log(`⏰ Cached data is ${ageHours.toFixed(1)}h old, treating as stale`)
        return null
      }
      
      // Get metadata
      const metadataStore = transaction.objectStore(METADATA_STORE)
      const metadata = await new Promise((resolve, reject) => {
        const request = metadataStore.get(key)
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      })
      
      console.log(`✅ Retrieved ${dataEntry.data.length} issues from IndexedDB cache`)
      
      return {
        data: dataEntry.data,
        metadata: metadata || {},
        timestamp: dataEntry.timestamp,
        age: ageHours
      }
      
    } catch (error) {
      console.error('❌ Failed to retrieve from IndexedDB:', error)
      return null
    }
  }

  async clearCache(olderThanHours = null) {
    if (!this.db) {
      await this.init()
    }

    const transaction = this.db.transaction([STORE_NAME, METADATA_STORE], 'readwrite')
    
    try {
      if (olderThanHours === null) {
        // Clear all data
        await Promise.all([
          new Promise((resolve, reject) => {
            const request = transaction.objectStore(STORE_NAME).clear()
            request.onsuccess = () => resolve()
            request.onerror = () => reject(request.error)
          }),
          new Promise((resolve, reject) => {
            const request = transaction.objectStore(METADATA_STORE).clear()
            request.onsuccess = () => resolve()
            request.onerror = () => reject(request.error)
          })
        ])
        console.log('✅ Cleared all IndexedDB cache')
      } else {
        // Clear only old entries
        const cutoffTime = Date.now() - (olderThanHours * 60 * 60 * 1000)
        const issuesStore = transaction.objectStore(STORE_NAME)
        const index = issuesStore.index('timestamp')
        
        const range = IDBKeyRange.upperBound(cutoffTime)
        const request = index.openCursor(range)
        
        let deletedCount = 0
        await new Promise((resolve, reject) => {
          request.onsuccess = (event) => {
            const cursor = event.target.result
            if (cursor) {
              cursor.delete()
              deletedCount++
              cursor.continue()
            } else {
              resolve()
            }
          }
          request.onerror = () => reject(request.error)
        })
        
        console.log(`✅ Cleared ${deletedCount} old cache entries from IndexedDB`)
      }
      
      return true
    } catch (error) {
      console.error('❌ Failed to clear IndexedDB cache:', error)
      return false
    }
  }

  async getCacheStats() {
    if (!this.db) {
      await this.init()
    }

    const transaction = this.db.transaction([STORE_NAME, METADATA_STORE], 'readonly')
    
    try {
      const [entries, totalSize] = await Promise.all([
        new Promise((resolve, reject) => {
          const request = transaction.objectStore(STORE_NAME).count()
          request.onsuccess = () => resolve(request.result)
          request.onerror = () => reject(request.error)
        }),
        new Promise(async (resolve, reject) => {
          const request = transaction.objectStore(STORE_NAME).openCursor()
          let totalSize = 0
          
          request.onsuccess = (event) => {
            const cursor = event.target.result
            if (cursor) {
              totalSize += cursor.value.size || 0
              cursor.continue()
            } else {
              resolve(totalSize)
            }
          }
          request.onerror = () => reject(request.error)
        })
      ])
      
      return {
        entries,
        totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
        totalSizeBytes: totalSize
      }
    } catch (error) {
      console.error('❌ Failed to get cache stats:', error)
      return { entries: 0, totalSizeMB: '0', totalSizeBytes: 0 }
    }
  }
}

// Create singleton instance
export const indexedDBCache = new IndexedDBCache()

// Fallback to localStorage with compression for smaller data
export const hybridCacheService = {
  async cacheData(key, data, metadata = {}) {
    const dataSize = JSON.stringify(data).length
    const dataSizeMB = dataSize / (1024 * 1024)
    
    // Use IndexedDB for large data (>10MB) or localStorage for smaller data
    if (dataSizeMB > 10) {
      console.log(`📦 Using IndexedDB for large dataset (${dataSizeMB.toFixed(2)} MB)`)
      return await indexedDBCache.cacheData(key, data, metadata)
    } else {
      // Use localStorage for smaller data
      try {
        const cacheEntry = {
          data,
          metadata,
          timestamp: Date.now()
        }
        localStorage.setItem(key, JSON.stringify(cacheEntry))
        console.log(`📦 Using localStorage for small dataset (${dataSizeMB.toFixed(2)} MB)`)
        return true
      } catch (error) {
        console.warn(`⚠️ localStorage failed, falling back to IndexedDB:`, error)
        return await indexedDBCache.cacheData(key, data, metadata)
      }
    }
  },

  async getCachedData(key, maxAgeHours = 24) {
    // Try localStorage first (faster)
    try {
      const cached = localStorage.getItem(key)
      if (cached) {
        const parsed = JSON.parse(cached)
        const ageHours = (Date.now() - parsed.timestamp) / (1000 * 60 * 60)
        
        if (ageHours <= maxAgeHours) {
          console.log(`✅ Retrieved from localStorage cache (${ageHours.toFixed(1)}h old)`)
          return {
            data: parsed.data,
            metadata: parsed.metadata || {},
            timestamp: parsed.timestamp,
            age: ageHours
          }
        }
      }
    } catch (error) {
      console.warn('⚠️ localStorage read failed:', error)
    }
    
    // Fall back to IndexedDB
    return await indexedDBCache.getCachedData(key, maxAgeHours)
  },

  async clearCache(olderThanHours = null) {
    // Clear localStorage
    const keys = Object.keys(localStorage).filter(key => 
      key.includes('jira_data') || key.includes('main_dashboard')
    )
    keys.forEach(key => localStorage.removeItem(key))
    
    // Clear IndexedDB
    return await indexedDBCache.clearCache(olderThanHours)
  }
}

export default hybridCacheService