/**
 * Bug Status Chart Utilities
 * Data transformation utilities for bug status chart
 * Following .cursorrules conventions - camelCase naming, performance optimizations
 */

import { formatTooltipDateRange } from '../../../shared/utils/dateUtils'
import { memberConfiguration } from '../../../constants/memberConfiguration'

/**
 * Create project name to key mapping from memberConfiguration
 * @returns {Map} Map of display names to project keys
 */
const createProjectNameToKeyMap = () => {
  const map = new Map()
  
  if (memberConfiguration.projects) {
    memberConfiguration.projects.forEach(project => {
      if (project.name && project.key) {
        map.set(project.name, project.key)
      }
    })
  }
  
  return map
}

// Cache the mapping to avoid recreating it
const projectNameToKeyMap = createProjectNameToKeyMap()

/**
 * Transform bug status data for Chart.js line chart
 * @param {Object} data - Bug status data from filterService
 * @param {Object} filters - Current filter state
 * @param {string} timeframe - Time period ('week', 'month', 'quarter')
 * @returns {Object|null} Chart.js data structure or null if no data
 */
export const transformBugStatusDataForChart = (data, filters, timeframe) => {
  // Handle nested data structure - data might be data.data.data or data.data
  const actualData = data?.data?.data || data?.data
  
  if (!actualData) {
    return null
  }
  
  // Apply project filtering
  const projectFilter = filters?.projects || []
  const dataToUse = getProjectFilteredData(actualData, projectFilter, timeframe)
  
  if (!dataToUse || dataToUse.size === 0) {
    return null
  }
  
  // Sort time periods chronologically
  const sortedEntries = Array.from(dataToUse.entries())
    .sort(([a], [b]) => a.localeCompare(b))
  
  const labels = sortedEntries.map(([period]) => period)
  
  // Transform to Chart.js format
  return {
    labels,
    datasets: [
      {
        label: 'New',
        data: sortedEntries.map(([_, values]) => values.new || 0),
        borderColor: '#1976d2',
        backgroundColor: 'rgba(25, 118, 210, 0.1)',
        tension: 0.1,
        fill: false
      },
      {
        label: 'In Progress', 
        data: sortedEntries.map(([_, values]) => values.inProgress || 0),
        borderColor: '#ff9800',
        backgroundColor: 'rgba(255, 152, 0, 0.1)',
        tension: 0.1,
        fill: false
      },
      {
        label: 'Resolved',
        data: sortedEntries.map(([_, values]) => values.resolved || 0), 
        borderColor: '#2e7d32',
        backgroundColor: 'rgba(46, 125, 50, 0.1)',
        tension: 0.1,
        fill: false
      },
      {
        label: 'Not Fixed',
        data: sortedEntries.map(([_, values]) => values.notFixed || 0),
        borderColor: '#d32f2f', 
        backgroundColor: 'rgba(211, 47, 47, 0.1)',
        tension: 0.1,
        fill: false
      }
    ]
  }
}

/**
 * Get project-filtered data from bug status analysis
 * @param {Object} bugStatusData - Bug status data structure
 * @param {Array} projectFilter - Selected projects
 * @param {string} timeframe - Time period ('week', 'month', 'quarter')
 * @returns {Map} Filtered data by time period
 */
export const getProjectFilteredData = (bugStatusData, projectFilter, timeframe) => {
  // If no project filter, use aggregated data
  if (!projectFilter || projectFilter.length === 0) {
    return bugStatusData.aggregated || new Map()
  }
  
  // If project filter exists, aggregate selected projects
  const filteredData = new Map()
  const projectData = bugStatusData.byProject || new Map()
  
  projectFilter.forEach(projectDisplayName => {
    // Use comprehensive project mapping from memberConfiguration
    let projectKey = projectNameToKeyMap.get(projectDisplayName) || projectDisplayName
    
    const projectTimePeriods = projectData.get(projectKey)
    if (projectTimePeriods) {
      
      let projectTotalBugs = 0
      projectTimePeriods.forEach((periodData, timePeriod) => {
        if (!filteredData.has(timePeriod)) {
          filteredData.set(timePeriod, {
            new: 0, inProgress: 0, resolved: 0, notFixed: 0, total: 0
          })
        }
        
        const aggregatedPeriodData = filteredData.get(timePeriod)
        const beforeValues = { ...aggregatedPeriodData }
        aggregatedPeriodData.new += periodData.new || 0
        aggregatedPeriodData.inProgress += periodData.inProgress || 0
        aggregatedPeriodData.resolved += periodData.resolved || 0
        aggregatedPeriodData.notFixed += periodData.notFixed || 0
        aggregatedPeriodData.total += periodData.total || 0
        
        const periodTotal = (periodData.new || 0) + (periodData.inProgress || 0) + (periodData.resolved || 0) + (periodData.notFixed || 0)
        projectTotalBugs += periodTotal
      })
    }
  })
  
  return filteredData
}

/**
 * Format tooltip title for bug status chart
 * @param {Array} context - Chart.js tooltip context
 * @param {string} timeframe - Time period ('week', 'month', 'quarter')
 * @returns {string} Formatted tooltip title
 */
export const formatTooltipTitle = (context, timeframe) => {
  if (!context || context.length === 0) return 'Unknown Period'
  
  const periodKey = context[0].label
  return formatTooltipDateRange(periodKey, timeframe)
}

/**
 * Format tooltip label for bug status chart
 * @param {Object} context - Chart.js tooltip context item
 * @returns {string} Formatted tooltip label
 */
export const formatTooltipLabel = (context) => {
  const { dataset, parsed } = context
  const value = parsed.y || 0
  const total = getTotalForPeriod(context)
  const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0'
  
  return `${dataset.label}: ${value} bugs (${percentage}%)`
}

/**
 * Get total bugs for a specific time period from tooltip context
 * @param {Object} context - Chart.js tooltip context item
 * @returns {number} Total bugs for the period
 */
export const getTotalForPeriod = (context) => {
  const { chart, dataIndex } = context
  const datasets = chart.data.datasets
  
  let total = 0
  datasets.forEach(dataset => {
    const value = dataset.data[dataIndex] || 0
    total += value
  })
  
  return total
}

/**
 * Get X-axis label based on timeframe
 * @param {string} timeframe - Time period ('week', 'month', 'quarter')
 * @returns {string} X-axis label text
 */
export const getXAxisLabel = (timeframe) => {
  switch (timeframe) {
    case 'week':
      return 'Week'
    case 'quarter':
      return 'Quarter'
    case 'month':
    default:
      return 'Month'
  }
}

/**
 * Get chart configuration for bug status chart
 * @param {string} timeframe - Time period ('week', 'month', 'quarter')
 * @returns {Object} Chart.js configuration object
 */
export const getBugStatusChartConfig = (timeframe) => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    title: {
      display: false // Title is handled by MUI Typography
    },
    legend: {
      position: 'top',
      labels: {
        usePointStyle: true,
        padding: 20
      }
    },
    tooltip: {
      mode: 'index',
      intersect: false,
      callbacks: {
        title: (context) => formatTooltipTitle(context, timeframe),
        label: (context) => formatTooltipLabel(context)
      }
    }
  },
  scales: {
    x: {
      title: {
        display: true,
        text: getXAxisLabel(timeframe)
      },
      grid: {
        display: true,
        color: 'rgba(0, 0, 0, 0.1)'
      }
    },
    y: {
      title: {
        display: true,
        text: 'Number of Bugs'
      },
      beginAtZero: true,
      grid: {
        display: true,
        color: 'rgba(0, 0, 0, 0.1)'
      },
      ticks: {
        stepSize: 1 // Ensure integer values for bug counts
      }
    }
  },
  interaction: {
    mode: 'nearest',
    axis: 'x',
    intersect: false
  }
})

/**
 * Validate bug status chart data
 * @param {Object} chartData - Chart data to validate
 * @returns {boolean} True if valid
 */
export const validateBugStatusChartData = (chartData) => {
  if (!chartData || typeof chartData !== 'object') return false
  
  const { labels, datasets } = chartData
  if (!Array.isArray(labels) || !Array.isArray(datasets)) return false
  
  // Check that all datasets have the same length as labels
  return datasets.every(dataset => 
    Array.isArray(dataset.data) && dataset.data.length === labels.length
  )
}

/**
 * Get empty chart data structure
 * @returns {Object} Empty chart data structure
 */
export const getEmptyBugStatusChartData = () => ({
  labels: [],
  datasets: [
    {
      label: 'New',
      data: [],
      borderColor: '#1976d2',
      backgroundColor: 'rgba(25, 118, 210, 0.1)',
      tension: 0.1,
      fill: false
    },
    {
      label: 'In Progress',
      data: [],
      borderColor: '#ff9800',
      backgroundColor: 'rgba(255, 152, 0, 0.1)',
      tension: 0.1,
      fill: false
    },
    {
      label: 'Resolved',
      data: [],
      borderColor: '#2e7d32',
      backgroundColor: 'rgba(46, 125, 50, 0.1)',
      tension: 0.1,
      fill: false
    },
    {
      label: 'Not Fixed',
      data: [],
      borderColor: '#d32f2f',
      backgroundColor: 'rgba(211, 47, 47, 0.1)',
      tension: 0.1,
      fill: false
    }
  ]
}) 