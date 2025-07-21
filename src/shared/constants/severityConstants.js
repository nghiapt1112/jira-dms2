/**
 * Centralized Severity Constants
 * Single source of truth for severity levels, UI mappings, and weight configurations
 * Following .cursorrules conventions for consistent severity handling across all components
 */

/**
 * Standard severity levels used throughout the application
 * These match the memberConfiguration.js severity levels exactly
 */
export const SEVERITY_LEVELS = {
  CRITICAL: 'Critical',
  MAJOR: 'Major',
  MINOR: 'Minor', 
  LOW: 'Low',
  COSMETIC: 'Cosmetic',
  UNKNOWN: 'Unknown'
}

/**
 * Array of severity levels in priority order (highest to lowest)
 */
export const SEVERITY_LEVELS_ARRAY = [
  SEVERITY_LEVELS.CRITICAL,
  SEVERITY_LEVELS.MAJOR,
  SEVERITY_LEVELS.MINOR,
  SEVERITY_LEVELS.LOW,
  SEVERITY_LEVELS.COSMETIC,
  SEVERITY_LEVELS.UNKNOWN
]

/**
 * Default severity weights for weighted bug rate calculations
 * Higher weights indicate more severe impact on quality metrics
 */
export const DEFAULT_SEVERITY_WEIGHTS = {
  [SEVERITY_LEVELS.CRITICAL]: 1.0,
  [SEVERITY_LEVELS.MAJOR]: 0.7,
  [SEVERITY_LEVELS.MINOR]: 0.5,
  [SEVERITY_LEVELS.LOW]: 0.3,
  [SEVERITY_LEVELS.COSMETIC]: 0.1,
  [SEVERITY_LEVELS.UNKNOWN]: 0.2
}

/**
 * UI color mappings for severity levels
 * Maps severity levels to MUI theme color names
 */
export const SEVERITY_UI_MAPPING = {
  [SEVERITY_LEVELS.CRITICAL]: { 
    color: 'error', 
    weight: DEFAULT_SEVERITY_WEIGHTS[SEVERITY_LEVELS.CRITICAL],
    priority: 1,
    description: 'Critical severity requiring immediate attention'
  },
  [SEVERITY_LEVELS.MAJOR]: { 
    color: 'warning', 
    weight: DEFAULT_SEVERITY_WEIGHTS[SEVERITY_LEVELS.MAJOR],
    priority: 2,
    description: 'Major severity with significant impact'
  },
  [SEVERITY_LEVELS.MINOR]: { 
    color: 'info', 
    weight: DEFAULT_SEVERITY_WEIGHTS[SEVERITY_LEVELS.MINOR],
    priority: 3,
    description: 'Minor severity with moderate impact'
  },
  [SEVERITY_LEVELS.LOW]: { 
    color: 'success', 
    weight: DEFAULT_SEVERITY_WEIGHTS[SEVERITY_LEVELS.LOW],
    priority: 4,
    description: 'Low severity with minimal impact'
  },
  [SEVERITY_LEVELS.COSMETIC]: { 
    color: 'default', 
    weight: DEFAULT_SEVERITY_WEIGHTS[SEVERITY_LEVELS.COSMETIC],
    priority: 5,
    description: 'Cosmetic issues with no functional impact'
  },
  [SEVERITY_LEVELS.UNKNOWN]: { 
    color: 'default', 
    weight: DEFAULT_SEVERITY_WEIGHTS[SEVERITY_LEVELS.UNKNOWN],
    priority: 6,
    description: 'Unknown or unmapped severity level'
  }
}

/**
 * Get MUI color for a severity level
 * @param {string} severity - The severity level
 * @returns {string} - MUI theme color name
 */
export const getSeverityColor = (severity) => {
  const mapping = SEVERITY_UI_MAPPING[severity]
  return mapping ? mapping.color : SEVERITY_UI_MAPPING[SEVERITY_LEVELS.UNKNOWN].color
}

/**
 * Get weight for a severity level
 * @param {string} severity - The severity level
 * @returns {number} - Weight value between 0 and 1
 */
export const getSeverityWeight = (severity) => {
  const mapping = SEVERITY_UI_MAPPING[severity]
  return mapping ? mapping.weight : SEVERITY_UI_MAPPING[SEVERITY_LEVELS.UNKNOWN].weight
}

/**
 * Get priority order for a severity level (1 = highest priority)
 * @param {string} severity - The severity level
 * @returns {number} - Priority order
 */
export const getSeverityPriority = (severity) => {
  const mapping = SEVERITY_UI_MAPPING[severity]
  return mapping ? mapping.priority : SEVERITY_UI_MAPPING[SEVERITY_LEVELS.UNKNOWN].priority
}

/**
 * Get description for a severity level
 * @param {string} severity - The severity level
 * @returns {string} - Human-readable description
 */
export const getSeverityDescription = (severity) => {
  const mapping = SEVERITY_UI_MAPPING[severity]
  return mapping ? mapping.description : SEVERITY_UI_MAPPING[SEVERITY_LEVELS.UNKNOWN].description
}

/**
 * Validate if a severity level is valid
 * @param {string} severity - The severity level to validate
 * @returns {boolean} - True if valid severity level
 */
export const isValidSeverity = (severity) => {
  return SEVERITY_LEVELS_ARRAY.includes(severity)
}

/**
 * Initialize severity breakdown object with zero counts
 * @returns {Object} - Severity breakdown with all levels set to 0
 */
export const initializeSeverityBreakdown = () => {
  return SEVERITY_LEVELS_ARRAY.reduce((breakdown, severity) => {
    breakdown[severity] = 0
    return breakdown
  }, {})
}

/**
 * Sort severity breakdown by priority (highest severity first)
 * @param {Object} severityBreakdown - Object with severity levels as keys and counts as values
 * @returns {Array} - Array of [severity, count] tuples sorted by priority
 */
export const sortSeverityBreakdownByPriority = (severityBreakdown) => {
  if (!severityBreakdown || typeof severityBreakdown !== 'object') {
    return []
  }

  return Object.entries(severityBreakdown)
    .filter(([_, count]) => count > 0)
    .sort(([severityA], [severityB]) => {
      const priorityA = getSeverityPriority(severityA)
      const priorityB = getSeverityPriority(severityB)
      return priorityA - priorityB
    })
}

/**
 * Calculate total weighted severity score from breakdown
 * @param {Object} severityBreakdown - Object with severity levels as keys and counts as values
 * @returns {number} - Total weighted score
 */
export const calculateWeightedSeverityScore = (severityBreakdown) => {
  if (!severityBreakdown || typeof severityBreakdown !== 'object') {
    return 0
  }

  return Object.entries(severityBreakdown).reduce((total, [severity, count]) => {
    const weight = getSeverityWeight(severity)
    return total + (count * weight)
  }, 0)
}

/**
 * Get severity level statistics
 * @param {Object} severityBreakdown - Object with severity levels as keys and counts as values
 * @returns {Object} - Statistics including total count, weighted score, most severe, etc.
 */
export const getSeverityStatistics = (severityBreakdown) => {
  if (!severityBreakdown || typeof severityBreakdown !== 'object') {
    return {
      totalCount: 0,
      weightedScore: 0,
      mostSevere: SEVERITY_LEVELS.UNKNOWN,
      hasHighSeverity: false,
      severityDistribution: []
    }
  }

  const totalCount = Object.values(severityBreakdown).reduce((sum, count) => sum + count, 0)
  const weightedScore = calculateWeightedSeverityScore(severityBreakdown)
  const sortedBreakdown = sortSeverityBreakdownByPriority(severityBreakdown)
  const mostSevere = sortedBreakdown.length > 0 ? sortedBreakdown[0][0] : SEVERITY_LEVELS.UNKNOWN
  const hasHighSeverity = (severityBreakdown[SEVERITY_LEVELS.CRITICAL] || 0) > 0 || 
                         (severityBreakdown[SEVERITY_LEVELS.MAJOR] || 0) > 0

  const severityDistribution = sortedBreakdown.map(([severity, count]) => ({
    severity,
    count,
    percentage: totalCount > 0 ? (count / totalCount) * 100 : 0,
    weight: getSeverityWeight(severity),
    color: getSeverityColor(severity)
  }))

  return {
    totalCount,
    weightedScore,
    mostSevere,
    hasHighSeverity,
    severityDistribution
  }
} 