/**
 * Centralized Severity Parser Utility
 * Single source of truth for parsing bug severity from JIRA issues
 * Consolidates logic from developerQualityService.js, ProjectHealthTable.jsx, and EffortEffectivenessChart.jsx
 * Following .cursorrules conventions with comprehensive error handling and performance optimization
 */

import { getSeverityConfig } from '../../constants/memberConfiguration.js'
import { SEVERITY_LEVELS, isValidSeverity } from '../constants/severityConstants.js'

/**
 * Parse severity from a JIRA issue using configurable project-specific logic
 * @param {Object} issue - JIRA issue object
 * @param {string|null} projectKey - Project key for project-specific configuration (optional)
 * @returns {Object} - Parsed severity information
 */
export const parseSeverity = (issue, projectKey = null) => {
  // Input validation
  if (!issue || !issue.fields) {
    return {
      severity: SEVERITY_LEVELS.UNKNOWN,
      rawValue: null,
      source: 'invalid_input',
      confidence: 'low',
      projectKey,
      fallbackUsed: false
    }
  }

  // Get project-specific or default severity configuration
  let severityConfig
  try {
    severityConfig = getSeverityConfig(projectKey)
  } catch (error) {
    return {
      severity: SEVERITY_LEVELS.UNKNOWN,
      rawValue: null,
      source: 'error',
      confidence: 'low',
      projectKey,
      fallbackUsed: false,
      error: error.message
    }
  }
  const { severityField, usePriorityFallback, severityMapping } = severityConfig

  let severityValue = null
  let source = 'none'
  let fallbackUsed = false

  try {
    // Step 1: Try to get severity from configured custom field
    if (severityField && issue.fields[severityField]) {
      const customFieldValue = issue.fields[severityField]
      
      // Handle both object and string values
      if (typeof customFieldValue === 'object' && customFieldValue !== null) {
        severityValue = customFieldValue.value || customFieldValue.name || null
      } else if (typeof customFieldValue === 'string') {
        severityValue = customFieldValue
      }
      
      if (severityValue) {
        source = 'custom_field'
      }
    }

    // Step 2: Fallback to priority field if configured and custom field is empty
    if (!severityValue && usePriorityFallback && issue.fields.priority?.name) {
      severityValue = issue.fields.priority.name
      source = 'priority_fallback'
      fallbackUsed = true
    }

    // Step 3: Map the severity value to standardized levels
    let mappedSeverity = SEVERITY_LEVELS.UNKNOWN
    let confidence = 'low'

    if (severityValue && severityMapping[severityValue]) {
      mappedSeverity = severityMapping[severityValue]
      confidence = source === 'custom_field' ? 'high' : 'medium'
    } else if (severityValue) {
      // Try case-insensitive matching as fallback
      const lowerValue = severityValue.toLowerCase()
      const matchingKey = Object.keys(severityMapping).find(key => 
        key.toLowerCase() === lowerValue
      )
      
      if (matchingKey) {
        mappedSeverity = severityMapping[matchingKey]
        confidence = 'medium'
      }
    }

    // Validate the mapped severity
    if (!isValidSeverity(mappedSeverity)) {
      mappedSeverity = SEVERITY_LEVELS.UNKNOWN
      confidence = 'low'
    }

    return {
      severity: mappedSeverity,
      rawValue: severityValue,
      source,
      confidence,
      projectKey,
      fallbackUsed,
      // Additional metadata for debugging
      customField: severityField,
      customFieldValue: issue.fields[severityField],
      priorityValue: issue.fields.priority?.name,
      mappingUsed: severityValue ? severityMapping[severityValue] : null
    }

  } catch (error) {
    // Error handling - log but don't crash
    console.warn(`Severity parsing failed for issue ${issue.key || 'unknown'}:`, error)
    
    return {
      severity: SEVERITY_LEVELS.UNKNOWN,
      rawValue: null,
      source: 'error',
      confidence: 'low',
      projectKey,
      fallbackUsed: false,
      error: error.message
    }
  }
}

/**
 * Parse severity from multiple issues efficiently
 * @param {Array} issues - Array of JIRA issue objects
 * @param {string|null} projectKey - Project key for project-specific configuration (optional)
 * @returns {Array} - Array of parsed severity information objects
 */
export const parseSeverityBatch = (issues, projectKey = null) => {
  if (!Array.isArray(issues)) {
    return []
  }

  // Get configuration once for all issues (performance optimization)
  const severityConfig = getSeverityConfig(projectKey)
  
  return issues.map(issue => parseSeverityWithConfig(issue, severityConfig, projectKey))
}

/**
 * Internal function to parse severity with pre-loaded configuration
 * Used by parseSeverityBatch for performance optimization
 * @param {Object} issue - JIRA issue object
 * @param {Object} severityConfig - Pre-loaded severity configuration
 * @param {string|null} projectKey - Project key
 * @returns {Object} - Parsed severity information
 */
const parseSeverityWithConfig = (issue, severityConfig, projectKey = null) => {
  if (!issue || !issue.fields) {
    return {
      severity: SEVERITY_LEVELS.UNKNOWN,
      rawValue: null,
      source: 'invalid_input',
      confidence: 'low',
      projectKey,
      fallbackUsed: false
    }
  }

  const { severityField, usePriorityFallback, severityMapping } = severityConfig

  let severityValue = null
  let source = 'none'
  let fallbackUsed = false

  try {
    // Try custom field first
    if (severityField && issue.fields[severityField]) {
      const customFieldValue = issue.fields[severityField]
      
      if (typeof customFieldValue === 'object' && customFieldValue !== null) {
        severityValue = customFieldValue.value || customFieldValue.name || null
      } else if (typeof customFieldValue === 'string') {
        severityValue = customFieldValue
      }
      
      if (severityValue) {
        source = 'custom_field'
      }
    }

    // Fallback to priority
    if (!severityValue && usePriorityFallback && issue.fields.priority?.name) {
      severityValue = issue.fields.priority.name
      source = 'priority_fallback'
      fallbackUsed = true
    }

    // Map to standardized levels
    let mappedSeverity = SEVERITY_LEVELS.UNKNOWN
    let confidence = 'low'

    if (severityValue && severityMapping[severityValue]) {
      mappedSeverity = severityMapping[severityValue]
      confidence = source === 'custom_field' ? 'high' : 'medium'
    } else if (severityValue) {
      // Case-insensitive fallback
      const lowerValue = severityValue.toLowerCase()
      const matchingKey = Object.keys(severityMapping).find(key => 
        key.toLowerCase() === lowerValue
      )
      
      if (matchingKey) {
        mappedSeverity = severityMapping[matchingKey]
        confidence = 'medium'
      }
    }

    // Validate mapped severity
    if (!isValidSeverity(mappedSeverity)) {
      mappedSeverity = SEVERITY_LEVELS.UNKNOWN
      confidence = 'low'
    }

    return {
      severity: mappedSeverity,
      rawValue: severityValue,
      source,
      confidence,
      projectKey,
      fallbackUsed
    }

  } catch (error) {
    console.warn(`Batch severity parsing failed for issue ${issue.key || 'unknown'}:`, error)
    
    return {
      severity: SEVERITY_LEVELS.UNKNOWN,
      rawValue: null,
      source: 'error',
      confidence: 'low',
      projectKey,
      fallbackUsed: false,
      error: error.message
    }
  }
}

/**
 * Get parsing statistics for a set of issues
 * Useful for monitoring and debugging severity parsing effectiveness
 * @param {Array} issues - Array of JIRA issue objects
 * @param {string|null} projectKey - Project key for project-specific configuration (optional)
 * @returns {Object} - Parsing statistics
 */
export const getSeverityParsingStats = (issues, projectKey = null) => {
  if (!Array.isArray(issues) || issues.length === 0) {
    return {
      totalIssues: 0,
      successfulParses: 0,
      fallbackUsed: 0,
      unknownSeverities: 0,
      errors: 0,
      successRate: 0,
      fallbackRate: 0,
      sourceBreakdown: {},
      confidenceBreakdown: {}
    }
  }

  const parseResults = parseSeverityBatch(issues, projectKey)
  
  const stats = parseResults.reduce((acc, result) => {
    acc.totalIssues += 1
    
    if (result.severity !== SEVERITY_LEVELS.UNKNOWN) {
      acc.successfulParses += 1
    } else {
      acc.unknownSeverities += 1
    }
    
    if (result.fallbackUsed) {
      acc.fallbackUsed += 1
    }
    
    if (result.error) {
      acc.errors += 1
    }
    
    // Track source breakdown
    acc.sourceBreakdown[result.source] = (acc.sourceBreakdown[result.source] || 0) + 1
    
    // Track confidence breakdown
    acc.confidenceBreakdown[result.confidence] = (acc.confidenceBreakdown[result.confidence] || 0) + 1
    
    return acc
  }, {
    totalIssues: 0,
    successfulParses: 0,
    fallbackUsed: 0,
    unknownSeverities: 0,
    errors: 0,
    sourceBreakdown: {},
    confidenceBreakdown: {}
  })

  // Calculate rates
  stats.successRate = stats.totalIssues > 0 ? (stats.successfulParses / stats.totalIssues) * 100 : 0
  stats.fallbackRate = stats.totalIssues > 0 ? (stats.fallbackUsed / stats.totalIssues) * 100 : 0

  return stats
}

/**
 * Validate severity parsing configuration for a project
 * @param {string|null} projectKey - Project key to validate (optional)
 * @returns {Object} - Validation results
 */
export const validateSeverityConfig = (projectKey = null) => {
  try {
    const config = getSeverityConfig(projectKey)
    const issues = []
    
    // Check required fields
    if (!config.severityField && !config.usePriorityFallback) {
      issues.push('No severity field configured and priority fallback is disabled')
    }
    
    // Check severity mapping
    if (!config.severityMapping || Object.keys(config.severityMapping).length === 0) {
      issues.push('No severity mapping configured')
    }
    
    // Check if mapping values are valid severity levels
    if (config.severityMapping) {
      Object.entries(config.severityMapping).forEach(([key, value]) => {
        if (!isValidSeverity(value)) {
          issues.push(`Invalid severity level "${value}" mapped from "${key}"`)
        }
      })
    }
    
    return {
      isValid: issues.length === 0,
      issues,
      config
    }
    
  } catch (error) {
    return {
      isValid: false,
      issues: [`Configuration validation failed: ${error.message}`],
      config: null
    }
  }
} 