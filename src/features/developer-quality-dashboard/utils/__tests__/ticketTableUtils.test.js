import {
  formatTicketDate,
  getIssueTypeDisplay,
  getStatusDisplay,
  getSeverityDisplay,
  formatStoryPoints,
  formatPeriodLabel,
  sortTickets,
  getTicketSummaryStats,
  matchesSearch
} from '../ticketTableUtils'

// Mock time utilities
jest.mock('../../../../shared/utils/timeUtils', () => ({
  formatDateDDMMYYYY: jest.fn((date) => {
    if (!date) return 'Invalid Date'
    const dateObj = typeof date === 'string' ? new Date(date) : date
    if (isNaN(dateObj.getTime())) return 'Invalid Date'
    return '15/01/2024' // Mock formatted date
  }),
  getWeekDateRange: jest.fn((weekKey) => ({
    formatted: 'Mock Week Range'
  }))
}))

describe('ticketTableUtils', () => {
  const mockTicket = {
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
  }

  describe('formatTicketDate', () => {
    it('should format ticket date using resolved date first', () => {
      const result = formatTicketDate(mockTicket)
      expect(result).toBe('15/01/2024')
    })

    it('should fall back to updated date when no resolved date', () => {
      const ticketWithoutResolved = { ...mockTicket, resolved: null }
      const result = formatTicketDate(ticketWithoutResolved)
      expect(result).toBe('15/01/2024')
    })

    it('should return fallback text when no dates available', () => {
      const ticketWithoutDates = { ...mockTicket, resolved: null, updated: null, created: null }
      const result = formatTicketDate(ticketWithoutDates)
      expect(result).toBe('No date')
    })

    it('should handle null ticket', () => {
      const result = formatTicketDate(null)
      expect(result).toBe('No date')
    })

    it('should support custom fallback text', () => {
      const result = formatTicketDate(null, { fallbackText: 'Custom fallback' })
      expect(result).toBe('Custom fallback')
    })

    it('should support relative date formatting', () => {
      const recentDate = new Date()
      recentDate.setDate(recentDate.getDate() - 1) // Yesterday
      
      const recentTicket = { ...mockTicket, resolved: recentDate.toISOString() }
      const result = formatTicketDate(recentTicket, { format: 'relative' })
      expect(result).toBe('Yesterday')
    })
  })

  describe('getIssueTypeDisplay', () => {
    it('should return correct display properties for bug', () => {
      const result = getIssueTypeDisplay('Bug')
      expect(result.label).toBe('Bug')
      expect(result.color).toBe('error')
      expect(result.icon).toBe('BugReport')
      expect(result.priority).toBe(1)
    })

    it('should return correct display properties for story', () => {
      const result = getIssueTypeDisplay('Story')
      expect(result.label).toBe('Story')
      expect(result.color).toBe('primary')
      expect(result.icon).toBe('History')
    })

    it('should handle unknown issue types', () => {
      const result = getIssueTypeDisplay('Unknown Type')
      expect(result.label).toBe('Unknown')
      expect(result.color).toBe('default')
      expect(result.priority).toBe(99)
    })

    it('should handle null/undefined input', () => {
      const result = getIssueTypeDisplay(null)
      expect(result.label).toBe('Unknown')
    })

    it('should be case insensitive', () => {
      const result = getIssueTypeDisplay('BUG')
      expect(result.label).toBe('Bug')
    })
  })

  describe('getStatusDisplay', () => {
    it('should return correct display properties for done status', () => {
      const result = getStatusDisplay('Done')
      expect(result.label).toBe('Done')
      expect(result.color).toBe('success')
      expect(result.icon).toBe('CheckCircle')
      expect(result.category).toBe('completed')
    })

    it('should return correct display properties for in progress', () => {
      const result = getStatusDisplay('In Progress')
      expect(result.label).toBe('In Progress')
      expect(result.color).toBe('primary')
      expect(result.category).toBe('active')
    })

    it('should handle unknown statuses', () => {
      const result = getStatusDisplay('Unknown Status')
      expect(result.label).toBe('Unknown')
      expect(result.category).toBe('unknown')
      expect(result.priority).toBe(99)
    })

    it('should be case insensitive', () => {
      const result = getStatusDisplay('DONE')
      expect(result.label).toBe('Done')
    })
  })

  describe('getSeverityDisplay', () => {
    it('should return correct display properties for critical', () => {
      const result = getSeverityDisplay('Critical')
      expect(result.label).toBe('Critical')
      expect(result.color).toBe('error')
      expect(result.weight).toBe(4)
      expect(result.priority).toBe(1)
    })

    it('should return correct display properties for major', () => {
      const result = getSeverityDisplay('Major')
      expect(result.label).toBe('Major')
      expect(result.color).toBe('warning')
      expect(result.weight).toBe(3)
    })

    it('should handle unknown severities', () => {
      const result = getSeverityDisplay('Unknown Severity')
      expect(result.label).toBe('Unknown')
      expect(result.weight).toBe(0)
      expect(result.priority).toBe(99)
    })
  })

  describe('formatStoryPoints', () => {
    it('should format positive story points', () => {
      const result = formatStoryPoints(5)
      expect(result.display).toBe('5')
      expect(result.value).toBe(5)
      expect(result.color).toBe('text.primary')
      expect(result.weight).toBe('medium')
    })

    it('should handle zero story points', () => {
      const result = formatStoryPoints(0)
      expect(result.display).toBe('-')
      expect(result.value).toBe(0)
      expect(result.color).toBe('text.secondary')
    })

    it('should show zero when explicitly requested', () => {
      const result = formatStoryPoints(0, { showZero: true })
      expect(result.display).toBe('0')
    })

    it('should add suffix when requested', () => {
      const result = formatStoryPoints(5, { addSuffix: true })
      expect(result.display).toBe('5 SP')
    })

    it('should handle null/undefined values', () => {
      const result = formatStoryPoints(null)
      expect(result.display).toBe('-')
      expect(result.value).toBe(0)
    })
  })

  describe('formatPeriodLabel', () => {
    it('should format month period correctly', () => {
      const result = formatPeriodLabel('2024-01', 'month')
      expect(result).toBe('January 2024')
    })

    it('should format quarter period correctly', () => {
      const result = formatPeriodLabel('2024-Q1', 'quarter')
      expect(result).toBe('Q1 2024')
    })

    it('should format week period correctly', () => {
      const result = formatPeriodLabel('2024-W03', 'week')
      expect(result).toBe('Week 2024-W03 (Mock Week Range)')
    })

    it('should handle invalid period keys', () => {
      const result = formatPeriodLabel('invalid', 'month')
      expect(result).toBe('invalid') // Fallback to raw key
    })

    it('should handle null period key', () => {
      const result = formatPeriodLabel(null, 'month')
      expect(result).toBe('Unknown Period')
    })

    it('should handle invalid month numbers', () => {
      const result = formatPeriodLabel('2024-13', 'month')
      expect(result).toBe('2024-13') // Fallback to raw key
    })
  })

  describe('sortTickets', () => {
    const mockTickets = [
      { key: 'TEST-3', issueType: 'Task', status: 'Done', storyPoints: 2, resolved: '2024-01-12T00:00:00.000Z' },
      { key: 'TEST-1', issueType: 'Bug', status: 'Done', storyPoints: 5, resolved: '2024-01-20T00:00:00.000Z' },
      { key: 'TEST-2', issueType: 'Story', status: 'In Progress', storyPoints: 3, updated: '2024-01-25T00:00:00.000Z' }
    ]

    it('should sort by key in ascending order', () => {
      const result = sortTickets(mockTickets, 'key', 'asc')
      expect(result.map(t => t.key)).toEqual(['TEST-1', 'TEST-2', 'TEST-3'])
    })

    it('should sort by story points in descending order', () => {
      const result = sortTickets(mockTickets, 'storyPoints', 'desc')
      expect(result.map(t => t.storyPoints)).toEqual([5, 3, 2])
    })

    it('should sort by date in descending order', () => {
      const result = sortTickets(mockTickets, 'date', 'desc')
      // Most recent date should be first
      expect(result[0].key).toBe('TEST-2') // Has most recent updated date
    })

    it('should handle empty array', () => {
      const result = sortTickets([])
      expect(result).toEqual([])
    })

    it('should handle invalid input', () => {
      const result = sortTickets(null)
      expect(result).toEqual([])
    })

    it('should use secondary sort by key for consistency', () => {
      const ticketsWithSamePoints = [
        { key: 'TEST-2', storyPoints: 3 },
        { key: 'TEST-1', storyPoints: 3 }
      ]
      
      const result = sortTickets(ticketsWithSamePoints, 'storyPoints')
      expect(result[0].key).toBe('TEST-1') // Secondary sort by key
    })
  })

  describe('getTicketSummaryStats', () => {
    const mockTickets = [
      { issueType: 'Bug', status: 'Done', severity: 'Major', storyPoints: 5 },
      { issueType: 'Story', status: 'In Progress', severity: 'Minor', storyPoints: 3 },
      { issueType: 'Bug', status: 'Done', severity: 'Critical', storyPoints: 2 }
    ]

    it('should calculate statistics correctly', () => {
      const stats = getTicketSummaryStats(mockTickets)
      
      expect(stats.count).toBe(3)
      expect(stats.totalStoryPoints).toBe(10)
      expect(stats.averageStoryPoints).toBe(10 / 3)
      expect(stats.typeBreakdown['Bug']).toBe(2)
      expect(stats.typeBreakdown['Story']).toBe(1)
      expect(stats.statusBreakdown['Done']).toBe(2)
      expect(stats.statusBreakdown['In Progress']).toBe(1)
      expect(stats.severityBreakdown['Major']).toBe(1)
      expect(stats.severityBreakdown['Minor']).toBe(1)
      expect(stats.severityBreakdown['Critical']).toBe(1)
    })

    it('should handle empty array', () => {
      const stats = getTicketSummaryStats([])
      
      expect(stats.count).toBe(0)
      expect(stats.totalStoryPoints).toBe(0)
      expect(stats.averageStoryPoints).toBe(0)
      expect(Object.keys(stats.typeBreakdown)).toHaveLength(0)
    })

    it('should handle tickets without story points', () => {
      const ticketsWithoutPoints = mockTickets.map(ticket => ({ ...ticket, storyPoints: null }))
      const stats = getTicketSummaryStats(ticketsWithoutPoints)
      
      expect(stats.totalStoryPoints).toBe(0)
      expect(stats.averageStoryPoints).toBe(0)
    })
  })

  describe('matchesSearch', () => {
    const ticket = {
      key: 'TEST-123',
      summary: 'Fix login validation logic',
      issueType: 'Bug',
      status: 'Done',
      severity: 'Major',
      project: 'Authentication',
      assignee: 'John Doe',
      rootCause: 'Logic Error'
    }

    it('should match by ticket key', () => {
      expect(matchesSearch(ticket, 'TEST')).toBe(true)
      expect(matchesSearch(ticket, '123')).toBe(true)
    })

    it('should match by summary', () => {
      expect(matchesSearch(ticket, 'login')).toBe(true)
      expect(matchesSearch(ticket, 'validation')).toBe(true)
    })

    it('should match by issue type', () => {
      expect(matchesSearch(ticket, 'bug')).toBe(true)
    })

    it('should match by status', () => {
      expect(matchesSearch(ticket, 'done')).toBe(true)
    })

    it('should match by assignee', () => {
      expect(matchesSearch(ticket, 'john')).toBe(true)
      expect(matchesSearch(ticket, 'doe')).toBe(true)
    })

    it('should be case insensitive', () => {
      expect(matchesSearch(ticket, 'BUG')).toBe(true)
      expect(matchesSearch(ticket, 'AUTHENTICATION')).toBe(true)
    })

    it('should return false for non-matching terms', () => {
      expect(matchesSearch(ticket, 'xyz')).toBe(false)
      expect(matchesSearch(ticket, 'nonexistent')).toBe(false)
    })

    it('should return true for empty search term', () => {
      expect(matchesSearch(ticket, '')).toBe(true)
      expect(matchesSearch(ticket, null)).toBe(true)
    })

    it('should handle null ticket', () => {
      expect(matchesSearch(null, 'test')).toBe(true)
    })
  })
})