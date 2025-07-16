import React, { useMemo } from 'react'
import PropTypes from 'prop-types'
import { Box, Paper, Typography, Chip } from '@mui/material'
import { LineChart } from '@mui/x-charts/LineChart'
import { TrendingUp, TrendingDown, TrendingFlat, BugReport } from '@mui/icons-material'

const BugTrendAnalysis = React.memo(({ 
  data, 
  metrics, 
  title = 'Bug Trend Analysis', 
  height = 400 
}) => {
  // 1. Hooks first (none needed)
  
  // 2. Memoized values
  const chartData = useMemo(() => {
    if (!data || !data.data || data.data.length === 0) return null
    
    return {
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
          dataKey: 'pending',
          label: 'Pending',
          color: '#ed6c02',
          curve: 'linear'
        }
      ],
      xAxis: [{
        dataKey: 'month',
        scaleType: 'point',
        tickLabelStyle: {
          angle: data.data.length > 6 ? -45 : 0,
          textAnchor: data.data.length > 6 ? 'end' : 'middle'
        }
      }]
    }
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
  
  // Helper function for severity colors (must be declared before use)
  const getSeverityColor = (severity) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 'error'
      case 'high':
        return 'warning'
      case 'medium':
        return 'info'
      case 'low':
        return 'success'
      default:
        return 'default'
    }
  }

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
            {title}
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
        <LineChart
          dataset={chartData.dataset}
          series={chartData.series}
          xAxis={chartData.xAxis}
          {...chartConfig}
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
      pending: PropTypes.number.isRequired
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