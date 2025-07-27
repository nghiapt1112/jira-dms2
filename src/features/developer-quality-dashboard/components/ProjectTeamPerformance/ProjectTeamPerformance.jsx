import React, { useMemo, useCallback } from 'react'
import PropTypes from 'prop-types'
import { Box, Paper, Typography } from '@mui/material'
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
import { memberConfiguration } from '../../../../constants/memberConfiguration'

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

const ProjectTeamPerformance = React.memo(({
  data,
  filters,
  showTargetLines = false,
  performanceFilter = 'all',
  height = 400,
  title = 'Project Team Performance'
}) => {
  // 1. Hooks first
  const isSingleProject = useMemo(() => {
    return filters?.projects?.length === 1
  }, [filters?.projects])
  
  const selectedProject = useMemo(() => {
    return isSingleProject ? filters?.projects?.[0] || null : null
  }, [filters?.projects, isSingleProject])
  
  // 2. Memoized values
  const projectConfig = useMemo(() => {
    if (!selectedProject) return null
    
    // Find project by key first, then by name as fallback
    let project = memberConfiguration.projects.find(p => p.key === selectedProject)
    if (!project) {
      project = memberConfiguration.projects.find(p => p.name === selectedProject)
    }
    
    return project
  }, [selectedProject])
  
  const timeframe = useMemo(() => {
    return filters?.timeframe || 'month'
  }, [filters?.timeframe])
  
  const targetValues = useMemo(() => {
    if (!projectConfig || !showTargetLines) return null
    
    const pointType = projectConfig.pointType
    const targets = memberConfiguration.performanceTargets[pointType]
    
    if (pointType === 'HOURS_BASE') {
      const config = targets.all
      switch (timeframe) {
        case 'week':
          return [{ value: config.totalPointWeekTarget, label: 'Target (All)', config: memberConfiguration.targetLineConfig.HOURS_BASE.all }]
        case 'quarter':
          return [{ value: config.totalPointQuarterTarget, label: 'Target (All)', config: memberConfiguration.targetLineConfig.HOURS_BASE.all }]
        case 'month':
        default:
          return [{ value: config.totalPointMonthTarget, label: 'Target (All)', config: memberConfiguration.targetLineConfig.HOURS_BASE.all }]
      }
    } else if (pointType === 'STORYPOINT_BASE') {
      const middleTargets = targets.middle
      const seniorTargets = targets.senior
      const middleConfig = memberConfiguration.targetLineConfig.STORYPOINT_BASE.middle
      const seniorConfig = memberConfiguration.targetLineConfig.STORYPOINT_BASE.senior
      
      let middleValue, seniorValue
      switch (timeframe) {
        case 'week':
          middleValue = middleTargets.totalPointWeekTarget
          seniorValue = seniorTargets.totalPointWeekTarget
          break
        case 'quarter':
          middleValue = middleTargets.totalPointQuarterTarget
          seniorValue = seniorTargets.totalPointQuarterTarget
          break
        case 'month':
        default:
          middleValue = middleTargets.totalPointMonthTarget
          seniorValue = seniorTargets.totalPointMonthTarget
          break
      }
      
      return [
        { value: middleValue, label: middleConfig.label, config: middleConfig },
        { value: seniorValue, label: seniorConfig.label, config: seniorConfig }
      ]
    }
    
    return null
  }, [projectConfig, showTargetLines, timeframe])
  
  // 3. Callbacks
  const getFilteredDevelopers = useCallback((developers) => {
    if (!developers || performanceFilter === 'all' || !targetValues) {
      return developers || []
    }
    
    // For STORYPOINT_BASE projects, we need to check developer level
    // For HOURS_BASE projects, use the single target value
    return developers.filter(dev => {
      const performance = dev.storyPoints || 0
      
      if (projectConfig?.pointType === 'STORYPOINT_BASE') {
        // Find developer level from memberConfiguration
        const devConfig = memberConfiguration.developers.find(d => 
          d.name === dev.developer || d.jiraId === dev.developer
        )
        const level = devConfig?.level || 'middle'
        const targetValue = level === 'senior' ? targetValues[1]?.value : targetValues[0]?.value
        
        if (performanceFilter === 'under') {
          return performance < targetValue
        } else if (performanceFilter === 'over') {
          return performance >= targetValue
        }
      } else {
        // HOURS_BASE projects use single target
        const targetValue = targetValues[0]?.value
        if (performanceFilter === 'under') {
          return performance < targetValue
        } else if (performanceFilter === 'over') {
          return performance >= targetValue
        }
      }
      
      return true
    })
  }, [performanceFilter, targetValues, projectConfig])
  
  // Aggregate story points by developer from teamContributionChart data
  const developerTotals = useMemo(() => {
    if (!data?.data || data.data.length === 0) {
      return []
    }
    
    // Extract all developers from the time-series data
    const developerSums = {}
    
    data.data.forEach(timeEntry => {
      Object.keys(timeEntry).forEach(key => {
        if (key !== 'timePeriod') {
          // This is a developer
          const storyPoints = timeEntry[key] || 0
          developerSums[key] = (developerSums[key] || 0) + storyPoints
        }
      })
    })
    
    // Convert to array format
    return Object.entries(developerSums)
      .map(([developer, totalStoryPoints]) => ({
        developer,
        storyPoints: totalStoryPoints
      }))
      .sort((a, b) => b.storyPoints - a.storyPoints) // Sort by story points descending
  }, [data?.data])
  
  const filteredDevelopers = useMemo(() => {
    return getFilteredDevelopers(developerTotals)
  }, [developerTotals, getFilteredDevelopers])
  
  const chartData = useMemo(() => {
    if (!filteredDevelopers || filteredDevelopers.length === 0) {
      return null
    }
    
    const datasets = [{
      label: 'Story Points',
      data: filteredDevelopers.map(dev => dev.storyPoints || 0),
      backgroundColor: '#1976d2',
      borderColor: '#1565c0',
      borderWidth: 1,
      type: 'bar'
    }]
    
    // Add target lines if enabled
    if (showTargetLines && targetValues) {
      targetValues.forEach(target => {
        const targetData = filteredDevelopers.map(() => target.value)
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
      labels: filteredDevelopers.map(dev => dev.developer),
      datasets
    }
  }, [filteredDevelopers, showTargetLines, targetValues])
  
  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: { display: false },
      legend: { 
        position: 'top',
        labels: {
          usePointStyle: true
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            if (context.dataset.type === 'line') {
              return `${context.dataset.label}: ${context.parsed.y}`
            }
            return `${context.dataset.label}: ${context.parsed.y} SP`
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Story Points'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Developers'
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index'
    }
  }), [])
  
  // 4. Early returns
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
  
  if (!isSingleProject) {
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
          {title} - Select a Single Project
        </Typography>
      </Paper>
    )
  }
  
  if (!chartData) {
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
          {title} - No Developers Match Filters
        </Typography>
      </Paper>
    )
  }
  
  // 5. Render
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
        
        {selectedProject && (
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ 
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              fontStyle: 'italic'
            }}
          >
            Project: {selectedProject}
          </Typography>
        )}
      </Box>
      
      {/* Chart */}
      <Box sx={{ 
        height: { xs: 300, sm: 350, md: height },
        width: '100%'
      }}>
        <Chart type="bar" data={chartData} options={chartOptions} />
      </Box>
      
      {/* Summary */}
      <Box sx={{ 
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mt: { xs: 2, sm: 3 },
        flexWrap: 'wrap',
        gap: 2
      }}>
        <Typography 
          variant="body2" 
          color="text.secondary"
          sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
        >
          Showing {filteredDevelopers.length} developer{filteredDevelopers.length !== 1 ? 's' : ''}
          {performanceFilter !== 'all' && ` (${performanceFilter} target)`}
        </Typography>
      </Box>
    </Paper>
  )
})

// PropTypes validation
ProjectTeamPerformance.propTypes = {
  data: PropTypes.shape({
    data: PropTypes.arrayOf(PropTypes.shape({
      timePeriod: PropTypes.string.isRequired
      // Note: Dynamic developer properties (e.g., 'developer1': 10, 'developer2': 5)
      // are validated at runtime since they're dynamic based on actual data
    })).isRequired
  }).isRequired,
  filters: PropTypes.shape({
    projects: PropTypes.arrayOf(PropTypes.string).isRequired,
    timeframe: PropTypes.oneOf(['week', 'month', 'quarter'])
  }).isRequired,
  showTargetLines: PropTypes.bool,
  performanceFilter: PropTypes.oneOf(['all', 'under', 'over']),
  height: PropTypes.number,
  title: PropTypes.string
}

ProjectTeamPerformance.displayName = 'ProjectTeamPerformance'

export default ProjectTeamPerformance