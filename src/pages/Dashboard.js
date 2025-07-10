import React, { useEffect } from 'react'
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  Alert,
  Skeleton,
  CircularProgress,
  LinearProgress
} from '@mui/material'
import {
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  Storage as StorageIcon,
  Assignment as AssignmentIcon,
  Group as GroupIcon,
  BugReport as BugReportIcon
} from '@mui/icons-material'
import { useJiraDataLoader } from '../features/jira-data/hooks/useJiraDataLoader'
import { useJiraDataStore } from '../features/jira-data/store/jiraDataStore'
import LoadingIndicator from '../components/ui/LoadingIndicator'
import toast, { Toaster } from 'react-hot-toast'

const StatCard = React.memo(({ title, value, icon, color = 'primary' }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 48,
            height: 48,
            borderRadius: 2,
            bgcolor: `${color}.light`,
            color: `${color}.main`,
            mr: 2,
          }}
        >
          {icon}
        </Box>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h4" component="div">
            {value !== null ? value.toLocaleString() : <Skeleton width={80} />}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {title}
          </Typography>
        </Box>
      </Box>
    </CardContent>
  </Card>
))

const Dashboard = React.memo(() => {
  const {
    // Data
    allIssues: issues,
    hasData,
    
    // Loading state
    isLoading,
    loadingStage,
    currentOperation,
    overallProgress,
    downloadStats,
    currentDownloadingFile,
    downloadProgress,
    failedDownloads,
    error,
    
    // Actions
    startDataFetch,
    retryFailed,
    cancelDownload,
    hasFailedDownloads,
    
    // Helper functions
    getDataSummary
  } = useJiraDataLoader()
  
  const summary = getDataSummary()
  const [cacheChecked, setCacheChecked] = React.useState(false)
  const [fetchAttempted, setFetchAttempted] = React.useState(false)
  
  // First, check cache on mount
  useEffect(() => {
    const checkCache = async () => {
      const { loadFromCache } = useJiraDataStore.getState()
      const loaded = await loadFromCache()
      setCacheChecked(true)
    }
    checkCache()
  }, [])
  
  // Then auto-fetch data if we don't have any (after cache check)
  useEffect(() => {
    if (cacheChecked && !hasData && !isLoading && !error && !fetchAttempted) {
      setFetchAttempted(true)
      startDataFetch()
    }
  }, [hasData, isLoading, error, cacheChecked, fetchAttempted, startDataFetch])
  
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => startDataFetch()} startIcon={<RefreshIcon />}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      </Box>
    )
  }
  
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          Main Dashboard
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          {hasFailedDownloads && !isLoading && (
            <Button
              variant="outlined"
              color="warning"
              startIcon={<RefreshIcon />}
              onClick={retryFailed}
            >
              Retry Failed ({failedDownloads.length})
            </Button>
          )}
          
          <Box sx={{ position: 'relative', display: 'inline-block' }}>
            <Button
              variant="contained"
              startIcon={isLoading ? 
                <CircularProgress size={16} color="inherit" /> : 
                <RefreshIcon />
              }
              onClick={() => startDataFetch()}
              disabled={isLoading}
              sx={{ minWidth: 140 }}
            >
              {isLoading ? `${Math.round(overallProgress)}%` : 'Refresh Data'}
            </Button>
            
            {isLoading && (
              <LinearProgress
                variant="determinate"
                value={overallProgress}
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: 2,
                  borderRadius: 0
                }}
              />
            )}
          </Box>
        </Box>
      </Box>
      
      {/* Toast Notifications */}
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#333',
            color: '#fff',
          },
          success: {
            duration: 4000,
            iconTheme: {
              primary: '#4caf50',
              secondary: '#fff',
            },
          },
          error: {
            duration: 8000,
            iconTheme: {
              primary: '#f44336',
              secondary: '#fff',
            },
          },
        }}
      />
      
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Issues"
            value={isLoading && !hasData ? null : issues.length}
            icon={<StorageIcon />}
            color="primary"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Resolved Issues"
            value={isLoading && !hasData ? null : summary?.resolvedCount || 0}
            icon={<AssignmentIcon />}
            color="success"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Unresolved Issues"
            value={isLoading && !hasData ? null : summary?.unresolvedCount || 0}
            icon={<GroupIcon />}
            color="warning"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Projects"
            value={isLoading && !hasData ? null : summary?.projectCount || 0}
            icon={<BugReportIcon />}
            color="info"
          />
        </Grid>
        
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Top Projects by Issue Count
            </Typography>
            
            {isLoading && !hasData ? (
              <Box>
                <Skeleton height={40} />
                <Skeleton height={40} />
                <Skeleton height={40} />
              </Box>
            ) : (
              <Box>
                {summary?.projects?.slice(0, 10).map((project) => (
                  <Box
                    key={project.key}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      py: 1,
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Typography variant="body1">
                      {project.name} ({project.key})
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {project.issueCount.toLocaleString()} issues
                    </Typography>
                  </Box>
                )) || (
                  <Typography variant="body2" color="text.secondary">
                    No data available
                  </Typography>
                )}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
})

Dashboard.displayName = 'Dashboard'

export default Dashboard