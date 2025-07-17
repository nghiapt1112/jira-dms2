/**
 * Developer Quality Service
 * Processes JIRA issues for developer quality metrics with pre-calculated cache structures
 * Following .cursorrules conventions - camelCase naming, performance optimizations
 */

import { JIRA_CONSTANTS } from '../../../constants/jiraConstants'
import { shouldIncludeMember, memberConfiguration } from '../../../constants/memberConfiguration'
import { 
  calculateReopenMetrics, 
  calculateResolutionTimeMetrics, 
  extractRootCauseAnalysis,
  calculateQualityTrend,
  calculateTimeEfficiency,
  aggregateSeverityBreakdown,
  aggregateRootCauseBreakdown
} from '../utils/metricCalculations'

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
    
    const processingTime = performance.now() - startTime
    
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
      monthlyBugTrend: new Map(),
      // NEW METRICS - EXTENDED
      reopenAnalysis: {
        totalReopens: 0,
        overallReopenRate: 0,
        byDeveloper: new Map(),
        byProject: new Map(),
        trends: new Map()
      },
      resolutionTimeAnalysis: {
        averageResolutionTimeHours: 0,
        byDeveloper: new Map(),
        bySeverity: new Map(),
        overdueCount: 0,
        efficiencyAverage: 0,
        trends: new Map()
      }
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
    
    
    // Team contribution metrics - now using story points and member filtering
    if (assignee !== 'Unassigned' && memberStatus.isIncluded) {
      if (!data.metrics.teamContribution.developerStats.has(assignee)) {
        // STEP 1: Keep existing structure EXACTLY the same
        const currentStats = {
          contributions: 0,
          storyPoints: 0,
          bugs: 0,
          projects: new Set(),
          statusBreakdown: new Map(), // Track story points by status
          role: memberStatus.role // Track member role (developer/qa)
        }

        // STEP 2: APPEND new fields (safe extension)
        const extendedStats = {
          ...currentStats,           // INHERIT ALL EXISTING
          // NEW FIELDS ONLY (appended safely)
          reopenCount: 0,
          resolutionTimes: [],
          recentBugs: [],
          severityBreakdown: { 'Critical': 0, 'High': 0, 'Medium': 0, 'Low': 0, 'Unknown': 0 },
          rootCauseBreakdown: {},
          overdueCount: 0
        }

        data.metrics.teamContribution.developerStats.set(assignee, extendedStats)
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

    // NEW PROCESSING - APPENDED AFTER EXISTING (SAFE)
    if (issueType === 'Bug' && memberStatus.isIncluded && assignee !== 'Unassigned') {
      const devStats = data.metrics.teamContribution.developerStats.get(assignee)
      
      // NEW: Process additional bug metrics (doesn't affect existing bugs count)
      const reopenMetrics = calculateReopenMetrics(issue)
      if (reopenMetrics.hasReopenHistory) {
        devStats.reopenCount += reopenMetrics.reopenCount  // NEW FIELD
      }
      
      // NEW: Process resolution time
      if (resolved && created) {
        const resolutionMetrics = calculateResolutionTimeMetrics(issue)
        if (resolutionMetrics.resolutionTimeHours !== null) {
          devStats.resolutionTimes.push(resolutionMetrics)  // NEW FIELD
          if (resolutionMetrics.isOverdue) {
            devStats.overdueCount += 1  // NEW FIELD
          }
        }
      }
      
      // NEW: Track severity (doesn't affect existing severity tracking)
      if (devStats.severityBreakdown) {  // DEFENSIVE CHECK
        devStats.severityBreakdown[severity] += 1  // NEW FIELD
      }
      
      // NEW: Track root cause
      const rootCauseAnalysis = extractRootCauseAnalysis(issue)
      if (rootCauseAnalysis.rootCause !== 'Unknown') {
        if (!devStats.rootCauseBreakdown[rootCauseAnalysis.rootCause]) {
          devStats.rootCauseBreakdown[rootCauseAnalysis.rootCause] = 0
        }
        devStats.rootCauseBreakdown[rootCauseAnalysis.rootCause] += 1  // NEW FIELD
      }
      
      // NEW: Track recent bugs for trends
      devStats.recentBugs.push({  // NEW FIELD
        created, resolved, severity,
        rootCause: rootCauseAnalysis.rootCause,
        issueType, reopenCount: reopenMetrics.reopenCount
      })
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
      
      const cachedData = await developerQualityIndexedDB.getCompleteDataset()
      
      if (cachedData) {
        return cachedData
      } else {
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
    
    // Calculate bug rate analysis - EXTENDED VERSION
    metrics.teamContribution.developerStats.forEach((stats, developer) => {
      const bugRate = stats.contributions > 0 ? (stats.bugs / stats.contributions) * 100 : 0
      
      // STEP 1: Keep existing object structure EXACTLY
      const currentBugRateObject = {
        developer,                        // UNCHANGED
        totalIssues: stats.contributions, // UNCHANGED
        bugs: stats.bugs,                // UNCHANGED
        bugRate,                         // UNCHANGED
        trend: 'stable',                 // UNCHANGED (will enhance later)
        projects: Array.from(stats.projects) // UNCHANGED
      }
      
      // STEP 2: Calculate new metrics (safe - doesn't affect existing)
      const reopenRate = stats.bugs > 0 && stats.reopenCount ? 
        (stats.reopenCount / stats.bugs) * 100 : 0
      
      let avgResolutionTimeHours = 0
      if (stats.resolutionTimes && stats.resolutionTimes.length > 0) {
        const totalTime = stats.resolutionTimes.reduce((sum, rt) => sum + rt.resolutionTimeHours, 0)
        avgResolutionTimeHours = totalTime / stats.resolutionTimes.length
      }
      
      const timeEfficiency = stats.resolutionTimes ? 
        calculateTimeEfficiency(stats.resolutionTimes) : 0
      
      const qualityTrend = stats.recentBugs && stats.recentBugs.length > 0 ? 
        calculateQualityTrend(stats.recentBugs) : { trend: 'stable', trendValue: 0 }
      
      // Helper function to get top root cause
      const getTopRootCause = (breakdown) => {
        if (!breakdown || Object.keys(breakdown).length === 0) return null
        const entries = Object.entries(breakdown)
        const sorted = entries.sort(([,a], [,b]) => b - a)
        return { cause: sorted[0][0], count: sorted[0][1] }
      }
      
      const topRootCause = getTopRootCause(stats.rootCauseBreakdown)
      
      // STEP 3: Create extended object (inherits all + adds new)
      const extendedBugRateObject = {
        ...currentBugRateObject,          // INHERIT ALL EXISTING
        // NEW PROPERTIES ONLY (appended safely)
        reopenCount: stats.reopenCount || 0,
        reopenRate: Math.round(reopenRate * 100) / 100,
        avgResolutionTimeHours: Math.round(avgResolutionTimeHours * 100) / 100,
        timeEfficiency: timeEfficiency || 0,
        qualityTrend: qualityTrend,
        severityBreakdown: stats.severityBreakdown || {},
        rootCauseBreakdown: stats.rootCauseBreakdown || {},
        topRootCause,
        overdueCount: stats.overdueCount || 0,
        trend: qualityTrend.trend || 'stable'  // NOW calculated but fallback to 'stable'
      }
      
      metrics.bugRateAnalysis.developers.set(developer, extendedBugRateObject)
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
      
      // Store data using new granular IndexedDB structure
      // This splits the data across multiple stores for better scalability
      await developerQualityIndexedDB.storeCompleteDataset(processedData)
      
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
      return true
    } catch (error) {
      console.error('🔍 SERVICE: Failed to clear cached developer quality data from dedicated IndexedDB:', error)
      return false
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

}

// Make the service available globally for debugging
if (typeof window !== 'undefined') {
  window.developerQualityService = developerQualityService
} 