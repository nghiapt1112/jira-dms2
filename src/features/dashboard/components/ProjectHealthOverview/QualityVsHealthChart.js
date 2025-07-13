import React, { useMemo, useCallback } from 'react'
import PropTypes from 'prop-types'
import { Box, Typography, Paper, useTheme } from '@mui/material'
import { ScatterChart } from '@mui/x-charts/ScatterChart'

const QualityVsHealthChart = React.memo(({ 
  data, 
  title = 'Quality vs Health Performance', 
  height = 400, 
  onProjectClick,
  ...props 
}) => {
  const theme = useTheme()

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return []
    
    return data.map(project => ({
      x: project.healthScore || 0,
      y: project.qualityScore || 0,
      id: project.id || project.projectKey,
      size: Math.max((project.effort || 0) / 10, 10),
      projectName: project.name || project.projectKey,
      health: project.health || 'Unknown',
      qualityStatus: project.qualityStatus || 'Unknown',
      bugRate: project.bugRate || 0,
      progress: project.progress || 0,
      totalIssues: project.issues?.length || 0
    }))
  }, [data])

  const getColorByHealth = useCallback((healthScore) => {
    if (healthScore >= 80) return theme.palette.success.main
    if (healthScore >= 60) return theme.palette.info.main
    if (healthScore >= 40) return theme.palette.warning.main
    return theme.palette.error.main
  }, [theme])

  const chartSeries = useMemo(() => {
    const healthGroups = {
      healthy: { data: [], color: theme.palette.success.main, label: 'Healthy (≥80)' },
      moderate: { data: [], color: theme.palette.info.main, label: 'Moderate (60-79)' },
      atRisk: { data: [], color: theme.palette.warning.main, label: 'At Risk (40-59)' },
      critical: { data: [], color: theme.palette.error.main, label: 'Critical (<40)' }
    }

    chartData.forEach(point => {
      if (point.x >= 80) {
        healthGroups.healthy.data.push(point)
      } else if (point.x >= 60) {
        healthGroups.moderate.data.push(point)
      } else if (point.x >= 40) {
        healthGroups.atRisk.data.push(point)
      } else {
        healthGroups.critical.data.push(point)
      }
    })

    return Object.values(healthGroups)
      .filter(group => group.data.length > 0)
      .map(group => ({
        data: group.data,
        label: group.label,
        color: group.color
      }))
  }, [chartData, theme])

  const getTooltipContent = useCallback((params) => {
    if (!params || params.dataIndex === undefined) return null
    
    const seriesData = chartSeries[params.seriesIndex]?.data
    if (!seriesData) return null
    
    const point = seriesData[params.dataIndex]
    if (!point) return null

    return (
      <Box sx={{ p: 1 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
          {point.projectName}
        </Typography>
        <Typography variant="body2">
          Quality Score: {point.y.toFixed(1)}%
        </Typography>
        <Typography variant="body2">
          Health Score: {point.x.toFixed(1)}%
        </Typography>
        <Typography variant="body2">
          Health Status: {point.health}
        </Typography>
        <Typography variant="body2">
          Quality Status: {point.qualityStatus}
        </Typography>
        <Typography variant="body2">
          Bug Rate: {point.bugRate.toFixed(1)}%
        </Typography>
        <Typography variant="body2">
          Total Issues: {point.totalIssues}
        </Typography>
      </Box>
    )
  }, [chartSeries])

  const handlePointClick = useCallback((event, params) => {
    if (onProjectClick && params?.dataIndex !== undefined && params?.seriesIndex !== undefined) {
      const seriesData = chartSeries[params.seriesIndex]?.data
      if (seriesData) {
        const point = seriesData[params.dataIndex]
        if (point) {
          onProjectClick(point.id, point)
        }
      }
    }
  }, [onProjectClick, chartSeries])

  if (!data || data.length === 0) {
    return (
      <Paper elevation={1} sx={{ p: 2, width: '100%' }} {...props}>
        <Typography variant="h6">{title}</Typography>
        <Box sx={{ 
          height, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}>
          <Typography color="text.secondary">No project data available</Typography>
        </Box>
      </Paper>
    )
  }

  return (
    <Paper elevation={1} sx={{ p: 2, width: '100%' }} {...props}>
      <Typography variant="h6" sx={{ mb: 2 }}>{title}</Typography>
      
      <Box sx={{ 
        height, 
        width: '100%',
        [theme.breakpoints.down('md')]: {
          height: Math.max(height - 100, 300)
        }
      }}>
        <ScatterChart
          width={undefined}
          height={height}
          series={chartSeries}
          xAxis={[{
            label: 'Health Score (%)',
            min: 0,
            max: 100,
            tickNumber: 5
          }]}
          yAxis={[{
            label: 'Quality Score (%)',
            min: 0,
            max: 100,
            tickNumber: 5
          }]}
          margin={{ 
            left: 80, 
            right: 50, 
            top: 20, 
            bottom: 80,
            [theme.breakpoints.down('sm')]: {
              left: 60,
              right: 30,
              bottom: 60
            }
          }}
          tooltip={{
            trigger: 'item',
            content: getTooltipContent
          }}
          onItemClick={handlePointClick}
          grid={{ horizontal: true, vertical: true }}
          legend={{
            direction: 'row',
            position: { vertical: 'top', horizontal: 'right' }
          }}
        />
      </Box>

      <Box sx={{ 
        mt: 2, 
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 2,
        [theme.breakpoints.down('sm')]: {
          gridTemplateColumns: '1fr',
          gap: 1
        }
      }}>
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            Quality Zones:
          </Typography>
          <Typography variant="caption">
            Excellent ≥90% | Good 70-89% | Fair 50-69% | Poor &lt;50%
          </Typography>
        </Box>
        
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            Health Zones:
          </Typography>
          <Typography variant="caption">
            Healthy ≥80% | Moderate 60-79% | At Risk 40-59% | Critical &lt;40%
          </Typography>
        </Box>
      </Box>

      <Box sx={{ 
        mt: 2, 
        p: 1.5, 
        backgroundColor: theme.palette.background.default,
        borderRadius: 1 
      }}>
        <Typography variant="caption" color="text.secondary">
          <strong>Ideal Zone:</strong> Top-right quadrant (High Quality & High Health)
        </Typography>
        <br />
        <Typography variant="caption" color="text.secondary">
          <strong>Action Required:</strong> Bottom-left quadrant (Low Quality & Low Health)
        </Typography>
      </Box>

      <Typography 
        variant="caption" 
        color="text.secondary" 
        sx={{ 
          mt: 1, 
          display: 'block',
          [theme.breakpoints.down('sm')]: {
            fontSize: '0.7rem'
          }
        }}
      >
        Bubble size represents project effort. Colors indicate health status.
      </Typography>
    </Paper>
  )
})

QualityVsHealthChart.propTypes = {
  data: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string,
    projectKey: PropTypes.string,
    name: PropTypes.string,
    qualityScore: PropTypes.number,
    healthScore: PropTypes.number,
    effort: PropTypes.number,
    health: PropTypes.string,
    qualityStatus: PropTypes.string,
    bugRate: PropTypes.number,
    progress: PropTypes.number,
    issues: PropTypes.array
  })),
  title: PropTypes.string,
  height: PropTypes.number,
  onProjectClick: PropTypes.func
}

QualityVsHealthChart.displayName = 'QualityVsHealthChart'

export default QualityVsHealthChart