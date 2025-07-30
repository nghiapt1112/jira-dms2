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
 * Transform bug status data for Chart.js stacked bar chart
 * @param {Object} data - Bug status data from filterService
 * @param {Object} filters - Current filter state
 * @param {string} timeframe - Time period ('week', 'month', 'quarter')
 * @returns {Object|null} Chart.js data structure or null if no data
 */
export const transformBugStatusDataForStackedBar = (data, filters, timeframe) => {
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
  
  // Transform to Chart.js stacked bar format
  return {
    labels,
    datasets: [
      {
        label: 'New',
        data: sortedEntries.map(([_, values]) => values.new || 0),
        backgroundColor: '#1976d2',
        borderColor: '#1976d2',
        borderWidth: 1,
        stack: 'Stack 0'
      },
      {
        label: 'In Progress', 
        data: sortedEntries.map(([_, values]) => values.inProgress || 0),
        backgroundColor: '#ff9800',
        borderColor: '#ff9800',
        borderWidth: 1,
        stack: 'Stack 0'
      },
      {
        label: 'Resolved',
        data: sortedEntries.map(([_, values]) => values.resolved || 0), 
        backgroundColor: '#2e7d32',
        borderColor: '#2e7d32',
        borderWidth: 1,
        stack: 'Stack 0'
      },
      {
        label: 'Not Fixed',
        data: sortedEntries.map(([_, values]) => values.notFixed || 0),
        backgroundColor: '#d32f2f',
        borderColor: '#d32f2f',
        borderWidth: 1,
        stack: 'Stack 0'
      }
    ]
  }
}

/**
 * Transform bug status data for Chart.js pie chart (total distribution)
 * @param {Object} data - Bug status data from filterService
 * @param {Object} filters - Current filter state
 * @param {string} timeframe - Time period ('week', 'month', 'quarter')
 * @returns {Object|null} Chart.js data structure or null if no data
 */
export const transformBugStatusDataForPieChart = (data, filters, timeframe) => {
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
  
  // Aggregate totals across all time periods
  const totals = { new: 0, inProgress: 0, resolved: 0, notFixed: 0 }
  
  dataToUse.forEach((values) => {
    totals.new += values.new || 0
    totals.inProgress += values.inProgress || 0
    totals.resolved += values.resolved || 0
    totals.notFixed += values.notFixed || 0
  })
  
  // Check if we have any data
  const grandTotal = totals.new + totals.inProgress + totals.resolved + totals.notFixed
  if (grandTotal === 0) {
    return null
  }
  
  // Transform to Chart.js pie format
  return {
    labels: ['New', 'In Progress', 'Resolved', 'Not Fixed'],
    datasets: [
      {
        data: [totals.new, totals.inProgress, totals.resolved, totals.notFixed],
        backgroundColor: [
          '#1976d2', // New - Blue
          '#ff9800', // In Progress - Orange
          '#2e7d32', // Resolved - Green
          '#d32f2f'  // Not Fixed - Red
        ],
        borderColor: [
          '#1976d2',
          '#ff9800',
          '#2e7d32',
          '#d32f2f'
        ],
        borderWidth: 2,
        hoverBackgroundColor: [
          'rgba(25, 118, 210, 0.8)',
          'rgba(255, 152, 0, 0.8)',
          'rgba(46, 125, 50, 0.8)',
          'rgba(211, 47, 47, 0.8)'
        ]
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
 * Get chart configuration for bug status line chart
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
 * Get chart configuration for bug status stacked bar chart
 * @param {string} timeframe - Time period ('week', 'month', 'quarter')
 * @returns {Object} Chart.js configuration object
 */
export const getBugStatusStackedBarConfig = (timeframe) => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    title: {
      display: false // Title is handled by MUI Typography
    },
    legend: {
      position: 'top',
      labels: {
        usePointStyle: false,
        padding: 20
      }
    },
    tooltip: {
      mode: 'index',
      intersect: false,
      callbacks: {
        title: (context) => formatTooltipTitle(context, timeframe),
        label: (context) => formatStackedTooltipLabel(context)
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
      stacked: true,
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
 * Format tooltip label for stacked bar chart
 * @param {Object} context - Chart.js tooltip context item
 * @returns {string} Formatted tooltip label
 */
export const formatStackedTooltipLabel = (context) => {
  const { dataset, parsed } = context
  const value = parsed.y || 0
  const total = getStackedTotalForPeriod(context)
  const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0'
  
  return `${dataset.label}: ${value} bugs (${percentage}%)`
}

/**
 * Get total bugs for a specific time period from stacked bar tooltip context
 * @param {Object} context - Chart.js tooltip context item
 * @returns {number} Total bugs for the period
 */
export const getStackedTotalForPeriod = (context) => {
  const { chart, dataIndex } = context
  const datasets = chart.data.datasets
  
  let total = 0
  datasets.forEach(dataset => {
    if (dataset.stack === 'Stack 0') {
      const value = dataset.data[dataIndex] || 0
      total += value
    }
  })
  
  return total
}

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

/**
 * Get empty chart data structure for stacked bar chart
 * @returns {Object} Empty chart data structure
 */
export const getEmptyBugStatusStackedBarData = () => ({
  labels: [],
  datasets: [
    {
      label: 'New',
      data: [],
      backgroundColor: '#1976d2',
      borderColor: '#1976d2',
      borderWidth: 1,
      stack: 'Stack 0'
    },
    {
      label: 'In Progress',
      data: [],
      backgroundColor: '#ff9800',
      borderColor: '#ff9800',
      borderWidth: 1,
      stack: 'Stack 0'
    },
    {
      label: 'Resolved',
      data: [],
      backgroundColor: '#2e7d32',
      borderColor: '#2e7d32',
      borderWidth: 1,
      stack: 'Stack 0'
    },
    {
      label: 'Not Fixed',
      data: [],
      backgroundColor: '#d32f2f',
      borderColor: '#d32f2f',
      borderWidth: 1,
      stack: 'Stack 0'
    }
  ]
}) 

/**
 * Get chart configuration for bug status pie chart
 * @returns {Object} Chart.js configuration object
 */
export const getBugStatusPieChartConfig = () => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    title: {
      display: false // Title is handled by MUI Typography
    },
    legend: {
      position: 'right',
      labels: {
        usePointStyle: true,
        padding: 20,
        font: {
          size: 14
        }
      }
    },
    tooltip: {
      callbacks: {
        label: (context) => formatPieTooltipLabel(context)
      }
    }
  },
  layout: {
    padding: {
      top: 10,
      bottom: 10,
      left: 10,
      right: 10
    }
  }
})

/**
 * Format tooltip label for pie chart
 * @param {Object} context - Chart.js tooltip context item
 * @returns {string} Formatted tooltip label
 */
export const formatPieTooltipLabel = (context) => {
  const { label, parsed, chart } = context
  const value = parsed || 0
  
  // Calculate total from all data points
  const total = chart.data.datasets[0].data.reduce((sum, val) => sum + val, 0)
  const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0'
  
  return `${label}: ${value} bugs (${percentage}%)`
}

/**
 * Get empty chart data structure for pie chart
 * @returns {Object} Empty chart data structure
 */
export const getEmptyBugStatusPieChartData = () => ({
  labels: ['New', 'In Progress', 'Resolved', 'Not Fixed'],
  datasets: [
    {
      data: [0, 0, 0, 0],
      backgroundColor: [
        '#1976d2', // New - Blue
        '#ff9800', // In Progress - Orange
        '#2e7d32', // Resolved - Green
        '#d32f2f'  // Not Fixed - Red
      ],
      borderColor: [
        '#1976d2',
        '#ff9800',
        '#2e7d32',
        '#d32f2f'
      ],
      borderWidth: 2
    }
  ]
}) 