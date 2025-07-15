import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { developerQualityService } from '../services/developerQualityService'
import { filterService } from '../services/filterService'

// Deep comparison utility for detecting actual filter changes
const areFiltersChanged = (oldFilters, newFilters) => {
  // Compare primitive filters
  if (oldFilters.timeframe !== newFilters.timeframe) return true
  
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
        },
        // Moved from component state to store
        timeframe: 'month', // Previously timePeriodType
        statusFilter: ['Done', 'In Progress', 'In Review']
      },
      
      // Filtered data cache
      filteredData: null,
      filterAppliedAt: null,
      
      // Actions
      setData: (data) => {
        const now = new Date().toISOString()
        console.log('🔍 STORE: setData called with:', {
          hasData: !!data,
          hasMetrics: !!data?.metrics,
          hasChartData: !!data?.chartData,
          hasIndices: !!data?.indices,
          timestamp: now
        })
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
        console.log(' DIRECT PROJECT FILTER UPDATE:', projects)
        
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
          console.log('Forcing recalculation of filtered data after project filter change')
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
        
        console.log('Projects filter change check:', {
          currentProjects,
          newProjects,
          currentLength: currentProjects.length,
          newLength: newProjects.length,
          isEqual: JSON.stringify(currentProjects) === JSON.stringify(newProjects)
        })
        
        // SPECIAL HANDLING: Force update if projects array has changed
        const projectsChanged = Array.isArray(newProjects) && 
          JSON.stringify(currentProjects) !== JSON.stringify(newProjects)
        
        // Always force an update if projects have changed
        if (projectsChanged) {
          console.log('🔥 Projects filter changed! Forcing cache invalidation')
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
        console.log('Regular filter update - checking for changes')
        const hasChanged = areFiltersChanged(currentFilters, newFilters)
        
        if (hasChanged) {
          console.log('Filters changed - clearing data cache')
          set({ 
            filters: newFilters,
            filteredData: null,
            filterAppliedAt: null
          })
        } else {
          console.log('No actual filter changes detected')
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
          issueTypes: [],
          statuses: [],
          severities: [],
          rootCauses: [],
          dateRange: {
            startDate: null,
            endDate: null
          },
          timeframe: 'month',
          statusFilter: ['Done', 'In Progress', 'In Review']
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
          },
          timeframe: 'month',
          statusFilter: ['Done', 'In Progress', 'In Review']
        },
        filteredData: null,
        filterAppliedAt: null
      }),
      
      // Async actions
      loadData: async (rawData) => {
        const { setLoading, setError, setData } = get()
        
        console.log('🔍 STORE: loadData called with:', {
          hasRawData: !!rawData,
          rawDataLength: rawData?.length || 0
        })
        
        setLoading(true)
        try {
          let processedData
          
          if (rawData) {
            console.log('🔍 STORE: Processing', rawData.length, 'JIRA issues...')
            // Process provided raw data (now async)
            processedData = await developerQualityService.processJiraIssuesForDeveloperQuality(rawData)
          } else {
            console.log('🔍 STORE: Loading from cache...')
            // Load from cache or existing processed data
            processedData = await developerQualityService.getCachedData()
          }
          
          if (!processedData) {
            console.log('🔍 STORE: No processed data available')
            throw new Error('No data available. Please load JIRA data first.')
          }
          
          console.log('🔍 STORE: Developer Quality data processed successfully:', {
            totalIssues: processedData.metadata?.totalIssues || 0,
            processingTime: processedData.metadata?.processingTime || 0,
            cacheSize: processedData.metadata?.cacheSize || 0,
            hasMetrics: !!processedData.metrics,
            hasChartData: !!processedData.chartData
          })
          setData(processedData)
        } catch (error) {
          console.error('🔍 STORE: Failed to load developer quality data:', error)
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
        
        console.log('🔍 STORE: getFilteredData called:', {
          hasData: !!data,
          hasFilters: !!filters,
          filtersKeys: filters ? Object.keys(filters) : []
        })
        
        if (!data) {
          console.log('🔍 STORE: No data available for filtering')
          return null
        }
        
        // Force recalculation of filtered data every time to ensure filters are applied correctly
        // This ensures project filters and other changes are immediately reflected in charts
        try {
          const timer = performance.now()
          // Pass all filter parameters in one call
          const filtered = filterService.applyFilters(filters, data)
          
          console.log(`🔍 STORE: Filters applied in ${(performance.now() - timer).toFixed(2)}ms`)
          console.log('🔍 STORE: Applied filters:', filters)
          console.log('🔍 STORE: Filtered data result:', {
            hasChartData: !!filtered?.filteredChartData,
            hasTeamChart: !!filtered?.filteredChartData?.teamContributionChart,
            chartDataLength: filtered?.filteredChartData?.teamContributionChart?.data?.length || 0
          })
          
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
        
        // Default filters don't count as "active"
        const isDefaultTimeframe = filters.timeframe === 'month'
        const isDefaultStatusFilter = 
          JSON.stringify(filters.statusFilter.sort()) === 
          JSON.stringify(['Done', 'In Progress', 'In Review'].sort())
        
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