import React, { useMemo, useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { Box, Paper, Typography, Chip } from '@mui/material'
import { TrendingUp, TrendingDown, TrendingFlat } from '@mui/icons-material'
import { performanceMonitor } from '../../utils/PerformanceMonitor'
import TeamOverviewChart from './TeamOverviewChart'
import ProjectMembersContribution from './ProjectMembersContribution'
import TimePeriodDetail from './TimePeriodDetail'

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
  // 1. State for time period selection
  const [selectedTimePeriod, setSelectedTimePeriod] = useState(null)
  
  // 2. Single project detection
  const isSingleProject = useMemo(() => {
    return filters?.projects?.length === 1
  }, [filters?.projects])
  
  // 3. Time period click handler
  const handleTimePeriodClick = useMemo(() => (timePeriodData) => {
    setSelectedTimePeriod(timePeriodData)
  }, [])
  
  const handleBackToOverview = useMemo(() => () => {
    setSelectedTimePeriod(null)
  }, [])
  
  // Clear selection when project changes
  useEffect(() => {
    setSelectedTimePeriod(null)
  }, [filters?.projects])
  
  // 4. Memoized values - following .cursorrules pattern
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
  
  // 5. Effects - consolidated following .cursorrules
  useEffect(() => {
    const timer = performanceMonitor.startTimer('chartRender')
    
    
    if (!(data?.data && data.data.length > 0)) {
      console.warn('⚠️ TEAM CONTRIBUTION - No data available:', {
        dataObject: data,
        dataType: typeof data,
        dataKeys: data ? Object.keys(data) : null
      })
    }
    
    return () => {
      timer?.end()
    }
  }, [data, filters, teamSize])
  
  // 6. Early returns - following .cursorrules pattern
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
  
  // 7. Render
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
        onTimePeriodClick={isSingleProject ? handleTimePeriodClick : null}
      />
      
      {/* Time Period Detail View - Only shown when a time period is selected */}
      {selectedTimePeriod && isSingleProject && (
        <Box sx={{ mt: { xs: 2, sm: 3 } }}>
          <TimePeriodDetail
            timePeriodData={selectedTimePeriod}
            metrics={metrics}
            selectedProjectKey={filters.projects[0]}
            filters={filters}
            onBack={handleBackToOverview}
            height={height}
            showTargetLines={showTargetLines}
            performanceFilter={performanceFilter}
          />
        </Box>
      )}

      {/* Project Members Contribution Chart - Only shown when single project is selected and no time period selected */}
      {/* TODO: Team lead fixed to hide this chart. */}
      {false && !selectedTimePeriod && (
        <Box sx={{ mt: { xs: 2, sm: 3 } }}>
          <ProjectMembersContribution
            data={data}
            metrics={metrics}
            title="Project Members Contribution"
            height={height}
            filters={filters}
            showTargetLines={showTargetLines}
            performanceFilter={performanceFilter}
          />
        </Box>
      )}

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