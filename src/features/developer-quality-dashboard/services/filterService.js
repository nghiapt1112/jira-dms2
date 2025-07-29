/**
 * Filter Service for Developer Quality Dashboard
 * Handles instant filtering using pre-built indices
 * Following .cursorrules conventions - camelCase naming, performance optimizations
 */

import { memberConfiguration } from '../../../constants/memberConfiguration'
import { initializeSeverityBreakdown } from '../../../shared/constants/severityConstants.js'
// Import unified time utilities to eliminate DRY violation
import { 
  getWeekFromDate,
  getQuarterFromDate,
  getWeekDateRange,
  formatDateDDMMYYYY
} from '../../../shared/utils/timeUtils.js'
// Import IssueUtils for centralized story point calculations
import { IssueUtils } from '../../../shared/utils/IssueUtils.js'
// Import bug categorization utilities
import { 
  getInitialBugTrendData 
} from '../../../shared/utils/bugCategorization.js'
// REMOVED: targetCalculationService imports - now using preprocessed data (caching strategy fix)

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
    
    // Extract timeframe and statusFilter from unified filters object
    const { 
      timeframe = 'month', 
      statusFilter = memberConfiguration.filterDefaults.statusFilter 
    } = filters || {}
    
    // Get intersection of indices based on filters
    const resultIndices = filterService.getFilteredIndices(filters, cacheData.indices)
    
    // Apply status filter if provided
    let finalIndices = resultIndices
    if (statusFilter && statusFilter.length > 0) {
      const statusIndices = new Set()
      statusFilter.forEach(status => {
        const statusIssues = cacheData.indices.byStatus.get(status) || []
        statusIssues.forEach(idx => statusIndices.add(idx))
      })
      
      // Intersect with existing results
      finalIndices = new Set([...resultIndices].filter(idx => statusIndices.has(idx)))
    }
    
    // Get filtered issues for time-based processing
    const filteredIssues = filterService.getFilteredIssues(finalIndices, cacheData.minimalIssues)
    
    // Generate time-based chart data with project filtering applied
    const timeBasedChartData = filterService.generateTimeBasedChartData(
      filteredIssues, 
      timeframe, 
      statusFilter,
      filters // Pass the full filters object to allow project filtering
    )
    
    // Recalculate metrics from filtered data
    const filteredMetrics = filterService.recalculateMetricsFromIndices(finalIndices, cacheData, timeframe)
    
    // Return filtered data with recalculated metrics and time-based chart data
    const filteredData = {
      filteredIssues,
      filteredMetrics,
      filteredChartData: {
        ...filterService.recalculateChartDataFromIndices(finalIndices, cacheData, timeframe),
        teamContributionChart: {
          type: 'stacked-bar',
          data: timeBasedChartData,
          config: {
            xAxisKey: 'timePeriod',
            yAxisKey: 'storyPoints',
            colorScheme: 'multi',
            timeframe,
            statusFilter
          },
          // Pass through timeTrackingData from original chartData
          timeTrackingData: cacheData.chartData?.teamContributionChart?.timeTrackingData || [],
          // CRITICAL FIX: Pass through preprocessed performance data for target lines
          preprocessedPerformance: cacheData.preprocessedPerformance
        }
      },
      appliedFilters: filters,
      totalResults: finalIndices.size,
      processingTime: performance.now() - startTime
    }
    
    return filteredData
  },

  /**
   * Apply filters with time period and status filtering for team contribution chart
   * @param {Object} filters - Filter criteria
   * @param {Object} cacheData - Pre-processed cache data with indices
   * @param {string} timePeriodType - 'week', 'month', or 'quarter'
   * @param {Array} statusFilter - Array of statuses to include
   * @returns {Object} Filtered data with time-based chart data
   */
  applyFiltersWithTimeAndStatus: (filters, cacheData, timePeriodType = 'month', statusFilter = []) => {
    const startTime = performance.now()
    
    if (!cacheData || !cacheData.indices) {
      return null
    }
    
    // Get intersection of indices based on filters
    let resultIndices = filterService.getFilteredIndices(filters, cacheData.indices)
    
    // Apply status filter if provided
    if (statusFilter && statusFilter.length > 0) {
      const statusIndices = new Set()
      statusFilter.forEach(status => {
        const statusIssues = cacheData.indices.byStatus.get(status) || []
        statusIssues.forEach(idx => statusIndices.add(idx))
      })
      
      // Intersect with existing results
      resultIndices = new Set([...resultIndices].filter(idx => statusIndices.has(idx)))
    }
    
    // Get filtered issues for time-based processing
    const filteredIssues = filterService.getFilteredIssues(resultIndices, cacheData.minimalIssues)
    
    // Generate time-based chart data
    const timeBasedChartData = filterService.generateTimeBasedChartData(
      filteredIssues, 
      timePeriodType, 
      statusFilter
    )
    
    // Recalculate metrics from filtered data
    const filteredMetrics = filterService.recalculateMetricsFromIndices(resultIndices, cacheData, timePeriodType)
    
    // Return filtered data with time-based chart data
    const filteredData = {
      filteredIssues,
      filteredMetrics,
      filteredChartData: {
        ...filterService.recalculateChartDataFromIndices(resultIndices, cacheData, timePeriodType),
        teamContributionChart: {
          type: 'stacked-bar',
          data: timeBasedChartData,
          config: {
            xAxisKey: 'timePeriod',
            yAxisKey: 'storyPoints',
            colorScheme: 'multi',
            timePeriodType,
            statusFilter
          },
          // Pass through timeTrackingData from original chartData
          timeTrackingData: cacheData.chartData?.teamContributionChart?.timeTrackingData || []
        }
      },
      appliedFilters: filters,
      timePeriodType,
      statusFilter,
      totalResults: resultIndices.size,
      processingTime: performance.now() - startTime
    }
    
    return filteredData
  },

  /**
   * Generate time-based chart data from filtered issues using IssueUtils
   * @param {Array} filteredIssues - Array of filtered issues
   * @param {string} timePeriodType - 'week', 'month', or 'quarter' (REQUIRED from Zustand filters.timeframe)
   * @param {Array} statusFilter - Array of statuses to include (DEPRECATED - delivered statuses are mandatory)
   * @param {Object} filters - Filter object containing project/developer filters
   * @returns {Array} Chart data for stacked bar chart
   */
  generateTimeBasedChartData: (filteredIssues, timePeriodType, statusFilter = [], filters = null) => {
    // Validate required timeframe parameter
    if (!timePeriodType) {
      console.error('filterService.generateTimeBasedChartData: timePeriodType is required from Zustand filters.timeframe')
      return []
    }
    
    // Use IssueUtils for consistent story point calculation
    // Note: statusFilter is ignored - delivered statuses are mandatory
    const chartData = IssueUtils.calculateStoryPointsByTimePeriod(
      filteredIssues, 
      timePeriodType, // Dynamic from Zustand filters.timeframe
      {
        projectFilter: filters?.projects || null,
        developerFilter: filters?.developers || null
      }
    )
    
    return chartData
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
   * @param {string} timeframe - Time period for trend analysis ('week', 'month', 'quarter')
   * @returns {Object} Recalculated metrics
   */
  recalculateMetricsFromIndices: (indices, cacheData, timeframe = 'month') => {
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
        severityDistribution: initializeSeverityBreakdown(),
        monthlyBugTrend: new Map(), // Will be renamed dynamically based on timeframe
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
      },
      bugTypeAnalysis: {
        byProject: new Map(),
        byTimePeriod: new Map(),
        byProjectAndTimePeriod: new Map(),
        totalDistribution: {
          bugTypes: {
            'Functional': { count: 0, percentage: 0 },
            'UI': { count: 0, percentage: 0 },
            'Performance': { count: 0, percentage: 0 },
            'Security': { count: 0, percentage: 0 },
            'Regression': { count: 0, percentage: 0 },
            'Integration': { count: 0, percentage: 0 },
            'Unknown': { count: 0, percentage: 0 }
          },
          totalBugs: 0,
          metadata: {
            calculatedAt: new Date().toISOString(),
            source: 'filter-recalculation'
          }
        },
        metadata: {
          totalBugs: 0,
          projectCount: 0,
          timePeriods: new Set(),
          bugTypes: new Set()
        }
      }
    }
    
    // Process filtered issues
    filteredIssues.forEach(issue => {
      const assignee = issue.assignee || 'Unassigned'
      const issueType = issue.issueType || 'Unknown'
      const severity = issue.severity || 'Unknown'
      const rootCause = issue.rootCause || 'Unknown'
      const updated = issue.updated
      
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
        
        // Time-based bug trend - use pre-processed data from single-loop processing
        if (updated) {
          let timePeriod
          switch (timeframe) {
            case 'week':
              timePeriod = getWeekFromDate(updated)
              break
            case 'quarter':
              timePeriod = getQuarterFromDate(updated)
              break
            default: // month
              timePeriod = updated.substring(0, 7) // '2024-01'
          }
          

          if (!metrics.bugAnalysis.monthlyBugTrend.has(timePeriod)) {
            metrics.bugAnalysis.monthlyBugTrend.set(timePeriod, getInitialBugTrendData())
          }
          const periodData = metrics.bugAnalysis.monthlyBugTrend.get(timePeriod)
          
          // Use pre-processed categorization data from single-loop processing
          // No re-processing during filtering - data should already be categorized
          periodData.total += 1
          
          // Use the issue's pre-processed categorization
          const category = issue.bugCategory || (issue.resolved ? 'resolved' : 'inProgress')
          periodData[category] += 1
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
      
      // Bug type analysis - only for Bug type issues
      if (issueType === 'Bug') {
        const projectKey = issue.project
        const bugType = issue.bugType || 'Unknown'
        const timePeriod = updated ? updated.substring(0, 7) : null // Use month format
        
        if (projectKey && bugType) {
          // Update by Project
          filterService.updateBugTypeDistribution(metrics.bugTypeAnalysis.byProject, projectKey, bugType)
          
          // Update by Time Period
          if (timePeriod) {
            filterService.updateBugTypeDistribution(metrics.bugTypeAnalysis.byTimePeriod, timePeriod, bugType)
            
            // Update composite index
            const compositeKey = `${projectKey}::${timePeriod}`
            filterService.updateBugTypeDistribution(metrics.bugTypeAnalysis.byProjectAndTimePeriod, compositeKey, bugType)
          }
          
          // Update total distribution
          filterService.updateBugTypeCount(metrics.bugTypeAnalysis.totalDistribution, bugType)
          
          // Update metadata
          metrics.bugTypeAnalysis.metadata.totalBugs++
          metrics.bugTypeAnalysis.metadata.bugTypes.add(bugType)
          if (timePeriod) {
            metrics.bugTypeAnalysis.metadata.timePeriods.add(timePeriod)
          }
        }
      }
    })
    
    // Finalize bug type analysis metadata
    if (metrics.bugTypeAnalysis) {
      metrics.bugTypeAnalysis.metadata.timePeriods = Array.from(metrics.bugTypeAnalysis.metadata.timePeriods).sort()
      metrics.bugTypeAnalysis.metadata.bugTypes = Array.from(metrics.bugTypeAnalysis.metadata.bugTypes).sort()
      metrics.bugTypeAnalysis.metadata.projectCount = metrics.bugTypeAnalysis.byProject.size
    }
    
    // Finalize calculations
    filterService.finalizeFilteredMetrics(metrics, cacheData)
    
    return metrics
  },

  /**
   * Recalculate chart data from filtered indices
   * @param {Set} indices - Filtered indices
   * @param {Object} cacheData - Original cache data
   * @returns {Object} Recalculated chart data
   */
  recalculateChartDataFromIndices: (indices, cacheData, timeframe = 'month') => {
    const metrics = filterService.recalculateMetricsFromIndices(indices, cacheData, timeframe)
    
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
        data: (() => {
          const periodKey = timeframe === 'week' ? 'week' : timeframe === 'quarter' ? 'quarter' : 'month'
          const bugTrendData = Array.from(metrics.bugAnalysis.monthlyBugTrend.entries())
            .filter(([period, data]) => period != null && data != null) // Filter out null/undefined periods
            .map(([period, data]) => {
              const result = { 
                [periodKey]: String(period), 
                ...data,
                bugs: data.total || 0,  // Map 'total' to 'bugs' for PropTypes compatibility
                // Ensure all new categories are present
                resolved: data.resolved || 0,
                notFixed: data.notFixed || 0,
                new: data.new || 0,
                inProgress: data.inProgress || 0
              }
              
              // Add additional metadata for tooltips
              if (timeframe === 'week') {
                try {
                  // Check if period is in the expected format (YYYY-WXX)
                  let weekId = period
                  if (typeof period === 'number' || !period.toString().includes('-W')) {
                    // Convert numeric period to week format if needed
                    // For now, skip week range calculation for numeric periods
                    result._weekStartFormatted = `Week ${period}`
                    result._weekEndFormatted = `Week ${period}`
                  } else {
                    const weekRange = getWeekDateRange(weekId)
                    result._weekStart = weekRange.startDate
                    result._weekEnd = weekRange.endDate
                    result._weekStartFormatted = formatDateDDMMYYYY(weekRange.startDate)
                    result._weekEndFormatted = formatDateDDMMYYYY(weekRange.endDate)
                  }
                } catch (error) {
                  console.warn('Failed to get week range for period:', period, error)
                  result._weekStartFormatted = 'Unknown'
                  result._weekEndFormatted = 'Unknown'
                }
              }
              
              return result
            })
            .sort((a, b) => {
              const periodA = a[periodKey]
              const periodB = b[periodKey]
              
              // Safe comparison with null checks
              if (!periodA || !periodB) return 0
              if (typeof periodA.localeCompare === 'function') {
                return periodA.localeCompare(periodB)
              } else {
                return String(periodA).localeCompare(String(periodB))
              }
            })
          

          return bugTrendData
        })(),
        config: {
          xAxisKey: timeframe === 'week' ? 'week' : timeframe === 'quarter' ? 'quarter' : 'month',
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
   * @param {Object} cacheData - Original cache data for preserving comprehensive developer data
   */
  finalizeFilteredMetrics: (metrics, cacheData) => {
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
      contributions: stats.contributions || 0,
      storyPoints: stats.storyPoints || 0, // Add storyPoints for PropTypes compatibility
      percentage: metrics.teamContribution.totalContributions > 0 ? 
        (stats.contributions / metrics.teamContribution.totalContributions) * 100 : 0,
      storyPointsPercentage: ((stats.storyPoints || 0) / (metrics.teamContribution.totalStoryPoints || 1)) * 100
    })).sort((a, b) => (b.storyPoints || 0) - (a.storyPoints || 0)) // Sort by story points
    

    metrics.teamContribution.developerStats.forEach((stats, developer) => {
      const bugRate = stats.contributions > 0 ? (stats.bugs / stats.contributions) * 100 : 0
      
      // Find the original comprehensive developer data from cache
      let originalDeveloperData = null
      if (cacheData.metrics?.bugRateAnalysis?.developers) {
        if (Array.isArray(cacheData.metrics.bugRateAnalysis.developers)) {
          // If it's already an array (finalized)
          originalDeveloperData = cacheData.metrics.bugRateAnalysis.developers.find(
            dev => dev.developer === developer || dev.name === developer
          )
        } else if (cacheData.metrics.bugRateAnalysis.developers instanceof Map) {
          // If it's still a Map (before finalization)
          originalDeveloperData = cacheData.metrics.bugRateAnalysis.developers.get(developer)
        }
      }

      // Create comprehensive developer object - use original data if available, otherwise basic data
      const comprehensiveDeveloperData = originalDeveloperData ? {
        // PRESERVE ALL ORIGINAL COMPREHENSIVE DATA
        ...originalDeveloperData,
        // UPDATE only the basic metrics that might change with filtering
        developer,
        totalIssues: stats.contributions,
        bugs: stats.bugs,
        bugRate,
        projects: Array.from(stats.projects)
      } : {
        // FALLBACK: Basic data if no comprehensive data found
        developer,
        totalIssues: stats.contributions,
        bugs: stats.bugs,
        bugRate,
        trend: 'stable',
        projects: Array.from(stats.projects),
        // Add default values for expected comprehensive fields
        totalTimeSpentHours: 0,
        timePerStoryPoint: 0,
        severityBreakdown: {},
        rootCauseBreakdown: {},
        weeklyTimeData: [],
        overdueCount: 0,
        reopenCount: 0,
        reopenRate: 0
      }
      
      metrics.bugRateAnalysis.developers.set(developer, comprehensiveDeveloperData)
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
    if (metrics.bugAnalysis && metrics.bugAnalysis.monthlyBugTrend instanceof Map) {
      metrics.bugAnalysis.monthlyBugTrend = Array.from(metrics.bugAnalysis.monthlyBugTrend.entries())
        .map(([month, data]) => ({ 
          month, 
          bugs: data.total || 0,  // Map 'total' to 'bugs' for PropTypes compatibility
          resolved: data.resolved || 0,
          pending: data.pending || 0,
          total: data.total || 0  // Keep total for backward compatibility
        }))
        .sort((a, b) => a.month.localeCompare(b.month))
    }
  },

  /**
   * Check if filters are empty
   * @param {Object} filters - Filter criteria
   * @returns {boolean} True if filters are empty
   */
  areFiltersEmpty: (filters) => {
    if (!filters) return true
    
    // Check for default values of timeframe and statusFilter
    const isDefaultTimeframe = !filters.timeframe || filters.timeframe === 'month'
    const isDefaultStatusFilter = 
      !filters.statusFilter || 
      (filters.statusFilter.length === 3 && 
       filters.statusFilter.includes('Done') && 
       filters.statusFilter.includes('In Progress') && 
       filters.statusFilter.includes('In Review'))
    
    return (
      (!filters.developers || filters.developers.length === 0) &&
      (!filters.projects || filters.projects.length === 0) &&
      (!filters.issueTypes || filters.issueTypes.length === 0) &&
      (!filters.statuses || filters.statuses.length === 0) &&
      (!filters.severities || filters.severities.length === 0) &&
      (!filters.rootCauses || filters.rootCauses.length === 0) &&
      (!filters.dateRange || (!filters.dateRange.startDate && !filters.dateRange.endDate)) &&
      isDefaultTimeframe &&
      isDefaultStatusFilter
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
  },

  // REMOVED: applyPerformanceFilter method - now using preprocessed data (caching strategy fix)

  /**
   * Update bug type distribution for a given key
   * @param {Map} distributionMap - Map to update
   * @param {string} key - Key (project, time period, etc.)
   * @param {string} bugType - Bug type to count
   */
  updateBugTypeDistribution: (distributionMap, key, bugType) => {
    if (!distributionMap.has(key)) {
      distributionMap.set(key, {
        bugTypes: {
          'Functional': { count: 0, percentage: 0 },
          'UI': { count: 0, percentage: 0 },
          'Performance': { count: 0, percentage: 0 },
          'Security': { count: 0, percentage: 0 },
          'Regression': { count: 0, percentage: 0 },
          'Integration': { count: 0, percentage: 0 },
          'Unknown': { count: 0, percentage: 0 }
        },
        totalBugs: 0,
        projectKey: key.includes('::') ? key.split('::')[0] : key,
        timePeriod: key.includes('::') ? key.split('::')[1] : null,
        metadata: {
          calculatedAt: new Date().toISOString(),
          source: 'filter-recalculation'
        }
      })
    }
    
    const distribution = distributionMap.get(key)
    
    // Initialize bug type if it doesn't exist
    if (!distribution.bugTypes[bugType]) {
      distribution.bugTypes[bugType] = { count: 0, percentage: 0 }
    }
    
    // Update counts
    distribution.bugTypes[bugType].count++
    distribution.totalBugs++
    
    // Recalculate percentages
    Object.values(distribution.bugTypes).forEach(bugTypeData => {
      if (distribution.totalBugs > 0) {
        bugTypeData.percentage = (bugTypeData.count / distribution.totalBugs) * 100
      }
    })
  },

  /**
   * Update total bug type count
   * @param {Object} totalDistribution - Total distribution object
   * @param {string} bugType - Bug type to count
   */
  updateBugTypeCount: (totalDistribution, bugType) => {
    // Initialize bug type if it doesn't exist
    if (!totalDistribution.bugTypes[bugType]) {
      totalDistribution.bugTypes[bugType] = { count: 0, percentage: 0 }
    }
    
    // Update counts
    totalDistribution.bugTypes[bugType].count++
    totalDistribution.totalBugs++
    
    // Recalculate percentages
    Object.values(totalDistribution.bugTypes).forEach(bugTypeData => {
      if (totalDistribution.totalBugs > 0) {
        bugTypeData.percentage = (bugTypeData.count / totalDistribution.totalBugs) * 100
      }
    })
    
    // Update metadata
    totalDistribution.metadata.calculatedAt = new Date().toISOString()
  },
} 