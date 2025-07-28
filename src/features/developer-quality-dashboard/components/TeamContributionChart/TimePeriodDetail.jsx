import React, { useMemo } from 'react'
import PropTypes from 'prop-types'
import { Box, Paper, Typography, Button, Chip, Divider } from '@mui/material'
import { ArrowBack, TrendingUp, TrendingDown, TrendingFlat } from '@mui/icons-material'
import { Bar } from 'react-chartjs-2'
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
import { getWeekDateRange } from '../../../../shared/utils/timeUtils'
import { memberConfiguration } from '../../../../constants/memberConfiguration'

// Register Chart.js components for bar and line charts
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
 * TimePeriodDetail - Shows detailed developer contributions for a specific time period
 * Displays when user clicks on a time period column in the Team Contribution chart
 * 
 * @param {Object} props - Component props
 * @param {Object} props.timePeriodData - Data for the selected time period
 * @param {Object} props.metrics - Overall metrics object
 * @param {string} props.selectedProjectKey - The selected project key
 * @param {Object} props.filters - Current filter settings
 * @param {Function} props.onBack - Callback to return to main chart view
 * @param {number} props.height - Chart height in pixels
 * @param {boolean} props.showTargetLines - Whether target lines are enabled
 * @param {string} props.performanceFilter - Performance filter setting
 * @returns {JSX.Element} Time period detail component
 */
const TimePeriodDetail = React.memo(({ 
  timePeriodData,
  metrics,
  selectedProjectKey,
  filters = {},
  onBack,
  height = 400,
  showTargetLines = false,
  performanceFilter = 'all'
}) => {
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

  // Calculate target values for single time period
  const targetValues = useMemo(() => {
    if (!projectConfig || !showTargetLines) return null
    
    const pointType = projectConfig.pointType
    const timeframe = filters?.timeframe || 'month'
    const targets = memberConfiguration.performanceTargets[pointType]
    
    if (pointType === 'STORYPOINT_HOURS_BASE') {
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
      
      return [{ 
        value: perPeriodTarget, // Single period target (not multiplied)
        label: `Target (All) - ${timeframe}`, 
        config: memberConfiguration.targetLineConfig.STORYPOINT_HOURS_BASE.all 
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
      
      return [
        { 
          value: middlePerPeriod, // Single period target (not multiplied)
          label: `${middleConfig.label} - ${timeframe}`, 
          config: middleConfig 
        },
        { 
          value: seniorPerPeriod, // Single period target (not multiplied)
          label: `${seniorConfig.label} - ${timeframe}`, 
          config: seniorConfig 
        }
      ]
    }
    
    return null
  }, [projectConfig, showTargetLines, filters?.timeframe])

  // Process time period data for chart display
  const { chartData, developerStats, timePeriodLabel } = useMemo(() => {
    if (!timePeriodData) {
      return { chartData: null, developerStats: [], timePeriodLabel: '' }
    }

    // Extract developers and their story points for this time period
    const developers = []
    const storyPoints = []
    let totalStoryPoints = 0

    Object.keys(timePeriodData).forEach(key => {
      if (key !== 'timePeriod') {
        const points = timePeriodData[key] || 0
        if (points > 0) {
          developers.push(key)
          storyPoints.push(points)
          totalStoryPoints += points
        }
      }
    })

    // Sort by story points (descending)
    const sortedData = developers
      .map((dev, index) => ({ developer: dev, storyPoints: storyPoints[index] }))
      .sort((a, b) => b.storyPoints - a.storyPoints)

    // Prepare chart data
    const colors = [
      '#1976d2', '#dc004e', '#2e7d32', '#ed6c02', '#9c27b0',
      '#00796b', '#d32f2f', '#7b1fa2', '#388e3c', '#f57c00',
      '#303f9f', '#c2185b', '#689f38', '#ff5722', '#512da8'
    ]

    const datasets = [
      {
        label: 'Story Points',
        data: sortedData.map(item => item.storyPoints),
        backgroundColor: sortedData.map((_, index) => colors[index % colors.length]),
        borderColor: sortedData.map((_, index) => colors[index % colors.length]),
        borderWidth: 1,
        borderRadius: 4,
        borderSkipped: false,
        type: 'bar'
      }
    ]

    // Add target lines if enabled
    if (showTargetLines && targetValues) {
      targetValues.forEach(target => {
        const targetData = sortedData.map(() => target.value)
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

    const chartData = {
      labels: sortedData.map(item => item.developer),
      datasets: datasets
    }

    // Format time period label
    const rawLabel = timePeriodData.timePeriod || ''
    let formattedLabel = rawLabel
    
    // Handle week format specially
    if (rawLabel.includes('-W')) {
      const dateRange = getWeekDateRange(rawLabel)
      formattedLabel = dateRange.formatted
    }

    // Calculate developer statistics
    const avgStoryPoints = sortedData.length > 0 ? totalStoryPoints / sortedData.length : 0
    const maxContributor = sortedData[0] || null
    const minContributor = sortedData[sortedData.length - 1] || null

    const developerStats = {
      total: totalStoryPoints,
      average: avgStoryPoints,
      count: sortedData.length,
      max: maxContributor,
      min: minContributor,
      sortedData
    }

    return {
      chartData,
      developerStats,
      timePeriodLabel: formattedLabel
    }
  }, [timePeriodData, showTargetLines, targetValues])

  // Chart options
  const chartOptions = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: showTargetLines && targetValues && targetValues.length > 0,
          position: 'top',
          labels: {
            usePointStyle: true,
            filter: function(legendItem) {
              // Only show target lines in legend, hide the bar chart legend
              return legendItem.text !== 'Story Points'
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
                // Target line tooltip
                return `${context.dataset.label}: ${context.parsed.y}`
              }
              
              // Bar chart tooltip
              const storyPoints = context.parsed.y || 0
              const percentage = developerStats.total > 0 
                ? ((storyPoints / developerStats.total) * 100).toFixed(1)
                : '0.0'
              
              return [
                `Story Points: ${storyPoints}`,
                `Percentage: ${percentage}%`
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
            maxRotation: developerStats.count > 8 ? 45 : 0,
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
        }
      }
    }
  }, [developerStats, showTargetLines, targetValues])

  // Performance trend icon (could be enhanced based on comparison with previous periods)
  const getTrendIcon = () => {
    // For now, use a neutral trend - could be enhanced with historical comparison
    return <TrendingFlat sx={{ fontSize: 16, color: 'text.secondary' }} />
  }

  // Early return if no data
  if (!timePeriodData || !chartData) {
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
          No time period data available
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
      {/* Header with back button */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        mb: { xs: 2, sm: 3 },
        flexWrap: 'wrap',
        gap: 2
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<ArrowBack />}
            onClick={onBack}
            sx={{ flexShrink: 0 }}
          >
            Back to Overview
          </Button>
          
          <Typography 
            variant="h6" 
            sx={{ 
              fontSize: { xs: '1rem', sm: '1.25rem' },
              fontWeight: 600
            }}
          >
            Period Detail: {timePeriodLabel}
          </Typography>
        </Box>
        
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1,
          flexWrap: 'wrap'
        }}>
          {selectedProjectKey && (
            <Chip
              label={selectedProjectKey}
              size="small"
              color="primary"
              variant="outlined"
            />
          )}
          {performanceFilter !== 'all' && (
            <Chip
              label={`${performanceFilter} performance`}
              size="small"
              color={performanceFilter === 'over' ? 'success' : 'warning'}
              variant="outlined"
            />
          )}
          {getTrendIcon()}
        </Box>
      </Box>
      
      <Divider sx={{ mb: { xs: 2, sm: 3 } }} />
      
      {/* Summary stats */}
      <Box sx={{ 
        display: 'grid',
        gridTemplateColumns: { 
          xs: '1fr',
          sm: 'repeat(2, 1fr)',
          md: 'repeat(4, 1fr)'
        },
        gap: { xs: 2, sm: 3 },
        mb: { xs: 2, sm: 3 }
      }}>
        <Box>
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
          >
            Total Story Points
          </Typography>
          <Typography 
            variant="h5"
            sx={{ 
              fontSize: { xs: '1.25rem', sm: '1.5rem' },
              fontWeight: 600,
              color: 'primary.main'
            }}
          >
            {developerStats.total}
          </Typography>
        </Box>
        
        <Box>
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
          >
            Contributors
          </Typography>
          <Typography 
            variant="h5"
            sx={{ 
              fontSize: { xs: '1.25rem', sm: '1.5rem' },
              fontWeight: 600
            }}
          >
            {developerStats.count}
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
            variant="h5"
            sx={{ 
              fontSize: { xs: '1.25rem', sm: '1.5rem' },
              fontWeight: 600
            }}
          >
            {developerStats.average.toFixed(1)}
          </Typography>
        </Box>
        
        <Box>
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
          >
            Top Contributor
          </Typography>
          <Typography 
            variant="h6"
            sx={{ 
              fontSize: { xs: '1rem', sm: '1.25rem' },
              fontWeight: 600,
              color: 'success.main'
            }}
          >
            {developerStats.max ? `${developerStats.max.developer} (${developerStats.max.storyPoints})` : 'N/A'}
          </Typography>
        </Box>
      </Box>
      
      {/* Chart */}
      <Box sx={{ height, width: '100%', mb: { xs: 2, sm: 3 } }}>
        <Bar data={chartData} options={chartOptions} />
      </Box>
      
      {/* Target Lines Information */}
      {showTargetLines && targetValues && targetValues.length > 0 && (
        <Box sx={{ mb: { xs: 2, sm: 3 } }}>
          <Typography 
            variant="h6" 
            sx={{ 
              fontSize: { xs: '1rem', sm: '1.125rem' },
              fontWeight: 600,
              mb: 2
            }}
          >
            Performance Targets
          </Typography>
          
          <Box sx={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: 1 
          }}>
            {targetValues.map((target, index) => (
              <Chip
                key={index}
                label={`${target.label}: ${target.value} pts`}
                size="small"
                variant="outlined"
                sx={{ 
                  fontSize: { xs: '0.65rem', sm: '0.75rem' },
                  height: { xs: 28, sm: 32 },
                  borderColor: target.config.color,
                  color: target.config.color,
                  '& .MuiChip-label': {
                    color: target.config.color
                  }
                }}
              />
            ))}
          </Box>
        </Box>
      )}

      {/* Developer breakdown */}
      {developerStats.sortedData.length > 0 && (
        <Box>
          <Typography 
            variant="h6" 
            sx={{ 
              fontSize: { xs: '1rem', sm: '1.125rem' },
              fontWeight: 600,
              mb: 2
            }}
          >
            Developer Breakdown
          </Typography>
          
          <Box sx={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: 1 
          }}>
            {developerStats.sortedData.map((dev, index) => {
              const percentage = developerStats.total > 0 
                ? ((dev.storyPoints / developerStats.total) * 100).toFixed(1)
                : '0.0'
              
              return (
                <Chip
                  key={dev.developer}
                  label={`${dev.developer}: ${dev.storyPoints} pts (${percentage}%)`}
                  size="small"
                  variant={index === 0 ? 'filled' : 'outlined'}
                  color={index === 0 ? 'primary' : 'default'}
                  sx={{ 
                    fontSize: { xs: '0.65rem', sm: '0.75rem' },
                    height: { xs: 28, sm: 32 }
                  }}
                />
              )
            })}
          </Box>
        </Box>
      )}
    </Paper>
  )
})

TimePeriodDetail.propTypes = {
  timePeriodData: PropTypes.shape({
    timePeriod: PropTypes.string.isRequired
    // Dynamic developer properties validated at runtime
  }),
  metrics: PropTypes.shape({
    totalContributions: PropTypes.number,
    totalStoryPoints: PropTypes.number,
    averageContribution: PropTypes.number,
    averageStoryPoints: PropTypes.number,
    topContributors: PropTypes.arrayOf(PropTypes.shape({
      developer: PropTypes.string.isRequired,
      contributions: PropTypes.number.isRequired,
      storyPoints: PropTypes.number.isRequired,
      percentage: PropTypes.number
    }))
  }),
  selectedProjectKey: PropTypes.string,
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
  onBack: PropTypes.func.isRequired,
  height: PropTypes.number,
  showTargetLines: PropTypes.bool,
  performanceFilter: PropTypes.oneOf(['all', 'under', 'over'])
}

TimePeriodDetail.displayName = 'TimePeriodDetail'

export default TimePeriodDetail