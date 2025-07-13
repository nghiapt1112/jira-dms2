class PerformanceMonitor {
  constructor() {
    this.metrics = new Map()
    this.thresholds = {
      filterResponse: 1, // 1ms
      chartRender: 200, // 200ms
      cacheHit: 1, // 1ms
      memoryUsage: 100 * 1024 * 1024 // 100MB
    }
    this.isEnabled = process.env.NODE_ENV === 'development'
  }

  startTimer(operation) {
    if (!this.isEnabled) return null
    
    const startTime = performance.now()
    return {
      operation,
      startTime,
      end: () => this.endTimer(operation, startTime)
    }
  }

  endTimer(operation, startTime) {
    if (!this.isEnabled) return
    
    const endTime = performance.now()
    const duration = endTime - startTime
    
    this.recordMetric(operation, duration)
    
    // Check thresholds
    const threshold = this.thresholds[operation]
    if (threshold && duration > threshold) {
      console.warn(`Performance threshold exceeded for ${operation}: ${duration.toFixed(2)}ms (threshold: ${threshold}ms)`)
    }
    
    return duration
  }

  recordMetric(operation, value) {
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, {
        count: 0,
        total: 0,
        min: Infinity,
        max: 0,
        average: 0,
        recent: []
      })
    }
    
    const metric = this.metrics.get(operation)
    metric.count++
    metric.total += value
    metric.min = Math.min(metric.min, value)
    metric.max = Math.max(metric.max, value)
    metric.average = metric.total / metric.count
    
    // Keep last 10 measurements
    metric.recent.push(value)
    if (metric.recent.length > 10) {
      metric.recent.shift()
    }
    
    this.metrics.set(operation, metric)
  }

  getMetrics(operation = null) {
    if (operation) {
      return this.metrics.get(operation) || null
    }
    
    const allMetrics = {}
    for (const [key, value] of this.metrics.entries()) {
      allMetrics[key] = { ...value }
    }
    return allMetrics
  }

  getMemoryUsage() {
    if (performance.memory) {
      return {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit,
        percentage: (performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100
      }
    }
    return null
  }

  checkMemoryThreshold() {
    const memory = this.getMemoryUsage()
    if (memory && memory.used > this.thresholds.memoryUsage) {
      console.warn(`Memory usage threshold exceeded: ${(memory.used / 1024 / 1024).toFixed(2)}MB`)
      return false
    }
    return true
  }

  generateReport() {
    const metrics = this.getMetrics()
    const memory = this.getMemoryUsage()
    
    return {
      timestamp: new Date().toISOString(),
      performance: metrics,
      memory,
      thresholds: this.thresholds,
      summary: {
        totalOperations: Object.values(metrics).reduce((sum, m) => sum + m.count, 0),
        averageFilterResponse: metrics.filterResponse?.average || 0,
        averageChartRender: metrics.chartRender?.average || 0,
        cacheHitRate: this.calculateCacheHitRate(),
        memoryEfficiency: memory ? (memory.used / memory.limit) * 100 : 0
      }
    }
  }

  calculateCacheHitRate() {
    const cacheHits = this.metrics.get('cacheHit')?.count || 0
    const cacheMisses = this.metrics.get('cacheMiss')?.count || 0
    const total = cacheHits + cacheMisses
    
    return total > 0 ? (cacheHits / total) * 100 : 0
  }

  reset() {
    this.metrics.clear()
  }

  enable() {
    this.isEnabled = true
  }

  disable() {
    this.isEnabled = false
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor()

// Helper hooks for React components
export const usePerformanceTimer = (operation) => {
  const startTimer = () => performanceMonitor.startTimer(operation)
  return { startTimer, monitor: performanceMonitor }
}

export default PerformanceMonitor 