import React, { useMemo } from 'react'
import PropTypes from 'prop-types'
import { getSeverityColor } from '../../../../shared/constants/severityConstants.js'
import { memberConfiguration } from '../../../../constants/memberConfiguration.js'
import { Box, Paper, Typography, Chip } from '@mui/material'
import { ChartJSLineChart } from '../../../../components/charts/ChartJS'
import { transformSeriesData } from '../../../../utils/dataTransformers'
import { TrendingUp, TrendingDown, TrendingFlat, BugReport } from '@mui/icons-material'

const BugTrendAnalysis = React.memo(({ 
  data, 
  metrics, 
  title = 'Bug Trend Analysis', 
  height = 400 
}) => {
  // 1. Hooks first (none needed)
  
  // 2. Memoized values
  const bugStatusMapping = useMemo(() => {
    return memberConfiguration.BUG_STATUS_MAPPING || {
      resolved: ["Done", "Resolved", "Closed", "Fixed"],
      notFixed: ["Won't Fix", "Duplicate", "Cannot Reproduce", "Invalid"],
      new: ["To Do", "Open"],
      inProgress: ["In Progress", "In Review", "Testing"]
    }
  }, [])
  const chartData = useMemo(() => {
    
    if (!data || !data.data || data.data.length === 0) {
      console.warn('⚠️ BUG TREND - No data available:', {
        dataObject: data,
        dataType: typeof data,
        dataKeys: data ? Object.keys(data) : null
      })
      return null
    }
    
    // Chart now shows 4 lines: Total, Resolved, Not Fixed, New, In Progress
    // Using BUG_STATUS_MAPPING from memberConfiguration for consistent categorization
    
    // Get time period from config or default to month
    const timePeriod = data.config?.timePeriod || 'month'
    const periodKey = data.config?.periodKey || 'month'
    
    const muiData = {
      dataset: data.data,
      series: [
        {
          dataKey: 'total',
          label: 'Total Bugs',
          color: '#dc004e',
          curve: 'linear'
        },
        {
          dataKey: 'resolved',
          label: 'Resolved',
          color: '#2e7d32',
          curve: 'linear'
        },
        {
          dataKey: 'notFixed',
          label: 'Not Fixed',
          color: '#f44336',
          curve: 'linear'
        },
        {
          dataKey: 'new',
          label: 'New',
          color: '#2196f3',
          curve: 'linear'
        },
        {
          dataKey: 'inProgress',
          label: 'In Progress',
          color: '#ff9800',
          curve: 'linear'
        }
      ],
      xAxis: [{
        dataKey: periodKey,
        scaleType: 'point',
        tickLabelStyle: {
          angle: data.data.length > 6 ? -45 : 0,
          textAnchor: data.data.length > 6 ? 'end' : 'middle'
        }
      }]
    }
    
    
    // Prepare data for Chart.js transformation - ensure it has the right structure
    const chartJSData = data.data.map(item => {
      // For weekly data, prioritize the actual week field over periodKey
      let labelValue = item[periodKey]
      if (timePeriod === 'week' && item.week) {
        labelValue = item.week
      } else if (timePeriod === 'quarter' && item.quarter) {
        labelValue = item.quarter
      } else if (timePeriod === 'month' && item.month) {
        labelValue = item.month
      }
      
      return {
        ...item,
        timePeriod: labelValue, // Use the correct period value for Chart.js labels
        x: labelValue,
        label: labelValue
      }
    })
    
    // Transform data for Chart.js
    const transformedData = transformSeriesData(chartJSData, muiData.series)
    
    
    // Add original data reference for tooltips - attach to ALL datasets
    if (transformedData.datasets && transformedData.datasets.length > 0) {
      transformedData.datasets.forEach(dataset => {
        // Use the original data.data which should have the formatted week dates
        dataset._originalData = data.data // Use original data structure for tooltips
      })
    }
    
    return transformedData
  }, [data])
  
  const chartConfig = useMemo(() => ({
    height: height,
    margin: { 
      top: 20, 
      right: 20, 
      bottom: data?.data?.length > 6 ? 80 : 60, 
      left: 80 
    },
    grid: { horizontal: true, vertical: true }
  }), [height, data?.data?.length])
  
  const trendIcon = useMemo(() => {
    if (!metrics?.bugTrend) return null
    
    switch (metrics.bugTrend.toLowerCase()) {
      case 'increasing':
        return <TrendingUp sx={{ fontSize: 16, color: 'error.main' }} />
      case 'decreasing':
        return <TrendingDown sx={{ fontSize: 16, color: 'success.main' }} />
      default:
        return <TrendingFlat sx={{ fontSize: 16, color: 'warning.main' }} />
    }
  }, [metrics?.bugTrend])
  
  // Using centralized getSeverityColor from severityConstants.js

  const severityData = useMemo(() => {
    if (!metrics?.severityDistribution) return []
    
    const distribution = metrics.severityDistribution
    const total = Object.values(distribution).reduce((sum, count) => sum + count, 0)
    
    return Object.entries(distribution).map(([severity, count]) => ({
      severity,
      count,
      percentage: total > 0 ? (count / total * 100) : 0,
      color: getSeverityColor(severity)
    }))
  }, [metrics?.severityDistribution])
  
  // 3. Callbacks (none needed)
  
  // 4. Early returns
  if (!chartData || !metrics) {
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
        gap: 1
      }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1 
        }}>
          <BugReport sx={{ fontSize: 20, color: 'error.main' }} />
          <Typography 
            variant="h6" 
            sx={{ 
              fontSize: { xs: '1rem', sm: '1.25rem' },
              fontWeight: 600
            }}
          >
            {title} {chartData && data.config?.timePeriod && `(by ${data.config.timePeriod})`}
          </Typography>
        </Box>
        
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1 
        }}>
          {trendIcon}
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ 
              textTransform: 'capitalize',
              fontSize: { xs: '0.75rem', sm: '0.875rem' }
            }}
          >
            {metrics.bugTrend}
          </Typography>
        </Box>
      </Box>
      
      {/* Chart */}
      <Box sx={{ 
        height: { xs: Math.min(height, 300), sm: height },
        width: '100%',
        mb: { xs: 2, sm: 3 }
      }}>
        <ChartJSLineChart
          data={chartData}
          title=""
          height={height}
          options={{
            plugins: {
              legend: {
                position: 'top',
              },
              title: {
                display: false,
              },
              tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                titleColor: 'white',
                bodyColor: 'white',
                borderColor: 'rgba(255, 255, 255, 0.2)',
                borderWidth: 1,
                cornerRadius: 6,
                callbacks: {
                  title: function(context) {
                    if (!context || !context[0]) return 'No context'
                    
                    const dataPoint = context[0]
                    const timePeriod = data.config?.timePeriod || 'month'
                    const dataIndex = dataPoint.dataIndex
                    
                    // For weekly data, show date range format
                    if (timePeriod === 'week' && dataPoint.dataset._originalData) {
                      const originalData = dataPoint.dataset._originalData[dataIndex]
                      
                      if (originalData && originalData._weekStartFormatted && originalData._weekEndFormatted) {
                        const totalBugs = originalData.total || 0
                        return `${originalData._weekStartFormatted}-${originalData._weekEndFormatted}, Total Bugs: ${totalBugs}`
                      }
                    }
                    
                    // Default format for month/quarter
                    const label = dataPoint.label || ''
                    const originalData = dataPoint.dataset._originalData?.[dataIndex]
                    const totalBugs = originalData?.total || 0
                    return `${label}, Total Bugs: ${totalBugs}`
                  },
                  label: function(context) {
                    const datasetLabel = context.dataset.label || ''
                    const value = context.parsed?.y || 0
                    return `${datasetLabel}: ${value}`
                  }
                }
              }
            },
            scales: {
              x: {
                title: {
                  display: true,
                  text: data.config?.timePeriod ? 
                    `${data.config.timePeriod.charAt(0).toUpperCase() + data.config.timePeriod.slice(1)}` : 
                    'Month'
                }
              },
              y: {
                title: {
                  display: true,
                  text: 'Bug Count'
                }
              }
            }
          }}
        />
      </Box>
      
      {/* Metrics Summary */}
      <Box sx={{ 
        display: 'grid',
        gridTemplateColumns: { 
          xs: '1fr',
          sm: 'repeat(2, 1fr)'
        },
        gap: { xs: 2, sm: 3 }
      }}>
        {/* Total Bugs */}
        <Box>
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ 
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              mb: 1
            }}
          >
            Total Bugs
          </Typography>
          <Typography 
            variant="h4"
            sx={{ 
              fontSize: { xs: '1.5rem', sm: '2rem' },
              fontWeight: 600,
              color: 'error.main'
            }}
          >
            {metrics.totalBugs?.toLocaleString() || 0}
          </Typography>
        </Box>
        
        {/* Severity Distribution */}
        <Box>
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ 
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              mb: 1
            }}
          >
            Severity Distribution
          </Typography>
          <Box sx={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: 0.5 
          }}>
            {severityData.map((item) => (
              <Chip
                key={item.severity}
                label={`${item.severity}: ${item.count} (${item.percentage.toFixed(1)}%)`}
                size="small"
                color={item.color}
                variant="outlined"
                sx={{ 
                  fontSize: { xs: '0.65rem', sm: '0.75rem' },
                  height: { xs: 24, sm: 28 }
                }}
              />
            ))}
          </Box>
        </Box>
      </Box>
      
      {/* Monthly Trend Summary */}
      {metrics.monthlyBugTrend && metrics.monthlyBugTrend.length > 0 && (
        <Box sx={{ mt: { xs: 2, sm: 3 } }}>
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ 
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              mb: 1
            }}
          >
            Recent Months Summary
          </Typography>
          <Box sx={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: 1 
          }}>
            {metrics.monthlyBugTrend.slice(-3).map((monthData) => (
              <Box
                key={monthData.month}
                sx={{
                  p: 1,
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1,
                  minWidth: 120
                }}
              >
                <Typography 
                  variant="caption" 
                  color="text.secondary"
                  sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}
                >
                  {monthData.month}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                  <Typography 
                    variant="body2"
                    sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                  >
                    New: {monthData.bugs}
                  </Typography>
                  <Typography 
                    variant="body2"
                    color="success.main"
                    sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                  >
                    Resolved: {monthData.resolved}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </Paper>
  )
})

// ✅ REQUIRED: PropTypes
BugTrendAnalysis.propTypes = {
  data: PropTypes.shape({
    data: PropTypes.arrayOf(PropTypes.shape({
      month: PropTypes.string.isRequired,
      total: PropTypes.number.isRequired,
      resolved: PropTypes.number.isRequired,
      notFixed: PropTypes.number.isRequired,
      new: PropTypes.number.isRequired,
      inProgress: PropTypes.number.isRequired
    }))
  }),
  metrics: PropTypes.shape({
    totalBugs: PropTypes.number,
    bugTrend: PropTypes.oneOf(['increasing', 'decreasing', 'stable']),
    severityDistribution: PropTypes.shape({
      critical: PropTypes.number,
      high: PropTypes.number,
      medium: PropTypes.number,
      low: PropTypes.number
    }),
    monthlyBugTrend: PropTypes.arrayOf(PropTypes.shape({
      month: PropTypes.string.isRequired,
      bugs: PropTypes.number.isRequired,
      resolved: PropTypes.number.isRequired
    }))
  }),
  title: PropTypes.string,
  height: PropTypes.number
}

export default BugTrendAnalysis 