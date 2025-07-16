import { renderHook, act } from '@testing-library/react'
import { useDeveloperQualityCache } from '../useDeveloperQualityCache'
import { useDeveloperQualityStore } from '../../store/developerQualityStore'
import { useJiraData } from '../../../jira-data/hooks/useJiraData'

// Mock dependencies
jest.mock('../../store/developerQualityStore')
jest.mock('../../../jira-data/hooks/useJiraData')
jest.mock('../../../../shared/services/jiraDataService', () => ({
  jiraDataService: {}
}))
jest.mock('axios')

describe('useDeveloperQualityCache', () => {
  const mockStoreActions = {
    loadData: jest.fn(),
    refreshData: jest.fn(),
    reset: jest.fn(),
    setData: jest.fn()
  }

  const mockStoreState = {
    data: null,
    isLoading: false,
    error: null,
    lastUpdated: null,
    cacheSize: 0,
    processingTime: 0,
    ...mockStoreActions
  }

  const mockJiraData = {
    issues: null,
    isLoading: false,
    error: null,
    hasData: false,
    fetchData: jest.fn(),
    loadCachedData: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock store hook
    useDeveloperQualityStore.mockReturnValue(mockStoreState)
    useDeveloperQualityStore.getState = jest.fn().mockReturnValue({
      setData: mockStoreActions.setData
    })
    
    // Mock JIRA data hook
    useJiraData.mockReturnValue(mockJiraData)
  })

  describe('Basic Hook Functionality', () => {
    it('should return correct initial state', () => {
      const { result } = renderHook(() => useDeveloperQualityCache())

      expect(result.current.data).toBeNull()
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
      expect(result.current.cacheStatus).toBe('empty')
    })

    it('should handle loading state', () => {
      useDeveloperQualityStore.mockReturnValue({
        ...mockStoreState,
        isLoading: true
      })

      const { result } = renderHook(() => useDeveloperQualityCache())

      expect(result.current.isLoading).toBe(true)
      expect(result.current.cacheStatus).toBe('loading')
    })

    it('should handle error state', () => {
      const testError = new Error('Test error')
      useDeveloperQualityStore.mockReturnValue({
        ...mockStoreState,
        error: testError
      })

      const { result } = renderHook(() => useDeveloperQualityCache())

      expect(result.current.error).toBe(testError)
      expect(result.current.cacheStatus).toBe('error')
    })

    it('should handle data ready state', () => {
      const testData = { metrics: {}, chartData: {} }
      useDeveloperQualityStore.mockReturnValue({
        ...mockStoreState,
        data: testData,
        lastUpdated: '2024-01-01T00:00:00Z'
      })

      const { result } = renderHook(() => useDeveloperQualityCache())

      expect(result.current.data).toBe(testData)
      expect(result.current.cacheStatus).toBe('ready')
    })
  })

  describe('Actions', () => {
    it('should provide refresh action', () => {
      const { result } = renderHook(() => useDeveloperQualityCache())

      expect(typeof result.current.handleRefresh).toBe('function')
      expect(typeof result.current.refresh).toBe('function')
    })

    it('should provide force reload action', () => {
      const { result } = renderHook(() => useDeveloperQualityCache())

      expect(typeof result.current.handleForceReload).toBe('function')
      expect(typeof result.current.forceReload).toBe('function')
    })

    it('should provide clear cache action', () => {
      const { result } = renderHook(() => useDeveloperQualityCache())

      expect(typeof result.current.handleClearCache).toBe('function')
      expect(typeof result.current.clearCache).toBe('function')
    })
  })

  describe('Integration with JIRA Data', () => {
    it('should load data when JIRA issues become available', () => {
      const issues = [{ id: '1', key: 'TEST-1' }]
      
      useJiraData.mockReturnValue({
        ...mockJiraData,
        allIssues: issues,
        hasData: true
      })

      renderHook(() => useDeveloperQualityCache())

      expect(mockStoreActions.loadData).toHaveBeenCalledWith(issues)
    })

    it('should try to load cached data when no JIRA data exists', () => {
      const mockLoadCachedData = jest.fn()
      
      useJiraData.mockReturnValue({
        ...mockJiraData,
        loadCachedData: mockLoadCachedData
      })

      renderHook(() => useDeveloperQualityCache())

      expect(mockLoadCachedData).toHaveBeenCalled()
    })
  })

  describe('Cache Status', () => {
    it('should return empty status when no data', () => {
      const { result } = renderHook(() => useDeveloperQualityCache())
      expect(result.current.cacheStatus).toBe('empty')
    })

    it('should return loading status when loading', () => {
      useDeveloperQualityStore.mockReturnValue({
        ...mockStoreState,
        isLoading: true
      })

      const { result } = renderHook(() => useDeveloperQualityCache())
      expect(result.current.cacheStatus).toBe('loading')
    })

    it('should return error status when error exists', () => {
      useDeveloperQualityStore.mockReturnValue({
        ...mockStoreState,
        error: new Error('Test error')
      })

      const { result } = renderHook(() => useDeveloperQualityCache())
      expect(result.current.cacheStatus).toBe('error')
    })

    it('should return ready status when data is available', () => {
      useDeveloperQualityStore.mockReturnValue({
        ...mockStoreState,
        data: { metrics: {} },
        lastUpdated: '2024-01-01T00:00:00Z'
      })

      const { result } = renderHook(() => useDeveloperQualityCache())
      expect(result.current.cacheStatus).toBe('ready')
    })
  })
}) 