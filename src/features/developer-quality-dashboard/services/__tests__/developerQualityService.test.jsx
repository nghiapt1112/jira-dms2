/**
 * Unit tests for Developer Quality Service
 * Following .cursorrules testing requirements
 */

import { developerQualityService } from '../developerQualityService'

describe('developerQualityService', () => {
  // Mock JIRA issue data
  const mockIssues = [
    {
      id: '1',
      key: 'PROJ-1',
      fields: {
        summary: 'Fix login logic error',
        description: 'Logic error in authentication',
        assignee: { displayName: 'John Doe' },
        status: { name: 'Done' },
        issuetype: { name: 'Bug' },
        priority: { name: 'High' },
        project: { key: 'PROJ' },
        created: '2024-01-15T10:00:00.000Z',
        resolutiondate: '2024-01-20T10:00:00.000Z'
      }
    },
    {
      id: '2',
      key: 'PROJ-2',
      fields: {
        summary: 'Implement user story',
        description: 'New feature implementation',
        assignee: { displayName: 'Jane Smith' },
        status: { name: 'In Progress' },
        issuetype: { name: 'Story' },
        priority: { name: 'Medium' },
        project: { key: 'PROJ' },
        created: '2024-01-16T10:00:00.000Z',
        resolutiondate: null
      }
    },
    {
      id: '3',
      key: 'PROJ-3',
      fields: {
        summary: 'Performance optimization',
        description: 'Fix slow API response',
        assignee: { displayName: 'John Doe' },
        status: { name: 'Done' },
        issuetype: { name: 'Bug' },
        priority: { name: 'Critical' },
        project: { key: 'PROJ' },
        created: '2024-02-01T10:00:00.000Z',
        resolutiondate: '2024-02-05T10:00:00.000Z'
      }
    }
  ]

  describe('processJiraIssuesForDeveloperQuality', () => {
    it('should process issues and return complete data structure', () => {
      const result = developerQualityService.processJiraIssuesForDeveloperQuality(mockIssues)
      
      expect(result).toHaveProperty('metrics')
      expect(result).toHaveProperty('chartData')
      expect(result).toHaveProperty('indices')
      expect(result).toHaveProperty('filterOptions')
      expect(result).toHaveProperty('minimalIssues')
      expect(result).toHaveProperty('metadata')
      
      expect(result.minimalIssues).toHaveLength(3)
      expect(result.metadata.totalIssues).toBe(3)
      expect(result.metadata.processingTime).toBeGreaterThan(0)
    })

    it('should handle empty issues array', () => {
      const result = developerQualityService.processJiraIssuesForDeveloperQuality([])
      
      expect(result.metrics.teamContribution.totalContributions).toBe(0)
      expect(result.metrics.bugAnalysis.totalBugs).toBe(0)
      expect(result.minimalIssues).toHaveLength(0)
      expect(result.metadata.totalIssues).toBe(0)
    })

    it('should handle issues with missing fields gracefully', () => {
      const incompleteIssue = {
        id: '4',
        key: 'PROJ-4',
        fields: {
          summary: 'Test issue'
          // Missing many fields
        }
      }
      
      const result = developerQualityService.processJiraIssuesForDeveloperQuality([incompleteIssue])
      
      expect(result.minimalIssues[0]).toEqual({
        id: '4',
        key: 'PROJ-4',
        summary: 'Test issue',
        assignee: 'Unassigned',
        status: 'Unknown',
        issueType: 'Unknown',
        severity: 'Unknown',
        project: 'Unknown',
        rootCause: 'Unknown',
        created: null,
        resolved: null
      })
    })
  })

  describe('initializeMetrics', () => {
    it('should return properly structured metrics object', () => {
      const metrics = developerQualityService.initializeMetrics()
      
      expect(metrics).toHaveProperty('teamContribution')
      expect(metrics).toHaveProperty('bugAnalysis')
      expect(metrics).toHaveProperty('rootCauseAnalysis')
      expect(metrics).toHaveProperty('developerRootCause')
      expect(metrics).toHaveProperty('bugRateAnalysis')
      
      expect(metrics.teamContribution.totalContributions).toBe(0)
      expect(metrics.teamContribution.developerStats).toBeInstanceOf(Map)
      expect(metrics.bugAnalysis.severityDistribution).toEqual({
        Critical: 0,
        High: 0,
        Medium: 0,
        Low: 0,
        Unknown: 0
      })
    })
  })

  describe('initializeChartData', () => {
    it('should return properly structured chart data object', () => {
      const chartData = developerQualityService.initializeChartData()
      
      expect(chartData).toHaveProperty('teamContributionChart')
      expect(chartData).toHaveProperty('bugTrendChart')
      expect(chartData).toHaveProperty('rootCauseChart')
      expect(chartData).toHaveProperty('developerRootCauseChart')
      
      expect(chartData.teamContributionChart.type).toBe('bar')
      expect(chartData.bugTrendChart.type).toBe('line')
      expect(chartData.rootCauseChart.type).toBe('pie')
      expect(chartData.developerRootCauseChart.type).toBe('stacked-bar')
    })
  })

  describe('initializeIndices', () => {
    it('should return properly structured indices object', () => {
      const indices = developerQualityService.initializeIndices()
      
      expect(indices).toHaveProperty('byDeveloper')
      expect(indices).toHaveProperty('byProject')
      expect(indices).toHaveProperty('byIssueType')
      expect(indices).toHaveProperty('byStatus')
      expect(indices).toHaveProperty('bySeverity')
      expect(indices).toHaveProperty('byRootCause')
      expect(indices).toHaveProperty('byMonth')
      expect(indices).toHaveProperty('byWeek')
      expect(indices).toHaveProperty('byQuarter')
      
      expect(indices.byDeveloper).toBeInstanceOf(Map)
      expect(indices.byDeveloperAndProject).toBeInstanceOf(Map)
    })
  })

  describe('processDeveloperQualityMetrics', () => {
    it('should process team contribution metrics correctly', () => {
      const data = {
        metrics: developerQualityService.initializeMetrics(),
        filterOptions: developerQualityService.initializeFilterOptions()
      }
      
      developerQualityService.processDeveloperQualityMetrics(mockIssues[0], 0, data)
      
      expect(data.metrics.teamContribution.totalContributions).toBe(1)
      expect(data.metrics.teamContribution.developerStats.has('John Doe')).toBe(true)
      
      const johnStats = data.metrics.teamContribution.developerStats.get('John Doe')
      expect(johnStats.contributions).toBe(1)
      expect(johnStats.bugs).toBe(1)
      expect(johnStats.projects.has('PROJ')).toBe(true)
    })

    it('should process bug analysis metrics correctly', () => {
      const data = {
        metrics: developerQualityService.initializeMetrics(),
        filterOptions: developerQualityService.initializeFilterOptions()
      }
      
      developerQualityService.processDeveloperQualityMetrics(mockIssues[0], 0, data)
      
      expect(data.metrics.bugAnalysis.totalBugs).toBe(1)
      expect(data.metrics.bugAnalysis.severityDistribution.High).toBe(1)
      expect(data.metrics.bugAnalysis.monthlyBugTrend.has('2024-01')).toBe(true)
      
      const monthData = data.metrics.bugAnalysis.monthlyBugTrend.get('2024-01')
      expect(monthData.total).toBe(1)
      expect(monthData.resolved).toBe(1)
      expect(monthData.pending).toBe(0)
    })

    it('should handle unassigned issues', () => {
      const unassignedIssue = {
        ...mockIssues[0],
        fields: {
          ...mockIssues[0].fields,
          assignee: null
        }
      }
      
      const data = {
        metrics: developerQualityService.initializeMetrics(),
        filterOptions: developerQualityService.initializeFilterOptions()
      }
      
      developerQualityService.processDeveloperQualityMetrics(unassignedIssue, 0, data)
      
      expect(data.metrics.teamContribution.totalContributions).toBe(0)
      expect(data.filterOptions.developers.has('Unassigned')).toBe(true)
    })
  })

  describe('buildFilterIndices', () => {
    it('should build indices correctly', () => {
      const indices = developerQualityService.initializeIndices()
      
      developerQualityService.buildFilterIndices(mockIssues[0], 0, indices)
      
      expect(indices.byDeveloper.has('John Doe')).toBe(true)
      expect(indices.byDeveloper.get('John Doe')).toEqual([0])
      expect(indices.byProject.has('PROJ')).toBe(true)
      expect(indices.byIssueType.has('Bug')).toBe(true)
      expect(indices.byStatus.has('Done')).toBe(true)
      expect(indices.bySeverity.has('High')).toBe(true)
      expect(indices.byMonth.has('2024-01')).toBe(true)
    })

    it('should build composite indices correctly', () => {
      const indices = developerQualityService.initializeIndices()
      
      developerQualityService.buildFilterIndices(mockIssues[0], 0, indices)
      
      expect(indices.byDeveloperAndProject.has('John Doe:PROJ')).toBe(true)
      expect(indices.byProjectAndMonth.has('PROJ:2024-01')).toBe(true)
      expect(indices.byDeveloperAndSeverity.has('John Doe:High')).toBe(true)
    })
  })

  describe('addToIndex', () => {
    it('should add values to index correctly', () => {
      const indexMap = new Map()
      
      developerQualityService.addToIndex(indexMap, 'key1', 'value1')
      developerQualityService.addToIndex(indexMap, 'key1', 'value2')
      developerQualityService.addToIndex(indexMap, 'key2', 'value3')
      
      expect(indexMap.get('key1')).toEqual(['value1', 'value2'])
      expect(indexMap.get('key2')).toEqual(['value3'])
    })

    it('should ignore unknown keys', () => {
      const indexMap = new Map()
      
      developerQualityService.addToIndex(indexMap, 'Unknown', 'value1')
      developerQualityService.addToIndex(indexMap, null, 'value2')
      developerQualityService.addToIndex(indexMap, undefined, 'value3')
      
      expect(indexMap.size).toBe(0)
    })
  })

  describe('extractRootCause', () => {
    it('should extract Logic Error correctly', () => {
      const issue = {
        fields: {
          summary: 'Fix calculation logic',
          description: 'Algorithm is incorrect'
        }
      }
      
      const rootCause = developerQualityService.extractRootCause(issue)
      expect(rootCause).toBe('Logic Error')
    })

    it('should extract Integration Issue correctly', () => {
      const issue = {
        fields: {
          summary: 'API integration problem',
          description: 'Service not responding'
        }
      }
      
      const rootCause = developerQualityService.extractRootCause(issue)
      expect(rootCause).toBe('Integration Issue')
    })

    it('should extract Performance issue correctly', () => {
      const issue = {
        fields: {
          summary: 'Slow response time',
          description: 'Timeout occurring'
        }
      }
      
      const rootCause = developerQualityService.extractRootCause(issue)
      expect(rootCause).toBe('Performance')
    })

    it('should return Unknown for unmatched cases', () => {
      const issue = {
        fields: {
          summary: 'Random issue',
          description: 'Something else'
        }
      }
      
      const rootCause = developerQualityService.extractRootCause(issue)
      expect(rootCause).toBe('Unknown')
    })
  })

  describe('getWeekFromDate', () => {
    it('should return correct week format', () => {
      const week = developerQualityService.getWeekFromDate('2024-01-15T10:00:00.000Z')
      expect(week).toMatch(/^\d{4}-W\d{2}$/)
      expect(week).toBe('2024-W03')
    })
  })

  describe('getQuarterFromDate', () => {
    it('should return correct quarter for Q1', () => {
      const quarter = developerQualityService.getQuarterFromDate('2024-01-15T10:00:00.000Z')
      expect(quarter).toBe('2024-Q1')
    })

    it('should return correct quarter for Q2', () => {
      const quarter = developerQualityService.getQuarterFromDate('2024-04-15T10:00:00.000Z')
      expect(quarter).toBe('2024-Q2')
    })

    it('should return correct quarter for Q3', () => {
      const quarter = developerQualityService.getQuarterFromDate('2024-07-15T10:00:00.000Z')
      expect(quarter).toBe('2024-Q3')
    })

    it('should return correct quarter for Q4', () => {
      const quarter = developerQualityService.getQuarterFromDate('2024-10-15T10:00:00.000Z')
      expect(quarter).toBe('2024-Q4')
    })
  })

  describe('finalizeMetrics', () => {
    it('should calculate averages correctly', () => {
      const metrics = developerQualityService.initializeMetrics()
      
      // Add some test data
      metrics.teamContribution.developerStats.set('John Doe', {
        contributions: 10,
        bugs: 2,
        projects: new Set(['PROJ1', 'PROJ2'])
      })
      metrics.teamContribution.developerStats.set('Jane Smith', {
        contributions: 8,
        bugs: 1,
        projects: new Set(['PROJ1'])
      })
      metrics.teamContribution.totalContributions = 18
      
      developerQualityService.finalizeMetrics(metrics)
      
      expect(metrics.teamContribution.averageContribution).toBe(9)
      expect(metrics.teamContribution.topContributors).toHaveLength(2)
      expect(metrics.teamContribution.topContributors[0].developer).toBe('John Doe')
      expect(metrics.teamContribution.topContributors[0].contributions).toBe(10)
      expect(metrics.teamContribution.topContributors[0].percentage).toBeCloseTo(55.56, 2)
      
      expect(metrics.bugRateAnalysis.developers.has('John Doe')).toBe(true)
      const johnBugRate = metrics.bugRateAnalysis.developers.get('John Doe')
      expect(johnBugRate.bugRate).toBe(20)
      expect(johnBugRate.projects).toEqual(['PROJ1', 'PROJ2'])
    })
  })

  describe('finalizeChartData', () => {
    it('should finalize chart data correctly', () => {
      const chartData = developerQualityService.initializeChartData()
      const metrics = developerQualityService.initializeMetrics()
      
      // Add test data
      metrics.teamContribution.topContributors = [
        { developer: 'John Doe', contributions: 10, percentage: 55.56 },
        { developer: 'Jane Smith', contributions: 8, percentage: 44.44 }
      ]
      
      metrics.bugAnalysis.monthlyBugTrend.set('2024-01', { total: 5, resolved: 3, pending: 2 })
      metrics.bugAnalysis.monthlyBugTrend.set('2024-02', { total: 3, resolved: 2, pending: 1 })
      metrics.bugAnalysis.totalBugs = 8
      
      metrics.rootCauseAnalysis.categories.set('Logic Error', 5)
      metrics.rootCauseAnalysis.categories.set('Integration Issue', 3)
      
      developerQualityService.finalizeChartData(chartData, metrics)
      
      expect(chartData.teamContributionChart.data).toHaveLength(2)
      expect(chartData.bugTrendChart.data).toHaveLength(2)
      expect(chartData.bugTrendChart.data[0].month).toBe('2024-01')
      expect(chartData.rootCauseChart.data).toHaveLength(2)
      expect(chartData.rootCauseChart.data[0].name).toBe('Logic Error')
      expect(chartData.rootCauseChart.data[0].percentage).toBe(62.5)
    })
  })

  describe('finalizeFilterOptions', () => {
    it('should convert Sets to sorted arrays', () => {
      const filterOptions = developerQualityService.initializeFilterOptions()
      
      filterOptions.developers.add('John Doe')
      filterOptions.developers.add('Jane Smith')
      filterOptions.developers.add('Bob Wilson')
      
      filterOptions.projects.add('PROJ-B')
      filterOptions.projects.add('PROJ-A')
      
      developerQualityService.finalizeFilterOptions(filterOptions)
      
      expect(filterOptions.developers).toEqual(['Bob Wilson', 'Jane Smith', 'John Doe'])
      expect(filterOptions.projects).toEqual(['PROJ-A', 'PROJ-B'])
    })
  })

  describe('calculateCacheSize', () => {
    it('should calculate cache size', () => {
      const data = {
        metrics: { test: 'value' },
        indices: new Map([['key', 'value']]),
        filterOptions: { developers: new Set(['John']) }
      }
      
      const size = developerQualityService.calculateCacheSize(data)
      expect(size).toBeGreaterThan(0)
      expect(typeof size).toBe('number')
    })
  })

  describe('integration test with real data structure', () => {
    it('should process complete workflow correctly', () => {
      const result = developerQualityService.processJiraIssuesForDeveloperQuality(mockIssues)
      
      // Check metrics
      expect(result.metrics.teamContribution.totalContributions).toBe(3)
      expect(result.metrics.teamContribution.topContributors).toHaveLength(2)
      expect(result.metrics.bugAnalysis.totalBugs).toBe(2)
      expect(result.metrics.bugAnalysis.severityDistribution.High).toBe(1)
      expect(result.metrics.bugAnalysis.severityDistribution.Critical).toBe(1)
      
      // Check chart data
      expect(result.chartData.teamContributionChart.data).toHaveLength(2)
      expect(result.chartData.bugTrendChart.data).toHaveLength(2)
      expect(result.chartData.rootCauseChart.data).toHaveLength(2)
      
      // Check indices
      expect(result.indices.byDeveloper.has('John Doe')).toBe(true)
      expect(result.indices.byDeveloper.get('John Doe')).toEqual([0, 2])
      expect(result.indices.byDeveloper.has('Jane Smith')).toBe(true)
      expect(result.indices.byDeveloper.get('Jane Smith')).toEqual([1])
      
      // Check filter options
      expect(result.filterOptions.developers).toContain('John Doe')
      expect(result.filterOptions.developers).toContain('Jane Smith')
      expect(result.filterOptions.projects).toContain('PROJ')
      expect(result.filterOptions.issueTypes).toContain('Bug')
      expect(result.filterOptions.issueTypes).toContain('Story')
      
      // Check minimal issues
      expect(result.minimalIssues).toHaveLength(3)
      expect(result.minimalIssues[0].assignee).toBe('John Doe')
      expect(result.minimalIssues[1].assignee).toBe('Jane Smith')
      
      // Check metadata
      expect(result.metadata.totalIssues).toBe(3)
      expect(result.metadata.processingTime).toBeGreaterThan(0)
      expect(result.metadata.cacheSize).toBeGreaterThan(0)
    })
  })
}) 