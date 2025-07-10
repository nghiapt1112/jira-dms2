import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useJiraDataStore = create(
  persist(
    (set, get) => ({
      // State
      snapshots: [],
      currentQuarter: null,
      allIssues: [],
      isLoading: false,
      error: null,
      downloadProgress: {},
      metadata: null,
      lastFetched: null,
      
      // Download progress tracking
      totalSnapshots: 0,
      completedSnapshots: 0,
      currentDownload: null,
      estimatedTotalRecords: 0,
      processedRecords: 0,
      
      // Filter state
      filters: {
        fromDate: '2025/01/01',
        toDate: '2025/07/11',
        selectedProjects: [],
        statuses: [],
        issueTypes: [],
        bugTypes: [],
        rootCauses: [],
        includeCurrentQuarter: true,
        useSnapshots: true
      },
      
      // Actions
      setSnapshots: (snapshots) => set({ snapshots }),
      setCurrentQuarter: (currentQuarter) => set({ currentQuarter }),
      setAllIssues: (issues) => set({ 
        allIssues: issues,
        processedRecords: issues.length,
        lastFetched: new Date().toISOString()
      }),
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      setMetadata: (metadata) => set({ 
        metadata,
        estimatedTotalRecords: metadata?.estimatedTotalRecords || 0
      }),
      
      // Progress tracking
      setDownloadProgress: (snapshotId, progress) => set(state => ({
        downloadProgress: {
          ...state.downloadProgress,
          [snapshotId]: progress
        }
      })),
      
      setCurrentDownload: (download) => set({ currentDownload: download }),
      
      incrementCompletedSnapshots: () => set(state => ({
        completedSnapshots: state.completedSnapshots + 1
      })),
      
      // Filter management
      setFilters: (filters) => set(state => ({
        filters: { ...state.filters, ...filters }
      })),
      
      resetFilters: () => set(state => ({
        filters: {
          fromDate: '2025/01/01',
          toDate: '2025/07/11',
          selectedProjects: [],
          statuses: [],
          issueTypes: [],
          bugTypes: [],
          rootCauses: [],
          includeCurrentQuarter: true,
          useSnapshots: true
        }
      })),
      
      // Reset state
      resetData: () => set({
        snapshots: [],
        currentQuarter: null,
        allIssues: [],
        isLoading: false,
        error: null,
        downloadProgress: {},
        metadata: null,
        totalSnapshots: 0,
        completedSnapshots: 0,
        currentDownload: null,
        estimatedTotalRecords: 0,
        processedRecords: 0
      }),
      
      // Clear error
      clearError: () => set({ error: null }),
      
      // Main fetch action
      fetchJiraData: async (filters = {}) => {
        const store = get()
        
        // Check if already loading
        if (store.isLoading) {
          console.warn('JIRA data fetch already in progress')
          return
        }
        
        store.setLoading(true)
        store.setError(null)
        store.resetData()
        
        try {
          // Dynamic imports to avoid circular dependencies
          const { jiraIssuesService } = await import('../services/jiraIssuesService')
          const { s3DownloadService } = await import('../services/s3DownloadService')
          const { dataProcessingService } = await import('../services/dataProcessingService')
          const { cacheService } = await import('../services/cacheService')
          
          // Merge filters with existing filters
          const finalFilters = { ...store.filters, ...filters }
          store.setFilters(finalFilters)
          
          // Step 1: Get snapshot URLs
          console.log('Fetching JIRA snapshot URLs...')
          const snapshotsResponse = await jiraIssuesService.getSnapshotUrls(finalFilters)
          
          if (!snapshotsResponse.success) {
            throw new Error(snapshotsResponse.message || 'Failed to fetch snapshot URLs')
          }
          
          const { data, metadata } = snapshotsResponse
          
          store.setSnapshots(data.snapshots || [])
          store.setCurrentQuarter(data.currentQuarter)
          store.setMetadata(metadata)
          
          const totalSnapshots = (data.snapshots?.length || 0) + (data.currentQuarter ? 1 : 0)
          set({ totalSnapshots })
          
          if (totalSnapshots === 0) {
            throw new Error('No snapshots available for the selected date range')
          }
          
          // Step 2: Download all snapshot data
          console.log(`Starting download of ${totalSnapshots} snapshots...`)
          const allSnapshotData = []
          
          // Download quarterly snapshots
          if (data.snapshots && data.snapshots.length > 0) {
            for (const snapshot of data.snapshots) {
              store.setCurrentDownload(`Q${snapshot.quarter} ${snapshot.year}`)
              
              try {
                const snapshotData = await s3DownloadService.downloadSnapshot(
                  snapshot.url,
                  (progress) => store.setDownloadProgress(snapshot.url, progress)
                )
                
                if (snapshotData && Array.isArray(snapshotData)) {
                  allSnapshotData.push(...snapshotData)
                }
                
                store.incrementCompletedSnapshots()
              } catch (downloadError) {
                console.error(`Failed to download Q${snapshot.quarter} ${snapshot.year}:`, downloadError)
                // Continue with other snapshots
              }
            }
          }
          
          // Download current quarter if available
          if (data.currentQuarter) {
            store.setCurrentDownload('Current Quarter')
            
            try {
              const currentData = await s3DownloadService.downloadSnapshot(
                data.currentQuarter.url,
                (progress) => store.setDownloadProgress(data.currentQuarter.url, progress)
              )
              
              if (currentData && Array.isArray(currentData)) {
                allSnapshotData.push(...currentData)
              }
              
              store.incrementCompletedSnapshots()
            } catch (downloadError) {
              console.error('Failed to download current quarter:', downloadError)
            }
          }
          
          // Step 3: Process and store final data
          console.log(`Processing ${allSnapshotData.length} issues...`)
          const processedData = dataProcessingService.processJiraIssues(allSnapshotData)
          
          store.setAllIssues(processedData)
          store.setLoading(false)
          store.setCurrentDownload(null)
          
          // Cache the data
          try {
            await cacheService.cacheJiraData(processedData, metadata)
            console.log('Data cached successfully')
          } catch (cacheError) {
            console.error('Failed to cache data:', cacheError)
            // Continue without caching
          }
          
          console.log(`Successfully loaded ${processedData.length} unique issues`)
          
        } catch (error) {
          console.error('Error fetching JIRA data:', error)
          store.setError(error.message || 'Failed to fetch JIRA data')
          store.setLoading(false)
          store.setCurrentDownload(null)
          throw error
        }
      },
      
      // Load from cache
      loadFromCache: async () => {
        try {
          const { cacheService } = await import('../services/cacheService')
          const cachedData = await cacheService.getCachedJiraData()
          
          if (cachedData && cachedData.data) {
            set({
              allIssues: cachedData.data,
              metadata: cachedData.metadata,
              lastFetched: cachedData.timestamp,
              processedRecords: cachedData.data.length
            })
            return true
          }
          
          return false
        } catch (error) {
          console.error('Error loading from cache:', error)
          return false
        }
      }
    }),
    {
      name: 'jira-data-storage',
      partialize: (state) => ({
        filters: state.filters,
        lastFetched: state.lastFetched,
        metadata: state.metadata
      })
    }
  )
)