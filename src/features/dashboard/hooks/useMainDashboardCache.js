import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { transformIssuesForProjectOverview, getProjectMetrics } from '../services/transformIssuesForProjectOverview'

const CACHE_KEY_PREFIX = 'main_dashboard_cache'
const CACHE_EXPIRY_HOURS = 6
const PERFORMANCE_TARGET_MS = 10

export const useMainDashboardCache = (selectedProjects = []) => {
  const [cache, setCache] = useState(new Map())
  const cacheRef = useRef(new Map())
  const [cacheStats, setCacheStats] = useState({
    hits: 0,
    misses: 0,
    totalRequests: 0,
    avgResponseTime: 0,
    lastClearTime: null,
    cacheSize: 0
  })
  const [isProcessing, setIsProcessing] = useState(false)
  const [lastProcessingTime, setLastProcessingTime] = useState(null)
  
  // Keep ref in sync with state
  useEffect(() => {
    cacheRef.current = cache
  }, [cache])

  const cacheKey = useMemo(() => {
    const projectsKey = selectedProjects.length > 0 
      ? selectedProjects.sort().join(',') 
      : 'all_projects'
    return `${CACHE_KEY_PREFIX}_${projectsKey}`
  }, [selectedProjects])

  const updateCacheStats = useCallback((isHit, responseTime) => {
    setCacheStats(prev => ({
      ...prev,
      hits: prev.hits + (isHit ? 1 : 0),
      misses: prev.misses + (isHit ? 0 : 1),
      totalRequests: prev.totalRequests + 1,
      avgResponseTime: prev.totalRequests === 0 
        ? responseTime 
        : (prev.avgResponseTime * prev.totalRequests + responseTime) / (prev.totalRequests + 1),
      cacheSize: cache.size
    }))
  }, [cache.size])

  const isCacheValid = useCallback((cacheEntry) => {
    if (!cacheEntry || !cacheEntry.timestamp) return false
    
    const now = Date.now()
    const expiryTime = CACHE_EXPIRY_HOURS * 60 * 60 * 1000
    
    return (now - cacheEntry.timestamp) < expiryTime
  }, [])

  const generateCacheMetadata = useCallback((data, processingTime) => ({
    timestamp: Date.now(),
    cacheKey,
    projectCount: selectedProjects.length,
    selectedProjects: [...selectedProjects],
    dataSize: JSON.stringify(data).length,
    processingTime,
    expiresAt: Date.now() + (CACHE_EXPIRY_HOURS * 60 * 60 * 1000)
  }), [cacheKey, selectedProjects])

  const processIssuesWithCache = useCallback(async (issues) => {
    const startTime = performance.now()
    
    // Use ref to access current cache without causing dependency cycles
    const cachedEntry = cacheRef.current.get(cacheKey)
    
    if (cachedEntry && isCacheValid(cachedEntry)) {
      const responseTime = performance.now() - startTime
      updateCacheStats(true, responseTime)
      
      return {
        data: cachedEntry.data,
        metadata: cachedEntry.metadata,
        fromCache: true,
        responseTime
      }
    }

    setIsProcessing(true)
    
    try {
      const transformedProjects = transformIssuesForProjectOverview(issues)
      const projectMetrics = getProjectMetrics(transformedProjects)
      
      const data = {
        projects: transformedProjects,
        metrics: projectMetrics,
        issueCount: issues.length,
        processedAt: new Date().toISOString()
      }
      
      const processingTime = performance.now() - startTime
      const metadata = generateCacheMetadata(data, processingTime)
      
      const cacheEntry = {
        data,
        metadata,
        timestamp: Date.now()
      }
      
      setCache(prev => new Map(prev).set(cacheKey, cacheEntry))
      setLastProcessingTime(processingTime)
      
      updateCacheStats(false, processingTime)
      
      return {
        data,
        metadata,
        fromCache: false,
        responseTime: processingTime
      }
      
    } finally {
      setIsProcessing(false)
    }
  }, [cacheKey, isCacheValid, updateCacheStats, generateCacheMetadata])

  const clearCache = useCallback((specificKey = null) => {
    if (specificKey) {
      setCache(prev => {
        const newCache = new Map(prev)
        newCache.delete(specificKey)
        return newCache
      })
    } else {
      setCache(new Map())
      setCacheStats(prev => ({
        ...prev,
        lastClearTime: Date.now(),
        cacheSize: 0
      }))
    }
  }, [])

  const getCacheStatus = useCallback(() => {
    const cachedEntry = cacheRef.current.get(cacheKey)
    
    if (!cachedEntry) {
      return {
        status: 'empty',
        hasData: false,
        isValid: false,
        age: 0,
        expiresIn: 0
      }
    }
    
    const isValid = isCacheValid(cachedEntry)
    const age = Date.now() - cachedEntry.timestamp
    const expiresIn = cachedEntry.metadata.expiresAt - Date.now()
    
    return {
      status: isValid ? 'valid' : 'expired',
      hasData: true,
      isValid,
      age,
      expiresIn,
      metadata: cachedEntry.metadata
    }
  }, [cacheKey, isCacheValid])

  const preloadCache = useCallback(async (issues, projectSets = []) => {
    const preloadPromises = projectSets.map(async (projects) => {
      const key = projects.length > 0 
        ? `${CACHE_KEY_PREFIX}_${projects.sort().join(',')}`
        : `${CACHE_KEY_PREFIX}_all_projects`
      
      if (!cacheRef.current.has(key)) {
        const filteredIssues = projects.length > 0
          ? issues.filter(issue => {
              const projectKey = issue.displayFields?.projectKey || issue.fields?.project?.key
              return projects.includes(projectKey)
            })
          : issues
        
        const transformedProjects = transformIssuesForProjectOverview(filteredIssues)
        const projectMetrics = getProjectMetrics(transformedProjects)
        
        const data = {
          projects: transformedProjects,
          metrics: projectMetrics,
          issueCount: filteredIssues.length,
          processedAt: new Date().toISOString()
        }
        
        const metadata = generateCacheMetadata(data, 0)
        
        setCache(prev => new Map(prev).set(key, {
          data,
          metadata,
          timestamp: Date.now()
        }))
      }
    })
    
    await Promise.all(preloadPromises)
  }, [generateCacheMetadata])

  const getPerformanceMetrics = useCallback(() => {
    const hitRate = cacheStats.totalRequests > 0 
      ? (cacheStats.hits / cacheStats.totalRequests) * 100 
      : 0
      
    const isPerformant = cacheStats.avgResponseTime <= PERFORMANCE_TARGET_MS
    
    return {
      ...cacheStats,
      hitRate: parseFloat(hitRate.toFixed(2)),
      isPerformant,
      targetResponseTime: PERFORMANCE_TARGET_MS,
      lastProcessingTime,
      cacheKeys: Array.from(cacheRef.current.keys())
    }
  }, [cacheStats, lastProcessingTime])

  const invalidateCacheForProjects = useCallback((projectKeys) => {
    const keysToRemove = Array.from(cacheRef.current.keys()).filter(key => {
      return projectKeys.some(projectKey => key.includes(projectKey))
    })
    
    keysToRemove.forEach(key => {
      setCache(prev => {
        const newCache = new Map(prev)
        newCache.delete(key)
        return newCache
      })
    })
  }, [])

  useEffect(() => {
    setCacheStats(prev => ({
      ...prev,
      cacheSize: cache.size
    }))
  }, [cache.size])

  const cleanupExpiredEntries = useCallback(() => {
    const now = Date.now()
    const expiredKeys = []
    
    cacheRef.current.forEach((entry, key) => {
      if (!isCacheValid(entry)) {
        expiredKeys.push(key)
      }
    })
    
    if (expiredKeys.length > 0) {
      setCache(prev => {
        const newCache = new Map(prev)
        expiredKeys.forEach(key => newCache.delete(key))
        return newCache
      })
    }
  }, [isCacheValid])

  useEffect(() => {
    const interval = setInterval(cleanupExpiredEntries, 30 * 60 * 1000) // Every 30 minutes
    return () => clearInterval(interval)
  }, [cleanupExpiredEntries])

  return {
    processIssuesWithCache,
    clearCache,
    getCacheStatus,
    preloadCache,
    invalidateCacheForProjects,
    
    cacheKey,
    isProcessing,
    
    performanceMetrics: getPerformanceMetrics(),
    cacheStatus: getCacheStatus()
  }
}