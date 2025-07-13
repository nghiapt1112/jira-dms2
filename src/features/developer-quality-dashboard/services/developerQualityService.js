/**
 * Developer Quality Service
 * Processes JIRA issues for developer quality metrics with pre-calculated cache structures
 * Following .cursorrules conventions - camelCase naming, performance optimizations
 */

import { JIRA_CONSTANTS } from '../../../constants/jiraConstants'

export const developerQualityService = {
  /**
   * Process JIRA issues for developer quality metrics during the main processing loop
   * @param {Array} issues - Array of JIRA issues
   * @returns {Object} Pre-processed developer quality data with metrics, chartData, and indices
   */
  processJiraIssuesForDeveloperQuality: (issues) => {
    const startTime = performance.now()
    
    // Initialize data structures
    const developerQualityData = {
      metrics: developerQualityService.initializeMetrics(),
      chartData: developerQualityService.initializeChartData(),
      indices: developerQualityService.initializeIndices(),
      filterOptions: developerQualityService.initializeFilterOptions(),
      minimalIssues: []
    }
    
    // SINGLE LOOP PROCESSING - integrate with existing main loop
    issues.forEach((issue, index) => {
      // Process developer quality metrics
      developerQualityService.processDeveloperQualityMetrics(issue, index, developerQualityData)
      
      // Build indices for instant filtering
      developerQualityService.buildFilterIndices(issue, index, developerQualityData.indices)
      
      // Keep minimal issue data for popups
      developerQualityData.minimalIssues.push({
        id: issue.id,
        key: issue.key,
        summary: issue.fields?.summary || 'No summary',
        assignee: issue.fields?.assignee?.displayName || 'Unassigned',
        status: issue.fields?.status?.name || 'Unknown',
        issueType: issue.fields?.issuetype?.name || 'Unknown',
        severity: issue.fields?.priority?.name || 'Unknown',
        project: issue.fields?.project?.key || 'Unknown',
        rootCause: developerQualityService.extractRootCause(issue),
        created: issue.fields?.created || null,
        resolved: issue.fields?.resolutiondate || null
      })
    })
    
    // Post-process calculations
    developerQualityService.finalizeMetrics(developerQualityData.metrics)
    developerQualityService.finalizeChartData(developerQualityData.chartData, developerQualityData.metrics)
    developerQualityService.finalizeFilterOptions(developerQualityData.filterOptions, developerQualityData.indices)
    
    const processingTime = performance.now() - startTime
    console.log(`Developer Quality processing completed in ${processingTime}ms`)
    
    return {
      ...developerQualityData,
      metadata: {
        processingTime,
        totalIssues: issues.length,
        cacheSize: developerQualityService.calculateCacheSize(developerQualityData)
      }
    }
  },

  /**
   * Initialize metrics structure
   */
  initializeMetrics: () => ({
    teamContribution: {
      totalContributions: 0,
      averageContribution: 0,
      contributionTrend: 'stable',
      topContributors: [],
      developerStats: new Map()
    },
    bugAnalysis: {
      totalBugs: 0,
      bugTrend: 'stable',
      severityDistribution: {
        Critical: 0,
        High: 0,
        Medium: 0,
        Low: 0,
        Unknown: 0
      },
      monthlyBugTrend: new Map()
    },
    rootCauseAnalysis: {
      categories: new Map(),
      trends: new Map()
    },
    developerRootCause: {
      developers: new Map()
    },
    bugRateAnalysis: {
      developers: new Map(),
      teamAverage: 0,
      benchmarks: {
        excellent: '<10%',
        good: '10-15%',
        needsImprovement: '>15%'
      }
    }
  }),

  /**
   * Initialize chart data structure
   */
  initializeChartData: () => ({
    teamContributionChart: {
      type: 'bar',
      data: [],
      config: {
        xAxisKey: 'name',
        yAxisKey: 'contributions',
        colorScheme: 'blue'
      }
    },
    bugTrendChart: {
      type: 'line',
      data: [],
      config: {
        xAxisKey: 'month',
        lines: ['total', 'resolved', 'pending']
      }
    },
    rootCauseChart: {
      type: 'pie',
      data: []
    },
    developerRootCauseChart: {
      type: 'stacked-bar',
      data: []
    }
  }),

  /**
   * Initialize indices for instant filtering
   */
  initializeIndices: () => ({
    // Primary indices
    byDeveloper: new Map(),
    byProject: new Map(),
    byIssueType: new Map(),
    byStatus: new Map(),
    bySeverity: new Map(),
    byRootCause: new Map(),
    
    // Time-based indices
    byMonth: new Map(),
    byWeek: new Map(),
    byQuarter: new Map(),
    
    // Composite indices for complex filtering
    byDeveloperAndProject: new Map(),
    byProjectAndMonth: new Map(),
    byDeveloperAndSeverity: new Map()
  }),

  /**
   * Initialize filter options
   */
  initializeFilterOptions: () => ({
    developers: new Set(),
    projects: new Set(),
    issueTypes: new Set(),
    statuses: new Set(),
    severities: new Set(),
    rootCauses: new Set(),
    dateRanges: {
      months: new Set(),
      weeks: new Set(),
      quarters: new Set()
    }
  }),

  /**
   * Process individual issue for developer quality metrics
   */
  processDeveloperQualityMetrics: (issue, index, data) => {
    const assignee = issue.fields?.assignee?.displayName || 'Unassigned'
    const project = issue.fields?.project?.key || 'Unknown'
    const issueType = issue.fields?.issuetype?.name || 'Unknown'
    const status = issue.fields?.status?.name || 'Unknown'
    const severity = issue.fields?.priority?.name || 'Unknown'
    const rootCause = developerQualityService.extractRootCause(issue)
    const created = issue.fields?.created
    const resolved = issue.fields?.resolutiondate

    // Team contribution metrics
    if (assignee !== 'Unassigned') {
      if (!data.metrics.teamContribution.developerStats.has(assignee)) {
        data.metrics.teamContribution.developerStats.set(assignee, {
          contributions: 0,
          bugs: 0,
          projects: new Set()
        })
      }
      
      const devStats = data.metrics.teamContribution.developerStats.get(assignee)
      devStats.contributions += 1
      devStats.projects.add(project)
      
      if (issueType === 'Bug') {
        devStats.bugs += 1
      }
      
      data.metrics.teamContribution.totalContributions += 1
    }

    // Bug analysis metrics
    if (issueType === 'Bug') {
      data.metrics.bugAnalysis.totalBugs += 1
      data.metrics.bugAnalysis.severityDistribution[severity] = 
        (data.metrics.bugAnalysis.severityDistribution[severity] || 0) + 1
      
      // Monthly bug trend
      if (created) {
        const month = created.substring(0, 7) // '2024-01'
        if (!data.metrics.bugAnalysis.monthlyBugTrend.has(month)) {
          data.metrics.bugAnalysis.monthlyBugTrend.set(month, { total: 0, resolved: 0, pending: 0 })
        }
        const monthData = data.metrics.bugAnalysis.monthlyBugTrend.get(month)
        monthData.total += 1
        
        if (resolved) {
          monthData.resolved += 1
        } else {
          monthData.pending += 1
        }
      }
    }

    // Root cause analysis
    if (rootCause && rootCause !== 'Unknown') {
      data.metrics.rootCauseAnalysis.categories.set(
        rootCause,
        (data.metrics.rootCauseAnalysis.categories.get(rootCause) || 0) + 1
      )
      
      // Developer root cause analysis
      if (assignee !== 'Unassigned') {
        if (!data.metrics.developerRootCause.developers.has(assignee)) {
          data.metrics.developerRootCause.developers.set(assignee, new Map())
        }
        const devRootCause = data.metrics.developerRootCause.developers.get(assignee)
        devRootCause.set(rootCause, (devRootCause.get(rootCause) || 0) + 1)
      }
    }

    // Add to filter options
    data.filterOptions.developers.add(assignee)
    data.filterOptions.projects.add(project)
    data.filterOptions.issueTypes.add(issueType)
    data.filterOptions.statuses.add(status)
    data.filterOptions.severities.add(severity)
    data.filterOptions.rootCauses.add(rootCause)
    
    if (created) {
      const month = created.substring(0, 7)
      const week = developerQualityService.getWeekFromDate(created)
      const quarter = developerQualityService.getQuarterFromDate(created)
      
      data.filterOptions.dateRanges.months.add(month)
      data.filterOptions.dateRanges.weeks.add(week)
      data.filterOptions.dateRanges.quarters.add(quarter)
    }
  },

  /**
   * Build multi-dimensional indices for instant filtering
   */
  buildFilterIndices: (issue, index, indices) => {
    const developer = issue.fields?.assignee?.displayName || 'Unassigned'
    const project = issue.fields?.project?.key || 'Unknown'
    const issueType = issue.fields?.issuetype?.name || 'Unknown'
    const status = issue.fields?.status?.name || 'Unknown'
    const severity = issue.fields?.priority?.name || 'Unknown'
    const rootCause = developerQualityService.extractRootCause(issue)
    const created = issue.fields?.created
    
    // Primary indices
    developerQualityService.addToIndex(indices.byDeveloper, developer, index)
    developerQualityService.addToIndex(indices.byProject, project, index)
    developerQualityService.addToIndex(indices.byIssueType, issueType, index)
    developerQualityService.addToIndex(indices.byStatus, status, index)
    developerQualityService.addToIndex(indices.bySeverity, severity, index)
    developerQualityService.addToIndex(indices.byRootCause, rootCause, index)
    
    if (created) {
      const month = created.substring(0, 7)
      const week = developerQualityService.getWeekFromDate(created)
      const quarter = developerQualityService.getQuarterFromDate(created)
      
      // Time-based indices
      developerQualityService.addToIndex(indices.byMonth, month, index)
      developerQualityService.addToIndex(indices.byWeek, week, index)
      developerQualityService.addToIndex(indices.byQuarter, quarter, index)
      
      // Composite indices
      developerQualityService.addToIndex(indices.byDeveloperAndProject, `${developer}:${project}`, index)
      developerQualityService.addToIndex(indices.byProjectAndMonth, `${project}:${month}`, index)
      developerQualityService.addToIndex(indices.byDeveloperAndSeverity, `${developer}:${severity}`, index)
    }
  },

  /**
   * Helper function to add to index
   */
  addToIndex: (indexMap, key, value) => {
    if (!key || key === 'Unknown') return
    if (!indexMap.has(key)) {
      indexMap.set(key, [])
    }
    indexMap.get(key).push(value)
  },

  /**
   * Extract root cause from issue (simplified logic)
   */
  extractRootCause: (issue) => {
    const summary = issue.fields?.summary || ''
    const description = issue.fields?.description || ''
    const text = `${summary} ${description}`.toLowerCase()
    
    // Simple keyword matching - can be enhanced with ML
    if (text.includes('logic') || text.includes('algorithm') || text.includes('calculation')) {
      return 'Logic Error'
    }
    if (text.includes('integration') || text.includes('api') || text.includes('service')) {
      return 'Integration Issue'
    }
    if (text.includes('performance') || text.includes('slow') || text.includes('timeout')) {
      return 'Performance'
    }
    if (text.includes('ui') || text.includes('ux') || text.includes('interface')) {
      return 'UI/UX'
    }
    if (text.includes('data') || text.includes('database') || text.includes('query')) {
      return 'Data Issue'
    }
    
    return 'Unknown'
  },

  /**
   * Get week from date string
   */
  getWeekFromDate: (dateString) => {
    const date = new Date(dateString)
    const year = date.getFullYear()
    const week = Math.ceil((date.getTime() - new Date(year, 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000))
    return `${year}-W${week.toString().padStart(2, '0')}`
  },

  /**
   * Get quarter from date string
   */
  getQuarterFromDate: (dateString) => {
    const date = new Date(dateString)
    const year = date.getFullYear()
    const quarter = Math.ceil((date.getMonth() + 1) / 3)
    return `${year}-Q${quarter}`
  },

  /**
   * Get cached data (placeholder - returns null to force processing from raw data)
   * @returns {Promise<null>} Always returns null to ensure fresh processing
   */
  getCachedData: async () => {
    // For now, always return null to force processing from raw JIRA data
    // This can be enhanced later with actual caching logic
    return null
  },

  /**
   * Finalize metrics calculations
   */
  finalizeMetrics: (metrics) => {
    // Calculate team contribution averages
    const totalDevs = metrics.teamContribution.developerStats.size
    if (totalDevs > 0) {
      metrics.teamContribution.averageContribution = 
        metrics.teamContribution.totalContributions / totalDevs
    }
    
    // Convert developer stats to sorted array
    metrics.teamContribution.topContributors = Array.from(
      metrics.teamContribution.developerStats.entries()
    ).map(([developer, stats]) => ({
      developer,
      contributions: stats.contributions,
      percentage: (stats.contributions / metrics.teamContribution.totalContributions) * 100
    })).sort((a, b) => b.contributions - a.contributions)
    
    // Calculate bug rate analysis
    metrics.teamContribution.developerStats.forEach((stats, developer) => {
      const bugRate = stats.contributions > 0 ? (stats.bugs / stats.contributions) * 100 : 0
      metrics.bugRateAnalysis.developers.set(developer, {
        developer,
        totalIssues: stats.contributions,
        bugs: stats.bugs,
        bugRate,
        trend: 'stable', // Can be enhanced with historical data
        projects: Array.from(stats.projects)
      })
    })
    
    // Calculate team average bug rate
    const totalBugRate = Array.from(metrics.bugRateAnalysis.developers.values())
      .reduce((sum, dev) => sum + dev.bugRate, 0)
    metrics.bugRateAnalysis.teamAverage = totalBugRate / metrics.bugRateAnalysis.developers.size || 0
  },

  /**
   * Finalize chart data
   */
  finalizeChartData: (chartData, metrics) => {
    // Team contribution chart
    chartData.teamContributionChart.data = metrics.teamContribution.topContributors.slice(0, 10)
    
    // Bug trend chart
    chartData.bugTrendChart.data = Array.from(metrics.bugAnalysis.monthlyBugTrend.entries())
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => a.month.localeCompare(b.month))
    
    // Root cause chart
    chartData.rootCauseChart.data = Array.from(metrics.rootCauseAnalysis.categories.entries())
      .map(([name, value]) => ({
        name,
        value,
        percentage: (value / metrics.bugAnalysis.totalBugs) * 100
      }))
      .sort((a, b) => b.value - a.value)
    
    // Developer root cause chart
    chartData.developerRootCauseChart.data = Array.from(metrics.developerRootCause.developers.entries())
      .map(([developer, rootCauses]) => {
        const result = { developer }
        rootCauses.forEach((count, cause) => {
          result[cause] = count
        })
        return result
      })
      .sort((a, b) => {
        const aTotal = Object.values(a).reduce((sum, val) => 
          typeof val === 'number' ? sum + val : sum, 0)
        const bTotal = Object.values(b).reduce((sum, val) => 
          typeof val === 'number' ? sum + val : sum, 0)
        return bTotal - aTotal
      })
  },

  /**
   * Finalize filter options
   */
  finalizeFilterOptions: (filterOptions, indices) => {
    // Convert Sets to sorted arrays
    filterOptions.developers = Array.from(filterOptions.developers).sort()
    filterOptions.projects = Array.from(filterOptions.projects).sort()
    filterOptions.issueTypes = Array.from(filterOptions.issueTypes).sort()
    filterOptions.statuses = Array.from(filterOptions.statuses).sort()
    filterOptions.severities = Array.from(filterOptions.severities).sort()
    filterOptions.rootCauses = Array.from(filterOptions.rootCauses).sort()
    
    filterOptions.dateRanges.months = Array.from(filterOptions.dateRanges.months).sort()
    filterOptions.dateRanges.weeks = Array.from(filterOptions.dateRanges.weeks).sort()
    filterOptions.dateRanges.quarters = Array.from(filterOptions.dateRanges.quarters).sort()
  },

  /**
   * Calculate cache size for monitoring
   */
  calculateCacheSize: (data) => {
    // Rough estimation in bytes
    const jsonString = JSON.stringify(data, (key, value) => {
      if (value instanceof Map) {
        return Object.fromEntries(value)
      }
      if (value instanceof Set) {
        return Array.from(value)
      }
      return value
    })
    return jsonString.length
  }
} 