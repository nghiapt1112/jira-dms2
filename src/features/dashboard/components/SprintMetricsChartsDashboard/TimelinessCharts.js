import React, { useMemo, useCallback } from 'react'
import PropTypes from 'prop-types'
import { 
  Box, 
  Typography, 
  Paper, 
  Button,
  Grid,
  useTheme 
} from '@mui/material'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'
import { Visibility as ViewIcon } from '@mui/icons-material'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

const TimelinessCharts = React.memo(({ 
  sprintTimelinessData = [],
  projectTimelinessData = {},
  projectKey = null,
  height = 300,
  onViewDetails,
  title = 'Timeliness Analysis',
  ...props 
}) => {
  const theme = useTheme()

  const timelinessData = useMemo(() => {
    if (!sprintTimelinessData || sprintTimelinessData.length === 0) return null

    // Use processed sprint data instead of raw issues
    return processSprintTimelinessForCharts(sprintTimelinessData, projectTimelinessData, projectKey)
  }, [sprintTimelinessData, projectTimelinessData, projectKey])

  const chartDatasets = useMemo(() => {
    if (!timelinessData) return { labels: [], datasets: [] }

    const datasets = [
      {
        label: 'On Time',
        data: timelinessData.chartData.map(d => d.onTime),
        backgroundColor: theme.palette.success.main,
        borderColor: theme.palette.success.dark,
        borderWidth: 1,
        stack: 'timeliness'
      },
      {
        label: 'Late',
        data: timelinessData.chartData.map(d => d.late),
        backgroundColor: theme.palette.error.main,
        borderColor: theme.palette.error.dark,
        borderWidth: 1,
        stack: 'timeliness'
      }
    ]

    const labels = timelinessData.xAxisData

    return { labels, datasets }
  }, [timelinessData, theme])

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: false
      },
      legend: {
        display: true,
        position: 'top',
        align: 'end'
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#333',
        bodyColor: '#333',
        borderColor: '#ccc',
        borderWidth: 1,
        cornerRadius: 4,
        callbacks: {
          title: function(context) {
            return `Sprint: ${context[0].label}`
          },
          label: function(context) {
            const sprintData = timelinessData?.chartData[context.dataIndex]
            const value = context.parsed.y
            const percentage = sprintData ? sprintData.percentage.toFixed(1) : 0
            
            return [
              `${context.dataset.label}: ${value}`,
              `Total Issues: ${sprintData?.total || 0}`,
              `Timeliness Rate: ${percentage}%`
            ]
          }
        }
      }
    },
    scales: {
      x: {
        stacked: true,
        title: {
          display: true,
          text: 'Sprint',
          font: {
            size: 12,
            weight: 'bold'
          }
        },
        ticks: {
          maxRotation: 45,
          minRotation: 0,
          font: {
            size: 10
          }
        }
      },
      y: {
        stacked: true,
        title: {
          display: true,
          text: 'Issues Count',
          font: {
            size: 12,
            weight: 'bold'
          }
        },
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index'
    }
  }), [timelinessData])

  const handleViewLateIssues = useCallback(() => {
    if (onViewDetails) {
      onViewDetails('late_issues')
    }
  }, [onViewDetails])

  if (!sprintTimelinessData || sprintTimelinessData.length === 0) {
    return (
      <Paper elevation={1} sx={{ p: 2, width: '100%' }} {...props}>
        <Typography variant="h6">{title}</Typography>
        <Box sx={{ 
          height, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}>
          <Typography color="text.secondary">No timeliness data available</Typography>
        </Box>
      </Paper>
    )
  }

  if (!timelinessData) {
    return (
      <Paper elevation={1} sx={{ p: 2, width: '100%' }} {...props}>
        <Typography variant="h6">{title}</Typography>
        <Box sx={{ 
          height, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}>
          <Typography color="text.secondary">Unable to process sprint timeliness data</Typography>
        </Box>
      </Paper>
    )
  }

  return (
    <Paper elevation={1} sx={{ p: 2, width: '100%' }} {...props}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 2 
      }}>
        <Typography variant="h6">{title}</Typography>
        <Button
          size="small"
          startIcon={<ViewIcon />}
          onClick={handleViewLateIssues}
          disabled={!timelinessData.summary || timelinessData.summary.totalLate === 0}
        >
          View Late Issues
        </Button>
      </Box>

      {/* Sprint Timeliness Chart */}
      <Box sx={{ height: height - 100 }}>
        <Typography variant="subtitle2" gutterBottom>
          Sprint Timeliness by Sprint
        </Typography>
        <Bar 
          data={chartDatasets}
          options={chartOptions}
        />
      </Box>

      {/* Summary Statistics */}
      <Box sx={{ 
        mt: 2, 
        p: 1.5, 
        backgroundColor: theme.palette.background.default,
        borderRadius: 1,
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
        gap: 1,
        textAlign: 'center'
      }}>
        <Box>
          <Typography variant="h6" color="success.main">
            {timelinessData.summary.totalOnTime}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            On Time
          </Typography>
        </Box>
        
        <Box>
          <Typography variant="h6" color="error.main">
            {timelinessData.summary.totalLate}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Late
          </Typography>
        </Box>
        
        <Box>
          <Typography variant="h6" color="primary">
            {timelinessData.summary.overallTimelinessRate.toFixed(1)}%
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Overall Rate
          </Typography>
        </Box>
        
        <Box>
          <Typography variant="h6" color="info.main">
            {timelinessData.summary.totalSprints}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Sprints
          </Typography>
        </Box>
      </Box>

      {/* Insights */}
      {timelinessData.summary.overallTimelinessRate < 70 && (
        <Box sx={{ 
          mt: 2, 
          p: 1.5, 
          backgroundColor: theme.palette.warning.light,
          borderRadius: 1,
          border: `1px solid ${theme.palette.warning.main}`
        }}>
          <Typography variant="caption" color="warning.dark">
            <strong>Alert:</strong> Sprint timeliness rate is below 70%. Consider reviewing sprint planning and estimation accuracy.
          </Typography>
        </Box>
      )}
    </Paper>
  )
})

// Process sprint timeliness data for charts
const processSprintTimelinessForCharts = (sprintTimelinessData, projectTimelinessData, projectKey) => {
  if (!sprintTimelinessData || sprintTimelinessData.length === 0) return null

  let relevantSprints = sprintTimelinessData

  // If a specific project is selected, use project-centric data if available
  if (projectKey && projectKey !== 'all' && projectTimelinessData[projectKey]) {
    const projectSprints = projectTimelinessData[projectKey]
    
    const chartData = projectSprints.map(sprint => ({
      sprintName: sprint.sprintName,
      onTime: sprint.onTimeIssues,
      late: sprint.lateIssues,
      total: sprint.totalIssues,
      percentage: sprint.totalTimeliness
    }))

    const summary = {
      totalOnTime: chartData.reduce((sum, sprint) => sum + sprint.onTime, 0),
      totalLate: chartData.reduce((sum, sprint) => sum + sprint.late, 0),
      totalSprints: chartData.length,
      overallTimelinessRate: chartData.length > 0 
        ? chartData.reduce((sum, sprint) => sum + sprint.percentage, 0) / chartData.length 
        : 0
    }

    return {
      chartData,
      xAxisData: chartData.map(sprint => sprint.sprintName),
      summary
    }
  }

  // For 'all' projects, use sprint-centric data
  const chartData = relevantSprints.map(sprint => {
    // Extract project-specific data from the sprint
    let totalOnTime = 0
    let totalLate = 0
    let totalIssues = 0

    // Sum up all project data for this sprint
    Object.keys(sprint).forEach(key => {
      if (key.endsWith('_onTime')) {
        totalOnTime += sprint[key] || 0
      } else if (key.endsWith('_total')) {
        const projectKey = key.replace('_total', '')
        const onTimeKey = `${projectKey}_onTime`
        const onTime = sprint[onTimeKey] || 0
        const total = sprint[key] || 0
        const late = total - onTime
        
        totalIssues += total
        totalLate += late
      }
    })

    return {
      sprintName: sprint.sprintName,
      onTime: totalOnTime,
      late: totalLate,
      total: totalIssues,
      percentage: totalIssues > 0 ? (totalOnTime / totalIssues) * 100 : 0
    }
  })

  const summary = {
    totalOnTime: chartData.reduce((sum, sprint) => sum + sprint.onTime, 0),
    totalLate: chartData.reduce((sum, sprint) => sum + sprint.late, 0),
    totalSprints: chartData.length,
    overallTimelinessRate: chartData.length > 0 
      ? chartData.reduce((sum, sprint) => sum + sprint.percentage, 0) / chartData.length 
      : 0
  }

  return {
    chartData,
    xAxisData: chartData.map(sprint => sprint.sprintName),
    summary
  }
}

TimelinessCharts.propTypes = {
  sprintTimelinessData: PropTypes.arrayOf(PropTypes.object),
  projectTimelinessData: PropTypes.object,
  projectKey: PropTypes.string,
  height: PropTypes.number,
  onViewDetails: PropTypes.func,
  title: PropTypes.string
}

TimelinessCharts.displayName = 'TimelinessCharts'

export default TimelinessCharts