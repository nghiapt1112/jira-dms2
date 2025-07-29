import { performanceMonitor } from '../utils/PerformanceMonitor'
import { SEVERITY_LEVELS } from '../../../shared/constants/severityConstants.js'

class CacheOptimizationService {
  constructor() {
    this.cacheWarmupQueue = []
    this.isWarmingUp = false
    this.memoryThreshold = 100 * 1024 * 1024 // 100MB
    this.cleanupInterval = null
    this.preloadedFilters = new Map()
  }

  // Initialize cache optimization
  initialize() {
    this.startMemoryMonitoring()
    this.preloadCommonFilters()
  }

  // Start memory monitoring
  startMemoryMonitoring() {
    this.cleanupInterval = setInterval(() => {
      this.checkMemoryUsage()
    }, 30000) // Check every 30 seconds
  }

  // Stop memory monitoring
  stopMemoryMonitoring() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
  }

  // Check memory usage and cleanup if needed
  checkMemoryUsage() {
    const timer = performanceMonitor.startTimer('memoryCheck')
    
    try {
      const memory = performanceMonitor.getMemoryUsage()
      if (memory && memory.used > this.memoryThreshold) {
        console.warn(`Memory threshold exceeded: ${(memory.used / 1024 / 1024).toFixed(2)}MB`)
        this.performMemoryCleanup()
      }
      
      timer?.end()
    } catch (error) {
      timer?.end()
      console.error('Memory check failed:', error)
    }
  }

  // Perform memory cleanup
  performMemoryCleanup() {
    const timer = performanceMonitor.startTimer('memoryCleanup')
    
    try {
      // Clear old preloaded filters
      const now = Date.now()
      const maxAge = 5 * 60 * 1000 // 5 minutes
      
      for (const [key, entry] of this.preloadedFilters.entries()) {
        if (now - entry.timestamp > maxAge) {
          this.preloadedFilters.delete(key)
        }
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc()
      }
      
      timer?.end()
  
    } catch (error) {
      timer?.end()
      console.error('Memory cleanup failed:', error)
    }
  }

  // Preload common filter combinations
  async preloadCommonFilters() {
    if (this.isWarmingUp) return
    
    this.isWarmingUp = true
    const timer = performanceMonitor.startTimer('cacheWarmup')
    
    try {
      // Common filter combinations to preload
      const commonFilters = [
        { developers: [], projects: [], issueTypes: ['Bug'] }, // All bugs
        { developers: [], projects: [], issueTypes: ['Story'] }, // All stories
        { developers: [], projects: [], severities: [SEVERITY_LEVELS.CRITICAL, SEVERITY_LEVELS.MAJOR] }, // High priority
        { developers: [], projects: [], dateRange: 'last30days' }, // Recent items
      ]

      for (const filters of commonFilters) {
        await this.warmupFilterCombination(filters)
      }
      
      timer?.end()
  
    } catch (error) {
      timer?.end()
      console.error('Cache warmup failed:', error)
    } finally {
      this.isWarmingUp = false
    }
  }

  // Warmup specific filter combination
  async warmupFilterCombination(filters) {
    const filterKey = this.generateFilterKey(filters)
    
    if (this.preloadedFilters.has(filterKey)) {
      return // Already preloaded
    }
    
    try {
      // Simulate filter application to warm up indices
      const mockData = await this.simulateFilterApplication(filters)
      
      this.preloadedFilters.set(filterKey, {
        data: mockData,
        timestamp: Date.now(),
        hitCount: 0
      })
      
      performanceMonitor.recordMetric('cacheWarmup', 1)
    } catch (error) {
      console.error('Filter warmup failed:', error)
    }
  }

  // Generate cache key for filter combination
  generateFilterKey(filters) {
    const sortedKeys = Object.keys(filters).sort()
    const keyParts = sortedKeys.map(key => {
      const value = filters[key]
      if (Array.isArray(value)) {
        return `${key}:${value.sort().join(',')}`
      }
      return `${key}:${value}`
    })
    return keyParts.join('|')
  }

  // Simulate filter application for warmup
  async simulateFilterApplication(filters) {
    // This would normally call the actual filter service
    // For now, return a mock structure
    return {
      filteredMetrics: {},
      filteredChartData: {},
      filteredIssues: []
    }
  }

  // Get preloaded filter data
  getPreloadedFilter(filters) {
    const filterKey = this.generateFilterKey(filters)
    const entry = this.preloadedFilters.get(filterKey)
    
    if (entry) {
      entry.hitCount++
      performanceMonitor.recordMetric('cacheHit', 1)
      return entry.data
    }
    
    performanceMonitor.recordMetric('cacheMiss', 1)
    return null
  }

  // Optimize chart data for rendering
  optimizeChartData(chartData) {
    const timer = performanceMonitor.startTimer('chartOptimization')
    
    try {
      // Limit data points for performance
      const maxDataPoints = 100
      
      const optimized = {}
      
      for (const [chartType, data] of Object.entries(chartData)) {
        if (Array.isArray(data.data) && data.data.length > maxDataPoints) {
          // Sample data points for large datasets
          const step = Math.ceil(data.data.length / maxDataPoints)
          optimized[chartType] = {
            ...data,
            data: data.data.filter((_, index) => index % step === 0)
          }
        } else {
          optimized[chartType] = data
        }
      }
      
      timer?.end()
      return optimized
    } catch (error) {
      timer?.end()
      console.error('Chart optimization failed:', error)
      return chartData
    }
  }

  // Get cache statistics
  getCacheStats() {
    const stats = {
      preloadedFilters: this.preloadedFilters.size,
      totalHits: 0,
      memoryUsage: performanceMonitor.getMemoryUsage(),
      isWarmingUp: this.isWarmingUp
    }
    
    for (const entry of this.preloadedFilters.values()) {
      stats.totalHits += entry.hitCount
    }
    
    return stats
  }

  // Clean up resources
  cleanup() {
    this.stopMemoryMonitoring()
    this.preloadedFilters.clear()
    this.cacheWarmupQueue = []
  }
}

// Singleton instance
export const cacheOptimizationService = new CacheOptimizationService()

export default CacheOptimizationService 