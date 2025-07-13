import { useCallback, useMemo } from 'react'
import { useDeveloperQualityStore } from '../store/developerQualityStore'
import { filterService } from '../services/filterService'
import { performanceMonitor } from '../utils/PerformanceMonitor'

export const useDeveloperQualityFilters = () => {
  // Get store state and actions
  const {
    filters,
    setFilters,
    resetFilters,
    getFilteredData,
    getFilterOptions,
    hasActiveFilters,
    data
  } = useDeveloperQualityStore()

  // Memoized filter options
  const filterOptions = useMemo(() => {
    return getFilterOptions()
  }, [getFilterOptions])

  // Memoized filtered data with performance monitoring
  const filteredData = useMemo(() => {
    const timer = performanceMonitor.startTimer('filterResponse')
    try {
      const result = getFilteredData()
      timer?.end()
      performanceMonitor.recordMetric('cacheHit', 1)
      return result
    } catch (error) {
      timer?.end()
      performanceMonitor.recordMetric('cacheMiss', 1)
      console.error('Filter operation failed:', error)
      return null
    }
  }, [getFilteredData])

  // Update individual filter
  const updateFilter = useCallback((filterType, value) => {
    setFilters(prevFilters => ({
      ...prevFilters,
      [filterType]: value
    }))
  }, [setFilters])

  // Update multiple filters at once
  const updateFilters = useCallback((newFilters) => {
    setFilters(prevFilters => ({
      ...prevFilters,
      ...newFilters
    }))
  }, [setFilters])

  // Add value to array filter
  const addToFilter = useCallback((filterType, value) => {
    if (!Array.isArray(filters[filterType])) {
      console.warn(`Filter ${filterType} is not an array`)
      return
    }
    
    if (!filters[filterType].includes(value)) {
      updateFilter(filterType, [...filters[filterType], value])
    }
  }, [filters, updateFilter])

  // Remove value from array filter
  const removeFromFilter = useCallback((filterType, value) => {
    if (!Array.isArray(filters[filterType])) {
      console.warn(`Filter ${filterType} is not an array`)
      return
    }
    
    updateFilter(filterType, filters[filterType].filter(item => item !== value))
  }, [filters, updateFilter])

  // Toggle value in array filter
  const toggleFilter = useCallback((filterType, value) => {
    if (!Array.isArray(filters[filterType])) {
      console.warn(`Filter ${filterType} is not an array`)
      return
    }
    
    if (filters[filterType].includes(value)) {
      removeFromFilter(filterType, value)
    } else {
      addToFilter(filterType, value)
    }
  }, [filters, addToFilter, removeFromFilter])

  // Set date range filter
  const setDateRange = useCallback((startDate, endDate) => {
    updateFilter('dateRange', {
      startDate: startDate || null,
      endDate: endDate || null
    })
  }, [updateFilter])

  // Clear specific filter
  const clearFilter = useCallback((filterType) => {
    if (filterType === 'dateRange') {
      updateFilter('dateRange', { startDate: null, endDate: null })
    } else if (Array.isArray(filters[filterType])) {
      updateFilter(filterType, [])
    } else {
      updateFilter(filterType, null)
    }
  }, [filters, updateFilter])

  // Apply filters with performance monitoring
  const applyFiltersWithMonitoring = useCallback((cacheData) => {
    const dataToFilter = cacheData || data
    if (!dataToFilter) return null
    
    const startTime = performance.now()
    
    try {
      const result = filterService.applyFilters(filters, dataToFilter)
      const endTime = performance.now()
      
      console.log(`Filters applied in ${(endTime - startTime).toFixed(2)}ms`)
      
      return result
    } catch (error) {
      console.error('Failed to apply filters:', error)
      return null
    }
  }, [data, filters])

  // Get filter summary for display
  const getFilterSummary = useCallback(() => {
    if (!hasActiveFilters()) {
      return 'No filters applied'
    }
    
    const summary = []
    
    if (filters.developers.length > 0) {
      summary.push(`${filters.developers.length} developer${filters.developers.length > 1 ? 's' : ''}`)
    }
    
    if (filters.projects.length > 0) {
      summary.push(`${filters.projects.length} project${filters.projects.length > 1 ? 's' : ''}`)
    }
    
    if (filters.issueTypes.length > 0) {
      summary.push(`${filters.issueTypes.length} issue type${filters.issueTypes.length > 1 ? 's' : ''}`)
    }
    
    if (filters.severities.length > 0) {
      summary.push(`${filters.severities.length} severit${filters.severities.length > 1 ? 'ies' : 'y'}`)
    }
    
    if (filters.rootCauses.length > 0) {
      summary.push(`${filters.rootCauses.length} root cause${filters.rootCauses.length > 1 ? 's' : ''}`)
    }
    
    if (filters.dateRange.startDate || filters.dateRange.endDate) {
      summary.push('date range')
    }
    
    return summary.join(', ')
  }, [filters, hasActiveFilters])

  // Check if specific filter is active
  const isFilterActive = useCallback((filterType, value = null) => {
    if (value === null) {
      // Check if filter type has any values
      if (filterType === 'dateRange') {
        return Boolean(filters.dateRange.startDate || filters.dateRange.endDate)
      }
      return Array.isArray(filters[filterType]) ? filters[filterType].length > 0 : !!filters[filterType]
    }
    
    // Check if specific value is in filter
    if (Array.isArray(filters[filterType])) {
      return filters[filterType].includes(value)
    }
    
    return filters[filterType] === value
  }, [filters])

  // Get count of filtered items
  const getFilteredCount = useCallback(() => {
    const filtered = getFilteredData()
    return {
      total: data?.minimalIssues?.length || 0,
      filtered: filtered?.filteredIssues?.length || 0,
      percentage: data?.minimalIssues?.length 
        ? ((filtered?.filteredIssues?.length || 0) / data.minimalIssues.length * 100).toFixed(1)
        : '0'
    }
  }, [data, getFilteredData])

  // Validate filters against available options
  const validateFilters = useCallback(() => {
    const validationErrors = []
    
    if (filters.developers.some(dev => !filterOptions.developers.includes(dev))) {
      validationErrors.push('Some selected developers are not available')
    }
    
    if (filters.projects.some(proj => !filterOptions.projects.includes(proj))) {
      validationErrors.push('Some selected projects are not available')
    }
    
    if (filters.issueTypes.some(type => !filterOptions.issueTypes.includes(type))) {
      validationErrors.push('Some selected issue types are not available')
    }
    
    if (filters.severities.some(sev => !filterOptions.severities.includes(sev))) {
      validationErrors.push('Some selected severities are not available')
    }
    
    if (filters.rootCauses.some(cause => !filterOptions.rootCauses.includes(cause))) {
      validationErrors.push('Some selected root causes are not available')
    }
    
    return validationErrors
  }, [filters, filterOptions])

  // Get available values for a filter type (excluding already selected)
  const getAvailableFilterValues = useCallback((filterType) => {
    if (!filterOptions[filterType]) return []
    
    if (Array.isArray(filters[filterType])) {
      return filterOptions[filterType].filter(value => !filters[filterType].includes(value))
    }
    
    return filterOptions[filterType]
  }, [filterOptions, filters])

  return {
    // Current filters
    filters,
    
    // Filter options
    filterOptions,
    
    // Filtered data
    filteredData,
    
    // Filter actions
    updateFilter,
    updateFilters,
    addToFilter,
    removeFromFilter,
    toggleFilter,
    setDateRange,
    clearFilter,
    resetFilters,
    
    // Filter utilities
    hasActiveFilters: hasActiveFilters(),
    getFilterSummary,
    isFilterActive,
    getFilteredCount,
    validateFilters,
    getAvailableFilterValues,
    
    // Performance monitoring
    applyFiltersWithMonitoring,
    applyFilters: applyFiltersWithMonitoring
  }
} 