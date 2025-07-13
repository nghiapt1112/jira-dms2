/**
 * Filter Service for Developer Quality Dashboard
 * Handles instant filtering using pre-built indices
 * Following .cursorrules conventions - camelCase naming, performance optimizations
 */

export const filterService = {
  /**
   * Apply filters to developer quality data using pre-built indices
   * @param {Object} filters - Filter criteria
   * @param {Object} cacheData - Pre-processed cache data with indices
   * @returns {Object} Filtered data with recalculated metrics and chart data
   */
  applyFilters: (filters, cacheData) => {
    const startTime = performance.now()
    
    if (!cacheData || !cacheData.indices) {
      return null
    }
    
    // Get intersection of indices based on filters
    const resultIndices = filterService.getFilteredIndices(filters, cacheData.indices)
    
    // Return filtered data with recalculated metrics
    const filteredData = {
      filteredIssues: filterService.getFilteredIssues(resultIndices, cacheData.minimalIssues),
      filteredMetrics: filterService.recalculateMetricsFromIndices(resultIndices, cacheData),
      filteredChartData: filterService.recalculateChartDataFromIndices(resultIndices, cacheData),
      appliedFilters: filters,
      totalResults: resultIndices.size,
      processingTime: performance.now() - startTime
    }
    
    return filteredData
  },

  /**
   * Get filtered indices based on applied filters
   * @param {Object} filters - Filter criteria
   * @param {Object} indices - Pre-built indices
   * @returns {Set} Set of filtered indices
   */
  getFilteredIndices: (filters, indices) => {
    const filterResults = []
    
    // Apply developer filter
    if (filters.developers && filters.developers.length > 0) {
      const devIndices = new Set()
      filters.developers.forEach(dev => {
        const devIssues = indices.byDeveloper.get(dev) || []
        devIssues.forEach(idx => devIndices.add(idx))
      })
      filterResults.push(devIndices)
    }
    
    // Apply project filter
    if (filters.projects && filters.projects.length > 0) {
      const projIndices = new Set()
      filters.projects.forEach(proj => {
        const projIssues = indices.byProject.get(proj) || []
        projIssues.forEach(idx => projIndices.add(idx))
      })
      filterResults.push(projIndices)
    }
    
    // Apply issue type filter
    if (filters.issueTypes && filters.issueTypes.length > 0) {
      const typeIndices = new Set()
      filters.issueTypes.forEach(type => {
        const typeIssues = indices.byIssueType.get(type) || []
        typeIssues.forEach(idx => typeIndices.add(idx))
      })
      filterResults.push(typeIndices)
    }
    
    // Apply status filter
    if (filters.statuses && filters.statuses.length > 0) {
      const statusIndices = new Set()
      filters.statuses.forEach(status => {
        const statusIssues = indices.byStatus.get(status) || []
        statusIssues.forEach(idx => statusIndices.add(idx))
      })
      filterResults.push(statusIndices)
    }
    
    // Apply severity filter
    if (filters.severities && filters.severities.length > 0) {
      const severityIndices = new Set()
      filters.severities.forEach(severity => {
        const severityIssues = indices.bySeverity.get(severity) || []
        severityIssues.forEach(idx => severityIndices.add(idx))
      })
      filterResults.push(severityIndices)
    }
    
    // Apply root cause filter
    if (filters.rootCauses && filters.rootCauses.length > 0) {
      const rootCauseIndices = new Set()
      filters.rootCauses.forEach(cause => {
        const causeIssues = indices.byRootCause.get(cause) || []
        causeIssues.forEach(idx => rootCauseIndices.add(idx))
      })
      filterResults.push(rootCauseIndices)
    }
    
    // Apply date range filter
    if (filters.dateRange) {
      const dateIndices = filterService.getDateRangeIndices(filters.dateRange, indices)
      if (dateIndices.size > 0) {
        filterResults.push(dateIndices)
      }
    }
    
    // If no filters applied, return all indices
    if (filterResults.length === 0) {
      const allIndices = new Set()
      // Get all indices from byDeveloper map
      indices.byDeveloper.forEach(issueIndices => {
        issueIndices.forEach(idx => allIndices.add(idx))
      })
      return allIndices
    }
    
    // Get intersection of all filter results
    return filterResults.reduce((acc, curr) => 
      new Set([...acc].filter(x => curr.has(x)))
    )
  },

  /**
   * Get date range indices
   * @param {Object} dateRange - Date range filter
   * @param {Object} indices - Pre-built indices
   * @returns {Set} Set of indices within date range
   */
  getDateRangeIndices: (dateRange, indices) => {
    const dateIndices = new Set()
    
    if (dateRange.type === 'month' && dateRange.values) {
      dateRange.values.forEach(month => {
        const monthIssues = indices.byMonth.get(month) || []
        monthIssues.forEach(idx => dateIndices.add(idx))
      })
    } else if (dateRange.type === 'quarter' && dateRange.values) {
      dateRange.values.forEach(quarter => {
        const quarterIssues = indices.byQuarter.get(quarter) || []
        quarterIssues.forEach(idx => dateIndices.add(idx))
      })
    } else if (dateRange.type === 'week' && dateRange.values) {
      dateRange.values.forEach(week => {
        const weekIssues = indices.byWeek.get(week) || []
        weekIssues.forEach(idx => dateIndices.add(idx))
      })
    }
    
    return dateIndices
  },

  /**
   * Get filtered issues based on indices
   * @param {Set} indices - Filtered indices
   * @param {Array} minimalIssues - Minimal issue data
   * @returns {Array} Filtered issues
   */
  getFilteredIssues: (indices, minimalIssues) => {
    return Array.from(indices)
      .sort((a, b) => a - b) // Sort by index
      .map(idx => minimalIssues[idx])
      .filter(issue => issue) // Remove any undefined issues
  },

  /**
   * Recalculate metrics from filtered indices
   * @param {Set} indices - Filtered indices
   * @param {Object} cacheData - Original cache data
   * @returns {Object} Recalculated metrics
   */
  recalculateMetricsFromIndices: (indices, cacheData) => {
    const filteredIssues = filterService.getFilteredIssues(indices, cacheData.minimalIssues)
    
    const metrics = {
      teamContribution: {
        totalContributions: 0,
        averageContribution: 0,
        topContributors: [],
        developerStats: new Map()
      },
      bugAnalysis: {
        totalBugs: 0,
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
        categories: new Map()
      },
      developerRootCause: {
        developers: new Map()
      },
      bugRateAnalysis: {
        developers: new Map(),
        teamAverage: 0
      }
    }
    
    // Process filtered issues
    filteredIssues.forEach(issue => {
      const assignee = issue.assignee || 'Unassigned'
      const issueType = issue.issueType || 'Unknown'
      const severity = issue.severity || 'Unknown'
      const rootCause = issue.rootCause || 'Unknown'
      const created = issue.created
      
      // Team contribution metrics
      if (assignee !== 'Unassigned') {
        if (!metrics.teamContribution.developerStats.has(assignee)) {
          metrics.teamContribution.developerStats.set(assignee, {
            contributions: 0,
            bugs: 0,
            projects: new Set()
          })
        }
        
        const devStats = metrics.teamContribution.developerStats.get(assignee)
        devStats.contributions += 1
        devStats.projects.add(issue.project)
        
        if (issueType === 'Bug') {
          devStats.bugs += 1
        }
        
        metrics.teamContribution.totalContributions += 1
      }
      
      // Bug analysis metrics
      if (issueType === 'Bug') {
        metrics.bugAnalysis.totalBugs += 1
        metrics.bugAnalysis.severityDistribution[severity] = 
          (metrics.bugAnalysis.severityDistribution[severity] || 0) + 1
        
        // Monthly bug trend
        if (created) {
          const month = created.substring(0, 7)
          if (!metrics.bugAnalysis.monthlyBugTrend.has(month)) {
            metrics.bugAnalysis.monthlyBugTrend.set(month, { total: 0, resolved: 0, pending: 0 })
          }
          const monthData = metrics.bugAnalysis.monthlyBugTrend.get(month)
          monthData.total += 1
          
          if (issue.resolved) {
            monthData.resolved += 1
          } else {
            monthData.pending += 1
          }
        }
      }
      
      // Root cause analysis
      if (rootCause && rootCause !== 'Unknown') {
        metrics.rootCauseAnalysis.categories.set(
          rootCause,
          (metrics.rootCauseAnalysis.categories.get(rootCause) || 0) + 1
        )
        
        // Developer root cause analysis
        if (assignee !== 'Unassigned') {
          if (!metrics.developerRootCause.developers.has(assignee)) {
            metrics.developerRootCause.developers.set(assignee, new Map())
          }
          const devRootCause = metrics.developerRootCause.developers.get(assignee)
          devRootCause.set(rootCause, (devRootCause.get(rootCause) || 0) + 1)
        }
      }
    })
    
    // Finalize calculations
    filterService.finalizeFilteredMetrics(metrics)
    
    return metrics
  },

  /**
   * Recalculate chart data from filtered indices
   * @param {Set} indices - Filtered indices
   * @param {Object} cacheData - Original cache data
   * @returns {Object} Recalculated chart data
   */
  recalculateChartDataFromIndices: (indices, cacheData) => {
    const metrics = filterService.recalculateMetricsFromIndices(indices, cacheData)
    
    const chartData = {
      teamContributionChart: {
        type: 'bar',
        data: metrics.teamContribution.topContributors.slice(0, 10),
        config: {
          xAxisKey: 'name',
          yAxisKey: 'contributions',
          colorScheme: 'blue'
        }
      },
      bugTrendChart: {
        type: 'line',
        data: Array.from(metrics.bugAnalysis.monthlyBugTrend.entries())
          .map(([month, data]) => ({ month, ...data }))
          .sort((a, b) => a.month.localeCompare(b.month)),
        config: {
          xAxisKey: 'month',
          lines: ['total', 'resolved', 'pending']
        }
      },
      rootCauseChart: {
        type: 'pie',
        data: Array.from(metrics.rootCauseAnalysis.categories.entries())
          .map(([name, value]) => ({
            name,
            value,
            percentage: metrics.bugAnalysis.totalBugs > 0 ? (value / metrics.bugAnalysis.totalBugs) * 100 : 0
          }))
          .sort((a, b) => b.value - a.value)
      },
      developerRootCauseChart: {
        type: 'stacked-bar',
        data: Array.from(metrics.developerRootCause.developers.entries())
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
      }
    }
    
    return chartData
  },

  /**
   * Finalize filtered metrics calculations
   * @param {Object} metrics - Metrics to finalize
   */
  finalizeFilteredMetrics: (metrics) => {
    // Calculate team contribution averages
    const totalDevs = metrics.teamContribution.developerStats.size
    if (totalDevs > 0) {
      metrics.teamContribution.averageContribution = 
        metrics.teamContribution.totalContributions / totalDevs
    } else {
      metrics.teamContribution.averageContribution = 0
    }
    
    // Convert developer stats to sorted array
    metrics.teamContribution.topContributors = Array.from(
      metrics.teamContribution.developerStats.entries()
    ).map(([developer, stats]) => ({
      developer,
      name: developer, // For chart compatibility
      contributions: stats.contributions,
      percentage: metrics.teamContribution.totalContributions > 0 ? 
        (stats.contributions / metrics.teamContribution.totalContributions) * 100 : 0
    })).sort((a, b) => b.contributions - a.contributions)
    
    // Calculate bug rate analysis
    metrics.teamContribution.developerStats.forEach((stats, developer) => {
      const bugRate = stats.contributions > 0 ? (stats.bugs / stats.contributions) * 100 : 0
      metrics.bugRateAnalysis.developers.set(developer, {
        developer,
        totalIssues: stats.contributions,
        bugs: stats.bugs,
        bugRate,
        trend: 'stable',
        projects: Array.from(stats.projects)
      })
    })
    
    // Calculate team average bug rate
    if (metrics.bugRateAnalysis.developers.size > 0) {
      const totalBugRate = Array.from(metrics.bugRateAnalysis.developers.values())
        .reduce((sum, dev) => sum + dev.bugRate, 0)
      metrics.bugRateAnalysis.teamAverage = totalBugRate / metrics.bugRateAnalysis.developers.size
    } else {
      metrics.bugRateAnalysis.teamAverage = 0
    }
  },

  /**
   * Check if filters are empty
   * @param {Object} filters - Filter criteria
   * @returns {boolean} True if filters are empty
   */
  areFiltersEmpty: (filters) => {
    if (!filters) return true
    
    return (
      (!filters.developers || filters.developers.length === 0) &&
      (!filters.projects || filters.projects.length === 0) &&
      (!filters.issueTypes || filters.issueTypes.length === 0) &&
      (!filters.statuses || filters.statuses.length === 0) &&
      (!filters.severities || filters.severities.length === 0) &&
      (!filters.rootCauses || filters.rootCauses.length === 0) &&
      (!filters.dateRange || !filters.dateRange.values || filters.dateRange.values.length === 0)
    )
  },

  /**
   * Get filter summary for display
   * @param {Object} filters - Applied filters
   * @returns {Object} Filter summary
   */
  getFilterSummary: (filters) => {
    const summary = {
      totalFilters: 0,
      activeFilters: []
    }
    
    if (!filters) return summary
    
    if (filters.developers && filters.developers.length > 0) {
      summary.totalFilters++
      summary.activeFilters.push({
        type: 'developers',
        count: filters.developers.length,
        label: `${filters.developers.length} developer${filters.developers.length > 1 ? 's' : ''}`
      })
    }
    
    if (filters.projects && filters.projects.length > 0) {
      summary.totalFilters++
      summary.activeFilters.push({
        type: 'projects',
        count: filters.projects.length,
        label: `${filters.projects.length} project${filters.projects.length > 1 ? 's' : ''}`
      })
    }
    
    if (filters.issueTypes && filters.issueTypes.length > 0) {
      summary.totalFilters++
      summary.activeFilters.push({
        type: 'issueTypes',
        count: filters.issueTypes.length,
        label: `${filters.issueTypes.length} issue type${filters.issueTypes.length > 1 ? 's' : ''}`
      })
    }
    
    if (filters.severities && filters.severities.length > 0) {
      summary.totalFilters++
      summary.activeFilters.push({
        type: 'severities',
        count: filters.severities.length,
        label: `${filters.severities.length} severit${filters.severities.length > 1 ? 'ies' : 'y'}`
      })
    }
    
    if (filters.dateRange && filters.dateRange.values && filters.dateRange.values.length > 0) {
      summary.totalFilters++
      summary.activeFilters.push({
        type: 'dateRange',
        count: filters.dateRange.values.length,
        label: `${filters.dateRange.values.length} ${filters.dateRange.type}${filters.dateRange.values.length > 1 ? 's' : ''}`
      })
    }
    
    return summary
  }
} 