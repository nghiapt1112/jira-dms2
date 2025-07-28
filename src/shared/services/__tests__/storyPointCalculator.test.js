/**
 * Unit Tests for Unified Story Point Calculator
 * 
 * Tests all calculation methods, filtering logic, and backward compatibility
 * to ensure the unified calculator works correctly for all use cases.
 */

const StoryPointCalculator = require('../StoryPointCalculator.js')
const storyPointCalculator = StoryPointCalculator
const { memberConfiguration } = require('../../../constants/memberConfiguration')

// Import verification

// Mock test data
const mockIssues = [
  {
    id: '1',
    assignee: 'Developer A',
    project: 'PROJECT-1',
    status: 'Done',
    storyPoints: 5,
    resolved: '2024-01-15T10:00:00Z',
    updated: '2024-01-14T15:30:00Z',
    created: '2024-01-10T09:00:00Z',
    timeSpentHours: 8
  },
  {
    id: '2',
    assignee: 'Developer B',
    project: 'PROJECT-1',
    status: 'In QA',
    storyPoints: 3,
    resolved: null,
    updated: '2024-01-16T11:00:00Z',
    created: '2024-01-12T10:00:00Z',
    timeSpentHours: 6
  },
  {
    id: '3',
    assignee: 'Developer A',
    project: 'PROJECT-2',
    status: 'Done',
    storyPoints: 8,
    resolved: '2024-01-18T16:00:00Z',
    updated: '2024-01-17T14:00:00Z',
    created: '2024-01-13T08:00:00Z',
    timeSpentHours: 12
  },
  {
    id: '4',
    assignee: 'Unassigned',
    project: 'PROJECT-1',
    status: 'To Do',
    storyPoints: 2,
    resolved: null,
    updated: '2024-01-19T09:00:00Z',
    created: '2024-01-15T11:00:00Z',
    timeSpentHours: 0
  },
  {
    id: '5',
    assignee: 'Developer C',
    project: 'PROJECT-1',
    status: 'Done',
    storyPoints: 0,
    resolved: '2024-01-20T12:00:00Z',
    updated: '2024-01-19T10:00:00Z',
    created: '2024-01-16T13:00:00Z',
    timeSpentHours: 4
  }
]

describe('StoryPointCalculator', () => {
  describe('Static Methods', () => {
    describe('getDefaultStatusFilter()', () => {
      it('should return the default status filter from memberConfiguration', () => {
        const result = StoryPointCalculator.getDefaultStatusFilter()
        expect(result).toEqual(memberConfiguration.filterDefaults.statusFilter)
        expect(Array.isArray(result)).toBe(true)
        expect(result.length).toBeGreaterThan(0)
      })
    })

    describe('getDeliveredDate()', () => {
      it('should return resolved date when available', () => {
        const issue = {
          resolved: '2024-01-15T10:00:00Z',
          updated: '2024-01-14T15:30:00Z',
          created: '2024-01-10T09:00:00Z'
        }
        const result = StoryPointCalculator.getDeliveredDate(issue)
        expect(result).toBe('2024-01-15T10:00:00Z')
      })

      it('should return updated date when resolved is not available', () => {
        const issue = {
          resolved: null,
          updated: '2024-01-14T15:30:00Z',
          created: '2024-01-10T09:00:00Z'
        }
        const result = StoryPointCalculator.getDeliveredDate(issue)
        expect(result).toBe('2024-01-14T15:30:00Z')
      })

      it('should return created date when resolved and updated are not available', () => {
        const issue = {
          resolved: null,
          updated: null,
          created: '2024-01-10T09:00:00Z'
        }
        const result = StoryPointCalculator.getDeliveredDate(issue)
        expect(result).toBe('2024-01-10T09:00:00Z')
      })

      it('should return null when no date is available', () => {
        const issue = {
          resolved: null,
          updated: null,
          created: null
        }
        const result = StoryPointCalculator.getDeliveredDate(issue)
        expect(result).toBeNull()
      })
    })

    describe('isDeliveredStatus()', () => {
      it('should return true for delivered statuses', () => {
        const deliveredStatuses = ['Done', 'In QA', 'QA']
        deliveredStatuses.forEach(status => {
          const issue = { status }
          const result = StoryPointCalculator.isDeliveredStatus(issue)
          expect(result).toBe(true)
        })
      })

      it('should return false for non-delivered statuses', () => {
        const nonDeliveredStatuses = ['To Do', 'In Progress', 'Rejected']
        nonDeliveredStatuses.forEach(status => {
          const issue = { status }
          const result = StoryPointCalculator.isDeliveredStatus(issue)
          expect(result).toBe(false)
        })
      })

      it('should use custom status filter when provided', () => {
        const customFilter = ['Custom Status']
        const issue = { status: 'Custom Status' }
        const result = StoryPointCalculator.isDeliveredStatus(issue, customFilter)
        expect(result).toBe(true)
      })
    })
  })

  describe('Filtering', () => {
    describe('applyFilters()', () => {
      it('should filter out issues without delivered status', () => {
        const result = StoryPointCalculator.applyFilters(mockIssues)
        const nonDeliveredIssues = result.filter(issue => 
          !['Done', 'In QA'].includes(issue.status)
        )
        expect(nonDeliveredIssues).toHaveLength(0)
      })

      it('should filter out issues without valid delivered date', () => {
        const issuesWithNoDate = [
          { ...mockIssues[0], resolved: null, updated: null, created: null }
        ]
        const result = StoryPointCalculator.applyFilters(issuesWithNoDate)
        expect(result).toHaveLength(0)
      })

      it('should filter out unassigned issues', () => {
        const result = StoryPointCalculator.applyFilters(mockIssues)
        const unassignedIssues = result.filter(issue => issue.assignee === 'Unassigned')
        expect(unassignedIssues).toHaveLength(0)
      })

      it('should filter out issues with zero story points', () => {
        const result = StoryPointCalculator.applyFilters(mockIssues)
        const zeroPointIssues = result.filter(issue => issue.storyPoints === 0)
        expect(zeroPointIssues).toHaveLength(0)
      })

      it('should apply project filter', () => {
        const result = StoryPointCalculator.applyFilters(mockIssues, {
          projectFilter: ['PROJECT-1']
        })
        const project2Issues = result.filter(issue => issue.project === 'PROJECT-2')
        expect(project2Issues).toHaveLength(0)
        expect(result.every(issue => issue.project === 'PROJECT-1')).toBe(true)
      })

      it('should apply developer filter', () => {
        const result = StoryPointCalculator.applyFilters(mockIssues, {
          developerFilter: ['Developer A']
        })
        const developerBIssues = result.filter(issue => issue.assignee === 'Developer B')
        expect(developerBIssues).toHaveLength(0)
        expect(result.every(issue => issue.assignee === 'Developer A')).toBe(true)
      })

      it('should add deliveredDate field to filtered issues', () => {
        const result = StoryPointCalculator.applyFilters(mockIssues)
        result.forEach(issue => {
          expect(issue).toHaveProperty('deliveredDate')
          expect(issue.deliveredDate).toBeTruthy()
        })
      })

      it('should handle empty issues array', () => {
        const result = StoryPointCalculator.applyFilters([])
        expect(result).toEqual([])
      })

      it('should handle non-array input', () => {
        const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
        const result = StoryPointCalculator.applyFilters(null)
        expect(result).toEqual([])
        expect(consoleSpy).toHaveBeenCalled()
        consoleSpy.mockRestore()
      })
    })
  })

  describe('Core Calculations', () => {
    describe('calculateTotalStoryPoints()', () => {
      it('should sum story points from filtered issues', () => {
        const filteredIssues = StoryPointCalculator.applyFilters(mockIssues)
        const result = StoryPointCalculator.calculateTotalStoryPoints(filteredIssues)
        // Expected: 5 (Done) + 3 (In QA) + 8 (Done) = 16
        expect(result).toBe(16)
      })

      it('should handle issues with customfield_10028', () => {
        const issuesWithCustomField = [
          {
            ...mockIssues[0],
            storyPoints: undefined,
            fields: { customfield_10028: 10 }
          }
        ]
        const filteredIssues = StoryPointCalculator.applyFilters(issuesWithCustomField)
        const result = StoryPointCalculator.calculateTotalStoryPoints(filteredIssues)
        expect(result).toBe(10)
      })

      it('should return 0 for empty array', () => {
        const result = StoryPointCalculator.calculateTotalStoryPoints([])
        expect(result).toBe(0)
      })
    })

    describe('groupByDeveloper()', () => {
      it('should group story points by developer', () => {
        const filteredIssues = StoryPointCalculator.applyFilters(mockIssues)
        const result = StoryPointCalculator.groupByDeveloper(filteredIssues)
        
        expect(result.get('Developer A')).toBe(13) // 5 + 8
        expect(result.get('Developer B')).toBe(3)
        expect(result.has('Unassigned')).toBe(false)
      })

      it('should handle empty array', () => {
        const result = StoryPointCalculator.groupByDeveloper([])
        expect(result.size).toBe(0)
      })
    })

    describe('groupByTimePeriod()', () => {
      it('should group story points by time period', () => {
        const filteredIssues = StoryPointCalculator.applyFilters(mockIssues)
        const result = StoryPointCalculator.groupByTimePeriod(filteredIssues, 'month')
        
        expect(result.size).toBeGreaterThan(0)
        // Each time period should have developer data
        result.forEach((periodData, timePeriod) => {
          expect(typeof timePeriod).toBe('string')
          expect(typeof periodData).toBe('object')
        })
      })
    })
  })

  describe('Main Calculation Method', () => {
    describe('calculate()', () => {
      it('should return total when no grouping specified', () => {
        const result = StoryPointCalculator.calculate(mockIssues)
        expect(result).toHaveProperty('total')
        expect(typeof result.total).toBe('number')
      })

      it('should group by developer when specified', () => {
        const result = StoryPointCalculator.calculate(mockIssues, {
          groupBy: 'developer'
        })
        expect(result).toHaveProperty('byDeveloper')
        expect(result.byDeveloper).toBeInstanceOf(Map)
      })

      it('should group by time period when specified', () => {
        const result = StoryPointCalculator.calculate(mockIssues, {
          groupBy: 'time',
          timeframe: 'month'
        })
        expect(result).toHaveProperty('byTimePeriod')
        expect(result.byTimePeriod).toBeInstanceOf(Map)
      })

      it('should include breakdowns when requested', () => {
        const result = StoryPointCalculator.calculate(mockIssues, {
          includeBreakdowns: true
        })
        expect(result).toHaveProperty('breakdowns')
        expect(result.breakdowns).toHaveProperty('totalIssues')
        expect(result.breakdowns).toHaveProperty('totalStoryPoints')
        expect(result.breakdowns).toHaveProperty('developers')
        expect(result.breakdowns).toHaveProperty('projects')
      })

      it('should include time metrics when requested', () => {
        const result = StoryPointCalculator.calculate(mockIssues, {
          calculateTimeMetrics: true
        })
        expect(result).toHaveProperty('timeMetrics')
        expect(result.timeMetrics).toHaveProperty('totalTimeSpentHours')
        expect(result.timeMetrics).toHaveProperty('totalStoryPoints')
        expect(result.timeMetrics).toHaveProperty('timePerStoryPoint')
      })

      it('should format as number when requested', () => {
        const result = StoryPointCalculator.calculate(mockIssues, {
          format: 'number'
        })
        expect(typeof result).toBe('number')
      })

      it('should format as array for time period data', () => {
        const result = StoryPointCalculator.calculate(mockIssues, {
          groupBy: 'time',
          timeframe: 'month',
          format: 'array'
        })
        expect(Array.isArray(result)).toBe(true)
        if (result.length > 0) {
          expect(result[0]).toHaveProperty('timePeriod')
        }
      })
    })
  })

  describe('Backward Compatibility Wrappers', () => {
    describe('calculateTotal()', () => {
      it('should work like IssueUtils.calculateTotalStoryPoints', () => {
        const result = StoryPointCalculator.calculateTotal(mockIssues)
        expect(typeof result).toBe('number')
        expect(result).toBeGreaterThan(0)
      })

      it('should filter by developer when specified', () => {
        const result = StoryPointCalculator.calculateTotal(mockIssues, 'Developer A')
        expect(result).toBe(13) // 5 + 8
      })

      it('should apply additional filters', () => {
        const result = StoryPointCalculator.calculateTotal(mockIssues, null, {
          projectFilter: ['PROJECT-1']
        })
        expect(result).toBe(8) // 5 + 3 (only PROJECT-1)
      })
    })

    describe('calculateByTimePeriod()', () => {
      it('should work like IssueUtils.calculateStoryPointsByTimePeriod', () => {
        const result = StoryPointCalculator.calculateByTimePeriod(mockIssues, 'month')
        expect(Array.isArray(result)).toBe(true)
        if (result.length > 0) {
          expect(result[0]).toHaveProperty('timePeriod')
        }
      })

      it('should apply filters correctly', () => {
        const result = StoryPointCalculator.calculateByTimePeriod(mockIssues, 'month', {
          projectFilter: ['PROJECT-1']
        })
        expect(Array.isArray(result)).toBe(true)
      })
    })

    describe('calculateSummaryStats()', () => {
      it('should work like ticketGroupingService.getTicketSummaryStats', () => {
        const result = StoryPointCalculator.calculateSummaryStats(mockIssues)
        expect(result).toHaveProperty('breakdowns')
        expect(result.breakdowns).toHaveProperty('totalIssues')
        expect(result.breakdowns).toHaveProperty('totalStoryPoints')
      })
    })
  })

  describe('Validation', () => {
    describe('validateConsistency()', () => {
      it('should detect inconsistencies between different data sources', () => {
        const teamData = [
          { timePeriod: '2024-01', 'Developer A': 5, 'Developer B': 3 }
        ]
        const individualData = new Map([
          ['Developer A', [{ storyPoints: 5 }]],
          ['Developer B', [{ storyPoints: 3 }]]
        ])
        const velocityData = [
          { storyPoints: 5 },
          { storyPoints: 3 }
        ]

        const result = StoryPointCalculator.validateConsistency({
          teamData,
          individualData,
          velocityData
        })

        expect(result).toHaveProperty('isConsistent')
        expect(result).toHaveProperty('inconsistencies')
        expect(result).toHaveProperty('totals')
      })

      it('should return consistent when all totals match', () => {
        const teamData = [{ timePeriod: '2024-01', 'Developer A': 5 }]
        const individualData = new Map([['Developer A', [{ storyPoints: 5 }]]])
        const velocityData = [{ storyPoints: 5 }]

        const result = StoryPointCalculator.validateConsistency({
          teamData,
          individualData,
          velocityData
        })

        expect(result.isConsistent).toBe(true)
        expect(result.inconsistencies).toHaveLength(0)
      })
    })
  })

  describe('Helper Methods', () => {
    describe('calculateTotalFromTimeBasedData()', () => {
      it('should calculate total from time-based data array', () => {
        const timeData = [
          { timePeriod: '2024-01', 'Developer A': 5, 'Developer B': 3 },
          { timePeriod: '2024-02', 'Developer A': 8 }
        ]
        const result = StoryPointCalculator.calculateTotalFromTimeBasedData(timeData)
        expect(result).toBe(16) // 5 + 3 + 8
      })

      it('should handle empty array', () => {
        const result = StoryPointCalculator.calculateTotalFromTimeBasedData([])
        expect(result).toBe(0)
      })

      it('should handle non-array input', () => {
        const result = StoryPointCalculator.calculateTotalFromTimeBasedData(null)
        expect(result).toBe(0)
      })
    })

    describe('calculateTotalFromGroupedTickets()', () => {
      it('should calculate total from grouped tickets map', () => {
        const groupedTickets = new Map([
          ['Developer A', [{ storyPoints: 5 }, { storyPoints: 8 }]],
          ['Developer B', [{ storyPoints: 3 }]]
        ])
        const result = StoryPointCalculator.calculateTotalFromGroupedTickets(groupedTickets)
        expect(result).toBe(16) // 5 + 8 + 3
      })

      it('should handle empty map', () => {
        const result = StoryPointCalculator.calculateTotalFromGroupedTickets(new Map())
        expect(result).toBe(0)
      })

      it('should handle non-map input', () => {
        const result = StoryPointCalculator.calculateTotalFromGroupedTickets(null)
        expect(result).toBe(0)
      })
    })
  })

  describe('Singleton Export', () => {
    it('should export singleton instance', () => {
      expect(storyPointCalculator).toBe(StoryPointCalculator)
      expect(typeof storyPointCalculator.calculate).toBe('function')
    })
  })
}) 