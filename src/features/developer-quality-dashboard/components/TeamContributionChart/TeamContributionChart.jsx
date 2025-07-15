import React, { useMemo, useEffect } from 'react'
import PropTypes from 'prop-types'
import { Box, Paper, Typography, Chip, ToggleButton, ToggleButtonGroup } from '@mui/material'
import { BarChart } from '@mui/x-charts/BarChart'
import { TrendingUp, TrendingDown, TrendingFlat } from '@mui/icons-material'
import { performanceMonitor } from '../../utils/PerformanceMonitor'

const TeamContributionChart = React.memo(({ 
  data, 
  metrics, 
  title = 'Team Contribution by Story Points', 
  height = 400,
  timePeriodType = 'month',
  onTimePeriodChange,
  statusFilter = [],
  onStatusFilterChange,
  filters = {}
}) => {
  // 1. Hooks first
  useEffect(() => {
    const timer = performanceMonitor.startTimer('chartRender')
    console.log('TeamContributionChart - Rendering with data:', 
      { dataLength: data?.data?.length || 0, projects: filters?.projects })
    return () => {
      timer?.end()
    }
  }, [data, filters])
  
  // Log when data or filters change
  useEffect(() => {
    if (data?.data) {
      console.log('📊 CHART: TeamContributionChart - Data updated:', {
        dataPoints: data.data.length,
        timePeriods: data.data.map(d => d.timePeriod),
        developers: Object.keys(data.data[0] || {}).filter(k => k !== 'timePeriod'),
        filterState: filters,
        timestamp: new Date().toISOString()
      })
    } else {
      console.log('📊 CHART: TeamContributionChart - No data available')
    }
  }, [data, filters])
  
  // 2. Memoized values
  const chartData = useMemo(() => {
    console.log('📊 CHART: Recalculating chartData with:', {
      hasData: !!data,
      dataLength: data?.data?.length || 0,
      filters: filters
    })
    
    if (!data || !data.data || data.data.length === 0) return null
    
    // Extract all developers from the data
    const developers = new Set()
    data.data.forEach(item => {
      Object.keys(item).forEach(key => {
        if (key !== 'timePeriod') {
          developers.add(key)
        }
      })
    })
    
    const developersArray = Array.from(developers).sort()
    
    // Generate colors for each developer
    const colors = [
      '#1976d2', '#dc004e', '#2e7d32', '#ed6c02', '#9c27b0',
      '#00796b', '#d32f2f', '#7b1fa2', '#388e3c', '#f57c00',
      '#303f9f', '#c2185b', '#689f38', '#ff5722', '#512da8'
    ]
    
    return {
      dataset: data.data,
      series: developersArray.map((developer, index) => ({
        dataKey: developer,
        label: developer,
        color: colors[index % colors.length],
        stack: 'storyPoints'
      })),
      xAxis: [{
        dataKey: 'timePeriod',
        scaleType: 'band',
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
    grid: { horizontal: true }
  }), [height, data?.data?.length])
  
  const trendIcon = useMemo(() => {
    if (!metrics?.contributionTrend) return null
    
    switch (metrics.contributionTrend.toLowerCase()) {
      case 'increasing':
        return <TrendingUp sx={{ fontSize: 16, color: 'success.main' }} />
      case 'decreasing':
        return <TrendingDown sx={{ fontSize: 16, color: 'error.main' }} />
      default:
        return <TrendingFlat sx={{ fontSize: 16, color: 'warning.main' }} />
    }
  }, [metrics?.contributionTrend])
  
  const topContributors = useMemo(() => {
    if (!metrics?.topContributors || metrics.topContributors.length === 0) return []
    return metrics.topContributors.slice(0, 3)
  }, [metrics?.topContributors])
  
  const totalStoryPoints = useMemo(() => {
    if (!data || !data.data || data.data.length === 0) return 0
    return data.data.reduce((total, item) => {
      return total + Object.keys(item).reduce((itemTotal, key) => {
        if (key !== 'timePeriod') {
          return itemTotal + (item[key] || 0)
        }
        return itemTotal
      }, 0)
    }, 0)
  }, [data])
  
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
        <Typography 
          variant="h6" 
          sx={{ 
            fontSize: { xs: '1rem', sm: '1.25rem' },
            fontWeight: 600
          }}
        >
          {title}
        </Typography>
        
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
            {metrics.contributionTrend}
          </Typography>
        </Box>
      </Box>
      
      {/* Time Period Controls */}
      {onTimePeriodChange && (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center',
          mb: { xs: 2, sm: 3 }
        }}>
          <ToggleButtonGroup
            value={timePeriodType}
            exclusive
            onChange={(e, newValue) => {
              if (newValue !== null) {
                onTimePeriodChange(newValue)
              }
            }}
            size="small"
            sx={{ 
              '& .MuiToggleButton-root': {
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                px: { xs: 1, sm: 2 }
              }
            }}
          >
            <ToggleButton value="week">Week</ToggleButton>
            <ToggleButton value="month">Month</ToggleButton>
            <ToggleButton value="quarter">Quarter</ToggleButton>
          </ToggleButtonGroup>
        </Box>
      )}
      
      {/* Chart */}
      <Box sx={{ 
        height: { xs: Math.min(height, 300), sm: height },
        width: '100%',
        mb: { xs: 2, sm: 3 }
      }}>
        <BarChart
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
          sm: 'repeat(2, 1fr)',
          md: 'repeat(3, 1fr)'
        },
        gap: { xs: 1, sm: 2 },
        mb: { xs: 2, sm: 3 }
      }}>
        <Box>
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
          >
            Total Story Points
          </Typography>
          <Typography 
            variant="h6"
            sx={{ 
              fontSize: { xs: '1rem', sm: '1.25rem' },
              fontWeight: 600
            }}
          >
            {totalStoryPoints?.toLocaleString() || 0}
          </Typography>
        </Box>
        
        <Box>
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
          >
            Average per Developer
          </Typography>
          <Typography 
            variant="h6"
            sx={{ 
              fontSize: { xs: '1rem', sm: '1.25rem' },
              fontWeight: 600
            }}
          >
            {metrics.averageStoryPoints?.toFixed(1) || '0.0'}
          </Typography>
        </Box>
        
        <Box sx={{ 
          gridColumn: { xs: '1', md: '3' }
        }}>
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ 
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              mb: 1
            }}
          >
            Top Contributors (by Story Points)
          </Typography>
          <Box sx={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: 0.5 
          }}>
            {topContributors.map((contributor, index) => (
              <Chip
                key={contributor.developer}
                label={`${contributor.developer} (${contributor.storyPoints || 0}pts)`}
                size="small"
                variant={index === 0 ? 'filled' : 'outlined'}
                color={index === 0 ? 'primary' : 'default'}
                sx={{ 
                  fontSize: { xs: '0.65rem', sm: '0.75rem' },
                  height: { xs: 24, sm: 28 }
                }}
              />
            ))}
          </Box>
        </Box>
      </Box>
    </Paper>
  )
})

// ✅ REQUIRED: PropTypes
TeamContributionChart.propTypes = {
  data: PropTypes.shape({
    data: PropTypes.arrayOf(PropTypes.shape({
      timePeriod: PropTypes.string.isRequired,
      // Add other developers' story points here
      // e.g., 'developer1': 10, 'developer2': 5, ...
    }))  
  }),
  metrics: PropTypes.shape({
    totalContributions: PropTypes.number,
    totalStoryPoints: PropTypes.number,
    averageContribution: PropTypes.number,
    averageStoryPoints: PropTypes.number,
    contributionTrend: PropTypes.string,
    topContributors: PropTypes.arrayOf(PropTypes.shape({
      developer: PropTypes.string.isRequired,
      contributions: PropTypes.number.isRequired,
      storyPoints: PropTypes.number.isRequired,
      percentage: PropTypes.number.isRequired,
      storyPointsPercentage: PropTypes.number.isRequired
    }))
  }),
  title: PropTypes.string,
  height: PropTypes.number,
  timePeriodType: PropTypes.oneOf(['week', 'month', 'quarter']),
  onTimePeriodChange: PropTypes.func,
  statusFilter: PropTypes.arrayOf(PropTypes.string),
  onStatusFilterChange: PropTypes.func,
  filters: PropTypes.object
}

export default TeamContributionChart 