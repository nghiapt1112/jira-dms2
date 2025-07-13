import React, { useState, useCallback } from 'react'
import PropTypes from 'prop-types'
import {
  Box,
  Typography,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  Grid,
  Chip,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme
} from '@mui/material'
import {
  ExpandMore as ExpandMoreIcon,
  Delete as DeleteIcon,
  DeleteSweep as DeleteSweepIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
  Storage as StorageIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material'

const CacheManager = React.memo(({
  cacheHook,
  title = 'Cache Management',
  defaultExpanded = false,
  showDebugInfo = false,
  ...props
}) => {
  const theme = useTheme()
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    type: null,
    cacheKey: null
  })

  const {
    cacheKey: currentCacheKey,
    performanceMetrics,
    cacheStatus,
    clearCache,
    getCacheStatus
  } = cacheHook

  const handleClearAll = useCallback(() => {
    setConfirmDialog({
      open: true,
      type: 'clear_all',
      cacheKey: null
    })
  }, [])

  const handleClearSpecific = useCallback((key) => {
    setConfirmDialog({
      open: true,
      type: 'clear_specific',
      cacheKey: key
    })
  }, [])

  const handleConfirmAction = useCallback(() => {
    const { type, cacheKey } = confirmDialog
    
    if (type === 'clear_all') {
      clearCache()
    } else if (type === 'clear_specific' && cacheKey) {
      clearCache(cacheKey)
    }
    
    setConfirmDialog({ open: false, type: null, cacheKey: null })
  }, [confirmDialog, clearCache])

  const handleCancelAction = useCallback(() => {
    setConfirmDialog({ open: false, type: null, cacheKey: null })
  }, [])

  const formatBytes = useCallback((bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }, [])

  const formatTime = useCallback((timestamp) => {
    if (!timestamp) return 'Never'
    return new Date(timestamp).toLocaleString()
  }, [])

  const getStatusColor = useCallback((status) => {
    switch (status) {
      case 'valid': return 'success'
      case 'expired': return 'warning'
      case 'empty': return 'default'
      default: return 'default'
    }
  }, [])

  const getCacheEntries = useCallback(() => {
    if (!performanceMetrics.cacheKeys) return []
    
    return performanceMetrics.cacheKeys.map(key => {
      const status = key === currentCacheKey ? cacheStatus : getCacheStatus()
      return {
        key,
        status: status.status || 'unknown',
        age: status.age || 0,
        expiresIn: status.expiresIn || 0,
        isCurrent: key === currentCacheKey
      }
    })
  }, [performanceMetrics.cacheKeys, currentCacheKey, cacheStatus, getCacheStatus])

  if (!cacheHook) {
    return (
      <Paper elevation={1} sx={{ p: 2 }} {...props}>
        <Alert severity="warning">
          Cache hook not provided to CacheManager
        </Alert>
      </Paper>
    )
  }

  return (
    <Paper elevation={1} sx={{ width: '100%' }} {...props}>
      <Accordion defaultExpanded={defaultExpanded}>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          sx={{ 
            backgroundColor: theme.palette.background.default,
            '& .MuiAccordionSummary-content': {
              alignItems: 'center',
              gap: 2
            }
          }}
        >
          <StorageIcon color="primary" />
          <Typography variant="h6">{title}</Typography>
          <Chip 
            label={`${performanceMetrics.cacheSize || 0} entries`}
            size="small"
            color="primary"
            variant="outlined"
          />
          <Chip 
            label={cacheStatus.status || 'unknown'}
            size="small"
            color={getStatusColor(cacheStatus.status)}
          />
        </AccordionSummary>

        <AccordionDetails>
          {/* Cache Actions */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Cache Actions
            </Typography>
            <Grid container spacing={2}>
              <Grid item>
                <Button
                  variant="outlined"
                  startIcon={<DeleteSweepIcon />}
                  onClick={handleClearAll}
                  color="error"
                  size="small"
                  disabled={performanceMetrics.cacheSize === 0}
                >
                  Clear All Cache
                </Button>
              </Grid>
              <Grid item>
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={() => window.location.reload()}
                  size="small"
                >
                  Force Refresh
                </Button>
              </Grid>
            </Grid>
          </Box>

          {/* Current Cache Status */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Current Cache Status
            </Typography>
            <Paper sx={{ p: 2, backgroundColor: theme.palette.background.default }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" color="primary">
                      {currentCacheKey ? currentCacheKey.split('_').pop() : 'None'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Active Cache Key
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" color={getStatusColor(cacheStatus.status)}>
                      {cacheStatus.status || 'Unknown'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Cache Status
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" color="info.main">
                      {cacheStatus.age ? Math.round(cacheStatus.age / (1000 * 60)) : 0}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Age (minutes)
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" color="warning.main">
                      {cacheStatus.expiresIn ? Math.round(cacheStatus.expiresIn / (1000 * 60)) : 0}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Expires In (minutes)
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Box>

          {/* Cache Entries Table */}
          {getCacheEntries().length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Cache Entries
              </Typography>
              <TableContainer component={Paper} sx={{ backgroundColor: theme.palette.background.default }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Cache Key</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Age (min)</TableCell>
                      <TableCell align="right">Expires In (min)</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {getCacheEntries().map((entry) => (
                      <TableRow 
                        key={entry.key}
                        sx={{ 
                          backgroundColor: entry.isCurrent 
                            ? theme.palette.action.selected 
                            : 'inherit'
                        }}
                      >
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                              {entry.key.length > 30 
                                ? `...${entry.key.slice(-30)}` 
                                : entry.key
                              }
                            </Typography>
                            {entry.isCurrent && (
                              <Chip label="Current" size="small" color="primary" />
                            )}
                          </Box>
                        </TableCell>
                        
                        <TableCell>
                          <Chip 
                            label={entry.status}
                            size="small"
                            color={getStatusColor(entry.status)}
                          />
                        </TableCell>
                        
                        <TableCell align="right">
                          {Math.round(entry.age / (1000 * 60))}
                        </TableCell>
                        
                        <TableCell align="right">
                          {entry.expiresIn > 0 
                            ? Math.round(entry.expiresIn / (1000 * 60))
                            : 'Expired'
                          }
                        </TableCell>
                        
                        <TableCell align="center">
                          <Tooltip title="Clear this cache entry">
                            <IconButton 
                              size="small"
                              onClick={() => handleClearSpecific(entry.key)}
                              color="error"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* Debug Information */}
          {showDebugInfo && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Debug Information
              </Typography>
              <Paper sx={{ p: 2, backgroundColor: theme.palette.grey[50] }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      Last Clear Time:
                    </Typography>
                    <Typography variant="body2">
                      {formatTime(performanceMetrics.lastClearTime)}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      Cache Implementation:
                    </Typography>
                    <Typography variant="body2">
                      JavaScript Map with metadata
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      Cache Key Pattern:
                    </Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                      main_dashboard_cache_[project_selection_hash]
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            </Box>
          )}

          {/* Cache Management Tips */}
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Cache Tips:</strong> Cache entries expire after 6 hours. 
              Clear cache if you notice stale data or after significant project updates.
            </Typography>
          </Alert>
        </AccordionDetails>
      </Accordion>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={handleCancelAction}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <InfoIcon color="warning" />
            Confirm Cache Action
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <Typography>
            {confirmDialog.type === 'clear_all' 
              ? 'Are you sure you want to clear all cache entries? This will force a complete data reload on the next dashboard access.'
              : `Are you sure you want to clear the cache entry "${confirmDialog.cacheKey}"?`
            }
          </Typography>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleCancelAction} color="primary">
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmAction} 
            color="error" 
            variant="contained"
            startIcon={<DeleteIcon />}
          >
            {confirmDialog.type === 'clear_all' ? 'Clear All' : 'Clear Entry'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  )
})

CacheManager.propTypes = {
  cacheHook: PropTypes.shape({
    cacheKey: PropTypes.string,
    performanceMetrics: PropTypes.object,
    cacheStatus: PropTypes.object,
    clearCache: PropTypes.func,
    getCacheStatus: PropTypes.func
  }).isRequired,
  title: PropTypes.string,
  defaultExpanded: PropTypes.bool,
  showDebugInfo: PropTypes.bool
}

CacheManager.displayName = 'CacheManager'

export default CacheManager