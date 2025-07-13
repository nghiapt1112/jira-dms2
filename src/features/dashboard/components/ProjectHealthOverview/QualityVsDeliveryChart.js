import React, { useMemo, useCallback } from 'react'
import PropTypes from 'prop-types'
import { Box, Typography, Paper, Tooltip, useTheme } from '@mui/material'
import { ScatterChart } from '@mui/x-charts/ScatterChart'

const QualityVsDeliveryChart = React.memo(({ 
  data, 
  title = 'Quality vs Delivery Performance', 
  height = 400, 
  onProjectClick,
  ...props 
}) => {
  const theme = useTheme()

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return []
    
    return data.map(project => ({
      x: project.delivery || 0,
      y: project.qualityScore || 0,
      id: project.id || project.projectKey,
      size: Math.max((project.effort || 0) / 10, 10),
      projectName: project.name || project.projectKey,
      bugs: project.bugs?.length || 0,
      highSeverityBugs: project.highSeverityBugs || 0,
      progress: project.progress || 0
    }))
  }, [data])

  const getTooltipContent = useCallback((params) => {
    if (!params || !params.dataIndex !== undefined) return null
    
    const point = chartData[params.dataIndex]
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
          Delivery Score: {point.x.toFixed(1)}%
        </Typography>
        <Typography variant="body2">
          Progress: {point.progress.toFixed(1)}%
        </Typography>
        <Typography variant="body2">
          Total Bugs: {point.bugs}
        </Typography>
        <Typography variant="body2" color="error">
          High Severity: {point.highSeverityBugs}
        </Typography>
      </Box>
    )
  }, [chartData])

  const handlePointClick = useCallback((event, params) => {
    if (onProjectClick && params?.dataIndex !== undefined) {
      const point = chartData[params.dataIndex]
      if (point) {
        onProjectClick(point.id, point)
      }
    }
  }, [onProjectClick, chartData])

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
          series={[{
            data: chartData,
            label: 'Projects',
            color: theme.palette.primary.main,
          }]}
          xAxis={[{
            label: 'Delivery Performance (%)',
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
        />
      </Box>

      <Box sx={{ 
        mt: 2, 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: 2,
        [theme.breakpoints.down('sm')]: {
          flexDirection: 'column',
          gap: 1
        }
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box 
            sx={{ 
              width: 12, 
              height: 12, 
              backgroundColor: theme.palette.success.main,
              borderRadius: '50%' 
            }} 
          />
          <Typography variant="caption">
            High Performance (Quality ≥80%, Delivery ≥80%)
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box 
            sx={{ 
              width: 12, 
              height: 12, 
              backgroundColor: theme.palette.warning.main,
              borderRadius: '50%' 
            }} 
          />
          <Typography variant="caption">
            Moderate Performance (Quality 60-79% or Delivery 60-79%)
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box 
            sx={{ 
              width: 12, 
              height: 12, 
              backgroundColor: theme.palette.error.main,
              borderRadius: '50%' 
            }} 
          />
          <Typography variant="caption">
            Low Performance (Quality &lt;60% or Delivery &lt;60%)
          </Typography>
        </Box>
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
        Bubble size represents project effort. Click on bubbles for project details.
      </Typography>
    </Paper>
  )
})

QualityVsDeliveryChart.propTypes = {
  data: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string,
    projectKey: PropTypes.string,
    name: PropTypes.string,
    qualityScore: PropTypes.number,
    delivery: PropTypes.number,
    effort: PropTypes.number,
    bugs: PropTypes.array,
    highSeverityBugs: PropTypes.number,
    progress: PropTypes.number
  })),
  title: PropTypes.string,
  height: PropTypes.number,
  onProjectClick: PropTypes.func
}

QualityVsDeliveryChart.displayName = 'QualityVsDeliveryChart'

export default QualityVsDeliveryChart