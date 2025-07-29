/**
 * URL Filter Utilities for Developer Quality Dashboard
 * 
 * Provides safe URL parameter encoding/decoding and smart matching
 * following project conventions: functional patterns, proper imports, DRY principles
 */

import { memberConfiguration } from '../../../constants/memberConfiguration'

// Reusable performance monitoring utility (DRY principle)
const performanceMonitor = {
  log: (operation, startTime) => {
    const duration = performance.now() - startTime
    if (duration > 25) {
      console.warn(`🐌 URL operation '${operation}' took ${duration.toFixed(2)}ms (expected <25ms)`)
    } else {
  
    }
    return duration
  }
}

// Cached lookup maps initialized once (follows caching strategy)
let lookupMapsCache = null

/**
 * Initialize lookup maps using existing preprocessed data pattern
 * Follows existing caching strategy - parse once, use everywhere
 */
const initializeLookupMaps = () => {
  if (lookupMapsCache) return lookupMapsCache

  const startTime = performance.now()
  
  try {
    // Developer lookup maps using existing memberConfiguration
    const developerLookups = {
      byFullName: new Map(),
      byFirstName: new Map(),
      byLastName: new Map(),
      byUsername: new Map(),
      allDevelopers: memberConfiguration.developers || []
    }
    
    // Process developers for smart matching (single responsibility)
    memberConfiguration.developers?.forEach(dev => {
      const fullName = dev.name.toLowerCase()
      
      // Full name mapping
      developerLookups.byFullName.set(fullName, dev)
      developerLookups.byFullName.set(fullName.replace(/\s+/g, '.'), dev)
      developerLookups.byFullName.set(fullName.replace(/\s+/g, ''), dev)
      
      // Username mapping
      if (fullName.includes('@') || (fullName.includes('.') && !fullName.includes(' '))) {
        developerLookups.byUsername.set(fullName, dev)
      }
      
      // Name parts mapping
      const nameParts = fullName.split(/\s+/).filter(part => part.length > 0)
      if (nameParts.length >= 1) {
        const firstName = nameParts[0]
        if (!developerLookups.byFirstName.has(firstName)) {
          developerLookups.byFirstName.set(firstName, [])
        }
        developerLookups.byFirstName.get(firstName).push(dev)
      }
      
      if (nameParts.length >= 2) {
        const lastName = nameParts[nameParts.length - 1]
        if (!developerLookups.byLastName.has(lastName)) {
          developerLookups.byLastName.set(lastName, [])
        }
        developerLookups.byLastName.get(lastName).push(dev)
      }
    })
    
    // Project lookup maps using existing memberConfiguration
    const projectLookups = {
      byKey: new Map(),
      byName: new Map(),
      allProjects: memberConfiguration.projects || []
    }
    
    // Process projects for smart matching (single responsibility)
    memberConfiguration.projects?.forEach(project => {
      projectLookups.byKey.set(project.key.toLowerCase(), project)
      projectLookups.byName.set(project.name.toLowerCase(), project)
    })
    
    lookupMapsCache = { developerLookups, projectLookups }
    performanceMonitor.log('Lookup maps initialization', startTime)
    
    return lookupMapsCache
    
  } catch (error) {
    console.error('🚨 Lookup maps initialization failed:', error)
    // Graceful fallback
    return {
      developerLookups: { 
        byFullName: new Map(), byFirstName: new Map(), byLastName: new Map(), 
        byUsername: new Map(), allDevelopers: [] 
      },
      projectLookups: { byKey: new Map(), byName: new Map(), allProjects: [] }
    }
  }
}

/**
 * Smart developer matching with priority-based algorithm
 * Single responsibility: match one developer input to existing data
 */
const matchDeveloper = (input) => {
  if (!input || typeof input !== 'string') return null
  
  const startTime = performance.now()
  const { developerLookups } = initializeLookupMaps()
  const normalizedInput = input.toLowerCase().trim()
  
  try {
    // Priority 1: Exact full name match
    let match = developerLookups.byFullName.get(normalizedInput)
    if (match) {
      performanceMonitor.log('Developer exact match', startTime)
      return match
    }
    
    // Priority 2: Username/email match
    match = developerLookups.byUsername.get(normalizedInput)
    if (match) {
      performanceMonitor.log('Developer username match', startTime)
      return match
    }
    
    // Priority 3: First name + last name match
    const inputParts = normalizedInput.split(/\s+/)
    if (inputParts.length >= 2) {
      const firstName = inputParts[0]
      const lastName = inputParts[inputParts.length - 1]
      const firstNameMatches = developerLookups.byFirstName.get(firstName) || []
      match = firstNameMatches.find(dev => 
        dev.name.toLowerCase().split(/\s+/).pop() === lastName
      )
      if (match) {
        performanceMonitor.log('Developer first+last match', startTime)
        return match
      }
    }
    
    // Priority 4: First name only (alphabetically first)
    if (inputParts.length >= 1) {
      const firstNameMatches = developerLookups.byFirstName.get(inputParts[0]) || []
      if (firstNameMatches.length > 0) {
        match = firstNameMatches.sort((a, b) => a.name.localeCompare(b.name))[0]
        performanceMonitor.log('Developer first name match', startTime)
        return match
      }
    }
    
    // Priority 5: Last name only (alphabetically first)
    if (inputParts.length >= 1) {
      const lastName = inputParts[inputParts.length - 1]
      const lastNameMatches = developerLookups.byLastName.get(lastName) || []
      if (lastNameMatches.length > 0) {
        match = lastNameMatches.sort((a, b) => a.name.localeCompare(b.name))[0]
        performanceMonitor.log('Developer last name match', startTime)
        return match
      }
    }
    
    // Priority 6: Contains match (alphabetically first)
    const containsMatches = developerLookups.allDevelopers.filter(dev =>
      dev.name.toLowerCase().includes(normalizedInput)
    )
    if (containsMatches.length > 0) {
      match = containsMatches.sort((a, b) => a.name.localeCompare(b.name))[0]
      performanceMonitor.log('Developer contains match', startTime)
      return match
    }
    
    performanceMonitor.log('Developer no match', startTime)
    return null
    
  } catch (error) {
    console.warn('🚨 Developer matching failed:', error)
    return null
  }
}

/**
 * Smart project matching with priority-based algorithm
 * Single responsibility: match one project input to existing data
 */
const matchProject = (input) => {
  if (!input || typeof input !== 'string') return null
  
  const startTime = performance.now()
  const { projectLookups } = initializeLookupMaps()
  const normalizedInput = input.toLowerCase().trim()
  
  try {
    // Priority 1: Exact project key match
    let match = projectLookups.byKey.get(normalizedInput)
    if (match) {
      performanceMonitor.log('Project key match', startTime)
      return match
    }
    
    // Priority 2: Exact project name match
    match = projectLookups.byName.get(normalizedInput)
    if (match) {
      performanceMonitor.log('Project name match', startTime)
      return match
    }
    
    // Priority 3: Contains match (alphabetically first)
    const containsMatches = projectLookups.allProjects.filter(project =>
      project.name.toLowerCase().includes(normalizedInput) ||
      project.key.toLowerCase().includes(normalizedInput)
    )
    if (containsMatches.length > 0) {
      match = containsMatches.sort((a, b) => a.name.localeCompare(b.name))[0]
      performanceMonitor.log('Project contains match', startTime)
      return match
    }
    
    performanceMonitor.log('Project no match', startTime)
    return null
    
  } catch (error) {
    console.warn('🚨 Project matching failed:', error)
    return null
  }
}

/**
 * Smart timeframe matching
 * Single responsibility: normalize timeframe input
 */
const matchTimeframe = (input) => {
  if (!input || typeof input !== 'string') return 'month'
  
  const startTime = performance.now()
  const normalizedInput = input.toLowerCase().trim()
  const validTimeframes = ['month', 'week', 'quarter']
  
  try {
    // Exact match
    if (validTimeframes.includes(normalizedInput)) {
      performanceMonitor.log('Timeframe exact match', startTime)
      return normalizedInput
    }
    
    // Partial match
    for (const timeframe of validTimeframes) {
      if (timeframe.startsWith(normalizedInput)) {
        performanceMonitor.log('Timeframe partial match', startTime)
        return timeframe
      }
    }
    
    // Default fallback
    performanceMonitor.log('Timeframe default fallback', startTime)
    return 'month'
    
  } catch (error) {
    console.warn('🚨 Timeframe matching failed:', error)
    return 'month'
  }
}

/**
 * Smart tab matching
 * Single responsibility: normalize tab input
 */
const matchTab = (input) => {
  if (!input || typeof input !== 'string') return 'team'
  
  const startTime = performance.now()
  const normalizedInput = input.toLowerCase().trim()
  const validTabs = ['team', 'developer']
  
  try {
    // Exact match
    if (validTabs.includes(normalizedInput)) {
      performanceMonitor.log('Tab exact match', startTime)
      return normalizedInput
    }
    
    // Partial match
    for (const tab of validTabs) {
      if (tab.startsWith(normalizedInput)) {
        performanceMonitor.log('Tab partial match', startTime)
        return tab
      }
    }
    
    // Default fallback
    performanceMonitor.log('Tab default fallback', startTime)
    return 'team'
    
  } catch (error) {
    console.warn('🚨 Tab matching failed:', error)
    return 'team'
  }
}

/**
 * Encode filter object to URL search parameters
 * Single responsibility: filter object → URL params
 */
export const encodeFiltersToUrlParams = (filters, activeTab = null) => {
  try {
    const startTime = performance.now()
    const params = new URLSearchParams()
    
    // Only encode the 3 main filters as specified
    if (filters?.timeframe && filters.timeframe !== 'month') {
      params.set('timeframe', filters.timeframe)
    }
    
    if (filters?.developers?.length > 0) {
      params.set('developers', filters.developers.join(','))
    }
    
    if (filters?.projects?.length > 0) {
      params.set('projects', filters.projects.join(','))
    }
    
    // Add tab parameter if not default (team = 0)
    if (activeTab !== null && activeTab !== 0) {
      const tabName = activeTab === 1 ? 'developer' : 'team'
      params.set('tab', tabName)
    }
    
    performanceMonitor.log('URL encoding', startTime)
    return params
    
  } catch (error) {
    console.warn('🚨 URL encoding failed:', error)
    return new URLSearchParams()
  }
}

/**
 * Decode URL search parameters to filter object using smart matching
 * Single responsibility: URL params → filter object with smart matching
 */
export const decodeUrlParamsToFilters = (searchParams) => {
  try {
    const startTime = performance.now()
    const filters = {}
    let activeTab = 0 // Default to Team tab
    
    // Timeframe parsing
    const timeframeParam = searchParams.get('timeframe')
    if (timeframeParam) {
      filters.timeframe = matchTimeframe(timeframeParam)
    }
    
    // Developers parsing with smart matching
    const developersParam = searchParams.get('developers')
    if (developersParam) {
      const developerInputs = developersParam.split(',').map(d => d.trim()).filter(d => d.length > 0)
      const matchedDevelopers = []
      
      for (const input of developerInputs) {
        const match = matchDeveloper(input)
        if (match) {
          matchedDevelopers.push(match.name)
        } else {
          console.warn(`❌ Could not match developer: "${input}"`)
        }
      }
      
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
        const match = matchProject(input)
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
    
    // Tab parsing
    const tabParam = searchParams.get('tab')
    if (tabParam) {
      const matchedTab = matchTab(tabParam)
      activeTab = matchedTab === 'developer' ? 1 : 0
    }
    
    performanceMonitor.log('URL decoding', startTime)
    return { filters, activeTab }
    
  } catch (error) {
    console.warn('🚨 URL decoding failed:', error)
    return {}
  }
}

/**
 * Validate URL parameters for security and format
 * Single responsibility: URL params validation
 */
export const validateUrlParams = (searchParams) => {
  try {
    const startTime = performance.now()
    const errors = []
    const warnings = []
    
    // Security validation
    const dangerousParams = ['__proto__', 'constructor', 'prototype']
    for (const param of dangerousParams) {
      if (searchParams.has(param)) {
        errors.push(`Dangerous parameter detected: ${param}`)
      }
    }
    
    // Length validation
    for (const [key, value] of searchParams.entries()) {
      if (value.length > 1000) {
        errors.push(`Parameter ${key} too long (${value.length} chars, max 1000)`)
      }
    }
    
    // Count validation
    const developersParam = searchParams.get('developers')
    if (developersParam && developersParam.split(',').length > 50) {
      warnings.push('Too many developers specified (max 50 recommended)')
    }
    
    const projectsParam = searchParams.get('projects')
    if (projectsParam && projectsParam.split(',').length > 50) {
      warnings.push('Too many projects specified (max 50 recommended)')
    }
    
    performanceMonitor.log('URL validation', startTime)
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
    
  } catch (error) {
    console.warn('🚨 URL validation failed:', error)
    return { isValid: false, errors: ['URL validation failed'], warnings: [] }
  }
}

/**
 * Create shareable URL for current filter state
 * Single responsibility: filter state → shareable URL
 */
export const createShareableUrl = (filters, baseUrl = null) => {
  try {
    const startTime = performance.now()
    const base = baseUrl || `${window.location.origin}${window.location.pathname}`
    const params = encodeFiltersToUrlParams(filters)
    const url = params.toString() ? `${base}?${params.toString()}` : base
    
    performanceMonitor.log('URL creation', startTime)
    return url
    
  } catch (error) {
    console.warn('🚨 Shareable URL creation failed:', error)
    return window.location.href
  }
}

/**
 * Feature detection for URL APIs
 * Single responsibility: detect browser capabilities
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

// Export individual matchers for testing
export { matchDeveloper, matchProject, matchTimeframe }