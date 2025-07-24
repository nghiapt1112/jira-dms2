import React, { useMemo, useEffect } from 'react'
import PropTypes from 'prop-types'
import { Box, Paper, Typography, Chip } from '@mui/material'
import { TrendingUp, TrendingDown, TrendingFlat } from '@mui/icons-material'
import { performanceMonitor } from '../../utils/PerformanceMonitor'
import TeamOverviewChart from './TeamOverviewChart'

const TeamContributionChart = React.memo(({ 
  data, 
  metrics, 
  title = 'Team Contribution by Story Points', 
  height = 400,
  statusFilter = [],
  onStatusFilterChange,
  filters = {},
  // Performance controls from FilterPanel
  showTargetLines = false,
  performanceFilter = 'all'
}) => {
  // 1. Single project detection
  const isSingleProject = useMemo(() => {
    return filters?.projects?.length === 1
  }, [filters?.projects])
  
  // 2. Memoized values - following .cursorrules pattern
  const teamSize = useMemo(() => {
    if (!data?.data || data.data.length === 0) return 0
    
    const developers = new Set()
    data.data.forEach(item => {
      Object.keys(item).forEach(key => {
        if (key !== 'timePeriod') {
          developers.add(key)
        }
      })
    })
    return developers.size
  }, [data?.data])
  
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
  
  // 3. Effects - consolidated following .cursorrules
  useEffect(() => {
    const timer = performanceMonitor.startTimer('chartRender')
    
    // Combined logging for performance
    if (data?.data) {
      console.log('📊 CHART: TeamContributionChart rendering with data:', {
        dataPoints: data.data.length,
        timePeriods: data.data.map(d => d.timePeriod),
        developers: Object.keys(data.data[0] || {}).filter(k => k !== 'timePeriod'),
        teamSize,
        filterState: filters,
        timestamp: new Date().toISOString()
      })
    } else {
      console.log('📊 CHART: TeamContributionChart - No data available')
    }
    
    return () => {
      timer?.end()
    }
  }, [data, filters, teamSize])
  
  // 4. Early returns - following .cursorrules pattern
  if (!data?.data || !metrics) {
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
  
  // 6. Render
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
        gap: 2
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
      
      
      {/* Team Overview Chart */}
      <TeamOverviewChart 
        data={data?.data}
        metrics={metrics}
        height={height}
        chartConfig={chartConfig}
        filters={filters}
        showTargetLines={isSingleProject && showTargetLines}
        performanceFilter={isSingleProject && showTargetLines ? performanceFilter : 'all'}
        selectedProjectKey={isSingleProject ? filters.projects[0] : null}
      />
      
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
            {metrics?.totalStoryPoints?.toLocaleString() || 0}
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
            {metrics?.averageStoryPoints?.toFixed(1) || '0.0'}
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
            {metrics?.topContributors?.slice(0, 3).map((contributor, index) => (
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

// ✅ PropTypes for team overview chart
TeamContributionChart.propTypes = {
  data: PropTypes.shape({
    data: PropTypes.arrayOf(PropTypes.shape({
      timePeriod: PropTypes.string.isRequired
      // Note: Dynamic developer properties (e.g., 'developer1': 10, 'developer2': 5)
      // are validated at runtime since they're dynamic based on actual data
    }))
  }),
  metrics: PropTypes.shape({
    totalContributions: PropTypes.number,
    totalStoryPoints: PropTypes.number,
    averageContribution: PropTypes.number,
    averageStoryPoints: PropTypes.number,
    contributionTrend: PropTypes.oneOf(['increasing', 'decreasing', 'stable']),
    topContributors: PropTypes.arrayOf(PropTypes.shape({
      developer: PropTypes.string.isRequired,
      contributions: PropTypes.number.isRequired,
      storyPoints: PropTypes.number.isRequired,
      percentage: PropTypes.number
    }))
  }),
  title: PropTypes.string,
  height: PropTypes.number,
  statusFilter: PropTypes.arrayOf(PropTypes.string),
  onStatusFilterChange: PropTypes.func,
  filters: PropTypes.shape({
    developers: PropTypes.arrayOf(PropTypes.string),
    projects: PropTypes.arrayOf(PropTypes.string),
    issueTypes: PropTypes.arrayOf(PropTypes.string),
    statuses: PropTypes.arrayOf(PropTypes.string),
    severities: PropTypes.arrayOf(PropTypes.string),
    rootCauses: PropTypes.arrayOf(PropTypes.string),
    timeframe: PropTypes.oneOf(['week', 'month', 'quarter']),
    statusFilter: PropTypes.arrayOf(PropTypes.string)
  }),
  // Performance controls from FilterPanel
  showTargetLines: PropTypes.bool,
  performanceFilter: PropTypes.oneOf(['all', 'under', 'over'])
}

export default TeamContributionChart 