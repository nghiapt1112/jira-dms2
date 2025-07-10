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
  Skeleton
} from '@mui/material'
import {
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  Storage as StorageIcon,
  Assignment as AssignmentIcon,
  Group as GroupIcon,
  BugReport as BugReportIcon
} from '@mui/icons-material'
import { useJiraData } from '../features/jira-data/hooks/useJiraData'
import DataLoadingProgress from '../features/jira-data/components/DataLoadingProgress'
import LoadingIndicator from '../components/ui/LoadingIndicator'

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
    issues,
    isLoading,
    error,
    snapshots,
    downloadProgress,
    currentDownload,
    completedSnapshots,
    totalSnapshots,
    estimatedTotalRecords,
    processedRecords,
    hasData,
    fetchData,
    refreshData,
    getDataSummary
  } = useJiraData()
  
  const summary = getDataSummary()
  
  // Auto-fetch data if we don't have any
  useEffect(() => {
    if (!hasData && !isLoading && !error) {
      fetchData()
    }
  }, [hasData, isLoading, error, fetchData])
  
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={refreshData} startIcon={<RefreshIcon />}>
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
        
        <Button
          variant="contained"
          startIcon={<RefreshIcon />}
          onClick={refreshData}
          disabled={isLoading}
        >
          Refresh Data
        </Button>
      </Box>
      
      {/* Data Loading Progress */}
      <DataLoadingProgress
        isLoading={isLoading}
        snapshots={snapshots}
        downloadProgress={downloadProgress}
        currentDownload={currentDownload}
        completedSnapshots={completedSnapshots}
        totalSnapshots={totalSnapshots}
        estimatedTotalRecords={estimatedTotalRecords}
        processedRecords={processedRecords}
        error={error}
        onRetry={refreshData}
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