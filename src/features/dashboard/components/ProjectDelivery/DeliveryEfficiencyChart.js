import React, { useMemo, useCallback } from 'react'
import PropTypes from 'prop-types'
import { Box, Typography, Paper, useTheme } from '@mui/material'
import { BarChart } from '@mui/x-charts/BarChart'

const DeliveryEfficiencyChart = React.memo(({ 
  data = [], 
  title = 'Delivery Efficiency Comparison',
  height = 400,
  onProjectClick = null,
  maxProjects = 10,
  ...props 
}) => {
  const theme = useTheme()

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return []
    
    // Sort by delivery efficiency and take top projects
    const sortedData = [...data]
      .sort((a, b) => (b.delivery || 0) - (a.delivery || 0))
      .slice(0, maxProjects)
    
    return sortedData.map(project => {
      const deliveryScore = project.delivery || 0
      const projectName = project.name || project.projectKey || 'Unknown'
      
      return {
        id: project.id || project.projectKey,
        projectName: projectName.length > 15 ? projectName.substring(0, 15) + '...' : projectName,
        fullName: project.name || project.projectKey,
        efficiency: deliveryScore,
        onTimeIssues: project.onTimeIssues || 0,
        delayedIssues: project.delayedIssues || 0,
        totalIssues: project.issues?.length || 0,
        completedStoryPoints: project.completedStoryPoints || 0,
        totalStoryPoints: project.totalStoryPoints || 0,
        color: getEfficiencyColor(deliveryScore, theme)
      }
    })
  }, [data, maxProjects, theme])

  const getTooltipContent = useCallback((params) => {
    if (!params || params.dataIndex === undefined) return null
    
    const project = chartData[params.dataIndex]
    if (!project) return null

    const onTimeRate = project.totalIssues > 0 
      ? ((project.onTimeIssues / project.totalIssues) * 100).toFixed(1)
      : '0'
      
    const completionRate = project.totalStoryPoints > 0
      ? ((project.completedStoryPoints / project.totalStoryPoints) * 100).toFixed(1)
      : '0'

    return (
      <Box sx={{ p: 1 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
          {project.fullName}
        </Typography>
        <Typography variant="body2">
          Efficiency: {project.efficiency.toFixed(1)}%
        </Typography>
        <Typography variant="body2">
          On-time Rate: {onTimeRate}%
        </Typography>
        <Typography variant="body2">
          Completion Rate: {completionRate}%
        </Typography>
        <Typography variant="body2">
          Issues: {project.onTimeIssues}/{project.totalIssues}
        </Typography>
        <Typography variant="body2">
          Story Points: {project.completedStoryPoints}/{project.totalStoryPoints}
        </Typography>
      </Box>
    )
  }, [chartData])

  const handleBarClick = useCallback((event, params) => {
    if (onProjectClick && params?.dataIndex !== undefined) {
      const project = chartData[params.dataIndex]
      if (project) {
        onProjectClick(project.id, project)
      }
    }
  }, [onProjectClick, chartData])

  const series = useMemo(() => [{
    data: chartData.map(project => project.efficiency),
    label: 'Delivery Efficiency (%)'
  }], [chartData])

  const xAxisData = useMemo(() => 
    chartData.map(project => project.projectName),
    [chartData]
  )

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
          <Typography color="text.secondary">No delivery data available</Typography>
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
        <BarChart
          width={undefined}
          height={height}
          series={series}
          xAxis={[{
            data: xAxisData,
            scaleType: 'band',
            tickLabelStyle: {
              angle: chartData.length > 5 ? -45 : 0,
              textAnchor: chartData.length > 5 ? 'end' : 'middle'
            }
          }]}
          yAxis={[{
            label: 'Efficiency (%)',
            min: 0,
            max: 100
          }]}
          colors={chartData.map(project => project.color)}
          margin={{ 
            left: 60, 
            right: 30, 
            top: 20, 
            bottom: chartData.length > 5 ? 100 : 60
          }}
          tooltip={{
            trigger: 'item',
            content: getTooltipContent
          }}
          onItemClick={handleBarClick}
          grid={{ horizontal: true }}
        />
      </Box>

      {/* Efficiency Legend */}
      <Box sx={{ 
        mt: 2, 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: 2,
        justifyContent: 'center',
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
              borderRadius: 1 
            }} 
          />
          <Typography variant="caption">
            On Time (≥80%)
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box 
            sx={{ 
              width: 12, 
              height: 12, 
              backgroundColor: theme.palette.warning.main,
              borderRadius: 1 
            }} 
          />
          <Typography variant="caption">
            Delayed (60-79%)
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box 
            sx={{ 
              width: 12, 
              height: 12, 
              backgroundColor: theme.palette.error.main,
              borderRadius: 1 
            }} 
          />
          <Typography variant="caption">
            Critical (&lt;60%)
          </Typography>
        </Box>
      </Box>

      {/* Summary Statistics */}
      <Box sx={{ 
        mt: 2, 
        p: 1.5, 
        backgroundColor: theme.palette.background.default,
        borderRadius: 1,
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
        gap: 1,
        textAlign: 'center'
      }}>
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            Avg Efficiency
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
            {chartData.length > 0 
              ? (chartData.reduce((sum, p) => sum + p.efficiency, 0) / chartData.length).toFixed(1) 
              : '0'
            }%
          </Typography>
        </Box>
        
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            Top Performer
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
            {chartData.length > 0 ? chartData[0].efficiency.toFixed(1) : '0'}%
          </Typography>
        </Box>
        
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            Projects Shown
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
            {chartData.length}
          </Typography>
        </Box>
      </Box>

      <Typography 
        variant="caption" 
        color="text.secondary" 
        sx={{ 
          mt: 1, 
          display: 'block',
          textAlign: 'center',
          [theme.breakpoints.down('sm')]: {
            fontSize: '0.7rem'
          }
        }}
      >
        {maxProjects < data.length 
          ? `Showing top ${maxProjects} of ${data.length} projects. Click bars for details.`
          : 'Click bars for project details.'
        }
      </Typography>
    </Paper>
  )
})

const getEfficiencyColor = (efficiency, theme) => {
  if (efficiency >= 80) return theme.palette.success.main
  if (efficiency >= 60) return theme.palette.warning.main
  return theme.palette.error.main
}

DeliveryEfficiencyChart.propTypes = {
  data: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string,
    projectKey: PropTypes.string,
    name: PropTypes.string,
    delivery: PropTypes.number,
    issues: PropTypes.array,
    onTimeIssues: PropTypes.number,
    delayedIssues: PropTypes.number,
    completedStoryPoints: PropTypes.number,
    totalStoryPoints: PropTypes.number
  })),
  title: PropTypes.string,
  height: PropTypes.number,
  onProjectClick: PropTypes.func,
  maxProjects: PropTypes.number
}

DeliveryEfficiencyChart.displayName = 'DeliveryEfficiencyChart'

export default DeliveryEfficiencyChart