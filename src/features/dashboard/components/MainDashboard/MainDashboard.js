import React, { useEffect, useMemo, useState, useCallback } from 'react'
import PropTypes from 'prop-types'
import {
  Box,
  Typography,
  Paper,
  Grid,
  Alert,
  Button,
  CircularProgress,
  LinearProgress,
  Divider,
  useTheme
} from '@mui/material'
import {
  Refresh as RefreshIcon,
  Dashboard as DashboardIcon
} from '@mui/icons-material'
import { useJiraData } from '../../../jira-data/hooks/useJiraData'
import { useMainDashboardCache } from '../../hooks/useMainDashboardCache'
import ProjectHealthOverview from '../ProjectHealthOverview'
import ProjectDelivery from '../ProjectDelivery'
import SprintMetricsChartsDashboard from '../SprintMetricsChartsDashboard'

const MainDashboard = React.memo(({ 
  selectedProjects = [],
  ...props 
}) => {
  const theme = useTheme()
  const [isProcessingCache, setIsProcessingCache] = useState(false)
  const [cachedData, setCachedData] = useState(null)
  const [selectedProjectForDetails, setSelectedProjectForDetails] = useState(null)

  // Get JIRA data
  const {
    issues,
    hasData,
    isLoading,
    error,
    fetchData,
    refreshData,
    loadCachedData,
    isDataStale,
    lastFetched
  } = useJiraData()

  // Initialize cache hook
  const cacheHook = useMainDashboardCache(selectedProjects)
  const {
    processIssuesWithCache,
    cacheStatus,
    performanceMetrics
  } = cacheHook
  
  // Create a stable key for cache processing
  const cacheKey = useMemo(() => {
    return `${hasData}-${issues?.length || 0}-${selectedProjects.join(',')}`
  }, [hasData, issues, selectedProjects])

  // Auto-load from cache on mount (F5/page refresh)
  useEffect(() => {
    if (!hasData && !isLoading && !error) {
      // Only load from cache, don't fetch from API
      loadCachedData()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Process data through cache when cache key changes
  useEffect(() => {
    // Skip if no data
    if (!hasData || !issues || issues.length === 0) {
      setCachedData(null)
      return
    }

    let cancelled = false

    const processData = async () => {
      // Skip if already cancelled
      if (cancelled) return
      
      setIsProcessingCache(true)
      try {
        const result = await processIssuesWithCache(issues)
        if (!cancelled) {
          setCachedData(result.data)
        }
      } catch (error) {
        console.error('Failed to process dashboard data:', error)
        if (!cancelled) {
          setCachedData(null)
        }
      } finally {
        if (!cancelled) {
          setIsProcessingCache(false)
        }
      }
    }

    // Use a small delay to debounce rapid updates
    const timeoutId = setTimeout(() => {
      processData()
    }, 100)

    return () => {
      cancelled = true
      clearTimeout(timeoutId)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey])

  // Memoized data for components
  const projectData = useMemo(() => {
    if (!cachedData || !cachedData.projects) return []
    
    // Filter by selected projects if any
    if (selectedProjects.length > 0) {
      return cachedData.projects.filter(project => 
        selectedProjects.includes(project.projectKey)
      )
    }
    
    return cachedData.projects
  }, [cachedData, selectedProjects])

  const overallMetrics = useMemo(() => {
    if (!cachedData || !cachedData.metrics) {
      return {
        totalProjects: 0,
        avgQualityScore: 0,
        avgHealthScore: 0,
        avgDeliveryScore: 0,
        totalIssues: 0,
        totalBugs: 0
      }
    }
    return cachedData.metrics
  }, [cachedData])

  // Handlers
  const handleRefresh = useCallback(async () => {
    // This is the only place that calls the backend API
    await refreshData()
  }, [refreshData])

  const handleProjectClick = useCallback((projectId, projectData) => {
    setSelectedProjectForDetails({ id: projectId, data: projectData })
    // You could navigate to a project detail view or show a modal here
    console.log('Project clicked:', projectId, projectData)
  }, [])

  // Loading state
  if (isLoading && !hasData) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center',
        minHeight: 400,
        p: 4
      }}>
        <CircularProgress size={48} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading JIRA data...
        </Typography>
      </Box>
    )
  }

  // Error state
  if (error && !hasData) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert 
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={handleRefresh}>
              Retry
            </Button>
          }
        >
          {error.message || 'Failed to load dashboard data'}
        </Alert>
      </Box>
    )
  }

  // No data state
  if (!hasData && !isLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert 
          severity="info"
          action={
            <Button color="inherit" size="small" onClick={() => loadCachedData()}>
              Load from Cache
            </Button>
          }
        >
          No JIRA data in cache. Click "Load from Cache" to check cache or use the "Refresh" button above to fetch new data from server.
        </Alert>
      </Box>
    )
  }

  return (
    <Box sx={{ 
      width: '100%', 
      maxWidth: '100%',
      overflow: 'hidden', // Prevent overflow
      minHeight: '100vh',
      boxSizing: 'border-box'
    }} {...props}>
      {/* Header */}
      <Box sx={{ 
        mb: { xs: 2, sm: 3, md: 4 }, 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 2
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <DashboardIcon color="primary" sx={{ fontSize: 32 }} />
          <Typography 
            variant="h4" 
            component="h1"
            sx={{ 
              fontWeight: 'bold',
              [theme.breakpoints.down('sm')]: {
                fontSize: '1.75rem'
              }
            }}
          >
            Main Dashboard
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {isDataStale() && (
            <Typography variant="caption" color="warning.main">
              Data is stale
            </Typography>
          )}
          
          <Button
            variant="contained"
            color="primary"
            startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : <RefreshIcon />}
            onClick={handleRefresh}
            disabled={isLoading}
            title="Fetch new data from server"
          >
            {isLoading ? 'Fetching from Server...' : 'Refresh Data'}
          </Button>
        </Box>
      </Box>

      {/* Loading overlay for cache processing */}
      {isProcessingCache && (
        <Box sx={{ mb: 2 }}>
          <Alert severity="info">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <CircularProgress size={20} />
              <Typography>Processing dashboard data...</Typography>
            </Box>
          </Alert>
        </Box>
      )}


      {/* Overall Metrics Summary */}
      <Paper sx={{ 
        p: { xs: 2, sm: 3 }, 
        mb: { xs: 3, sm: 4 },
        overflow: 'hidden',
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box'
      }}>
        <Typography variant="h6" gutterBottom>
          Portfolio Overview
        </Typography>
        
        <Grid container spacing={{ xs: 1, sm: 2, md: 3 }} sx={{ mt: 1 }}>
          <Grid item xs={6} sm={4} md={2}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary">
                {overallMetrics.totalProjects}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Total Projects
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={6} sm={4} md={2}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="info.main">
                {overallMetrics.totalIssues}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Total Issues
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={6} sm={4} md={2}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="error.main">
                {overallMetrics.totalBugs}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Total Bugs
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={6} sm={4} md={2}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography 
                variant="h4" 
                color={overallMetrics.avgQualityScore >= 70 ? 'success.main' : 'warning.main'}
              >
                {overallMetrics.avgQualityScore.toFixed(0)}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Avg Quality
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={6} sm={4} md={2}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography 
                variant="h4" 
                color={overallMetrics.avgHealthScore >= 70 ? 'success.main' : 'warning.main'}
              >
                {overallMetrics.avgHealthScore.toFixed(0)}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Avg Health
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={6} sm={4} md={2}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography 
                variant="h4" 
                color={overallMetrics.avgDeliveryScore >= 70 ? 'success.main' : 'warning.main'}
              >
                {overallMetrics.avgDeliveryScore.toFixed(0)}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Avg Delivery
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Main Dashboard Components */}
      {cachedData && projectData.length > 0 ? (
        <Grid container spacing={{ xs: 2, sm: 3, md: 4 }} sx={{ mt: 1 }}>
          {/* Project Health Overview */}
          <Grid item xs={12}>
            <ProjectHealthOverview
              data={projectData}
              onProjectClick={handleProjectClick}
            />
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
          </Grid>

          {/* Project Delivery Dashboard */}
          <Grid item xs={12}>
            <ProjectDelivery
              data={projectData}
              onProjectClick={handleProjectClick}
            />
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
          </Grid>

          {/* Sprint Metrics */}
          <Grid item xs={12}>
            <SprintMetricsChartsDashboard
              data={issues}
              defaultSelectedProject={selectedProjects.length === 1 ? selectedProjects[0] : null}
            />
          </Grid>

        </Grid>
      ) : (
        <Box sx={{ 
          textAlign: 'center', 
          py: { xs: 4, sm: 6, md: 8 },
          px: { xs: 2, sm: 3 },
          backgroundColor: theme.palette.background.paper,
          borderRadius: 2,
          mx: 'auto',
          maxWidth: '600px'
        }}>
          {isProcessingCache ? (
            <>
              <CircularProgress />
              <Typography variant="h6" sx={{ mt: 2 }}>
                Processing dashboard data...
              </Typography>
            </>
          ) : (
            <>
              <Typography variant="h6" color="text.secondary">
                No project data available
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {selectedProjects.length > 0 
                  ? 'No data found for selected projects'
                  : 'Try refreshing to load the latest data'
                }
              </Typography>
            </>
          )}
        </Box>
      )}
    </Box>
  )
})

MainDashboard.propTypes = {
  selectedProjects: PropTypes.arrayOf(PropTypes.string)
}


MainDashboard.displayName = 'MainDashboard'

export default MainDashboard