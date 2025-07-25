import { create } from 'zustand'
import { persist, devtools } from 'zustand/middleware'
import { jiraIssuesService } from '../../features/jira-data/services/jiraIssuesService'
import { s3DownloadService } from '../../features/jira-data/services/s3DownloadService'
import { dataProcessingService } from '../../features/jira-data/services/dataProcessingService'
import { downloadAsJson, generateTimestampedFilename } from '../utils/fileDownload'
import { dataPipelineLogger } from '../services/dataPipelineLogger'

/**
 * Debug Store - Global debugging functionality
 * Provides Export Logs and Fresh Data functionality accessible from all routes
 * Follows .cursorrules Zustand patterns with persist and devtools middleware
 */
export const useDebugStore = create(
  persist(
    devtools(
      (set, get) => ({
  // State
  isOpen: false,
  isExporting: false,
  isRefreshing: false,
  logs: [],
  lastExport: null,
  lastRefresh: null,
  refreshProgress: 0,
  refreshStage: null,
  error: null,

  // UI Actions
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set(state => ({ isOpen: !state.isOpen })),

  // Clear error
  clearError: () => set({ error: null }),

  // Export Logs Functionality
  exportLogs: async () => {
    const state = get()
    if (state.isExporting) return

    set({ isExporting: true, error: null })
    
    try {
      // Capture console logs from browser's console
      const logs = await captureConsoleLogs()
      
      // Get additional app state for debugging
      const debugInfo = {
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        consoleLogs: logs,
        appState: {
          jiraData: getJiraDataState(),
          developerQuality: getDeveloperQualityState(),
          debug: state
        },
        localStorage: getLocalStorageData(),
        sessionStorage: getSessionStorageData(),
        performance: getPerformanceData(),
        // Enhanced: Add comprehensive data pipeline logs
        dataPipelineLogs: dataPipelineLogger.exportLogs()
      }

      // Use reusable download utility (follows DRY principle)
      const filename = generateTimestampedFilename('debug-logs', 'json')
      const downloadResult = await downloadAsJson(debugInfo, filename)

      set({ 
        lastExport: new Date().toISOString(),
        isExporting: false 
      })

      return { 
        success: downloadResult.success, 
        filename: downloadResult.filename, 
        logCount: logs.length,
        size: downloadResult.size
      }
    } catch (error) {
      console.error('Export logs failed:', error)
      set({ 
        error: `Export failed: ${error.message}`,
        isExporting: false 
      })
      throw error
    }
  },

  // Fresh Data Functionality - Force refresh from /issues/v3 API
  refreshData: async () => {
    const state = get()
    if (state.isRefreshing) return

    // Initialize comprehensive logging
    dataPipelineLogger.logs = [] // Reset logs for fresh tracking
    dataPipelineLogger.metrics = {
      api: { totalRecordsFromAPI: 0, snapshotsCount: 0, downloadSuccessCount: 0, downloadFailureCount: 0, downloadDetails: [] },
      processing: { totalIssuesReceived: 0, memberFiltered: { included: 0, excluded: 0, excludedBreakdown: { unassigned: 0, notConfigured: 0, unknownDevelopers: new Set() }}, projectFiltered: { included: 0, excluded: 0, excludedProjects: new Set() }, issueTypeBreakdown: new Map(), statusBreakdown: new Map(), timeRangeBreakdown: { currentQuarter: 0, previousQuarters: 0, dateRange: { earliest: null, latest: null }}},
      storage: { indexedDBRecords: 0, cacheKeys: [], storageBreakdown: { metrics: 0, chartData: 0, indices: 0, filterOptions: 0, minimalIssues: 0 }},
      performance: { fetchTime: 0, processingTime: 0, storageTime: 0, totalTime: 0 }
    }
    dataPipelineLogger.startTime = Date.now()

    set({ 
      isRefreshing: true, 
      error: null, 
      refreshProgress: 0,
      refreshStage: 'Initializing...'
    })
    
    try {
      // Step 1: Clear existing data
      set({ refreshStage: 'Clearing existing data and caches...', refreshProgress: 5 })
      const { useJiraDataStore } = await import('../../features/jira-data/store/jiraDataStore')
      const { useDeveloperQualityStore } = await import('../../features/developer-quality-dashboard/store/developerQualityStore')
      
      const jiraStore = useJiraDataStore.getState()
      const devQualityStore = useDeveloperQualityStore.getState()
      
      // Reset stores
      jiraStore.setAllIssues([])
      jiraStore.setSnapshots([])
      jiraStore.setError(null)
      devQualityStore.reset()
      
      // CRITICAL FIX: Clear IndexedDB cache completely
      console.log('🧹 CLEARING INDEXEDDB CACHE...')
      try {
        const { developerQualityIndexedDB } = await import('../../features/developer-quality-dashboard/services/developerQualityIndexedDB')
        const cacheCleared = await developerQualityIndexedDB.clearAllData()
        console.log('🧹 IndexedDB cache cleared:', cacheCleared)
        
        // Also clear any other caches
        if (typeof window !== 'undefined' && window.caches) {
          const cacheNames = await caches.keys()
          await Promise.all(cacheNames.map(name => caches.delete(name)))
          console.log('🧹 Browser caches cleared:', cacheNames.length)
        }
      } catch (clearError) {
        console.warn('⚠️ Failed to clear some caches:', clearError)
        // Continue anyway - don't fail the refresh
      }

      // Step 2: Fetch snapshot URLs from /issues/v3
      set({ refreshStage: 'Fetching snapshot URLs...', refreshProgress: 15 })
      dataPipelineLogger.logAPIStart()
      
      const apiStartTime = Date.now()
      const filters = jiraStore.filters
      
      // CRITICAL DEBUG: Log the filters being sent to API
      console.log('🔍 API REQUEST FILTERS:', filters)
      
      // CRITICAL FIX: Use exact parameters that work with the API
      const broadFilters = {
        ...filters,
        fromDate: '2023/01/01',  // Start from 2023 to get historical data
        toDate: '2025/12/31',    // End at 2025 to ensure all data
        useSnapshots: true,      // Ensure snapshots are enabled
        includeCurrentQuarter: true,
        maxResults: 50000,       // High limit to ensure all data
        expand: "changelog"      // Include changelog for comprehensive data
      }
      
      console.log('🔍 USING BROAD FILTERS:', broadFilters)
      
      const snapshotResponse = await jiraIssuesService.getSnapshotUrls(broadFilters)
      dataPipelineLogger.logPerformance('fetchTime', Date.now() - apiStartTime)
      
      // CRITICAL DEBUG: Log the FULL API response BEFORE checking snapshots
      console.log('🔍 FULL API RESPONSE:', {
        fullResponse: snapshotResponse,
        hasSnapshots: !!snapshotResponse?.snapshots,
        snapshotsLength: snapshotResponse?.snapshots?.length || 0,
        snapshotsArray: snapshotResponse?.snapshots,
        totalRecords: snapshotResponse?.totalRecords,
        responseKeys: Object.keys(snapshotResponse || {}),
        responseType: typeof snapshotResponse
      })
      
      // CRITICAL FIX: Check for snapshots in different possible properties
      let snapshots = null
      let currentQuarter = null
      
      if (snapshotResponse?.snapshots?.length) {
        snapshots = snapshotResponse.snapshots
        currentQuarter = snapshotResponse.currentQuarter
      } else if (snapshotResponse?.quarters?.length) {
        snapshots = snapshotResponse.quarters
        currentQuarter = snapshotResponse.currentQuarter
      } else if (snapshotResponse?.previousQuarters?.length) {
        snapshots = snapshotResponse.previousQuarters
        currentQuarter = snapshotResponse.currentQuarter
      } else if (snapshotResponse?.data?.snapshots?.length) {
        snapshots = snapshotResponse.data.snapshots
        currentQuarter = snapshotResponse.data.currentQuarter
      } else if (snapshotResponse?.data?.quarters?.length) {
        snapshots = snapshotResponse.data.quarters
        currentQuarter = snapshotResponse.data.currentQuarter
      }
      
      if (!snapshots?.length) {
        console.error('🚨 NO SNAPSHOTS AVAILABLE - API Response Analysis:', {
          responseExists: !!snapshotResponse,
          snapshotsExists: !!snapshotResponse?.snapshots,
          snapshotsType: typeof snapshotResponse?.snapshots,
          snapshotsValue: snapshotResponse?.snapshots,
          isArray: Array.isArray(snapshotResponse?.snapshots),
          // Check alternative properties
          hasQuarters: !!snapshotResponse?.quarters,
          hasPreviousQuarters: !!snapshotResponse?.previousQuarters,
          hasDataSnapshots: !!snapshotResponse?.data?.snapshots,
          hasDataQuarters: !!snapshotResponse?.data?.quarters,
          fullResponse: snapshotResponse
        })
        throw new Error('No snapshots available')
      }
      
      // Update the response to use the found snapshots
      const normalizedResponse = {
        ...snapshotResponse,
        snapshots: snapshots,
        currentQuarter: currentQuarter || snapshotResponse.currentQuarter
      }

      // Log API response details
      dataPipelineLogger.logAPIResponse(normalizedResponse)
      
      // Enhanced logging for debugging
      console.log('🔍 API RESPONSE DEBUG:', {
        snapshots: snapshots?.length,
        snapshotDetails: snapshots?.map(s => ({
          quarter: s.quarter,
          year: s.year,
          recordCount: s.recordCount,
          fileSize: s.fileSize
        })),
        totalRecords: normalizedResponse.totalRecords,
        currentQuarter: currentQuarter
      })

      jiraStore.setSnapshots(snapshots)
      jiraStore.setCurrentQuarter(currentQuarter)
      jiraStore.setMetadata(normalizedResponse.metadata)

      // Step 3: Download and process data
      set({ refreshStage: 'Downloading snapshot data...', refreshProgress: 30 })
      
      // CRITICAL DEBUG: Check if we have snapshots to download
      console.log('🔍 DOWNLOAD PREPARATION:', {
        hasSnapshots: !!snapshots,
        snapshotsLength: snapshots?.length || 0,
        snapshotsArray: snapshots,
        aboutToStartDownloads: true
      })
      
      let allIssues = []
      const totalSnapshots = snapshots.length
      
      console.log(`🔍 STARTING DOWNLOAD LOOP: ${totalSnapshots} snapshots to process`)
      
      for (let i = 0; i < snapshots.length; i++) {
        const snapshot = snapshots[i]
        const progress = 30 + ((i / totalSnapshots) * 50) // 30-80% for downloads
        
        // CRITICAL DEBUG: Check each snapshot before download
        console.log(`🔍 PROCESSING SNAPSHOT ${i + 1}/${totalSnapshots}:`, {
          snapshot,
          hasUrl: !!snapshot.url,
          quarter: snapshot.quarter,
          year: snapshot.year,
          expectedRecords: snapshot.recordCount
        })
        
        set({ 
          refreshStage: `Downloading Q${snapshot.quarter} ${snapshot.year}...`,
          refreshProgress: progress 
        })
        
        console.log(`🔍 ABOUT TO DOWNLOAD: Q${snapshot.quarter} ${snapshot.year} from ${snapshot.url}`)
        
        try {
          const snapshotData = await s3DownloadService.downloadSnapshot(
            snapshot.url,
            snapshot.quarter,
            snapshot.year
          )
          
          if (snapshotData && snapshotData.length > 0) {
            allIssues = allIssues.concat(snapshotData)
            dataPipelineLogger.logSnapshotDownload(snapshot, snapshotData)
            
            // Enhanced logging for debugging
            console.log(`🔍 SNAPSHOT DOWNLOAD: Q${snapshot.quarter} ${snapshot.year}`, {
              expected: snapshot.recordCount || 'N/A',
              actual: snapshotData.length,
              difference: (snapshot.recordCount || 0) - snapshotData.length,
              cumulativeTotal: allIssues.length
            })
          } else {
            console.log(`⚠️ EMPTY SNAPSHOT: Q${snapshot.quarter} ${snapshot.year}`, {
              expected: snapshot.recordCount || 'N/A',
              actual: 0,
              snapshotData: snapshotData ? 'Empty array' : 'Null/undefined'
            })
          }
        } catch (downloadError) {
          console.warn(`Failed to download Q${snapshot.quarter} ${snapshot.year}:`, downloadError)
          dataPipelineLogger.logSnapshotDownload(snapshot, null, downloadError)
          // Continue with other snapshots
        }
      }

      // Step 4: Process and deduplicate data
      set({ refreshStage: 'Processing and deduplicating data...', refreshProgress: 85 })
      
      const processingStartTime = Date.now()
      dataPipelineLogger.logProcessingStart(allIssues.length)
      
      // Enhanced logging for debugging
      console.log('🔍 RAW DATA DEBUG:', {
        totalIssuesDownloaded: allIssues.length,
        snapshotsProcessed: snapshots.length,
        downloadBreakdown: snapshots.map(s => ({
          name: `Q${s.quarter} ${s.year}`,
          expected: s.recordCount,
          // This will be updated in the download loop
        }))
      })
      
      const processedData = dataProcessingService.removeDuplicateIssues(allIssues)
      dataPipelineLogger.logPerformance('processingTime', Date.now() - processingStartTime)
      
      // Enhanced logging for deduplication
      console.log('🔍 DEDUPLICATION DEBUG:', {
        beforeDeduplication: allIssues.length,
        afterDeduplication: processedData.length,
        duplicatesRemoved: allIssues.length - processedData.length,
        retentionRate: `${((processedData.length / allIssues.length) * 100).toFixed(2)}%`
      })
      
      // Step 5: Update stores
      set({ refreshStage: 'Updating application state...', refreshProgress: 95 })
      jiraStore.setAllIssues(processedData)
      
      // Step 6: Trigger dependent store refresh (this will include comprehensive processing logging)
      if (processedData.length > 0) {
        await devQualityStore.loadData(processedData)
      }

      // Log final storage stage
      const storageStartTime = Date.now()
      dataPipelineLogger.logStorageStart()
      
      // Simulate storage completion (actual storage happens in developer quality service)
      const finalData = { minimalIssues: processedData }
      dataPipelineLogger.logStorageComplete(true, finalData)
      dataPipelineLogger.logPerformance('storageTime', Date.now() - storageStartTime)
      
      // Generate comprehensive summary report
      const summaryReport = dataPipelineLogger.generateSummaryReport()
      console.log('📊 DATA PIPELINE SUMMARY:', summaryReport)

      set({ 
        refreshStage: 'Complete!',
        refreshProgress: 100,
        lastRefresh: new Date().toISOString(),
        isRefreshing: false 
      })

      return { 
        success: true, 
        totalIssues: processedData.length,
        snapshots: snapshots.length,
        pipelineSummary: summaryReport // Include pipeline summary in return
      }

    } catch (error) {
      console.error('Refresh data failed:', error)
      set({ 
        error: `Refresh failed: ${error.message}`,
        isRefreshing: false,
        refreshStage: null,
        refreshProgress: 0
      })
      throw error
    }
  },

  // Get debug summary
  getSummary: () => {
    const state = get()
    return {
      isOpen: state.isOpen,
      lastExport: state.lastExport,
      lastRefresh: state.lastRefresh,
      isExporting: state.isExporting,
      isRefreshing: state.isRefreshing,
      error: state.error
    }
  }
      }),
      {
        name: 'debug-store'
      }
    ),
    {
      name: 'debug-storage',
      version: 1,
      // Only persist UI preferences, not large debugging data
      partialize: (state) => ({
        // Don't persist logs, export results, or refresh data
        // Only persist user preferences
      })
    }
  )
)

// Helper functions for log capture
const captureConsoleLogs = async () => {
  // This is a simplified version - in a real implementation you might want to
  // override console methods to capture logs in real-time
  const logs = []
  
  // Get performance logs
  if (window.performance && window.performance.getEntries) {
    const perfEntries = window.performance.getEntries()
    perfEntries.forEach(entry => {
      logs.push({
        type: 'performance',
        timestamp: new Date(entry.startTime).toISOString(),
        name: entry.name,
        duration: entry.duration,
        entryType: entry.entryType
      })
    })
  }
  
  // Get error logs from global error handler
  if (window.__debugLogs) {
    logs.push(...window.__debugLogs)
  }
  
  return logs
}

const getLocalStorageData = () => {
  const data = {}
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key) {
        // Don't include sensitive data
        if (!key.includes('token') && !key.includes('password') && !key.includes('secret')) {
          data[key] = localStorage.getItem(key)
        }
      }
    }
  } catch (error) {
    data.error = 'Could not access localStorage'
  }
  return data
}

const getSessionStorageData = () => {
  const data = {}
  try {
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i)
      if (key) {
        // Don't include sensitive data
        if (!key.includes('token') && !key.includes('password') && !key.includes('secret')) {
          data[key] = sessionStorage.getItem(key)
        }
      }
    }
  } catch (error) {
    data.error = 'Could not access sessionStorage'
  }
  return data
}

const getPerformanceData = () => {
  try {
    return {
      memory: window.performance.memory ? {
        usedJSMemory: window.performance.memory.usedJSMemory,
        totalJSMemory: window.performance.memory.totalJSMemory,
        jsMemoryLimit: window.performance.memory.jsMemoryLimit
      } : null,
      timing: window.performance.timing ? {
        navigationStart: window.performance.timing.navigationStart,
        loadEventEnd: window.performance.timing.loadEventEnd,
        domContentLoaded: window.performance.timing.domContentLoadedEventEnd - window.performance.timing.navigationStart,
        loadComplete: window.performance.timing.loadEventEnd - window.performance.timing.navigationStart
      } : null,
      now: window.performance.now()
    }
  } catch (error) {
    return { error: 'Could not access performance data' }
  }
}

// Helper functions to get store states dynamically (avoid circular dependencies)
const getJiraDataState = () => {
  try {
    // Use dynamic import to avoid circular dependency
    const jiraStoreModule = require('../../features/jira-data/store/jiraDataStore')
    return jiraStoreModule.useJiraDataStore.getState()
  } catch (error) {
    return { error: 'Could not access JIRA data store' }
  }
}

const getDeveloperQualityState = () => {
  try {
    // Use dynamic import to avoid circular dependency
    const devQualityStoreModule = require('../../features/developer-quality-dashboard/store/developerQualityStore')
    return devQualityStoreModule.useDeveloperQualityStore.getState()
  } catch (error) {
    return { error: 'Could not access developer quality store' }
  }
}

// Make debug store globally available for console debugging
if (typeof window !== 'undefined') {
  window.debugStore = useDebugStore
}