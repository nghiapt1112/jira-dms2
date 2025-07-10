import React from 'react'
import PropTypes from 'prop-types'
import {
  Box,
  LinearProgress,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Chip,
  CircularProgress,
  Button,
  Collapse,
  IconButton,
  Alert
} from '@mui/material'
import {
  CloudDownload as DownloadIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Refresh as RefreshIcon,
  Cancel as CancelIcon
} from '@mui/icons-material'
import { s3DownloadService } from '../../services/s3DownloadService'

const DataLoadingProgress = React.memo(({ 
  isLoading = false,
  snapshots = [],
  downloadProgress = {},
  currentDownload = null,
  completedSnapshots = 0,
  totalSnapshots = 0,
  estimatedTotalRecords = 0,
  processedRecords = 0,
  error = null,
  onRetry = null,
  onCancel = null
}) => {
  const [expanded, setExpanded] = React.useState(true)
  
  const overallProgress = totalSnapshots > 0 
    ? (completedSnapshots / totalSnapshots) * 100 
    : 0
  
  const formatFileSize = React.useCallback((bytes) => {
    return s3DownloadService.formatFileSize(bytes)
  }, [])
  
  const formatNumber = React.useCallback((num) => {
    return num?.toLocaleString() || '0'
  }, [])
  
  const toggleExpanded = React.useCallback(() => {
    setExpanded(prev => !prev)
  }, [])
  
  if (!isLoading && !error && completedSnapshots === 0) return null
  
  const isComplete = !isLoading && !error && completedSnapshots === totalSnapshots
  
  return (
    <Card elevation={2} sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {isLoading && <CircularProgress size={20} sx={{ mr: 2 }} />}
            {isComplete && <CheckIcon color="success" sx={{ mr: 2 }} />}
            {error && <ErrorIcon color="error" sx={{ mr: 2 }} />}
            
            <Typography variant="h6">
              {error ? 'Download Error' : 
               isComplete ? 'Download Complete' : 
               'Downloading JIRA Data'}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {isLoading && onCancel && (
              <Button
                size="small"
                startIcon={<CancelIcon />}
                onClick={onCancel}
                color="error"
                variant="outlined"
              >
                Cancel
              </Button>
            )}
            
            {error && onRetry && (
              <Button
                size="small"
                startIcon={<RefreshIcon />}
                onClick={onRetry}
                variant="outlined"
              >
                Retry
              </Button>
            )}
            
            <IconButton size="small" onClick={toggleExpanded}>
              {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Collapse in={expanded}>
          {(isLoading || isComplete) && (
            <>
              {/* Overall Progress */}
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">
                    Overall Progress ({completedSnapshots}/{totalSnapshots} files)
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {Math.round(overallProgress)}%
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={overallProgress} 
                  sx={{ height: 8, borderRadius: 4 }}
                  color={isComplete ? 'success' : 'primary'}
                />
              </Box>
              
              {/* Current Download */}
              {currentDownload && isLoading && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Currently downloading: <strong>{currentDownload}</strong>
                  </Typography>
                </Box>
              )}
              
              {/* Records Progress */}
              {(estimatedTotalRecords > 0 || processedRecords > 0) && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    Records processed: <strong>{formatNumber(processedRecords)}</strong>
                    {estimatedTotalRecords > 0 && ` / ${formatNumber(estimatedTotalRecords)}`}
                  </Typography>
                </Box>
              )}
              
              {/* Snapshot List */}
              {snapshots && snapshots.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Quarterly Snapshots
                  </Typography>
                  <List dense>
                    {snapshots.map((snapshot, index) => {
                      const progress = downloadProgress[snapshot.url] || { percent: 0 }
                      const isCompleted = progress.percent === 100
                      const isInProgress = progress.percent > 0 && progress.percent < 100
                      const isCurrent = currentDownload === `Q${snapshot.quarter} ${snapshot.year}`
                      
                      return (
                        <ListItem 
                          key={`${snapshot.year}-Q${snapshot.quarter}`} 
                          sx={{ 
                            px: 1,
                            bgcolor: isCurrent ? 'action.hover' : 'transparent',
                            borderRadius: 1
                          }}
                        >
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography variant="body2">
                                    Q{snapshot.quarter} {snapshot.year}
                                  </Typography>
                                  
                                  {isCompleted && (
                                    <Chip 
                                      label="Complete" 
                                      size="small" 
                                      color="success" 
                                      variant="outlined"
                                    />
                                  )}
                                  
                                  {isInProgress && (
                                    <Chip 
                                      label={`${progress.percent}%`} 
                                      size="small" 
                                      color="primary" 
                                      variant="outlined"
                                    />
                                  )}
                                </Box>
                                
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography variant="caption" color="text.secondary">
                                    {formatNumber(snapshot.recordCount)} records
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    "
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {formatFileSize(snapshot.fileSize)}
                                  </Typography>
                                  
                                  {isCompleted && <CheckIcon color="success" fontSize="small" />}
                                  {isCurrent && isInProgress && <DownloadIcon color="primary" fontSize="small" />}
                                </Box>
                              </Box>
                            }
                            secondary={
                              isInProgress && (
                                <Box sx={{ mt: 1 }}>
                                  <LinearProgress 
                                    variant="determinate" 
                                    value={progress.percent} 
                                    sx={{ height: 4, borderRadius: 2 }}
                                  />
                                  {progress.loaded && progress.total && (
                                    <Typography variant="caption" color="text.secondary">
                                      {formatFileSize(progress.loaded)} / {formatFileSize(progress.total)}
                                    </Typography>
                                  )}
                                </Box>
                              )
                            }
                          />
                        </ListItem>
                      )
                    })}
                  </List>
                </Box>
              )}
              
              {/* Summary when complete */}
              {isComplete && processedRecords > 0 && (
                <Box sx={{ mt: 2, p: 2, bgcolor: 'success.lighter', borderRadius: 1 }}>
                  <Typography variant="body2" color="success.dark">
                    Successfully loaded {formatNumber(processedRecords)} unique JIRA issues
                  </Typography>
                </Box>
              )}
            </>
          )}
        </Collapse>
      </CardContent>
    </Card>
  )
})

DataLoadingProgress.propTypes = {
  isLoading: PropTypes.bool,
  snapshots: PropTypes.arrayOf(PropTypes.shape({
    year: PropTypes.number,
    quarter: PropTypes.number,
    url: PropTypes.string,
    recordCount: PropTypes.number,
    fileSize: PropTypes.number
  })),
  downloadProgress: PropTypes.object,
  currentDownload: PropTypes.string,
  completedSnapshots: PropTypes.number,
  totalSnapshots: PropTypes.number,
  estimatedTotalRecords: PropTypes.number,
  processedRecords: PropTypes.number,
  error: PropTypes.string,
  onRetry: PropTypes.func,
  onCancel: PropTypes.func
}


DataLoadingProgress.displayName = 'DataLoadingProgress'

export default DataLoadingProgress