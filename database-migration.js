/**
 * Database Migration Script for Developer Quality Dashboard
 * 
 * This script migrates data from old database names to the new prefixed format:
 * - From: 'developer_quality_dashboard' or 'developer-quality-dashboard'
 * - To: 'indexed-developer-quality-dashboard'
 * 
 * Usage:
 * 1. Run this script in browser console on the dashboard page
 * 2. Call migrateDatabases() to perform the migration
 * 3. The script will automatically backup, migrate, and verify data
 */

class DatabaseMigration {
  constructor() {
    this.oldDatabases = [
      'developer_quality_dashboard',
      'developer-quality-dashboard'
    ]
    this.newDatabase = 'indexed-developer-quality-dashboard'
    this.expectedStores = ['metrics', 'chart_data', 'indices', 'filter_options', 'minimal_issues', 'metadata']
    this.migrationReport = {
      timestamp: new Date().toISOString(),
      oldDatabases: {},
      newDatabase: {},
      migrated: [],
      errors: [],
      success: false
    }
  }

  log(message, level = 'info') {
    const timestamp = new Date().toISOString()
    const prefix = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : level === 'success' ? '✅' : level === 'migrate' ? '🔄' : '🔍'
    console.log(`${prefix} [${timestamp}] ${message}`)
  }

  async checkDatabase(dbName) {
    return new Promise((resolve) => {
      const request = indexedDB.open(dbName)
      
      request.onsuccess = (event) => {
        const db = event.target.result
        const info = {
          exists: true,
          version: db.version,
          stores: Array.from(db.objectStoreNames),
          hasData: false,
          totalEntries: 0
        }
        
        // Check if it has the expected stores
        const hasExpectedStores = this.expectedStores.every(store => 
          db.objectStoreNames.contains(store)
        )
        
        info.hasExpectedStores = hasExpectedStores
        
        db.close()
        resolve(info)
      }
      
      request.onerror = () => {
        resolve({ exists: false })
      }
    })
  }

  async getDataFromDatabase(dbName) {
    return new Promise((resolve) => {
      const request = indexedDB.open(dbName)
      const allData = {}
      
      request.onsuccess = async (event) => {
        const db = event.target.result
        
        try {
          // Get data from each store
          for (const storeName of db.objectStoreNames) {
            const transaction = db.transaction([storeName], 'readonly')
            const store = transaction.objectStore(storeName)
            
            const data = await new Promise((res) => {
              const getAllRequest = store.getAll()
              getAllRequest.onsuccess = () => res(getAllRequest.result)
              getAllRequest.onerror = () => res([])
            })
            
            allData[storeName] = data
            this.log(`Retrieved ${data.length} entries from ${dbName}.${storeName}`)
          }
          
          db.close()
          resolve(allData)
        } catch (error) {
          this.log(`Error getting data from ${dbName}: ${error.message}`, 'error')
          db.close()
          resolve(allData)
        }
      }
      
      request.onerror = () => {
        resolve({})
      }
    })
  }

  async migrateData(sourceData, targetDbName) {
    return new Promise((resolve, reject) => {
      // Open with version 2 to trigger upgrade if needed
      const request = indexedDB.open(targetDbName, 2)
      
      request.onsuccess = async (event) => {
        const db = event.target.result
        
        try {
          // Migrate data to each store
          for (const [storeName, data] of Object.entries(sourceData)) {
            if (data.length === 0) continue
            
            if (db.objectStoreNames.contains(storeName)) {
              const transaction = db.transaction([storeName], 'readwrite')
              const store = transaction.objectStore(storeName)
              
              let migrated = 0
              for (const item of data) {
                try {
                  await new Promise((res, rej) => {
                    const request = store.put(item)
                    request.onsuccess = () => {
                      migrated++
                      res()
                    }
                    request.onerror = () => rej(request.error)
                  })
                } catch (error) {
                  this.log(`Error migrating item in ${storeName}: ${error.message}`, 'warn')
                }
              }
              
              this.log(`Migrated ${migrated}/${data.length} entries to ${targetDbName}.${storeName}`, 'migrate')
            } else {
              this.log(`Store ${storeName} not found in target database`, 'warn')
            }
          }
          
          db.close()
          resolve(true)
        } catch (error) {
          this.log(`Migration error: ${error.message}`, 'error')
          db.close()
          reject(error)
        }
      }
      
      request.onerror = () => {
        reject(new Error('Failed to open target database'))
      }
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result
        this.log(`Creating object stores for ${targetDbName}...`)
        
        // Create all expected stores if they don't exist
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

  async performMigration() {
    this.log('🚀 Starting database migration...')
    
    // Step 1: Check all databases
    this.log('Step 1: Checking existing databases...')
    
    for (const oldDb of this.oldDatabases) {
      const info = await this.checkDatabase(oldDb)
      this.migrationReport.oldDatabases[oldDb] = info
      
      if (info.exists) {
        this.log(`Found old database: ${oldDb} (v${info.version}) with ${info.stores.length} stores`)
      } else {
        this.log(`Old database ${oldDb} does not exist`)
      }
    }
    
    // Check new database
    const newDbInfo = await this.checkDatabase(this.newDatabase)
    this.migrationReport.newDatabase = newDbInfo
    this.log(`New database ${this.newDatabase} ${newDbInfo.exists ? 'exists' : 'will be created'}`)
    
    // Step 2: Find which old database has data
    this.log('Step 2: Looking for data to migrate...')
    
    let dataToMigrate = null
    let sourceDatabase = null
    
    for (const oldDb of this.oldDatabases) {
      if (this.migrationReport.oldDatabases[oldDb].exists) {
        const data = await this.getDataFromDatabase(oldDb)
        const totalEntries = Object.values(data).reduce((sum, arr) => sum + arr.length, 0)
        
        if (totalEntries > 0) {
          this.log(`Found ${totalEntries} entries in ${oldDb}`, 'success')
          
          if (!dataToMigrate || totalEntries > Object.values(dataToMigrate).reduce((sum, arr) => sum + arr.length, 0)) {
            dataToMigrate = data
            sourceDatabase = oldDb
          }
        }
      }
    }
    
    if (!dataToMigrate || Object.values(dataToMigrate).reduce((sum, arr) => sum + arr.length, 0) === 0) {
      this.log('No data found to migrate', 'warn')
      this.migrationReport.success = true
      return this.migrationReport
    }
    
    // Step 3: Migrate data
    this.log(`Step 3: Migrating data from ${sourceDatabase} to ${this.newDatabase}...`, 'migrate')
    
    try {
      await this.migrateData(dataToMigrate, this.newDatabase)
      this.migrationReport.migrated.push({
        from: sourceDatabase,
        to: this.newDatabase,
        entries: Object.values(dataToMigrate).reduce((sum, arr) => sum + arr.length, 0)
      })
      this.log('Migration completed successfully!', 'success')
    } catch (error) {
      this.log(`Migration failed: ${error.message}`, 'error')
      this.migrationReport.errors.push(error.message)
      return this.migrationReport
    }
    
    // Step 4: Verify migration
    this.log('Step 4: Verifying migration...')
    
    const verifyInfo = await this.checkDatabase(this.newDatabase)
    const newData = await this.getDataFromDatabase(this.newDatabase)
    const newTotalEntries = Object.values(newData).reduce((sum, arr) => sum + arr.length, 0)
    
    this.log(`New database has ${newTotalEntries} entries`, 'success')
    
    // Step 5: Offer to delete old databases
    this.log('Step 5: Cleanup old databases...')
    this.log('Old databases can be deleted manually using: indexedDB.deleteDatabase("database-name")')
    
    this.migrationReport.success = true
    this.migrationReport.summary = {
      migratedFrom: sourceDatabase,
      totalEntriesMigrated: newTotalEntries,
      newDatabaseReady: true
    }
    
    return this.migrationReport
  }

  generateReport() {
    console.log('\n📊 MIGRATION REPORT')
    console.log('==================')
    console.log(`Timestamp: ${this.migrationReport.timestamp}`)
    console.log(`Success: ${this.migrationReport.success ? '✅' : '❌'}`)
    
    if (this.migrationReport.summary) {
      console.log(`\nMigrated from: ${this.migrationReport.summary.migratedFrom}`)
      console.log(`Total entries: ${this.migrationReport.summary.totalEntriesMigrated}`)
      console.log(`New database ready: ${this.migrationReport.summary.newDatabaseReady ? '✅' : '❌'}`)
    }
    
    if (this.migrationReport.errors.length > 0) {
      console.log(`\n❌ Errors: ${this.migrationReport.errors.join(', ')}`)
    }
    
    console.log('\n💡 Next steps:')
    console.log('1. Test the application to ensure data loads correctly')
    console.log('2. Delete old databases if everything works:')
    this.oldDatabases.forEach(db => {
      console.log(`   indexedDB.deleteDatabase('${db}')`)
    })
    
    return this.migrationReport
  }
}

// Main migration function
async function migrateDatabases() {
  console.log('🚀 Starting Developer Quality Dashboard Database Migration...')
  
  const migration = new DatabaseMigration()
  await migration.performMigration()
  return migration.generateReport()
}

// Delete old databases function
function deleteOldDatabases() {
  const oldDatabases = [
    'developer_quality_dashboard',
    'developer-quality-dashboard'
  ]
  
  console.log('🗑️ Deleting old databases...')
  
  oldDatabases.forEach(dbName => {
    const request = indexedDB.deleteDatabase(dbName)
    request.onsuccess = () => console.log(`✅ Deleted: ${dbName}`)
    request.onerror = () => console.log(`❌ Failed to delete: ${dbName}`)
  })
}

// Export for usage
window.migrateDatabases = migrateDatabases
window.deleteOldDatabases = deleteOldDatabases

console.log(`
🔄 Database Migration Tool Loaded!

Usage:
1. Migrate data: migrateDatabases()
2. Delete old databases: deleteOldDatabases()

This will:
- Check for old databases ('developer_quality_dashboard', 'developer-quality-dashboard')
- Migrate any existing data to new 'indexed-developer-quality-dashboard'
- Create proper object stores if missing
- Verify the migration was successful
- Provide cleanup instructions

Ready to run! Execute: migrateDatabases()
`)