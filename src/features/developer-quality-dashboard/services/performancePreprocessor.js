/**
 * Performance Preprocessor Service
 * Handles all performance calculations during initial data processing (caching strategy)
 * Eliminates on-demand calculations in chart components
 * Following .cursorrules conventions - camelCase naming, performance optimizations
 */

import { memberConfiguration } from '../../../constants/memberConfiguration.js'
import { getTimePeriodKey } from '../../../shared/utils/timeUtils.js'

/**
 * Preprocess all performance data during initial single-loop processing
 * Creates fully processed data structures ready for display
 * @param {Object} performanceMetadata - Raw performance metadata from single-loop processing
 * @param {Array} chartData - Raw chart data by time periods
 * @param {Object} filters - Current filter state
 * @returns {Object} - Fully preprocessed performance data
 */
export const preprocessPerformanceData = (performanceMetadata, chartData, filters) => {
  if (!performanceMetadata || !chartData) {
    return {
      targetLines: {},
      filteredChartData: {
        all: chartData,
        under: chartData,
        over: chartData
      },
      performanceStats: {}
    }
  }

  const timeframe = filters?.timeframe || 'month'
  const preprocessedData = {
    targetLines: {},
    filteredChartData: {
      all: chartData,
      under: [],
      over: []
    },
    performanceStats: {}
  }

  // Process each project
  performanceMetadata.projectPerformance.forEach((projectPerformance, projectKey) => {
    // Get project configuration
    const project = memberConfiguration.projects.find(p => p.key === projectKey)
    if (!project?.pointType) return

    const pointType = project.pointType
    const targetConfig = memberConfiguration.performanceTargets[pointType]
    const lineConfig = memberConfiguration.targetLineConfig[pointType]

    // Pre-calculate target lines for this project
    preprocessedData.targetLines[projectKey] = []

    if (pointType === 'HOURS_BASE') {
      // Single target line for all developers
      const targets = targetConfig.all
      if (targets) {
        let targetValue
        switch (timeframe) {
          case 'week':
            targetValue = targets.totalPointWeekTarget
            break
          case 'quarter':
            targetValue = targets.totalPointQuarterTarget
            break
          case 'month':
          default:
            targetValue = targets.totalPointMonthTarget
            break
        }

        if (targetValue !== undefined && targetValue !== null) {
          preprocessedData.targetLines[projectKey].push({
            label: lineConfig.all.label,
            data: chartData.map(() => targetValue),
            config: lineConfig.all
          })
        }
      }
    } else if (pointType === 'STORYPOINT_BASE') {
      // Multiple target lines based on developer levels
      Object.keys(targetConfig).forEach(level => {
        const targets = targetConfig[level]
        const config = lineConfig[level]
        
        if (targets && config) {
          let targetValue
          switch (timeframe) {
            case 'week':
              targetValue = targets.totalPointWeekTarget
              break
            case 'quarter':
              targetValue = targets.totalPointQuarterTarget
              break
            case 'month':
            default:
              targetValue = targets.totalPointMonthTarget
              break
          }

          if (targetValue !== undefined && targetValue !== null) {
            preprocessedData.targetLines[projectKey].push({
              label: config.label,
              data: chartData.map(() => targetValue),
              config: config
            })
          }
        }
      })
    }

    // Pre-calculate filtered chart data for performance filters
    preprocessedData.filteredChartData.under = chartData.map(timeEntry => {
      const { timePeriod, ...developerData } = timeEntry
      const filteredEntry = { timePeriod }

      Object.keys(developerData).forEach(developer => {
        const originalValue = developerData[developer] || 0
        
        // Get developer performance data for this time period
        const developerPerformance = projectPerformance.get(developer)
        if (!developerPerformance) {
          filteredEntry[developer] = 0 // No performance data - filter out
          return
        }
        
        const periodPerformance = developerPerformance.get(timePeriod)
        if (!periodPerformance || periodPerformance.target === null) {
          filteredEntry[developer] = 0 // No target data - filter out
          return
        }
        
        // Include only under-performing developers
        if (periodPerformance.performance === 'under') {
          filteredEntry[developer] = originalValue
        } else {
          filteredEntry[developer] = 0 // Filter out (sparse chart)
        }
      })

      return filteredEntry
    })

    preprocessedData.filteredChartData.over = chartData.map(timeEntry => {
      const { timePeriod, ...developerData } = timeEntry
      const filteredEntry = { timePeriod }

      Object.keys(developerData).forEach(developer => {
        const originalValue = developerData[developer] || 0
        
        // Get developer performance data for this time period
        const developerPerformance = projectPerformance.get(developer)
        if (!developerPerformance) {
          filteredEntry[developer] = originalValue // No performance data - include in over
          return
        }
        
        const periodPerformance = developerPerformance.get(timePeriod)
        if (!periodPerformance || periodPerformance.target === null) {
          filteredEntry[developer] = originalValue // No target data - include in over
          return
        }
        
        // Include only over-performing developers
        if (periodPerformance.performance === 'over') {
          filteredEntry[developer] = originalValue
        } else {
          filteredEntry[developer] = 0 // Filter out (sparse chart)
        }
      })

      return filteredEntry
    })

    // Pre-calculate performance statistics
    preprocessedData.performanceStats[projectKey] = {
      totalDevelopers: projectPerformance.size,
      performanceSummary: {}
    }

    // Calculate summary statistics per time period
    chartData.forEach(timeEntry => {
      const { timePeriod } = timeEntry
      let underCount = 0
      let overCount = 0
      let totalCount = 0

      projectPerformance.forEach((developerPerformance, developer) => {
        const periodPerformance = developerPerformance.get(timePeriod)
        if (periodPerformance && periodPerformance.target !== null) {
          totalCount++
          if (periodPerformance.performance === 'under') {
            underCount++
          } else if (periodPerformance.performance === 'over') {
            overCount++
          }
        }
      })

      preprocessedData.performanceStats[projectKey].performanceSummary[timePeriod] = {
        under: underCount,
        over: overCount,
        total: totalCount,
        underPercentage: totalCount > 0 ? Math.round((underCount / totalCount) * 100) : 0,
        overPercentage: totalCount > 0 ? Math.round((overCount / totalCount) * 100) : 0
      }
    })
  })

  return preprocessedData
}

/**
 * Get preprocessed target lines for a specific project
 * @param {Object} preprocessedData - Preprocessed performance data
 * @param {string} projectKey - Project key
 * @returns {Array} - Target line configurations ready for Chart.js
 */
export const getPreprocessedTargetLines = (preprocessedData, projectKey) => {
  if (!preprocessedData?.targetLines?.[projectKey]) {
    return []
  }

  return preprocessedData.targetLines[projectKey].map(targetLine => ({
    label: targetLine.label,
    data: targetLine.data,
    type: 'line',
    borderColor: targetLine.config.color,
    backgroundColor: targetLine.config.color,
    borderWidth: targetLine.config.borderWidth,
    borderDash: targetLine.config.borderDash,
    pointBackgroundColor: targetLine.config.color,
    pointBorderColor: '#ffffff',
    pointBorderWidth: 1,
    pointRadius: 3,
    pointHoverRadius: 5,
    fill: false,
    tension: 0,
    yAxisID: 'y1'
  }))
}

/**
 * Get preprocessed filtered chart data
 * @param {Object} preprocessedData - Preprocessed performance data  
 * @param {string} performanceFilter - 'all', 'under', or 'over'
 * @returns {Array} - Filtered chart data ready for display
 */
export const getPreprocessedFilteredData = (preprocessedData, performanceFilter) => {
  if (!preprocessedData?.filteredChartData) {
    return []
  }

  return preprocessedData.filteredChartData[performanceFilter] || preprocessedData.filteredChartData.all
}