import React, { useState, useMemo, useCallback } from 'react'
import PropTypes from 'prop-types'
import {
  Box,
  Typography,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Chip,
  Alert,
  LinearProgress,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  useTheme
} from '@mui/material'
import {
  ExpandMore as ExpandMoreIcon,
  Speed as SpeedIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material'

const CachePerformanceMonitor = React.memo(({
  cacheHook,
  title = 'Cache Performance Monitor',
  defaultExpanded = false,
  showDetailedMetrics = true,
  performanceTarget = 10,
  ...props
}) => {
  const theme = useTheme()
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const {
    performanceMetrics,
    cacheStatus,
    isProcessing
  } = cacheHook

  const performanceAnalysis = useMemo(() => {
    if (!performanceMetrics) {
      return {
        overall: 'unknown',
        hitRateGrade: 'N/A',
        speedGrade: 'N/A',
        recommendations: []
      }
    }

    const hitRate = performanceMetrics.hitRate || 0
    const avgResponseTime = performanceMetrics.avgResponseTime || 0
    const isPerformant = performanceMetrics.isPerformant || false

    // Grade hit rate
    let hitRateGrade = 'F'
    if (hitRate >= 90) hitRateGrade = 'A+'
    else if (hitRate >= 80) hitRateGrade = 'A'
    else if (hitRate >= 70) hitRateGrade = 'B'
    else if (hitRate >= 60) hitRateGrade = 'C'
    else if (hitRate >= 50) hitRateGrade = 'D'

    // Grade speed
    let speedGrade = 'F'
    if (avgResponseTime <= 5) speedGrade = 'A+'
    else if (avgResponseTime <= 10) speedGrade = 'A'
    else if (avgResponseTime <= 25) speedGrade = 'B'
    else if (avgResponseTime <= 50) speedGrade = 'C'
    else if (avgResponseTime <= 100) speedGrade = 'D'

    // Overall performance
    let overall = 'poor'
    if (isPerformant && hitRate >= 80) overall = 'excellent'
    else if (isPerformant && hitRate >= 60) overall = 'good'
    else if (avgResponseTime <= performanceTarget) overall = 'fair'

    // Generate recommendations
    const recommendations = []
    if (hitRate < 70) {
      recommendations.push('Low cache hit rate - consider adjusting cache expiry time')
    }
    if (avgResponseTime > performanceTarget * 2) {
      recommendations.push('High response times - review data transformation efficiency')
    }
    if (performanceMetrics.cacheSize > 10) {
      recommendations.push('Large cache size - consider implementing cache cleanup')
    }
    if (performanceMetrics.totalRequests < 10) {
      recommendations.push('Limited usage data - metrics will improve with more interactions')
    }

    return {
      overall,
      hitRateGrade,
      speedGrade,
      recommendations
    }
  }, [performanceMetrics, performanceTarget])

  const getPerformanceColor = useCallback((value, thresholds) => {
    const { excellent, good, fair } = thresholds
    if (value >= excellent) return theme.palette.success.main
    if (value >= good) return theme.palette.info.main
    if (value >= fair) return theme.palette.warning.main
    return theme.palette.error.main
  }, [theme])

  const getGradeColor = useCallback((grade) => {
    switch (grade) {
      case 'A+':
      case 'A': return 'success'
      case 'B': return 'info'
      case 'C': return 'warning'
      case 'D':
      case 'F': return 'error'
      default: return 'default'
    }
  }, [])

  const formatDuration = useCallback((ms) => {
    if (ms < 1000) return `${ms.toFixed(1)}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }, [])

  const handleRefreshMetrics = useCallback(() => {
    setRefreshTrigger(prev => prev + 1)
  }, [])

  const getMetricsHistory = useCallback(() => {
    // This would typically come from persistent storage
    // For now, we'll simulate some historical data
    return [
      { timestamp: Date.now() - 300000, hitRate: performanceMetrics?.hitRate || 0, responseTime: performanceMetrics?.avgResponseTime || 0 },
      { timestamp: Date.now() - 240000, hitRate: (performanceMetrics?.hitRate || 0) + 5, responseTime: (performanceMetrics?.avgResponseTime || 0) - 2 },
      { timestamp: Date.now() - 180000, hitRate: (performanceMetrics?.hitRate || 0) - 3, responseTime: (performanceMetrics?.avgResponseTime || 0) + 1 },
      { timestamp: Date.now() - 120000, hitRate: (performanceMetrics?.hitRate || 0) + 2, responseTime: (performanceMetrics?.avgResponseTime || 0) - 1 },
      { timestamp: Date.now() - 60000, hitRate: (performanceMetrics?.hitRate || 0) - 1, responseTime: (performanceMetrics?.avgResponseTime || 0) + 0.5 },
      { timestamp: Date.now(), hitRate: performanceMetrics?.hitRate || 0, responseTime: performanceMetrics?.avgResponseTime || 0 }
    ]
  }, [performanceMetrics])

  if (!cacheHook) {
    return (
      <Paper elevation={1} sx={{ p: 2 }} {...props}>
        <Alert severity="warning">
          Cache hook not provided to CachePerformanceMonitor
        </Alert>
      </Paper>
    )
  }

  if (!performanceMetrics) {
    return (
      <Paper elevation={1} sx={{ width: '100%' }} {...props}>
        <Accordion defaultExpanded={defaultExpanded}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <SpeedIcon color="primary" />
            <Typography variant="h6" sx={{ ml: 1 }}>{title}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Alert severity="info">
              No performance metrics available yet. Interact with the dashboard to generate metrics.
            </Alert>
          </AccordionDetails>
        </Accordion>
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
          <SpeedIcon color="primary" />
          <Typography variant="h6">{title}</Typography>
          <Chip 
            label={performanceAnalysis.overall}
            size="small"
            color={
              performanceAnalysis.overall === 'excellent' ? 'success' :
              performanceAnalysis.overall === 'good' ? 'info' :
              performanceAnalysis.overall === 'fair' ? 'warning' : 'error'
            }
          />
          {isProcessing && <Chip label="Processing..." size="small" color="primary" />}
        </AccordionSummary>

        <AccordionDetails>
          {/* Performance Overview */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle2">
                Performance Overview
              </Typography>
              <Tooltip title="Refresh metrics">
                <IconButton size="small" onClick={handleRefreshMetrics}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            </Box>
            
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: theme.palette.background.default }}>
                  <Typography variant="h4" color="primary">
                    {performanceMetrics.hitRate?.toFixed(1) || '0.0'}%
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    Cache Hit Rate
                  </Typography>
                  <Chip 
                    label={`Grade: ${performanceAnalysis.hitRateGrade}`}
                    size="small"
                    color={getGradeColor(performanceAnalysis.hitRateGrade)}
                    sx={{ mt: 1 }}
                  />
                </Paper>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: theme.palette.background.default }}>
                  <Typography variant="h4" color="secondary">
                    {formatDuration(performanceMetrics.avgResponseTime || 0)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    Avg Response Time
                  </Typography>
                  <Chip 
                    label={`Grade: ${performanceAnalysis.speedGrade}`}
                    size="small"
                    color={getGradeColor(performanceAnalysis.speedGrade)}
                    sx={{ mt: 1 }}
                  />
                </Paper>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: theme.palette.background.default }}>
                  <Typography variant="h4" color="info.main">
                    {performanceMetrics.totalRequests || 0}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    Total Requests
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5, mt: 1 }}>
                    <Chip label={`Hits: ${performanceMetrics.hits || 0}`} size="small" color="success" />
                    <Chip label={`Misses: ${performanceMetrics.misses || 0}`} size="small" color="error" />
                  </Box>
                </Paper>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: theme.palette.background.default }}>
                  <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
                    {performanceMetrics.isPerformant ? (
                      <CheckCircleIcon color="success" sx={{ fontSize: 32 }} />
                    ) : (
                      <WarningIcon color="warning" sx={{ fontSize: 32 }} />
                    )}
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    Performance Target
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    {performanceMetrics.isPerformant ? 'Met' : 'Not Met'}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Box>

          {/* Performance Progress Bars */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Performance Indicators
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Cache Hit Rate</Typography>
                <Typography variant="body2" color="text.secondary">
                  {performanceMetrics.hitRate?.toFixed(1) || 0}% / 90% target
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={Math.min(performanceMetrics.hitRate || 0, 100)}
                color={performanceMetrics.hitRate >= 80 ? 'success' : performanceMetrics.hitRate >= 60 ? 'warning' : 'error'}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
            
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Response Time Performance</Typography>
                <Typography variant="body2" color="text.secondary">
                  {formatDuration(performanceMetrics.avgResponseTime || 0)} / {formatDuration(performanceTarget)} target
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={Math.min(100 - ((performanceMetrics.avgResponseTime || 0) / (performanceTarget * 2)) * 100, 100)}
                color={
                  (performanceMetrics.avgResponseTime || 0) <= performanceTarget ? 'success' :
                  (performanceMetrics.avgResponseTime || 0) <= performanceTarget * 2 ? 'warning' : 'error'
                }
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
          </Box>

          {/* Detailed Metrics Table */}
          {showDetailedMetrics && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Detailed Metrics
              </Typography>
              <TableContainer component={Paper} sx={{ backgroundColor: theme.palette.background.default }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Metric</TableCell>
                      <TableCell align="right">Current Value</TableCell>
                      <TableCell align="right">Target</TableCell>
                      <TableCell align="center">Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>Cache Hit Rate</TableCell>
                      <TableCell align="right">{performanceMetrics.hitRate?.toFixed(1) || 0}%</TableCell>
                      <TableCell align="right">≥80%</TableCell>
                      <TableCell align="center">
                        {(performanceMetrics.hitRate || 0) >= 80 ? (
                          <CheckCircleIcon color="success" fontSize="small" />
                        ) : (
                          <WarningIcon color="warning" fontSize="small" />
                        )}
                      </TableCell>
                    </TableRow>
                    
                    <TableRow>
                      <TableCell>Average Response Time</TableCell>
                      <TableCell align="right">{formatDuration(performanceMetrics.avgResponseTime || 0)}</TableCell>
                      <TableCell align="right">≤{formatDuration(performanceTarget)}</TableCell>
                      <TableCell align="center">
                        {(performanceMetrics.avgResponseTime || 0) <= performanceTarget ? (
                          <CheckCircleIcon color="success" fontSize="small" />
                        ) : (
                          <ErrorIcon color="error" fontSize="small" />
                        )}
                      </TableCell>
                    </TableRow>
                    
                    <TableRow>
                      <TableCell>Cache Size</TableCell>
                      <TableCell align="right">{performanceMetrics.cacheSize || 0} entries</TableCell>
                      <TableCell align="right">≤10 entries</TableCell>
                      <TableCell align="center">
                        {(performanceMetrics.cacheSize || 0) <= 10 ? (
                          <CheckCircleIcon color="success" fontSize="small" />
                        ) : (
                          <WarningIcon color="warning" fontSize="small" />
                        )}
                      </TableCell>
                    </TableRow>
                    
                    <TableRow>
                      <TableCell>Last Processing Time</TableCell>
                      <TableCell align="right">
                        {performanceMetrics.lastProcessingTime 
                          ? formatDuration(performanceMetrics.lastProcessingTime)
                          : 'N/A'
                        }
                      </TableCell>
                      <TableCell align="right">≤3000ms</TableCell>
                      <TableCell align="center">
                        {!performanceMetrics.lastProcessingTime || performanceMetrics.lastProcessingTime <= 3000 ? (
                          <CheckCircleIcon color="success" fontSize="small" />
                        ) : (
                          <WarningIcon color="warning" fontSize="small" />
                        )}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* Recommendations */}
          {performanceAnalysis.recommendations.length > 0 && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Performance Recommendations
              </Typography>
              {performanceAnalysis.recommendations.map((recommendation, index) => (
                <Alert key={index} severity="info" sx={{ mb: 1 }}>
                  {recommendation}
                </Alert>
              ))}
            </Box>
          )}

          {/* Performance Summary */}
          <Alert 
            severity={
              performanceAnalysis.overall === 'excellent' ? 'success' :
              performanceAnalysis.overall === 'good' ? 'info' :
              performanceAnalysis.overall === 'fair' ? 'warning' : 'error'
            }
            sx={{ mt: 2 }}
          >
            <Typography variant="body2">
              <strong>Performance Summary:</strong> {
                performanceAnalysis.overall === 'excellent' 
                  ? 'Cache is performing excellently with optimal hit rates and response times.'
                  : performanceAnalysis.overall === 'good'
                  ? 'Cache performance is good with minor optimization opportunities.'
                  : performanceAnalysis.overall === 'fair'
                  ? 'Cache performance is fair but could benefit from optimization.'
                  : 'Cache performance needs improvement. Consider reviewing cache strategy.'
              }
            </Typography>
          </Alert>
        </AccordionDetails>
      </Accordion>
    </Paper>
  )
})

CachePerformanceMonitor.propTypes = {
  cacheHook: PropTypes.shape({
    performanceMetrics: PropTypes.object,
    cacheStatus: PropTypes.object,
    isProcessing: PropTypes.bool
  }).isRequired,
  title: PropTypes.string,
  defaultExpanded: PropTypes.bool,
  showDetailedMetrics: PropTypes.bool,
  performanceTarget: PropTypes.number
}

CachePerformanceMonitor.displayName = 'CachePerformanceMonitor'

export default CachePerformanceMonitor