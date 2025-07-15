/**
 * Developer Quality Service
 * Processes JIRA issues for developer quality metrics with pre-calculated cache structures
 * Following .cursorrules conventions - camelCase naming, performance optimizations
 */

import { JIRA_CONSTANTS } from '../../../constants/jiraConstants'
import { shouldIncludeMember, memberConfiguration } from '../../../constants/memberConfiguration'

export const developerQualityService = {
  /**
   * Process JIRA issues for developer quality metrics during the main processing loop
   * @param {Array} issues - Array of JIRA issues
   * @returns {Promise<Object>} Pre-processed developer quality data with metrics, chartData, and indices
   */
  processJiraIssuesForDeveloperQuality: async (issues) => {
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
        resolved: issue.fields?.resolutiondate || null,
        storyPoints: issue.fields?.customfield_10028 || 0
      })
    })
    
    // Post-process calculations
    developerQualityService.finalizeMetrics(developerQualityData.metrics)
    developerQualityService.finalizeChartData(developerQualityData.chartData, developerQualityData.metrics)
    developerQualityService.finalizeFilterOptions(developerQualityData.filterOptions, developerQualityData.indices)
    
    // Console log all current assignees/users in JSON format
    developerQualityService.logCurrentUsers(developerQualityData)
    
    // Also log all users found in raw data for initial configuration setup
    developerQualityService.logAllUsersForSetup(issues)
    
    // Also verify IndexedDB contents immediately after processing
    setTimeout(() => {
      developerQualityService.verifyIndexedDBContents()
    }, 1000)
    
    const processingTime = performance.now() - startTime
    console.log(`Developer Quality processing completed in ${processingTime}ms`)
    
    const finalData = {
      ...developerQualityData,
      metadata: {
        processingTime,
        totalIssues: issues.length,
        cacheSize: developerQualityService.calculateCacheSize(developerQualityData)
      }
    }
    
    // Cache the processed data for future use
    try {
      await developerQualityService.cacheProcessedData(finalData)
    } catch (error) {
      console.error('Failed to cache processed developer quality data:', error)
      // Don't fail the entire operation if caching fails
    }
    
    return finalData
  },

  /**
   * Initialize metrics structure
   */
  initializeMetrics: () => ({
    teamContribution: {
      totalContributions: 0,
      totalStoryPoints: 0,
      averageContribution: 0,
      averageStoryPoints: 0,
      contributionTrend: 'stable',
      topContributors: [],
      developerStats: new Map(),
      // Time-based story points aggregation
      timeBasedStoryPoints: {
        byWeek: new Map(),
        byMonth: new Map(),
        byQuarter: new Map()
      }
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
      type: 'stacked-bar',
      data: [],
      config: {
        xAxisKey: 'timePeriod',
        yAxisKey: 'storyPoints',
        colorScheme: 'multi',
        timePeriodType: 'month', // week, month, quarter
        statusFilter: ['Done', 'In Progress', 'In Review'] // Dynamic status filter
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
    const assigneeAccountId = issue.fields?.assignee?.accountId || null
    const project = issue.fields?.project?.key || 'Unknown'
    const issueType = issue.fields?.issuetype?.name || 'Unknown'
    const status = issue.fields?.status?.name || 'Unknown'
    const severity = issue.fields?.priority?.name || 'Unknown'
    const rootCause = developerQualityService.extractRootCause(issue)
    const created = issue.fields?.created
    const resolved = issue.fields?.resolutiondate
    
    // Extract story points from customfield_10028
    const storyPoints = issue.fields?.customfield_10028 || 0

    // Check if member should be included based on configuration (by name or jiraId)
    const memberStatus = shouldIncludeMember(assignee, assigneeAccountId)
    
    // Debug logging for member filtering (only log first few times to avoid spam)
    if (index < 5) {
      console.log(`🔍 MEMBER FILTER: ${assignee} (${assigneeAccountId}) -> ${memberStatus.isIncluded ? 'INCLUDED' : 'EXCLUDED'} (${memberStatus.role || 'no role'})`)
    }
    
    // Team contribution metrics - now using story points and member filtering
    if (assignee !== 'Unassigned' && memberStatus.isIncluded) {
      if (!data.metrics.teamContribution.developerStats.has(assignee)) {
        data.metrics.teamContribution.developerStats.set(assignee, {
          contributions: 0,
          storyPoints: 0,
          bugs: 0,
          projects: new Set(),
          statusBreakdown: new Map(), // Track story points by status
          role: memberStatus.role // Track member role (developer/qa)
        })
      }
      
      const devStats = data.metrics.teamContribution.developerStats.get(assignee)
      devStats.contributions += 1
      devStats.storyPoints += storyPoints
      devStats.projects.add(project)
      
      // Track story points by status for dynamic filtering
      if (!devStats.statusBreakdown.has(status)) {
        devStats.statusBreakdown.set(status, 0)
      }
      devStats.statusBreakdown.set(status, devStats.statusBreakdown.get(status) + storyPoints)
      
      if (issueType === 'Bug') {
        devStats.bugs += 1
      }
      
      data.metrics.teamContribution.totalContributions += 1
      data.metrics.teamContribution.totalStoryPoints = (data.metrics.teamContribution.totalStoryPoints || 0) + storyPoints
    }

    // Bug analysis metrics - only include bugs from configured members
    if (issueType === 'Bug' && memberStatus.isIncluded) {
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

    // Root cause analysis - only include issues from configured members
    if (rootCause && rootCause !== 'Unknown' && memberStatus.isIncluded) {
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

    // Add to filter options - only include configured members in developer filter
    if (memberStatus.isIncluded) {
      data.filterOptions.developers.add(assignee)
    }
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
      
      // Time-based story points aggregation - only for configured members
      if (assignee !== 'Unassigned' && storyPoints > 0 && memberStatus.isIncluded) {
        // Weekly aggregation
        if (!data.metrics.teamContribution.timeBasedStoryPoints.byWeek.has(week)) {
          data.metrics.teamContribution.timeBasedStoryPoints.byWeek.set(week, new Map())
        }
        const weekData = data.metrics.teamContribution.timeBasedStoryPoints.byWeek.get(week)
        weekData.set(assignee, (weekData.get(assignee) || 0) + storyPoints)
        
        // Monthly aggregation
        if (!data.metrics.teamContribution.timeBasedStoryPoints.byMonth.has(month)) {
          data.metrics.teamContribution.timeBasedStoryPoints.byMonth.set(month, new Map())
        }
        const monthData = data.metrics.teamContribution.timeBasedStoryPoints.byMonth.get(month)
        monthData.set(assignee, (monthData.get(assignee) || 0) + storyPoints)
        
        // Quarterly aggregation
        if (!data.metrics.teamContribution.timeBasedStoryPoints.byQuarter.has(quarter)) {
          data.metrics.teamContribution.timeBasedStoryPoints.byQuarter.set(quarter, new Map())
        }
        const quarterData = data.metrics.teamContribution.timeBasedStoryPoints.byQuarter.get(quarter)
        quarterData.set(assignee, (quarterData.get(assignee) || 0) + storyPoints)
      }
    }
  },

  /**
   * Build multi-dimensional indices for instant filtering
   */
  buildFilterIndices: (issue, index, indices) => {
    const developer = issue.fields?.assignee?.displayName || 'Unassigned'
    const developerAccountId = issue.fields?.assignee?.accountId || null
    const project = issue.fields?.project?.key || 'Unknown'
    const issueType = issue.fields?.issuetype?.name || 'Unknown'
    const status = issue.fields?.status?.name || 'Unknown'
    const severity = issue.fields?.priority?.name || 'Unknown'
    const rootCause = developerQualityService.extractRootCause(issue)
    const created = issue.fields?.created
    
    // Check if member should be included based on configuration
    const memberStatus = shouldIncludeMember(developer, developerAccountId)
    
    // Primary indices - only include configured members in developer index
    if (memberStatus.isIncluded) {
      developerQualityService.addToIndex(indices.byDeveloper, developer, index)
    }
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
      
      // Composite indices - only include configured members
      if (memberStatus.isIncluded) {
        developerQualityService.addToIndex(indices.byDeveloperAndProject, `${developer}:${project}`, index)
        developerQualityService.addToIndex(indices.byDeveloperAndSeverity, `${developer}:${severity}`, index)
      }
      developerQualityService.addToIndex(indices.byProjectAndMonth, `${project}:${month}`, index)
    }
  },

  /**
   * Helper function to add to index
   */
  addToIndex: (indexMap, key, value) => {
    if (!key) return
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
   * Get cached processed developer quality data from granular IndexedDB structure
   * @returns {Promise<Object|null>} Cached data or null if not available/expired
   */
  getCachedData: async () => {
    try {
      // Use dedicated IndexedDB to get processed data for scalability
      const { developerQualityIndexedDB } = await import('./developerQualityIndexedDB')
      
      console.log('🔍 SERVICE: Attempting to load cached developer quality data from dedicated IndexedDB...')
      const cachedData = await developerQualityIndexedDB.getCompleteDataset()
      
      if (cachedData) {
        console.log('🔍 SERVICE: Found cached developer quality data in dedicated IndexedDB:', {
          hasMetrics: !!cachedData.metrics,
          hasChartData: !!cachedData.chartData,
          hasIndices: !!cachedData.indices,
          hasFilterOptions: !!cachedData.filterOptions,
          totalIssues: cachedData.metadata?.totalIssues || 0,
          metricsKeys: cachedData.metrics ? Object.keys(cachedData.metrics) : [],
          chartDataKeys: cachedData.chartData ? Object.keys(cachedData.chartData) : [],
          indicesKeys: cachedData.indices ? Object.keys(cachedData.indices) : [],
          filterOptionsKeys: cachedData.filterOptions ? Object.keys(cachedData.filterOptions) : []
        })
        return cachedData
      } else {
        console.log('🔍 SERVICE: No cached developer quality data found in dedicated IndexedDB')
        return null
      }
    } catch (error) {
      console.error('🔍 SERVICE: Failed to load cached developer quality data from dedicated IndexedDB:', error)
      return null
    }
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
      metrics.teamContribution.averageStoryPoints = 
        (metrics.teamContribution.totalStoryPoints || 0) / totalDevs
    }
    
    // Convert developer stats to sorted array
    metrics.teamContribution.topContributors = Array.from(
      metrics.teamContribution.developerStats.entries()
    ).map(([developer, stats]) => ({
      developer,
      contributions: stats.contributions,
      storyPoints: stats.storyPoints,
      percentage: (stats.contributions / metrics.teamContribution.totalContributions) * 100,
      storyPointsPercentage: ((stats.storyPoints || 0) / (metrics.teamContribution.totalStoryPoints || 1)) * 100,
      statusBreakdown: Object.fromEntries(stats.statusBreakdown)
    })).sort((a, b) => b.storyPoints - a.storyPoints) // Sort by story points instead of contributions
    
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
    
    // Calculate team average bug rate and convert to array
    if (metrics.bugRateAnalysis.developers.size > 0) {
      const developersArray = Array.from(metrics.bugRateAnalysis.developers.values())
      const totalBugRate = developersArray.reduce((sum, dev) => sum + dev.bugRate, 0)
      metrics.bugRateAnalysis.teamAverage = totalBugRate / metrics.bugRateAnalysis.developers.size
      
      // Convert Map to sorted array for component consumption
      metrics.bugRateAnalysis.developers = developersArray
        .sort((a, b) => b.bugRate - a.bugRate)
    } else {
      metrics.bugRateAnalysis.teamAverage = 0
      metrics.bugRateAnalysis.developers = []
    }
    
    // Convert monthlyBugTrend Map to array for component consumption
    if (metrics.bugAnalysis.monthlyBugTrend instanceof Map) {
      metrics.bugAnalysis.monthlyBugTrend = Array.from(metrics.bugAnalysis.monthlyBugTrend.entries())
        .map(([month, data]) => ({ month, ...data }))
        .sort((a, b) => a.month.localeCompare(b.month))
    }
  },

  /**
   * Generate time-based chart data with dynamic status filtering
   * @param {Object} metrics - Processed metrics
   * @param {string} timePeriodType - 'week', 'month', or 'quarter'
   * @param {Array} statusFilter - Array of statuses to include
   * @returns {Array} Chart data for stacked bar chart
   */
  generateTimeBasedChartData: (metrics, timePeriodType = 'month', statusFilter = []) => {
    const timeBasedData = metrics.teamContribution.timeBasedStoryPoints[`by${timePeriodType.charAt(0).toUpperCase() + timePeriodType.slice(1)}`]
    
    if (!timeBasedData || timeBasedData.size === 0) {
      return []
    }
    
    // If no status filter provided, use all data
    if (!statusFilter || statusFilter.length === 0) {
      return Array.from(timeBasedData.entries())
        .map(([timePeriod, developersMap]) => {
          const result = { timePeriod }
          developersMap.forEach((storyPoints, developer) => {
            result[developer] = storyPoints
          })
          return result
        })
        .sort((a, b) => a.timePeriod.localeCompare(b.timePeriod))
    }
    
    // Apply status filtering - need to recalculate from raw data
    // This would require access to the minimalIssues array for filtering
    // For now, return the basic time-based data
    return Array.from(timeBasedData.entries())
      .map(([timePeriod, developersMap]) => {
        const result = { timePeriod }
        developersMap.forEach((storyPoints, developer) => {
          result[developer] = storyPoints
        })
        return result
      })
      .sort((a, b) => a.timePeriod.localeCompare(b.timePeriod))
  },

  /**
   * Finalize chart data
   */
  finalizeChartData: (chartData, metrics) => {
    // Team contribution chart - time-based stacked bar chart
    const timePeriodType = chartData.teamContributionChart.config.timePeriodType || 'month'
    const statusFilter = chartData.teamContributionChart.config.statusFilter || []
    
    chartData.teamContributionChart.data = developerQualityService.generateTimeBasedChartData(
      metrics, 
      timePeriodType, 
      statusFilter
    )
    
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
  },

  /**
   * Cache processed developer quality data using granular IndexedDB structure
   * @param {Object} processedData - The processed developer quality data
   * @returns {Promise<boolean>} Success status
   */
  cacheProcessedData: async (processedData) => {
    try {
      const { developerQualityIndexedDB } = await import('./developerQualityIndexedDB')
      const { getCurrentTimestamp } = await import('../../../shared/utils/dateUtils')
      
      const cacheMetadata = {
        timestamp: getCurrentTimestamp(),
        version: '1.0',
        dataType: 'developer_quality_processed',
        totalIssues: processedData.metadata?.totalIssues || 0,
        processingTime: processedData.metadata?.processingTime || 0,
        cacheSize: processedData.metadata?.cacheSize || 0,
        memberConfiguration: {
          totalDevelopers: processedData.filterOptions?.developers?.length || 0,
          totalProjects: processedData.filterOptions?.projects?.length || 0
        }
      }
      
      console.log('💾 CACHING: About to cache processed developer quality data to dedicated IndexedDB:', {
        totalIssues: cacheMetadata.totalIssues,
        processingTime: cacheMetadata.processingTime,
        cacheSize: cacheMetadata.cacheSize,
        hasMetrics: !!processedData.metrics,
        hasChartData: !!processedData.chartData,
        hasIndices: !!processedData.indices,
        metricsKeys: processedData.metrics ? Object.keys(processedData.metrics) : [],
        chartDataKeys: processedData.chartData ? Object.keys(processedData.chartData) : []
      })
      
      // Sample some data to verify
      if (processedData.metrics?.teamContribution?.developerStats) {
        const devStats = Array.from(processedData.metrics.teamContribution.developerStats.entries()).slice(0, 3)
        console.log('💾 CACHING: Sample developer stats:', devStats)
      }
      
      // Store data using new granular IndexedDB structure
      // This splits the data across multiple stores for better scalability
      await developerQualityIndexedDB.storeCompleteDataset(processedData)
      console.log('💾 CACHING: Successfully cached processed developer quality data to dedicated IndexedDB')
      
      // Verify the data was actually cached
      await developerQualityService.verifyIndexedDBContents()
      
      return true
    } catch (error) {
      console.error('💾 CACHING: Failed to cache processed developer quality data:', error)
      return false
    }
  },

  /**
   * Clear cached processed developer quality data from dedicated IndexedDB
   * @returns {Promise<boolean>} Success status
   */
  clearCachedData: async () => {
    try {
      const { developerQualityIndexedDB } = await import('./developerQualityIndexedDB')
      
      // Clear all data from the dedicated IndexedDB
      await developerQualityIndexedDB.clearAllData()
      console.log('🔍 SERVICE: Cleared cached developer quality data from dedicated IndexedDB')
      return true
    } catch (error) {
      console.error('🔍 SERVICE: Failed to clear cached developer quality data from dedicated IndexedDB:', error)
      return false
    }
  },

  /**
   * Verify IndexedDB contents - log all databases and their contents
   */
  verifyIndexedDBContents: async () => {
    try {
      console.log('🔍 INDEXEDDB: Verifying IndexedDB contents...')
      
      // Get all databases
      const databases = await indexedDB.databases()
      console.log('🔍 INDEXEDDB: Available databases:', databases.map(db => ({ name: db.name, version: db.version })))
      
      // Check each database
      for (const dbInfo of databases) {
        if (dbInfo.name) {
          try {
            const db = await new Promise((resolve, reject) => {
              const request = indexedDB.open(dbInfo.name, dbInfo.version)
              request.onsuccess = () => resolve(request.result)
              request.onerror = () => reject(request.error)
            })
            
            console.log(`🔍 INDEXEDDB: Database "${dbInfo.name}" contains object stores:`, Array.from(db.objectStoreNames))
            
            // Check our dedicated developer quality dashboard database
            if (dbInfo.name === 'developer_quality_dashboard') {
              const transaction = db.transaction(Array.from(db.objectStoreNames), 'readonly')
              
              for (const storeName of db.objectStoreNames) {
                const store = transaction.objectStore(storeName)
                const keys = await new Promise((resolve) => {
                  const request = store.getAllKeys()
                  request.onsuccess = () => resolve(request.result)
                  request.onerror = () => resolve([])
                })
                
                console.log(`🔍 INDEXEDDB: Object store "${storeName}" has keys:`, keys)
                
                // Sample some data from each store
                if (keys.length > 0) {
                  const sampleKey = keys[0]
                  const sampleData = await new Promise((resolve) => {
                    const request = store.get(sampleKey)
                    request.onsuccess = () => resolve(request.result)
                    request.onerror = () => resolve(null)
                  })
                  
                  console.log(`🔍 INDEXEDDB: Sample data from "${storeName}" (key: ${sampleKey}):`, {
                    hasData: !!sampleData,
                    dataKeys: sampleData ? Object.keys(sampleData) : [],
                    timestamp: sampleData?.timestamp,
                    size: sampleData?.size
                  })
                }
              }
            }
            
            // Also check legacy jira_data_cache database for migration reference
            if (dbInfo.name === 'jira_data_cache') {
              const transaction = db.transaction(Array.from(db.objectStoreNames), 'readonly')
              
              for (const storeName of db.objectStoreNames) {
                const store = transaction.objectStore(storeName)
                const keys = await new Promise((resolve) => {
                  const request = store.getAllKeys()
                  request.onsuccess = () => resolve(request.result)
                  request.onerror = () => resolve([])
                })
                
                console.log(`🔍 INDEXEDDB: Legacy store "${storeName}" has keys:`, keys)
                
                // Check for legacy developer quality data
                if (keys.includes('developer_quality_processed_data')) {
                  const data = await new Promise((resolve) => {
                    const request = store.get('developer_quality_processed_data')
                    request.onsuccess = () => resolve(request.result)
                    request.onerror = () => resolve(null)
                  })
                  
                  console.log('🔍 INDEXEDDB: Found legacy developer_quality_processed_data:', {
                    hasData: !!data,
                    dataKeys: data ? Object.keys(data) : [],
                    hasMetrics: !!data?.data?.metrics,
                    hasChartData: !!data?.data?.chartData,
                    timestamp: data?.timestamp,
                    size: data?.size
                  })
                }
              }
            }
            
            db.close()
          } catch (error) {
            console.error(`🔍 INDEXEDDB: Error checking database "${dbInfo.name}":`, error)
          }
        }
      }
      
      // Check cache statistics from dedicated database
      try {
        const { developerQualityIndexedDB } = await import('./developerQualityIndexedDB')
        const cacheStats = await developerQualityIndexedDB.getCacheStats()
        console.log('🔍 INDEXEDDB: Dedicated database cache stats:', cacheStats)
      } catch (error) {
        console.error('🔍 INDEXEDDB: Error getting cache stats:', error)
      }
      
      // Also check localStorage for any cached data
      console.log('🔍 LOCALSTORAGE: Checking localStorage for cached data...')
      const localStorageKeys = Object.keys(localStorage).filter(key => key.includes('cache') || key.includes('developer') || key.includes('quality'))
      console.log('🔍 LOCALSTORAGE: Relevant keys:', localStorageKeys)
      
      for (const key of localStorageKeys) {
        const value = localStorage.getItem(key)
        if (value) {
          try {
            const parsed = JSON.parse(value)
            console.log(`🔍 LOCALSTORAGE: ${key}:`, {
              hasData: !!parsed,
              keys: typeof parsed === 'object' ? Object.keys(parsed) : [],
              size: value.length
            })
          } catch (e) {
            console.log(`🔍 LOCALSTORAGE: ${key} (not JSON):`, { size: value.length })
          }
        }
      }
      
    } catch (error) {
      console.error('🔍 INDEXEDDB: Error verifying IndexedDB contents:', error)
    }
  },

  /**
   * Get specific metric data from IndexedDB (for partial loading)
   * @param {string} metricType - The type of metric to load
   * @returns {Promise<Object|null>} Metric data or null
   */
  getCachedMetric: async (metricType) => {
    try {
      const { developerQualityIndexedDB } = await import('./developerQualityIndexedDB')
      return await developerQualityIndexedDB.getMetric(metricType)
    } catch (error) {
      console.error(`Failed to get cached metric ${metricType}:`, error)
      return null
    }
  },

  /**
   * Get specific chart data from IndexedDB (for partial loading)
   * @param {string} chartType - The type of chart data to load
   * @returns {Promise<Object|null>} Chart data or null
   */
  getCachedChartData: async (chartType) => {
    try {
      const { developerQualityIndexedDB } = await import('./developerQualityIndexedDB')
      return await developerQualityIndexedDB.getChartData(chartType)
    } catch (error) {
      console.error(`Failed to get cached chart data ${chartType}:`, error)
      return null
    }
  },

  /**
   * Get specific index data from IndexedDB (for partial loading)
   * @param {string} indexType - The type of index to load
   * @returns {Promise<Map|null>} Index data or null
   */
  getCachedIndex: async (indexType) => {
    try {
      const { developerQualityIndexedDB } = await import('./developerQualityIndexedDB')
      return await developerQualityIndexedDB.getIndex(indexType)
    } catch (error) {
      console.error(`Failed to get cached index ${indexType}:`, error)
      return null
    }
  },

  /**
   * Get specific filter options from IndexedDB (for partial loading)
   * @param {string} filterType - The type of filter options to load
   * @returns {Promise<Array|null>} Filter options or null
   */
  getCachedFilterOptions: async (filterType) => {
    try {
      const { developerQualityIndexedDB } = await import('./developerQualityIndexedDB')
      return await developerQualityIndexedDB.getFilterOptions(filterType)
    } catch (error) {
      console.error(`Failed to get cached filter options ${filterType}:`, error)
      return null
    }
  },

  /**
   * Log current users/assignees in JSON format for configuration
   */
  logCurrentUsers: (data) => {
    // Extract all unique assignees with their stats
    const allUsers = []
    
    if (data.metrics.teamContribution.developerStats) {
      data.metrics.teamContribution.developerStats.forEach((stats, assignee) => {
        if (assignee !== 'Unassigned') {
          allUsers.push({
            name: assignee,
            totalContributions: stats.contributions,
            totalStoryPoints: stats.storyPoints,
            totalBugs: stats.bugs,
            projects: Array.from(stats.projects || []),
            role: stats.role || 'developer',
            isConfigured: true // These are only configured members now
          })
        }
      })
    }
    
    // Sort by story points (descending)
    allUsers.sort((a, b) => b.totalStoryPoints - a.totalStoryPoints)
  },

  /**
   * Log all users found in raw data for initial configuration setup
   */
  logAllUsersForSetup: (issues) => {
    const allUsersMap = new Map()
    
    // Process all issues to get complete user list
    issues.forEach(issue => {
      const assignee = issue.fields?.assignee?.displayName || 'Unassigned'
      const assigneeAccountId = issue.fields?.assignee?.accountId || null
      const storyPoints = issue.fields?.customfield_10028 || 0
      const issueType = issue.fields?.issuetype?.name || 'Unknown'
      const project = issue.fields?.project?.key || 'Unknown'
      
      if (assignee !== 'Unassigned') {
        if (!allUsersMap.has(assignee)) {
          allUsersMap.set(assignee, {
            jiraId: assigneeAccountId || assignee.toLowerCase().replace(/\s+/g, '.'),
            name: assignee,
            totalContributions: 0,
            totalStoryPoints: 0,
            totalBugs: 0,
            projects: new Set()
          })
        }
        
        const userStats = allUsersMap.get(assignee)
        userStats.totalContributions += 1
        userStats.totalStoryPoints += storyPoints
        userStats.projects.add(project)
        
        if (issueType === 'Bug') {
          userStats.totalBugs += 1
        }
      }
    })
    
    // Convert to array and sort
    const allUsers = Array.from(allUsersMap.values())
      .map(user => ({
        ...user,
        projects: Array.from(user.projects)
      }))
      .sort((a, b) => b.totalStoryPoints - a.totalStoryPoints)
    
    // Generate suggested configuration structure with new object format
    const suggestedConfig = {
      memberConfiguration: {
        developers: allUsers.map(user => ({
          jiraId: user.jiraId,
          name: user.name
        })),
        qa: []
      },
      kpiSettings: {
        onlyCalculateForConfiguredMembers: true,
        minimumStoryPointsThreshold: 0,
        excludeUnassigned: true
      }
    }
  }
}

// Make the service available globally for debugging
if (typeof window !== 'undefined') {
  window.developerQualityService = developerQualityService
} 