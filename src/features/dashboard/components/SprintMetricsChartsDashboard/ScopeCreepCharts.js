import React, { useMemo, useCallback } from 'react'
import PropTypes from 'prop-types'
import { 
  Box, 
  Typography, 
  Paper, 
  Button,
  useTheme 
} from '@mui/material'
import { BarChart } from '@mui/x-charts/BarChart'
import { Visibility as ViewIcon } from '@mui/icons-material'

const ScopeCreepCharts = React.memo(({ 
  sprintScopeCreepData = [],
  projectScopeCreepData = {},
  projectKey = null,
  height = 300,
  onViewDetails,
  title = 'Scope Creep Analysis',
  ...props 
}) => {
  const theme = useTheme()

  const chartData = useMemo(() => {
    if (!sprintScopeCreepData || sprintScopeCreepData.length === 0) return null

    // Use processed sprint scope creep data instead of raw issues
    return processSprintScopeCreepForCharts(sprintScopeCreepData, projectScopeCreepData, projectKey)
  }, [sprintScopeCreepData, projectScopeCreepData, projectKey])

  const handleViewScopeCreepIssues = useCallback(() => {
    if (onViewDetails) {
      onViewDetails('scope_creep')
    }
  }, [onViewDetails])

  if (!sprintScopeCreepData || sprintScopeCreepData.length === 0) {
    return (
      <Paper elevation={1} sx={{ p: 2, width: '100%' }} {...props}>
        <Typography variant="h6">{title}</Typography>
        <Box sx={{ 
          height, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}>
          <Typography color="text.secondary">No scope creep data available</Typography>
        </Box>
      </Paper>
    )
  }

  if (!chartData) {
    return (
      <Paper elevation={1} sx={{ p: 2, width: '100%' }} {...props}>
        <Typography variant="h6">{title}</Typography>
        <Box sx={{ 
          height, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}>
          <Typography color="text.secondary">Unable to process sprint scope creep data</Typography>
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
          onClick={handleViewScopeCreepIssues}
          disabled={!chartData.summary || chartData.summary.totalAdded === 0}
        >
          View Added Issues
        </Button>
      </Box>

      {/* Sprint Scope Creep Chart */}
      <Box sx={{ height: height - 100 }}>
        <Typography variant="subtitle2" gutterBottom>
          Scope Creep by Sprint
        </Typography>
        <BarChart
          width={undefined}
          height={height - 100}
          series={[
            {
              data: chartData.chartData.map(d => d.planned),
              label: 'Planned',
              color: theme.palette.success.main,
              stack: 'scope'
            },
            {
              data: chartData.chartData.map(d => d.added),
              label: 'Added',
              color: theme.palette.warning.main,
              stack: 'scope'
            }
          ]}
          xAxis={[{
            data: chartData.xAxisData,
            scaleType: 'band',
            tickLabelStyle: {
              angle: -45,
              textAnchor: 'end'
            }
          }]}
          yAxis={[{
            label: 'Issues Count'
          }]}
          margin={{ left: 60, right: 30, top: 20, bottom: 80 }}
          legend={{ direction: 'row', position: { vertical: 'top', horizontal: 'right' } }}
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
            {chartData.summary.totalPlanned}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Planned
          </Typography>
        </Box>
        
        <Box>
          <Typography variant="h6" color="warning.main">
            {chartData.summary.totalAdded}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Added
          </Typography>
        </Box>
        
        <Box>
          <Typography variant="h6" color="primary">
            {chartData.summary.overallScopeCreepRate.toFixed(1)}%
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Creep Rate
          </Typography>
        </Box>
        
        <Box>
          <Typography variant="h6" color="info.main">
            {chartData.summary.totalSprints}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Sprints
          </Typography>
        </Box>
      </Box>

      {/* Insights */}
      {chartData.summary.overallScopeCreepRate > 25 && (
        <Box sx={{ 
          mt: 2, 
          p: 1.5, 
          backgroundColor: theme.palette.warning.light,
          borderRadius: 1,
          border: `1px solid ${theme.palette.warning.main}`
        }}>
          <Typography variant="caption" color="warning.dark">
            <strong>Alert:</strong> Scope creep rate is above 25%. Consider strengthening sprint commitment and scope management.
          </Typography>
        </Box>
      )}
    </Paper>
  )
})

// Process sprint scope creep data for charts
const processSprintScopeCreepForCharts = (sprintScopeCreepData, projectScopeCreepData, projectKey) => {
  if (!sprintScopeCreepData || sprintScopeCreepData.length === 0) return null

  // If a specific project is selected, use project-centric data if available
  if (projectKey && projectKey !== 'all' && projectScopeCreepData[projectKey]) {
    const projectSprints = projectScopeCreepData[projectKey]
    
    const chartData = projectSprints.map(sprint => ({
      sprintName: sprint.sprintName,
      planned: sprint.plannedIssues,
      added: sprint.addedIssues,
      total: sprint.totalIssues,
      percentage: sprint.scopeCreepRate
    }))

    const summary = {
      totalPlanned: chartData.reduce((sum, sprint) => sum + sprint.planned, 0),
      totalAdded: chartData.reduce((sum, sprint) => sum + sprint.added, 0),
      totalSprints: chartData.length,
      overallScopeCreepRate: chartData.length > 0 
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
  const chartData = sprintScopeCreepData.map(sprint => {
    // Extract project-specific data from the sprint
    let totalPlanned = 0
    let totalAdded = 0
    let totalIssues = 0

    // Sum up all project data for this sprint
    Object.keys(sprint).forEach(key => {
      if (key.endsWith('_planned')) {
        totalPlanned += sprint[key] || 0
      } else if (key.endsWith('_added')) {
        totalAdded += sprint[key] || 0
      } else if (key.endsWith('_total')) {
        totalIssues += sprint[key] || 0
      }
    })

    return {
      sprintName: sprint.sprintName,
      planned: totalPlanned,
      added: totalAdded,
      total: totalIssues,
      percentage: totalIssues > 0 ? (totalAdded / totalIssues) * 100 : 0
    }
  })

  const summary = {
    totalPlanned: chartData.reduce((sum, sprint) => sum + sprint.planned, 0),
    totalAdded: chartData.reduce((sum, sprint) => sum + sprint.added, 0),
    totalSprints: chartData.length,
    overallScopeCreepRate: chartData.length > 0 
      ? chartData.reduce((sum, sprint) => sum + sprint.percentage, 0) / chartData.length 
      : 0
  }

  return {
    chartData,
    xAxisData: chartData.map(sprint => sprint.sprintName),
    summary
  }
}

ScopeCreepCharts.propTypes = {
  sprintScopeCreepData: PropTypes.arrayOf(PropTypes.object),
  projectScopeCreepData: PropTypes.object,
  projectKey: PropTypes.string,
  height: PropTypes.number,
  onViewDetails: PropTypes.func,
  title: PropTypes.string
}

ScopeCreepCharts.displayName = 'ScopeCreepCharts'

export default ScopeCreepCharts