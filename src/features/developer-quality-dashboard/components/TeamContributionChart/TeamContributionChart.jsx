import React, { useMemo, useEffect } from 'react'
import PropTypes from 'prop-types'
import { Box, Paper, Typography, Chip } from '@mui/material'
import { BarChart } from '@mui/x-charts/BarChart'
import { TrendingUp, TrendingDown, TrendingFlat } from '@mui/icons-material'
import { performanceMonitor } from '../../utils/PerformanceMonitor'

const TeamContributionChart = React.memo(({ 
  data, 
  metrics, 
  title = 'Team Contribution', 
  height = 400 
}) => {
  // 1. Hooks first
  useEffect(() => {
    const timer = performanceMonitor.startTimer('chartRender')
    return () => {
      timer?.end()
    }
  }, [data])
  
  // 2. Memoized values
  const chartData = useMemo(() => {
    if (!data || !data.data || data.data.length === 0) return null
    
    return {
      dataset: data.data,
      series: [{
        dataKey: 'contributions',
        label: 'Contributions',
        color: '#1976d2'
      }],
      xAxis: [{
        dataKey: 'name',
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
    colors: ['#1976d2', '#dc004e', '#2e7d32', '#ed6c02'],
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
            Total Contributions
          </Typography>
          <Typography 
            variant="h6"
            sx={{ 
              fontSize: { xs: '1rem', sm: '1.25rem' },
              fontWeight: 600
            }}
          >
            {metrics.totalContributions?.toLocaleString() || 0}
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
            {metrics.averageContribution?.toFixed(1) || '0.0'}
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
            Top Contributors
          </Typography>
          <Box sx={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: 0.5 
          }}>
            {topContributors.map((contributor, index) => (
              <Chip
                key={contributor.developer}
                label={`${contributor.developer} (${contributor.percentage.toFixed(1)}%)`}
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
      name: PropTypes.string.isRequired,
      contributions: PropTypes.number.isRequired,
      percentage: PropTypes.number.isRequired
    }))
  }),
  metrics: PropTypes.shape({
    totalContributions: PropTypes.number,
    averageContribution: PropTypes.number,
    contributionTrend: PropTypes.string,
    topContributors: PropTypes.arrayOf(PropTypes.shape({
      developer: PropTypes.string.isRequired,
      contributions: PropTypes.number.isRequired,
      percentage: PropTypes.number.isRequired
    }))
  }),
  title: PropTypes.string,
  height: PropTypes.number
}

export default TeamContributionChart 