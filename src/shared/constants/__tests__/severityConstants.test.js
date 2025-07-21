/**
 * Unit tests for severityConstants.js
 * Following .cursorrules testing conventions with comprehensive coverage
 */

import {
  SEVERITY_LEVELS,
  SEVERITY_LEVELS_ARRAY,
  DEFAULT_SEVERITY_WEIGHTS,
  SEVERITY_UI_MAPPING,
  getSeverityColor,
  getSeverityWeight,
  getSeverityPriority,
  getSeverityDescription,
  isValidSeverity,
  initializeSeverityBreakdown,
  sortSeverityBreakdownByPriority,
  calculateWeightedSeverityScore,
  getSeverityStatistics
} from '../severityConstants.js'

describe('severityConstants', () => {
  describe('Constants', () => {
    test('SEVERITY_LEVELS contains all expected severity levels', () => {
      expect(SEVERITY_LEVELS.CRITICAL).toBe('Critical')
      expect(SEVERITY_LEVELS.MAJOR).toBe('Major')
      expect(SEVERITY_LEVELS.MINOR).toBe('Minor')
      expect(SEVERITY_LEVELS.LOW).toBe('Low')
      expect(SEVERITY_LEVELS.COSMETIC).toBe('Cosmetic')
      expect(SEVERITY_LEVELS.UNKNOWN).toBe('Unknown')
    })

    test('SEVERITY_LEVELS_ARRAY contains all severity levels in priority order', () => {
      expect(SEVERITY_LEVELS_ARRAY).toEqual([
        'Critical',
        'Major',
        'Minor',
        'Low',
        'Cosmetic',
        'Unknown'
      ])
      expect(SEVERITY_LEVELS_ARRAY).toHaveLength(6)
    })

    test('DEFAULT_SEVERITY_WEIGHTS has correct weight values', () => {
      expect(DEFAULT_SEVERITY_WEIGHTS.Critical).toBe(1.0)
      expect(DEFAULT_SEVERITY_WEIGHTS.Major).toBe(0.7)
      expect(DEFAULT_SEVERITY_WEIGHTS.Minor).toBe(0.5)
      expect(DEFAULT_SEVERITY_WEIGHTS.Low).toBe(0.3)
      expect(DEFAULT_SEVERITY_WEIGHTS.Cosmetic).toBe(0.1)
      expect(DEFAULT_SEVERITY_WEIGHTS.Unknown).toBe(0.2)
    })

    test('SEVERITY_UI_MAPPING has complete configuration for all levels', () => {
      Object.values(SEVERITY_LEVELS).forEach(severity => {
        expect(SEVERITY_UI_MAPPING[severity]).toBeDefined()
        expect(SEVERITY_UI_MAPPING[severity]).toHaveProperty('color')
        expect(SEVERITY_UI_MAPPING[severity]).toHaveProperty('weight')
        expect(SEVERITY_UI_MAPPING[severity]).toHaveProperty('priority')
        expect(SEVERITY_UI_MAPPING[severity]).toHaveProperty('description')
      })
    })
  })

  describe('getSeverityColor', () => {
    test('returns correct colors for valid severity levels', () => {
      expect(getSeverityColor('Critical')).toBe('error')
      expect(getSeverityColor('Major')).toBe('warning')
      expect(getSeverityColor('Minor')).toBe('info')
      expect(getSeverityColor('Low')).toBe('success')
      expect(getSeverityColor('Cosmetic')).toBe('default')
      expect(getSeverityColor('Unknown')).toBe('default')
    })

    test('returns default color for invalid severity levels', () => {
      expect(getSeverityColor('InvalidSeverity')).toBe('default')
      expect(getSeverityColor(null)).toBe('default')
      expect(getSeverityColor(undefined)).toBe('default')
      expect(getSeverityColor('')).toBe('default')
    })
  })

  describe('getSeverityWeight', () => {
    test('returns correct weights for valid severity levels', () => {
      expect(getSeverityWeight('Critical')).toBe(1.0)
      expect(getSeverityWeight('Major')).toBe(0.7)
      expect(getSeverityWeight('Minor')).toBe(0.5)
      expect(getSeverityWeight('Low')).toBe(0.3)
      expect(getSeverityWeight('Cosmetic')).toBe(0.1)
      expect(getSeverityWeight('Unknown')).toBe(0.2)
    })

    test('returns Unknown weight for invalid severity levels', () => {
      expect(getSeverityWeight('InvalidSeverity')).toBe(0.2)
      expect(getSeverityWeight(null)).toBe(0.2)
      expect(getSeverityWeight(undefined)).toBe(0.2)
    })
  })

  describe('getSeverityPriority', () => {
    test('returns correct priority order for severity levels', () => {
      expect(getSeverityPriority('Critical')).toBe(1)
      expect(getSeverityPriority('Major')).toBe(2)
      expect(getSeverityPriority('Minor')).toBe(3)
      expect(getSeverityPriority('Low')).toBe(4)
      expect(getSeverityPriority('Cosmetic')).toBe(5)
      expect(getSeverityPriority('Unknown')).toBe(6)
    })

    test('returns Unknown priority for invalid severity levels', () => {
      expect(getSeverityPriority('InvalidSeverity')).toBe(6)
      expect(getSeverityPriority(null)).toBe(6)
      expect(getSeverityPriority(undefined)).toBe(6)
    })
  })

  describe('getSeverityDescription', () => {
    test('returns correct descriptions for severity levels', () => {
      expect(getSeverityDescription('Critical')).toBe('Critical severity requiring immediate attention')
      expect(getSeverityDescription('Major')).toBe('Major severity with significant impact')
      expect(getSeverityDescription('Minor')).toBe('Minor severity with moderate impact')
      expect(getSeverityDescription('Low')).toBe('Low severity with minimal impact')
      expect(getSeverityDescription('Cosmetic')).toBe('Cosmetic issues with no functional impact')
      expect(getSeverityDescription('Unknown')).toBe('Unknown or unmapped severity level')
    })

    test('returns Unknown description for invalid severity levels', () => {
      const unknownDescription = 'Unknown or unmapped severity level'
      expect(getSeverityDescription('InvalidSeverity')).toBe(unknownDescription)
      expect(getSeverityDescription(null)).toBe(unknownDescription)
      expect(getSeverityDescription(undefined)).toBe(unknownDescription)
    })
  })

  describe('isValidSeverity', () => {
    test('returns true for valid severity levels', () => {
      SEVERITY_LEVELS_ARRAY.forEach(severity => {
        expect(isValidSeverity(severity)).toBe(true)
      })
    })

    test('returns false for invalid severity levels', () => {
      expect(isValidSeverity('InvalidSeverity')).toBe(false)
      expect(isValidSeverity(null)).toBe(false)
      expect(isValidSeverity(undefined)).toBe(false)
      expect(isValidSeverity('')).toBe(false)
      expect(isValidSeverity(123)).toBe(false)
    })
  })

  describe('initializeSeverityBreakdown', () => {
    test('returns object with all severity levels set to 0', () => {
      const breakdown = initializeSeverityBreakdown()
      
      expect(breakdown).toEqual({
        Critical: 0,
        Major: 0,
        Minor: 0,
        Low: 0,
        Cosmetic: 0,
        Unknown: 0
      })

      // Verify all SEVERITY_LEVELS are included
      SEVERITY_LEVELS_ARRAY.forEach(severity => {
        expect(breakdown[severity]).toBe(0)
      })
    })
  })

  describe('sortSeverityBreakdownByPriority', () => {
    test('sorts severity breakdown by priority (highest first)', () => {
      const breakdown = {
        Low: 5,
        Critical: 10,
        Minor: 3,
        Major: 7,
        Unknown: 1
      }

      const sorted = sortSeverityBreakdownByPriority(breakdown)
      
      expect(sorted).toEqual([
        ['Critical', 10],
        ['Major', 7],
        ['Minor', 3],
        ['Low', 5],
        ['Unknown', 1]
      ])
    })

    test('filters out zero counts', () => {
      const breakdown = {
        Critical: 5,
        Major: 0,
        Minor: 3,
        Low: 0,
        Cosmetic: 0,
        Unknown: 0
      }

      const sorted = sortSeverityBreakdownByPriority(breakdown)
      
      expect(sorted).toEqual([
        ['Critical', 5],
        ['Minor', 3]
      ])
    })

    test('handles invalid input gracefully', () => {
      expect(sortSeverityBreakdownByPriority(null)).toEqual([])
      expect(sortSeverityBreakdownByPriority(undefined)).toEqual([])
      expect(sortSeverityBreakdownByPriority('invalid')).toEqual([])
      expect(sortSeverityBreakdownByPriority({})).toEqual([])
    })
  })

  describe('calculateWeightedSeverityScore', () => {
    test('calculates weighted score correctly', () => {
      const breakdown = {
        Critical: 2,  // 2 * 1.0 = 2.0
        Major: 3,     // 3 * 0.7 = 2.1
        Minor: 1,     // 1 * 0.5 = 0.5
        Low: 4,       // 4 * 0.3 = 1.2
        Cosmetic: 5,  // 5 * 0.1 = 0.5
        Unknown: 1    // 1 * 0.2 = 0.2
      }

      const expected = 2.0 + 2.1 + 0.5 + 1.2 + 0.5 + 0.2 // = 6.5
      const result = calculateWeightedSeverityScore(breakdown)
      
      expect(result).toBeCloseTo(expected, 2)
    })

    test('handles empty breakdown', () => {
      expect(calculateWeightedSeverityScore({})).toBe(0)
      expect(calculateWeightedSeverityScore({Critical: 0, Major: 0})).toBe(0)
    })

    test('handles invalid input gracefully', () => {
      expect(calculateWeightedSeverityScore(null)).toBe(0)
      expect(calculateWeightedSeverityScore(undefined)).toBe(0)
      expect(calculateWeightedSeverityScore('invalid')).toBe(0)
    })
  })

  describe('getSeverityStatistics', () => {
    test('calculates comprehensive statistics correctly', () => {
      const breakdown = {
        Critical: 2,
        Major: 3,
        Minor: 1,
        Low: 4,
        Cosmetic: 0,
        Unknown: 0
      }

      const stats = getSeverityStatistics(breakdown)
      
      expect(stats.totalCount).toBe(10)
      expect(stats.weightedScore).toBeCloseTo(5.8, 2) // 2*1.0 + 3*0.7 + 1*0.5 + 4*0.3 = 2.0 + 2.1 + 0.5 + 1.2 = 5.8
      expect(stats.mostSevere).toBe('Critical')
      expect(stats.hasHighSeverity).toBe(true)
      expect(stats.severityDistribution).toHaveLength(4) // Only non-zero counts
      
      // Check distribution details
      const criticalDist = stats.severityDistribution.find(d => d.severity === 'Critical')
      expect(criticalDist.count).toBe(2)
      expect(criticalDist.percentage).toBe(20)
      expect(criticalDist.weight).toBe(1.0)
      expect(criticalDist.color).toBe('error')
    })

    test('handles breakdown with only low severity issues', () => {
      const breakdown = {
        Critical: 0,
        Major: 0,
        Minor: 2,
        Low: 3,
        Cosmetic: 1,
        Unknown: 0
      }

      const stats = getSeverityStatistics(breakdown)
      
      expect(stats.hasHighSeverity).toBe(false)
      expect(stats.mostSevere).toBe('Minor')
      expect(stats.totalCount).toBe(6)
    })

    test('handles empty breakdown', () => {
      const stats = getSeverityStatistics({})
      
      expect(stats.totalCount).toBe(0)
      expect(stats.weightedScore).toBe(0)
      expect(stats.mostSevere).toBe('Unknown')
      expect(stats.hasHighSeverity).toBe(false)
      expect(stats.severityDistribution).toEqual([])
    })

    test('handles invalid input gracefully', () => {
      const defaultStats = {
        totalCount: 0,
        weightedScore: 0,
        mostSevere: 'Unknown',
        hasHighSeverity: false,
        severityDistribution: []
      }
      
      expect(getSeverityStatistics(null)).toEqual(defaultStats)
      expect(getSeverityStatistics(undefined)).toEqual(defaultStats)
      expect(getSeverityStatistics('invalid')).toEqual(defaultStats)
    })
  })
}) 