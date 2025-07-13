import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { developerQualityService } from '../services/developerQualityService'

export const useDeveloperQualityStore = create(
  devtools(
    (set, get) => ({
      // State
      data: null,
      isLoading: false,
      error: null,
      lastUpdated: null,
      cacheSize: 0,
      processingTime: 0,
      
      // Filter state
      filters: {
        developers: [],
        projects: [],
        issueTypes: [],
        statuses: [],
        severities: [],
        rootCauses: [],
        dateRange: {
          startDate: null,
          endDate: null
        }
      },
      
      // Filtered data cache
      filteredData: null,
      filterAppliedAt: null,
      
      // Actions
      setData: (data) => {
        const now = new Date().toISOString()
        set({ 
          data, 
          lastUpdated: now,
          error: null,
          cacheSize: data?.metadata?.cacheSize || 0,
          processingTime: data?.metadata?.processingTime || 0
        })
      },
      
      setLoading: (isLoading) => set({ isLoading }),
      
      setError: (error) => set({ 
        error: typeof error === 'string' ? error : error?.message || 'Unknown error',
        isLoading: false 
      }),
      
      setFilters: (filters) => {
        const currentFilters = get().filters
        const newFilters = typeof filters === 'function' ? filters(currentFilters) : filters
        set({ 
          filters: newFilters,
          filteredData: null, // Clear cached filtered data
          filterAppliedAt: null
        })
      },
      
      setFilteredData: (filteredData) => {
        const now = new Date().toISOString()
        set({ 
          filteredData,
          filterAppliedAt: now
        })
      },
      
      // Reset actions
      resetFilters: () => set({
        filters: {
          developers: [],
          projects: [],
          issueTypes: [],
          statuses: [],
          severities: [],
          rootCauses: [],
          dateRange: {
            startDate: null,
            endDate: null
          }
        },
        filteredData: null,
        filterAppliedAt: null
      }),
      
      reset: () => set({
        data: null,
        isLoading: false,
        error: null,
        lastUpdated: null,
        cacheSize: 0,
        processingTime: 0,
        filters: {
          developers: [],
          projects: [],
          issueTypes: [],
          statuses: [],
          severities: [],
          rootCauses: [],
          dateRange: {
            startDate: null,
            endDate: null
          }
        },
        filteredData: null,
        filterAppliedAt: null
      }),
      
      // Async actions
      loadData: async (rawData) => {
        const { setLoading, setError, setData } = get()
        
        setLoading(true)
        try {
          let processedData
          
          if (rawData) {
            // Process provided raw data
            processedData = await developerQualityService.processJiraIssuesForDeveloperQuality(rawData)
          } else {
            // Load from cache or existing processed data
            processedData = await developerQualityService.getCachedData()
          }
          
          if (!processedData) {
            throw new Error('No data available. Please load JIRA data first.')
          }
          
          setData(processedData)
        } catch (error) {
          console.error('Failed to load developer quality data:', error)
          setError(error)
        } finally {
          setLoading(false)
        }
      },
      
      refreshData: async () => {
        const { loadData } = get()
        await loadData()
      },
      
      // Computed getters
      getFilteredData: () => {
        const { data, filteredData, filters } = get()
        
        if (!data) return null
        
        // Return cached filtered data if available and filters haven't changed
        if (filteredData) return filteredData
        
        // Apply filters and cache result
        try {
          const filtered = developerQualityService.applyFilters(data, filters)
          get().setFilteredData(filtered)
          return filtered
        } catch (error) {
          console.error('Failed to apply filters:', error)
          get().setError(error)
          return null
        }
      },
      
      getFilterOptions: () => {
        const { data } = get()
        return data?.filterOptions || {
          developers: [],
          projects: [],
          issueTypes: [],
          statuses: [],
          severities: [],
          rootCauses: [],
          dateRanges: {
            months: [],
            weeks: [],
            quarters: []
          }
        }
      },
      
      hasActiveFilters: () => {
        const { filters } = get()
        if (!filters) return false
        return Boolean(
          (filters.developers && filters.developers.length > 0) ||
          (filters.projects && filters.projects.length > 0) ||
          (filters.issueTypes && filters.issueTypes.length > 0) ||
          (filters.statuses && filters.statuses.length > 0) ||
          (filters.severities && filters.severities.length > 0) ||
          (filters.rootCauses && filters.rootCauses.length > 0) ||
          (filters.dateRange && (filters.dateRange.startDate || filters.dateRange.endDate))
        )
      },
      
      getMetrics: () => {
        const filteredData = get().getFilteredData()
        return filteredData?.metrics || null
      },
      
      getChartData: () => {
        const filteredData = get().getFilteredData()
        return filteredData?.chartData || null
      }
    }),
    {
      name: 'developer-quality-store',
      // Only include essential state in devtools
      partialize: (state) => ({
        isLoading: state.isLoading,
        error: state.error,
        lastUpdated: state.lastUpdated,
        filters: state.filters,
        cacheSize: state.cacheSize,
        processingTime: state.processingTime
      })
    }
  )
) 