import React, { useMemo, useCallback } from 'react'
import PropTypes from 'prop-types'
import { 
  Box, 
  Grid, 
  Typography, 
  Alert,
  CircularProgress,
  Paper,
  useTheme
} from '@mui/material'
import DeliverySummaryCircular from './DeliverySummaryCircular'
import DeliveryEfficiencyChart from './DeliveryEfficiencyChart'
import RecentDeliveriesGrid from './RecentDeliveriesGrid'

const ProjectDelivery = React.memo(({ 
  data, 
  isLoading = false,
  error = null,
  onProjectClick,
  title = 'Project Delivery Dashboard',
  showSummary = true,
  showChart = true,
  showGrid = true,
  chartHeight = 400,
  maxRecentItems = 6,
  maxChartProjects = 10,
  ...props 
}) => {
  const theme = useTheme()

  const transformedData = useMemo(() => {
    if (!data || !Array.isArray(data)) return []
    
    return data.map(project => ({
      ...project,
      id: project.id || project.projectKey,
      name: project.name || project.projectKey
    }))
  }, [data])

  const handleProjectClick = useCallback((projectId, projectData) => {
    if (onProjectClick) {
      onProjectClick(projectId, projectData)
    }
  }, [onProjectClick])

  const getDeliveryStats = useMemo(() => {
    if (transformedData.length === 0) {
      return {
        totalProjects: 0,
        onTimeProjects: 0,
        delayedProjects: 0,
        criticalProjects: 0,
        avgDeliveryScore: 0,
        totalStoryPoints: 0,
        completedStoryPoints: 0,
        overallDeliveryRate: 0
      }
    }

    const stats = transformedData.reduce((acc, project) => {
      const deliveryScore = project.delivery || 0
      
      acc.totalStoryPoints += project.totalStoryPoints || 0
      acc.completedStoryPoints += project.completedStoryPoints || 0
      acc.deliverySum += deliveryScore
      
      if (deliveryScore >= 80) {
        acc.onTimeProjects += 1
      } else if (deliveryScore >= 60) {
        acc.delayedProjects += 1
      } else {
        acc.criticalProjects += 1
      }
      
      return acc
    }, {
      totalStoryPoints: 0,
      completedStoryPoints: 0,
      deliverySum: 0,
      onTimeProjects: 0,
      delayedProjects: 0,
      criticalProjects: 0
    })

    const overallDeliveryRate = stats.totalStoryPoints > 0 
      ? (stats.completedStoryPoints / stats.totalStoryPoints) * 100 
      : 0

    return {
      totalProjects: transformedData.length,
      onTimeProjects: stats.onTimeProjects,
      delayedProjects: stats.delayedProjects,
      criticalProjects: stats.criticalProjects,
      avgDeliveryScore: stats.deliverySum / transformedData.length,
      totalStoryPoints: stats.totalStoryPoints,
      completedStoryPoints: stats.completedStoryPoints,
      overallDeliveryRate
    }
  }, [transformedData])

  const getDeliveryInsights = useMemo(() => {
    const insights = []
    const recommendations = []

    if (transformedData.length === 0) return { insights, recommendations }

    const { 
      avgDeliveryScore, 
      onTimeProjects, 
      totalProjects, 
      overallDeliveryRate 
    } = getDeliveryStats

    // Performance insights
    if (avgDeliveryScore >= 80) {
      insights.push('Excellent delivery performance across projects')
    } else if (avgDeliveryScore < 60) {
      insights.push(`Low average delivery score (${avgDeliveryScore.toFixed(1)}%)`)
      recommendations.push('Review sprint planning and estimation processes')
    }

    // On-time delivery insights
    const onTimeRate = (onTimeProjects / totalProjects) * 100
    if (onTimeRate < 50) {
      insights.push(`Only ${onTimeRate.toFixed(0)}% of projects are delivering on time`)
      recommendations.push('Implement delivery improvement initiatives')
    } else if (onTimeRate >= 80) {
      insights.push('Strong on-time delivery performance')
    }

    // Story point completion insights
    if (overallDeliveryRate < 70) {
      insights.push(`Story point completion rate is low (${overallDeliveryRate.toFixed(1)}%)`)
      recommendations.push('Focus on scope management and velocity improvement')
    }

    // Capacity insights
    const avgStoryPointsPerProject = getDeliveryStats.totalStoryPoints / totalProjects
    if (avgStoryPointsPerProject > 100) {
      insights.push('Projects have high story point volumes')
      recommendations.push('Consider breaking down large projects into smaller deliverables')
    }

    return { insights, recommendations }
  }, [transformedData, getDeliveryStats])

  if (isLoading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: 200,
          p: 4
        }}
        {...props}
      >
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }} {...props}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error.message || 'Failed to load delivery data'}
        </Alert>
      </Box>
    )
  }

  if (transformedData.length === 0) {
    return (
      <Box sx={{ p: 2 }} {...props}>
        <Typography variant="h5" gutterBottom>
          {title}
        </Typography>
        <Alert severity="info">
          No project data available for delivery analysis
        </Alert>
      </Box>
    )
  }

  return (
    <Box sx={{ width: '100%' }} {...props}>
      <Typography 
        variant="h5" 
        gutterBottom 
        sx={{ 
          mb: 3,
          [theme.breakpoints.down('sm')]: {
            fontSize: '1.25rem'
          }
        }}
      >
        {title}
      </Typography>

      {/* Overview Statistics */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <Paper sx={{ 
            p: 2, 
            textAlign: 'center',
            backgroundColor: theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`
          }}>
            <Typography variant="h6" color="primary">
              {getDeliveryStats.totalProjects}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Total Projects
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={6} sm={3}>
          <Paper sx={{ 
            p: 2, 
            textAlign: 'center',
            backgroundColor: theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`
          }}>
            <Typography variant="h6" color="success.main">
              {getDeliveryStats.onTimeProjects}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              On Time
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={6} sm={3}>
          <Paper sx={{ 
            p: 2, 
            textAlign: 'center',
            backgroundColor: theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`
          }}>
            <Typography variant="h6" color="info.main">
              {getDeliveryStats.avgDeliveryScore.toFixed(1)}%
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Avg Delivery Score
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={6} sm={3}>
          <Paper sx={{ 
            p: 2, 
            textAlign: 'center',
            backgroundColor: theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`
          }}>
            <Typography variant="h6" color="secondary.main">
              {getDeliveryStats.overallDeliveryRate.toFixed(1)}%
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Completion Rate
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Main Dashboard Content */}
      <Grid container spacing={3}>
        {/* Delivery Summary Circle */}
        {showSummary && (
          <Grid item xs={12} md={4}>
            <DeliverySummaryCircular
              data={transformedData}
              diameter={140}
            />
          </Grid>
        )}

        {/* Delivery Efficiency Chart */}
        {showChart && (
          <Grid item xs={12} md={showSummary ? 8 : 12}>
            <DeliveryEfficiencyChart
              data={transformedData}
              height={chartHeight}
              maxProjects={maxChartProjects}
              onProjectClick={handleProjectClick}
            />
          </Grid>
        )}

        {/* Recent Deliveries Grid */}
        {showGrid && (
          <Grid item xs={12}>
            <RecentDeliveriesGrid
              data={transformedData}
              maxItems={maxRecentItems}
              onProjectClick={handleProjectClick}
            />
          </Grid>
        )}
      </Grid>

      {/* Insights Section */}
      {getDeliveryInsights.insights.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Delivery Insights
          </Typography>
          
          <Grid container spacing={2}>
            {getDeliveryInsights.insights.map((insight, index) => (
              <Grid item xs={12} sm={6} key={index}>
                <Alert 
                  severity={
                    insight.includes('Excellent') || insight.includes('Strong') ? 'success' :
                    insight.includes('Low') || insight.includes('Only') ? 'error' : 'info'
                  } 
                  sx={{ mb: 1 }}
                >
                  {insight}
                </Alert>
              </Grid>
            ))}
          </Grid>
          
          {getDeliveryInsights.recommendations.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Recommendations:
              </Typography>
              <Box component="ul" sx={{ pl: 2, m: 0 }}>
                {getDeliveryInsights.recommendations.map((recommendation, index) => (
                  <Typography 
                    component="li" 
                    variant="body2" 
                    color="text.secondary"
                    key={index}
                    sx={{ mb: 0.5 }}
                  >
                    {recommendation}
                  </Typography>
                ))}
              </Box>
            </Box>
          )}
        </Box>
      )}

      {/* Performance Summary */}
      <Box sx={{ 
        mt: 3, 
        p: 2, 
        backgroundColor: theme.palette.background.default,
        borderRadius: 1 
      }}>
        <Typography variant="subtitle2" gutterBottom>
          Delivery Performance Summary
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              Story Points Completed
            </Typography>
            <Typography variant="body2">
              {getDeliveryStats.completedStoryPoints} / {getDeliveryStats.totalStoryPoints}
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              On-Time Projects
            </Typography>
            <Typography variant="body2">
              {getDeliveryStats.onTimeProjects} / {getDeliveryStats.totalProjects}
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              Delayed Projects
            </Typography>
            <Typography variant="body2">
              {getDeliveryStats.delayedProjects}
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              Critical Projects
            </Typography>
            <Typography variant="body2" color="error">
              {getDeliveryStats.criticalProjects}
            </Typography>
          </Grid>
        </Grid>
      </Box>
    </Box>
  )
})

ProjectDelivery.propTypes = {
  data: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string,
    projectKey: PropTypes.string,
    name: PropTypes.string,
    delivery: PropTypes.number,
    totalStoryPoints: PropTypes.number,
    completedStoryPoints: PropTypes.number,
    issues: PropTypes.array
  })),
  isLoading: PropTypes.bool,
  error: PropTypes.shape({
    message: PropTypes.string
  }),
  onProjectClick: PropTypes.func,
  title: PropTypes.string,
  showSummary: PropTypes.bool,
  showChart: PropTypes.bool,
  showGrid: PropTypes.bool,
  chartHeight: PropTypes.number,
  maxRecentItems: PropTypes.number,
  maxChartProjects: PropTypes.number
}

ProjectDelivery.displayName = 'ProjectDelivery'

export default ProjectDelivery