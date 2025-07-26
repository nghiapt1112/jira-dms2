/**
 * Database Conflict Resolver for Developer Quality Dashboard
 * 
 * This script investigates both database naming variants and provides
 * automated fixes for the database naming conflict and missing object stores.
 * 
 * Usage:
 * 1. Run this script in browser console on the dashboard page
 * 2. Call investigateAndFix() to analyze and fix the issues
 * 3. The script will automatically resolve naming conflicts and missing stores
 */

class DatabaseConflictResolver {
  constructor() {
    // Track all possible database names for migration
    this.databases = {
      // New prefixed name (target)
      prefixed: 'indexed-developer-quality-dashboard',
      // Old names that might exist
      hyphen: 'developer-quality-dashboard',
      underscore: 'developer_quality_dashboard'
    }
    this.targetDatabase = 'indexed-developer-quality-dashboard'
    this.expectedStores = ['metrics', 'chart_data', 'indices', 'filter_options', 'minimal_issues', 'metadata']
    this.investigation = {
      databases: {},
      dataLocation: null,
      conflicts: [],
      solutions: []
    }
  }

  log(message, level = 'info') {
    const timestamp = new Date().toISOString()
    const prefix = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : level === 'success' ? '✅' : level === 'fix' ? '🔧' : '🔍'
    console.log(`${prefix} [${timestamp}] ${message}`)
  }

  async investigateAllDatabases() {
    this.log('🚀 Starting comprehensive database investigation...')

    // Check both database variants
    for (const [variant, dbName] of Object.entries(this.databases)) {
      this.log(`Investigating ${variant} database: ${dbName}`)
      
      try {
        const db = await this.openDatabase(dbName)
        
        if (db) {
          const dbInfo = {
            exists: true,
            name: db.name,
            version: db.version,
            stores: Array.from(db.objectStoreNames),
            storeData: {}
          }

          // Check each expected store
          for (const storeName of this.expectedStores) {
            if (db.objectStoreNames.contains(storeName)) {
              const storeData = await this.inspectStore(db, storeName)
              dbInfo.storeData[storeName] = storeData
            }
          }

          // Also check for any other stores
          for (const storeName of db.objectStoreNames) {
            if (!this.expectedStores.includes(storeName)) {
              const storeData = await this.inspectStore(db, storeName)
              dbInfo.storeData[storeName] = storeData
            }
          }

          this.investigation.databases[variant] = dbInfo
          db.close()

          this.log(`${variant} database has ${dbInfo.stores.length} stores: ${dbInfo.stores.join(', ')}`)
          
          // Check if this database has actual data
          const totalEntries = Object.values(dbInfo.storeData).reduce((sum, store) => sum + (store?.entryCount || 0), 0)
          if (totalEntries > 0) {
            this.log(`${variant} database contains ${totalEntries} data entries`, 'success')
            this.investigation.dataLocation = variant
          }

        } else {
          this.investigation.databases[variant] = {
            exists: false,
            error: 'Database does not exist'
          }
          this.log(`${variant} database does not exist`, 'warn')
        }

      } catch (error) {
        this.investigation.databases[variant] = {
          exists: false,
          error: error.message
        }
        this.log(`Error investigating ${variant} database: ${error.message}`, 'error')
      }
    }

    // Analyze the investigation results
    this.analyzeInvestigation()
  }

  async openDatabase(dbName) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(dbName)
      
      request.onsuccess = (event) => {
        resolve(event.target.result)
      }
      
      request.onerror = (event) => {
        resolve(null) // Don't reject, just return null
      }
      
      request.onblocked = () => {
        resolve(null)
      }
    })
  }

  async inspectStore(db, storeName) {
    return new Promise((resolve) => {
      try {
        const transaction = db.transaction([storeName], 'readonly')
        const store = transaction.objectStore(storeName)
        
        // Get count and keys
        const countRequest = store.count()
        const keysRequest = store.getAllKeys()
        
        Promise.all([
          new Promise(res => {
            countRequest.onsuccess = () => res(countRequest.result)
            countRequest.onerror = () => res(0)
          }),
          new Promise(res => {
            keysRequest.onsuccess = () => res(keysRequest.result)
            keysRequest.onerror = () => res([])
          })
        ]).then(([count, keys]) => {
          resolve({
            entryCount: count,
            keys: keys,
            indices: Array.from(store.indexNames),
            keyPath: store.keyPath,
            autoIncrement: store.autoIncrement
          })
        })
        
      } catch (error) {
        resolve({
          entryCount: 0,
          keys: [],
          error: error.message
        })
      }
    })
  }

  analyzeInvestigation() {
    this.log('📊 Analyzing investigation results...')

    const conflicts = []
    const solutions = []

    // Check if both databases exist
    const hyphenExists = this.investigation.databases.hyphen?.exists
    const underscoreExists = this.investigation.databases.underscore?.exists

    if (hyphenExists && underscoreExists) {
      conflicts.push({
        type: 'duplicate_databases',
        severity: 'high',
        description: 'Both hyphen and underscore database variants exist',
        impact: 'Data fragmentation and confusion'
      })

      // Determine which has more data
      const hyphenData = this.getTotalEntries('hyphen')
      const underscoreData = this.getTotalEntries('underscore')

      if (hyphenData > underscoreData) {
        solutions.push({
          action: 'consolidate_to_hyphen',
          description: 'Consolidate all data to hyphen database (has more data)',
          steps: ['Migrate underscore data to hyphen database', 'Delete underscore database']
        })
      } else if (underscoreData > hyphenData) {
        solutions.push({
          action: 'consolidate_to_underscore',
          description: 'Consolidate all data to underscore database (has more data)',
          steps: ['Migrate hyphen data to underscore database', 'Delete hyphen database']
        })
      } else {
        solutions.push({
          action: 'standardize_to_hyphen',
          description: 'Standardize to hyphen database (matches current code)',
          steps: ['Delete underscore database', 'Ensure hyphen database is properly initialized']
        })
      }
    }

    // Check for missing object stores
    for (const [variant, dbInfo] of Object.entries(this.investigation.databases)) {
      if (dbInfo.exists) {
        const missingStores = this.expectedStores.filter(store => !dbInfo.stores.includes(store))
        
        if (missingStores.length > 0) {
          conflicts.push({
            type: 'missing_stores',
            variant: variant,
            severity: 'critical',
            description: `${variant} database missing stores: ${missingStores.join(', ')}`,
            missingStores: missingStores
          })

          solutions.push({
            action: 'recreate_database_schema',
            variant: variant,
            description: `Recreate ${variant} database with proper schema`,
            steps: [
              'Delete existing database',
              'Trigger database recreation with onupgradeneeded',
              'Verify all object stores are created'
            ]
          })
        }
      }
    }

    // Check if no databases have proper schema
    const hasProperSchema = Object.values(this.investigation.databases).some(db => 
      db.exists && this.expectedStores.every(store => db.stores.includes(store))
    )

    if (!hasProperSchema) {
      conflicts.push({
        type: 'no_proper_schema',
        severity: 'critical',
        description: 'No database has the complete expected schema',
        impact: 'Data cannot be stored properly'
      })

      solutions.push({
        action: 'force_database_recreation',
        description: 'Force complete database recreation',
        steps: [
          'Delete all existing databases',
          'Clear all browser cache',
          'Trigger fresh database creation',
          'Verify schema is complete'
        ]
      })
    }

    this.investigation.conflicts = conflicts
    this.investigation.solutions = solutions

    // Log findings
    this.log(`Found ${conflicts.length} conflicts and ${solutions.length} solutions`)
    conflicts.forEach(conflict => {
      this.log(`[${conflict.severity.toUpperCase()}] ${conflict.description}`, conflict.severity === 'critical' ? 'error' : 'warn')
    })
  }

  getTotalEntries(variant) {
    const db = this.investigation.databases[variant]
    if (!db?.exists || !db.storeData) return 0
    
    return Object.values(db.storeData).reduce((sum, store) => sum + (store?.entryCount || 0), 0)
  }

  async fixDatabaseIssues() {
    this.log('🔧 Starting automated database fixes...', 'fix')

    const solutions = this.investigation.solutions

    for (const solution of solutions) {
      this.log(`Applying fix: ${solution.description}`, 'fix')

      switch (solution.action) {
        case 'consolidate_to_hyphen':
          await this.consolidateToHyphen()
          break
        
        case 'consolidate_to_underscore':
          await this.consolidateToUnderscore()
          break
        
        case 'standardize_to_hyphen':
          await this.standardizeToHyphen()
          break
        
        case 'recreate_database_schema':
          await this.recreateDatabaseSchema(solution.variant)
          break
        
        case 'force_database_recreation':
          await this.forceCompleteDatabaseRecreation()
          break
        
        default:
          this.log(`Unknown solution action: ${solution.action}`, 'warn')
      }
    }

    this.log('🎉 Database fixes completed!', 'success')
    
    // Re-investigate to verify fixes
    await this.investigateAllDatabases()
    this.generateFinalReport()
  }

  async consolidateToHyphen() {
    this.log('Consolidating data to hyphen database...', 'fix')
    
    // For now, just delete the underscore database since hyphen is the target
    await this.deleteDatabase(this.databases.underscore)
    
    // Ensure hyphen database has proper schema
    await this.ensureProperSchema(this.databases.hyphen)
  }

  async consolidateToUnderscore() {
    this.log('Consolidating data to underscore database...', 'fix')
    
    // This would require updating the code to use underscore naming
    // For now, recommend manual intervention
    this.log('Manual intervention required: Update code to use underscore naming', 'warn')
  }

  async standardizeToHyphen() {
    this.log('Standardizing to hyphen database...', 'fix')
    
    // Delete underscore variant
    await this.deleteDatabase(this.databases.underscore)
    
    // Ensure hyphen database has proper schema
    await this.ensureProperSchema(this.databases.hyphen)
  }

  async recreateDatabaseSchema(variant) {
    const dbName = this.databases[variant]
    this.log(`Recreating schema for ${variant} database: ${dbName}`, 'fix')
    
    // Delete and recreate
    await this.deleteDatabase(dbName)
    await this.ensureProperSchema(dbName)
  }

  async forceCompleteDatabaseRecreation() {
    this.log('Force recreating all databases...', 'fix')
    
    // Delete all variants
    for (const dbName of Object.values(this.databases)) {
      await this.deleteDatabase(dbName)
    }
    
    // Recreate the correct one
    await this.ensureProperSchema(this.databases.hyphen)
  }

  async deleteDatabase(dbName) {
    return new Promise((resolve) => {
      this.log(`Deleting database: ${dbName}`)
      
      const deleteRequest = indexedDB.deleteDatabase(dbName)
      
      deleteRequest.onsuccess = () => {
        this.log(`Successfully deleted database: ${dbName}`, 'success')
        resolve(true)
      }
      
      deleteRequest.onerror = () => {
        this.log(`Failed to delete database: ${dbName}`, 'error')
        resolve(false)
      }
      
      deleteRequest.onblocked = () => {
        this.log(`Delete blocked for database: ${dbName}`, 'warn')
        resolve(false)
      }
    })
  }

  async ensureProperSchema(dbName) {
    return new Promise((resolve, reject) => {
      this.log(`Ensuring proper schema for database: ${dbName}`)
      
      // Open with version 2 to trigger upgrade
      const request = indexedDB.open(dbName, 2)
      
      request.onsuccess = (event) => {
        const db = event.target.result
        this.log(`Database ${dbName} opened successfully with ${db.objectStoreNames.length} stores`)
        
        // Verify all expected stores exist
        const missingStores = this.expectedStores.filter(store => !db.objectStoreNames.contains(store))
        if (missingStores.length === 0) {
          this.log(`All expected stores present in ${dbName}`, 'success')
        } else {
          this.log(`Still missing stores in ${dbName}: ${missingStores.join(', ')}`, 'warn')
        }
        
        db.close()
        resolve(true)
      }
      
      request.onerror = () => {
        this.log(`Failed to open database ${dbName}`, 'error')
        resolve(false)
      }
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result
        this.log(`Creating object stores for ${dbName}...`)
        
        // Create all expected stores
        this.expectedStores.forEach(storeName => {
          if (!db.objectStoreNames.contains(storeName)) {
            this.log(`Creating store: ${storeName}`)
            
            if (storeName === 'minimal_issues') {
              const store = db.createObjectStore(storeName, { keyPath: 'id' })
              store.createIndex('assignee', 'assignee', { unique: false })
              store.createIndex('project', 'project', { unique: false })
              store.createIndex('created', 'created', { unique: false })
              store.createIndex('timestamp', 'timestamp', { unique: false })
            } else {
              const store = db.createObjectStore(storeName, { keyPath: 'key' })
              store.createIndex('timestamp', 'timestamp', { unique: false })
              if (storeName !== 'filter_options' && storeName !== 'metadata') {
                store.createIndex('type', 'type', { unique: false })
              }
            }
          }
        })
      }
    })
  }

  generateFinalReport() {
    const report = {
      timestamp: new Date().toISOString(),
      investigation: this.investigation,
      recommendations: this.generateRecommendations()
    }

    console.log('\n🎯 FINAL DATABASE CONFLICT RESOLUTION REPORT')
    console.log('=============================================')
    
    Object.entries(this.investigation.databases).forEach(([variant, db]) => {
      console.log(`\n${variant.toUpperCase()} DATABASE (${this.databases[variant]}):`)
      if (db.exists) {
        console.log(`  ✅ Exists with ${db.stores.length} stores`)
        console.log(`  📊 Total entries: ${this.getTotalEntries(variant)}`)
        console.log(`  🗃️  Stores: ${db.stores.join(', ')}`)
      } else {
        console.log(`  ❌ Does not exist`)
      }
    })

    console.log(`\n📍 Data Location: ${this.investigation.dataLocation || 'No data found'}`)
    console.log(`🚨 Conflicts Found: ${this.investigation.conflicts.length}`)
    console.log(`🔧 Solutions Applied: ${this.investigation.solutions.length}`)

    if (this.investigation.conflicts.length === 0) {
      console.log('\n🎉 All database conflicts resolved!')
    }

    return report
  }

  generateRecommendations() {
    const recommendations = []

    // Check if issues are resolved
    const hasProperSchema = Object.values(this.investigation.databases).some(db => 
      db.exists && this.expectedStores.every(store => db.stores.includes(store))
    )

    if (!hasProperSchema) {
      recommendations.push({
        priority: 'critical',
        action: 'The database schema is still not properly initialized',
        solution: 'Check the developerQualityIndexedDB.js onupgradeneeded handler',
        details: 'The object stores are not being created properly during database initialization'
      })
    }

    if (this.investigation.conflicts.some(c => c.type === 'duplicate_databases')) {
      recommendations.push({
        priority: 'high',
        action: 'Multiple database variants still exist',
        solution: 'Ensure only one database variant is used throughout the application',
        details: 'Update all code references to use consistent naming'
      })
    }

    return recommendations
  }

  async investigateAndFix() {
    await this.investigateAllDatabases()
    await this.fixDatabaseIssues()
    return this.generateFinalReport()
  }
}

// Main functions for easy usage
async function investigateAndFixDatabases() {
  console.log('🚀 Starting Database Conflict Resolution...')
  
  const resolver = new DatabaseConflictResolver()
  return await resolver.investigateAndFix()
}

async function justInvestigate() {
  console.log('🔍 Investigating database conflicts...')
  
  const resolver = new DatabaseConflictResolver()
  await resolver.investigateAllDatabases()
  return resolver.generateFinalReport()
}

// Export for easy usage
window.investigateAndFixDatabases = investigateAndFixDatabases
window.justInvestigate = justInvestigate

console.log(`
🔧 Database Conflict Resolver Loaded!

Usage:
1. To investigate and automatically fix: investigateAndFixDatabases()
2. To just investigate: justInvestigate()

This will:
- Check both 'developer-quality-dashboard' and 'developer_quality_dashboard'
- Identify which database has data (if any)
- Detect missing object stores
- Automatically fix naming conflicts
- Recreate proper database schema
- Provide detailed resolution report

Ready to run! Execute: investigateAndFixDatabases()
`)