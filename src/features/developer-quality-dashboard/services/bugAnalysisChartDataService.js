/**
 * Bug Analysis Chart Data Service
 * Centralized data preprocessing following DRY and caching principles
 * Processes raw bug data ONCE and provides chart-ready data
 */

/**
 * Preprocesses bug analysis data for all charts
 * Follows caching strategy: parse data once, use pre-processed data for display
 * @param {Object} rawData - Raw bug analysis data from API
 * @param {string} timeframe - 'week' or 'month'
 * @returns {Object} Pre-processed data for all chart types
 */
export const preprocessBugAnalysisData = (rawData, timeframe = 'month') => {
  if (!rawData) return null

  // Collect all time periods and aggregate data ONCE
  const allPeriods = new Set()
  const aggregatedData = {
    created: new Map(),
    resolved: new Map(),
    status: { new: 0, inProgress: 0, notFix: 0 },
    types: {},
    rootCauses: {}
  }

  // Single pass through data - DRY principle
  Object.values(rawData).forEach(projectData => {
    const periodData = projectData[timeframe] || {}
    
    Object.entries(periodData).forEach(([period, metrics]) => {
      allPeriods.add(period)
      
      // Aggregate created/resolved for line chart
      aggregatedData.created.set(period, 
        (aggregatedData.created.get(period) || 0) + (metrics.created || 0)
      )
      aggregatedData.resolved.set(period, 
        (aggregatedData.resolved.get(period) || 0) + (metrics.resolved || 0)
      )
      
      // Aggregate status data for pie chart
      aggregatedData.status.new += metrics.new || 0
      aggregatedData.status.inProgress += metrics.inProgress || 0
      aggregatedData.status.notFix += metrics.notFix || 0
      
      // Aggregate bug types for pie chart (using actual field names from data)
      const bugTypes = ['Functional', 'UI/UX', 'Security', 'Integration', 'Unknown']
      bugTypes.forEach(type => {
        if (metrics[type]) {
          aggregatedData.types[type] = (aggregatedData.types[type] || 0) + metrics[type]
        }
      })
      
      // Aggregate root causes for bar chart (using actual field names from data)
      const rootCauses = [
        'ImplementationIssue', 'MissedRequirement', 'HumanError', 'Release/CodeMergeIssue', 
        'EnvironmentIssue', 'InfrastructureorDeploymentIssues', 'DataMigration', 'TestDataIssue',
        'ProcessGaps', 'ChangeinRequirements', 'InadequateRequirementsAnalysis', 'UserInputValidationFailure'
      ]
      rootCauses.forEach(cause => {
        if (metrics[cause]) {
          aggregatedData.rootCauses[cause] = (aggregatedData.rootCauses[cause] || 0) + metrics[cause]
        }
      })
    })
  })

  const sortedPeriods = Array.from(allPeriods).sort()

  // Return pre-processed data for all charts
  return {
    // Line Chart Data
    lineChart: {
      labels: sortedPeriods,
      datasets: [
        {
          label: 'Created',
          data: sortedPeriods.map(period => aggregatedData.created.get(period) || 0)
        },
        {
          label: 'Resolved', 
          data: sortedPeriods.map(period => aggregatedData.resolved.get(period) || 0)
        }
      ]
    },
    
    // Status Pie Chart Data
    statusPie: {
      labels: Object.keys(aggregatedData.status)
        .filter(key => aggregatedData.status[key] > 0)
        .map(key => {
          const labelMap = {
            'new': 'New',
            'inProgress': 'In Progress', 
            'notFix': 'Not Fixed'
          }
          return labelMap[key] || key
        }),
      data: Object.values(aggregatedData.status).filter(value => value > 0)
    },
    
    // Type Pie Chart Data
    typePie: {
      labels: Object.keys(aggregatedData.types).filter(type => aggregatedData.types[type] > 0),
      data: Object.values(aggregatedData.types).filter(value => value > 0)
    },
    
    // Root Cause Bar Chart Data  
    rootCauseBar: {
      labels: Object.keys(aggregatedData.rootCauses)
        .filter(cause => aggregatedData.rootCauses[cause] > 0)
        .map(cause => {
          // Convert field names to readable labels
          const labelMap = {
            'ImplementationIssue': 'Implementation Issue',
            'MissedRequirement': 'Missed Requirement',
            'HumanError': 'Human Error',
            'Release/CodeMergeIssue': 'Release/Code Merge Issue',
            'EnvironmentIssue': 'Environment Issue',
            'InfrastructureorDeploymentIssues': 'Infrastructure/Deployment',
            'DataMigration': 'Data Migration',
            'TestDataIssue': 'Test Data Issue',
            'ProcessGaps': 'Process Gaps',
            'ChangeinRequirements': 'Change in Requirements',
            'InadequateRequirementsAnalysis': 'Inadequate Requirements Analysis',
            'UserInputValidationFailure': 'User Input Validation Failure'
          }
          return labelMap[cause] || cause
        }),
      data: Object.values(aggregatedData.rootCauses).filter(value => value > 0)
    },
    
    // Summary statistics
    summary: {
      totalCreated: Array.from(aggregatedData.created.values()).reduce((a, b) => a + b, 0),
      totalResolved: Array.from(aggregatedData.resolved.values()).reduce((a, b) => a + b, 0),
      totalActive: aggregatedData.status.new + aggregatedData.status.inProgress,
      resolutionRate: 0 // Will be calculated in hook
    }
  }
}

/**
 * Transforms preprocessed data for Chart.js format (react-chartjs-2)
 * @param {Object} preprocessedData - Data from preprocessBugAnalysisData
 * @param {string} chartType - 'line', 'statusPie', 'typePie', 'rootCauseBar'
 * @returns {Object} Chart.js compatible data format
 */
export const transformForChartJs = (preprocessedData, chartType) => {
  if (!preprocessedData) return null

  switch (chartType) {
    case 'line':
      return {
        labels: preprocessedData.lineChart.labels,
        datasets: [
          {
            label: 'Created',
            data: preprocessedData.lineChart.datasets[0].data,
            borderColor: '#ff6b6b',
            backgroundColor: 'rgba(255, 107, 107, 0.1)',
            borderWidth: 2,
            fill: false,
            tension: 0.1
          },
          {
            label: 'Resolved',
            data: preprocessedData.lineChart.datasets[1].data,
            borderColor: '#51cf66',
            backgroundColor: 'rgba(81, 207, 102, 0.1)',
            borderWidth: 2,
            fill: false,
            tension: 0.1
          }
        ]
      }

    case 'statusPie': {
      const statusColors = ['#2196f3', '#ff9800', '#f44336'] // Blue, Orange, Red
      return {
        labels: preprocessedData.statusPie.labels,
        datasets: [{
          data: preprocessedData.statusPie.data,
          backgroundColor: statusColors.slice(0, preprocessedData.statusPie.data.length),
          borderColor: statusColors.slice(0, preprocessedData.statusPie.data.length),
          borderWidth: 2,
          hoverBackgroundColor: statusColors.slice(0, preprocessedData.statusPie.data.length).map(color => color + '80'),
          hoverBorderWidth: 3
        }]
      }
    }

    case 'typePie': {
      const typeColorMap = {
        'Functional': '#2196f3',    // Blue
        'UI/UX': '#4caf50',         // Green  
        'Security': '#f44336',      // Red
        'Integration': '#9c27b0',   // Purple
        'Unknown': '#9e9e9e'        // Grey
      }
      const typeColors = preprocessedData.typePie.labels.map(label => typeColorMap[label] || '#9e9e9e')
      
      return {
        labels: preprocessedData.typePie.labels,
        datasets: [{
          data: preprocessedData.typePie.data,
          backgroundColor: typeColors,
          borderColor: typeColors,
          borderWidth: 2,
          hoverBackgroundColor: typeColors.map(color => color + '80'),
          hoverBorderWidth: 3
        }]
      }
    }

    case 'rootCauseBar': {
      return {
        labels: preprocessedData.rootCauseBar.labels,
        datasets: [{
          label: 'Bug Count',
          data: preprocessedData.rootCauseBar.data,
          backgroundColor: '#42a5f5',
          borderColor: '#1976d2',
          borderWidth: 2,
          hoverBackgroundColor: '#64b5f6',
          hoverBorderColor: '#1565c0',
          hoverBorderWidth: 3
        }]
      }
    }

    default:
      return null
  }
}