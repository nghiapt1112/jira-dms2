/**
 * Dedicated IndexedDB service for Developer Quality Dashboard
 * Implements granular data storage with separate stores for scalability
 */

// Database configuration
// Using 'indexed-' prefix to clearly distinguish from other storage mechanisms
const DB_NAME = 'indexed-developer-quality-dashboard'
const DB_VERSION = 1

// Object store names
const STORES = {
  METRICS: 'metrics',
  CHART_DATA: 'chart_data',
  INDICES: 'indices',
  FILTER_OPTIONS: 'filter_options',
  MINIMAL_ISSUES: 'minimal_issues',
  METADATA: 'metadata'
}

// Cache keys for different data types
const CACHE_KEYS = {
  METRICS: {
    TEAM_CONTRIBUTION: 'team_contribution',
    BUG_ANALYSIS: 'bug_analysis',
    BUG_STATUS_ANALYSIS: 'bug_status_analysis',
    ROOT_CAUSE_ANALYSIS: 'root_cause_analysis',
    DEVELOPER_ROOT_CAUSE: 'developer_root_cause',
    BUG_RATE_ANALYSIS: 'bug_rate_analysis'
  },
  CHART_DATA: {
    TEAM_CONTRIBUTION: 'team_contribution_chart',
    BUG_TREND: 'bug_trend_chart',
    BUG_STATUS: 'bug_status_chart',
    ROOT_CAUSE: 'root_cause_chart',
    DEVELOPER_ROOT_CAUSE: 'developer_root_cause_chart'
  },
  INDICES: {
    BY_DEVELOPER: 'by_developer',
    BY_PROJECT: 'by_project',
    BY_ISSUE_TYPE: 'by_issue_type',
    BY_STATUS: 'by_status',
    BY_SEVERITY: 'by_severity',
    BY_ROOT_CAUSE: 'by_root_cause',
    BY_MONTH: 'by_month',
    BY_WEEK: 'by_week',
    BY_QUARTER: 'by_quarter'
  },
  FILTER_OPTIONS: {
    DEVELOPERS: 'developers',
    PROJECTS: 'projects',
    ISSUE_TYPES: 'issue_types',
    STATUSES: 'statuses',
    SEVERITIES: 'severities',
    ROOT_CAUSES: 'root_causes',
    DATE_RANGES: 'date_ranges'
  },
  METADATA: {
    PROCESSING_INFO: 'processing_info',
    CACHE_STATS: 'cache_stats',
    VERSION_INFO: 'version_info'
  }
}

class DeveloperQualityIndexedDB {
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
      
      request.onerror = () => {
        console.error(`❌ Failed to open IndexedDB ${DB_NAME}:`, request.error)
        reject(request.error)
      }
      
      request.onsuccess = () => {
        this.db = request.result

        resolve(this.db)
      }
      
      request.onupgradeneeded = (event) => {

        const db = event.target.result
        
        // Create metrics store
        if (!db.objectStoreNames.contains(STORES.METRICS)) {
          
          const metricsStore = db.createObjectStore(STORES.METRICS, { keyPath: 'key' })
          metricsStore.createIndex('timestamp', 'timestamp', { unique: false })
          metricsStore.createIndex('type', 'type', { unique: false })
        }
        
        // Create chart data store
        if (!db.objectStoreNames.contains(STORES.CHART_DATA)) {
          
          const chartStore = db.createObjectStore(STORES.CHART_DATA, { keyPath: 'key' })
          chartStore.createIndex('timestamp', 'timestamp', { unique: false })
          chartStore.createIndex('type', 'type', { unique: false })
        }
        
        // Create indices store
        if (!db.objectStoreNames.contains(STORES.INDICES)) {
          
          const indicesStore = db.createObjectStore(STORES.INDICES, { keyPath: 'key' })
          indicesStore.createIndex('timestamp', 'timestamp', { unique: false })
          indicesStore.createIndex('type', 'type', { unique: false })
        }
        
        // Create filter options store
        if (!db.objectStoreNames.contains(STORES.FILTER_OPTIONS)) {
          
          const filterStore = db.createObjectStore(STORES.FILTER_OPTIONS, { keyPath: 'key' })
          filterStore.createIndex('timestamp', 'timestamp', { unique: false })
        }
        
        // Create minimal issues store
        if (!db.objectStoreNames.contains(STORES.MINIMAL_ISSUES)) {
          
          const issuesStore = db.createObjectStore(STORES.MINIMAL_ISSUES, { keyPath: 'id' })
          issuesStore.createIndex('assignee', 'assignee', { unique: false })
          issuesStore.createIndex('project', 'project', { unique: false })
          issuesStore.createIndex('created', 'created', { unique: false })
          issuesStore.createIndex('timestamp', 'timestamp', { unique: false })
        }
        
        // Create metadata store
        if (!db.objectStoreNames.contains(STORES.METADATA)) {
          
          const metadataStore = db.createObjectStore(STORES.METADATA, { keyPath: 'key' })
          metadataStore.createIndex('timestamp', 'timestamp', { unique: false })
        }
        
        
      }
    })
  }

  // Generic method to store data in any store
  async storeData(storeName, key, data, metadata = {}) {
    if (!this.db) {
      await this.init()
    }

    const transaction = this.db.transaction([storeName], 'readwrite')
    const store = transaction.objectStore(storeName)
    
    const entry = {
      key,
      data,
      timestamp: Date.now(),
      size: JSON.stringify(data).length,
      ...metadata
    }

    return new Promise((resolve, reject) => {
      const request = store.put(entry)
      request.onsuccess = () => {
        resolve(true)
      }
      request.onerror = () => {
        console.error(`❌ Failed to store ${key} in ${storeName}:`, request.error)
        reject(request.error)
      }
    })
  }

  // Generic method to retrieve data from any store
  async getData(storeName, key, maxAgeHours = 24) {
    if (!this.db) {
      await this.init()
    }

    const transaction = this.db.transaction([storeName], 'readonly')
    const store = transaction.objectStore(storeName)

    return new Promise((resolve, reject) => {
      const request = store.get(key)
      request.onsuccess = () => {
        const result = request.result
        
        if (!result) {
          resolve(null)
          return
        }

        // Check if data is still fresh
        const ageHours = (Date.now() - result.timestamp) / (1000 * 60 * 60)
        if (ageHours > maxAgeHours) {
          resolve(null)
          return
        }

        resolve(result.data)
      }
      request.onerror = () => {
        console.error(`❌ Failed to retrieve ${key} from ${storeName}:`, request.error)
        reject(request.error)
      }
    })
  }

  // Store metrics data
  async storeMetric(metricType, data) {
    return this.storeData(STORES.METRICS, metricType, data, { type: 'metric' })
  }

  // Get metrics data
  async getMetric(metricType) {
    return this.getData(STORES.METRICS, metricType)
  }

  // Store chart data
  async storeChartData(chartType, data) {
    return this.storeData(STORES.CHART_DATA, chartType, data, { type: 'chart' })
  }

  // Get chart data
  async getChartData(chartType) {
    return this.getData(STORES.CHART_DATA, chartType)
  }

  // Store indices data
  async storeIndex(indexType, data) {
    // Convert Map to serializable format if needed
    const serializedData = data instanceof Map ? Object.fromEntries(data) : data
    return this.storeData(STORES.INDICES, indexType, serializedData, { type: 'index' })
  }

  // Get indices data
  async getIndex(indexType) {
    const data = await this.getData(STORES.INDICES, indexType)
    // Convert back to Map if it was originally a Map
    return data ? new Map(Object.entries(data)) : null
  }

  // Store filter options
  async storeFilterOptions(filterType, options) {
    return this.storeData(STORES.FILTER_OPTIONS, filterType, options)
  }

  // Get filter options
  async getFilterOptions(filterType) {
    return this.getData(STORES.FILTER_OPTIONS, filterType)
  }

  // Store minimal issues (batch operation)
  async storeMinimalIssues(issues) {
    if (!this.db) {
      await this.init()
    }

    const transaction = this.db.transaction([STORES.MINIMAL_ISSUES], 'readwrite')
    const store = transaction.objectStore(STORES.MINIMAL_ISSUES)

    const promises = issues.map(issue => {
      const entry = {
        ...issue,
        timestamp: Date.now()
      }
      
      return new Promise((resolve, reject) => {
        const request = store.put(entry)
        request.onsuccess = () => resolve(true)
        request.onerror = () => reject(request.error)
      })
    })

    const results = await Promise.all(promises)
    return results
  }

  // Get minimal issues by criteria
  async getMinimalIssues(criteria = {}) {
    if (!this.db) {
      await this.init()
    }

    const transaction = this.db.transaction([STORES.MINIMAL_ISSUES], 'readonly')
    const store = transaction.objectStore(STORES.MINIMAL_ISSUES)

    return new Promise((resolve, reject) => {
      const request = store.getAll()
      request.onsuccess = () => {
        let results = request.result

        // Apply filters if provided
        if (criteria.assignee) {
          results = results.filter(issue => issue.assignee === criteria.assignee)
        }
        if (criteria.project) {
          results = results.filter(issue => issue.project === criteria.project)
        }
        if (criteria.dateRange) {
          results = results.filter(issue => {
            const updated = new Date(issue.updated)
            return updated >= criteria.dateRange.start && updated <= criteria.dateRange.end
          })
        }

        resolve(results)
      }
      request.onerror = () => {
        console.error('❌ Failed to retrieve minimal issues:', request.error)
        reject(request.error)
      }
    })
  }

  // Store metadata
  async storeMetadata(metadataType, data) {
    return this.storeData(STORES.METADATA, metadataType, data)
  }

  // Get metadata
  async getMetadata(metadataType) {
    return this.getData(STORES.METADATA, metadataType)
  }

  // Store complete dataset (splits into appropriate stores)
  async storeCompleteDataset(processedData) {
    try {
      const promises = []

      // Store metrics
      if (processedData.metrics) {
        Object.entries(processedData.metrics).forEach(([key, value]) => {
          promises.push(this.storeMetric(key, value))
        })
      }

      // Store chart data
      if (processedData.chartData) {
        Object.entries(processedData.chartData).forEach(([key, value]) => {
          promises.push(this.storeChartData(key, value))
        })
      }

      // Store indices
      if (processedData.indices) {
        Object.entries(processedData.indices).forEach(([key, value]) => {
          promises.push(this.storeIndex(key, value))
        })
      }

      // Store filter options
      if (processedData.filterOptions) {
        Object.entries(processedData.filterOptions).forEach(([key, value]) => {
          promises.push(this.storeFilterOptions(key, value))
        })
      }

      // Store minimal issues
      if (processedData.minimalIssues) {
        promises.push(this.storeMinimalIssues(processedData.minimalIssues))
      }

      // Store metadata
      if (processedData.metadata) {
        promises.push(this.storeMetadata(CACHE_KEYS.METADATA.PROCESSING_INFO, processedData.metadata))
      }

      await Promise.all(promises)
      return true
    } catch (error) {
      console.error('❌ Failed to store complete dataset:', error)
      return false
    }
  }

  // Get complete dataset (reconstructs from all stores)
  async getCompleteDataset() {
    try {
      // Get all metrics
      const metrics = {}
      for (const key of Object.values(CACHE_KEYS.METRICS)) {
        const data = await this.getMetric(key)
        if (data) metrics[key] = data
      }

      // Get all chart data
      const chartData = {}
      for (const key of Object.values(CACHE_KEYS.CHART_DATA)) {
        const data = await this.getChartData(key)
        if (data) chartData[key] = data
      }

      // Get all indices
      const indices = {}
      for (const key of Object.values(CACHE_KEYS.INDICES)) {
        const data = await this.getIndex(key)
        if (data) indices[key] = data
      }

      // Get all filter options
      const filterOptions = {}
      for (const key of Object.values(CACHE_KEYS.FILTER_OPTIONS)) {
        const data = await this.getFilterOptions(key)
        if (data) filterOptions[key] = data
      }

      // Get minimal issues
      const minimalIssues = await this.getMinimalIssues()

      // Get metadata
      const metadata = await this.getMetadata(CACHE_KEYS.METADATA.PROCESSING_INFO)

      // Check if we have sufficient data
      const hasData = Object.keys(metrics).length > 0 || Object.keys(chartData).length > 0

      if (!hasData) {
        return null
      }

      const completeDataset = {
        metrics,
        chartData,
        indices,
        filterOptions,
        minimalIssues: minimalIssues || [],
        metadata
      }

      return completeDataset
    } catch (error) {
      console.error('❌ Failed to retrieve complete dataset:', error)
      return null
    }
  }

  // Clear all data
  async clearAllData() {
    if (!this.db) {
      await this.init()
    }

    const transaction = this.db.transaction(Object.values(STORES), 'readwrite')
    
    const clearPromises = Object.values(STORES).map(storeName => {
      return new Promise((resolve, reject) => {
        const store = transaction.objectStore(storeName)
        const request = store.clear()
        request.onsuccess = () => resolve(storeName)
        request.onerror = () => reject(request.error)
      })
    })

    try {
      await Promise.all(clearPromises)
      return true
    } catch (error) {
      console.error('❌ Failed to clear data:', error)
      return false
    }
  }

  // Get cache statistics
  async getCacheStats() {
    if (!this.db) {
      await this.init()
    }

    const stats = {}
    
    for (const [storeName, storeKey] of Object.entries(STORES)) {
      const transaction = this.db.transaction([storeKey], 'readonly')
      const store = transaction.objectStore(storeKey)
      
      const count = await new Promise((resolve) => {
        const request = store.count()
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => resolve(0)
      })

      stats[storeName] = { count, store: storeKey }
    }

    return stats
  }
}

// Export singleton instance
export const developerQualityIndexedDB = new DeveloperQualityIndexedDB()
export { CACHE_KEYS, STORES }
export default developerQualityIndexedDB