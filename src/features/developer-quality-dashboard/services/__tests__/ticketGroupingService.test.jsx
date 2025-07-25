import {
  groupTicketsByTimeframe,
  sortTicketsWithinPeriod,
  sortGroupedTicketsByPeriod,
  getTicketGroupStatistics,
  filterTicketsByCriteria
} from '../ticketGroupingService'

// Mock time utilities
jest.mock('../../../../shared/utils/timeUtils', () => ({
  getTimePeriodKey: jest.fn((date, timeframe) => {
    if (!date) return null
    const dateObj = new Date(date)
    if (isNaN(dateObj.getTime())) return null
    
    switch (timeframe) {
      case 'week':
        return '2024-W03'
      case 'quarter':
        return '2024-Q1'
      case 'month':
      default:
        return '2024-01'
    }
  })
}))

describe('ticketGroupingService', () => {
  const mockTickets = [
    {
      id: '1',
      key: 'TEST-1',
      summary: 'Test issue 1',
      assignee: 'John Doe',
      status: 'Done',
      issueType: 'Bug',
      severity: 'Major',
      project: 'Test Project',
      updated: '2024-01-15T10:30:00.000Z',
      resolved: '2024-01-20T15:45:00.000Z',
      storyPoints: 5
    },
    {
      id: '2',
      key: 'TEST-2',
      summary: 'Test issue 2',
      assignee: 'John Doe',
      status: 'In Progress',
      issueType: 'Story',
      severity: 'Minor',
      project: 'Test Project',
      updated: '2024-01-25T09:15:00.000Z',
      resolved: null,
      storyPoints: 3
    },
    {
      id: '3',
      key: 'TEST-3',
      summary: 'Test issue 3',
      assignee: 'Jane Smith',
      status: 'Done',
      issueType: 'Task',
      severity: 'Critical',
      project: 'Other Project',
      updated: '2024-01-10T14:20:00.000Z',
      resolved: '2024-01-12T16:30:00.000Z',
      storyPoints: 2
    }
  ]

  describe('groupTicketsByTimeframe', () => {
    beforeEach(() => {
      // Reset console.warn mock
      jest.spyOn(console, 'warn').mockImplementation(() => {})
    })

    afterEach(() => {
      console.warn.mockRestore()
    })

    it('should group tickets by timeframe', () => {
      const result = groupTicketsByTimeframe(mockTickets, 'month')

      expect(result instanceof Map).toBe(true)
      expect(result.has('2024-01')).toBe(true)
      expect(result.get('2024-01')).toHaveLength(3)
    })

    it('should handle empty tickets array', () => {
      const result = groupTicketsByTimeframe([], 'month')

      expect(result instanceof Map).toBe(true)
      expect(result.size).toBe(0)
    })

    it('should handle invalid input gracefully', () => {
      const result = groupTicketsByTimeframe(null, 'month')

      expect(result instanceof Map).toBe(true)
      expect(result.size).toBe(0)
      expect(console.warn).toHaveBeenCalledWith('groupTicketsByTimeframe: tickets must be an array')
    })

    it('should use auto date field selection by default', () => {
      const ticketsWithoutResolved = mockTickets.map(ticket => ({
        ...ticket,
        resolved: null
      }))

      const result = groupTicketsByTimeframe(ticketsWithoutResolved, 'month')

      expect(result.get('2024-01')).toHaveLength(3) // Should use updated date
    })

    it('should prefer resolved date when available', () => {
      const result = groupTicketsByTimeframe(mockTickets, 'month', { dateField: 'resolved' })

      // Should only group tickets that have resolved dates
      expect(result.get('2024-01')).toHaveLength(2) // TEST-1 and TEST-3 have resolved dates
    })

    it('should handle tickets without valid dates', () => {
      const ticketsWithoutDates = [
        {
          ...mockTickets[0],
          resolved: null,
          updated: null,
          created: null
        }
      ]

      const result = groupTicketsByTimeframe(ticketsWithoutDates, 'month')

      expect(result.size).toBe(0)
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('skipped 1 tickets'),
        expect.any(Object)
      )
    })

    it('should handle invalid timeframes', () => {
      const result = groupTicketsByTimeframe(mockTickets, 'invalid')

      expect(console.warn).toHaveBeenCalledWith(
        "groupTicketsByTimeframe: invalid timeframe 'invalid', defaulting to 'month'"
      )
      expect(result.has('2024-01')).toBe(true)
    })

    it('should sort periods when requested', () => {
      const result = groupTicketsByTimeframe(mockTickets, 'month', { sortPeriods: true })

      const keys = Array.from(result.keys())
      expect(keys).toEqual(['2024-01']) // Only one period in test data
    })
  })

  describe('sortTicketsWithinPeriod', () => {
    it('should sort tickets by date in descending order by default', () => {
      const result = sortTicketsWithinPeriod(mockTickets)

      expect(result[0].key).toBe('TEST-2') // Most recent updated date
      expect(result[1].key).toBe('TEST-1') // Resolved date
      expect(result[2].key).toBe('TEST-3') // Oldest resolved date
    })

    it('should sort tickets by story points', () => {
      const result = sortTicketsWithinPeriod(mockTickets, { sortBy: 'storyPoints' })

      expect(result[0].storyPoints).toBe(5) // Highest first
      expect(result[1].storyPoints).toBe(3)
      expect(result[2].storyPoints).toBe(2)
    })

    it('should sort tickets by key', () => {
      const result = sortTicketsWithinPeriod(mockTickets, { sortBy: 'key', order: 'asc' })

      expect(result[0].key).toBe('TEST-1')
      expect(result[1].key).toBe('TEST-2')
      expect(result[2].key).toBe('TEST-3')
    })

    it('should handle empty array', () => {
      const result = sortTicketsWithinPeriod([])

      expect(result).toEqual([])
    })

    it('should handle invalid input', () => {
      jest.spyOn(console, 'warn').mockImplementation(() => {})
      
      const result = sortTicketsWithinPeriod(null)

      expect(result).toEqual([])
      expect(console.warn).toHaveBeenCalledWith('sortTicketsWithinPeriod: tickets must be an array')
      
      console.warn.mockRestore()
    })

    it('should use secondary sort by key for consistency', () => {
      const ticketsWithSamePoints = [
        { ...mockTickets[0], storyPoints: 3 },
        { ...mockTickets[1], storyPoints: 3 }
      ]

      const result = sortTicketsWithinPeriod(ticketsWithSamePoints, { sortBy: 'storyPoints' })

      // When story points are equal, should sort by key
      expect(result[0].key).toBe('TEST-1')
      expect(result[1].key).toBe('TEST-2')
    })
  })

  describe('sortGroupedTicketsByPeriod', () => {
    it('should sort period keys in descending order by default', () => {
      const groupedTickets = new Map([
        ['2024-01', mockTickets.slice(0, 2)],
        ['2024-02', mockTickets.slice(2)]
      ])

      const result = sortGroupedTicketsByPeriod(groupedTickets)

      const keys = Array.from(result.keys())
      expect(keys).toEqual(['2024-02', '2024-01'])
    })

    it('should sort period keys in ascending order when requested', () => {
      const groupedTickets = new Map([
        ['2024-02', mockTickets.slice(2)],
        ['2024-01', mockTickets.slice(0, 2)]
      ])

      const result = sortGroupedTicketsByPeriod(groupedTickets, 'asc')

      const keys = Array.from(result.keys())
      expect(keys).toEqual(['2024-01', '2024-02'])
    })

    it('should handle invalid input', () => {
      jest.spyOn(console, 'warn').mockImplementation(() => {})
      
      const result = sortGroupedTicketsByPeriod(null)

      expect(result instanceof Map).toBe(true)
      expect(result.size).toBe(0)
      expect(console.warn).toHaveBeenCalledWith('sortGroupedTicketsByPeriod: groupedTickets must be a Map')
      
      console.warn.mockRestore()
    })
  })

  describe('getTicketGroupStatistics', () => {
    it('should calculate statistics correctly', () => {
      const stats = getTicketGroupStatistics(mockTickets)

      expect(stats.count).toBe(3)
      expect(stats.totalStoryPoints).toBe(10) // 5 + 3 + 2
      expect(stats.averageStoryPoints).toBe(10 / 3)
      expect(stats.typeBreakdown.get('Bug')).toBe(1)
      expect(stats.typeBreakdown.get('Story')).toBe(1)
      expect(stats.typeBreakdown.get('Task')).toBe(1)
      expect(stats.statusBreakdown.get('Done')).toBe(2)
      expect(stats.statusBreakdown.get('In Progress')).toBe(1)
    })

    it('should handle empty array', () => {
      const stats = getTicketGroupStatistics([])

      expect(stats.count).toBe(0)
      expect(stats.totalStoryPoints).toBe(0)
      expect(stats.averageStoryPoints).toBe(0)
      expect(stats.typeBreakdown instanceof Map).toBe(true)
      expect(stats.typeBreakdown.size).toBe(0)
    })

    it('should handle tickets without story points', () => {
      const ticketsWithoutPoints = mockTickets.map(ticket => ({
        ...ticket,
        storyPoints: null
      }))

      const stats = getTicketGroupStatistics(ticketsWithoutPoints)

      expect(stats.totalStoryPoints).toBe(0)
      expect(stats.averageStoryPoints).toBe(0)
    })
  })

  describe('filterTicketsByCriteria', () => {
    it('should filter by issue types', () => {
      const result = filterTicketsByCriteria(mockTickets, { issueTypes: ['Bug'] })

      expect(result).toHaveLength(1)
      expect(result[0].issueType).toBe('Bug')
    })

    it('should filter by statuses', () => {
      const result = filterTicketsByCriteria(mockTickets, { statuses: ['Done'] })

      expect(result).toHaveLength(2)
      expect(result.every(ticket => ticket.status === 'Done')).toBe(true)
    })

    it('should filter by story point range', () => {
      const result = filterTicketsByCriteria(mockTickets, { 
        storyPointRange: { min: 3, max: 5 } 
      })

      expect(result).toHaveLength(2) // TEST-1 (5 points) and TEST-2 (3 points)
      expect(result.every(ticket => ticket.storyPoints >= 3 && ticket.storyPoints <= 5)).toBe(true)
    })

    it('should filter by multiple criteria', () => {
      const result = filterTicketsByCriteria(mockTickets, {
        issueTypes: ['Bug', 'Story'],
        statuses: ['Done', 'In Progress']
      })

      expect(result).toHaveLength(2)
      expect(result.every(ticket => 
        ['Bug', 'Story'].includes(ticket.issueType) &&
        ['Done', 'In Progress'].includes(ticket.status)
      )).toBe(true)
    })

    it('should return all tickets when no filters applied', () => {
      const result = filterTicketsByCriteria(mockTickets, {})

      expect(result).toHaveLength(3)
    })

    it('should handle invalid input', () => {
      const result = filterTicketsByCriteria(null)

      expect(result).toEqual([])
    })

    it('should filter by date range', () => {
      const result = filterTicketsByCriteria(mockTickets, {
        dateRange: {
          startDate: '2024-01-01T00:00:00.000Z',
          endDate: '2024-01-31T23:59:59.999Z'
        }
      })

      expect(result).toHaveLength(3) // All tickets are in January 2024
    })
  })
})