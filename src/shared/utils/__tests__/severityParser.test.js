/**
 * Unit tests for severityParser.js
 * Following .cursorrules testing conventions with comprehensive coverage
 */

import {
  parseSeverity,
  parseSeverityBatch,
  getSeverityParsingStats,
  validateSeverityConfig
} from '../severityParser.js'

// Mock memberConfiguration
jest.mock('../../../constants/memberConfiguration.js', () => ({
  getSeverityConfig: jest.fn()
}))

import { getSeverityConfig } from '../../../constants/memberConfiguration.js'

describe('severityParser', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks()
    
    // Default mock configuration
    getSeverityConfig.mockReturnValue({
      severityField: 'customfield_10049',
      usePriorityFallback: true,
      severityMapping: {
        'Critical': 'Critical',
        'Functional': 'Major',
        'High': 'Major',
        'Medium': 'Minor',
        'Low': 'Low',
        'Lowest': 'Cosmetic'
      }
    })
  })

  describe('parseSeverity', () => {
    test('parses severity from custom field (object value)', () => {
      const issue = {
        key: 'TEST-123',
        fields: {
          customfield_10049: {
            value: 'Critical'
          },
          priority: {
            name: 'High'
          }
        }
      }

      const result = parseSeverity(issue)
      
      expect(result.severity).toBe('Critical')
      expect(result.rawValue).toBe('Critical')
      expect(result.source).toBe('custom_field')
      expect(result.confidence).toBe('high')
      expect(result.fallbackUsed).toBe(false)
    })

    test('parses severity from custom field (string value)', () => {
      const issue = {
        key: 'TEST-123',
        fields: {
          customfield_10049: 'Functional',
          priority: {
            name: 'High'
          }
        }
      }

      const result = parseSeverity(issue)
      
      expect(result.severity).toBe('Major')
      expect(result.rawValue).toBe('Functional')
      expect(result.source).toBe('custom_field')
      expect(result.confidence).toBe('high')
      expect(result.fallbackUsed).toBe(false)
    })

    test('falls back to priority field when custom field is empty', () => {
      const issue = {
        key: 'TEST-123',
        fields: {
          customfield_10049: null,
          priority: {
            name: 'High'
          }
        }
      }

      const result = parseSeverity(issue)
      
      expect(result.severity).toBe('Major')
      expect(result.rawValue).toBe('High')
      expect(result.source).toBe('priority_fallback')
      expect(result.confidence).toBe('medium')
      expect(result.fallbackUsed).toBe(true)
    })

    test('handles case-insensitive mapping', () => {
      const issue = {
        key: 'TEST-123',
        fields: {
          customfield_10049: 'critical', // lowercase
          priority: {
            name: 'High'
          }
        }
      }

      const result = parseSeverity(issue)
      
      expect(result.severity).toBe('Critical')
      expect(result.rawValue).toBe('critical')
      expect(result.source).toBe('custom_field')
      expect(result.confidence).toBe('medium') // Case-insensitive fallback
    })

    test('returns default severity (Minor) for unmapped severity values', () => {
      const issue = {
        key: 'TEST-123',
        fields: {
          customfield_10049: 'UnmappedSeverity',
          priority: {
            name: 'High'
          }
        }
      }

      const result = parseSeverity(issue)
      
      expect(result.severity).toBe('Minor')
      expect(result.rawValue).toBe('UnmappedSeverity')
      expect(result.source).toBe('custom_field')
      expect(result.confidence).toBe('low')
      expect(result.defaultUsed).toBe(true)
    })

    test('handles missing custom field and priority', () => {
      const issue = {
        key: 'TEST-123',
        fields: {
          customfield_10049: null,
          priority: null
        }
      }

      const result = parseSeverity(issue)
      
      expect(result.severity).toBe('Minor')
      expect(result.rawValue).toBe(null)
      expect(result.source).toBe('default_fallback')
      expect(result.confidence).toBe('low')
      expect(result.fallbackUsed).toBe(false)
      expect(result.defaultUsed).toBe(true)
    })

    test('handles invalid issue input', () => {
      expect(parseSeverity(null).severity).toBe('Unknown')
      expect(parseSeverity(undefined).severity).toBe('Unknown')
      expect(parseSeverity({}).severity).toBe('Unknown')
      expect(parseSeverity({ fields: null }).severity).toBe('Unknown')
    })

    test('handles configuration with priority fallback disabled', () => {
      getSeverityConfig.mockReturnValue({
        severityField: 'customfield_10049',
        usePriorityFallback: false,
        severityMapping: {
          'Critical': 'Critical'
        },
        defaultSeverity: 'Minor'
      })

      const issue = {
        key: 'TEST-123',
        fields: {
          customfield_10049: null,
          priority: {
            name: 'High'
          }
        }
      }

      const result = parseSeverity(issue)
      
      expect(result.severity).toBe('Minor')
      expect(result.fallbackUsed).toBe(false)
      expect(result.source).toBe('default_fallback')
      expect(result.defaultUsed).toBe(true)
    })

    test('includes debug metadata in result', () => {
      const issue = {
        key: 'TEST-123',
        fields: {
          customfield_10049: 'Critical',
          priority: {
            name: 'High'
          }
        }
      }

      const result = parseSeverity(issue)
      
      expect(result).toHaveProperty('customField')
      expect(result).toHaveProperty('customFieldValue')
      expect(result).toHaveProperty('priorityValue')
      expect(result).toHaveProperty('mappingUsed')
      expect(result.customField).toBe('customfield_10049')
      expect(result.customFieldValue).toBe('Critical')
      expect(result.priorityValue).toBe('High')
      expect(result.mappingUsed).toBe('Critical')
    })

    test('handles parsing errors gracefully', () => {
      // Mock getSeverityConfig to throw an error
      getSeverityConfig.mockImplementation(() => {
        throw new Error('Configuration error')
      })

      const issue = {
        key: 'TEST-123',
        fields: {
          customfield_10049: 'Critical'
        }
      }

      // Suppress console.warn for this test
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})

      const result = parseSeverity(issue)
      
      expect(result.severity).toBe('Unknown')
      expect(result.source).toBe('error')
      expect(result.confidence).toBe('low')
      expect(result.error).toBe('Configuration error')
      
      // Restore console.warn
      consoleSpy.mockRestore()
    })

    test('uses project-specific configuration when projectKey provided', () => {
      const projectKey = 'TEST_PROJECT'
      const issue = {
        key: 'TEST-123',
        fields: {
          customfield_10049: 'Critical'
        }
      }

      parseSeverity(issue, projectKey)
      
      expect(getSeverityConfig).toHaveBeenCalledWith(projectKey)
    })
  })

  describe('parseSeverityBatch', () => {
    test('parses multiple issues efficiently', () => {
      const issues = [
        {
          key: 'TEST-1',
          fields: { customfield_10049: 'Critical' }
        },
        {
          key: 'TEST-2',
          fields: { customfield_10049: 'High' }
        },
        {
          key: 'TEST-3',
          fields: { customfield_10049: null, π: { name: 'Medium' } }
        }
      ]

      const results = parseSeverityBatch(issues)
      
      expect(results).toHaveLength(3)
      expect(results[0].severity).toBe('Critical')
      expect(results[1].severity).toBe('Major')
      expect(results[2].severity).toBe('Minor')
      expect(results[2].fallbackUsed).toBe(true)
    })

    test('handles empty array', () => {
      expect(parseSeverityBatch([])).toEqual([])
    })

    test('handles invalid input', () => {
      expect(parseSeverityBatch(null)).toEqual([])
      expect(parseSeverityBatch(undefined)).toEqual([])
      expect(parseSeverityBatch('invalid')).toEqual([])
    })

    test('calls getSeverityConfig only once for performance', () => {
      const issues = [
        { key: 'TEST-1', fields: { customfield_10049: 'Critical' } },
        { key: 'TEST-2', fields: { customfield_10049: 'High' } },
        { key: 'TEST-3', fields: { customfield_10049: 'Medium' } }
      ]

      parseSeverityBatch(issues, 'TEST_PROJECT')
      
      // Should be called only once for the batch
      expect(getSeverityConfig).toHaveBeenCalledTimes(1)
      expect(getSeverityConfig).toHaveBeenCalledWith('TEST_PROJECT')
    })
  })

  describe('getSeverityParsingStats', () => {
    test('calculates parsing statistics correctly', () => {
      const issues = [
        { key: 'TEST-1', fields: { customfield_10049: 'Critical' } },
        { key: 'TEST-2', fields: { customfield_10049: 'High' } },
        { key: 'TEST-3', fields: { customfield_10049: null, priority: { name: 'Medium' } } },
        { key: 'TEST-4', fields: { customfield_10049: 'UnmappedValue' } },
        { key: 'TEST-5', fields: { customfield_10049: null, priority: null } }
      ]

      const stats = getSeverityParsingStats(issues)
      
      expect(stats.totalIssues).toBe(5)
      expect(stats.successfulParses).toBe(5) // All issues now get valid severities (Critical, High, Medium, Minor, Minor)
      expect(stats.unknownSeverities).toBe(0) // No unknowns with default fallback
      expect(stats.fallbackUsed).toBe(1) // Medium from priority
      expect(stats.successRate).toBe(100) // 5/5 * 100
      expect(stats.fallbackRate).toBe(20) // 1/5 * 100
      
      expect(stats.sourceBreakdown.custom_field).toBe(3) // Critical, High, UnmappedValue
      expect(stats.sourceBreakdown.priority_fallback).toBe(1) // Medium
      expect(stats.sourceBreakdown.default_fallback).toBe(1) // null/null case
      
      expect(stats.confidenceBreakdown.high).toBe(2) // Critical, High
      expect(stats.confidenceBreakdown.medium).toBe(1) // Medium from priority
      expect(stats.confidenceBreakdown.low).toBe(2) // UnmappedValue, null/null
    })

    test('handles empty issues array', () => {
      const stats = getSeverityParsingStats([])
      
      expect(stats.totalIssues).toBe(0)
      expect(stats.successfulParses).toBe(0)
      expect(stats.unknownSeverities).toBe(0)
      expect(stats.fallbackUsed).toBe(0)
      expect(stats.errors).toBe(0)
      expect(stats.successRate).toBe(0)
      expect(stats.fallbackRate).toBe(0)
      expect(stats.sourceBreakdown).toEqual({})
      expect(stats.confidenceBreakdown).toEqual({})
    })

    test('handles invalid input', () => {
      const defaultStats = {
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
      
      expect(getSeverityParsingStats(null)).toEqual(defaultStats)
      expect(getSeverityParsingStats(undefined)).toEqual(defaultStats)
      expect(getSeverityParsingStats('invalid')).toEqual(defaultStats)
    })
  })

  describe('validateSeverityConfig', () => {
    test('validates valid configuration', () => {
      const result = validateSeverityConfig()
      
      expect(result.isValid).toBe(true)
      expect(result.issues).toEqual([])
      expect(result.config).toBeDefined()
    })

    test('identifies missing severity field and disabled fallback', () => {
      getSeverityConfig.mockReturnValue({
        severityField: null,
        usePriorityFallback: false,
        severityMapping: {
          'Critical': 'Critical'
        }
      })

      const result = validateSeverityConfig()
      
      expect(result.isValid).toBe(false)
      expect(result.issues).toContain('No severity field configured and priority fallback is disabled')
    })

    test('identifies empty severity mapping', () => {
      getSeverityConfig.mockReturnValue({
        severityField: 'customfield_10049',
        usePriorityFallback: true,
        severityMapping: {}
      })

      const result = validateSeverityConfig()
      
      expect(result.isValid).toBe(false)
      expect(result.issues).toContain('No severity mapping configured')
    })

    test('identifies invalid severity levels in mapping', () => {
      getSeverityConfig.mockReturnValue({
        severityField: 'customfield_10049',
        usePriorityFallback: true,
        severityMapping: {
          'High': 'InvalidSeverityLevel',
          'Medium': 'Minor'
        }
      })

      const result = validateSeverityConfig()
      
      expect(result.isValid).toBe(false)
      expect(result.issues).toContain('Invalid severity level "InvalidSeverityLevel" mapped from "High"')
    })

    test('handles configuration errors', () => {
      getSeverityConfig.mockImplementation(() => {
        throw new Error('Config load error')
      })

      const result = validateSeverityConfig()
      
      expect(result.isValid).toBe(false)
      expect(result.issues).toContain('Configuration validation failed: Config load error')
      expect(result.config).toBe(null)
    })

    test('validates project-specific configuration', () => {
      const projectKey = 'TEST_PROJECT'
      
      validateSeverityConfig(projectKey)
      
      expect(getSeverityConfig).toHaveBeenCalledWith(projectKey)
    })
  })
}) 