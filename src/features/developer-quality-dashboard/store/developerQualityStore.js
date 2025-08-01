import { create } from 'zustand'
import { persist, devtools } from 'zustand/middleware'
import { developerQualityService } from '../services/developerQualityService'
import { filterService } from '../services/filterService'
import { memberConfiguration } from '../../../constants/memberConfiguration'

// Deep comparison utility for detecting actual filter changes
const areFiltersChanged = (oldFilters, newFilters) => {
  // Compare primitive filters
  if (oldFilters.timeframe !== newFilters.timeframe) return true
  if (oldFilters.showTargetLines !== newFilters.showTargetLines) return true
  
  // Compare array filters
  const arrayFilters = ['developers', 'projects', 'issueTypes', 'statuses', 'severities', 'rootCauses', 'statusFilter']
  for (const filter of arrayFilters) {
    const oldArray = oldFilters[filter] || []
    const newArray = newFilters[filter] || []
    
    // Handle empty array vs non-empty array case
    if (oldArray.length === 0 && newArray.length > 0) return true
    if (oldArray.length > 0 && newArray.length === 0) return true
    
    // Length check
    if (oldArray.length !== newArray.length) return true
    
    // Content check - sort arrays to ensure consistent comparison
    const sortedOld = [...oldArray].sort()
    const sortedNew = [...newArray].sort()
    for (let i = 0; i < sortedOld.length; i++) {
      if (sortedOld[i] !== sortedNew[i]) return true
    }
  }
  
  // Compare date range
  if (oldFilters.dateRange?.startDate !== newFilters.dateRange?.startDate) return true
  if (oldFilters.dateRange?.endDate !== newFilters.dateRange?.endDate) return true
  
  return false
}

export const useDeveloperQualityStore = create(
  persist(
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
        issueTypes: memberConfiguration.issueTypes || [],
        statuses: memberConfiguration.filterDefaults.statusFilter || [],
        severities: [],
        rootCauses: [],
        dateRange: {
          startDate: null,
          endDate: null
        },
        // Moved from component state to store
        timeframe: 'month', // Previously timePeriodType
        statusFilter: memberConfiguration.filterDefaults.statusFilter,
        // Target lines visibility control for single project charts
        showTargetLines: true
      },
      
      // Bug attribution mode for quality metrics
      bugAttributionMode: 'causedBy', // 'assignee' | 'causedBy'
      
      // Filtered data cache
      filteredData: null,
      filterAppliedAt: null,
      
      // NEW: Bug analysis state
      bugAnalysis: null,
      bugAnalysisLoading: false,
      bugAnalysisError: null,
      
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
      
      // Dedicated setter for project filters - always forces update
      setProjectFilters: (projects) => {
        
        const currentState = get()
        const currentFilters = currentState.filters
        
        // Always force cache invalidation and update
        set({
          filters: {
            ...currentFilters,
            projects: Array.isArray(projects) ? [...projects] : [] // Create fresh array
          },
          filteredData: null,
          filterAppliedAt: null
        })
        
        // Force data recalculation
        const getFilteredData = get().getFilteredData
        if (getFilteredData) {
          setTimeout(() => getFilteredData(), 0)
        }
      },
      
      // General filters management
      setFilters: (filters) => {
        const currentFilters = get().filters
        const newFilters = typeof filters === 'function' ? filters(currentFilters) : filters
        
        // Direct reference to projects filter for logging
        const currentProjects = currentFilters.projects || []
        const newProjects = newFilters.projects || []
        
        
        // SPECIAL HANDLING: Force update if projects array has changed
        const projectsChanged = Array.isArray(newProjects) && 
          JSON.stringify(currentProjects) !== JSON.stringify(newProjects)
        
        // Always force an update if projects have changed
        if (projectsChanged) {
          set({ 
            filters: {
              ...currentFilters,
              projects: [...newProjects] // Create a fresh array to ensure reference changes
            },
            filteredData: null,
            filterAppliedAt: null
          })
          return
        }
        
        // Normal handling for other filters
        const hasChanged = areFiltersChanged(currentFilters, newFilters)
        
        if (hasChanged) {
          set({ 
            filters: newFilters,
            filteredData: null,
            filterAppliedAt: null
          })
        }
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
          issueTypes: memberConfiguration.issueTypes || [],
          statuses: memberConfiguration.filterDefaults.statusFilter || [],
          severities: [],
          rootCauses: [],
          dateRange: {
            startDate: null,
            endDate: null
          },
          timeframe: 'month',
          statusFilter: memberConfiguration.filterDefaults.statusFilter,
          showTargetLines: true
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
          issueTypes: memberConfiguration.issueTypes || [],
          statuses: memberConfiguration.filterDefaults.statusFilter || [],
          severities: [],
          rootCauses: [],
          dateRange: {
            startDate: null,
            endDate: null
          },
          timeframe: 'month',
          statusFilter: memberConfiguration.filterDefaults.statusFilter,
          showTargetLines: true
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
            // Process provided raw data (now async)
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
        
        
        if (!data) {
          return null
        }
        
        // Force recalculation of filtered data every time to ensure filters are applied correctly
        // This ensures project filters and other changes are immediately reflected in charts
        try {
          const timer = performance.now()
          // Pass all filter parameters in one call
          const filtered = filterService.applyFilters(filters, data)
          
          
          // Don't call setFilteredData during render - this causes React warnings
          // The filtered data will be stored when needed by other functions
          return filtered
        } catch (error) {
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
        
        // Default filters don't count as "active"
        const isDefaultTimeframe = filters.timeframe === 'month'
        const isDefaultStatusFilter = 
          JSON.stringify(filters.statusFilter.sort()) === 
          JSON.stringify(memberConfiguration.filterDefaults.statusFilter.sort())
        
        return Boolean(
          (filters.developers && filters.developers.length > 0) ||
          (filters.projects && filters.projects.length > 0) ||
          (filters.issueTypes && filters.issueTypes.length > 0) ||
          (filters.statuses && filters.statuses.length > 0) ||
          (filters.severities && filters.severities.length > 0) ||
          (filters.rootCauses && filters.rootCauses.length > 0) ||
          (filters.dateRange && (filters.dateRange.startDate || filters.dateRange.endDate)) ||
          (!isDefaultTimeframe) ||
          (!isDefaultStatusFilter)
        )
      },
      
      getMetrics: () => {
        const filteredData = get().getFilteredData()
        return filteredData?.metrics || null
      },
      
      getChartData: () => {
        const filteredData = get().getFilteredData()
        return filteredData?.chartData || null
      },
      
      // NEW: Bug analysis actions
      loadBugAnalysis: async () => {
        set({ bugAnalysisLoading: true, bugAnalysisError: null })
        try {
          const { developerQualityIndexedDB } = await import('../services/developerQualityIndexedDB')
          const data = await developerQualityIndexedDB.getBugAnalysis()
          set({ 
            bugAnalysis: data, 
            bugAnalysisLoading: false 
          })
        } catch (error) {
          set({ 
            bugAnalysis: null, 
            bugAnalysisLoading: false,
            bugAnalysisError: error.message 
          })
        }
      },
      
      clearBugAnalysis: () => set({ 
        bugAnalysis: null, 
        bugAnalysisError: null 
      }),
      
      // Bug attribution mode actions
      setBugAttributionMode: (mode) => {
        console.log('🔄 Zustand: Setting bug attribution mode to:', mode)
        set({ bugAttributionMode: mode })
      },
      
      getBugAttributionMode: () => get().bugAttributionMode
      }),
      {
        name: 'developer-quality-store'
      }
    ),
    {
      name: 'developer-quality-storage',
      version: 2, // Increment this when default configuration changes
      // Only persist user preferences, not cache metadata
      partialize: (state) => ({
        filters: state.filters,
        bugAttributionMode: state.bugAttributionMode,
        // Don't persist data, lastUpdated, or cache metadata
        // We'll always process from JIRA data on load
      })
    }
  )
) 