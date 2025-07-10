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
import { useJiraData } from '../shared/hooks/useJiraData'
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
    allIssues,
    isLoading,
    error,
    downloadProgress,
    refetchData,
    getIssueStats,
    totalRecords
  } = useJiraData(true)
  
  const stats = getIssueStats()
  
  const getDownloadProgressMessage = () => {
    const progressEntries = Object.entries(downloadProgress)
    if (progressEntries.length === 0) return null
    
    const totalProgress = progressEntries.reduce((sum, [_, progress]) => sum + progress, 0) / progressEntries.length
    return `Downloading data: ${Math.round(totalProgress)}%`
  }
  
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={refetchData} startIcon={<RefreshIcon />}>
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
          onClick={refetchData}
          disabled={isLoading}
        >
          Refresh Data
        </Button>
      </Box>
      
      {isLoading && Object.keys(downloadProgress).length > 0 && (
        <Box sx={{ mb: 3 }}>
          <LoadingIndicator
            type="linear"
            progress={Object.values(downloadProgress).reduce((a, b) => a + b, 0) / Object.keys(downloadProgress).length}
            message={getDownloadProgressMessage()}
          />
        </Box>
      )}
      
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Issues"
            value={isLoading && totalRecords === 0 ? null : totalRecords}
            icon={<StorageIcon />}
            color="primary"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Open Issues"
            value={isLoading && totalRecords === 0 ? null : stats.byStatus['Open'] || 0}
            icon={<AssignmentIcon />}
            color="warning"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="In Progress"
            value={isLoading && totalRecords === 0 ? null : stats.byStatus['In Progress'] || 0}
            icon={<GroupIcon />}
            color="info"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Bugs"
            value={isLoading && totalRecords === 0 ? null : stats.byType['Bug'] || 0}
            icon={<BugReportIcon />}
            color="error"
          />
        </Grid>
        
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Project Distribution
            </Typography>
            
            {isLoading && totalRecords === 0 ? (
              <Box>
                <Skeleton height={40} />
                <Skeleton height={40} />
                <Skeleton height={40} />
              </Box>
            ) : (
              <Box>
                {Object.entries(stats.byProject).slice(0, 10).map(([project, count]) => (
                  <Box
                    key={project}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      py: 1,
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Typography variant="body1">{project}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {count.toLocaleString()} issues
                    </Typography>
                  </Box>
                ))}
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