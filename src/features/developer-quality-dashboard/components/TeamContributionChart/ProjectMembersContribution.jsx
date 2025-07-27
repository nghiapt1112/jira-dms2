import React, { useMemo } from 'react'
import PropTypes from 'prop-types'
import { Box, Paper, Typography, Chip } from '@mui/material'
import { Chart } from 'react-chartjs-2'
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
import { memberConfiguration } from '../../../../constants/memberConfiguration'
import { useDeveloperQualityStore } from '../../store/developerQualityStore'

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

/**
 * ProjectMembersContribution - Shows individual developer contributions for a single project
 * Inherits data from existing TeamContributionChart flow without modifications
 * Only renders when exactly one project is selected in filters
 * 
 * @param {Object} props - Component props (same as TeamContributionChart)
 * @param {Object} props.data - Chart data object with data array (inherited from parent)
 * @param {Object} props.metrics - Metrics object containing team statistics (inherited from parent)
 * @param {string} props.title - Chart title
 * @param {number} props.height - Chart height in pixels
 * @param {Object} props.filters - Filter object (inherited from parent)
 * @param {boolean} props.showTargetLines - Whether to show target performance lines (inherited from parent)
 * @param {string} props.performanceFilter - Performance filter (inherited from parent)
 * @returns {JSX.Element} Project members contribution chart component
 */
const ProjectMembersContribution = React.memo(({ 
  data, 
  metrics, 
  title = 'Project Members Contribution', 
  height = 400,
  filters = {},
  showTargetLines = false,
  performanceFilter = 'all'
}) => {
  // Get showTargetLines from Zustand store instead of props
  const { filters: storeFilters } = useDeveloperQualityStore()
  const showTargetLinesFromStore = storeFilters?.showTargetLines ?? true
  
  // Single project detection (inherited logic)
  const isSingleProject = useMemo(() => {
    return filters?.projects?.length === 1
  }, [filters?.projects])

  const selectedProjectKey = useMemo(() => {
    return isSingleProject ? filters.projects[0] : null
  }, [isSingleProject, filters?.projects])
  
  // Project configuration for target lines
  const projectConfig = useMemo(() => {
    if (!selectedProjectKey) return null
    
    // Find project by key first, then by name as fallback
    let project = memberConfiguration.projects.find(p => p.key === selectedProjectKey)
    if (!project) {
      project = memberConfiguration.projects.find(p => p.name === selectedProjectKey)
    }
    
    return project
  }, [selectedProjectKey])
  
  const timeframe = useMemo(() => {
    return filters?.timeframe || 'month'
  }, [filters?.timeframe])
  
  // Target values calculation (similar to ProjectTeamPerformance)
  const targetValues = useMemo(() => {
    if (!projectConfig || !showTargetLinesFromStore || !data?.data) return null
    
    const pointType = projectConfig.pointType
    const targets = memberConfiguration.performanceTargets[pointType]
    
    // Calculate number of time periods to multiply target by
    const numberOfPeriods = data.data.length
    
    if (pointType === 'HOURS_BASE') {
      const config = targets.all
      let perPeriodTarget
      switch (timeframe) {
        case 'week':
          perPeriodTarget = config.totalPointWeekTarget
          break
        case 'quarter':
          perPeriodTarget = config.totalPointQuarterTarget
          break
        case 'month':
        default:
          perPeriodTarget = config.totalPointMonthTarget
          break
      }
      
      // Multiply per-period target by number of periods for total target
      const totalTarget = perPeriodTarget * numberOfPeriods
      
      return [{ 
        value: totalTarget, 
        label: `Target (All) - ${numberOfPeriods} ${timeframe}s`, 
        config: memberConfiguration.targetLineConfig.HOURS_BASE.all 
      }]
    } else if (pointType === 'STORYPOINT_BASE') {
      const middleTargets = targets.middle
      const seniorTargets = targets.senior
      const middleConfig = memberConfiguration.targetLineConfig.STORYPOINT_BASE.middle
      const seniorConfig = memberConfiguration.targetLineConfig.STORYPOINT_BASE.senior
      
      let middlePerPeriod, seniorPerPeriod
      switch (timeframe) {
        case 'week':
          middlePerPeriod = middleTargets.totalPointWeekTarget
          seniorPerPeriod = seniorTargets.totalPointWeekTarget
          break
        case 'quarter':
          middlePerPeriod = middleTargets.totalPointQuarterTarget
          seniorPerPeriod = seniorTargets.totalPointQuarterTarget
          break
        case 'month':
        default:
          middlePerPeriod = middleTargets.totalPointMonthTarget
          seniorPerPeriod = seniorTargets.totalPointMonthTarget
          break
      }
      
      // Multiply per-period targets by number of periods for total targets
      const middleTotalTarget = middlePerPeriod * numberOfPeriods
      const seniorTotalTarget = seniorPerPeriod * numberOfPeriods
      
      return [
        { 
          value: middleTotalTarget, 
          label: `${middleConfig.label} - ${numberOfPeriods} ${timeframe}s`, 
          config: middleConfig 
        },
        { 
          value: seniorTotalTarget, 
          label: `${seniorConfig.label} - ${numberOfPeriods} ${timeframe}s`, 
          config: seniorConfig 
        }
      ]
    }
    
    return null
  }, [projectConfig, showTargetLinesFromStore, timeframe, data?.data])

  // Process inherited data to aggregate developer contributions across all time periods
  const aggregatedData = useMemo(() => {
    if (!data?.data || data.data.length === 0 || !isSingleProject) {
      return null
    }

    // Use the existing data structure - aggregate story points by developer
    const developerTotals = {}
    
    data.data.forEach(item => {
      Object.keys(item).forEach(key => {
        if (key !== 'timePeriod') {
          if (!developerTotals[key]) {
            developerTotals[key] = 0
          }
          developerTotals[key] += item[key] || 0
        }
      })
    })

    // Convert to array and sort by story points (descending)
    const sortedDevelopers = Object.entries(developerTotals)
      .map(([developer, storyPoints]) => ({ developer, storyPoints }))
      .sort((a, b) => b.storyPoints - a.storyPoints)
      .filter(item => item.storyPoints > 0) // Only show developers with contributions

    return sortedDevelopers
  }, [data?.data, isSingleProject])

  // Chart data for Chart.js (using inherited data)
  const chartData = useMemo(() => {
    if (!aggregatedData || aggregatedData.length === 0) {
      return null
    }

    // Generate colors (same as existing pattern)
    const colors = [
      '#1976d2', '#dc004e', '#2e7d32', '#ed6c02', '#9c27b0',
      '#00796b', '#d32f2f', '#7b1fa2', '#388e3c', '#f57c00',
      '#303f9f', '#c2185b', '#689f38', '#ff5722', '#512da8'
    ]

    const labels = aggregatedData.map(item => item.developer)
    const dataValues = aggregatedData.map(item => item.storyPoints)

    const datasets = [
      {
        label: 'Total Story Points',
        data: dataValues,
        backgroundColor: labels.map((_, index) => colors[index % colors.length]),
        borderColor: labels.map((_, index) => colors[index % colors.length]),
        borderWidth: 1,
        borderRadius: 4,
        borderSkipped: false,
        type: 'bar'
      }
    ]
    
    // Add target lines if enabled
    if (showTargetLinesFromStore && targetValues) {
      targetValues.forEach(target => {
        const targetData = aggregatedData.map(() => target.value)
        datasets.push({
          label: target.label,
          data: targetData,
          type: 'line',
          borderColor: target.config.color,
          backgroundColor: target.config.color,
          borderWidth: target.config.borderWidth,
          borderDash: target.config.borderDash,
          pointBackgroundColor: target.config.color,
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 3,
          pointHoverRadius: 5,
          fill: false,
          tension: 0.1
        })
      })
    }

    return {
      labels: labels,
      datasets
    }
  }, [aggregatedData, showTargetLinesFromStore, targetValues])

  // Chart options
  const chartOptions = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: showTargetLinesFromStore && targetValues && targetValues.length > 0,
          position: 'top',
          labels: {
            usePointStyle: true,
            filter: function(legendItem) {
              // Only show target lines in legend, not the main bars
              return legendItem.text.includes('Target')
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
          callbacks: {
            title: function(tooltipItems) {
              if (tooltipItems.length === 0) return ''
              return `${tooltipItems[0].label}`
            },
            label: function(context) {
              if (context.dataset.type === 'line') {
                return `${context.dataset.label}: ${context.parsed.y} SP`
              }
              const storyPoints = context.parsed.y || 0
              const timeframe = filters.timeframe || 'month'
              const periods = data?.data?.length || 1
              const timeframePlural = timeframe === 'week' ? 'weeks' : timeframe === 'month' ? 'months' : 'quarters'
              
              return [
                `Total Story Points: ${storyPoints}`,
                `Across ${periods} ${periods === 1 ? timeframe : timeframePlural}`
              ]
            }
          }
        }
      },
      scales: {
        x: {
          grid: {
            display: false
          },
          ticks: {
            maxRotation: aggregatedData && aggregatedData.length > 8 ? 45 : 0,
            minRotation: 0,
            font: {
              size: 11
            }
          },
          title: {
            display: true,
            text: 'Developers',
            font: {
              size: 12,
              weight: 'bold'
            }
          }
        },
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Total Story Points',
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
        }
      },
      interaction: {
        intersect: false,
        mode: 'index'
      }
    }
  }, [aggregatedData, filters, data?.data, showTargetLinesFromStore, targetValues])

  // Early returns (same logic as existing components)
  if (!isSingleProject) {
    return null // Don't render if multiple or no projects selected
  }

  if (!data?.data || data.data.length === 0) {
    return (
      <Paper 
        elevation={1} 
        sx={{ 
          p: { xs: 2, sm: 3 }, 
          width: '100%',
          backgroundColor: 'background.paper'
        }}
      >
        <Typography variant="h6" color="text.secondary">
          {title} - No Data Available
        </Typography>
      </Paper>
    )
  }

  if (!aggregatedData || aggregatedData.length === 0) {
    return (
      <Paper 
        elevation={1} 
        sx={{ 
          p: { xs: 2, sm: 3 }, 
          width: '100%',
          backgroundColor: 'background.paper'
        }}
      >
        <Typography variant="h6" color="text.secondary">
          {title} - No Contributions Found
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          No story points found for project: {selectedProjectKey}
        </Typography>
      </Paper>
    )
  }

  return (
    <Paper 
      elevation={1} 
      sx={{ 
        p: { xs: 2, sm: 3 }, 
        width: '100%',
        backgroundColor: 'background.paper'
      }}
    >
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        mb: { xs: 2, sm: 3 },
        flexWrap: 'wrap',
        gap: 2
      }}>
        <Typography 
          variant="h6" 
          sx={{ 
            fontSize: { xs: '1rem', sm: '1.25rem' },
            fontWeight: 600
          }}
        >
          {title}
        </Typography>
        
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1 
        }}>
          <Chip
            label={selectedProjectKey}
            size="small"
            color="primary"
            variant="outlined"
          />
          {performanceFilter !== 'all' && (
            <Chip
              label={`${performanceFilter} performance`}
              size="small"
              color={performanceFilter === 'over' ? 'success' : 'warning'}
              variant="outlined"
            />
          )}
        </Box>
      </Box>
      
      {/* Chart */}
      <Box sx={{ height, width: '100%' }}>
        {chartData ? (
          <Chart type="bar" data={chartData} options={chartOptions} />
        ) : (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            height: '100%'
          }}>
            <Typography variant="body1" color="text.secondary">
              No chart data available
            </Typography>
          </Box>
        )}
      </Box>
      
      {/* Summary using inherited metrics */}
      <Box sx={{ 
        display: 'grid',
        gridTemplateColumns: { 
          xs: '1fr',
          sm: 'repeat(2, 1fr)',
          md: 'repeat(3, 1fr)'
        },
        gap: { xs: 1, sm: 2 },
        mt: { xs: 2, sm: 3 }
      }}>
        <Box>
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
          >
            Contributors
          </Typography>
          <Typography 
            variant="h6"
            sx={{ 
              fontSize: { xs: '1rem', sm: '1.25rem' },
              fontWeight: 600
            }}
          >
            {aggregatedData?.length || 0}
          </Typography>
        </Box>
        
        <Box>
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
          >
            Total Story Points
          </Typography>
          <Typography 
            variant="h6"
            sx={{ 
              fontSize: { xs: '1rem', sm: '1.25rem' },
              fontWeight: 600
            }}
          >
            {metrics?.totalStoryPoints?.toLocaleString() || 0}
          </Typography>
        </Box>
        
        <Box>
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
          >
            Average per Developer
          </Typography>
          <Typography 
            variant="h6"
            sx={{ 
              fontSize: { xs: '1rem', sm: '1.25rem' },
              fontWeight: 600
            }}
          >
            {metrics?.averageStoryPoints?.toFixed(1) || '0.0'}
          </Typography>
        </Box>
      </Box>
    </Paper>
  )
})

// Same PropTypes as TeamContributionChart for consistency
ProjectMembersContribution.propTypes = {
  data: PropTypes.shape({
    data: PropTypes.arrayOf(PropTypes.shape({
      timePeriod: PropTypes.string.isRequired
      // Dynamic developer properties validated at runtime
    }))
  }),
  metrics: PropTypes.shape({
    totalContributions: PropTypes.number,
    totalStoryPoints: PropTypes.number,
    averageContribution: PropTypes.number,
    averageStoryPoints: PropTypes.number,
    contributionTrend: PropTypes.oneOf(['increasing', 'decreasing', 'stable']),
    topContributors: PropTypes.arrayOf(PropTypes.shape({
      developer: PropTypes.string.isRequired,
      contributions: PropTypes.number.isRequired,
      storyPoints: PropTypes.number.isRequired,
      percentage: PropTypes.number
    }))
  }),
  title: PropTypes.string,
  height: PropTypes.number,
  filters: PropTypes.shape({
    developers: PropTypes.arrayOf(PropTypes.string),
    projects: PropTypes.arrayOf(PropTypes.string),
    issueTypes: PropTypes.arrayOf(PropTypes.string),
    statuses: PropTypes.arrayOf(PropTypes.string),
    severities: PropTypes.arrayOf(PropTypes.string),
    rootCauses: PropTypes.arrayOf(PropTypes.string),
    timeframe: PropTypes.oneOf(['week', 'month', 'quarter']),
    statusFilter: PropTypes.arrayOf(PropTypes.string)
  }),
  showTargetLines: PropTypes.bool,
  performanceFilter: PropTypes.oneOf(['all', 'under', 'over'])
}

ProjectMembersContribution.displayName = 'ProjectMembersContribution'

export default ProjectMembersContribution