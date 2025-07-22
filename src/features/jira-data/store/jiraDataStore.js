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
      
      // Enhanced loading states
      loadingStage: null, // 'fetching-urls' | 'downloading-files' | 'processing-data' | null
      overallProgress: 0, // 0-100
      currentOperation: null, // Current operation description
      
      // Download progress tracking
      totalSnapshots: 0,
      completedSnapshots: 0,
      currentDownload: null,
      estimatedTotalRecords: 0,
      processedRecords: 0,
      
      // Download statistics
      downloadStats: {
        totalFiles: 0,
        completedFiles: 0,
        failedFiles: 0,
        totalSize: 0,
        downloadedSize: 0,
        startTime: null,
        estimatedTimeRemaining: null
      },
      
      // File-level tracking
      currentDownloadingFile: null,
      downloadQueue: [],
      failedDownloads: [],
      
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
      
      // Enhanced loading state actions
      setLoadingStage: (stage) => set({ loadingStage: stage }),
      setOverallProgress: (progress) => set({ overallProgress: progress }),
      setCurrentOperation: (operation) => set({ currentOperation: operation }),
      
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
      
      // Initialize download progress
      initializeDownloadProgress: (snapshots) => {
        const progress = {}
        snapshots.forEach(snapshot => {
          progress[snapshot.url] = {
            percent: 0,
            loaded: 0,
            total: snapshot.fileSize || 0,
            status: 'pending',
            fileName: `Q${snapshot.quarter}-${snapshot.year}.json`,
            error: null
          }
        })
        
        set(state => ({
          downloadProgress: progress,
          downloadStats: {
            ...state.downloadStats,
            totalFiles: snapshots.length,
            totalSize: snapshots.reduce((sum, s) => sum + (s.fileSize || 0), 0),
            startTime: new Date().toISOString(),
            completedFiles: 0,
            failedFiles: 0,
            downloadedSize: 0
          }
        }))
      },
      
      // Update download progress with ETA calculation
      updateDownloadProgress: (snapshotUrl, progressData) => {
        const state = get()
        const updated = {
          ...state.downloadProgress,
          [snapshotUrl]: {
            ...state.downloadProgress[snapshotUrl],
            ...progressData
          }
        }
        
        // Calculate overall progress
        const totalFiles = Object.keys(updated).length
        const completedFiles = Object.values(updated).filter(p => p.status === 'completed').length
        const failedFiles = Object.values(updated).filter(p => p.status === 'failed').length
        const totalDownloaded = Object.values(updated).reduce((sum, p) => sum + (p.loaded || 0), 0)
        
        // Calculate ETA
        let estimatedTimeRemaining = null
        if (state.downloadStats.startTime) {
          const startTime = new Date(state.downloadStats.startTime)
          const elapsed = Date.now() - startTime.getTime()
          const averageSpeed = totalDownloaded / (elapsed / 1000) // bytes per second
          const remainingBytes = state.downloadStats.totalSize - totalDownloaded
          estimatedTimeRemaining = remainingBytes / averageSpeed
          
          if (!isFinite(estimatedTimeRemaining) || estimatedTimeRemaining < 0) {
            estimatedTimeRemaining = null
          }
        }
        
        set({
          downloadProgress: updated,
          downloadStats: {
            ...state.downloadStats,
            completedFiles,
            failedFiles,
            downloadedSize: totalDownloaded,
            estimatedTimeRemaining
          },
          overallProgress: totalFiles > 0 ? (completedFiles / totalFiles) * 100 : 0
        })
      },
      
      setCurrentDownloadingFile: (fileName) => set({ currentDownloadingFile: fileName }),
      
      addFailedDownload: (snapshotUrl, error) => {
        const state = get()
        set({
          failedDownloads: [...state.failedDownloads, { 
            url: snapshotUrl, 
            error, 
            timestamp: new Date().toISOString() 
          }]
        })
      },
      
      clearFailedDownload: (snapshotUrl) => {
        const state = get()
        set({
          failedDownloads: state.failedDownloads.filter(f => f.url !== snapshotUrl)
        })
      },
      
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
        processedRecords: 0,
        // Reset enhanced loading states
        loadingStage: null,
        overallProgress: 0,
        currentOperation: null,
        downloadStats: {
          totalFiles: 0,
          completedFiles: 0,
          failedFiles: 0,
          totalSize: 0,
          downloadedSize: 0,
          startTime: null,
          estimatedTimeRemaining: null
        },
        currentDownloadingFile: null,
        downloadQueue: [],
        failedDownloads: []
      }),
      
      // Reset loading states only
      resetLoadingStates: () => set({
        loadingStage: null,
        overallProgress: 0,
        currentOperation: null,
        downloadProgress: {},
        downloadStats: {
          totalFiles: 0,
          completedFiles: 0,
          failedFiles: 0,
          totalSize: 0,
          downloadedSize: 0,
          startTime: null,
          estimatedTimeRemaining: null
        },
        currentDownloadingFile: null,
        failedDownloads: []
      }),
      
      // Clear error
      clearError: () => set({ error: null }),
      
      // Enhanced fetch action with comprehensive progress tracking
      fetchJiraDataWithProgress: async (filters = {}) => {
        const store = get()
        
        // Check if already loading
        if (store.isLoading) {
          console.warn('JIRA data fetch already in progress')
          return
        }
        
        try {
          // Stage 1: Fetch snapshot URLs
          store.setLoadingStage('fetching-urls')
          store.setCurrentOperation('Fetching snapshot URLs from API...')
          store.setLoading(true)
          store.setError(null)
          
          // Dynamic imports to avoid circular dependencies
          const { jiraIssuesService } = await import('../services/jiraIssuesService')
          const { s3DownloadService } = await import('../services/s3DownloadService')
          const { dataProcessingService } = await import('../services/dataProcessingService')
          const { cacheService } = await import('../services/cacheService')
          const { toast } = await import('react-hot-toast')
          
          // Merge filters with existing filters
          const finalFilters = { ...store.filters, ...filters }
          store.setFilters(finalFilters)
          
          console.log('Fetching JIRA snapshot URLs...')
          let toastId = toast.loading('🔄 Fetching JIRA snapshots...', {
            duration: Infinity,
            position: 'bottom-right'
          })
          
          const snapshotsResponse = await jiraIssuesService.getSnapshotUrls(finalFilters)
          
          if (!snapshotsResponse.success) {
            throw new Error(snapshotsResponse.message || 'Failed to fetch snapshot URLs')
          }
          
          const { data, metadata } = snapshotsResponse
          
          // Handle new API response structure
          const snapshots = data.previousQuarters || data.snapshots || []
          store.setSnapshots(snapshots)
          store.setCurrentQuarter(data.currentQuarter)
          store.setMetadata(metadata)
          
          const totalSnapshots = (snapshots.length || 0) + (data.currentQuarter && data.currentQuarter.recordCount > 0 ? 1 : 0)
          set({ totalSnapshots })
          
          if (totalSnapshots === 0) {
            throw new Error('No snapshots available for the selected date range')
          }
          
          // Initialize download progress
          const allSnapshots = [...snapshots]
          if (data.currentQuarter && data.currentQuarter.recordCount > 0) {
            allSnapshots.push({
              ...data.currentQuarter,
              quarter: 'Current',
              year: new Date().getFullYear()
            })
          }
          store.initializeDownloadProgress(allSnapshots)
          
          // Stage 2: Download files
          store.setLoadingStage('downloading-files')
          store.setCurrentOperation('Downloading quarterly snapshots...')
          
          toast.loading('📊 Downloading quarterly data...', {
            id: toastId,
            icon: '⬇️'
          })
          
          const allSnapshotData = []
          
          // Download all snapshots (quarterly + current) in parallel
          const allDownloads = [...snapshots]
          if (data.currentQuarter && data.currentQuarter.recordCount > 0) {
            allDownloads.push({
              ...data.currentQuarter,
              quarter: 'Current',
              year: new Date().getFullYear()
            })
          }
          
          if (allDownloads.length > 0) {
            console.log(`Starting parallel download of ${allDownloads.length} files`)
            
            try {
              const downloadResults = await s3DownloadService.downloadSnapshotsInParallel(
                allDownloads,
                (overallProgress) => {
                  // Update toast with parallel download progress
                  const {
                    percent,
                    completedFiles,
                    totalFiles,
                    activeDownloads,
                    downloadSpeed,
                    estimatedTimeRemaining
                  } = overallProgress
                  
                  const speedText = downloadSpeed > 0 ? ` (${downloadSpeed.toFixed(1)} MB/s)` : ''
                  const etaText = estimatedTimeRemaining ? ` - ETA: ${Math.ceil(estimatedTimeRemaining)}s` : ''
                  
                  if (activeDownloads > 0) {
                    toast.loading(
                      `⬇️ Downloading ${activeDownloads} files simultaneously ${percent}%${speedText}${etaText}`,
                      { id: toastId }
                    )
                  } else {
                    toast.loading(`⬇️ Downloaded ${completedFiles}/${totalFiles} files ${percent}%`, {
                      id: toastId
                    })
                  }
                  
                  // Update overall progress in store
                  store.setOverallProgress(percent)
                  store.setCurrentOperation(
                    `Downloading ${activeDownloads} files simultaneously (${completedFiles}/${totalFiles} complete)`
                  )
                  
                  // Update individual file progress for UI
                  allDownloads.forEach((download, index) => {
                    const downloadId = `${download.year}-Q${download.quarter}`
                    if (overallProgress.activeProgresses && overallProgress.activeProgresses[downloadId]) {
                      store.updateDownloadProgress(download.url, {
                        ...overallProgress.activeProgresses[downloadId],
                        status: 'downloading'
                      })
                    }
                  })
                }
              )
              
              // Process results from parallel downloads
              let successCount = 0
              let failedCount = 0
              
              for (const result of downloadResults) {
                if (result.status === 'success') {
                  successCount++
                  if (result.data && Array.isArray(result.data)) {
                    allSnapshotData.push(...result.data)
                  }
                  // Update progress to completed
                  store.updateDownloadProgress(result.url, { 
                    status: 'completed',
                    percent: 100
                  })
                  store.incrementCompletedSnapshots()
                } else {
                  failedCount++
                  console.error(`Failed to download Q${result.quarter} ${result.year}:`, result.error)
                  store.updateDownloadProgress(result.url, { 
                    status: 'failed', 
                    error: result.error 
                  })
                  store.addFailedDownload(result.url, result.error)
                }
              }
              
              console.log(`Parallel download completed: ${successCount} successful, ${failedCount} failed`)
              
              if (failedCount > 0) {
                toast.loading(`⚠️ Downloaded ${successCount}/${downloadResults.length} files (${failedCount} failed)`, {
                  id: toastId,
                  icon: '⚠️'
                })
              } else {
                toast.loading(`✅ Downloaded ${successCount} files successfully`, {
                  id: toastId,
                  icon: '✅'
                })
              }
              
            } catch (parallelDownloadError) {
              console.error('Parallel download failed, falling back to sequential:', parallelDownloadError)
              
              // Fallback to sequential download
              toast.loading('⚠️ Parallel download failed, trying sequential download...', {
                id: toastId,
                icon: '⚠️'
              })
              
              // Use the original sequential download logic as fallback
              const sequentialResults = await s3DownloadService.downloadMultipleSnapshots(
                allDownloads,
                (progress) => {
                  const fileName = `Q${progress.currentSnapshot} file`
                  toast.loading(`⬇️ Sequential download: ${fileName} (${progress.currentSnapshot}/${progress.totalSnapshots})`, {
                    id: toastId
                  })
                }
              )
              
              // Process sequential results
              for (const result of sequentialResults) {
                if (result.status === 'success' && result.data && Array.isArray(result.data)) {
                  allSnapshotData.push(...result.data)
                  store.incrementCompletedSnapshots()
                }
              }
            }
          }
          
          // Stage 3: Process data
          store.setLoadingStage('processing-data')
          store.setCurrentOperation('Processing downloaded data...')
          
          toast.loading('⚙️ Processing downloaded data...', {
            id: toastId,
            icon: '⚙️'
          })
          
          console.log(`Processing ${allSnapshotData.length} issues...`)
          const processedData = dataProcessingService.processJiraIssues(allSnapshotData)
          
          store.setAllIssues(processedData)
          store.setLoading(false)
          store.setLoadingStage(null)
          store.setCurrentOperation(null)
          store.setCurrentDownload(null)
          store.setCurrentDownloadingFile(null)
          
          // Cache the data
          try {
            await cacheService.cacheJiraData(processedData, metadata)
            console.log('Data cached successfully')
          } catch (cacheError) {
            console.error('Failed to cache data:', cacheError)
            // Continue without caching
          }
          
          console.log(`Successfully loaded ${processedData.length} unique issues`)
          
          // Success toast
          toast.success(`✅ Successfully loaded ${processedData.length.toLocaleString()} JIRA issues!`, {
            id: toastId,
            duration: 4000
          })
          
        } catch (error) {
          console.error('Error fetching JIRA data:', error)
          store.setError(error.message || 'Failed to fetch JIRA data')
          store.setLoading(false)
          store.setLoadingStage(null)
          store.setCurrentOperation(null)
          store.setCurrentDownload(null)
          store.setCurrentDownloadingFile(null)
          
          // Error toast with retry action
          toast.error('❌ Download failed. Click to retry.', {
            id: toastId,
            duration: 8000,
            onClick: () => store.fetchJiraDataWithProgress(filters)
          })
          
          throw error
        }
      },
      
      // Legacy fetch action for backward compatibility
      fetchJiraData: async (filters = {}) => {
        return get().fetchJiraDataWithProgress(filters)
      },
      
      // Retry failed downloads
      retryFailedDownloads: async () => {
        const store = get()
        const failedUrls = store.failedDownloads.map(f => f.url)
        
        if (failedUrls.length === 0) return
        
        store.setLoadingStage('downloading-files')
        store.setCurrentOperation('Retrying failed downloads...')
        
        // Dynamic imports
        const { s3DownloadService } = await import('../services/s3DownloadService')
        
        for (const url of failedUrls) {
          try {
            const fileName = store.downloadProgress[url]?.fileName || 'Unknown'
            store.setCurrentDownloadingFile(fileName)
            store.updateDownloadProgress(url, { status: 'downloading', error: null })
            
            const snapshotData = await s3DownloadService.downloadSnapshot(
              url,
              (progress) => {
                store.updateDownloadProgress(url, {
                  percent: progress.percent,
                  loaded: progress.loaded,
                  total: progress.total,
                  status: 'downloading'
                })
              }
            )
            
            store.updateDownloadProgress(url, { status: 'completed' })
            store.clearFailedDownload(url)
            
          } catch (error) {
            store.updateDownloadProgress(url, { 
              status: 'failed', 
              error: error.message 
            })
          }
        }
        
        store.setLoadingStage(null)
        store.setCurrentOperation(null)
        store.setCurrentDownloadingFile(null)
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
        metadata: state.metadata,
        // Don't persist allIssues - it's too large and should be loaded from cache
        // The loadFromCache function handles this
      })
    }
  )
)