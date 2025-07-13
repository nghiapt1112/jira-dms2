import React, { useMemo, useCallback } from 'react'
import PropTypes from 'prop-types'
import { 
  Box, 
  Grid, 
  Typography, 
  Alert,
  CircularProgress,
  useTheme
} from '@mui/material'
import QualityVsDeliveryChart from './QualityVsDeliveryChart'
import QualityVsHealthChart from './QualityVsHealthChart'
import ProjectHealthTable from './ProjectHealthTable'

const ProjectHealthOverview = React.memo(({ 
  data, 
  isLoading = false,
  error = null,
  onProjectClick,
  title = 'Project Health Overview',
  showCharts = true,
  showTable = true,
  chartHeight = 400,
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

  const getOverviewStats = useMemo(() => {
    if (transformedData.length === 0) {
      return {
        totalProjects: 0,
        healthyProjects: 0,
        avgQualityScore: 0,
        avgHealthScore: 0,
        totalIssues: 0,
        totalBugs: 0
      }
    }

    const stats = transformedData.reduce((acc, project) => {
      acc.totalIssues += project.issues?.length || 0
      acc.totalBugs += project.bugs?.length || 0
      acc.qualitySum += project.qualityScore || 0
      acc.healthSum += project.healthScore || 0
      
      if ((project.healthScore || 0) >= 80) {
        acc.healthyProjects += 1
      }
      
      return acc
    }, {
      totalIssues: 0,
      totalBugs: 0,
      qualitySum: 0,
      healthSum: 0,
      healthyProjects: 0
    })

    return {
      totalProjects: transformedData.length,
      healthyProjects: stats.healthyProjects,
      avgQualityScore: stats.qualitySum / transformedData.length,
      avgHealthScore: stats.healthSum / transformedData.length,
      totalIssues: stats.totalIssues,
      totalBugs: stats.totalBugs
    }
  }, [transformedData])

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
          {error.message || 'Failed to load project health data'}
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
          No project data available for health overview
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
          <Box sx={{ 
            p: 2, 
            backgroundColor: theme.palette.background.paper,
            borderRadius: 1,
            border: `1px solid ${theme.palette.divider}`
          }}>
            <Typography variant="h6" color="primary">
              {getOverviewStats.totalProjects}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Total Projects
            </Typography>
          </Box>
        </Grid>
        
        <Grid item xs={6} sm={3}>
          <Box sx={{ 
            p: 2, 
            backgroundColor: theme.palette.background.paper,
            borderRadius: 1,
            border: `1px solid ${theme.palette.divider}`
          }}>
            <Typography variant="h6" color="success.main">
              {getOverviewStats.healthyProjects}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Healthy Projects
            </Typography>
          </Box>
        </Grid>
        
        <Grid item xs={6} sm={3}>
          <Box sx={{ 
            p: 2, 
            backgroundColor: theme.palette.background.paper,
            borderRadius: 1,
            border: `1px solid ${theme.palette.divider}`
          }}>
            <Typography variant="h6" color="info.main">
              {getOverviewStats.avgQualityScore.toFixed(1)}%
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Avg Quality Score
            </Typography>
          </Box>
        </Grid>
        
        <Grid item xs={6} sm={3}>
          <Box sx={{ 
            p: 2, 
            backgroundColor: theme.palette.background.paper,
            borderRadius: 1,
            border: `1px solid ${theme.palette.divider}`
          }}>
            <Typography variant="h6" color="warning.main">
              {getOverviewStats.totalBugs}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Total Bugs
            </Typography>
          </Box>
        </Grid>
      </Grid>

      {/* Charts Section */}
      {showCharts && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} lg={6}>
            <QualityVsDeliveryChart
              data={transformedData}
              height={chartHeight}
              onProjectClick={handleProjectClick}
            />
          </Grid>
          
          <Grid item xs={12} lg={6}>
            <QualityVsHealthChart
              data={transformedData}
              height={chartHeight}
              onProjectClick={handleProjectClick}
            />
          </Grid>
        </Grid>
      )}

      {/* Table Section */}
      {showTable && (
        <Grid container>
          <Grid item xs={12}>
            <ProjectHealthTable
              data={transformedData}
              onProjectClick={handleProjectClick}
            />
          </Grid>
        </Grid>
      )}

      {/* Insights Section - Removed as requested */}
    </Box>
  )
})

ProjectHealthOverview.propTypes = {
  data: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string,
    projectKey: PropTypes.string,
    name: PropTypes.string,
    qualityScore: PropTypes.number,
    healthScore: PropTypes.number,
    delivery: PropTypes.number,
    effort: PropTypes.number,
    bugs: PropTypes.array,
    issues: PropTypes.array,
    progress: PropTypes.number,
    bugRate: PropTypes.number,
    qualityStatus: PropTypes.string,
    health: PropTypes.string
  })),
  isLoading: PropTypes.bool,
  error: PropTypes.shape({
    message: PropTypes.string
  }),
  onProjectClick: PropTypes.func,
  title: PropTypes.string,
  showCharts: PropTypes.bool,
  showTable: PropTypes.bool,
  chartHeight: PropTypes.number
}

ProjectHealthOverview.displayName = 'ProjectHealthOverview'

export default ProjectHealthOverview