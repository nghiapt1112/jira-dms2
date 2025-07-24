import React, { useMemo } from 'react'
import PropTypes from 'prop-types'
import { Box, Typography } from '@mui/material'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import { Chart } from 'react-chartjs-2'
import { getPreprocessedFilteredData } from '../../services/performancePreprocessor.js'
import { getWeekDateRange } from '../../../../shared/utils/timeUtils.js'
import { memberConfiguration } from '../../../../constants/memberConfiguration.js'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
)

// Removed duplicate getWeekDateRange function - now using unified time utilities

/**
 * TeamOverviewChart - Dedicated component for displaying team-wide story points comparison
 * Shows story points as stacked bars for all developers in the team
 * When a single project is selected, displays a velocity line showing total story points per time period
 * 
 * @param {Object} props - Component props
 * @param {Array} props.data - Chart data array with timePeriod and developer story points
 * @param {Object} props.metrics - Metrics object containing team statistics
 * @param {number} props.height - Chart height in pixels
 * @param {Object} props.chartConfig - Chart configuration object
 * @param {Object} props.filters - Filter object containing project, developer, and other filter arrays
 * @returns {JSX.Element} Team overview chart component
 */
const TeamOverviewChart = ({ 
  data, 
  metrics, 
  height = 400,
  chartConfig = {},
  filters = {},
  showTargetLines = false,
  performanceFilter = 'all',
  selectedProjectKey = null
}) => {
  // Generate Chart.js data structure
  const chartData = useMemo(() => {
    console.log('📊 TEAM OVERVIEW: Processing chart data', {
      hasData: !!data,
      dataLength: data?.length || 0,
      firstDataPoint: data?.[0],
      performanceFilter,
      showTargetLines,
      selectedProjectKey
    })

    if (!data || data.length === 0) {
      return null
    }

    // Use original data for now - simplified approach
    let processedData = data

    // Check if single project is selected - define early
    const isSingleProject = filters.projects && filters.projects.length === 1

    // Extract all developers from the processed data dynamically
    const developers = new Set()
    processedData.forEach(item => {
      Object.keys(item).forEach(key => {
        if (key !== 'timePeriod') {
          developers.add(key)
        }
      })
    })

    const developersArray = Array.from(developers).sort()
    
    // Generate colors for each developer
    const colors = [
      '#1976d2', '#dc004e', '#2e7d32', '#ed6c02', '#9c27b0',
      '#00796b', '#d32f2f', '#7b1fa2', '#388e3c', '#f57c00',
      '#303f9f', '#c2185b', '#689f38', '#ff5722', '#512da8'
    ]

    // Create Chart.js datasets for each developer
    const datasets = developersArray.map((developer, index) => ({
      label: developer,
      data: processedData.map(item => item[developer] || 0),
      backgroundColor: colors[index % colors.length],
      borderColor: colors[index % colors.length],
      borderWidth: 1,
      type: 'bar'
    }))

    // Add velocity line if single project is selected
    if (isSingleProject) {
      const velocityData = processedData.map(item => {
        const totalStoryPoints = developersArray.reduce((sum, dev) => sum + (item[dev] || 0), 0)
        return totalStoryPoints
      })

      datasets.push({
        label: `${filters.projects[0]} Velocity`,
        data: velocityData,
        type: 'line',
        borderColor: '#1976d2',
        backgroundColor: '#1976d2',
        borderWidth: 3,
        pointBackgroundColor: '#1976d2',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
        fill: false,
        tension: 0.1,
        yAxisID: 'y1'
      })
    }

    // Add target lines - CHECK PROJECT TYPE FIRST!
    console.log('🎯 TARGET LINE CHECK:', { showTargetLines, isSingleProject, selectedProjectKey })
    
    // DEBUG: Log all available project keys in configuration
    console.log('🔍 DEBUG: All configured project keys:', memberConfiguration.projects.map(p => p.key))
    console.log('🔍 DEBUG: Selected project from filter:', selectedProjectKey)
    console.log('🔍 DEBUG: Filters object:', filters)
    console.log('🔍 DEBUG: Available projects in filters:', filters.projects)
    
    if (showTargetLines && isSingleProject && selectedProjectKey) {
      console.log('🎯 TARGET LINE: Adding target lines for project:', selectedProjectKey)
      
      // CRITICAL: Find the project configuration by KEY or NAME
      let project = memberConfiguration.projects.find(p => p.key === selectedProjectKey)
      
      // If not found by key, try finding by name (fallback)
      if (!project) {
        project = memberConfiguration.projects.find(p => p.name === selectedProjectKey)
        console.log('🔍 DEBUG: Found project by name instead of key:', project)
      }
      
      console.log('🎯 TARGET LINE: Found project config:', project)
      
      // DEBUG: If no project found, show what we're comparing
      if (!project) {
        console.log('🔍 DEBUG: Project not found! Comparing:')
        console.log('  - Looking for:', selectedProjectKey, typeof selectedProjectKey)
        console.log('  - Available keys:', memberConfiguration.projects.map(p => ({ key: p.key, name: p.name, type: typeof p.key })))
      }
      
      if (!project || !project.pointType) {
        console.log('🎯 TARGET LINE: No project config found for', selectedProjectKey)
        return
      }
      
      const pointType = project.pointType
      const timeframe = filters.timeframe || 'month'
      
      console.log('🎯 TARGET LINE: Project type is:', pointType)
      
      if (pointType === 'HOURS_BASE') {
        // SINGLE line for HOURS_BASE projects
        console.log('🎯 TARGET LINE: Processing HOURS_BASE project')
        const config = memberConfiguration.targetLineConfig.HOURS_BASE.all
        const targets = memberConfiguration.performanceTargets.HOURS_BASE.all
        
        console.log('🎯 TARGET LINE: Config and targets:', { config, targets })
        
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
        
        console.log('🎯 TARGET LINE: Calculated target value for', timeframe, ':', targetValue)
        
        const targetData = processedData.map(() => targetValue)
        console.log('🎯 TARGET LINE: Target data array:', targetData)
        
        const targetLineDataset = {
          label: config.label,
          data: targetData,
          type: 'line',
          borderColor: config.color,
          backgroundColor: config.color,
          borderWidth: config.borderWidth,
          borderDash: config.borderDash,
          pointBackgroundColor: config.color,
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 7,
          fill: false,
          tension: 0.1,
          yAxisID: 'y1'
        }
        
        console.log('🎯 TARGET LINE: Adding dataset:', targetLineDataset)
        datasets.push(targetLineDataset)
        
        console.log('🎯 TARGET LINE: Added HOURS_BASE target line:', targetValue)
        console.log('🎯 TARGET LINE: Total datasets now:', datasets.length)
        
      } else if (pointType === 'STORYPOINT_BASE') {
        // TWO lines for STORYPOINT_BASE projects
        const middleConfig = memberConfiguration.targetLineConfig.STORYPOINT_BASE.middle
        const seniorConfig = memberConfiguration.targetLineConfig.STORYPOINT_BASE.senior
        const middleTargets = memberConfiguration.performanceTargets.STORYPOINT_BASE.middle
        const seniorTargets = memberConfiguration.performanceTargets.STORYPOINT_BASE.senior
        
        // Add middle target line
        let middleTargetValue
        switch (timeframe) {
          case 'week':
            middleTargetValue = middleTargets.totalPointWeekTarget
            break
          case 'quarter':
            middleTargetValue = middleTargets.totalPointQuarterTarget
            break
          case 'month':
          default:
            middleTargetValue = middleTargets.totalPointMonthTarget
            break
        }
        
        const middleTargetData = processedData.map(() => middleTargetValue)
        datasets.push({
          label: middleConfig.label,
          data: middleTargetData,
          type: 'line',
          borderColor: middleConfig.color,
          backgroundColor: middleConfig.color,
          borderWidth: middleConfig.borderWidth,
          borderDash: middleConfig.borderDash,
          pointBackgroundColor: middleConfig.color,
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 7,
          fill: false,
          tension: 0.1,
          yAxisID: 'y1'
        })
        
        // Add senior target line
        let seniorTargetValue
        switch (timeframe) {
          case 'week':
            seniorTargetValue = seniorTargets.totalPointWeekTarget
            break
          case 'quarter':
            seniorTargetValue = seniorTargets.totalPointQuarterTarget
            break
          case 'month':
          default:
            seniorTargetValue = seniorTargets.totalPointMonthTarget
            break
        }
        
        const seniorTargetData = processedData.map(() => seniorTargetValue)
        datasets.push({
          label: seniorConfig.label,
          data: seniorTargetData,
          type: 'line',
          borderColor: seniorConfig.color,
          backgroundColor: seniorConfig.color,
          borderWidth: seniorConfig.borderWidth,
          borderDash: seniorConfig.borderDash,
          pointBackgroundColor: seniorConfig.color,
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 7,
          fill: false,
          tension: 0.1,
          yAxisID: 'y1'
        })
        
        console.log('🎯 TARGET LINE: Added STORYPOINT_BASE target lines - Middle:', middleTargetValue, 'Senior:', seniorTargetValue)
      }
    }

    console.log('📊 TEAM OVERVIEW: Generated chart data', {
      developersCount: developersArray.length,
      datasetsCount: datasets.length,
      dataPointsCount: data.length,
      isSingleProject,
      projectName: isSingleProject ? filters.projects[0] : null
    })

    return {
      labels: processedData.map(item => item.timePeriod),
      datasets: datasets
    }
  }, [data, filters, showTargetLines, selectedProjectKey, performanceFilter])

  // Chart.js configuration
  const chartOptions = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          position: 'top',
          labels: {
            usePointStyle: true,
            pointStyle: 'rect',
            padding: 15,
            font: {
              size: 12
            }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: 'white',
          bodyColor: 'white',
          borderColor: 'rgba(0, 0, 0, 0.1)',
          borderWidth: 1,
          cornerRadius: 6,
          displayColors: true,
          callbacks: {
            title: function(tooltipItems) {
              if (tooltipItems.length === 0) return ''
              
              const label = tooltipItems[0].label
              const dateRange = getWeekDateRange(label)
              const isWeekFormat = label && label.includes('-W')
              
              return isWeekFormat ? dateRange.formatted : label
            },
            afterTitle: function(tooltipItems) {
              if (tooltipItems.length === 0) return ''
              
              // Calculate total story points for this period (excluding velocity line)
              const barItems = tooltipItems.filter(item => item.dataset.type !== 'line')
              const total = barItems.reduce((sum, item) => sum + (item.parsed.y || 0), 0)
              return `Total: ${total} story points`
            },
            label: function(context) {
              if (context.dataset.type === 'line') {
                return `${context.dataset.label}: ${context.parsed.y} points (Velocity)`
              }
              
              // Only show members with story points > 0
              const storyPoints = context.parsed.y || 0
              if (storyPoints > 0) {
                return `${context.dataset.label}: ${storyPoints} points`
              }
              
              // Return null to hide this item from tooltip
              return null
            }
          }
        }
      },
      scales: {
        x: {
          stacked: true,
          grid: {
            display: false
          },
          ticks: {
            maxRotation: data && data.length > 6 ? 45 : 0,
            minRotation: 0,
            font: {
              size: 11
            }
          }
        },
        y: {
          stacked: true,
          beginAtZero: true,
          title: {
            display: true,
            text: 'Story Points',
            font: {
              size: 12,
              weight: 'bold'
            }
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.1)'
          },
          ticks: {
            font: {
              size: 11
            }
          }
        },
        y1: {
          type: 'linear',
          display: false,
          beginAtZero: true,
          // Position on right side but hidden to share scale with main y-axis
          position: 'right',
          grid: {
            drawOnChartArea: false
          }
        }
      }
    }
  }, [data, filters])

  // Early return if no data
  if (!chartData || !data || data.length === 0) {
    return (
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        height: height,
        minHeight: 200
      }}>
        <Typography variant="body1" color="text.secondary">
          No team story points data available
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ 
      height: { xs: Math.min(height, 300), sm: height },
      width: '100%'
    }}>
      <Chart 
        type="bar"
        data={chartData}
        options={chartOptions}
        height={height}
      />
    </Box>
  )
}

TeamOverviewChart.propTypes = {
  data: PropTypes.arrayOf(PropTypes.shape({
    timePeriod: PropTypes.string.isRequired
    // Dynamic developer properties validated at runtime
  })).isRequired,
  metrics: PropTypes.shape({
    totalContributions: PropTypes.number,
    totalStoryPoints: PropTypes.number,
    topContributors: PropTypes.array
  }),
  height: PropTypes.number,
  chartConfig: PropTypes.object,
  filters: PropTypes.shape({
    projects: PropTypes.arrayOf(PropTypes.string),
    developers: PropTypes.arrayOf(PropTypes.string),
    issueTypes: PropTypes.arrayOf(PropTypes.string),
    statuses: PropTypes.arrayOf(PropTypes.string),
    severities: PropTypes.arrayOf(PropTypes.string),
    rootCauses: PropTypes.arrayOf(PropTypes.string),
    timeframe: PropTypes.oneOf(['week', 'month', 'quarter']),
    statusFilter: PropTypes.arrayOf(PropTypes.string)
  }),
  showTargetLines: PropTypes.bool,
  performanceFilter: PropTypes.oneOf(['all', 'under', 'over']),
  selectedProjectKey: PropTypes.string
}

export default TeamOverviewChart