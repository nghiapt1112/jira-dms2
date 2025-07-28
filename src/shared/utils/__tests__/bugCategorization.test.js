/**
 * Bug Categorization Utility Tests
 * Tests for bug categorization functionality
 */

import { 
  getBugStatusMapping, 
  categorizeBugStatus, 
  categorizeBugForTrend,
  getInitialBugTrendData,
  processBugForTrendAnalysis,
  convertLegacyBugTrendData,
  validateBugTrendData,
  getBugTrendSummary
} from '../bugCategorization.js'

// Mock memberConfiguration for testing
jest.mock('../../../constants/memberConfiguration.js', () => ({
  memberConfiguration: {
    BUG_STATUS_MAPPING: {
      resolved: ["Done", "Resolved", "Closed", "Fixed"],
      notFixed: ["Won't Fix", "Duplicate", "Cannot Reproduce", "Invalid"],
      new: ["To Do", "Open"],
      inProgress: ["In Progress", "In Review", "Testing"]
    }
  }
}))

describe('Bug Categorization Utility', () => {
  describe('getBugStatusMapping', () => {
    it('should return the bug status mapping from memberConfiguration', () => {
      const mapping = getBugStatusMapping()
      
      expect(mapping).toBeDefined()
      expect(mapping.resolved).toContain('Done')
      expect(mapping.notFixed).toContain("Won't Fix")
      expect(mapping.new).toContain('To Do')
      expect(mapping.inProgress).toContain('In Progress')
    })
  })

  describe('categorizeBugStatus', () => {
    it('should categorize resolved statuses correctly', () => {
      expect(categorizeBugStatus('Done')).toBe('resolved')
      expect(categorizeBugStatus('Resolved')).toBe('resolved')
      expect(categorizeBugStatus('Closed')).toBe('resolved')
      expect(categorizeBugStatus('Fixed')).toBe('resolved')
    })

    it('should categorize not fixed statuses correctly', () => {
      expect(categorizeBugStatus("Won't Fix")).toBe('notFixed')
      expect(categorizeBugStatus('Duplicate')).toBe('notFixed')
      expect(categorizeBugStatus('Cannot Reproduce')).toBe('notFixed')
      expect(categorizeBugStatus('Invalid')).toBe('notFixed')
    })

    it('should categorize new statuses correctly', () => {
      expect(categorizeBugStatus('To Do')).toBe('new')
      expect(categorizeBugStatus('Open')).toBe('new')
    })

    it('should categorize in progress statuses correctly', () => {
      expect(categorizeBugStatus('In Progress')).toBe('inProgress')
      expect(categorizeBugStatus('In Review')).toBe('inProgress')
      expect(categorizeBugStatus('Testing')).toBe('inProgress')
    })

    it('should return unknown for unrecognized statuses', () => {
      expect(categorizeBugStatus('Unknown Status')).toBe('unknown')
      expect(categorizeBugStatus('')).toBe('unknown')
      expect(categorizeBugStatus(null)).toBe('unknown')
      expect(categorizeBugStatus(undefined)).toBe('unknown')
    })
  })

  describe('getInitialBugTrendData', () => {
    it('should return initial bug trend data structure', () => {
      const data = getInitialBugTrendData()
      
      expect(data).toEqual({
        total: 0,
        resolved: 0,
        notFixed: 0,
        new: 0,
        inProgress: 0
      })
    })
  })

  describe('categorizeBugForTrend', () => {
    it('should categorize resolved bugs correctly', () => {
      const issue = {
        fields: {
          status: { name: 'Done' },
          resolutiondate: '2024-01-15T10:00:00.000Z'
        }
      }
      
      const category = categorizeBugForTrend(issue)
      
      expect(category).toBe('resolved')
    })

    it('should categorize not fixed bugs correctly', () => {
      const issue = {
        fields: {
          status: { name: "Won't Fix" }
        }
      }
      
      const category = categorizeBugForTrend(issue)
      
      expect(category).toBe('notFixed')
    })

    it('should categorize new bugs correctly', () => {
      const issue = {
        fields: {
          status: { name: 'To Do' }
        }
      }
      
      const category = categorizeBugForTrend(issue)
      
      expect(category).toBe('new')
    })

    it('should categorize in progress bugs correctly', () => {
      const issue = {
        fields: {
          status: { name: 'In Progress' }
        }
      }
      
      const category = categorizeBugForTrend(issue)
      
      expect(category).toBe('inProgress')
    })

    it('should handle unknown statuses with resolution date', () => {
      const issue = {
        fields: {
          status: { name: 'Unknown Status' },
          resolutiondate: '2024-01-15T10:00:00.000Z'
        }
      }
      
      const category = categorizeBugForTrend(issue)
      
      expect(category).toBe('resolved')
    })

    it('should handle unknown statuses without resolution date', () => {
      const issue = {
        fields: {
          status: { name: 'Unknown Status' }
        }
      }
      
      const category = categorizeBugForTrend(issue)
      
      expect(category).toBe('inProgress')
    })
  })

  describe('processBugForTrendAnalysis', () => {
    it('should process resolved bugs correctly', () => {
      const periodData = getInitialBugTrendData()
      const issue = {
        fields: {
          status: { name: 'Done' },
          resolutiondate: '2024-01-15T10:00:00.000Z'
        }
      }
      
      processBugForTrendAnalysis(issue, periodData, '2024-01')
      
      expect(periodData.total).toBe(1)
      expect(periodData.resolved).toBe(1)
      expect(periodData.notFixed).toBe(0)
      expect(periodData.new).toBe(0)
      expect(periodData.inProgress).toBe(0)
    })

    it('should process not fixed bugs correctly', () => {
      const periodData = getInitialBugTrendData()
      const issue = {
        fields: {
          status: { name: "Won't Fix" }
        }
      }
      
      processBugForTrendAnalysis(issue, periodData, '2024-01')
      
      expect(periodData.total).toBe(1)
      expect(periodData.resolved).toBe(0)
      expect(periodData.notFixed).toBe(1)
      expect(periodData.new).toBe(0)
      expect(periodData.inProgress).toBe(0)
    })

    it('should process new bugs correctly', () => {
      const periodData = getInitialBugTrendData()
      const issue = {
        fields: {
          status: { name: 'To Do' }
        }
      }
      
      processBugForTrendAnalysis(issue, periodData, '2024-01')
      
      expect(periodData.total).toBe(1)
      expect(periodData.resolved).toBe(0)
      expect(periodData.notFixed).toBe(0)
      expect(periodData.new).toBe(1)
      expect(periodData.inProgress).toBe(0)
    })

    it('should process in progress bugs correctly', () => {
      const periodData = getInitialBugTrendData()
      const issue = {
        fields: {
          status: { name: 'In Progress' }
        }
      }
      
      processBugForTrendAnalysis(issue, periodData, '2024-01')
      
      expect(periodData.total).toBe(1)
      expect(periodData.resolved).toBe(0)
      expect(periodData.notFixed).toBe(0)
      expect(periodData.new).toBe(0)
      expect(periodData.inProgress).toBe(1)
    })

    it('should handle unknown statuses with resolution date', () => {
      const periodData = getInitialBugTrendData()
      const issue = {
        fields: {
          status: { name: 'Unknown Status' },
          resolutiondate: '2024-01-15T10:00:00.000Z'
        }
      }
      
      processBugForTrendAnalysis(issue, periodData, '2024-01')
      
      expect(periodData.total).toBe(1)
      expect(periodData.resolved).toBe(1)
      expect(periodData.notFixed).toBe(0)
      expect(periodData.new).toBe(0)
      expect(periodData.inProgress).toBe(0)
    })

    it('should handle unknown statuses without resolution date', () => {
      const periodData = getInitialBugTrendData()
      const issue = {
        fields: {
          status: { name: 'Unknown Status' }
        }
      }
      
      processBugForTrendAnalysis(issue, periodData, '2024-01')
      
      expect(periodData.total).toBe(1)
      expect(periodData.resolved).toBe(0)
      expect(periodData.notFixed).toBe(0)
      expect(periodData.new).toBe(0)
      expect(periodData.inProgress).toBe(1)
    })
  })

  describe('convertLegacyBugTrendData', () => {
    it('should convert legacy data with pending field', () => {
      const legacyData = {
        total: 10,
        resolved: 5,
        pending: 3,
        new: 2
      }
      
      const converted = convertLegacyBugTrendData(legacyData)
      
      expect(converted).toEqual({
        total: 10,
        resolved: 5,
        notFixed: 0,
        new: 2,
        inProgress: 3 // pending converted to inProgress
      })
    })

    it('should handle null/undefined data', () => {
      expect(convertLegacyBugTrendData(null)).toEqual(getInitialBugTrendData())
      expect(convertLegacyBugTrendData(undefined)).toEqual(getInitialBugTrendData())
    })
  })

  describe('validateBugTrendData', () => {
    it('should validate correct data structure', () => {
      const validData = {
        total: 10,
        resolved: 5,
        notFixed: 2,
        new: 2,
        inProgress: 1
      }
      
      expect(validateBugTrendData(validData)).toBe(true)
    })

    it('should reject invalid data structure', () => {
      expect(validateBugTrendData(null)).toBe(false)
      expect(validateBugTrendData(undefined)).toBe(false)
      expect(validateBugTrendData({})).toBe(false)
      expect(validateBugTrendData({ total: 10 })).toBe(false)
    })
  })

  describe('getBugTrendSummary', () => {
    it('should calculate summary statistics correctly', () => {
      const data = {
        total: 20,
        resolved: 10,
        notFixed: 3,
        new: 4,
        inProgress: 3
      }
      
      const summary = getBugTrendSummary(data)
      
      expect(summary).toEqual({
        total: 20,
        resolved: 10,
        notFixed: 3,
        new: 4,
        inProgress: 3,
        resolutionRate: 50, // 10/20 * 100
        rejectionRate: 15,  // 3/20 * 100
        newBugRate: 20,     // 4/20 * 100
        inProgressRate: 15  // 3/20 * 100
      })
    })

    it('should handle zero total', () => {
      const data = {
        total: 0,
        resolved: 0,
        notFixed: 0,
        new: 0,
        inProgress: 0
      }
      
      const summary = getBugTrendSummary(data)
      
      expect(summary.resolutionRate).toBe(0)
      expect(summary.rejectionRate).toBe(0)
      expect(summary.newBugRate).toBe(0)
      expect(summary.inProgressRate).toBe(0)
    })

    it('should return null for invalid data', () => {
      expect(getBugTrendSummary(null)).toBeNull()
      expect(getBugTrendSummary(undefined)).toBeNull()
      expect(getBugTrendSummary({})).toBeNull()
    })
  })
}) 