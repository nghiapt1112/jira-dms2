/**
 * Unit Tests for Centralized Story Point Calculations
 * 
 * These tests ensure the centralized story point calculation functions
 * work correctly and consistently across all components.
 */

import {
  getDeliveredStatuses,
  isDeliveredStatus,
  getStandardizedDate,
  filterDeliveredIssues,
  calculateStoryPointsByTimePeriod,
  calculateDeveloperTicketsByTimePeriod,
  calculateTotalStoryPoints,
  validateStoryPointConsistency
} from '../storyPointCalculations'

// Mock memberConfiguration
jest.mock('../../../constants/memberConfiguration', () => ({
  memberConfiguration: {
    filterDefaults: {
      statusFilter: [
        'Done',
        'In QA',
        'Ready for QA',
        'Dev Test',
        'Under QA'
      ]
    }
  }
}))

// Mock timeUtils
jest.mock('../timeUtils', () => ({
  getTimePeriodKey: jest.fn((date, timeframe) => {
    if (!date) return null
    const d = new Date(date)
    if (timeframe === 'month') {
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    }
    return `${d.getFullYear()}-W${Math.ceil(d.getDate() / 7)}`
  })
}))

describe('Story Point Calculations', () => {
  const mockIssues = [
    {
      key: 'TEST-1',
      assignee: 'Ahmad Alfan',
      status: 'Done',
      storyPoints: 5,
      updated: '2024-01-15T10:00:00Z',
      resolved: '2024-01-15T11:00:00Z',
      created: '2024-01-10T10:00:00Z',
      project: 'PROJECT-A'
    },
    {
      key: 'TEST-2',
      assignee: 'Ahmad Alfan',
      status: 'In Progress',
      storyPoints: 3,
      updated: '2024-01-20T10:00:00Z',
      resolved: null,
      created: '2024-01-18T10:00:00Z',
      project: 'PROJECT-A'
    },
    {
      key: 'TEST-3',
      assignee: 'John Doe',
      status: 'In QA',
      storyPoints: 8,
      updated: '2024-02-05T10:00:00Z',
      resolved: null,
      created: '2024-02-01T10:00:00Z',
      project: 'PROJECT-B'
    },
    {
      key: 'TEST-4',
      assignee: 'Ahmad Alfan',
      status: 'Done',
      storyPoints: 2,
      updated: null,
      resolved: '2024-01-25T10:00:00Z',
      created: '2024-01-20T10:00:00Z',
      project: 'PROJECT-A'
    },
    {
      key: 'TEST-5',
      assignee: 'Jane Smith',
      status: 'To Do',
      storyPoints: 5,
      updated: '2024-01-30T10:00:00Z',
      resolved: null,
      created: '2024-01-28T10:00:00Z',
      project: 'PROJECT-A'
    }
  ]

  describe('getDeliveredStatuses', () => {
    it('should return delivered statuses from configuration', () => {
      const statuses = getDeliveredStatuses()
      expect(statuses).toEqual(['Done', 'In QA', 'Ready for QA', 'Dev Test', 'Under QA'])
    })
  })

  describe('isDeliveredStatus', () => {
    it('should return true for delivered status', () => {
      expect(isDeliveredStatus({ status: 'Done' })).toBe(true)
      expect(isDeliveredStatus({ status: 'In QA' })).toBe(true)
    })

    it('should return false for non-delivered status', () => {
      expect(isDeliveredStatus({ status: 'In Progress' })).toBe(false)
      expect(isDeliveredStatus({ status: 'To Do' })).toBe(false)
    })
  })

  describe('getStandardizedDate', () => {
    it('should prioritize updated date', () => {
      const issue = {
        updated: '2024-01-15T10:00:00Z',
        resolved: '2024-01-16T10:00:00Z',
        created: '2024-01-10T10:00:00Z'
      }
      expect(getStandardizedDate(issue)).toBe('2024-01-15T10:00:00Z')
    })

    it('should fall back to resolved date when updated is null', () => {
      const issue = {
        updated: null,
        resolved: '2024-01-16T10:00:00Z',
        created: '2024-01-10T10:00:00Z'
      }
      expect(getStandardizedDate(issue)).toBe('2024-01-16T10:00:00Z')
    })

    it('should fall back to created date when updated and resolved are null', () => {
      const issue = {
        updated: null,
        resolved: null,
        created: '2024-01-10T10:00:00Z'
      }
      expect(getStandardizedDate(issue)).toBe('2024-01-10T10:00:00Z')
    })

    it('should return null when all dates are null', () => {
      const issue = {
        updated: null,
        resolved: null,
        created: null
      }
      expect(getStandardizedDate(issue)).toBe(null)
    })
  })

  describe('filterDeliveredIssues', () => {
    it('should filter by delivered status by default', () => {
      const filtered = filterDeliveredIssues(mockIssues)
      expect(filtered).toHaveLength(3) // TEST-1, TEST-3, TEST-4
      expect(filtered.map(i => i.key)).toEqual(['TEST-1', 'TEST-3', 'TEST-4'])
    })

    it('should include all statuses when requireDeliveredStatus is false', () => {
      const filtered = filterDeliveredIssues(mockIssues, { requireDeliveredStatus: false })
      expect(filtered).toHaveLength(5) // All issues
    })

    it('should add standardizedDate field to all issues', () => {
      const filtered = filterDeliveredIssues(mockIssues)
      filtered.forEach(issue => {
        expect(issue).toHaveProperty('standardizedDate')
        expect(issue.standardizedDate).toBeTruthy()
      })
    })

    it('should handle empty issues array', () => {
      const filtered = filterDeliveredIssues([])
      expect(filtered).toEqual([])
    })

    it('should handle invalid input gracefully', () => {
      const filtered = filterDeliveredIssues(null)
      expect(filtered).toEqual([])
    })
  })

  describe('calculateStoryPointsByTimePeriod', () => {
    it('should require timeframe parameter', () => {
      const result = calculateStoryPointsByTimePeriod(mockIssues, {})
      expect(result).toEqual([])
    })

    it('should calculate story points by time period and developer', () => {
      const result = calculateStoryPointsByTimePeriod(mockIssues, { timeframe: 'month' })
      
      expect(result).toHaveLength(2) // 2024-01 and 2024-02
      
      // January data (TEST-1: 5pts, TEST-4: 2pts for Ahmad Alfan)
      const jan2024 = result.find(r => r.timePeriod === '2024-01')
      expect(jan2024).toBeTruthy()
      expect(jan2024['Ahmad Alfan']).toBe(7) // 5 + 2
      
      // February data (TEST-3: 8pts for John Doe)
      const feb2024 = result.find(r => r.timePeriod === '2024-02')
      expect(feb2024).toBeTruthy()
      expect(feb2024['John Doe']).toBe(8)
    })

    it('should filter by project when projectFilter is provided', () => {
      const result = calculateStoryPointsByTimePeriod(mockIssues, {
        timeframe: 'month',
        projectFilter: ['PROJECT-A']
      })
      
      // Should only include TEST-1 and TEST-4 (both Ahmad Alfan, both PROJECT-A)
      expect(result).toHaveLength(1) // Only 2024-01
      const jan2024 = result.find(r => r.timePeriod === '2024-01')
      expect(jan2024['Ahmad Alfan']).toBe(7)
      expect(jan2024['John Doe']).toBeUndefined()
    })

    it('should filter by developer when developerFilter is provided', () => {
      const result = calculateStoryPointsByTimePeriod(mockIssues, {
        timeframe: 'month',
        developerFilter: ['Ahmad Alfan']
      })
      
      // Should only include Ahmad Alfan's delivered tickets
      expect(result).toHaveLength(1) // Only 2024-01
      const jan2024 = result.find(r => r.timePeriod === '2024-01')
      expect(jan2024['Ahmad Alfan']).toBe(7)
      expect(jan2024['John Doe']).toBeUndefined()
    })

    it('should exclude issues with no story points', () => {
      const issuesWithZeroPoints = [
        ...mockIssues,
        {
          key: 'TEST-6',
          assignee: 'Ahmad Alfan',
          status: 'Done',
          storyPoints: 0,
          updated: '2024-01-15T10:00:00Z',
          project: 'PROJECT-A'
        }
      ]
      
      const result = calculateStoryPointsByTimePeriod(issuesWithZeroPoints, { timeframe: 'month' })
      const jan2024 = result.find(r => r.timePeriod === '2024-01')
      expect(jan2024['Ahmad Alfan']).toBe(7) // Still 7, not increased by 0-point ticket
    })

    it('should exclude unassigned issues', () => {
      const issuesWithUnassigned = [
        ...mockIssues,
        {
          key: 'TEST-7',
          assignee: 'Unassigned',
          status: 'Done',
          storyPoints: 10,
          updated: '2024-01-15T10:00:00Z',
          project: 'PROJECT-A'
        }
      ]
      
      const result = calculateStoryPointsByTimePeriod(issuesWithUnassigned, { timeframe: 'month' })
      const jan2024 = result.find(r => r.timePeriod === '2024-01')
      expect(jan2024['Unassigned']).toBeUndefined()
    })
  })

  describe('calculateDeveloperTicketsByTimePeriod', () => {
    it('should require timeframe parameter', () => {
      const result = calculateDeveloperTicketsByTimePeriod(mockIssues, 'Ahmad Alfan', {})
      expect(result.size).toBe(0)
    })

    it('should group tickets by time period for specific developer', () => {
      const result = calculateDeveloperTicketsByTimePeriod(mockIssues, 'Ahmad Alfan', { timeframe: 'month' })
      
      expect(result.size).toBe(1) // Only 2024-01 has delivered tickets for Ahmad
      expect(result.has('2024-01')).toBe(true)
      
      const jan2024Tickets = result.get('2024-01')
      expect(jan2024Tickets).toHaveLength(2) // TEST-1 and TEST-4
      expect(jan2024Tickets.map(t => t.key)).toEqual(['TEST-1', 'TEST-4'])
    })

    it('should return empty Map for non-existent developer', () => {
      const result = calculateDeveloperTicketsByTimePeriod(mockIssues, 'Non Existent', { timeframe: 'month' })
      expect(result.size).toBe(0)
    })

    it('should sort tickets by date descending within each period', () => {
      const result = calculateDeveloperTicketsByTimePeriod(mockIssues, 'Ahmad Alfan', { timeframe: 'month' })
      const jan2024Tickets = result.get('2024-01')
      
      // TEST-4 (resolved: 2024-01-25) should come before TEST-1 (updated: 2024-01-15)
      expect(jan2024Tickets[0].key).toBe('TEST-4')
      expect(jan2024Tickets[1].key).toBe('TEST-1')
    })

    it('should filter by project when projectFilter is provided', () => {
      const result = calculateDeveloperTicketsByTimePeriod(mockIssues, 'Ahmad Alfan', {
        timeframe: 'month',
        projectFilter: ['PROJECT-B']
      })
      
      expect(result.size).toBe(0) // Ahmad Alfan has no delivered tickets in PROJECT-B
    })
  })

  describe('calculateTotalStoryPoints', () => {
    it('should calculate total story points for all developers', () => {
      const total = calculateTotalStoryPoints(mockIssues)
      expect(total).toBe(15) // 5 + 8 + 2 = 15 (only delivered statuses)
    })

    it('should calculate total story points for specific developer', () => {
      const total = calculateTotalStoryPoints(mockIssues, 'Ahmad Alfan')
      expect(total).toBe(7) // 5 + 2 = 7 (only Ahmad's delivered tickets)
    })

    it('should return 0 for developer with no delivered tickets', () => {
      const total = calculateTotalStoryPoints(mockIssues, 'Jane Smith')
      expect(total).toBe(0) // Jane only has 'To Do' status
    })
  })

  describe('validateStoryPointConsistency', () => {
    it('should detect consistent calculations', () => {
      const teamData = [
        { timePeriod: '2024-01', 'Ahmad Alfan': 7 },
        { timePeriod: '2024-02', 'John Doe': 8 }
      ]
      
      const individualData = new Map([
        ['2024-01', [
          { key: 'TEST-1', storyPoints: 5 },
          { key: 'TEST-4', storyPoints: 2 }
        ]],
        ['2024-02', [
          { key: 'TEST-3', storyPoints: 8 }
        ]]
      ])
      
      const velocityData = mockIssues.filter(i => ['Done', 'In QA'].includes(i.status))
      
      const validation = validateStoryPointConsistency({
        teamData,
        individualData,
        velocityData
      })
      
      expect(validation.isConsistent).toBe(true)
      expect(validation.inconsistencies).toEqual([])
      expect(validation.totals.teamTotal).toBe(15)
      expect(validation.totals.individualTotal).toBe(15)
    })

    it('should detect inconsistent calculations', () => {
      const teamData = [
        { timePeriod: '2024-01', 'Ahmad Alfan': 10 } // Wrong total
      ]
      
      const individualData = new Map([
        ['2024-01', [
          { key: 'TEST-1', storyPoints: 5 }
        ]]
      ])
      
      const validation = validateStoryPointConsistency({
        teamData,
        individualData
      })
      
      expect(validation.isConsistent).toBe(false)
      expect(validation.inconsistencies).toHaveLength(1)
      expect(validation.inconsistencies[0]).toContain('Team vs Individual: 10 !== 5')
    })
  })
})