import React, { useMemo } from 'react'
import PropTypes from 'prop-types'
import { Box, Paper, Typography, Chip, Grid } from '@mui/material'
import { BarChart } from '@mui/x-charts/BarChart'
import { AccountBox as DeveloperIcon, TrendingUp, TrendingDown, TrendingFlat } from '@mui/icons-material'

const DeveloperRootCauseAnalysis = React.memo(({ 
  data, 
  metrics, 
  title = 'Developer Root Cause Analysis', 
  height = 400 
}) => {
  // 1. Hooks first (none needed)
  
  // 2. Memoized values
  const chartData = useMemo(() => {
    if (!data || !data.data || data.data.length === 0) return null
    
    // Extract all unique root cause categories
    const categories = new Set()
    data.data.forEach(item => {
      Object.keys(item).forEach(key => {
        if (key !== 'developer') {
          categories.add(key)
        }
      })
    })
    
    const categoryArray = Array.from(categories).sort()
    
    return {
      series: categoryArray.map(category => ({
        data: data.data.map(item => item[category] || 0),
        label: category,
        stack: 'root-causes'
      })),
      xAxis: [{
        data: data.data.map(item => item.developer),
        scaleType: 'band'
      }]
    }
  }, [data])
  
  const chartConfig = useMemo(() => ({
    height,
    margin: { 
      top: 20, 
      right: 20, 
      bottom: { xs: 80, sm: 60 }, 
      left: { xs: 60, sm: 80 } 
    },
    colors: ['#1976d2', '#dc004e', '#2e7d32', '#ed6c02', '#9c27b0', '#ff5722']
  }), [height])
  
  const topDevelopers = useMemo(() => {
    if (!data || !data.data) return []
    
    return data.data
      .map(item => {
        const total = Object.keys(item)
          .filter(key => key !== 'developer')
          .reduce((sum, key) => sum + (item[key] || 0), 0)
        return { developer: item.developer, total }
      })
      .sort((a, b) => b.total - a.total)
      .slice(0, 3)
  }, [data])
  
  const getTrendIcon = useMemo(() => (trend) => {
    switch (trend) {
      case 'increasing':
        return <TrendingUp sx={{ fontSize: 16, color: 'error.main' }} />
      case 'decreasing':
        return <TrendingDown sx={{ fontSize: 16, color: 'success.main' }} />
      default:
        return <TrendingFlat sx={{ fontSize: 16, color: 'text.secondary' }} />
    }
  }, [])
  
  // 3. Callbacks (none needed)
  
  // 4. Early returns
  if (!chartData || !metrics) {
    return (
      <Paper 
        elevation={1} 
        sx={{ 
          p: { xs: 1, sm: 2 }, 
          width: '100%',
          backgroundColor: 'background.paper'
        }}
      >
        <Typography variant="h6">
          <DeveloperIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          No developer root cause data available
        </Typography>
      </Paper>
    )
  }
  
  // 5. Render
  return (
    <Paper 
      elevation={1} 
      sx={{ 
        p: { xs: 1, sm: 2 }, 
        width: '100%',
        backgroundColor: 'background.paper'
      }}
    >
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        mb: { xs: 1, sm: 2 } 
      }}>
        <DeveloperIcon sx={{ mr: 1, color: 'primary.main' }} />
        <Typography 
          variant="h6"
          sx={{ 
            fontSize: { xs: '1rem', sm: '1.25rem' }
          }}
        >
          {title}
        </Typography>
      </Box>
      
      <Box sx={{ 
        height: { xs: 300, sm: height },
        width: '100%',
        mb: { xs: 1, sm: 2 }
      }}>
        <BarChart
          series={chartData.series}
          xAxis={chartData.xAxis}
          {...chartConfig}
        />
      </Box>
      
      <Grid container spacing={{ xs: 1, sm: 2 }}>
        {/* Top Developers */}
        <Grid item xs={12} sm={6}>
          <Typography 
            variant="subtitle2" 
            gutterBottom
            sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
          >
            Most Issues by Developer
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {topDevelopers.map(({ developer, total }) => (
              <Chip
                key={developer}
                label={`${developer} (${total})`}
                size="small"
                variant="outlined"
                color="primary"
              />
            ))}
          </Box>
        </Grid>
        
        {/* Category Trends */}
        <Grid item xs={12} sm={6}>
          <Typography 
            variant="subtitle2" 
            gutterBottom
            sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
          >
            Category Trends
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {Object.entries(metrics.trends || {}).slice(0, 3).map(([category, trend]) => (
              <Box 
                key={category} 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1 
                }}
              >
                {getTrendIcon(trend)}
                <Typography 
                  variant="body2" 
                  sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                >
                  {category}: {trend}
                </Typography>
              </Box>
            ))}
          </Box>
        </Grid>
      </Grid>
      
      {/* Summary Statistics */}
      <Box sx={{ 
        mt: { xs: 1, sm: 2 },
        pt: { xs: 1, sm: 2 },
        borderTop: 1,
        borderColor: 'divider',
        display: 'flex',
        flexWrap: 'wrap',
        gap: { xs: 1, sm: 2 }
      }}>
        <Typography 
          variant="body2" 
          color="text.secondary"
          sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
        >
          Total Developers: {data.data.length}
        </Typography>
        <Typography 
          variant="body2" 
          color="text.secondary"
          sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
        >
          Total Issues: {data.data.reduce((sum, item) => {
            return sum + Object.keys(item)
              .filter(key => key !== 'developer')
              .reduce((itemSum, key) => itemSum + (item[key] || 0), 0)
          }, 0)}
        </Typography>
        <Typography 
          variant="body2" 
          color="text.secondary"
          sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
        >
          Categories: {chartData.series.length}
        </Typography>
      </Box>
    </Paper>
  )
})

// ✅ REQUIRED: PropTypes
DeveloperRootCauseAnalysis.propTypes = {
  data: PropTypes.shape({
    data: PropTypes.arrayOf(PropTypes.object)
  }),
  metrics: PropTypes.shape({
    trends: PropTypes.object
  }),
  title: PropTypes.string,
  height: PropTypes.number
}

export default DeveloperRootCauseAnalysis 