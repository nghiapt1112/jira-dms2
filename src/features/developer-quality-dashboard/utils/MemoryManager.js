import { performanceMonitor } from './PerformanceMonitor'

class MemoryManager {
  constructor() {
    this.memoryThresholds = {
      warning: 80 * 1024 * 1024, // 80MB
      critical: 100 * 1024 * 1024, // 100MB
      maximum: 120 * 1024 * 1024 // 120MB
    }
    
    this.cleanupCallbacks = new Set()
    this.monitoringInterval = null
    this.isMonitoring = false
    this.lastCleanup = 0
    this.cleanupCooldown = 30000 // 30 seconds
  }

  // Start memory monitoring
  startMonitoring() {
    if (this.isMonitoring) return
    
    this.isMonitoring = true
    this.monitoringInterval = setInterval(() => {
      this.checkMemoryUsage()
    }, 10000) // Check every 10 seconds
    
    if (process.env.NODE_ENV === 'development') {
  
    }
  }

  // Stop memory monitoring
  stopMonitoring() {
    if (!this.isMonitoring) return
    
    this.isMonitoring = false
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
    }
    
    if (process.env.NODE_ENV === 'development') {
  
    }
  }

  // Check current memory usage
  checkMemoryUsage() {
    const memory = performanceMonitor.getMemoryUsage()
    if (!memory) return
    
    const usedMB = memory.used / 1024 / 1024
    const percentage = memory.percentage
    
    // Log memory status
    performanceMonitor.recordMetric('memoryUsage', memory.used)
    
    // Check thresholds
    if (memory.used > this.memoryThresholds.critical) {
      console.error(`Critical memory usage: ${usedMB.toFixed(2)}MB (${percentage.toFixed(1)}%)`)
      this.performEmergencyCleanup()
    } else if (memory.used > this.memoryThresholds.warning) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`High memory usage: ${usedMB.toFixed(2)}MB (${percentage.toFixed(1)}%)`)
      }
      this.performStandardCleanup()
    }
  }

  // Register cleanup callback
  registerCleanupCallback(callback, priority = 'normal') {
    if (typeof callback !== 'function') {
      throw new Error('Cleanup callback must be a function')
    }
    
    this.cleanupCallbacks.add({
      callback,
      priority,
      id: Date.now() + Math.random()
    })
  }

  // Unregister cleanup callback
  unregisterCleanupCallback(callbackId) {
    for (const item of this.cleanupCallbacks) {
      if (item.id === callbackId) {
        this.cleanupCallbacks.delete(item)
        break
      }
    }
  }

  // Perform standard cleanup
  performStandardCleanup() {
    const now = Date.now()
    if (now - this.lastCleanup < this.cleanupCooldown) {
      return // Too soon since last cleanup
    }
    
    this.lastCleanup = now
    const timer = performanceMonitor.startTimer('memoryCleanup')
    
    try {
      if (process.env.NODE_ENV === 'development') {
    
      }
      
      // Execute normal priority cleanup callbacks
      this.executeCleanupCallbacks('normal')
      
      // Clear any cached data older than 5 minutes
      this.clearExpiredCaches()
      
      // Suggest garbage collection
      this.triggerGarbageCollection()
      
      timer?.end()
      if (process.env.NODE_ENV === 'development') {
    
      }
    } catch (error) {
      timer?.end()
      console.error('Standard cleanup failed:', error)
    }
  }

  // Perform emergency cleanup
  performEmergencyCleanup() {
    const timer = performanceMonitor.startTimer('emergencyCleanup')
    
    try {
      if (process.env.NODE_ENV === 'development') {
    
      }
      
      // Execute all cleanup callbacks, starting with high priority
      this.executeCleanupCallbacks('high')
      this.executeCleanupCallbacks('normal')
      this.executeCleanupCallbacks('low')
      
      // Clear all non-essential caches
      this.clearAllCaches()
      
      // Force garbage collection
      this.triggerGarbageCollection(true)
      
      timer?.end()
      if (process.env.NODE_ENV === 'development') {
    
      }
    } catch (error) {
      timer?.end()
      console.error('Emergency cleanup failed:', error)
    }
  }

  // Execute cleanup callbacks by priority
  executeCleanupCallbacks(priority) {
    const callbacks = Array.from(this.cleanupCallbacks)
      .filter(item => item.priority === priority)
    
    for (const item of callbacks) {
      try {
        item.callback()
      } catch (error) {
        console.error(`Cleanup callback failed (${priority}):`, error)
      }
    }
  }

  // Clear expired caches
  clearExpiredCaches() {
    // This would integrate with cache services to clear old data
    const event = new CustomEvent('memoryCleanup', {
      detail: { type: 'clearExpired', maxAge: 5 * 60 * 1000 }
    })
    window.dispatchEvent(event)
  }

  // Clear all caches
  clearAllCaches() {
    // This would integrate with cache services to clear all data
    const event = new CustomEvent('memoryCleanup', {
      detail: { type: 'clearAll' }
    })
    window.dispatchEvent(event)
  }

  // Trigger garbage collection
  triggerGarbageCollection(force = false) {
    if (global.gc) {
      global.gc()
      if (process.env.NODE_ENV === 'development') {
    
      }
    } else if (force) {
      // Alternative approaches for browsers
      this.createMemoryPressure()
    }
  }

  // Create memory pressure to encourage GC
  createMemoryPressure() {
    try {
      // Create and immediately discard large objects to trigger GC
      const pressure = []
      for (let i = 0; i < 10; i++) {
        pressure.push(new Array(100000).fill(null))
      }
      pressure.length = 0 // Clear the array
    } catch (error) {
      // Ignore errors, this is just a hint to the GC
    }
  }

  // Get memory statistics
  getMemoryStats() {
    const memory = performanceMonitor.getMemoryUsage()
    const metrics = performanceMonitor.getMetrics('memoryUsage')
    
    return {
      current: memory,
      thresholds: this.memoryThresholds,
      metrics,
      monitoring: this.isMonitoring,
      cleanupCallbacks: this.cleanupCallbacks.size,
      lastCleanup: this.lastCleanup
    }
  }

  // Optimize data structure for memory efficiency
  optimizeDataStructure(data) {
    if (!data || typeof data !== 'object') return data
    
    const timer = performanceMonitor.startTimer('dataOptimization')
    
    try {
      // Convert large arrays to more memory-efficient structures
      const optimized = this.deepOptimize(data)
      
      timer?.end()
      return optimized
    } catch (error) {
      timer?.end()
      console.error('Data optimization failed:', error)
      return data
    }
  }

  // Deep optimization of data structures
  deepOptimize(obj) {
    if (Array.isArray(obj)) {
      // For large arrays, consider using typed arrays or compression
      if (obj.length > 1000) {
        return this.optimizeArray(obj)
      }
      return obj.map(item => this.deepOptimize(item))
    }
    
    if (obj && typeof obj === 'object') {
      const optimized = {}
      for (const [key, value] of Object.entries(obj)) {
        // Skip null/undefined values to save memory
        if (value != null) {
          optimized[key] = this.deepOptimize(value)
        }
      }
      return optimized
    }
    
    return obj
  }

  // Optimize large arrays
  optimizeArray(arr) {
    // For numeric arrays, consider typed arrays
    if (arr.every(item => typeof item === 'number')) {
      return new Float32Array(arr)
    }
    
    // For large object arrays, remove redundant properties
    if (arr.length > 0 && typeof arr[0] === 'object') {
      return arr.map(item => this.removeRedundantProperties(item))
    }
    
    return arr
  }

  // Remove redundant properties from objects
  removeRedundantProperties(obj) {
    if (!obj || typeof obj !== 'object') return obj
    
    const cleaned = {}
    for (const [key, value] of Object.entries(obj)) {
      // Skip empty strings, null, undefined
      if (value !== '' && value != null) {
        cleaned[key] = value
      }
    }
    return cleaned
  }

  // Clean up resources
  cleanup() {
    this.stopMonitoring()
    this.cleanupCallbacks.clear()
    this.lastCleanup = 0
  }
}

// Singleton instance
export const memoryManager = new MemoryManager()

// Hook for React components
export const useMemoryManager = () => {
  const registerCleanup = (callback, priority = 'normal') => {
    const id = memoryManager.registerCleanupCallback(callback, priority)
    return () => memoryManager.unregisterCleanupCallback(id)
  }
  
  return {
    registerCleanup,
    getStats: () => memoryManager.getMemoryStats(),
    optimize: (data) => memoryManager.optimizeDataStructure(data)
  }
}

export default MemoryManager 