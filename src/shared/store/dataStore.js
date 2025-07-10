import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

export const useDataStore = create(
  devtools(
    (set, get) => ({
      snapshots: [],
      currentQuarter: null,
      allIssues: [],
      isLoading: false,
      error: null,
      downloadProgress: {},
      
      setSnapshots: (snapshots) => set({ snapshots }),
      setAllIssues: (issues) => set({ allIssues: issues }),
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      setDownloadProgress: (fileId, progress) => 
        set(state => ({
          downloadProgress: {
            ...state.downloadProgress,
            [fileId]: progress
          }
        })),
      clearDownloadProgress: () => set({ downloadProgress: {} }),
      
      fetchJiraData: async () => {
        const { default: jiraDataService } = await import('../services/jiraDataService')
        
        set({ isLoading: true, error: null })
        try {
          const response = await jiraDataService.fetchJiraSnapshots()
          set({ 
            snapshots: response.data.snapshots,
            currentQuarter: response.data.currentQuarter
          })
          
          const allData = await jiraDataService.processSnapshotsData(
            response.data.snapshots,
            response.data.currentQuarter,
            (fileId, progress) => {
              get().setDownloadProgress(fileId, progress)
            }
          )
          
          set({ 
            allIssues: allData, 
            isLoading: false,
            downloadProgress: {}
          })
        } catch (error) {
          set({ 
            error: error.message, 
            isLoading: false,
            downloadProgress: {}
          })
        }
      },
      
      clearError: () => set({ error: null })
    }),
    {
      name: 'data-store'
    }
  )
)