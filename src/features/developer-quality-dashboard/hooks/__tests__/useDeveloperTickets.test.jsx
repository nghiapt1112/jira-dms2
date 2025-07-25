import { renderHook, act } from '@testing-library/react'
import { useDeveloperTickets } from '../useDeveloperTickets'
import { useDeveloperQualityStore } from '../../store/developerQualityStore'

// Mock the store
jest.mock('../../store/developerQualityStore')

// Mock performance monitor
jest.mock('../../utils/PerformanceMonitor', () => ({
  performanceMonitor: {
    startTimer: jest.fn(() => ({ end: jest.fn(), duration: 50 })),
    recordMetric: jest.fn()
  }
}))

describe('useDeveloperTickets', () => {
  const mockMinimalIssues = [
    {
      id: '1',
      key: 'TEST-1',
      summary: 'Test issue 1',
      assignee: 'John Doe',
      status: 'Done',
      issueType: 'Bug',
      severity: 'Major',
      project: 'Test Project',
      rootCause: 'Logic Error',
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
      rootCause: null,
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
      rootCause: 'Implementation Issue',
      updated: '2024-01-10T14:20:00.000Z',
      resolved: '2024-01-12T16:30:00.000Z',
      storyPoints: 2
    }
  ]

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks()
    
    // Default mock store state
    useDeveloperQualityStore.mockReturnValue({
      data: {
        minimalIssues: mockMinimalIssues
      },
      filters: {
        timeframe: 'month',
        projects: [] // Default: no project filtering
      }
    })
  })

  describe('Basic functionality', () => {
    it('should return empty state when no developer name provided', () => {
      const { result } = renderHook(() => useDeveloperTickets(''))

      expect(result.current.isEmpty).toBe(true)
      expect(result.current.totalTickets).toBe(0)
      expect(result.current.groupedTickets.size).toBe(0)
    })

    it('should return empty state when no data available', () => {
      useDeveloperQualityStore.mockReturnValue({
        data: null,
        filters: { timeframe: 'month' }
      })

      const { result } = renderHook(() => useDeveloperTickets('John Doe'))

      expect(result.current.isEmpty).toBe(true)
      expect(result.current.totalTickets).toBe(0)
      expect(result.current.error).toBe(null)
    })

    it('should filter tickets by developer name', () => {
      const { result } = renderHook(() => useDeveloperTickets('John Doe'))

      expect(result.current.isEmpty).toBe(false)
      expect(result.current.totalTickets).toBe(2)
      expect(result.current.groupedTickets.size).toBeGreaterThan(0)
    })

    it('should return empty result for non-existent developer', () => {
      const { result } = renderHook(() => useDeveloperTickets('Non Existent'))

      expect(result.current.isEmpty).toBe(true)
      expect(result.current.totalTickets).toBe(0)
    })
  })

  describe('Time grouping', () => {
    it('should group tickets by month by default', () => {
      const { result } = renderHook(() => useDeveloperTickets('John Doe'))

      expect(result.current.metadata.timeframe).toBe('month')
      expect(result.current.groupedTickets.size).toBe(1) // Both tickets are in 2024-01
      expect(result.current.groupedTickets.has('2024-01')).toBe(true)
    })

    it('should group tickets by week when timeframe is week', () => {
      useDeveloperQualityStore.mockReturnValue({
        data: { minimalIssues: mockMinimalIssues },
        filters: { timeframe: 'week', projects: [] }
      })

      const { result } = renderHook(() => useDeveloperTickets('John Doe'))

      expect(result.current.metadata.timeframe).toBe('week')
      expect(result.current.groupedTickets.size).toBeGreaterThan(0)
    })

    it('should group tickets by quarter when timeframe is quarter', () => {
      useDeveloperQualityStore.mockReturnValue({
        data: { minimalIssues: mockMinimalIssues },
        filters: { timeframe: 'quarter', projects: [] }
      })

      const { result } = renderHook(() => useDeveloperTickets('John Doe'))

      expect(result.current.metadata.timeframe).toBe('quarter')
      expect(result.current.groupedTickets.has('2024-Q1')).toBe(true)
    })
  })

  describe('Ticket sorting', () => {
    it('should sort tickets within groups by resolved date desc', () => {
      const { result } = renderHook(() => useDeveloperTickets('John Doe'))

      const monthTickets = result.current.groupedTickets.get('2024-01')
      expect(monthTickets).toBeDefined()
      expect(monthTickets.length).toBe(2)
      
      // First ticket should be the one with later resolved date
      expect(monthTickets[0].key).toBe('TEST-2') // Has updated date only (more recent)
      expect(monthTickets[1].key).toBe('TEST-1') // Has resolved date (older)
    })

    it('should handle tickets without resolved dates', () => {
      const ticketsWithoutResolved = [
        {
          ...mockMinimalIssues[0],
          resolved: null,
          updated: '2024-01-25T10:00:00.000Z'
        },
        {
          ...mockMinimalIssues[1],
          resolved: null,
          updated: '2024-01-24T10:00:00.000Z'
        }
      ]

      useDeveloperQualityStore.mockReturnValue({
        data: { minimalIssues: ticketsWithoutResolved },
        filters: { timeframe: 'month', projects: [] }
      })

      const { result } = renderHook(() => useDeveloperTickets('John Doe'))

      const monthTickets = result.current.groupedTickets.get('2024-01')
      expect(monthTickets[0].key).toBe('TEST-1') // More recent updated date
    })
  })

  describe('Project filtering', () => {
    it('should show all projects when no projects filter applied', () => {
      // Default state has empty projects array
      const { result } = renderHook(() => useDeveloperTickets('John Doe'))

      expect(result.current.isEmpty).toBe(false)
      expect(result.current.totalTickets).toBe(2) // Both TEST-1 and TEST-2 are from John Doe
      
      // Should include tickets from Test Project
      const allTickets = Array.from(result.current.groupedTickets.values()).flat()
      const projects = [...new Set(allTickets.map(t => t.project))]
      expect(projects).toContain('Test Project')
    })

    it('should filter by single selected project', () => {
      useDeveloperQualityStore.mockReturnValue({
        data: { minimalIssues: mockMinimalIssues },
        filters: { 
          timeframe: 'month',
          projects: ['Test Project'] // Only show Test Project
        }
      })

      const { result } = renderHook(() => useDeveloperTickets('John Doe'))

      expect(result.current.isEmpty).toBe(false)
      expect(result.current.totalTickets).toBe(2) // Both John's tickets are from Test Project
      
      // All tickets should be from Test Project
      const allTickets = Array.from(result.current.groupedTickets.values()).flat()
      expect(allTickets.every(ticket => ticket.project === 'Test Project')).toBe(true)
    })

    it('should filter by multiple selected projects', () => {
      useDeveloperQualityStore.mockReturnValue({
        data: { minimalIssues: mockMinimalIssues },
        filters: { 
          timeframe: 'month',
          projects: ['Test Project', 'Other Project'] // Multiple projects
        }
      })

      const { result } = renderHook(() => useDeveloperTickets('John Doe'))

      expect(result.current.isEmpty).toBe(false)
      expect(result.current.totalTickets).toBe(2) // John's tickets from allowed projects
      
      // All tickets should be from allowed projects
      const allTickets = Array.from(result.current.groupedTickets.values()).flat()
      const allowedProjects = ['Test Project', 'Other Project']
      expect(allTickets.every(ticket => allowedProjects.includes(ticket.project))).toBe(true)
    })

    it('should return empty when developer has no tickets in selected projects', () => {
      useDeveloperQualityStore.mockReturnValue({
        data: { minimalIssues: mockMinimalIssues },
        filters: { 
          timeframe: 'month',
          projects: ['Non-existent Project'] // Project that doesn't exist
        }
      })

      const { result } = renderHook(() => useDeveloperTickets('John Doe'))

      expect(result.current.isEmpty).toBe(true)
      expect(result.current.totalTickets).toBe(0)
      expect(result.current.groupedTickets.size).toBe(0)
    })

    it('should filter out tickets from non-selected projects', () => {
      useDeveloperQualityStore.mockReturnValue({
        data: { minimalIssues: mockMinimalIssues },
        filters: { 
          timeframe: 'month',
          projects: ['Other Project'] // Only show Other Project
        }
      })

      const { result } = renderHook(() => useDeveloperTickets('John Doe'))

      // John Doe has no tickets in 'Other Project', only Jane Smith does
      expect(result.current.isEmpty).toBe(true)
      expect(result.current.totalTickets).toBe(0)
    })

    it('should work correctly with cross-developer project filtering', () => {
      useDeveloperQualityStore.mockReturnValue({
        data: { minimalIssues: mockMinimalIssues },
        filters: { 
          timeframe: 'month',
          projects: ['Other Project'] // Only show Other Project
        }
      })

      // Test with Jane Smith who has tickets in Other Project
      const { result } = renderHook(() => useDeveloperTickets('Jane Smith'))

      expect(result.current.isEmpty).toBe(false)
      expect(result.current.totalTickets).toBe(1) // Jane has 1 ticket in Other Project
      
      const allTickets = Array.from(result.current.groupedTickets.values()).flat()
      expect(allTickets[0].project).toBe('Other Project')
      expect(allTickets[0].key).toBe('TEST-3')
    })

    it('should handle null projects filter gracefully', () => {
      useDeveloperQualityStore.mockReturnValue({
        data: { minimalIssues: mockMinimalIssues },
        filters: { 
          timeframe: 'month',
          projects: null // Null projects filter
        }
      })

      const { result } = renderHook(() => useDeveloperTickets('John Doe'))

      // Should behave like no filter (show all projects)
      expect(result.current.isEmpty).toBe(false)
      expect(result.current.totalTickets).toBe(2)
    })

    it('should handle undefined projects filter gracefully', () => {
      useDeveloperQualityStore.mockReturnValue({
        data: { minimalIssues: mockMinimalIssues },
        filters: { 
          timeframe: 'month'
          // projects: undefined (not set)
        }
      })

      const { result } = renderHook(() => useDeveloperTickets('John Doe'))

      // Should behave like no filter (show all projects)
      expect(result.current.isEmpty).toBe(false)
      expect(result.current.totalTickets).toBe(2)
    })
  })

  describe('Analytics calculations', () => {
    it('should calculate total story points correctly', () => {
      const { result } = renderHook(() => useDeveloperTickets('John Doe'))

      expect(result.current.totalStoryPoints).toBe(8) // 5 + 3
    })

    it('should calculate average story points correctly', () => {
      const { result } = renderHook(() => useDeveloperTickets('John Doe'))

      expect(result.current.averageStoryPoints).toBe(4) // (5 + 3) / 2
    })

    it('should break down tickets by type', () => {
      const { result } = renderHook(() => useDeveloperTickets('John Doe'))

      expect(result.current.ticketsByType.get('Bug')).toBe(1)
      expect(result.current.ticketsByType.get('Story')).toBe(1)
    })

    it('should break down tickets by status', () => {
      const { result } = renderHook(() => useDeveloperTickets('John Doe'))

      expect(result.current.ticketsByStatus.get('Done')).toBe(1)
      expect(result.current.ticketsByStatus.get('In Progress')).toBe(1)
    })
  })

  describe('Error handling', () => {
    it('should handle errors gracefully', () => {
      // Mock an error in the data processing
      useDeveloperQualityStore.mockReturnValue({
        data: { minimalIssues: null }, // This will cause an error
        filters: { timeframe: 'month' }
      })

      const { result } = renderHook(() => useDeveloperTickets('John Doe'))

      expect(result.current.isEmpty).toBe(true)
      expect(result.current.error).toBe(null) // Hook handles errors gracefully
    })

    it('should handle tickets with invalid dates', () => {
      const ticketsWithInvalidDates = [
        {
          ...mockMinimalIssues[0],
          resolved: 'invalid-date',
          updated: null
        }
      ]

      useDeveloperQualityStore.mockReturnValue({
        data: { minimalIssues: ticketsWithInvalidDates },
        filters: { timeframe: 'month' }
      })

      const { result } = renderHook(() => useDeveloperTickets('John Doe'))

      // Should still work, just skip tickets with invalid dates
      expect(result.current.error).toBe(null)
    })
  })

  describe('Performance monitoring', () => {
    it('should record performance metrics', () => {
      const { performanceMonitor } = require('../../utils/PerformanceMonitor')
      
      renderHook(() => useDeveloperTickets('John Doe'))

      expect(performanceMonitor.startTimer).toHaveBeenCalledWith('developerTicketFiltering')
      expect(performanceMonitor.recordMetric).toHaveBeenCalledWith('developerTicketCacheHit', 1)
    })
  })

  describe('Memoization', () => {
    it('should memoize results when inputs do not change', () => {
      const { result, rerender } = renderHook(() => useDeveloperTickets('John Doe'))
      
      const firstResult = result.current

      // Rerender with same inputs
      rerender()

      // Should return the same object reference (memoized)
      expect(result.current).toBe(firstResult)
    })

    it('should recalculate when developer changes', () => {
      const { result, rerender } = renderHook(
        ({ developer }) => useDeveloperTickets(developer),
        { initialProps: { developer: 'John Doe' } }
      )
      
      const firstResult = result.current

      // Change developer
      rerender({ developer: 'Jane Smith' })

      // Should return different result
      expect(result.current).not.toBe(firstResult)
      expect(result.current.totalTickets).toBe(1) // Jane has 1 ticket
    })

    it('should recalculate when timeframe changes', () => {
      const { result, rerender } = renderHook(() => useDeveloperTickets('John Doe'))
      
      const monthResult = result.current

      // Change timeframe
      useDeveloperQualityStore.mockReturnValue({
        data: { minimalIssues: mockMinimalIssues },
        filters: { timeframe: 'quarter', projects: [] }
      })

      rerender()

      expect(result.current).not.toBe(monthResult)
      expect(result.current.metadata.timeframe).toBe('quarter')
    })

    it('should recalculate when projects filter changes', () => {
      const { result, rerender } = renderHook(() => useDeveloperTickets('John Doe'))
      
      const allProjectsResult = result.current

      // Change projects filter to specific project
      useDeveloperQualityStore.mockReturnValue({
        data: { minimalIssues: mockMinimalIssues },
        filters: { 
          timeframe: 'month',
          projects: ['Test Project'] // Filter to specific project
        }
      })

      rerender()

      expect(result.current).not.toBe(allProjectsResult)
      // Should still have same tickets since John's tickets are all from Test Project
      expect(result.current.totalTickets).toBe(2)
      
      // Now filter to a project John doesn't have tickets in
      useDeveloperQualityStore.mockReturnValue({
        data: { minimalIssues: mockMinimalIssues },
        filters: { 
          timeframe: 'month',
          projects: ['Other Project'] // John has no tickets here
        }
      })

      rerender()

      expect(result.current.isEmpty).toBe(true)
      expect(result.current.totalTickets).toBe(0)
    })
  })
})