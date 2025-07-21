import React, { useMemo, useCallback } from 'react'
import PropTypes from 'prop-types'
import { Box, Typography, Paper, Tooltip, useTheme, Modal, IconButton } from '@mui/material'
import { Close as CloseIcon } from '@mui/icons-material'
import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip as ChartTooltip,
  Legend,
  Title
} from 'chart.js'
import { Scatter } from 'react-chartjs-2'
import logger from '../../../../utils/logger'

// Register Chart.js components
ChartJS.register(LinearScale, PointElement, LineElement, ChartTooltip, Legend, Title)

const QualityVsDeliveryChart = React.memo(({ 
  data, 
  title = 'Quality vs Delivery Performance', 
  height = 400, 
  onProjectClick,
  ...props 
}) => {
  const theme = useTheme()
  const [selectedPoint, setSelectedPoint] = React.useState(null)
  const [selectedSeries, setSelectedSeries] = React.useState(null)

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

  const getColorByDelivery = useCallback((deliveryScore) => {
    if (deliveryScore >= 80) return theme.palette.success.main
    if (deliveryScore >= 60) return theme.palette.info.main
    if (deliveryScore >= 40) return theme.palette.warning.main
    return theme.palette.error.main
  }, [theme])

  const chartDatasets = useMemo(() => {
    logger.heatmap('QUALITY_DELIVERY', 'Processing scatter chart data', {
      hasData: !!data,
      dataLength: data?.length,
      chartDataLength: chartData.length
    })

    const deliveryGroups = {
      excellent: { data: [], color: theme.palette.success.main, label: 'Excellent Delivery (≥80)' },
      good: { data: [], color: theme.palette.info.main, label: 'Good Delivery (60-79)' },
      moderate: { data: [], color: theme.palette.warning.main, label: 'Moderate Delivery (40-59)' },
      poor: { data: [], color: theme.palette.error.main, label: 'Poor Delivery (<40)' }
    }

    chartData.forEach(point => {
      // Convert to Chart.js scatter format
      const scatterPoint = {
        x: point.x,
        y: point.y,
        // Store original data for tooltips and clicks
        _originalData: point
      }
      
      if (point.x >= 80) {
        deliveryGroups.excellent.data.push(scatterPoint)
      } else if (point.x >= 60) {
        deliveryGroups.good.data.push(scatterPoint)
      } else if (point.x >= 40) {
        deliveryGroups.moderate.data.push(scatterPoint)
      } else {
        deliveryGroups.poor.data.push(scatterPoint)
      }
    })

    const datasets = Object.values(deliveryGroups)
      .filter(group => group.data.length > 0)
      .map(group => ({
        label: group.label,
        data: group.data,
        backgroundColor: group.color,
        borderColor: group.color,
        pointRadius: (context) => {
          const point = context.parsed?._originalData || context.raw?._originalData
          // Scale point size based on effort/story points
          return Math.max(Math.sqrt((point?.storyPoints || point?.size || 10) / 10), 6)
        },
        pointHoverRadius: (context) => {
          const point = context.parsed?._originalData || context.raw?._originalData
          return Math.max(Math.sqrt((point?.storyPoints || point?.size || 10) / 10), 6) + 2
        }
      }))

    logger.heatmap('QUALITY_DELIVERY', 'Chart datasets prepared', {
      datasetsCount: datasets.length,
      totalPoints: datasets.reduce((sum, ds) => sum + ds.data.length, 0),
      sampleDataset: datasets[0] ? {
        label: datasets[0].label,
        pointCount: datasets[0].data.length,
        samplePoint: datasets[0].data[0]
      } : null
    })

    return datasets
  }, [chartData, theme, data])

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
        displayColors: false,
        callbacks: {
          title: function(context) {
            const point = context[0]?.raw?._originalData
            if (!point) return 'Unknown Project'
            
            const project = data.find(p => (p.id || p.projectKey) === point.id)
            return project?.name || point.projectName || point.id || 'Unknown Project'
          },
          label: function(context) {
            const point = context.raw._originalData
            if (!point) return []
            
            const project = data.find(p => (p.id || p.projectKey) === point.id)
            
            return [
              `Quality: ${(point.y || 0).toFixed(2)}%`,
              `Delivery: ${(point.x || 0).toFixed(2)}%`,
              `Effort: ${(point.storyPoints || 0).toFixed(2)} pts`,
              `Bugs: ${project?.bugs?.length || 0}`,
              `High Severity: ${point.highSeverityBugs || 0}`
            ]
          }
        }
      }
    },
    scales: {
      x: {
        type: 'linear',
        position: 'bottom',
        min: 0,
        max: 100,
        title: {
          display: true,
          text: 'Delivery Performance (%)',
          font: {
            size: 14,
            weight: 'bold'
          }
        },
        ticks: {
          stepSize: 20
        },
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.1)'
        }
      },
      y: {
        type: 'linear',
        min: 0,
        max: 100,
        title: {
          display: true,
          text: 'Quality Score (%)',
          font: {
            size: 14,
            weight: 'bold'
          }
        },
        ticks: {
          stepSize: 20
        },
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.1)'
        }
      }
    },
    onClick: (event, elements) => {
      if (elements.length > 0) {
        const element = elements[0]
        const datasetIndex = element.datasetIndex
        const index = element.index
        const point = chartDatasets[datasetIndex]?.data[index]
        
        if (point && point._originalData) {
          setSelectedPoint(point._originalData)
          setSelectedSeries(datasetIndex)
          
          if (onProjectClick) {
            onProjectClick(point._originalData.id, point._originalData)
          }
        }
      }
    }
  }), [data, chartDatasets, onProjectClick])

  const getTooltipContent = useCallback((params) => {
    if (!params || params.dataIndex === undefined || params.seriesIndex === undefined) return null
    
    const seriesData = chartDatasets[params.seriesIndex]?.data
    if (!seriesData) return null
    
    const point = seriesData[params.dataIndex]?._originalData
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
          <span style={valueStyle}>{point.y.toFixed(2)}%</span>
        </p>
        <p style={rowStyle}>
          <span style={keyStyle}>Delivery:</span>
          <span style={valueStyle}>{point.x.toFixed(2)}%</span>
        </p>
        <p style={rowStyle}>
          <span style={keyStyle}>Effort:</span>
          <span style={valueStyle}>{point.storyPoints.toFixed(2)} pts</span>
        </p>
        <p style={rowStyle}>
          <span style={keyStyle}>Bugs:</span>
          <span style={valueStyle}>{project?.bugs?.length || 0}</span>
        </p>
        <p style={rowStyle}>
          <span style={keyStyle}>High Severity:</span>
          <span style={valueStyle}>{point.highSeverityBugs}</span>
        </p>
      </div>
    )
  }, [chartDatasets, data])

  const handlePointClick = useCallback((event, params) => {
    // This is now handled by the chartOptions onClick callback
    // Keeping this function for compatibility with the modal logic
    if (params?.dataIndex !== undefined && params?.seriesIndex !== undefined) {
      const seriesData = chartDatasets[params.seriesIndex]?.data
      if (seriesData) {
        const point = seriesData[params.dataIndex]?._originalData
        if (point) {
          // Set tooltip data
          setSelectedPoint(point)
          setSelectedSeries(params.seriesIndex)
          
          // Also call original click handler
          if (onProjectClick) {
            onProjectClick(point.id, point)
          }
        }
      }
    }
  }, [onProjectClick, chartDatasets])

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
        <Scatter 
          data={{ datasets: chartDatasets }}
          options={chartOptions}
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
        onClose={() => {
          setSelectedPoint(null)
          setSelectedSeries(null)
        }}
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
            onClick={() => {
              setSelectedPoint(null)
              setSelectedSeries(null)
            }}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              zIndex: 1
            }}
          >
            <CloseIcon />
          </IconButton>
          
          {selectedPoint && selectedSeries !== null && 
            getTooltipContent({ 
              dataIndex: chartDatasets[selectedSeries]?.data.findIndex(p => p._originalData?.id === selectedPoint.id),
              seriesIndex: selectedSeries 
            })
          }
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