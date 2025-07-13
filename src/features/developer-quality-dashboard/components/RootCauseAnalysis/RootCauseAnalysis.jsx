import React, { useMemo } from 'react'
import PropTypes from 'prop-types'
import { Box, Paper, Typography, Chip, List, ListItem, ListItemText } from '@mui/material'
import { PieChart } from '@mui/x-charts/PieChart'
import { Psychology, TrendingUp, TrendingDown, TrendingFlat } from '@mui/icons-material'

const RootCauseAnalysis = React.memo(({ 
  data, 
  metrics, 
  title = 'Root Cause Analysis', 
  height = 400 
}) => {
  // 1. Hooks first (none needed)
  
  // 2. Memoized values
  const chartData = useMemo(() => {
    if (!data || !data.data || data.data.length === 0) return null
    
    const colors = ['#1976d2', '#dc004e', '#2e7d32', '#ed6c02', '#9c27b0', '#ff9800']
    
    return data.data.map((item, index) => ({
      id: index,
      value: item.value,
      label: item.name,
      color: colors[index % colors.length]
    }))
  }, [data])
  
  const chartConfig = useMemo(() => ({
    height: height,
    margin: { top: 20, right: 20, bottom: 20, left: 20 },
    slotProps: {
      legend: {
        direction: 'column',
        position: {
          vertical: 'middle',
          horizontal: 'right'
        },
        padding: 0
      }
    }
  }), [height])
  
  const categoryTrends = useMemo(() => {
    if (!metrics?.trends) return []
    
    return Object.entries(metrics.trends).map(([category, trend]) => ({
      category,
      trend,
      icon: getTrendIcon(trend),
      color: getTrendColor(trend)
    }))
  }, [metrics?.trends])
  
  const getTrendIcon = (trend) => {
    switch (trend?.toLowerCase()) {
      case 'increasing':
        return <TrendingUp sx={{ fontSize: 16 }} />
      case 'decreasing':
        return <TrendingDown sx={{ fontSize: 16 }} />
      default:
        return <TrendingFlat sx={{ fontSize: 16 }} />
    }
  }
  
  const getTrendColor = (trend) => {
    switch (trend?.toLowerCase()) {
      case 'increasing':
        return 'error.main'
      case 'decreasing':
        return 'success.main'
      default:
        return 'warning.main'
    }
  }
  
  const topCategories = useMemo(() => {
    if (!metrics?.categories) return []
    
    return Object.entries(metrics.categories)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([category, count]) => ({
        category,
        count,
        percentage: Object.values(metrics.categories).reduce((sum, c) => sum + c, 0) > 0 
          ? (count / Object.values(metrics.categories).reduce((sum, c) => sum + c, 0) * 100)
          : 0
      }))
  }, [metrics?.categories])
  
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
        gap: 1,
        mb: { xs: 2, sm: 3 }
      }}>
        <Psychology sx={{ fontSize: 20, color: 'primary.main' }} />
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
      
      {/* Chart */}
      <Box sx={{ 
        height: { xs: Math.min(height, 300), sm: height },
        width: '100%',
        mb: { xs: 2, sm: 3 },
        display: 'flex',
        justifyContent: 'center'
      }}>
        <PieChart
          series={[{
            data: chartData,
            highlightScope: { faded: 'global', highlighted: 'item' },
            faded: { innerRadius: 30, additionalRadius: -30, color: 'gray' }
          }]}
          {...chartConfig}
        />
      </Box>
      
      {/* Categories Summary */}
      <Box sx={{ 
        display: 'grid',
        gridTemplateColumns: { 
          xs: '1fr',
          md: 'repeat(2, 1fr)'
        },
        gap: { xs: 2, sm: 3 }
      }}>
        {/* Top Categories */}
        <Box>
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ 
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              mb: 2,
              fontWeight: 600
            }}
          >
            Top Root Causes
          </Typography>
          <List dense sx={{ p: 0 }}>
            {topCategories.map((item, index) => (
              <ListItem 
                key={item.category}
                sx={{ 
                  px: 0,
                  py: 0.5,
                  borderLeft: 4,
                  borderColor: chartData[index]?.color || 'primary.main',
                  pl: 1
                }}
              >
                <ListItemText
                  primary={
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <Typography 
                        variant="body2"
                        sx={{ 
                          fontSize: { xs: '0.75rem', sm: '0.875rem' },
                          fontWeight: 500
                        }}
                      >
                        {item.category}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Typography 
                          variant="body2"
                          sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                        >
                          {item.count}
                        </Typography>
                        <Chip
                          label={`${item.percentage.toFixed(1)}%`}
                          size="small"
                          variant="outlined"
                          sx={{ 
                            fontSize: { xs: '0.65rem', sm: '0.75rem' },
                            height: 20,
                            minWidth: 45
                          }}
                        />
                      </Box>
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        </Box>
        
        {/* Trend Analysis */}
        <Box>
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ 
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              mb: 2,
              fontWeight: 600
            }}
          >
            Trend Analysis
          </Typography>
          {categoryTrends.length > 0 ? (
            <List dense sx={{ p: 0 }}>
              {categoryTrends.map((item) => (
                <ListItem 
                  key={item.category}
                  sx={{ px: 0, py: 0.5 }}
                >
                  <ListItemText
                    primary={
                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <Typography 
                          variant="body2"
                          sx={{ 
                            fontSize: { xs: '0.75rem', sm: '0.875rem' },
                            fontWeight: 500
                          }}
                        >
                          {item.category}
                        </Typography>
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 0.5,
                          color: item.color
                        }}>
                          {item.icon}
                          <Typography 
                            variant="body2"
                            sx={{ 
                              fontSize: { xs: '0.75rem', sm: '0.875rem' },
                              textTransform: 'capitalize'
                            }}
                          >
                            {item.trend}
                          </Typography>
                        </Box>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
            >
              No trend data available
            </Typography>
          )}
        </Box>
      </Box>
      
      {/* Total Issues Summary */}
      <Box sx={{ 
        mt: { xs: 2, sm: 3 },
        pt: { xs: 2, sm: 3 },
        borderTop: 1,
        borderColor: 'divider',
        textAlign: 'center'
      }}>
        <Typography 
          variant="h4"
          sx={{ 
            fontSize: { xs: '1.5rem', sm: '2rem' },
            fontWeight: 600,
            color: 'primary.main'
          }}
        >
          {Object.values(metrics.categories || {}).reduce((sum, count) => sum + count, 0).toLocaleString()}
        </Typography>
        <Typography 
          variant="body2" 
          color="text.secondary"
          sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
        >
          Total Issues Analyzed
        </Typography>
      </Box>
    </Paper>
  )
})

// ✅ REQUIRED: PropTypes
RootCauseAnalysis.propTypes = {
  data: PropTypes.shape({
    data: PropTypes.arrayOf(PropTypes.shape({
      name: PropTypes.string.isRequired,
      value: PropTypes.number.isRequired,
      percentage: PropTypes.number.isRequired
    }))
  }),
  metrics: PropTypes.shape({
    categories: PropTypes.objectOf(PropTypes.number),
    trends: PropTypes.objectOf(PropTypes.string)
  }),
  title: PropTypes.string,
  height: PropTypes.number
}

export default RootCauseAnalysis 