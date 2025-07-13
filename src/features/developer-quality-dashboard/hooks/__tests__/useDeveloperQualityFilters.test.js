import { renderHook, act } from '@testing-library/react'
import { useDeveloperQualityFilters } from '../useDeveloperQualityFilters'
import { useDeveloperQualityStore } from '../../store/developerQualityStore'
import { filterService } from '../../services/filterService'

// Mock dependencies
jest.mock('../../store/developerQualityStore')
jest.mock('../../services/filterService')

describe('useDeveloperQualityFilters', () => {
  const mockStoreActions = {
    setFilters: jest.fn(),
    resetFilters: jest.fn(),
    getFilteredData: jest.fn(),
    getFilterOptions: jest.fn(),
    hasActiveFilters: jest.fn()
  }

  const mockFilters = {
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
  }

  const mockFilterOptions = {
    developers: ['john.doe', 'jane.smith', 'bob.wilson'],
    projects: ['PROJ-A', 'PROJ-B', 'PROJ-C'],
    issueTypes: ['Bug', 'Story', 'Task'],
    statuses: ['Done', 'In Progress', 'To Do'],
    severities: ['Critical', 'High', 'Medium', 'Low'],
    rootCauses: ['Logic Error', 'Integration Issue', 'Performance']
  }

  const mockData = {
    minimalIssues: [
      { id: '1', key: 'TEST-1' },
      { id: '2', key: 'TEST-2' }
    ]
  }

  const mockFilteredData = {
    filteredIssues: [{ id: '1', key: 'TEST-1' }],
    metrics: { teamContribution: {} },
    chartData: { teamContributionChart: {} }
  }

  beforeEach(() => {
    jest.clearAllMocks()

    // Mock store hook
    useDeveloperQualityStore.mockReturnValue({
      filters: mockFilters,
      data: mockData,
      ...mockStoreActions
    })

    // Mock store actions
    mockStoreActions.getFilterOptions.mockReturnValue(mockFilterOptions)
    mockStoreActions.getFilteredData.mockReturnValue(mockFilteredData)
    mockStoreActions.hasActiveFilters.mockReturnValue(false)

    // Mock filter service
    filterService.applyFilters.mockReturnValue(mockFilteredData)
  })

  describe('Basic Hook Functionality', () => {
    it('should return current filters and filter options', () => {
      const { result } = renderHook(() => useDeveloperQualityFilters())

      expect(result.current.filters).toBe(mockFilters)
      expect(result.current.filterOptions).toBe(mockFilterOptions)
      expect(result.current.filteredData).toBe(mockFilteredData)
    })

    it('should provide all filter action functions', () => {
      const { result } = renderHook(() => useDeveloperQualityFilters())

      expect(typeof result.current.updateFilter).toBe('function')
      expect(typeof result.current.updateFilters).toBe('function')
      expect(typeof result.current.addToFilter).toBe('function')
      expect(typeof result.current.removeFromFilter).toBe('function')
      expect(typeof result.current.toggleFilter).toBe('function')
      expect(typeof result.current.setDateRange).toBe('function')
      expect(typeof result.current.clearFilter).toBe('function')
      expect(typeof result.current.resetFilters).toBe('function')
    })

    it('should provide utility functions', () => {
      const { result } = renderHook(() => useDeveloperQualityFilters())

      expect(typeof result.current.getFilterSummary).toBe('function')
      expect(typeof result.current.isFilterActive).toBe('function')
      expect(typeof result.current.getFilteredCount).toBe('function')
      expect(typeof result.current.validateFilters).toBe('function')
      expect(typeof result.current.getAvailableFilterValues).toBe('function')
      expect(typeof result.current.applyFiltersWithMonitoring).toBe('function')
    })
  })

  describe('updateFilter Action', () => {
    it('should update individual filter', () => {
      const { result } = renderHook(() => useDeveloperQualityFilters())

      act(() => {
        result.current.updateFilter('developers', ['john.doe'])
      })

      expect(mockStoreActions.setFilters).toHaveBeenCalledWith(expect.any(Function))
    })

    it('should call setFilters with correct updater function', () => {
      const { result } = renderHook(() => useDeveloperQualityFilters())
      let capturedUpdater

      mockStoreActions.setFilters.mockImplementation((updater) => {
        capturedUpdater = updater
      })

      act(() => {
        result.current.updateFilter('developers', ['john.doe'])
      })

      const updatedFilters = capturedUpdater(mockFilters)
      expect(updatedFilters).toEqual({
        ...mockFilters,
        developers: ['john.doe']
      })
    })
  })

  describe('updateFilters Action', () => {
    it('should update multiple filters at once', () => {
      const { result } = renderHook(() => useDeveloperQualityFilters())
      const newFilters = {
        developers: ['john.doe'],
        projects: ['PROJ-A']
      }

      act(() => {
        result.current.updateFilters(newFilters)
      })

      expect(mockStoreActions.setFilters).toHaveBeenCalledWith(expect.any(Function))
    })

    it('should merge new filters with existing ones', () => {
      const { result } = renderHook(() => useDeveloperQualityFilters())
      let capturedUpdater

      mockStoreActions.setFilters.mockImplementation((updater) => {
        capturedUpdater = updater
      })

      const newFilters = {
        developers: ['john.doe'],
        projects: ['PROJ-A']
      }

      act(() => {
        result.current.updateFilters(newFilters)
      })

      const updatedFilters = capturedUpdater(mockFilters)
      expect(updatedFilters).toEqual({
        ...mockFilters,
        ...newFilters
      })
    })
  })

  describe('addToFilter Action', () => {
    it('should add value to array filter', () => {
      const filtersWithDevelopers = {
        ...mockFilters,
        developers: ['john.doe']
      }

      useDeveloperQualityStore.mockReturnValue({
        filters: filtersWithDevelopers,
        data: mockData,
        ...mockStoreActions
      })

      const { result } = renderHook(() => useDeveloperQualityFilters())

      act(() => {
        result.current.addToFilter('developers', 'jane.smith')
      })

      expect(mockStoreActions.setFilters).toHaveBeenCalled()
    })

    it('should not add duplicate values', () => {
      const filtersWithDevelopers = {
        ...mockFilters,
        developers: ['john.doe']
      }

      useDeveloperQualityStore.mockReturnValue({
        filters: filtersWithDevelopers,
        data: mockData,
        ...mockStoreActions
      })

      const { result } = renderHook(() => useDeveloperQualityFilters())

      act(() => {
        result.current.addToFilter('developers', 'john.doe')
      })

      // Should not call setFilters since value already exists
      expect(mockStoreActions.setFilters).not.toHaveBeenCalled()
    })

    it('should handle non-array filters gracefully', () => {
      const consoleWarn = jest.spyOn(console, 'warn').mockImplementation()
      const { result } = renderHook(() => useDeveloperQualityFilters())

      act(() => {
        result.current.addToFilter('dateRange', 'invalid')
      })

      expect(consoleWarn).toHaveBeenCalledWith('Filter dateRange is not an array')
      expect(mockStoreActions.setFilters).not.toHaveBeenCalled()

      consoleWarn.mockRestore()
    })
  })

  describe('removeFromFilter Action', () => {
    it('should remove value from array filter', () => {
      const filtersWithDevelopers = {
        ...mockFilters,
        developers: ['john.doe', 'jane.smith']
      }

      useDeveloperQualityStore.mockReturnValue({
        filters: filtersWithDevelopers,
        data: mockData,
        ...mockStoreActions
      })

      const { result } = renderHook(() => useDeveloperQualityFilters())

      act(() => {
        result.current.removeFromFilter('developers', 'john.doe')
      })

      expect(mockStoreActions.setFilters).toHaveBeenCalled()
    })

    it('should handle non-array filters gracefully', () => {
      const consoleWarn = jest.spyOn(console, 'warn').mockImplementation()
      const { result } = renderHook(() => useDeveloperQualityFilters())

      act(() => {
        result.current.removeFromFilter('dateRange', 'invalid')
      })

      expect(consoleWarn).toHaveBeenCalledWith('Filter dateRange is not an array')
      expect(mockStoreActions.setFilters).not.toHaveBeenCalled()

      consoleWarn.mockRestore()
    })
  })

  describe('toggleFilter Action', () => {
    it('should add value if not present', () => {
      const { result } = renderHook(() => useDeveloperQualityFilters())

      act(() => {
        result.current.toggleFilter('developers', 'john.doe')
      })

      expect(mockStoreActions.setFilters).toHaveBeenCalled()
    })

    it('should remove value if present', () => {
      const filtersWithDevelopers = {
        ...mockFilters,
        developers: ['john.doe']
      }

      useDeveloperQualityStore.mockReturnValue({
        filters: filtersWithDevelopers,
        data: mockData,
        ...mockStoreActions
      })

      const { result } = renderHook(() => useDeveloperQualityFilters())

      act(() => {
        result.current.toggleFilter('developers', 'john.doe')
      })

      expect(mockStoreActions.setFilters).toHaveBeenCalled()
    })

    it('should handle non-array filters gracefully', () => {
      const consoleWarn = jest.spyOn(console, 'warn').mockImplementation()
      const { result } = renderHook(() => useDeveloperQualityFilters())

      act(() => {
        result.current.toggleFilter('dateRange', 'invalid')
      })

      expect(consoleWarn).toHaveBeenCalledWith('Filter dateRange is not an array')
      expect(mockStoreActions.setFilters).not.toHaveBeenCalled()

      consoleWarn.mockRestore()
    })
  })

  describe('setDateRange Action', () => {
    it('should set date range with both dates', () => {
      const { result } = renderHook(() => useDeveloperQualityFilters())
      const startDate = '2024-01-01'
      const endDate = '2024-01-31'

      act(() => {
        result.current.setDateRange(startDate, endDate)
      })

      expect(mockStoreActions.setFilters).toHaveBeenCalledWith(expect.any(Function))
    })

    it('should handle null dates', () => {
      const { result } = renderHook(() => useDeveloperQualityFilters())

      act(() => {
        result.current.setDateRange(null, null)
      })

      expect(mockStoreActions.setFilters).toHaveBeenCalledWith(expect.any(Function))
    })

    it('should handle partial date range', () => {
      const { result } = renderHook(() => useDeveloperQualityFilters())
      const startDate = '2024-01-01'

      act(() => {
        result.current.setDateRange(startDate, null)
      })

      expect(mockStoreActions.setFilters).toHaveBeenCalledWith(expect.any(Function))
    })
  })

  describe('clearFilter Action', () => {
    it('should clear array filter', () => {
      const { result } = renderHook(() => useDeveloperQualityFilters())

      act(() => {
        result.current.clearFilter('developers')
      })

      expect(mockStoreActions.setFilters).toHaveBeenCalledWith(expect.any(Function))
    })

    it('should clear date range filter', () => {
      const { result } = renderHook(() => useDeveloperQualityFilters())

      act(() => {
        result.current.clearFilter('dateRange')
      })

      expect(mockStoreActions.setFilters).toHaveBeenCalledWith(expect.any(Function))
    })

    it('should clear non-array filter', () => {
      const filtersWithCustom = {
        ...mockFilters,
        customFilter: 'value'
      }

      useDeveloperQualityStore.mockReturnValue({
        filters: filtersWithCustom,
        data: mockData,
        ...mockStoreActions
      })

      const { result } = renderHook(() => useDeveloperQualityFilters())

      act(() => {
        result.current.clearFilter('customFilter')
      })

      expect(mockStoreActions.setFilters).toHaveBeenCalledWith(expect.any(Function))
    })
  })

  describe('applyFiltersWithMonitoring', () => {
    it('should apply filters and log performance', () => {
      const consoleLog = jest.spyOn(console, 'log').mockImplementation()
      const { result } = renderHook(() => useDeveloperQualityFilters())

      const filteredResult = result.current.applyFiltersWithMonitoring()

      expect(filterService.applyFilters).toHaveBeenCalledWith(mockData, mockFilters)
      expect(filteredResult).toBe(mockFilteredData)
      expect(consoleLog).toHaveBeenCalledWith(expect.stringMatching(/Filters applied in \d+\.\d+ms/))

      consoleLog.mockRestore()
    })

    it('should handle errors gracefully', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation()
      const error = new Error('Filter error')
      filterService.applyFilters.mockImplementation(() => {
        throw error
      })

      const { result } = renderHook(() => useDeveloperQualityFilters())

      const filteredResult = result.current.applyFiltersWithMonitoring()

      expect(consoleError).toHaveBeenCalledWith('Failed to apply filters:', error)
      expect(filteredResult).toBeNull()

      consoleError.mockRestore()
    })

    it('should return null when no data', () => {
      useDeveloperQualityStore.mockReturnValue({
        filters: mockFilters,
        data: null,
        ...mockStoreActions
      })

      const { result } = renderHook(() => useDeveloperQualityFilters())

      const filteredResult = result.current.applyFiltersWithMonitoring()

      expect(filteredResult).toBeNull()
      expect(filterService.applyFilters).not.toHaveBeenCalled()
    })
  })

  describe('getFilterSummary', () => {
    it('should return "No filters applied" when no active filters', () => {
      const { result } = renderHook(() => useDeveloperQualityFilters())

      const summary = result.current.getFilterSummary()

      expect(summary).toBe('No filters applied')
    })

    it('should return correct summary for single filters', () => {
      mockStoreActions.hasActiveFilters.mockReturnValue(true)
      
      const filtersWithSingle = {
        ...mockFilters,
        developers: ['john.doe']
      }

      useDeveloperQualityStore.mockReturnValue({
        filters: filtersWithSingle,
        data: mockData,
        ...mockStoreActions
      })

      const { result } = renderHook(() => useDeveloperQualityFilters())

      const summary = result.current.getFilterSummary()

      expect(summary).toBe('1 developer')
    })

    it('should return correct summary for multiple filters', () => {
      mockStoreActions.hasActiveFilters.mockReturnValue(true)
      
      const filtersWithMultiple = {
        ...mockFilters,
        developers: ['john.doe', 'jane.smith'],
        projects: ['PROJ-A'],
        severities: ['High', 'Critical', 'Medium']
      }

      useDeveloperQualityStore.mockReturnValue({
        filters: filtersWithMultiple,
        data: mockData,
        ...mockStoreActions
      })

      const { result } = renderHook(() => useDeveloperQualityFilters())

      const summary = result.current.getFilterSummary()

      expect(summary).toBe('2 developers, 1 project, 3 severities')
    })

    it('should handle date range in summary', () => {
      mockStoreActions.hasActiveFilters.mockReturnValue(true)
      
      const filtersWithDateRange = {
        ...mockFilters,
        dateRange: {
          startDate: '2024-01-01',
          endDate: '2024-01-31'
        }
      }

      useDeveloperQualityStore.mockReturnValue({
        filters: filtersWithDateRange,
        data: mockData,
        ...mockStoreActions
      })

      const { result } = renderHook(() => useDeveloperQualityFilters())

      const summary = result.current.getFilterSummary()

      expect(summary).toBe('date range')
    })
  })

  describe('isFilterActive', () => {
    it('should detect active array filter', () => {
      const filtersWithDevelopers = {
        ...mockFilters,
        developers: ['john.doe']
      }

      useDeveloperQualityStore.mockReturnValue({
        filters: filtersWithDevelopers,
        data: mockData,
        ...mockStoreActions
      })

      const { result } = renderHook(() => useDeveloperQualityFilters())

      expect(result.current.isFilterActive('developers')).toBe(true)
      expect(result.current.isFilterActive('developers', 'john.doe')).toBe(true)
      expect(result.current.isFilterActive('developers', 'jane.smith')).toBe(false)
    })

    it('should detect active date range filter', () => {
      const filtersWithDateRange = {
        ...mockFilters,
        dateRange: {
          startDate: '2024-01-01',
          endDate: null
        }
      }

      useDeveloperQualityStore.mockReturnValue({
        filters: filtersWithDateRange,
        data: mockData,
        ...mockStoreActions
      })

      const { result } = renderHook(() => useDeveloperQualityFilters())

      expect(result.current.isFilterActive('dateRange')).toBe(true)
    })

    it('should detect inactive filters', () => {
      const { result } = renderHook(() => useDeveloperQualityFilters())

      expect(result.current.isFilterActive('developers')).toBe(false)
      expect(result.current.isFilterActive('dateRange')).toBe(false)
    })
  })

  describe('getFilteredCount', () => {
    it('should return correct counts', () => {
      const { result } = renderHook(() => useDeveloperQualityFilters())

      const counts = result.current.getFilteredCount()

      expect(counts).toEqual({
        total: 2,
        filtered: 1,
        percentage: '50.0'
      })
    })

    it('should handle no data', () => {
      useDeveloperQualityStore.mockReturnValue({
        filters: mockFilters,
        data: null,
        ...mockStoreActions
      })

      mockStoreActions.getFilteredData.mockReturnValue(null)

      const { result } = renderHook(() => useDeveloperQualityFilters())

      const counts = result.current.getFilteredCount()

      expect(counts).toEqual({
        total: 0,
        filtered: 0,
        percentage: '0'
      })
    })
  })

  describe('validateFilters', () => {
    it('should return no errors for valid filters', () => {
      const { result } = renderHook(() => useDeveloperQualityFilters())

      const errors = result.current.validateFilters()

      expect(errors).toEqual([])
    })

    it('should detect invalid developers', () => {
      const filtersWithInvalidDev = {
        ...mockFilters,
        developers: ['invalid.dev']
      }

      useDeveloperQualityStore.mockReturnValue({
        filters: filtersWithInvalidDev,
        data: mockData,
        ...mockStoreActions
      })

      const { result } = renderHook(() => useDeveloperQualityFilters())

      const errors = result.current.validateFilters()

      expect(errors).toContain('Some selected developers are not available')
    })

    it('should detect multiple validation errors', () => {
      const filtersWithMultipleInvalid = {
        ...mockFilters,
        developers: ['invalid.dev'],
        projects: ['INVALID-PROJ']
      }

      useDeveloperQualityStore.mockReturnValue({
        filters: filtersWithMultipleInvalid,
        data: mockData,
        ...mockStoreActions
      })

      const { result } = renderHook(() => useDeveloperQualityFilters())

      const errors = result.current.validateFilters()

      expect(errors).toContain('Some selected developers are not available')
      expect(errors).toContain('Some selected projects are not available')
    })
  })

  describe('getAvailableFilterValues', () => {
    it('should return available values excluding selected ones', () => {
      const filtersWithDevelopers = {
        ...mockFilters,
        developers: ['john.doe']
      }

      useDeveloperQualityStore.mockReturnValue({
        filters: filtersWithDevelopers,
        data: mockData,
        ...mockStoreActions
      })

      const { result } = renderHook(() => useDeveloperQualityFilters())

      const available = result.current.getAvailableFilterValues('developers')

      expect(available).toEqual(['jane.smith', 'bob.wilson'])
    })

    it('should return all values for non-array filters', () => {
      const { result } = renderHook(() => useDeveloperQualityFilters())

      const available = result.current.getAvailableFilterValues('projects')

      expect(available).toEqual(mockFilterOptions.projects)
    })

    it('should return empty array for unknown filter type', () => {
      const { result } = renderHook(() => useDeveloperQualityFilters())

      const available = result.current.getAvailableFilterValues('unknown')

      expect(available).toEqual([])
    })
  })

  describe('hasActiveFilters', () => {
    it('should return value from store', () => {
      mockStoreActions.hasActiveFilters.mockReturnValue(true)

      const { result } = renderHook(() => useDeveloperQualityFilters())

      expect(result.current.hasActiveFilters).toBe(true)
    })
  })
}) 