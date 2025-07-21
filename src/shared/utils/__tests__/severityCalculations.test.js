/**
 * Unit tests for severityCalculations.js
 * Following .cursorrules testing conventions with comprehensive coverage
 */

import {
  calculateSeverityBreakdown,
  calculateSimpleBugRate,
  calculateWeightedBugRate,
  calculateQualityEfficiency,
  calculateBugRateMetrics,
  calculateDeveloperBugRateMetrics,
  calculateProjectSeverityRates,
  calculateBatchMetrics
} from '../severityCalculations.js'

// Mock dependencies
jest.mock('../severityParser.js', () => ({
  parseSeverity: jest.fn(),
  parseSeverityBatch: jest.fn()
}))

jest.mock('../../constants/severityConstants.js', () => ({
  SEVERITY_LEVELS: {
    CRITICAL: 'Critical',
    MAJOR: 'Major',
    MINOR: 'Minor',
    LOW: 'Low',
    COSMETIC: 'Cosmetic',
    UNKNOWN: 'Unknown'
  },
  getSeverityWeight: jest.fn(),
  initializeSeverityBreakdown: jest.fn(),
  calculateWeightedSeverityScore: jest.fn(),
  getSeverityStatistics: jest.fn()
}))

import { parseSeverityBatch } from '../severityParser.js'
import { 
  getSeverityWeight,
  initializeSeverityBreakdown,
  calculateWeightedSeverityScore,
  getSeverityStatistics
} from '../../constants/severityConstants.js'

describe('severityCalculations', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock default implementations
    initializeSeverityBreakdown.mockReturnValue({
      Critical: 0,
      Major: 0,
      Minor: 0,
      Low: 0,
      Cosmetic: 0,
      Unknown: 0
    })

    getSeverityWeight.mockImplementation((severity) => {
      const weights = {
        Critical: 1.0,
        Major: 0.7,
        Minor: 0.5,
        Low: 0.3,
        Cosmetic: 0.1,
        Unknown: 0.2
      }
      return weights[severity] || 0.2
    })

    calculateWeightedSeverityScore.mockImplementation((breakdown) => {
      return Object.entries(breakdown).reduce((total, [severity, count]) => {
        const weight = getSeverityWeight(severity)
        return total + (count * weight)
      }, 0)
    })

    getSeverityStatistics.mockImplementation((breakdown) => ({
      totalCount: Object.values(breakdown).reduce((sum, count) => sum + count, 0),
      weightedScore: calculateWeightedSeverityScore(breakdown),
      mostSevere: 'Critical',
      hasHighSeverity: breakdown.Critical > 0 || breakdown.Major > 0,
      severityDistribution: []
    }))
  })

  describe('calculateSeverityBreakdown', () => {
    test('calculates severity breakdown correctly', () => {
      const bugs = [
        { key: 'BUG-1' },
        { key: 'BUG-2' },
        { key: 'BUG-3' }
      ]

      parseSeverityBatch.mockReturnValue([
        { severity: 'Critical' },
        { severity: 'Major' },
        { severity: 'Critical' }
      ])

      const result = calculateSeverityBreakdown(bugs, 'TEST_PROJECT')
      
      expect(parseSeverityBatch).toHaveBeenCalledWith(bugs, 'TEST_PROJECT')
      expect(result.Critical).toBe(2)
      expect(result.Major).toBe(1)
      expect(result.Minor).toBe(0)
    })

    test('handles empty bugs array', () => {
      const result = calculateSeverityBreakdown([], 'TEST_PROJECT')
      
      expect(initializeSeverityBreakdown).toHaveBeenCalled()
      expect(result).toEqual({
        Critical: 0,
        Major: 0,
        Minor: 0,
        Low: 0,
        Cosmetic: 0,
        Unknown: 0
      })
    })

    test('handles null/undefined input', () => {
      expect(calculateSeverityBreakdown(null)).toEqual({
        Critical: 0,
        Major: 0,
        Minor: 0,
        Low: 0,
        Cosmetic: 0,
        Unknown: 0
      })
      
      expect(calculateSeverityBreakdown(undefined)).toEqual({
        Critical: 0,
        Major: 0,
        Minor: 0,
        Low: 0,
        Cosmetic: 0,
        Unknown: 0
      })
    })

    test('handles Unknown severity levels', () => {
      const bugs = [{ key: 'BUG-1' }]

      parseSeverityBatch.mockReturnValue([
        { severity: 'Unknown' }
      ])

      const result = calculateSeverityBreakdown(bugs)
      
      expect(result.Unknown).toBe(1)
    })
  })

  describe('calculateSimpleBugRate', () => {
    test('calculates simple bug rate correctly', () => {
      const bugs = [{ key: 'BUG-1' }, { key: 'BUG-2' }]
      const totalIssues = 10
      
      const result = calculateSimpleBugRate(bugs, totalIssues)
      
      expect(result).toBe(20) // (2/10) * 100
    })

    test('handles empty bugs array', () => {
      expect(calculateSimpleBugRate([], 10)).toBe(0)
      expect(calculateSimpleBugRate(null, 10)).toBe(0)
      expect(calculateSimpleBugRate(undefined, 10)).toBe(0)
    })

    test('handles zero total issues', () => {
      const bugs = [{ key: 'BUG-1' }]
      
      expect(calculateSimpleBugRate(bugs, 0)).toBe(0)
      expect(calculateSimpleBugRate(bugs, -1)).toBe(0)
    })
  })

  describe('calculateWeightedBugRate', () => {
    test('calculates weighted bug rate correctly', () => {
      const bugs = [
        { key: 'BUG-1' },
        { key: 'BUG-2' },
        { key: 'BUG-3' }
      ]
      const totalIssues = 10

      // Mock severity breakdown: 2 Critical (2.0), 1 Major (0.7) = 2.7 total weight
      calculateWeightedSeverityScore.mockReturnValue(2.7)

      const result = calculateWeightedBugRate(bugs, totalIssues, 'TEST_PROJECT')
      
      expect(result).toBe(27) // (2.7/10) * 100
    })

    test('handles empty bugs array', () => {
      expect(calculateWeightedBugRate([], 10)).toBe(0)
      expect(calculateWeightedBugRate(null, 10)).toBe(0)
    })

    test('handles zero total issues', () => {
      const bugs = [{ key: 'BUG-1' }]
      
      expect(calculateWeightedBugRate(bugs, 0)).toBe(0)
    })

    test('falls back to simple bug rate on error', () => {
      const bugs = [{ key: 'BUG-1' }]
      const totalIssues = 10

      // Mock calculateSeverityBreakdown to throw error
      parseSeverityBatch.mockImplementation(() => {
        throw new Error('Parsing error')
      })

      const result = calculateWeightedBugRate(bugs, totalIssues)
      
      // Should fall back to simple bug rate: (1/10) * 100 = 10
      expect(result).toBe(10)
    })
  })

  describe('calculateQualityEfficiency', () => {
    test('calculates quality efficiency correctly', () => {
      const bugs = [{ key: 'BUG-1' }]
      const totalIssues = 10

      calculateWeightedSeverityScore.mockReturnValue(1.5)

      const result = calculateQualityEfficiency(bugs, totalIssues)
      
      // Weighted bug rate: (1.5/10) * 100 = 15%
      // Quality efficiency: 100 - 15 = 85%
      expect(result).toBe(85)
    })

    test('ensures minimum efficiency of 0', () => {
      const bugs = Array(20).fill({ key: 'BUG' }) // 20 bugs
      const totalIssues = 10 // More bugs than total issues

      calculateWeightedSeverityScore.mockReturnValue(25) // Very high weighted score

      const result = calculateQualityEfficiency(bugs, totalIssues)
      
      expect(result).toBe(0) // Should not go below 0
    })
  })

  describe('calculateBugRateMetrics', () => {
    test('calculates comprehensive bug rate metrics', () => {
      const bugs = [
        { key: 'BUG-1' },
        { key: 'BUG-2' }
      ]
      const totalIssues = 10

      const mockBreakdown = {
        Critical: 1,
        Major: 1,
        Minor: 0,
        Low: 0,
        Cosmetic: 0,
        Unknown: 0
      }

      parseSeverityBatch.mockReturnValue([
        { severity: 'Critical' },
        { severity: 'Major' }
      ])

      calculateWeightedSeverityScore.mockReturnValue(1.7) // 1*1.0 + 1*0.7

      getSeverityStatistics.mockReturnValue({
        totalCount: 2,
        weightedScore: 1.7,
        mostSevere: 'Critical',
        hasHighSeverity: true,
        severityDistribution: []
      })

      const result = calculateBugRateMetrics(bugs, totalIssues, 'TEST_PROJECT')
      
      expect(result.simpleBugRate).toBe(20) // (2/10) * 100
      expect(result.weightedBugRate).toBe(17) // (1.7/10) * 100
      expect(result.qualityEfficiency).toBe(83) // 100 - 17
      expect(result.totalBugs).toBe(2)
      expect(result.totalIssues).toBe(10)
      expect(result.projectKey).toBe('TEST_PROJECT')
      expect(result.bugRateDifference).toBe(-3) // 17 - 20
      expect(result.riskLevel).toBe('medium') // 17% weighted rate
      expect(result.qualityGrade).toBe('B') // 83% efficiency
    })

    test('handles empty bugs array', () => {
      const result = calculateBugRateMetrics([], 10)
      
      expect(result.simpleBugRate).toBe(0)
      expect(result.weightedBugRate).toBe(0)
      expect(result.qualityEfficiency).toBe(100)
      expect(result.totalBugs).toBe(0)
      expect(result.totalIssues).toBe(10)
    })

    test('handles invalid input gracefully', () => {
      const result = calculateBugRateMetrics(null, 0)
      
      expect(result.simpleBugRate).toBe(0)
      expect(result.weightedBugRate).toBe(0)
      expect(result.qualityEfficiency).toBe(100)
      expect(result.totalBugs).toBe(0)
      expect(result.totalIssues).toBe(0)
    })

    test('handles calculation errors', () => {
      const bugs = [{ key: 'BUG-1' }]
      
      parseSeverityBatch.mockImplementation(() => {
        throw new Error('Calculation error')
      })

      const result = calculateBugRateMetrics(bugs, 10)
      
      expect(result.error).toBe('Calculation error')
      expect(result.totalBugs).toBe(1) // Should still set basic properties
    })
  })

  describe('calculateDeveloperBugRateMetrics', () => {
    test('calculates developer-specific metrics', () => {
      const developerData = {
        developer: 'John Doe',
        bugs: [{ key: 'BUG-1' }],
        totalIssues: 5
      }

      calculateWeightedSeverityScore.mockReturnValue(1.0)

      const result = calculateDeveloperBugRateMetrics(developerData)
      
      expect(result.developer).toBe('John Doe')
      expect(result.simpleBugRate).toBe(20) // (1/5) * 100
      expect(result).toHaveProperty('bugsPerWeek')
      expect(result).toHaveProperty('bugsPerMonth')
      expect(result).toHaveProperty('averageSeverity')
      expect(result).toHaveProperty('trendDirection')
    })

    test('handles missing developer data', () => {
      const result = calculateDeveloperBugRateMetrics(null)
      
      expect(result.developer).toBe('Unknown')
      expect(result.simpleBugRate).toBe(0)
      expect(result.totalBugs).toBe(0)
    })

    test('handles developer data with missing properties', () => {
      const developerData = {
        name: 'Jane Doe' // Alternative property name
      }

      const result = calculateDeveloperBugRateMetrics(developerData)
      
      expect(result.developer).toBe('Jane Doe')
    })
  })

  describe('calculateProjectSeverityRates', () => {
    test('calculates project-level severity rates', () => {
      const projectData = [
        {
          projectKey: 'PROJ1',
          name: 'Project 1',
          bugs: [{ key: 'BUG-1' }],
          totalIssues: 10,
          progress: 75,
          healthScore: 85
        },
        {
          id: 'PROJ2',
          bugs: [{ key: 'BUG-2' }, { key: 'BUG-3' }],
          totalIssues: 20
        }
      ]

      calculateWeightedSeverityScore.mockReturnValue(1.0)

      const result = calculateProjectSeverityRates(projectData)
      
      expect(result).toHaveLength(2)
      expect(result[0].projectId).toBe('PROJ1')
      expect(result[0].projectName).toBe('Project 1')
      expect(result[0].progress).toBe(75)
      expect(result[0].healthScore).toBe(85)
      expect(result[1].projectId).toBe('PROJ2')
      expect(result[1].projectName).toBe('PROJ2') // Falls back to projectId
    })

    test('handles empty project data', () => {
      expect(calculateProjectSeverityRates([])).toEqual([])
      expect(calculateProjectSeverityRates(null)).toEqual([])
      expect(calculateProjectSeverityRates(undefined)).toEqual([])
    })
  })

  describe('calculateBatchMetrics', () => {
    test('calculates metrics for multiple entities', () => {
      const entities = [
        {
          name: 'Entity 1',
          bugs: [{ key: 'BUG-1' }],
          totalIssues: 5
        },
        {
          name: 'Entity 2',
          bugs: [{ key: 'BUG-2' }, { key: 'BUG-3' }],
          totalIssues: 10
        }
      ]

      calculateWeightedSeverityScore.mockReturnValue(1.0)

      const result = calculateBatchMetrics(entities)
      
      expect(result).toHaveLength(2)
      expect(result[0].name).toBe('Entity 1')
      expect(result[0].simpleBugRate).toBe(20) // (1/5) * 100
      expect(result[1].name).toBe('Entity 2')
      expect(result[1].simpleBugRate).toBe(20) // (2/10) * 100
    })

    test('uses custom entity processor', () => {
      const entities = [{ name: 'Test', bugs: [], totalIssues: 5 }]
      const entityProcessor = (entity, metrics) => ({
        customName: entity.name.toUpperCase(),
        customMetric: metrics.simpleBugRate * 2
      })

      const result = calculateBatchMetrics(entities, null, entityProcessor)
      
      expect(result[0].customName).toBe('TEST')
      expect(result[0].customMetric).toBe(0) // 0 * 2
    })

    test('handles invalid input', () => {
      expect(calculateBatchMetrics(null)).toEqual([])
      expect(calculateBatchMetrics(undefined)).toEqual([])
      expect(calculateBatchMetrics('invalid')).toEqual([])
    })
  })
}) 