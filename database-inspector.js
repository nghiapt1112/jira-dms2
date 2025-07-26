/**
 * Comprehensive Database Inspector for Developer Quality Dashboard
 * 
 * This script inspects the IndexedDB storage for the developer-quality-dashboard
 * and generates a comprehensive report to diagnose storage conflicts and data persistence issues.
 * 
 * Usage:
 * 1. Run this script in the browser console while on the dashboard
 * 2. Call inspectAndExport() to generate a downloadable report
 * 3. The report will contain all database contents, key patterns, and recommendations
 */

class DatabaseInspector {
  constructor() {
    // Updated to use prefixed name to match the actual database
    this.dbName = 'indexed-developer-quality-dashboard'
    this.dbVersion = 1
    this.expectedStores = ['metrics', 'chart_data', 'indices', 'filter_options', 'minimal_issues', 'metadata']
    this.expectedCacheKeys = {
      METRICS: {
        TEAM_CONTRIBUTION: 'team_contribution',
        BUG_ANALYSIS: 'bug_analysis',
        ROOT_CAUSE_ANALYSIS: 'root_cause_analysis',
        DEVELOPER_ROOT_CAUSE: 'developer_root_cause',
        BUG_RATE_ANALYSIS: 'bug_rate_analysis'
      },
      CHART_DATA: {
        TEAM_CONTRIBUTION: 'team_contribution_chart',
        BUG_TREND: 'bug_trend_chart',
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
    this.report = {
      timestamp: new Date().toISOString(),
      database: {},
      stores: {},
      keyConflicts: [],
      dataIntegrity: {},
      alternativeStorages: {},
      recommendations: [],
      rawData: {}
    }
  }

  log(message, level = 'info') {
    const timestamp = new Date().toISOString()
    const prefix = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : level === 'success' ? '✅' : '🔍'
    console.log(`${prefix} [${timestamp}] ${message}`)
  }

  async inspectDatabase() {
    this.log('Starting comprehensive database inspection...')
    
    try {
      // Check if IndexedDB is supported
      if (!window.indexedDB) {
        throw new Error('IndexedDB not supported in this browser')
      }

      // Try to open the database
      const db = await this.openDatabase()
      
      if (!db) {
        this.log('Database does not exist, checking for alternatives...', 'warn')
        await this.checkAlternativeStorages()
        return
      }

      // Inspect database structure
      await this.inspectDatabaseStructure(db)
      
      // Inspect each store
      for (const storeName of this.expectedStores) {
        if (db.objectStoreNames.contains(storeName)) {
          await this.inspectStore(db, storeName)
        } else {
          this.log(`Store '${storeName}' not found in database`, 'warn')
          this.report.stores[storeName] = { exists: false, error: 'Store not found' }
        }
      }

      // Analyze key patterns and conflicts
      this.analyzeKeyPatterns()
      
      // Validate data integrity
      this.validateDataIntegrity()
      
      // Check alternative storage mechanisms
      await this.checkAlternativeStorages()
      
      // Generate recommendations
      this.generateRecommendations()

      db.close()
      this.log('Database inspection completed successfully', 'success')
      
    } catch (error) {
      this.log(`Database inspection failed: ${error.message}`, 'error')
      this.report.database.error = error.message
      
      // Even if main DB fails, check alternatives
      await this.checkAlternativeStorages()
    }
  }

  async openDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion)
      
      request.onsuccess = (event) => {
        this.log('Successfully opened database')
        resolve(event.target.result)
      }
      
      request.onerror = (event) => {
        this.log(`Failed to open database: ${event.target.error}`, 'error')
        resolve(null) // Don't reject, just return null
      }
      
      request.onblocked = () => {
        this.log('Database open request blocked', 'warn')
        resolve(null)
      }
    })
  }

  async inspectDatabaseStructure(db) {
    this.report.database = {
      name: db.name,
      version: db.version,
      stores: Array.from(db.objectStoreNames),
      expectedStores: this.expectedStores,
      missingStores: this.expectedStores.filter(store => !db.objectStoreNames.contains(store)),
      unexpectedStores: Array.from(db.objectStoreNames).filter(store => !this.expectedStores.includes(store))
    }
    
    this.log(`Database: ${db.name} v${db.version}`)
    this.log(`Found stores: ${Array.from(db.objectStoreNames).join(', ')}`)
    
    if (this.report.database.missingStores.length > 0) {
      this.log(`Missing expected stores: ${this.report.database.missingStores.join(', ')}`, 'warn')
    }
    
    if (this.report.database.unexpectedStores.length > 0) {
      this.log(`Unexpected stores found: ${this.report.database.unexpectedStores.join(', ')}`, 'warn')
    }
  }

  async inspectStore(db, storeName) {
    this.log(`Inspecting store: ${storeName}`)
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly')
      const store = transaction.objectStore(storeName)
      
      // Get all keys first
      const keysRequest = store.getAllKeys()
      
      keysRequest.onsuccess = async () => {
        const keys = keysRequest.result
        this.log(`Store '${storeName}' contains ${keys.length} entries`)
        
        const storeReport = {
          exists: true,
          keyCount: keys.length,
          keys: keys,
          indices: Array.from(store.indexNames),
          keyPath: store.keyPath,
          autoIncrement: store.autoIncrement,
          entries: {},
          dataTypes: {},
          timestamps: [],
          sampleData: {}
        }
        
        // Get all data
        const allDataRequest = store.getAll()
        allDataRequest.onsuccess = () => {
          const allData = allDataRequest.result
          
          // Process each entry
          allData.forEach((entry, index) => {
            const key = keys[index]
            
            // Store entry info
            storeReport.entries[key] = {
              size: JSON.stringify(entry).length,
              hasTimestamp: !!entry.timestamp,
              hasData: !!entry.data,
              hasMetadata: !!entry.metadata,
              type: entry.type || 'unknown'
            }
            
            // Track data types
            if (entry.data) {
              const dataType = Array.isArray(entry.data) ? 'array' : typeof entry.data
              storeReport.dataTypes[key] = dataType
              
              if (dataType === 'array') {
                storeReport.entries[key].arrayLength = entry.data.length
              }
            }
            
            // Track timestamps
            if (entry.timestamp) {
              storeReport.timestamps.push({
                key: key,
                timestamp: entry.timestamp,
                age: Date.now() - entry.timestamp,
                ageHours: (Date.now() - entry.timestamp) / (1000 * 60 * 60)
              })
            }
            
            // Store sample data (first 3 entries or small entries)
            if (index < 3 || JSON.stringify(entry).length < 1000) {
              storeReport.sampleData[key] = this.sanitizeForSample(entry)
            }
          })
          
          // Store raw data for download
          this.report.rawData[storeName] = allData
          
          this.report.stores[storeName] = storeReport
          resolve()
        }
        
        allDataRequest.onerror = () => {
          this.log(`Failed to get data from store '${storeName}': ${allDataRequest.error}`, 'error')
          storeReport.error = allDataRequest.error
          this.report.stores[storeName] = storeReport
          resolve()
        }
      }
      
      keysRequest.onerror = () => {
        this.log(`Failed to get keys from store '${storeName}': ${keysRequest.error}`, 'error')
        this.report.stores[storeName] = {
          exists: true,
          error: keysRequest.error
        }
        resolve()
      }
    })
  }

  sanitizeForSample(entry) {
    // Create a smaller version for the sample
    const sample = { ...entry }
    
    // If data is large array, only include first few items
    if (sample.data && Array.isArray(sample.data) && sample.data.length > 5) {
      sample.data = {
        type: 'large_array',
        length: sample.data.length,
        sample: sample.data.slice(0, 3),
        sampleNote: `Showing first 3 of ${sample.data.length} items`
      }
    }
    
    // If data is large object, truncate
    if (sample.data && typeof sample.data === 'object' && JSON.stringify(sample.data).length > 1000) {
      sample.data = {
        type: 'large_object',
        keys: Object.keys(sample.data),
        sampleNote: 'Large object truncated for display'
      }
    }
    
    return sample
  }

  analyzeKeyPatterns() {
    this.log('Analyzing key patterns and conflicts...')
    
    const allExpectedKeys = []
    const allActualKeys = []
    
    // Collect all expected keys
    Object.values(this.expectedCacheKeys).forEach(category => {
      Object.values(category).forEach(key => {
        allExpectedKeys.push(key)
      })
    })
    
    // Collect all actual keys
    Object.values(this.report.stores).forEach(store => {
      if (store.keys) {
        allActualKeys.push(...store.keys)
      }
    })
    
    // Find missing and unexpected keys
    const missingKeys = allExpectedKeys.filter(key => !allActualKeys.includes(key))
    const unexpectedKeys = allActualKeys.filter(key => !allExpectedKeys.includes(key))
    
    // Check for naming pattern conflicts (underscore vs hyphen)
    const namingConflicts = []
    allActualKeys.forEach(actualKey => {
      const underscoreVersion = actualKey.replace(/-/g, '_')
      const hyphenVersion = actualKey.replace(/_/g, '-')
      
      if (allExpectedKeys.includes(underscoreVersion) && actualKey !== underscoreVersion) {
        namingConflicts.push({
          actual: actualKey,
          expected: underscoreVersion,
          type: 'underscore_conflict'
        })
      }
      
      if (allExpectedKeys.includes(hyphenVersion) && actualKey !== hyphenVersion) {
        namingConflicts.push({
          actual: actualKey,
          expected: hyphenVersion,
          type: 'hyphen_conflict'
        })
      }
    })
    
    this.report.keyConflicts = {
      missingKeys,
      unexpectedKeys,
      namingConflicts,
      summary: {
        expectedKeyCount: allExpectedKeys.length,
        actualKeyCount: allActualKeys.length,
        missingKeyCount: missingKeys.length,
        unexpectedKeyCount: unexpectedKeys.length,
        namingConflictCount: namingConflicts.length
      }
    }
    
    if (missingKeys.length > 0) {
      this.log(`Missing keys: ${missingKeys.join(', ')}`, 'warn')
    }
    
    if (namingConflicts.length > 0) {
      this.log(`Naming conflicts found: ${namingConflicts.length}`, 'warn')
    }
  }

  validateDataIntegrity() {
    this.log('Validating data integrity...')
    
    const integrity = {
      timestampConsistency: true,
      dataFormatConsistency: true,
      crossStoreConsistency: true,
      issues: []
    }
    
    // Check timestamp consistency across stores
    const allTimestamps = []
    Object.entries(this.report.stores).forEach(([storeName, store]) => {
      if (store.timestamps) {
        store.timestamps.forEach(ts => {
          allTimestamps.push({ store: storeName, ...ts })
        })
      }
    })
    
    if (allTimestamps.length > 0) {
      const timestampDifferences = []
      for (let i = 1; i < allTimestamps.length; i++) {
        const diff = Math.abs(allTimestamps[i].timestamp - allTimestamps[i-1].timestamp)
        timestampDifferences.push(diff)
      }
      
      const maxDiff = Math.max(...timestampDifferences)
      const avgDiff = timestampDifferences.reduce((a, b) => a + b, 0) / timestampDifferences.length
      
      if (maxDiff > 60000) { // More than 1 minute difference
        integrity.timestampConsistency = false
        integrity.issues.push(`Large timestamp differences detected (max: ${maxDiff}ms)`)
      }
      
      integrity.timestampStats = {
        count: allTimestamps.length,
        maxDifference: maxDiff,
        averageDifference: avgDiff,
        oldestAge: Math.max(...allTimestamps.map(t => t.age)),
        newestAge: Math.min(...allTimestamps.map(t => t.age))
      }
    }
    
    this.report.dataIntegrity = integrity
  }

  async checkAlternativeStorages() {
    this.log('Checking alternative storage mechanisms...')
    
    const alternatives = {
      localStorage: {},
      zustandPersist: {},
      otherIndexedDBs: []
    }
    
    // Check localStorage
    try {
      const lsKeys = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        lsKeys.push(key)
        
        // Check for developer-quality related keys
        if (key && (key.includes('developer') || key.includes('quality') || key.includes('jira'))) {
          try {
            const value = localStorage.getItem(key)
            const parsed = JSON.parse(value)
            
            alternatives.localStorage[key] = {
              size: value.length,
              hasData: !!parsed.data,
              dataType: Array.isArray(parsed.data) ? 'array' : typeof parsed.data,
              hasTimestamp: !!parsed.timestamp,
              sample: value.length < 500 ? parsed : 'Too large to display'
            }
            
            if (parsed.data && Array.isArray(parsed.data)) {
              alternatives.localStorage[key].arrayLength = parsed.data.length
            }
          } catch (e) {
            alternatives.localStorage[key] = {
              size: value.length,
              error: 'Not valid JSON',
              sample: value.substring(0, 100) + '...'
            }
          }
        }
      }
      
      alternatives.localStorage.allKeys = lsKeys
      alternatives.localStorage.totalKeys = lsKeys.length
    } catch (error) {
      alternatives.localStorage.error = error.message
    }
    
    // Check for other IndexedDB databases
    if ('databases' in indexedDB) {
      try {
        const databases = await indexedDB.databases()
        alternatives.otherIndexedDBs = databases.map(db => ({
          name: db.name,
          version: db.version,
          isTarget: db.name === this.dbName,
          hasAlternateNaming: db.name.includes('developer') || db.name.includes('quality')
        }))
      } catch (error) {
        alternatives.otherIndexedDBs = [{ error: error.message }]
      }
    }
    
    // Check Zustand persist storage
    const zustandKey = 'developer-quality-storage'
    try {
      // Try to find Zustand persist data in any IndexedDB
      for (const dbInfo of alternatives.otherIndexedDBs) {
        if (dbInfo.name && dbInfo.name !== this.dbName) {
          try {
            const db = await this.openSpecificDatabase(dbInfo.name)
            if (db && db.objectStoreNames.contains('keyvaluepairs')) {
              const zustandData = await this.getZustandData(db, zustandKey)
              if (zustandData) {
                alternatives.zustandPersist[dbInfo.name] = zustandData
              }
            }
            if (db) db.close()
          } catch (e) {
            // Ignore errors for alternate DBs
          }
        }
      }
    } catch (error) {
      alternatives.zustandPersist.error = error.message
    }
    
    this.report.alternativeStorages = alternatives
  }

  async openSpecificDatabase(dbName) {
    return new Promise((resolve) => {
      const request = indexedDB.open(dbName)
      request.onsuccess = (event) => resolve(event.target.result)
      request.onerror = () => resolve(null)
    })
  }

  async getZustandData(db, key) {
    return new Promise((resolve) => {
      const transaction = db.transaction(['keyvaluepairs'], 'readonly')
      const store = transaction.objectStore('keyvaluepairs')
      const request = store.get(key)
      
      request.onsuccess = () => {
        const result = request.result
        if (result && result.state) {
          resolve({
            hasState: true,
            hasFilters: !!result.state.filters,
            hasData: !!result.state.data,
            stateKeys: Object.keys(result.state),
            sample: JSON.stringify(result.state).length < 500 ? result.state : 'Too large to display'
          })
        } else {
          resolve(null)
        }
      }
      
      request.onerror = () => resolve(null)
    })
  }

  generateRecommendations() {
    this.log('Generating recommendations...')
    
    const recommendations = []
    
    // Database existence
    if (this.report.database.error) {
      recommendations.push({
        priority: 'critical',
        category: 'database',
        issue: 'Database does not exist or cannot be accessed',
        solution: 'Check if the application has created the IndexedDB database. Verify database name matches code.',
        action: 'Verify database initialization in developerQualityIndexedDB.js'
      })
    }
    
    // Missing stores
    if (this.report.database.missingStores && this.report.database.missingStores.length > 0) {
      recommendations.push({
        priority: 'high',
        category: 'schema',
        issue: `Missing object stores: ${this.report.database.missingStores.join(', ')}`,
        solution: 'Run database migration or trigger database upgrade',
        action: 'Check onupgradeneeded handler in developerQualityIndexedDB.js'
      })
    }
    
    // Key conflicts
    if (this.report.keyConflicts.namingConflicts.length > 0) {
      recommendations.push({
        priority: 'high',
        category: 'naming',
        issue: 'Naming conflicts detected between stored keys and expected keys',
        solution: 'Standardize key naming convention (underscore vs hyphen)',
        action: 'Update CACHE_KEYS constants or migrate existing data'
      })
    }
    
    // Missing data
    if (this.report.keyConflicts.missingKeys.length > 0) {
      recommendations.push({
        priority: 'medium',
        category: 'data',
        issue: `Missing expected data keys: ${this.report.keyConflicts.missingKeys.length} keys`,
        solution: 'Re-process JIRA data to populate missing keys',
        action: 'Trigger full data refresh or check data processing pipeline'
      })
    }
    
    // Timestamp issues
    if (this.report.dataIntegrity && !this.report.dataIntegrity.timestampConsistency) {
      recommendations.push({
        priority: 'medium',
        category: 'integrity',
        issue: 'Timestamp inconsistencies detected across stores',
        solution: 'Clear cache and re-process data to ensure consistency',
        action: 'Clear IndexedDB and trigger fresh data load'
      })
    }
    
    // Alternative storage conflicts
    if (this.report.alternativeStorages.localStorage.totalKeys > 0) {
      const relevantKeys = Object.keys(this.report.alternativeStorages.localStorage).filter(key => 
        key !== 'allKeys' && key !== 'totalKeys' && key !== 'error'
      )
      if (relevantKeys.length > 0) {
        recommendations.push({
          priority: 'low',
          category: 'storage',
          issue: 'Data found in localStorage that might conflict with IndexedDB',
          solution: 'Clear localStorage or migrate data to IndexedDB',
          action: 'Review localStorage data and clear if outdated'
        })
      }
    }
    
    // No data found anywhere
    const hasAnyData = (
      Object.values(this.report.stores).some(store => store.keyCount > 0) ||
      Object.keys(this.report.alternativeStorages.localStorage).filter(key => 
        key !== 'allKeys' && key !== 'totalKeys' && key !== 'error'
      ).length > 0
    )
    
    if (!hasAnyData) {
      recommendations.push({
        priority: 'critical',
        category: 'data',
        issue: 'No data found in any storage mechanism',
        solution: 'Trigger initial data load from JIRA API',
        action: 'Load developer quality dashboard and wait for data processing to complete'
      })
    }
    
    this.report.recommendations = recommendations
    
    recommendations.forEach(rec => {
      this.log(`[${rec.priority.toUpperCase()}] ${rec.issue}`, rec.priority === 'critical' ? 'error' : 'warn')
    })
  }

  exportReport() {
    this.log('Generating export report...')
    
    // Create a comprehensive report
    const exportData = {
      ...this.report,
      exportInfo: {
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        location: window.location.href,
        inspectorVersion: '1.0.0'
      }
    }
    
    // Create downloadable file
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    
    const a = document.createElement('a')
    a.href = url
    a.download = `database-inspection-report-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    this.log('Report exported successfully', 'success')
    
    // Also log summary to console
    this.logSummary()
    
    return exportData
  }

  logSummary() {
    console.log('\n📊 DATABASE INSPECTION SUMMARY')
    console.log('=====================================')
    console.log(`Database: ${this.report.database.name || 'NOT FOUND'}`)
    console.log(`Stores Found: ${Object.keys(this.report.stores).length}/${this.expectedStores.length}`)
    console.log(`Total Data Entries: ${Object.values(this.report.stores).reduce((sum, store) => sum + (store.keyCount || 0), 0)}`)
    console.log(`Key Conflicts: ${this.report.keyConflicts?.namingConflicts?.length || 0}`)
    console.log(`Missing Keys: ${this.report.keyConflicts?.missingKeys?.length || 0}`)
    console.log(`Recommendations: ${this.report.recommendations?.length || 0}`)
    
    if (this.report.recommendations && this.report.recommendations.length > 0) {
      console.log('\n🔧 TOP RECOMMENDATIONS:')
      this.report.recommendations.slice(0, 3).forEach((rec, i) => {
        console.log(`${i + 1}. [${rec.priority.toUpperCase()}] ${rec.issue}`)
        console.log(`   → ${rec.solution}`)
      })
    }
    
    console.log('\n💾 Full report saved to downloaded JSON file')
  }

  async inspectAndExport() {
    await this.inspectDatabase()
    return this.exportReport()
  }
}

// Main function to run the inspection
async function inspectDeveloperQualityDatabase() {
  console.log('🚀 Starting Developer Quality Dashboard Database Inspection...')
  
  const inspector = new DatabaseInspector()
  return await inspector.inspectAndExport()
}

// Auto-export for easy usage
window.inspectDeveloperQualityDatabase = inspectDeveloperQualityDatabase

// Show usage instructions
console.log(`
🔍 Database Inspector Loaded!

Usage:
1. Run: inspectDeveloperQualityDatabase()
2. Wait for inspection to complete
3. Download the generated JSON report
4. Share the report for detailed analysis

The inspection will check:
- IndexedDB database structure
- All object stores and their contents
- Key naming conflicts (underscore vs hyphen)
- Data integrity and consistency
- Alternative storage mechanisms
- Generate specific recommendations

Ready to run! Execute: inspectDeveloperQualityDatabase()
`)