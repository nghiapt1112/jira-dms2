import React, { useMemo, useCallback } from 'react'
import PropTypes from 'prop-types'
import { 
  createDate, 
  getCurrentDate, 
  getAgeInDays, 
  formatRelativeDate, 
  daysAgo, 
  TIME_CONSTANTS 
} from '../../../../shared/utils/dateUtils.js'
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Card, 
  CardContent, 
  CardActionArea,
  Chip, 
  LinearProgress,
  useTheme 
} from '@mui/material'
import { 
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon 
} from '@mui/icons-material'

const RecentDeliveriesGrid = React.memo(({ 
  data, 
  title = 'Recent Deliveries',
  maxItems = 6,
  onProjectClick,
  ...props 
}) => {
  const theme = useTheme()

  const recentDeliveries = useMemo(() => {
    if (!data || data.length === 0) return []
    
    // Filter projects with recent activity and sort by last delivery date
    const projectsWithDeliveries = data
      .filter(project => {
        const hasCompletedWork = (project.completedStoryPoints || 0) > 0
        const hasRecentActivity = project.issues?.some(issue => {
          const updated = createDate(issue.fields?.updated)
          const daysSinceUpdate = updated ? getAgeInDays(updated) : 0
          return daysSinceUpdate <= 30
        })
        return hasCompletedWork || hasRecentActivity
      })
      .map(project => {
        const lastUpdate = getLastUpdateTime(project)
        const deliveryEfficiency = getDeliveryEfficiency(project)
        const recentCompletions = getRecentCompletions(project)
        
        return {
          ...project,
          lastUpdate,
          deliveryEfficiency,
          recentCompletions,
          lastDeliveryDate: getLastDeliveryDate(project)
        }
      })
      .sort((a, b) => b.lastUpdate - a.lastUpdate)
      .slice(0, maxItems)

    return projectsWithDeliveries
  }, [data, maxItems])

  const handleProjectClick = useCallback((project) => {
    if (onProjectClick) {
      onProjectClick(project.id || project.projectKey, project)
    }
  }, [onProjectClick])

  const getEfficiencyChipProps = useCallback((efficiency) => {
    if (efficiency >= 80) {
      return { 
        label: 'On Time', 
        color: 'success', 
        icon: <CheckCircleIcon sx={{ fontSize: 16 }} /> 
      }
    } else if (efficiency >= 60) {
      return { 
        label: 'Delayed', 
        color: 'warning', 
        icon: <ScheduleIcon sx={{ fontSize: 16 }} /> 
      }
    } else {
      return { 
        label: 'Critical', 
        color: 'error', 
        icon: <WarningIcon sx={{ fontSize: 16 }} /> 
      }
    }
  }, [])

  const formatDate = useCallback((dateString) => {
    if (!dateString) return 'No recent activity'
    return formatRelativeDate(dateString)
  }, [])

  if (!data || data.length === 0) {
    return (
      <Paper elevation={1} sx={{ p: 2, width: '100%' }} {...props}>
        <Typography variant="h6">{title}</Typography>
        <Box sx={{ 
          minHeight: 200, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}>
          <Typography color="text.secondary">No recent delivery data available</Typography>
        </Box>
      </Paper>
    )
  }

  if (recentDeliveries.length === 0) {
    return (
      <Paper elevation={1} sx={{ p: 2, width: '100%' }} {...props}>
        <Typography variant="h6">{title}</Typography>
        <Box sx={{ 
          minHeight: 200, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}>
          <Typography color="text.secondary">No recent delivery activity found</Typography>
        </Box>
      </Paper>
    )
  }

  return (
    <Paper elevation={1} sx={{ p: 2, width: '100%' }} {...props}>
      <Typography variant="h6" sx={{ mb: 2 }}>{title}</Typography>
      
      <Grid container spacing={2}>
        {recentDeliveries.map((project) => {
          const deliverySuccess = (project.completedStoryPoints || 0) / (project.totalStoryPoints || 1) * 100
          const efficiencyProps = getEfficiencyChipProps(project.deliveryEfficiency)
          
          return (
            <Grid item xs={12} sm={6} md={4} key={project.id || project.projectKey}>
              <Card 
                elevation={1}
                sx={{ 
                  height: '100%',
                  cursor: onProjectClick ? 'pointer' : 'default',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': onProjectClick ? {
                    elevation: 3,
                    transform: 'translateY(-2px)'
                  } : {}
                }}
              >
                <CardActionArea 
                  onClick={() => handleProjectClick(project)}
                  disabled={!onProjectClick}
                  sx={{ height: '100%' }}
                >
                  <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    {/* Project Header */}
                    <Box sx={{ mb: 2 }}>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontSize: '1rem',
                          fontWeight: 'bold',
                          mb: 0.5,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                        title={project.name || project.projectKey}
                      >
                        {project.name || project.projectKey}
                      </Typography>
                      
                      <Chip 
                        {...efficiencyProps}
                        size="small"
                        variant="outlined"
                      />
                    </Box>

                    {/* Delivery Progress */}
                    <Box sx={{ mb: 2, flexGrow: 1 }}>
                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        mb: 1
                      }}>
                        <Typography variant="caption" color="text.secondary">
                          Delivery Success
                        </Typography>
                        <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                          {deliverySuccess.toFixed(0)}%
                        </Typography>
                      </Box>
                      
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(deliverySuccess, 100)}
                        sx={{ 
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: theme.palette.grey[200]
                        }}
                        color={
                          deliverySuccess >= 80 ? 'success' :
                          deliverySuccess >= 60 ? 'warning' : 'error'
                        }
                      />
                    </Box>

                    {/* Delivery Stats */}
                    <Box sx={{ 
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 1,
                      mb: 2
                    }}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" color="primary" sx={{ fontSize: '1.1rem' }}>
                          {project.recentCompletions}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Recent
                        </Typography>
                      </Box>
                      
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" color="success.main" sx={{ fontSize: '1.1rem' }}>
                          {project.completedStoryPoints || 0}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Story Points
                        </Typography>
                      </Box>
                    </Box>

                    {/* Last Activity */}
                    <Box sx={{ 
                      mt: 'auto',
                      pt: 1,
                      borderTop: `1px solid ${theme.palette.divider}`
                    }}>
                      <Typography variant="caption" color="text.secondary">
                        Last activity: {formatDate(project.lastDeliveryDate)}
                      </Typography>
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          )
        })}
      </Grid>

      {/* Summary Footer */}
      <Box sx={{ 
        mt: 3, 
        p: 1.5, 
        backgroundColor: theme.palette.background.default,
        borderRadius: 1,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 1
      }}>
        <Typography variant="caption" color="text.secondary">
          Showing {recentDeliveries.length} projects with recent delivery activity
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Avg Efficiency: {
              recentDeliveries.length > 0 
                ? (recentDeliveries.reduce((sum, p) => sum + p.deliveryEfficiency, 0) / recentDeliveries.length).toFixed(0)
                : '0'
            }%
          </Typography>
          
          <Typography variant="caption" color="text.secondary">
            Total Completions: {
              recentDeliveries.reduce((sum, p) => sum + (p.recentCompletions || 0), 0)
            }
          </Typography>
        </Box>
      </Box>
    </Paper>
  )
})

// Helper functions
const getLastUpdateTime = (project) => {
  if (!project.issues || project.issues.length === 0) return 0
  
  return Math.max(...project.issues.map(issue => 
    createDate(issue.fields?.updated)?.getTime() || 0
  ))
}

const getDeliveryEfficiency = (project) => {
  return project.delivery || 0
}

const getRecentCompletions = (project) => {
  if (!project.issues) return 0
  
  const thirtyDaysAgo = daysAgo(30)
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  
  return project.issues.filter(issue => {
    const resolved = createDate(issue.fields?.resolutiondate)
    const status = issue.displayFields?.status || issue.fields?.status?.name
    const isCompleted = status === 'Done' || status === 'Closed' || status === 'Resolved'
    
    return isCompleted && resolved >= thirtyDaysAgo
  }).length
}

const getLastDeliveryDate = (project) => {
  if (!project.issues || project.issues.length === 0) return null
  
  const completedIssues = project.issues.filter(issue => {
    const status = issue.displayFields?.status || issue.fields?.status?.name
    return status === 'Done' || status === 'Closed' || status === 'Resolved'
  })
  
  if (completedIssues.length === 0) return null
  
  const lastResolved = Math.max(...completedIssues.map(issue => 
    createDate(issue.fields?.resolutiondate)?.getTime() || 0
  ))
  
  const lastResolvedDate = createDate(lastResolved)
  return lastResolvedDate ? lastResolvedDate.toISOString() : getCurrentDate().toISOString()
}

RecentDeliveriesGrid.propTypes = {
  data: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string,
    projectKey: PropTypes.string,
    name: PropTypes.string,
    delivery: PropTypes.number,
    completedStoryPoints: PropTypes.number,
    totalStoryPoints: PropTypes.number,
    issues: PropTypes.array
  })),
  title: PropTypes.string,
  maxItems: PropTypes.number,
  onProjectClick: PropTypes.func
}

RecentDeliveriesGrid.displayName = 'RecentDeliveriesGrid'

export default RecentDeliveriesGrid