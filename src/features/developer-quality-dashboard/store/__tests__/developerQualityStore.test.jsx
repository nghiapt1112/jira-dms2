import { renderHook, act } from '@testing-library/react'
import { useDeveloperQualityStore } from '../developerQualityStore'
import { developerQualityService } from '../../services/developerQualityService'

// Mock the service
jest.mock('../../services/developerQualityService', () => ({
  developerQualityService: {
    processJiraIssuesForDeveloperQuality: jest.fn(),
    getCachedData: jest.fn(),
    applyFilters: jest.fn()
  }
}))

describe('useDeveloperQualityStore', () => {
  beforeEach(() => {
    // Reset store before each test
    act(() => {
      useDeveloperQualityStore.getState().reset()
    })
    
    // Clear all mocks
    jest.clearAllMocks()
  })

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useDeveloperQualityStore())
      
      expect(result.current.data).toBeNull()
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
      expect(result.current.lastUpdated).toBeNull()
      expect(result.current.cacheSize).toBe(0)
      expect(result.current.processingTime).toBe(0)
      expect(result.current.filteredData).toBeNull()
      expect(result.current.filterAppliedAt).toBeNull()
    })

    it('should have correct initial filters', () => {
      const { result } = renderHook(() => useDeveloperQualityStore())
      
      expect(result.current.filters).toEqual({
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
      })
    })
  })

  describe('setData Action', () => {
    it('should set data correctly', () => {
      const { result } = renderHook(() => useDeveloperQualityStore())
      const mockData = {
        metrics: { teamContribution: { totalContributions: 100 } },
        metadata: {
          cacheSize: 1024,
          processingTime: 500
        }
      }

      act(() => {
        result.current.setData(mockData)
      })

      expect(result.current.data).toBe(mockData)
      expect(result.current.error).toBeNull()
      expect(result.current.cacheSize).toBe(1024)
      expect(result.current.processingTime).toBe(500)
      expect(result.current.lastUpdated).toBeTruthy()
    })

    it('should handle data without metadata', () => {
      const { result } = renderHook(() => useDeveloperQualityStore())
      const mockData = { metrics: {} }

      act(() => {
        result.current.setData(mockData)
      })

      expect(result.current.data).toBe(mockData)
      expect(result.current.cacheSize).toBe(0)
      expect(result.current.processingTime).toBe(0)
    })
  })

  describe('setLoading Action', () => {
    it('should set loading state', () => {
      const { result } = renderHook(() => useDeveloperQualityStore())

      act(() => {
        result.current.setLoading(true)
      })

      expect(result.current.isLoading).toBe(true)

      act(() => {
        result.current.setLoading(false)
      })

      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('setError Action', () => {
    it('should set error message from string', () => {
      const { result } = renderHook(() => useDeveloperQualityStore())
      const errorMessage = 'Test error message'

      act(() => {
        result.current.setError(errorMessage)
      })

      expect(result.current.error).toBe(errorMessage)
      expect(result.current.isLoading).toBe(false)
    })

    it('should set error message from Error object', () => {
      const { result } = renderHook(() => useDeveloperQualityStore())
      const error = new Error('Test error')

      act(() => {
        result.current.setError(error)
      })

      expect(result.current.error).toBe('Test error')
      expect(result.current.isLoading).toBe(false)
    })

    it('should handle unknown error type', () => {
      const { result } = renderHook(() => useDeveloperQualityStore())

      act(() => {
        result.current.setError({})
      })

      expect(result.current.error).toBe('Unknown error')
      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('setFilters Action', () => {
    it('should set filters with object', () => {
      const { result } = renderHook(() => useDeveloperQualityStore())
      const newFilters = {
        developers: ['john.doe'],
        projects: ['PROJ-A']
      }

      act(() => {
        result.current.setFilters(newFilters)
      })

      expect(result.current.filters.developers).toEqual(['john.doe'])
      expect(result.current.filters.projects).toEqual(['PROJ-A'])
      expect(result.current.filteredData).toBeNull()
      expect(result.current.filterAppliedAt).toBeNull()
    })

    it('should set filters with function', () => {
      const { result } = renderHook(() => useDeveloperQualityStore())

      act(() => {
        result.current.setFilters(prev => ({
          ...prev,
          developers: ['jane.smith']
        }))
      })

      expect(result.current.filters.developers).toEqual(['jane.smith'])
      expect(result.current.filteredData).toBeNull()
    })
  })

  describe('setFilteredData Action', () => {
    it('should set filtered data with timestamp', () => {
      const { result } = renderHook(() => useDeveloperQualityStore())
      const filteredData = { metrics: {}, chartData: {} }

      act(() => {
        result.current.setFilteredData(filteredData)
      })

      expect(result.current.filteredData).toBe(filteredData)
      expect(result.current.filterAppliedAt).toBeTruthy()
    })
  })

  describe('resetFilters Action', () => {
    it('should reset filters to initial state', () => {
      const { result } = renderHook(() => useDeveloperQualityStore())

      // Set some filters first
      act(() => {
        result.current.setFilters({
          developers: ['john.doe'],
          projects: ['PROJ-A']
        })
        result.current.setFilteredData({ test: 'data' })
      })

      // Reset filters
      act(() => {
        result.current.resetFilters()
      })

      expect(result.current.filters).toEqual({
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
      })
      expect(result.current.filteredData).toBeNull()
      expect(result.current.filterAppliedAt).toBeNull()
    })
  })

  describe('reset Action', () => {
    it('should reset entire store to initial state', () => {
      const { result } = renderHook(() => useDeveloperQualityStore())

      // Set some state first
      act(() => {
        result.current.setData({ test: 'data' })
        result.current.setLoading(true)
        result.current.setError('test error')
        result.current.setFilters({ developers: ['john.doe'] })
      })

      // Reset store
      act(() => {
        result.current.reset()
      })

      expect(result.current.data).toBeNull()
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
      expect(result.current.lastUpdated).toBeNull()
      expect(result.current.filters.developers).toEqual([])
      expect(result.current.filteredData).toBeNull()
    })
  })

  describe('loadData Action', () => {
    it('should load data from raw issues', async () => {
      const { result } = renderHook(() => useDeveloperQualityStore())
      const rawIssues = [{ id: '1', key: 'TEST-1' }]
      const processedData = { metrics: {}, chartData: {} }

      developerQualityService.processJiraIssuesForDeveloperQuality.mockResolvedValue(processedData)

      await act(async () => {
        await result.current.loadData(rawIssues)
      })

      expect(developerQualityService.processJiraIssuesForDeveloperQuality).toHaveBeenCalledWith(rawIssues)
      expect(result.current.data).toBe(processedData)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('should load data from cache when no raw data provided', async () => {
      const { result } = renderHook(() => useDeveloperQualityStore())
      const cachedData = { metrics: {}, chartData: {} }

      developerQualityService.getCachedData.mockResolvedValue(cachedData)

      await act(async () => {
        await result.current.loadData()
      })

      expect(developerQualityService.getCachedData).toHaveBeenCalled()
      expect(result.current.data).toBe(cachedData)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('should handle error when no data available', async () => {
      const { result } = renderHook(() => useDeveloperQualityStore())

      developerQualityService.getCachedData.mockResolvedValue(null)

      await act(async () => {
        await result.current.loadData()
      })

      expect(result.current.error).toBe('No data available. Please load JIRA data first.')
      expect(result.current.isLoading).toBe(false)
      expect(result.current.data).toBeNull()
    })

    it('should handle processing error', async () => {
      const { result } = renderHook(() => useDeveloperQualityStore())
      const error = new Error('Processing failed')

      developerQualityService.processJiraIssuesForDeveloperQuality.mockRejectedValue(error)

      await act(async () => {
        await result.current.loadData([{ id: '1' }])
      })

      expect(result.current.error).toBe('Processing failed')
      expect(result.current.isLoading).toBe(false)
      expect(result.current.data).toBeNull()
    })
  })

  describe('refreshData Action', () => {
    it('should refresh data by calling loadData', async () => {
      const { result } = renderHook(() => useDeveloperQualityStore())
      const cachedData = { metrics: {}, chartData: {} }

      developerQualityService.getCachedData.mockResolvedValue(cachedData)

      await act(async () => {
        await result.current.refreshData()
      })

      expect(developerQualityService.getCachedData).toHaveBeenCalled()
      expect(result.current.data).toBe(cachedData)
    })
  })

  describe('getFilteredData Computed Getter', () => {
    it('should return null when no data', () => {
      const { result } = renderHook(() => useDeveloperQualityStore())

      const filteredData = result.current.getFilteredData()

      expect(filteredData).toBeNull()
    })

    it('should return cached filtered data when available', () => {
      const { result } = renderHook(() => useDeveloperQualityStore())
      const mockData = { metrics: {}, indices: {} }
      const mockFiltered = { metrics: {}, chartData: {} }

      act(() => {
        result.current.setData(mockData)
        result.current.setFilteredData(mockFiltered)
      })

      const filteredData = result.current.getFilteredData()

      expect(filteredData).toBe(mockFiltered)
    })

    it('should apply filters and cache result when no cached data', () => {
      const { result } = renderHook(() => useDeveloperQualityStore())
      const mockData = { metrics: {}, indices: {} }
      const mockFiltered = { metrics: {}, chartData: {} }
      const mockFilters = { developers: ['john.doe'] }

      developerQualityService.applyFilters.mockReturnValue(mockFiltered)

      act(() => {
        result.current.setData(mockData)
        result.current.setFilters(mockFilters)
      })

      act(() => {
        const filteredData = result.current.getFilteredData()
        expect(filteredData).toBe(mockFiltered)
      })

      expect(developerQualityService.applyFilters).toHaveBeenCalledWith(mockData, mockFilters)
      expect(result.current.filteredData).toBe(mockFiltered)
    })

    it('should handle filter application error', () => {
      const { result } = renderHook(() => useDeveloperQualityStore())
      const mockData = { metrics: {}, indices: {} }
      const error = new Error('Filter error')

      developerQualityService.applyFilters.mockImplementation(() => {
        throw error
      })

      act(() => {
        result.current.setData(mockData)
      })

      act(() => {
        const filteredData = result.current.getFilteredData()
        expect(filteredData).toBeNull()
      })

      expect(result.current.error).toBe('Filter error')
    })
  })

  describe('getFilterOptions Computed Getter', () => {
    it('should return default filter options when no data', () => {
      const { result } = renderHook(() => useDeveloperQualityStore())

      const filterOptions = result.current.getFilterOptions()

      expect(filterOptions).toEqual({
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
      })
    })

    it('should return filter options from data', () => {
      const { result } = renderHook(() => useDeveloperQualityStore())
      const mockData = {
        filterOptions: {
          developers: ['john.doe', 'jane.smith'],
          projects: ['PROJ-A', 'PROJ-B']
        }
      }

      act(() => {
        result.current.setData(mockData)
      })

      const filterOptions = result.current.getFilterOptions()

      expect(filterOptions).toBe(mockData.filterOptions)
    })
  })

  describe('hasActiveFilters Computed Getter', () => {
    it('should return false when no filters active', () => {
      const { result } = renderHook(() => useDeveloperQualityStore())

      const hasActive = result.current.hasActiveFilters()

      expect(hasActive).toBe(false)
    })

    it('should return true when array filters have values', () => {
      const { result } = renderHook(() => useDeveloperQualityStore())

      act(() => {
        result.current.setFilters({ 
          developers: ['john.doe'],
          projects: [],
          issueTypes: [],
          statuses: [],
          severities: [],
          rootCauses: [],
          dateRange: {
            startDate: null,
            endDate: null
          }
        })
      })

      const hasActive = result.current.hasActiveFilters()

      expect(hasActive).toBe(true)
    })

    it('should return true when date range is set', () => {
      const { result } = renderHook(() => useDeveloperQualityStore())

      act(() => {
        result.current.setFilters({
          developers: [],
          projects: [],
          issueTypes: [],
          statuses: [],
          severities: [],
          rootCauses: [],
          dateRange: { startDate: '2024-01-01', endDate: null }
        })
      })

      const hasActive = result.current.hasActiveFilters()

      expect(hasActive).toBe(true)
    })
  })

  describe('getMetrics and getChartData Computed Getters', () => {
    it('should return null when no filtered data', () => {
      const { result } = renderHook(() => useDeveloperQualityStore())

      expect(result.current.getMetrics()).toBeNull()
      expect(result.current.getChartData()).toBeNull()
    })

    it('should return metrics and chart data from filtered data', () => {
      const { result } = renderHook(() => useDeveloperQualityStore())
      const mockMetrics = { teamContribution: {} }
      const mockChartData = { teamContributionChart: {} }
      const mockData = { metrics: {}, indices: {} }

      developerQualityService.applyFilters.mockReturnValue({
        metrics: mockMetrics,
        chartData: mockChartData
      })

      act(() => {
        result.current.setData(mockData)
      })

      expect(result.current.getMetrics()).toBe(mockMetrics)
      expect(result.current.getChartData()).toBe(mockChartData)
    })
  })
}) 