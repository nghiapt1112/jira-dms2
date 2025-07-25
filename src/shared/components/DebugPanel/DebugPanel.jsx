import React, { useState, useCallback, useMemo } from 'react'
import PropTypes from 'prop-types'
import {
  Drawer,
  Box,
  Typography,
  Button,
  IconButton,
  Divider,
  Card,
  CardContent,
  CardActions,
  LinearProgress,
  Alert,
  Chip,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  useTheme,
  alpha
} from '@mui/material'
import {
  Close as CloseIcon,
  BugReport as BugReportIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon
} from '@mui/icons-material'
import { useDebugStore } from '../../store/debugStore'
import toast from 'react-hot-toast'

const DebugPanel = React.memo(() => {
  const theme = useTheme()
  const [exportResult, setExportResult] = useState(null)
  const [refreshResult, setRefreshResult] = useState(null)

  const {
    isOpen,
    isExporting,
    isRefreshing,
    refreshProgress,
    refreshStage,
    error,
    lastExport,
    lastRefresh,
    close,
    clearError,
    exportLogs,
    refreshData,
    getSummary
  } = useDebugStore()

  const summary = getSummary()

  // Memoized status icon helper (performance optimization)
  const getStatusIcon = useCallback((hasError, isLoading, lastAction) => {
    if (hasError) return <ErrorIcon color="error" />
    if (isLoading) return <WarningIcon color="warning" />
    if (lastAction) return <CheckCircleIcon color="success" />
    return <InfoIcon color="info" />
  }, [])

  // Memoized timestamp formatter (performance optimization)
  const formatTimestamp = useCallback((timestamp) => {
    if (!timestamp) return 'Never'
    return new Date(timestamp).toLocaleString()
  }, [])

  // Memoized debug info (performance optimization)
  const debugInfo = useMemo(() => ({
    browser: navigator.userAgent.split(' ').slice(-2).join(' '),
    url: window.location.pathname,
    memory: window.performance?.memory 
      ? `${Math.round(window.performance.memory.usedJSMemory / 1024 / 1024)}MB`
      : 'N/A',
    timestamp: new Date().toLocaleTimeString()
  }), [])

  // Export Logs Handler
  const handleExportLogs = useCallback(async () => {
    try {
      setExportResult(null)
      const result = await exportLogs()
      setExportResult(result)
      toast.success(`Logs exported successfully! (${result.logCount} entries)`, {
        duration: 4000,
        position: 'bottom-right'
      })
    } catch (error) {
      toast.error(`Export failed: ${error.message}`, {
        duration: 5000,
        position: 'bottom-right'
      })
    }
  }, [exportLogs])

  // Fresh Data Handler
  const handleRefreshData = useCallback(async () => {
    try {
      setRefreshResult(null)
      const result = await refreshData()
      setRefreshResult(result)
      toast.success(`Data refreshed successfully! (${result.totalIssues} issues from ${result.snapshots} snapshots)`, {
        duration: 4000,
        position: 'bottom-right'
      })
    } catch (error) {
      toast.error(`Refresh failed: ${error.message}`, {
        duration: 5000,
        position: 'bottom-right'
      })
    }
  }, [refreshData])

  return (
    <Drawer
      anchor="right"
      open={isOpen}
      onClose={close}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 480, md: 520 },
          bgcolor: 'background.default'
        }
      }}
    >
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box sx={{ 
          p: 2, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          bgcolor: 'primary.main',
          color: 'primary.contrastText'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BugReportIcon />
            <Typography variant="h6" component="h2">
              Debug Panel
            </Typography>
          </Box>
          <IconButton 
            onClick={close} 
            size="small"
            sx={{ color: 'inherit' }}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Content */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
          
          {/* Error Alert */}
          {error && (
            <Alert 
              severity="error" 
              sx={{ mb: 2 }}
              action={
                <IconButton size="small" onClick={clearError}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              }
            >
              {error}
            </Alert>
          )}

          {/* Status Overview */}
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Debug Status
              </Typography>
              
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    {getStatusIcon(!!error, isExporting, lastExport)}
                  </ListItemIcon>
                  <ListItemText 
                    primary="Export Logs" 
                    secondary={`Last: ${formatTimestamp(lastExport)}`}
                  />
                  <Chip 
                    label={isExporting ? 'Exporting...' : 'Ready'} 
                    color={isExporting ? 'warning' : 'default'}
                    size="small"
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    {getStatusIcon(!!error, isRefreshing, lastRefresh)}
                  </ListItemIcon>
                  <ListItemText 
                    primary="Fresh Data" 
                    secondary={`Last: ${formatTimestamp(lastRefresh)}`}
                  />
                  <Chip 
                    label={isRefreshing ? 'Refreshing...' : 'Ready'} 
                    color={isRefreshing ? 'warning' : 'default'}
                    size="small"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>

          {/* Export Logs Section */}
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <DownloadIcon color="primary" />
                Export Debug Logs
              </Typography>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Download comprehensive debug information including console logs, app state, performance data, and storage contents.
              </Typography>

              {exportResult && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    <strong>Exported:</strong> {exportResult.filename}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Log entries:</strong> {exportResult.logCount}
                  </Typography>
                </Alert>
              )}
            </CardContent>
            
            <CardActions>
              <Button
                variant="contained"
                onClick={handleExportLogs}
                disabled={isExporting}
                startIcon={isExporting ? <LinearProgress size={16} /> : <DownloadIcon />}
                fullWidth
              >
                {isExporting ? 'Exporting...' : 'Export Logs'}
              </Button>
            </CardActions>
          </Card>

          {/* Fresh Data Section */}
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <RefreshIcon color="primary" />
                Fresh Data Refresh
              </Typography>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Force refresh all data from /issues/v3 API. This will clear cache, download new snapshots, process data, and update all stores.
              </Typography>

              {isRefreshing && (
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">{refreshStage}</Typography>
                    <Typography variant="body2">{Math.round(refreshProgress)}%</Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={refreshProgress} 
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>
              )}

              {refreshResult && !isRefreshing && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    <strong>Total Issues:</strong> {refreshResult.totalIssues.toLocaleString()}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Snapshots:</strong> {refreshResult.snapshots}
                  </Typography>
                </Alert>
              )}
            </CardContent>
            
            <CardActions>
              <Button
                variant="contained"
                color="warning"
                onClick={handleRefreshData}
                disabled={isRefreshing}
                startIcon={<RefreshIcon />}
                fullWidth
              >
                {isRefreshing ? 'Refreshing...' : 'Fresh Data'}
              </Button>
            </CardActions>
          </Card>

          {/* Debug Info */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Debug Information
              </Typography>
              
              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Browser:
                  </Typography>
                  <Typography variant="body2">
                    {navigator.userAgent.split(' ').slice(-2).join(' ')}
                  </Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    URL:
                  </Typography>
                  <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                    {window.location.pathname}
                  </Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Memory:
                  </Typography>
                  <Typography variant="body2">
                    {window.performance?.memory 
                      ? `${Math.round(window.performance.memory.usedJSMemory / 1024 / 1024)}MB`
                      : 'N/A'
                    }
                  </Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Timestamp:
                  </Typography>
                  <Typography variant="body2">
                    {new Date().toLocaleTimeString()}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Console Access Info */}
          <Box sx={{ mt: 2, p: 2, bgcolor: alpha(theme.palette.info.main, 0.1), borderRadius: 1 }}>
            <Typography variant="body2" color="info.main" sx={{ fontWeight: 600, mb: 1 }}>
              💡 Console Access
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
              window.debugStore.getState().exportLogs()<br/>
              window.debugStore.getState().refreshData()
            </Typography>
          </Box>
        </Box>
      </Box>
    </Drawer>
  )
})

DebugPanel.propTypes = {
  // No props expected for this component
}

DebugPanel.displayName = 'DebugPanel'

export default DebugPanel