/**
 * URL Filter Utilities for Developer Quality Dashboard
 * 
 * Provides safe URL parameter encoding/decoding and smart matching
 * for filter synchronization with comprehensive error handling.
 * 
 * SAFETY REQUIREMENTS:
 * - All operations must complete in <25ms
 * - Comprehensive error handling with graceful fallbacks
 * - No interference with existing filter system
 * - Support for smart matching with priority-based algorithm
 */

import { memberConfiguration } from '../../../constants/memberConfiguration'

// Performance monitoring for URL operations
const performanceLog = (operation, startTime) => {
  const endTime = performance.now()
  const duration = endTime - startTime
  
  if (duration > 25) {
    console.warn(`🐌 URL operation '${operation}' took ${duration.toFixed(2)}ms (expected <25ms)`)
  } else {
    console.log(`⚡ URL operation '${operation}' completed in ${duration.toFixed(2)}ms`)
  }
  
  return duration
}

/**
 * Smart Matching Algorithm Implementation
 * Priority-based matching with O(1) lookup maps for performance
 */
class SmartMatcher {
  constructor() {
    this.initializeLookupMaps()
  }

  /**
   * Initialize pre-built lookup maps for O(1) performance
   * Called once during construction
   */
  initializeLookupMaps() {
    try {
      const startTime = performance.now()
      
      // Developer lookup maps
      this.developerLookups = {
        byFullName: new Map(),
        byFirstName: new Map(),
        byLastName: new Map(),
        byUsername: new Map(),
        allDevelopers: []
      }
      
      // Process developers for smart matching
      memberConfiguration.developers.forEach(dev => {
        const fullName = dev.name.toLowerCase()
        this.developerLookups.allDevelopers.push(dev)
        
        // Full name mapping
        this.developerLookups.byFullName.set(fullName, dev)
        this.developerLookups.byFullName.set(fullName.replace(/\s+/g, '.'), dev) // john.doe format
        this.developerLookups.byFullName.set(fullName.replace(/\s+/g, ''), dev)   // johndoe format
        
        // Username mapping (handle email-like usernames)
        if (fullName.includes('@')) {
          this.developerLookups.byUsername.set(fullName, dev)
        }
        if (fullName.includes('.') && !fullName.includes(' ')) {
          this.developerLookups.byUsername.set(fullName, dev)
        }
        
        // First/Last name mapping
        const nameParts = fullName.split(/\s+/).filter(part => part.length > 0)
        if (nameParts.length >= 1) {
          const firstName = nameParts[0]
          if (!this.developerLookups.byFirstName.has(firstName)) {
            this.developerLookups.byFirstName.set(firstName, [])
          }
          this.developerLookups.byFirstName.get(firstName).push(dev)
        }
        
        if (nameParts.length >= 2) {
          const lastName = nameParts[nameParts.length - 1]
          if (!this.developerLookups.byLastName.has(lastName)) {
            this.developerLookups.byLastName.set(lastName, [])
          }
          this.developerLookups.byLastName.get(lastName).push(dev)
        }
      })
      
      // Project lookup maps
      this.projectLookups = {
        byKey: new Map(),
        byName: new Map(),
        allProjects: []
      }
      
      // Process projects for smart matching
      memberConfiguration.projects.forEach(project => {
        this.projectLookups.allProjects.push(project)
        
        // Key mapping (case-insensitive)
        this.projectLookups.byKey.set(project.key.toLowerCase(), project)
        
        // Name mapping (case-insensitive)
        this.projectLookups.byName.set(project.name.toLowerCase(), project)
      })
      
      performanceLog('SmartMatcher initialization', startTime)
      
    } catch (error) {
      console.error('🚨 SmartMatcher initialization failed:', error)
      // Initialize empty maps as fallback
      this.developerLookups = { byFullName: new Map(), byFirstName: new Map(), byLastName: new Map(), byUsername: new Map(), allDevelopers: [] }
      this.projectLookups = { byKey: new Map(), byName: new Map(), allProjects: [] }
    }
  }

  /**
   * Match developer name using priority-based algorithm
   * Priority: exact full name → username → first+last → first only → last only → contains
   * 
   * @param {string} input - User input to match
   * @returns {Object|null} - Matched developer object or null
   */
  matchDeveloper(input) {
    if (!input || typeof input !== 'string') return null
    
    try {
      const startTime = performance.now()
      const normalizedInput = input.toLowerCase().trim()
      
      // 1. Exact full name match (highest priority)
      let match = this.developerLookups.byFullName.get(normalizedInput)
      if (match) {
        performanceLog('Developer exact match', startTime)
        return match
      }
      
      // 2. Username/email match
      match = this.developerLookups.byUsername.get(normalizedInput)
      if (match) {
        performanceLog('Developer username match', startTime)
        return match
      }
      
      // 3. First name + last name match
      const inputParts = normalizedInput.split(/\s+/).filter(part => part.length > 0)
      if (inputParts.length >= 2) {
        const firstName = inputParts[0]
        const lastName = inputParts[inputParts.length - 1]
        
        const firstNameMatches = this.developerLookups.byFirstName.get(firstName) || []
        match = firstNameMatches.find(dev => 
          dev.name.toLowerCase().split(/\s+/).pop() === lastName
        )
        if (match) {
          performanceLog('Developer first+last match', startTime)
          return match
        }
      }
      
      // 4. First name only match (first alphabetical)
      if (inputParts.length >= 1) {
        const firstName = inputParts[0]
        const firstNameMatches = this.developerLookups.byFirstName.get(firstName) || []
        if (firstNameMatches.length > 0) {
          match = firstNameMatches.sort((a, b) => a.name.localeCompare(b.name))[0]
          performanceLog('Developer first name match', startTime)
          console.log(`📝 Partial match: "${input}" → "${match.name}" (first name match)`)
          return match
        }
      }
      
      // 5. Last name only match (first alphabetical)
      if (inputParts.length >= 1) {
        const lastName = inputParts[inputParts.length - 1]
        const lastNameMatches = this.developerLookups.byLastName.get(lastName) || []
        if (lastNameMatches.length > 0) {
          match = lastNameMatches.sort((a, b) => a.name.localeCompare(b.name))[0]
          performanceLog('Developer last name match', startTime)
          console.log(`📝 Partial match: "${input}" → "${match.name}" (last name match)`)
          return match
        }
      }
      
      // 6. Contains match (lowest priority, first alphabetical)
      const containsMatches = this.developerLookups.allDevelopers.filter(dev =>
        dev.name.toLowerCase().includes(normalizedInput)
      )
      if (containsMatches.length > 0) {
        match = containsMatches.sort((a, b) => a.name.localeCompare(b.name))[0]
        performanceLog('Developer contains match', startTime)
        console.log(`📝 Partial match: "${input}" → "${match.name}" (contains match)`)
        return match
      }
      
      performanceLog('Developer no match', startTime)
      console.log(`❌ No developer match found for: "${input}"`)
      return null
      
    } catch (error) {
      console.warn('🚨 Developer matching failed:', error)
      return null
    }
  }

  /**
   * Match project using priority-based algorithm
   * Priority: exact key → exact name → contains name
   * 
   * @param {string} input - User input to match
   * @returns {Object|null} - Matched project object or null
   */
  matchProject(input) {
    if (!input || typeof input !== 'string') return null
    
    try {
      const startTime = performance.now()
      const normalizedInput = input.toLowerCase().trim()
      
      // 1. Exact project key match (highest priority)
      let match = this.projectLookups.byKey.get(normalizedInput)
      if (match) {
        performanceLog('Project key match', startTime)
        return match
      }
      
      // 2. Exact project name match
      match = this.projectLookups.byName.get(normalizedInput)
      if (match) {
        performanceLog('Project name match', startTime)
        return match
      }
      
      // 3. Contains project name match (first alphabetical)
      const containsMatches = this.projectLookups.allProjects.filter(project =>
        project.name.toLowerCase().includes(normalizedInput) ||
        project.key.toLowerCase().includes(normalizedInput)
      )
      if (containsMatches.length > 0) {
        match = containsMatches.sort((a, b) => a.name.localeCompare(b.name))[0]
        performanceLog('Project contains match', startTime)
        console.log(`📝 Partial match: "${input}" → "${match.name}" (contains match)`)
        return match
      }
      
      performanceLog('Project no match', startTime)
      console.log(`❌ No project match found for: "${input}"`)
      return null
      
    } catch (error) {
      console.warn('🚨 Project matching failed:', error)
      return null
    }
  }

  /**
   * Match timeframe using priority-based algorithm
   * Priority: exact → case-insensitive → partial → default fallback
   * 
   * @param {string} input - User input to match
   * @returns {string} - Matched timeframe ('month', 'week', 'quarter')
   */
  matchTimeframe(input) {
    if (!input || typeof input !== 'string') return 'month'
    
    try {
      const startTime = performance.now()
      const normalizedInput = input.toLowerCase().trim()
      const validTimeframes = ['month', 'week', 'quarter']
      
      // 1. Exact match
      if (validTimeframes.includes(normalizedInput)) {
        performanceLog('Timeframe exact match', startTime)
        return normalizedInput
      }
      
      // 2. Partial match
      for (const timeframe of validTimeframes) {
        if (timeframe.startsWith(normalizedInput)) {
          performanceLog('Timeframe partial match', startTime)
          console.log(`📝 Partial match: "${input}" → "${timeframe}" (partial match)`)
          return timeframe
        }
      }
      
      // 3. Default fallback
      performanceLog('Timeframe default fallback', startTime)
      console.log(`❌ No timeframe match found for: "${input}", using default: month`)
      return 'month'
      
    } catch (error) {
      console.warn('🚨 Timeframe matching failed:', error)
      return 'month'
    }
  }
}

// Create singleton instance for performance
const smartMatcher = new SmartMatcher()

/**
 * URL Parameter Encoding/Decoding Utilities
 */

/**
 * Encode filter object to URL search parameters
 * 
 * @param {Object} filters - Filter object from Zustand store
 * @returns {URLSearchParams} - Encoded URL search parameters
 */
export const encodeFiltersToUrlParams = (filters) => {
  try {
    const startTime = performance.now()
    const params = new URLSearchParams()
    
    // Only encode the 3 main filters as specified
    if (filters.timeframe && filters.timeframe !== 'month') {
      params.set('timeframe', filters.timeframe)
    }
    
    if (filters.developers && Array.isArray(filters.developers) && filters.developers.length > 0) {
      params.set('developers', filters.developers.join(','))
    }
    
    if (filters.projects && Array.isArray(filters.projects) && filters.projects.length > 0) {
      params.set('projects', filters.projects.join(','))
    }
    
    performanceLog('URL encoding', startTime)
    return params
    
  } catch (error) {
    console.warn('🚨 URL encoding failed, returning empty params:', error)
    return new URLSearchParams()
  }
}

/**
 * Decode URL search parameters to filter object using smart matching
 * 
 * @param {URLSearchParams} searchParams - URL search parameters
 * @returns {Object} - Decoded filter object with smart-matched values
 */
export const decodeUrlParamsToFilters = (searchParams) => {
  try {
    const startTime = performance.now()
    const filters = {}
    
    // Timeframe parsing with smart matching
    const timeframeParam = searchParams.get('timeframe')
    if (timeframeParam) {
      filters.timeframe = smartMatcher.matchTimeframe(timeframeParam)
    }
    
    // Developers parsing with smart matching
    const developersParam = searchParams.get('developers')
    if (developersParam) {
      console.log('🔍 Parsing developers parameter:', developersParam)
      const developerInputs = developersParam.split(',').map(d => d.trim()).filter(d => d.length > 0)
      console.log('🔍 Split developer inputs:', developerInputs)
      const matchedDevelopers = []
      
      for (const input of developerInputs) {
        console.log(`🔍 Attempting to match developer: "${input}"`)
        const match = smartMatcher.matchDeveloper(input)
        if (match) {
          console.log(`✅ Successfully matched: "${input}" → "${match.name}"`)
          matchedDevelopers.push(match.name)
        } else {
          console.warn(`❌ Could not match developer: "${input}"`)
        }
      }
      
      console.log('🔍 Final matched developers:', matchedDevelopers)
      if (matchedDevelopers.length > 0) {
        filters.developers = matchedDevelopers
      }
    }
    
    // Projects parsing with smart matching
    const projectsParam = searchParams.get('projects')
    if (projectsParam) {
      const projectInputs = projectsParam.split(',').map(p => p.trim()).filter(p => p.length > 0)
      const matchedProjects = []
      
      for (const input of projectInputs) {
        const match = smartMatcher.matchProject(input)
        if (match) {
          matchedProjects.push(match.name)
        } else {
          console.warn(`❌ Could not match project: "${input}"`)
        }
      }
      
      if (matchedProjects.length > 0) {
        filters.projects = matchedProjects
      }
    }
    
    performanceLog('URL decoding', startTime)
    return filters
    
  } catch (error) {
    console.warn('🚨 URL decoding failed, returning empty filters:', error)
    return {}
  }
}

/**
 * Validate that URL parameters are safe and won't break the system
 * 
 * @param {URLSearchParams} searchParams - URL search parameters to validate
 * @returns {Object} - Validation result with isValid and errors
 */
export const validateUrlParams = (searchParams) => {
  try {
    const startTime = performance.now()
    const errors = []
    const warnings = []
    
    // Check for dangerous parameters
    const dangerousParams = ['__proto__', 'constructor', 'prototype']
    for (const param of dangerousParams) {
      if (searchParams.has(param)) {
        errors.push(`Dangerous parameter detected: ${param}`)
      }
    }
    
    // Check parameter lengths to prevent URL length issues
    for (const [key, value] of searchParams.entries()) {
      if (value.length > 1000) {
        errors.push(`Parameter ${key} is too long (${value.length} chars, max 1000)`)
      }
    }
    
    // Check for excessive comma-separated values
    const developersParam = searchParams.get('developers')
    if (developersParam && developersParam.split(',').length > 50) {
      warnings.push('Too many developers specified (max 50 recommended)')
    }
    
    const projectsParam = searchParams.get('projects')
    if (projectsParam && projectsParam.split(',').length > 50) {
      warnings.push('Too many projects specified (max 50 recommended)')
    }
    
    performanceLog('URL validation', startTime)
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
    
  } catch (error) {
    console.warn('🚨 URL validation failed:', error)
    return {
      isValid: false,
      errors: ['URL validation failed'],
      warnings: []
    }
  }
}

/**
 * Create a shareable URL for the current filter state
 * 
 * @param {Object} filters - Current filter state
 * @param {string} baseUrl - Base URL (optional, defaults to current location)
 * @returns {string} - Complete shareable URL
 */
export const createShareableUrl = (filters, baseUrl = null) => {
  try {
    const startTime = performance.now()
    
    const base = baseUrl || `${window.location.origin}${window.location.pathname}`
    const params = encodeFiltersToUrlParams(filters)
    
    const url = params.toString() ? `${base}?${params.toString()}` : base
    
    performanceLog('URL creation', startTime)
    return url
    
  } catch (error) {
    console.warn('🚨 Shareable URL creation failed:', error)
    return window.location.href
  }
}

/**
 * Feature detection for URL APIs
 * 
 * @returns {Object} - Feature support information
 */
export const detectUrlFeatures = () => {
  try {
    return {
      URLSearchParams: typeof URLSearchParams !== 'undefined',
      URL: typeof URL !== 'undefined',
      pushState: !!(window.history && window.history.pushState),
      replaceState: !!(window.history && window.history.replaceState)
    }
  } catch (error) {
    console.warn('🚨 URL feature detection failed:', error)
    return {
      URLSearchParams: false,
      URL: false,
      pushState: false,
      replaceState: false
    }
  }
}

// Export smart matcher for testing
export { smartMatcher }