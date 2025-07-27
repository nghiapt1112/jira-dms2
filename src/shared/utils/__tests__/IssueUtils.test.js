/**
 * Unit Tests for IssueUtils Class
 * 
 * Tests the centralized issue processing utilities following DRY and SOLID principles.
 */

import { IssueUtils } from '../IssueUtils'

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

describe('IssueUtils', () => {
  const mockIssues = [
    {
      key: 'TEST-1',
      assignee: 'Ahmad Alfan',
      status: 'Done',
      storyPoints: 5,
      resolved: '2024-01-15T11:00:00Z',
      updated: '2024-01-15T10:00:00Z',
      created: '2024-01-10T10:00:00Z',
      project: 'PROJECT-A'
    },
    {
      key: 'TEST-2', 
      assignee: 'Ahmad Alfan',
      status: 'In Progress',
      storyPoints: 3,
      resolved: null,
      updated: '2024-01-20T10:00:00Z',
      created: '2024-01-18T10:00:00Z',
      project: 'PROJECT-A'
    },
    {
      key: 'TEST-3',
      assignee: 'John Doe',
      status: 'In QA',
      storyPoints: 8,
      resolved: null,
      updated: '2024-02-05T10:00:00Z',
      created: '2024-02-01T10:00:00Z',
      project: 'PROJECT-B'
    },
    {
      key: 'TEST-4',
      assignee: 'Ahmad Alfan',
      status: 'Done',
      storyPoints: 2,
      resolved: '2024-01-25T10:00:00Z',
      updated: null,
      created: '2024-01-20T10:00:00Z',
      project: 'PROJECT-A'
    },
    {
      key: 'TEST-5',
      assignee: 'Jane Smith',
      status: 'To Do',
      storyPoints: 5,
      resolved: null,
      updated: '2024-01-30T10:00:00Z',
      created: '2024-01-28T10:00:00Z',
      project: 'PROJECT-A'
    }
  ]

  describe('getDeliveredStatuses', () => {
    it('should return delivered statuses from configuration', () => {
      const statuses = IssueUtils.getDeliveredStatuses()
      expect(statuses).toEqual(['Done', 'In QA', 'Ready for QA', 'Dev Test', 'Under QA'])
    })
  })

  describe('getDeliveredDate', () => {
    it('should prioritize resolved date', () => {
      const issue = {
        resolved: '2024-01-15T11:00:00Z',
        updated: '2024-01-15T10:00:00Z',
        created: '2024-01-10T10:00:00Z'
      }
      expect(IssueUtils.getDeliveredDate(issue)).toBe('2024-01-15T11:00:00Z')
    })

    it('should fall back to updated date when resolved is null', () => {
      const issue = {
        resolved: null,
        updated: '2024-01-20T10:00:00Z',
        created: '2024-01-18T10:00:00Z'
      }
      expect(IssueUtils.getDeliveredDate(issue)).toBe('2024-01-20T10:00:00Z')
    })

    it('should fall back to created date when resolved and updated are null', () => {
      const issue = {
        resolved: null,
        updated: null,
        created: '2024-01-10T10:00:00Z'
      }
      expect(IssueUtils.getDeliveredDate(issue)).toBe('2024-01-10T10:00:00Z')
    })

    it('should return null when all dates are null', () => {
      const issue = {
        resolved: null,
        updated: null,
        created: null
      }
      expect(IssueUtils.getDeliveredDate(issue)).toBe(null)
    })
  })

  describe('isDeliveredStatus', () => {
    it('should return true for delivered status', () => {
      expect(IssueUtils.isDeliveredStatus({ status: 'Done' })).toBe(true)
      expect(IssueUtils.isDeliveredStatus({ status: 'In QA' })).toBe(true)
    })

    it('should return false for non-delivered status', () => {
      expect(IssueUtils.isDeliveredStatus({ status: 'In Progress' })).toBe(false)
      expect(IssueUtils.isDeliveredStatus({ status: 'To Do' })).toBe(false)
    })
  })

  describe('filterDeliveredIssues', () => {
    it('should filter by delivered status and add deliveredDate field', () => {
      const filtered = IssueUtils.filterDeliveredIssues(mockIssues)
      
      expect(filtered).toHaveLength(3) // TEST-1, TEST-3, TEST-4
      expect(filtered.map(i => i.key)).toEqual(['TEST-1', 'TEST-3', 'TEST-4'])
      
      // Check deliveredDate field is added
      filtered.forEach(issue => {
        expect(issue).toHaveProperty('deliveredDate')
        expect(issue.deliveredDate).toBeTruthy()
      })
    })

    it('should filter by project when projectFilter is provided', () => {
      const filtered = IssueUtils.filterDeliveredIssues(mockIssues, {
        projectFilter: ['PROJECT-A']
      })
      
      expect(filtered).toHaveLength(2) // TEST-1, TEST-4
      expect(filtered.map(i => i.key)).toEqual(['TEST-1', 'TEST-4'])
    })

    it('should filter by developer when developerFilter is provided', () => {
      const filtered = IssueUtils.filterDeliveredIssues(mockIssues, {
        developerFilter: ['Ahmad Alfan']
      })
      
      expect(filtered).toHaveLength(2) // TEST-1, TEST-4
      expect(filtered.map(i => i.key)).toEqual(['TEST-1', 'TEST-4'])
    })

    it('should exclude unassigned and zero story point issues', () => {
      const issuesWithUnassigned = [
        ...mockIssues,
        {
          key: 'TEST-6',
          assignee: 'Unassigned',
          status: 'Done',
          storyPoints: 10,
          resolved: '2024-01-15T10:00:00Z',
          project: 'PROJECT-A'
        },
        {
          key: 'TEST-7',
          assignee: 'Ahmad Alfan',
          status: 'Done',
          storyPoints: 0,
          resolved: '2024-01-15T10:00:00Z',
          project: 'PROJECT-A'
        }
      ]
      
      const filtered = IssueUtils.filterDeliveredIssues(issuesWithUnassigned)
      expect(filtered.map(i => i.key)).not.toContain('TEST-6') // Unassigned
      expect(filtered.map(i => i.key)).not.toContain('TEST-7') // Zero points
    })

    it('should handle empty issues array', () => {
      const filtered = IssueUtils.filterDeliveredIssues([])
      expect(filtered).toEqual([])
    })

    it('should handle invalid input gracefully', () => {
      const filtered = IssueUtils.filterDeliveredIssues(null)
      expect(filtered).toEqual([])
    })
  })

  describe('calculateStoryPointsByTimePeriod', () => {
    it('should require timeframe parameter', () => {
      const result = IssueUtils.calculateStoryPointsByTimePeriod(mockIssues, null)
      expect(result).toEqual([])
    })

    it('should validate timeframe is valid', () => {
      const result = IssueUtils.calculateStoryPointsByTimePeriod(mockIssues, 'invalid')
      expect(result).toEqual([])
    })

    it('should calculate story points by time period and developer', () => {
      const result = IssueUtils.calculateStoryPointsByTimePeriod(mockIssues, 'month')
      
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
      const result = IssueUtils.calculateStoryPointsByTimePeriod(mockIssues, 'month', {
        projectFilter: ['PROJECT-A']
      })
      
      expect(result).toHaveLength(1) // Only 2024-01
      const jan2024 = result.find(r => r.timePeriod === '2024-01')
      expect(jan2024['Ahmad Alfan']).toBe(7)
      expect(jan2024['John Doe']).toBeUndefined()
    })

    it('should filter by developer when developerFilter is provided', () => {
      const result = IssueUtils.calculateStoryPointsByTimePeriod(mockIssues, 'month', {
        developerFilter: ['Ahmad Alfan']
      })
      
      expect(result).toHaveLength(1) // Only 2024-01
      const jan2024 = result.find(r => r.timePeriod === '2024-01')
      expect(jan2024['Ahmad Alfan']).toBe(7)
      expect(jan2024['John Doe']).toBeUndefined()
    })
  })

  describe('calculateDeveloperTicketsByTimePeriod', () => {
    it('should require timeframe parameter', () => {
      const result = IssueUtils.calculateDeveloperTicketsByTimePeriod(mockIssues, 'Ahmad Alfan', null)
      expect(result.size).toBe(0)
    })

    it('should group tickets by time period for specific developer', () => {
      const result = IssueUtils.calculateDeveloperTicketsByTimePeriod(mockIssues, 'Ahmad Alfan', 'month')
      
      expect(result.size).toBe(1) // Only 2024-01 has delivered tickets for Ahmad
      expect(result.has('2024-01')).toBe(true)
      
      const jan2024Tickets = result.get('2024-01')
      expect(jan2024Tickets).toHaveLength(2) // TEST-1 and TEST-4
      expect(jan2024Tickets.map(t => t.key)).toEqual(['TEST-4', 'TEST-1']) // Sorted by deliveredDate desc
    })

    it('should return empty Map for non-existent developer', () => {
      const result = IssueUtils.calculateDeveloperTicketsByTimePeriod(mockIssues, 'Non Existent', 'month')
      expect(result.size).toBe(0)
    })

    it('should sort tickets by delivered date descending within each period', () => {
      const result = IssueUtils.calculateDeveloperTicketsByTimePeriod(mockIssues, 'Ahmad Alfan', 'month')
      const jan2024Tickets = result.get('2024-01')
      
      // TEST-4 (resolved: 2024-01-25) should come before TEST-1 (resolved: 2024-01-15)
      expect(jan2024Tickets[0].key).toBe('TEST-4')
      expect(jan2024Tickets[1].key).toBe('TEST-1')
    })

    it('should filter by project when projectFilter is provided', () => {
      const result = IssueUtils.calculateDeveloperTicketsByTimePeriod(mockIssues, 'Ahmad Alfan', 'month', {
        projectFilter: ['PROJECT-B']
      })
      
      expect(result.size).toBe(0) // Ahmad Alfan has no delivered tickets in PROJECT-B
    })
  })

  describe('calculateTotalStoryPoints', () => {
    it('should calculate total story points for all developers', () => {
      const total = IssueUtils.calculateTotalStoryPoints(mockIssues)
      expect(total).toBe(15) // 5 + 8 + 2 = 15 (only delivered statuses)
    })

    it('should calculate total story points for specific developer', () => {
      const total = IssueUtils.calculateTotalStoryPoints(mockIssues, 'Ahmad Alfan')
      expect(total).toBe(7) // 5 + 2 = 7 (only Ahmad's delivered tickets)
    })

    it('should return 0 for developer with no delivered tickets', () => {
      const total = IssueUtils.calculateTotalStoryPoints(mockIssues, 'Jane Smith')
      expect(total).toBe(0) // Jane only has 'To Do' status
    })
  })

  describe('getIssueSummary', () => {
    it('should return comprehensive summary statistics', () => {
      const summary = IssueUtils.getIssueSummary(mockIssues)
      
      expect(summary.totalIssues).toBe(3) // 3 delivered issues
      expect(summary.totalStoryPoints).toBe(15) // 5 + 8 + 2
      expect(summary.developers).toBe(2) // Ahmad Alfan, John Doe
      expect(summary.projects).toBe(2) // PROJECT-A, PROJECT-B
      expect(summary.dateRange.earliest).toBeTruthy()
      expect(summary.dateRange.latest).toBeTruthy()
    })

    it('should handle empty issues array', () => {
      const summary = IssueUtils.getIssueSummary([])
      
      expect(summary.totalIssues).toBe(0)
      expect(summary.totalStoryPoints).toBe(0)
      expect(summary.developers).toBe(0)
      expect(summary.projects).toBe(0)
      expect(summary.dateRange.earliest).toBe(null)
      expect(summary.dateRange.latest).toBe(null)
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
      
      const validation = IssueUtils.validateStoryPointConsistency({
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
      
      const validation = IssueUtils.validateStoryPointConsistency({
        teamData,
        individualData
      })
      
      expect(validation.isConsistent).toBe(false)
      expect(validation.inconsistencies).toHaveLength(1)
      expect(validation.inconsistencies[0]).toContain('Team vs Individual: 10 !== 5')
    })
  })
})