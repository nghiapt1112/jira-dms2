import React, { useMemo, useCallback } from 'react'
import PropTypes from 'prop-types'
import { Box, Typography, Paper, Tooltip, useTheme, Modal, IconButton } from '@mui/material'
import { Close as CloseIcon } from '@mui/icons-material'
import { ScatterChart } from '@mui/x-charts/ScatterChart'

const QualityVsDeliveryChart = React.memo(({ 
  data, 
  title = 'Quality vs Delivery Performance', 
  height = 400, 
  onProjectClick,
  ...props 
}) => {
  const theme = useTheme()
  const [selectedPoint, setSelectedPoint] = React.useState(null)
  const [tooltipPosition, setTooltipPosition] = React.useState({ x: 0, y: 0 })

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return []
    
    return data.map(project => {
      // Determine strategic zone for tooltip
      const getStrategicZone = (quality, delivery) => {
        if (quality >= 80 && delivery >= 80) return 'SUCCESS ZONE'
        if (quality >= 80 && delivery < 60) return 'OVER-ENGINEERING ZONE'
        if (quality < 60 && delivery >= 80) return 'TECHNICAL DEBT ZONE'
        if (quality < 60 && delivery < 60) return 'CRISIS ZONE'
        return 'MODERATE PERFORMANCE'
      }
      
      const zone = getStrategicZone(project.qualityScore || 0, project.delivery || 0)
      
      return {
        x: project.delivery || 0,
        y: project.qualityScore || 0,
        id: project.id || project.projectKey,
        size: Math.max((project.effort || 0) / 10, 10),
        // Enhanced data for tooltip
        label: `${project.name || project.projectKey} (${zone})`,
        projectName: project.name || project.projectKey,
        bugs: project.bugs?.length || 0,
        highSeverityBugs: project.highSeverityBugs || 0,
        progress: project.progress || 0,
        zone,
        totalIssues: project.totalIssues || 0,
        bugRate: project.bugRate || 0,
        storyPoints: project.totalStoryPoints || 0
      }
    })
  }, [data])

  const getTooltipContent = useCallback((params) => {
    if (!params || params.dataIndex === undefined) return null
    
    const point = chartData[params.dataIndex]
    if (!point) return null

    // Get project data for detailed info (following old source pattern)
    const project = data.find(p => (p.id || p.projectKey) === point.id)
    
    // Project name resolution (matching old source logic)
    const projectName = project?.name || point.projectName || point.id || 'Unknown Project'

    // Simple styling matching old source
    const tooltipStyles = {
      backgroundColor: '#fff',
      padding: '10px',
      border: '1px solid #ccc',
      borderRadius: '4px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      minWidth: '200px'
    }

    const labelStyle = {
      margin: '0 0 5px',
      fontWeight: 'bold',
      fontSize: '14px'
    }

    const rowStyle = {
      margin: '3px 0',
      fontSize: '12px'
    }

    const keyStyle = {
      display: 'inline-block',
      width: '80px'
    }

    const valueStyle = {
      fontWeight: 'bold'
    }

    return (
      <div style={tooltipStyles}>
        <p style={labelStyle}>{projectName}</p>
        <p style={rowStyle}>
          <span style={keyStyle}>Quality:</span>
          <span style={valueStyle}>{(point.y || 0).toFixed(2)}%</span>
        </p>
        <p style={rowStyle}>
          <span style={keyStyle}>Delivery:</span>
          <span style={valueStyle}>{(point.x || 0).toFixed(2)}%</span>
        </p>
        <p style={rowStyle}>
          <span style={keyStyle}>Effort:</span>
          <span style={valueStyle}>{(point.storyPoints || 0).toFixed(2)} pts</span>
        </p>
        <p style={rowStyle}>
          <span style={keyStyle}>Bugs:</span>
          <span style={valueStyle}>{point.bugs || 0}</span>
        </p>
        <p style={rowStyle}>
          <span style={keyStyle}>High Severity:</span>
          <span style={valueStyle}>{point.highSeverityBugs || 0}</span>
        </p>
      </div>
    )
  }, [chartData, data])

  const handlePointClick = useCallback((event, params) => {
    if (params?.dataIndex !== undefined) {
      const point = chartData[params.dataIndex]
      if (point) {
        // Set tooltip data and position
        setSelectedPoint(point)
        setTooltipPosition({ 
          x: event?.clientX || 0, 
          y: event?.clientY || 0 
        })
        
        // Also call original click handler
        if (onProjectClick) {
          onProjectClick(point.id, point)
        }
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
          slots={{
            tooltip: ({ active, payload }) => {
              if (!active || !payload || !payload.length) return null
              
              // Use the same approach as the working click handler
              const dataIndex = payload[0].dataIndex
              if (dataIndex === undefined) return null
              
              const point = chartData[dataIndex]
              if (!point) return null

              // Get project data for detailed info (same as click handler logic)
              const project = data.find(p => (p.id || p.projectKey) === point.id)
              
              // Project name resolution (matching old source logic)
              const projectName = project?.name || point.projectName || point.id || 'Unknown Project'

              // Simple styling matching old source
              const tooltipStyles = {
                backgroundColor: '#fff',
                padding: '10px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                minWidth: '200px'
              }

              const labelStyle = {
                margin: '0 0 5px',
                fontWeight: 'bold',
                fontSize: '14px'
              }

              const rowStyle = {
                margin: '3px 0',
                fontSize: '12px'
              }

              const keyStyle = {
                display: 'inline-block',
                width: '80px'
              }

              const valueStyle = {
                fontWeight: 'bold'
              }

              return (
                <div style={tooltipStyles}>
                  <p style={labelStyle}>{projectName}</p>
                  <p style={rowStyle}>
                    <span style={keyStyle}>Quality:</span>
                    <span style={valueStyle}>{(point.y || 0).toFixed(2)}%</span>
                  </p>
                  <p style={rowStyle}>
                    <span style={keyStyle}>Delivery:</span>
                    <span style={valueStyle}>{(point.x || 0).toFixed(2)}%</span>
                  </p>
                  <p style={rowStyle}>
                    <span style={keyStyle}>Effort:</span>
                    <span style={valueStyle}>{(point.storyPoints || 0).toFixed(2)} pts</span>
                  </p>
                  <p style={rowStyle}>
                    <span style={keyStyle}>Bugs:</span>
                    <span style={valueStyle}>{point.bugs || 0}</span>
                  </p>
                  <p style={rowStyle}>
                    <span style={keyStyle}>High Severity:</span>
                    <span style={valueStyle}>{point.highSeverityBugs || 0}</span>
                  </p>
                </div>
              )
            }
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
        Bubble size represents project effort. Click on bubbles for detailed information.
      </Typography>

      {/* Enhanced Tooltip Modal */}
      <Modal
        open={!!selectedPoint}
        onClose={() => setSelectedPoint(null)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: theme.zIndex.modal + 1
        }}
      >
        <Paper
          elevation={8}
          sx={{
            position: 'relative',
            maxWidth: '90vw',
            maxHeight: '90vh',
            overflow: 'auto',
            outline: 'none'
          }}
        >
          <IconButton
            onClick={() => setSelectedPoint(null)}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              zIndex: 1
            }}
          >
            <CloseIcon />
          </IconButton>
          
          {selectedPoint && getTooltipContent({ dataIndex: chartData.findIndex(p => p.id === selectedPoint.id) })}
        </Paper>
      </Modal>
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