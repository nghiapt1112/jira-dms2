/**
 * Unit tests for Filter Service
 * Following .cursorrules testing requirements
 */

import { filterService } from '../filterService'

describe('filterService', () => {
  // Mock cache data
  const mockCacheData = {
    indices: {
      byDeveloper: new Map([
        ['John Doe', [0, 2, 4]],
        ['Jane Smith', [1, 3]],
        ['Bob Wilson', [5]]
      ]),
      byProject: new Map([
        ['PROJ-A', [0, 1, 2]],
        ['PROJ-B', [3, 4, 5]]
      ]),
      byIssueType: new Map([
        ['Bug', [0, 2, 4]],
        ['Story', [1, 3, 5]]
      ]),
      byStatus: new Map([
        ['Done', [0, 1, 2]],
        ['In Progress', [3, 4, 5]]
      ]),
      bySeverity: new Map([
        ['High', [0, 2]],
        ['Medium', [1, 3]],
        ['Low', [4, 5]]
      ]),
      byRootCause: new Map([
        ['Logic Error', [0, 2]],
        ['Integration Issue', [1, 3]],
        ['Performance', [4, 5]]
      ]),
      byMonth: new Map([
        ['2024-01', [0, 1, 2]],
        ['2024-02', [3, 4, 5]]
      ]),
      byQuarter: new Map([
        ['2024-Q1', [0, 1, 2, 3, 4, 5]]
      ])
    },
    minimalIssues: [
      {
        id: '1',
        key: 'PROJ-1',
        assignee: 'John Doe',
        project: 'PROJ-A',
        issueType: 'Bug',
        severity: 'High',
        rootCause: 'Logic Error',
        created: '2024-01-15T10:00:00.000Z',
        resolved: '2024-01-20T10:00:00.000Z'
      },
      {
        id: '2',
        key: 'PROJ-2',
        assignee: 'Jane Smith',
        project: 'PROJ-A',
        issueType: 'Story',
        severity: 'Medium',
        rootCause: 'Integration Issue',
        created: '2024-01-16T10:00:00.000Z',
        resolved: null
      },
      {
        id: '3',
        key: 'PROJ-3',
        assignee: 'John Doe',
        project: 'PROJ-A',
        issueType: 'Bug',
        severity: 'High',
        rootCause: 'Logic Error',
        created: '2024-01-17T10:00:00.000Z',
        resolved: '2024-01-22T10:00:00.000Z'
      },
      {
        id: '4',
        key: 'PROJ-4',
        assignee: 'Jane Smith',
        project: 'PROJ-B',
        issueType: 'Story',
        severity: 'Medium',
        rootCause: 'Integration Issue',
        created: '2024-02-01T10:00:00.000Z',
        resolved: null
      },
      {
        id: '5',
        key: 'PROJ-5',
        assignee: 'John Doe',
        project: 'PROJ-B',
        issueType: 'Bug',
        severity: 'Low',
        rootCause: 'Performance',
        created: '2024-02-02T10:00:00.000Z',
        resolved: '2024-02-05T10:00:00.000Z'
      },
      {
        id: '6',
        key: 'PROJ-6',
        assignee: 'Bob Wilson',
        project: 'PROJ-B',
        issueType: 'Story',
        severity: 'Low',
        rootCause: 'Performance',
        created: '2024-02-03T10:00:00.000Z',
        resolved: null
      }
    ]
  }

  describe('applyFilters', () => {
    it('should return filtered data with all properties', () => {
      const filters = {
        developers: ['John Doe']
      }
      
      const result = filterService.applyFilters(filters, mockCacheData)
      
      expect(result).toHaveProperty('filteredIssues')
      expect(result).toHaveProperty('filteredMetrics')
      expect(result).toHaveProperty('filteredChartData')
      expect(result).toHaveProperty('appliedFilters')
      expect(result).toHaveProperty('totalResults')
      expect(result).toHaveProperty('processingTime')
      
      expect(result.filteredIssues).toHaveLength(3)
      expect(result.totalResults).toBe(3)
      expect(result.appliedFilters).toEqual(filters)
      expect(result.processingTime).toBeGreaterThan(0)
    })

    it('should return null for invalid cache data', () => {
      const filters = { developers: ['John Doe'] }
      
      expect(filterService.applyFilters(filters, null)).toBeNull()
      expect(filterService.applyFilters(filters, {})).toBeNull()
      expect(filterService.applyFilters(filters, { indices: null })).toBeNull()
    })

    it('should return all data when no filters applied', () => {
      const filters = {}
      
      const result = filterService.applyFilters(filters, mockCacheData)
      
      expect(result.filteredIssues).toHaveLength(6)
      expect(result.totalResults).toBe(6)
    })
  })

  describe('getFilteredIndices', () => {
    it('should filter by developer correctly', () => {
      const filters = { developers: ['John Doe'] }
      const result = filterService.getFilteredIndices(filters, mockCacheData.indices)
      
      expect(result).toEqual(new Set([0, 2, 4]))
    })

    it('should filter by multiple developers', () => {
      const filters = { developers: ['John Doe', 'Jane Smith'] }
      const result = filterService.getFilteredIndices(filters, mockCacheData.indices)
      
      expect(result).toEqual(new Set([0, 1, 2, 3, 4]))
    })

    it('should filter by project correctly', () => {
      const filters = { projects: ['PROJ-A'] }
      const result = filterService.getFilteredIndices(filters, mockCacheData.indices)
      
      expect(result).toEqual(new Set([0, 1, 2]))
    })

    it('should filter by issue type correctly', () => {
      const filters = { issueTypes: ['Bug'] }
      const result = filterService.getFilteredIndices(filters, mockCacheData.indices)
      
      expect(result).toEqual(new Set([0, 2, 4]))
    })

    it('should filter by status correctly', () => {
      const filters = { statuses: ['Done'] }
      const result = filterService.getFilteredIndices(filters, mockCacheData.indices)
      
      expect(result).toEqual(new Set([0, 1, 2]))
    })

    it('should filter by severity correctly', () => {
      const filters = { severities: ['High'] }
      const result = filterService.getFilteredIndices(filters, mockCacheData.indices)
      
      expect(result).toEqual(new Set([0, 2]))
    })

    it('should filter by root cause correctly', () => {
      const filters = { rootCauses: ['Logic Error'] }
      const result = filterService.getFilteredIndices(filters, mockCacheData.indices)
      
      expect(result).toEqual(new Set([0, 2]))
    })

    it('should apply intersection of multiple filters', () => {
      const filters = {
        developers: ['John Doe'],
        projects: ['PROJ-A']
      }
      const result = filterService.getFilteredIndices(filters, mockCacheData.indices)
      
      // John Doe: [0, 2, 4] AND PROJ-A: [0, 1, 2] = [0, 2]
      expect(result).toEqual(new Set([0, 2]))
    })

    it('should return empty set when no intersection', () => {
      const filters = {
        developers: ['John Doe'],
        projects: ['PROJ-C'] // Non-existent project
      }
      const result = filterService.getFilteredIndices(filters, mockCacheData.indices)
      
      expect(result).toEqual(new Set())
    })

    it('should return all indices when no filters', () => {
      const filters = {}
      const result = filterService.getFilteredIndices(filters, mockCacheData.indices)
      
      expect(result).toEqual(new Set([0, 1, 2, 3, 4, 5]))
    })
  })

  describe('getDateRangeIndices', () => {
    it('should filter by month correctly', () => {
      const dateRange = {
        type: 'month',
        values: ['2024-01']
      }
      const result = filterService.getDateRangeIndices(dateRange, mockCacheData.indices)
      
      expect(result).toEqual(new Set([0, 1, 2]))
    })

    it('should filter by multiple months', () => {
      const dateRange = {
        type: 'month',
        values: ['2024-01', '2024-02']
      }
      const result = filterService.getDateRangeIndices(dateRange, mockCacheData.indices)
      
      expect(result).toEqual(new Set([0, 1, 2, 3, 4, 5]))
    })

    it('should filter by quarter correctly', () => {
      const dateRange = {
        type: 'quarter',
        values: ['2024-Q1']
      }
      const result = filterService.getDateRangeIndices(dateRange, mockCacheData.indices)
      
      expect(result).toEqual(new Set([0, 1, 2, 3, 4, 5]))
    })

    it('should return empty set for invalid date range', () => {
      const dateRange = {
        type: 'month',
        values: ['2024-03'] // Non-existent month
      }
      const result = filterService.getDateRangeIndices(dateRange, mockCacheData.indices)
      
      expect(result).toEqual(new Set())
    })

    it('should handle missing values', () => {
      const dateRange = { type: 'month' }
      const result = filterService.getDateRangeIndices(dateRange, mockCacheData.indices)
      
      expect(result).toEqual(new Set())
    })
  })

  describe('getFilteredIssues', () => {
    it('should return filtered issues in correct order', () => {
      const indices = new Set([0, 2, 4])
      const result = filterService.getFilteredIssues(indices, mockCacheData.minimalIssues)
      
      expect(result).toHaveLength(3)
      expect(result[0].id).toBe('1')
      expect(result[1].id).toBe('3')
      expect(result[2].id).toBe('5')
    })

    it('should handle empty indices', () => {
      const indices = new Set()
      const result = filterService.getFilteredIssues(indices, mockCacheData.minimalIssues)
      
      expect(result).toHaveLength(0)
    })

    it('should filter out undefined issues', () => {
      const indices = new Set([0, 10, 2]) // Index 10 doesn't exist
      const result = filterService.getFilteredIssues(indices, mockCacheData.minimalIssues)
      
      expect(result).toHaveLength(2)
      expect(result[0].id).toBe('1')
      expect(result[1].id).toBe('3')
    })
  })

  describe('recalculateMetricsFromIndices', () => {
    it('should recalculate metrics correctly', () => {
      const indices = new Set([0, 2, 4]) // John Doe's issues
      const result = filterService.recalculateMetricsFromIndices(indices, mockCacheData)
      
      expect(result.teamContribution.totalContributions).toBe(3)
      expect(result.teamContribution.topContributors).toHaveLength(1)
      expect(result.teamContribution.topContributors[0].developer).toBe('John Doe')
      expect(result.teamContribution.topContributors[0].contributions).toBe(3)
      
      expect(result.bugAnalysis.totalBugs).toBe(3) // All 3 issues are bugs for John Doe
      expect(result.bugAnalysis.severityDistribution.High).toBe(2)
      expect(result.bugAnalysis.severityDistribution.Low).toBe(1)
    })

    it('should handle empty indices', () => {
      const indices = new Set()
      const result = filterService.recalculateMetricsFromIndices(indices, mockCacheData)
      
      expect(result.teamContribution.totalContributions).toBe(0)
      expect(result.teamContribution.topContributors).toHaveLength(0)
      expect(result.bugAnalysis.totalBugs).toBe(0)
    })

    it('should calculate bug rates correctly', () => {
      const indices = new Set([0, 1, 2]) // Mixed issues
      const result = filterService.recalculateMetricsFromIndices(indices, mockCacheData)
      
      // After finalizeFilteredMetrics, developers should be an array
      expect(Array.isArray(result.bugRateAnalysis.developers)).toBe(true)
      expect(result.bugRateAnalysis.developers.length).toBeGreaterThan(0)
      
      const johnStats = result.bugRateAnalysis.developers.find(dev => dev.developer === 'John Doe')
      expect(johnStats.bugRate).toBe(100) // 1 bug out of 1 issue
      
              const janeStats = result.bugRateAnalysis.developers.find(dev => dev.developer === 'Jane Smith')
      expect(janeStats.bugRate).toBe(0) // 0 bugs out of 1 issue
    })
  })

  describe('recalculateChartDataFromIndices', () => {
    it('should recalculate chart data correctly', () => {
      const indices = new Set([0, 1, 2])
      const result = filterService.recalculateChartDataFromIndices(indices, mockCacheData)
      
      expect(result.teamContributionChart.data).toHaveLength(2)
      expect(result.teamContributionChart.data[0].name).toBe('John Doe')
      expect(result.teamContributionChart.data[1].name).toBe('Jane Smith')
      
      expect(result.bugTrendChart.data).toHaveLength(1)
      expect(result.bugTrendChart.data[0].month).toBe('2024-01')
      
      expect(result.rootCauseChart.data).toHaveLength(2)
      expect(result.rootCauseChart.data[0].name).toBe('Logic Error')
      expect(result.rootCauseChart.data[1].name).toBe('Integration Issue')
    })

    it('should handle empty indices', () => {
      const indices = new Set()
      const result = filterService.recalculateChartDataFromIndices(indices, mockCacheData)
      
      expect(result.teamContributionChart.data).toHaveLength(0)
      expect(result.bugTrendChart.data).toHaveLength(0)
      expect(result.rootCauseChart.data).toHaveLength(0)
      expect(result.developerRootCauseChart.data).toHaveLength(0)
    })
  })

  describe('finalizeFilteredMetrics', () => {
    it('should finalize metrics correctly', () => {
      const metrics = {
        teamContribution: {
          totalContributions: 5,
          developerStats: new Map([
            ['John Doe', { contributions: 3, bugs: 2, projects: new Set(['PROJ-A', 'PROJ-B']) }],
            ['Jane Smith', { contributions: 2, bugs: 0, projects: new Set(['PROJ-A']) }]
          ])
        },
        bugRateAnalysis: {
          developers: new Map()
        }
      }
      
      filterService.finalizeFilteredMetrics(metrics)
      
      expect(metrics.teamContribution.averageContribution).toBe(2.5)
      expect(metrics.teamContribution.topContributors).toHaveLength(2)
      expect(metrics.teamContribution.topContributors[0].developer).toBe('John Doe')
      expect(metrics.teamContribution.topContributors[0].percentage).toBe(60)
      
      const johnDev = metrics.bugRateAnalysis.developers.find(dev => dev.developer === 'John Doe')
      expect(johnDev).toBeTruthy()
      expect(johnDev.bugRate).toBeCloseTo(66.67, 2)
      expect(metrics.bugRateAnalysis.teamAverage).toBeCloseTo(33.33, 2)
    })

    it('should handle empty developer stats', () => {
      const metrics = {
        teamContribution: {
          totalContributions: 0,
          developerStats: new Map()
        },
        bugRateAnalysis: {
          developers: new Map()
        }
      }
      
      filterService.finalizeFilteredMetrics(metrics)
      
      expect(metrics.teamContribution.averageContribution).toBe(0)
      expect(metrics.teamContribution.topContributors).toHaveLength(0)
      expect(metrics.bugRateAnalysis.teamAverage).toBe(0)
    })
  })

  describe('areFiltersEmpty', () => {
    it('should return true for empty filters', () => {
      expect(filterService.areFiltersEmpty(null)).toBe(true)
      expect(filterService.areFiltersEmpty(undefined)).toBe(true)
      expect(filterService.areFiltersEmpty({})).toBe(true)
      expect(filterService.areFiltersEmpty({
        developers: [],
        projects: [],
        issueTypes: []
      })).toBe(true)
    })

    it('should return false for non-empty filters', () => {
      expect(filterService.areFiltersEmpty({
        developers: ['John Doe']
      })).toBe(false)
      
      expect(filterService.areFiltersEmpty({
        projects: ['PROJ-A']
      })).toBe(false)
      
      expect(filterService.areFiltersEmpty({
        dateRange: { type: 'month', values: ['2024-01'] }
      })).toBe(false)
    })
  })

  describe('getFilterSummary', () => {
    it('should return correct summary for empty filters', () => {
      const summary = filterService.getFilterSummary({})
      
      expect(summary.totalFilters).toBe(0)
      expect(summary.activeFilters).toHaveLength(0)
    })

    it('should return correct summary for single filter', () => {
      const filters = {
        developers: ['John Doe']
      }
      const summary = filterService.getFilterSummary(filters)
      
      expect(summary.totalFilters).toBe(1)
      expect(summary.activeFilters).toHaveLength(1)
      expect(summary.activeFilters[0]).toEqual({
        type: 'developers',
        count: 1,
        label: '1 developer'
      })
    })

    it('should return correct summary for multiple filters', () => {
      const filters = {
        developers: ['John Doe', 'Jane Smith'],
        projects: ['PROJ-A', 'PROJ-B', 'PROJ-C'],
        issueTypes: ['Bug'],
        dateRange: { type: 'month', values: ['2024-01', '2024-02'] }
      }
      const summary = filterService.getFilterSummary(filters)
      
      expect(summary.totalFilters).toBe(4)
      expect(summary.activeFilters).toHaveLength(4)
      
      expect(summary.activeFilters[0].label).toBe('2 developers')
      expect(summary.activeFilters[1].label).toBe('3 projects')
      expect(summary.activeFilters[2].label).toBe('1 issue type')
      expect(summary.activeFilters[3].label).toBe('2 months')
    })

    it('should handle singular vs plural correctly', () => {
      const filters = {
        developers: ['John Doe'],
        projects: ['PROJ-A'],
        severities: ['High']
      }
      const summary = filterService.getFilterSummary(filters)
      
      expect(summary.activeFilters[0].label).toBe('1 developer')
      expect(summary.activeFilters[1].label).toBe('1 project')
      expect(summary.activeFilters[2].label).toBe('1 severity')
    })
  })

  describe('integration test with complex filters', () => {
    it('should handle complex multi-filter scenario', () => {
      const filters = {
        developers: ['John Doe', 'Jane Smith'],
        projects: ['PROJ-A'],
        issueTypes: ['Bug', 'Story'],
        severities: ['High', 'Medium']
      }
      
      const result = filterService.applyFilters(filters, mockCacheData)
      
      // Expected: John Doe + Jane Smith, PROJ-A, Bug + Story, High + Medium
      // Intersection should be issues 0, 1, 2
      expect(result.filteredIssues).toHaveLength(3)
      expect(result.totalResults).toBe(3)
      
      expect(result.filteredMetrics.teamContribution.totalContributions).toBe(3)
      expect(result.filteredMetrics.bugAnalysis.totalBugs).toBe(2)
      
      expect(result.filteredChartData.teamContributionChart.data).toHaveLength(2)
      expect(result.processingTime).toBeGreaterThan(0)
    })

    it('should handle filter with no results', () => {
      const filters = {
        developers: ['John Doe'],
        projects: ['PROJ-C'] // Non-existent project
      }
      
      const result = filterService.applyFilters(filters, mockCacheData)
      
      expect(result.filteredIssues).toHaveLength(0)
      expect(result.totalResults).toBe(0)
      expect(result.filteredMetrics.teamContribution.totalContributions).toBe(0)
    })
  })
}) 