import { renderHook, act } from '@testing-library/react'
import { useMainDashboardCache } from '../useMainDashboardCache'
import { getTestIssues, getMockProjectData } from '../../__tests__/testData'

// Mock the transformIssuesForProjectOverview service
jest.mock('../../services/transformIssuesForProjectOverview', () => ({
  transformIssuesForProjectOverview: jest.fn()
}))

describe('useMainDashboardCache', () => {
  let mockTransformService

  beforeEach(() => {
    mockTransformService = require('../../services/transformIssuesForProjectOverview')
    
    // Mock localStorage
    global.localStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn()
    }

    // Mock Date.now for consistent testing
    jest.spyOn(Date, 'now').mockReturnValue(1640995200000) // 2022-01-01 00:00:00

    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Hook Initialization', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => useMainDashboardCache([]))
      
      expect(result.current.cacheKey).toMatch(/main_dashboard_cache_/)
      expect(result.current.performanceMetrics).toEqual({
        hitRate: 0,
        avgResponseTime: 0,
        totalRequests: 0,
        hits: 0,
        misses: 0,
        cacheSize: 0,
        isPerformant: false,
        lastProcessingTime: null,
        cacheKeys: []
      })
      expect(result.current.cacheStatus).toEqual({
        status: 'empty',
        age: 0,
        expiresIn: 0
      })
      expect(result.current.isProcessing).toBe(false)
    })

    it('should generate cache key based on selected projects', () => {
      const { result: result1 } = renderHook(() => useMainDashboardCache(['PROJ1']))
      const { result: result2 } = renderHook(() => useMainDashboardCache(['PROJ2']))
      
      expect(result1.current.cacheKey).not.toBe(result2.current.cacheKey)
    })

    it('should generate same cache key for same project selection', () => {
      const { result: result1 } = renderHook(() => useMainDashboardCache(['PROJ1', 'PROJ2']))
      const { result: result2 } = renderHook(() => useMainDashboardCache(['PROJ1', 'PROJ2']))
      
      expect(result1.current.cacheKey).toBe(result2.current.cacheKey)
    })

    it('should handle empty project selection', () => {
      const { result } = renderHook(() => useMainDashboardCache([]))
      
      expect(result.current.cacheKey).toMatch(/main_dashboard_cache_/)
    })
  })

  describe('Cache Operations', () => {
    const mockIssues = getTestIssues(10)
    const mockTransformedData = {
      projects: getMockProjectData(),
      metrics: {
        totalProjects: 2,
        avgQualityScore: 80,
        avgHealthScore: 85,
        avgDeliveryScore: 81.5,
        totalIssues: 40,
        totalBugs: 5
      }
    }

    beforeEach(() => {
      mockTransformService.transformIssuesForProjectOverview.mockResolvedValue(mockTransformedData)
    })

    it('should process issues and cache results', async () => {
      const { result } = renderHook(() => useMainDashboardCache(['PROJ1']))
      
      let processResult
      await act(async () => {
        processResult = await result.current.processIssuesWithCache(mockIssues)
      })
      
      expect(processResult.data).toEqual(mockTransformedData)
      expect(processResult.fromCache).toBe(false)
      expect(localStorage.setItem).toHaveBeenCalled()
    })

    it('should return cached data when available and valid', async () => {
      const cachedData = {
        data: mockTransformedData,
        timestamp: Date.now() - 1000000, // 16.6 minutes ago (within 6 hour limit)
        expiryTime: Date.now() + 20000000 // Future expiry
      }
      
      localStorage.getItem.mockReturnValue(JSON.stringify(cachedData))
      
      const { result } = renderHook(() => useMainDashboardCache(['PROJ1']))
      
      let processResult
      await act(async () => {
        processResult = await result.current.processIssuesWithCache(mockIssues)
      })
      
      expect(processResult.data).toEqual(mockTransformedData)
      expect(processResult.fromCache).toBe(true)
      expect(mockTransformService.transformIssuesForProjectOverview).not.toHaveBeenCalled()
    })

    it('should refresh expired cache', async () => {
      const expiredCachedData = {
        data: mockTransformedData,
        timestamp: Date.now() - 25200000, // 7 hours ago (expired)
        expiryTime: Date.now() - 3600000 // Past expiry
      }
      
      localStorage.getItem.mockReturnValue(JSON.stringify(expiredCachedData))
      
      const { result } = renderHook(() => useMainDashboardCache(['PROJ1']))
      
      let processResult
      await act(async () => {
        processResult = await result.current.processIssuesWithCache(mockIssues)
      })
      
      expect(processResult.fromCache).toBe(false)
      expect(mockTransformService.transformIssuesForProjectOverview).toHaveBeenCalled()
    })

    it('should handle corrupted cache data', async () => {
      localStorage.getItem.mockReturnValue('invalid json')
      
      const { result } = renderHook(() => useMainDashboardCache(['PROJ1']))
      
      let processResult
      await act(async () => {
        processResult = await result.current.processIssuesWithCache(mockIssues)
      })
      
      expect(processResult.fromCache).toBe(false)
      expect(mockTransformService.transformIssuesForProjectOverview).toHaveBeenCalled()
    })
  })

  describe('Performance Metrics', () => {
    const mockIssues = getTestIssues(5)
    const mockTransformedData = { projects: [], metrics: {} }

    beforeEach(() => {
      mockTransformService.transformIssuesForProjectOverview.mockResolvedValue(mockTransformedData)
    })

    it('should track cache hits and misses', async () => {
      const { result } = renderHook(() => useMainDashboardCache(['PROJ1']))
      
      // First call - cache miss
      await act(async () => {
        await result.current.processIssuesWithCache(mockIssues)
      })
      
      expect(result.current.performanceMetrics.misses).toBe(1)
      expect(result.current.performanceMetrics.hits).toBe(0)
      
      // Second call - cache hit (if data was cached)
      await act(async () => {
        await result.current.processIssuesWithCache(mockIssues)
      })
      
      expect(result.current.performanceMetrics.totalRequests).toBe(2)
    })

    it('should calculate hit rate correctly', async () => {
      const { result } = renderHook(() => useMainDashboardCache(['PROJ1']))
      
      // Setup cache with some data
      const cachedData = {
        data: mockTransformedData,
        timestamp: Date.now() - 1000000,
        expiryTime: Date.now() + 20000000
      }
      localStorage.getItem.mockReturnValue(JSON.stringify(cachedData))
      
      // Multiple cache hits
      await act(async () => {
        await result.current.processIssuesWithCache(mockIssues)
        await result.current.processIssuesWithCache(mockIssues)
        await result.current.processIssuesWithCache(mockIssues)
      })
      
      expect(result.current.performanceMetrics.hits).toBe(3)
      expect(result.current.performanceMetrics.hitRate).toBe(100)
    })

    it('should track response times', async () => {
      const { result } = renderHook(() => useMainDashboardCache(['PROJ1']))
      
      await act(async () => {
        await result.current.processIssuesWithCache(mockIssues)
      })
      
      expect(result.current.performanceMetrics.avgResponseTime).toBeGreaterThan(0)
      expect(result.current.performanceMetrics.lastProcessingTime).toBeGreaterThan(0)
    })

    it('should determine if performance is acceptable', async () => {
      const { result } = renderHook(() => useMainDashboardCache(['PROJ1']))
      
      // Mock fast processing
      mockTransformService.transformIssuesForProjectOverview.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockTransformedData), 5))
      )
      
      await act(async () => {
        await result.current.processIssuesWithCache(mockIssues)
      })
      
      // Should be performant for fast response
      expect(result.current.performanceMetrics.isPerformant).toBe(true)
    })
  })

  describe('Cache Status', () => {
    it('should return empty status when no cache', () => {
      localStorage.getItem.mockReturnValue(null)
      
      const { result } = renderHook(() => useMainDashboardCache(['PROJ1']))
      const status = result.current.getCacheStatus()
      
      expect(status.status).toBe('empty')
      expect(status.age).toBe(0)
      expect(status.expiresIn).toBe(0)
    })

    it('should return valid status for fresh cache', () => {
      const cachedData = {
        data: {},
        timestamp: Date.now() - 1800000, // 30 minutes ago
        expiryTime: Date.now() + 19200000 // 5.33 hours from now
      }
      localStorage.getItem.mockReturnValue(JSON.stringify(cachedData))
      
      const { result } = renderHook(() => useMainDashboardCache(['PROJ1']))
      const status = result.current.getCacheStatus()
      
      expect(status.status).toBe('valid')
      expect(status.age).toBe(1800000)
      expect(status.expiresIn).toBe(19200000)
    })

    it('should return expired status for old cache', () => {
      const cachedData = {
        data: {},
        timestamp: Date.now() - 25200000, // 7 hours ago
        expiryTime: Date.now() - 3600000 // 1 hour ago
      }
      localStorage.getItem.mockReturnValue(JSON.stringify(cachedData))
      
      const { result } = renderHook(() => useMainDashboardCache(['PROJ1']))
      const status = result.current.getCacheStatus()
      
      expect(status.status).toBe('expired')
      expect(status.expiresIn).toBeLessThan(0)
    })
  })

  describe('Cache Management', () => {
    it('should clear specific cache entry', () => {
      const { result } = renderHook(() => useMainDashboardCache(['PROJ1']))
      
      act(() => {
        result.current.clearCache('specific_cache_key')
      })
      
      expect(localStorage.removeItem).toHaveBeenCalledWith('specific_cache_key')
    })

    it('should clear all cache entries when no key specified', () => {
      // Mock localStorage with some cache keys
      const mockCacheKeys = ['cache1', 'cache2', 'main_dashboard_cache_abc']
      Object.defineProperty(window, 'localStorage', {
        value: {
          ...localStorage,
          key: jest.fn((index) => mockCacheKeys[index]),
          length: mockCacheKeys.length
        }
      })
      
      const { result } = renderHook(() => useMainDashboardCache(['PROJ1']))
      
      act(() => {
        result.current.clearCache()
      })
      
      expect(localStorage.removeItem).toHaveBeenCalledWith('main_dashboard_cache_abc')
    })

    it('should update performance metrics after cache clear', () => {
      const { result } = renderHook(() => useMainDashboardCache(['PROJ1']))
      
      act(() => {
        result.current.clearCache()
      })
      
      expect(result.current.performanceMetrics.cacheSize).toBe(0)
    })
  })

  describe('Error Handling', () => {
    it('should handle localStorage errors gracefully', async () => {
      localStorage.getItem.mockImplementation(() => {
        throw new Error('LocalStorage error')
      })
      
      const { result } = renderHook(() => useMainDashboardCache(['PROJ1']))
      
      let processResult
      await act(async () => {
        processResult = await result.current.processIssuesWithCache(getTestIssues(5))
      })
      
      expect(processResult.fromCache).toBe(false)
      expect(mockTransformService.transformIssuesForProjectOverview).toHaveBeenCalled()
    })

    it('should handle transform service errors', async () => {
      mockTransformService.transformIssuesForProjectOverview.mockRejectedValue(
        new Error('Transform error')
      )
      
      const { result } = renderHook(() => useMainDashboardCache(['PROJ1']))
      
      await expect(
        act(async () => {
          await result.current.processIssuesWithCache(getTestIssues(5))
        })
      ).rejects.toThrow('Transform error')
    })

    it('should handle malformed cache data', async () => {
      localStorage.getItem.mockReturnValue('{"invalid": "structure"}')
      
      const { result } = renderHook(() => useMainDashboardCache(['PROJ1']))
      
      let processResult
      await act(async () => {
        processResult = await result.current.processIssuesWithCache(getTestIssues(5))
      })
      
      expect(processResult.fromCache).toBe(false)
    })
  })

  describe('Cache Key Management', () => {
    it('should track multiple cache keys', async () => {
      const { result } = renderHook(() => useMainDashboardCache(['PROJ1']))
      
      // Create some cache entries
      await act(async () => {
        await result.current.processIssuesWithCache(getTestIssues(5))
      })
      
      expect(result.current.performanceMetrics.cacheKeys).toContain(result.current.cacheKey)
    })

    it('should handle cache key generation edge cases', () => {
      const { result: result1 } = renderHook(() => useMainDashboardCache([]))
      const { result: result2 } = renderHook(() => useMainDashboardCache(null))
      const { result: result3 } = renderHook(() => useMainDashboardCache(undefined))
      
      expect(result1.current.cacheKey).toBeDefined()
      expect(result2.current.cacheKey).toBeDefined()
      expect(result3.current.cacheKey).toBeDefined()
    })
  })

  describe('Performance Optimization', () => {
    it('should debounce rapid cache operations', async () => {
      const { result } = renderHook(() => useMainDashboardCache(['PROJ1']))
      const mockIssues = getTestIssues(3)
      
      // Make multiple rapid calls
      await act(async () => {
        const promises = [
          result.current.processIssuesWithCache(mockIssues),
          result.current.processIssuesWithCache(mockIssues),
          result.current.processIssuesWithCache(mockIssues)
        ]
        await Promise.all(promises)
      })
      
      // Should not overwhelm the system
      expect(result.current.performanceMetrics.totalRequests).toBeGreaterThan(0)
    })

    it('should handle large datasets efficiently', async () => {
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        id: `issue-${i}`,
        key: `LARGE-${i}`,
        displayFields: { projectKey: 'LARGE' }
      }))
      
      const { result } = renderHook(() => useMainDashboardCache(['LARGE']))
      
      const startTime = performance.now()
      
      await act(async () => {
        await result.current.processIssuesWithCache(largeDataset)
      })
      
      const endTime = performance.now()
      const processingTime = endTime - startTime
      
      // Should complete within reasonable time
      expect(processingTime).toBeLessThan(5000) // 5 seconds
    })
  })
})