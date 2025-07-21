import React, { useState, useMemo, useCallback } from 'react'
import PropTypes from 'prop-types'
import { getSeverityConfig, memberConfiguration } from '../../../../constants/memberConfiguration'
import { getSeverityColor } from '../../../../shared/constants/severityConstants.js'
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  Chip,
  IconButton,
  Tooltip,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material'
import {
  Assessment as AnalysisIcon,
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  Person as PersonIcon
} from '@mui/icons-material'

// Severity weights for consistent calculation across dashboards
const SEVERITY_WEIGHTS = {
  Critical: 1.0,
  Major: 0.7,
  Minor: 0.5,
  Low: 0.3,
  Cosmetic: 0.1,
  Unknown: 0.2
}

const BugRateAnalysisTable = React.memo(({ 
  data, 
  onRowClick, 
  title = 'Bug Rate Analysis',
  rowsPerPageOptions = [5, 10, 25],
  useWeightedCalculation = false, // New prop for calculation mode
  onCalculationModeChange = null  // New prop for mode change callback
}) => {
  // 1. Hooks first
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [orderBy, setOrderBy] = useState('bugRate')
  const [order, setOrder] = useState('desc')
  const [internalWeightedMode, setInternalWeightedMode] = useState(useWeightedCalculation)
  
  // Helper function to parse bug severity using configurable parsing logic
  const parseBugSeverity = useCallback((bug, projectKey = null) => {
    const severityConfig = getSeverityConfig(projectKey)
    const { severityField, usePriorityFallback, severityMapping } = severityConfig
    
    let severityValue = null
    if (severityField && bug.fields?.[severityField]) {
      const customFieldValue = bug.fields[severityField]
      severityValue = typeof customFieldValue === 'object' ? customFieldValue.value : customFieldValue
    }
    
    if (!severityValue && usePriorityFallback && bug.fields?.priority?.name) {
      severityValue = bug.fields.priority.name
    }
    
    return (severityValue && severityMapping[severityValue]) ? severityMapping[severityValue] : 'Unknown'
  }, [])
  
  // Calculate weighted bug rate for a developer
  const calculateWeightedBugRate = useCallback((developer) => {
    if (!developer.severityBreakdown || developer.totalIssues === 0) return 0
    
    const weightedBugCount = Object.entries(developer.severityBreakdown)
      .reduce((total, [severity, count]) => {
        const weight = SEVERITY_WEIGHTS[severity] || SEVERITY_WEIGHTS.Unknown
        return total + (count * weight)
      }, 0)
    
    return (weightedBugCount / developer.totalIssues) * 100
  }, [])
  
  // Determine which calculation mode to use
  const currentCalculationMode = useWeightedCalculation || internalWeightedMode
  
  // 2. Memoized values
  const columns = useMemo(() => {
    // EXISTING COLUMNS with tooltips explaining calculations
    const currentColumns = [
      { 
        id: 'developer', 
        label: 'Developer', 
        sortable: true, 
        align: 'left',
        tooltip: 'Name of the developer/team member'
      },
      { 
        id: 'totalIssues', 
        label: 'Total Issues', 
        sortable: true, 
        align: 'right',
        tooltip: 'Total number of issues (bugs + stories + tasks) assigned to this developer'
      },
      { 
        id: 'bugs', 
        label: 'Bugs', 
        sortable: true, 
        align: 'right',
        tooltip: 'Total number of bug-type issues assigned to this developer'
      },
      { 
        id: 'bugRate', 
        label: currentCalculationMode ? 'Weighted Bug Rate (%)' : 'Bug Rate (%)', 
        sortable: true, 
        align: 'right',
        tooltip: currentCalculationMode ? 
          `Severity-weighted bug rate using configurable weights. Formula: (Σ(severity_weight × count) ÷ Total Issues) × 100.
          Weights: Critical(1.0), Major(0.7), Minor(0.5), Low(0.3), Cosmetic(0.1), Unknown(0.2)` :
          'Simple percentage of bug issues vs total issues. Formula: (Bugs ÷ Total Issues) × 100'
      },
      { 
        id: 'trend', 
        label: 'Trend', 
        sortable: true, 
        align: 'center',
        tooltip: 'Bug rate trend over time: Improving (↓), Stable (→), or Declining (↑)'
      },
      { 
        id: 'projects', 
        label: 'Projects', 
        sortable: false, 
        align: 'left',
        tooltip: 'List of projects this developer has worked on'
      },
      { 
        id: 'performance', 
        label: 'Performance', 
        sortable: false, 
        align: 'center',
        tooltip: 'Performance rating based on bug rate benchmarks: Excellent (<10%), Good (10-15%), Needs Improvement (>15%)'
      }
    ]
    
    // NEW COLUMNS with detailed calculation tooltips
    const newColumns = [
      { 
        id: 'qualityEfficiency', 
        label: 'Quality Efficiency (%)', 
        sortable: true, 
        align: 'right',
        tooltip: 'Quality efficiency score based on weighted bug rate. Formula: Math.max(0, 100 - weighted_bug_rate). Higher % indicates better quality.'
      },
      { 
        id: 'reopenRate', 
        label: 'Reopen Rate (%)', 
        sortable: true, 
        align: 'right',
        tooltip: 'Percentage of bugs that were reopened after being resolved. Formula: (Reopened Bugs ÷ Total Bugs) × 100'
      },
      { 
        id: 'avgResolutionTime', 
        label: 'Avg Resolution (hrs)', 
        sortable: true, 
        align: 'right',
        tooltip: 'Average time in hours from bug creation to resolution. Only includes resolved bugs with valid timestamps.'
      },
      { 
        id: 'timeEfficiency', 
        label: 'Efficiency (%)', 
        sortable: true, 
        align: 'right',
        tooltip: 'Time efficiency score based on resolution speed vs complexity. Higher % indicates faster resolution relative to issue complexity.'
      },
            {
        id: 'severityMix', 
        label: 'Bug Severity Breakdown', 
        sortable: false, 
        align: 'left',
        tooltip: 'Complete breakdown of bugs by severity level (Critical, Major, Minor, Low, Cosmetic). Shows count per severity with color coding.'
      },
      { 
        id: 'topRootCause', 
        label: 'Top Root Cause', 
        sortable: false, 
        align: 'left',
        tooltip: 'Most frequent root cause category for this developer\'s bugs, with occurrence count'
      }
    ]
    
    // TIME TRACKING COLUMNS with calculation explanations
    const timeTrackingColumns = [
      { 
        id: 'totalTimeSpent', 
        label: 'Total Time (hrs)', 
        sortable: true, 
        align: 'right',
        tooltip: 'Total logged time in hours across all issues. Based on JIRA time tracking data.'
      },
      { 
        id: 'timePerStoryPoint', 
        label: 'Time/SP (hrs)', 
        sortable: true, 
        align: 'right',
        tooltip: 'Average hours spent per story point. Formula: Total Time ÷ Total Story Points. Lower is more efficient.'
      },
      { 
        id: 'estimationAccuracy', 
        label: 'Estimation Accuracy (%)', 
        sortable: true, 
        align: 'right',
        tooltip: 'How accurate time estimates are vs actual time spent. 100% = perfect accuracy, >100% = over-estimated, <100% = under-estimated.'
      },
      { 
        id: 'timeTrackingEfficiency', 
        label: 'Time Efficiency', 
        sortable: false, 
        align: 'center',
        tooltip: 'Overall time efficiency rating: Efficient (≤4h/SP), Average (4-8h/SP), Slow (>8h/SP)'
      }
    ]
    
    // EXTENDED COLUMNS - INHERITS ALL + ADDS NEW
    return [...currentColumns, ...newColumns, ...timeTrackingColumns]
  }, [])
  
  const enhancedDevelopers = useMemo(() => {
    if (!data || !data.developers) return []
    
    return data.developers.map(developer => {
      const weightedBugRate = calculateWeightedBugRate(developer)
      const qualityEfficiency = Math.max(0, 100 - weightedBugRate)
      
      return {
        ...developer,
        weightedBugRate,
        qualityEfficiency,
        // Use weighted rate if in weighted mode, otherwise simple rate
        displayBugRate: currentCalculationMode ? weightedBugRate : developer.bugRate
      }
    })
  }, [data, calculateWeightedBugRate, currentCalculationMode])
  
  const sortedData = useMemo(() => {
    if (!enhancedDevelopers || enhancedDevelopers.length === 0) return []
    
    const sorted = [...enhancedDevelopers].sort((a, b) => {
      let aValue = orderBy === 'bugRate' ? a.displayBugRate : a[orderBy]
      let bValue = orderBy === 'bugRate' ? b.displayBugRate : b[orderBy]
      
      // Handle special cases
      if (orderBy === 'trend') {
        const trendOrder = { 'improving': 1, 'stable': 2, 'declining': 3 }
        aValue = trendOrder[aValue] || 2
        bValue = trendOrder[bValue] || 2
      }
      
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase()
        bValue = bValue.toLowerCase()
      }
      
      if (order === 'desc') {
        return bValue > aValue ? 1 : bValue < aValue ? -1 : 0
      }
      return aValue > bValue ? 1 : aValue < bValue ? -1 : 0
    })
    
    return sorted
  }, [enhancedDevelopers, orderBy, order])
  
  const paginatedData = useMemo(() => {
    const startIndex = page * rowsPerPage
    return sortedData.slice(startIndex, startIndex + rowsPerPage)
  }, [sortedData, page, rowsPerPage])
  
  const getBugRateColor = useMemo(() => (bugRate, benchmarks) => {
    if (!benchmarks) return 'default'
    
    const excellent = parseFloat(benchmarks.excellent.replace('<', '').replace('%', ''))
    const good = parseFloat(benchmarks.good.split('-')[1].replace('%', ''))
    
    if (bugRate < excellent) return 'success'
    if (bugRate <= good) return 'warning'
    return 'error'
  }, [])
  
  const getTrendIcon = useMemo(() => (trend) => {
    switch (trend) {
      case 'improving':
        return (
          <Tooltip title="Improving">
            <TrendingDown sx={{ fontSize: 20, color: 'success.main' }} />
          </Tooltip>
        )
      case 'declining':
        return (
          <Tooltip title="Declining">
            <TrendingUp sx={{ fontSize: 20, color: 'error.main' }} />
          </Tooltip>
        )
      default:
        return (
          <Tooltip title="Stable">
            <TrendingFlat sx={{ fontSize: 20, color: 'text.secondary' }} />
          </Tooltip>
        )
    }
  }, [])
  
  const getPerformanceLabel = useMemo(() => (bugRate, benchmarks) => {
    if (!benchmarks) return 'Unknown'
    
    const excellent = parseFloat(benchmarks.excellent.replace('<', '').replace('%', ''))
    const good = parseFloat(benchmarks.good.split('-')[1].replace('%', ''))
    
    if (bugRate < excellent) return 'Excellent'
    if (bugRate <= good) return 'Good'
    return 'Needs Improvement'
  }, [])
  
  // NEW HELPER FUNCTIONS (appended safely)
  const getReopenRateColor = useMemo(() => (reopenRate) => {
    if (reopenRate <= 5) return 'success'
    if (reopenRate <= 10) return 'warning'
    if (reopenRate <= 15) return 'error'
    return 'error'
  }, [])
  
  const getEfficiencyColor = useMemo(() => (efficiency) => {
    if (efficiency >= 80) return 'success'
    if (efficiency >= 60) return 'warning'
    if (efficiency >= 40) return 'error'
    return 'error'
  }, [])
  
  // Using centralized getSeverityColor from severityConstants.js
  
  // NEW TIME TRACKING HELPER FUNCTIONS (appended safely)
  const getTimeEfficiencyColor = useMemo(() => (timePerStoryPoint) => {
    if (!timePerStoryPoint) return 'default'
    if (timePerStoryPoint <= 4) return 'success'  // <= 4 hours per SP
    if (timePerStoryPoint <= 8) return 'warning'  // <= 8 hours per SP
    return 'error'  // > 8 hours per SP
  }, [])
  
  const getEstimationAccuracyColor = useMemo(() => (accuracy) => {
    if (!accuracy) return 'default'
    if (accuracy >= 80 && accuracy <= 120) return 'success'  // 80-120% accurate
    if (accuracy >= 60 && accuracy <= 140) return 'warning'  // 60-140% accurate
    return 'error'  // < 60% or > 140% accurate
  }, [])
  
  const getTimeEfficiencyLabel = useMemo(() => (timePerStoryPoint) => {
    if (!timePerStoryPoint) return 'No Data'
    if (timePerStoryPoint <= 4) return 'Efficient'
    if (timePerStoryPoint <= 8) return 'Average'
    return 'Slow'
  }, [])
  
  // Helper function for quality efficiency color
  const getQualityEfficiencyColor = useMemo(() => (efficiency) => {
    if (efficiency >= 85) return 'success'
    if (efficiency >= 70) return 'warning'
    if (efficiency >= 50) return 'error'
    return 'error'
  }, [])
  
  // 3. Callbacks
  const handleRequestSort = useCallback((property) => {
    const isAsc = orderBy === property && order === 'asc'
    setOrder(isAsc ? 'desc' : 'asc')
    setOrderBy(property)
  }, [orderBy, order])
  
  const handleChangePage = useCallback((event, newPage) => {
    setPage(newPage)
  }, [])
  
  const handleChangeRowsPerPage = useCallback((event) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }, [])
  
  const handleRowClick = useCallback((developer) => {
    if (onRowClick) {
      onRowClick(developer)
    }
  }, [onRowClick])
  
  const handleCalculationModeToggle = useCallback((event, newMode) => {
    if (newMode !== null) {
      const isWeighted = newMode === 'weighted'
      setInternalWeightedMode(isWeighted)
      if (onCalculationModeChange) {
        onCalculationModeChange(isWeighted)
      }
    }
  }, [onCalculationModeChange])
  
  // 4. Early returns
  if (!data || !data.developers || data.developers.length === 0) {
    return (
      <Paper 
        elevation={1} 
        sx={{ 
          p: { xs: 1, sm: 2 }, 
          width: '100%',
          backgroundColor: 'background.paper'
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          mb: 2 
        }}>
          <AnalysisIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6">{title}</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          No bug rate analysis data available
        </Typography>
      </Paper>
    )
  }
  
  // 5. Render
  return (
    <Paper 
      elevation={1} 
      sx={{ 
        width: '100%',
        backgroundColor: 'background.paper'
      }}
    >
      <Box sx={{ 
        p: { xs: 1, sm: 2 },
        display: 'flex', 
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 1
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <AnalysisIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography 
            variant="h6"
            sx={{ 
              fontSize: { xs: '1rem', sm: '1.25rem' }
            }}
          >
            {title}
          </Typography>
        </Box>
        
        {/* Calculation Mode Toggle */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center',
          gap: { xs: 1, sm: 2 },
          flexWrap: 'wrap'
        }}>
          <ToggleButtonGroup
            value={currentCalculationMode ? 'weighted' : 'simple'}
            exclusive
            onChange={handleCalculationModeToggle}
            aria-label="calculation mode"
            size="small"
          >
            <ToggleButton value="simple" aria-label="simple calculation">
              Simple
            </ToggleButton>
            <ToggleButton value="weighted" aria-label="weighted calculation">
              Weighted
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
        
        {/* Summary Stats */}
        <Box sx={{ 
          display: 'flex', 
          gap: { xs: 1, sm: 2 },
          flexWrap: 'wrap'
        }}>
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
          >
            Team Average: {data.teamAverage?.toFixed(1)}%
          </Typography>
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
          >
            Total Developers: {data.developers.length}
          </Typography>
        </Box>
      </Box>
      
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  align={column.align}
                  sx={{ 
                    fontWeight: 'bold',
                    backgroundColor: 'grey.50'
                  }}
                >
                  {column.tooltip ? (
                    <Tooltip 
                      title={column.tooltip}
                      placement="top"
                      arrow
                    >
                      <Box sx={{ cursor: 'help' }}>
                        {column.sortable ? (
                          <TableSortLabel
                            active={orderBy === column.id}
                            direction={orderBy === column.id ? order : 'asc'}
                            onClick={() => handleRequestSort(column.id)}
                          >
                            {column.label}
                          </TableSortLabel>
                        ) : (
                          column.label
                        )}
                      </Box>
                    </Tooltip>
                  ) : (
                    <>
                      {column.sortable ? (
                        <TableSortLabel
                          active={orderBy === column.id}
                          direction={orderBy === column.id ? order : 'asc'}
                          onClick={() => handleRequestSort(column.id)}
                        >
                          {column.label}
                        </TableSortLabel>
                      ) : (
                        column.label
                      )}
                    </>
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedData.map((row) => (
              <TableRow
                key={row.developer}
                hover
                sx={{ 
                  cursor: onRowClick ? 'pointer' : 'default',
                  '&:hover': onRowClick ? { backgroundColor: 'action.hover' } : {}
                }}
                onClick={() => handleRowClick(row.developer)}
              >
                <TableCell align="left">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PersonIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography 
                      variant="body2"
                      sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                    >
                      {row.developer}
                    </Typography>
                  </Box>
                </TableCell>
                
                <TableCell align="right">
                  <Typography 
                    variant="body2"
                    sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                  >
                    {row.totalIssues}
                  </Typography>
                </TableCell>
                
                <TableCell align="right">
                  <Typography 
                    variant="body2"
                    sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                  >
                    {row.bugs}
                  </Typography>
                </TableCell>
                
                <TableCell align="right">
                  <Chip
                    label={`${(row.displayBugRate || 0).toFixed(1)}%`}
                    size="small"
                    color={getBugRateColor(row.displayBugRate || 0, data.benchmarks)}
                    variant="outlined"
                  />
                  {currentCalculationMode && (
                    <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 0.5 }}>
                      Simple: {(row.bugRate || 0).toFixed(1)}%
                    </Typography>
                  )}
                </TableCell>
                
                <TableCell align="center">
                  {getTrendIcon(row.trend)}
                </TableCell>
                
                <TableCell align="left">
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {(row.projects || []).slice(0, 2).map((project) => (
                      <Chip
                        key={project}
                        label={project}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.75rem' }}
                      />
                    ))}
                    {(row.projects || []).length > 2 && (
                      <Chip
                        label={`+${row.projects.length - 2}`}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.75rem' }}
                      />
                    )}
                  </Box>
                </TableCell>
                
                <TableCell align="center">
                  <Chip
                    label={getPerformanceLabel(row.bugRate, data.benchmarks)}
                    size="small"
                    color={getBugRateColor(row.bugRate, data.benchmarks)}
                    sx={{ fontSize: '0.75rem' }}
                  />
                </TableCell>
                
                {/* NEW COLUMNS - APPENDED SAFELY */}
                <TableCell align="right">
                  <Chip
                    label={`${(row.qualityEfficiency || 0).toFixed(1)}%`}
                    size="small"
                    color={getQualityEfficiencyColor(row.qualityEfficiency || 0)}
                  />
                  {currentCalculationMode && (
                    <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 0.5 }}>
                      Weighted: {(row.weightedBugRate || 0).toFixed(1)}%
                    </Typography>
                  )}
                </TableCell>
                
                <TableCell align="right">
                  <Chip
                    label={`${(row.reopenRate || 0).toFixed(1)}%`}
                    size="small"
                    color={getReopenRateColor(row.reopenRate || 0)}
                    variant="outlined"
                  />
                </TableCell>
                
                <TableCell align="right">
                  <Typography 
                    variant="body2"
                    sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                  >
                    {row.avgResolutionTimeHours ? `${row.avgResolutionTimeHours.toFixed(1)}h` : 'N/A'}
                  </Typography>
                  {row.overdueCount > 0 && (
                    <Chip
                      label={`${row.overdueCount} overdue`}
                      size="small"
                      color="warning"
                      variant="outlined"
                      sx={{ fontSize: '0.6rem', mt: 0.5 }}
                    />
                  )}
                </TableCell>
                
                <TableCell align="right">
                  <Chip
                    label={`${row.timeEfficiency || 0}%`}
                    size="small"
                    color={getEfficiencyColor(row.timeEfficiency || 0)}
                    variant="outlined"
                  />
                </TableCell>
                
                <TableCell align="left" sx={{ maxWidth: 180 }}>
                  {row.severityBreakdown ? (() => {
                    const severities = memberConfiguration.severities || ['Critical', 'Major', 'Minor', 'Low', 'Cosmetic']
                    const severityChips = severities
                      .filter(severity => row.severityBreakdown[severity] > 0)
                      .map(severity => `${severity}: ${row.severityBreakdown[severity]}`)
                    
                    if (severityChips.length === 0) {
                      return (
                        <Typography 
                          variant="body2"
                          color="text.secondary"
                          sx={{ fontSize: '0.75rem' }}
                        >
                          No bugs
                        </Typography>
                      )
                    }
                    
                    const fullText = severityChips.join(', ')
                    const visibleChips = severityChips.slice(0, 2)
                    const hiddenCount = severityChips.length - 2
                    
                    return (
                      <Tooltip 
                        title={
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                              Bug Severity Breakdown
                            </Typography>
                            {severities.map(severity => (
                              <Box key={severity} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                <Typography variant="body2" sx={{ mr: 2 }}>
                                  {severity}:
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                  {row.severityBreakdown[severity] || 0}
                                </Typography>
                              </Box>
                            ))}
                            <Box sx={{ mt: 1, pt: 1, borderTop: 1, borderColor: 'divider' }}>
                              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                Total: {Object.values(row.severityBreakdown).reduce((sum, count) => sum + count, 0)} bugs
                              </Typography>
                            </Box>
                          </Box>
                        }
                        placement="top"
                        arrow
                      >
                        <Box 
                          sx={{ 
                            display: 'flex', 
                            flexWrap: 'wrap', 
                            gap: 0.5,
                            cursor: 'help',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {visibleChips.map((chipText, index) => {
                            const [severity, count] = chipText.split(': ')
                            return (
                              <Chip
                                key={severity}
                                label={chipText}
                                size="small"
                                color={getSeverityColor(severity)}
                                variant="outlined"
                                sx={{ 
                                  fontSize: '0.6rem',
                                  maxWidth: 80,
                                  '& .MuiChip-label': {
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                  }
                                }}
                              />
                            )
                          })}
                          {hiddenCount > 0 && (
                            <Chip
                              label={`+${hiddenCount} more`}
                              size="small"
                              variant="outlined"
                              sx={{ 
                                fontSize: '0.6rem',
                                backgroundColor: 'action.hover'
                              }}
                            />
                          )}
                        </Box>
                      </Tooltip>
                    )
                  })() : (
                    <Typography 
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontSize: '0.75rem' }}
                    >
                      N/A
                    </Typography>
                  )}
                </TableCell>
                
                <TableCell align="left">
                  {row.topRootCause ? (
                    <Chip
                      label={`${row.topRootCause.cause} (${row.topRootCause.count})`}
                      size="small"
                      color="default"
                      variant="outlined"
                      sx={{ fontSize: '0.6rem' }}
                    />
                  ) : (
                    <Typography 
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontSize: '0.6rem' }}
                    >
                      N/A
                    </Typography>
                  )}
                </TableCell>
                
                {/* NEW TIME TRACKING COLUMNS - APPENDED SAFELY */}
                <TableCell align="right">
                  <Typography 
                    variant="body2"
                    sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                  >
                    {row.totalTimeSpentHours ? `${row.totalTimeSpentHours.toFixed(1)}h` : '0h'}
                  </Typography>
                </TableCell>
                
                <TableCell align="right">
                  <Chip
                    label={row.timePerStoryPoint ? `${row.timePerStoryPoint.toFixed(1)}h/SP` : 'N/A'}
                    size="small"
                    color={getTimeEfficiencyColor(row.timePerStoryPoint)}
                    variant="outlined"
                  />
                </TableCell>
                
                <TableCell align="right">
                  <Chip
                    label={row.averageEstimationAccuracy ? 
                      `${row.averageEstimationAccuracy.toFixed(0)}%` : 'N/A'}
                    size="small"
                    color={getEstimationAccuracyColor(row.averageEstimationAccuracy)}
                    variant="outlined"
                  />
                </TableCell>
                
                <TableCell align="center">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip
                      label={getTimeEfficiencyLabel(row.timePerStoryPoint)}
                      size="small"
                      color={getTimeEfficiencyColor(row.timePerStoryPoint)}
                      sx={{ fontSize: '0.6rem' }}
                    />
                    {row.weeklyTimeData && row.weeklyTimeData.length > 0 && (
                      <Tooltip title={`Weekly time tracking: ${row.weeklyTimeData.length} weeks`}>
                        <IconButton size="small">
                          <TrendingUp fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      
      <TablePagination
        rowsPerPageOptions={rowsPerPageOptions}
        component="div"
        count={sortedData.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        sx={{
          borderTop: 1,
          borderColor: 'divider',
          backgroundColor: 'grey.50'
        }}
      />
      
      {/* Benchmarks Legend */}
      <Box sx={{ 
        p: { xs: 1, sm: 2 },
        borderTop: 1,
        borderColor: 'divider',
        backgroundColor: 'background.default'
      }}>
        <Typography 
          variant="caption" 
          color="text.secondary"
          sx={{ 
            display: 'block',
            mb: 1,
            fontSize: { xs: '0.7rem', sm: '0.75rem' }
          }}
        >
          Performance Benchmarks:
        </Typography>
        <Box sx={{ 
          display: 'flex', 
          gap: { xs: 1, sm: 2 },
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          <Typography 
            variant="caption" 
            color="text.secondary"
            sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' }, fontWeight: 'bold' }}
          >
            Mode: {currentCalculationMode ? 'Weighted (Severity-based)' : 'Simple (Count-based)'}
          </Typography>
          {data.benchmarks && Object.entries(data.benchmarks).map(([key, value]) => (
            <Typography 
              key={key}
              variant="caption" 
              color="text.secondary"
              sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
            >
              {key}: {value}
            </Typography>
          ))}
        </Box>
      </Box>
    </Paper>
  )
})

// ✅ REQUIRED: PropTypes
BugRateAnalysisTable.propTypes = {
  data: PropTypes.shape({
    developers: PropTypes.arrayOf(PropTypes.shape({
      developer: PropTypes.string.isRequired,
      totalIssues: PropTypes.number.isRequired,
      bugs: PropTypes.number.isRequired,
      bugRate: PropTypes.number.isRequired,
      trend: PropTypes.oneOf(['improving', 'stable', 'declining']),
      projects: PropTypes.arrayOf(PropTypes.string),
      severityBreakdown: PropTypes.object
    })),
    teamAverage: PropTypes.number,
    benchmarks: PropTypes.shape({
      excellent: PropTypes.string,
      good: PropTypes.string,
      needsImprovement: PropTypes.string
    })
  }),
  onRowClick: PropTypes.func,
  title: PropTypes.string,
  rowsPerPageOptions: PropTypes.arrayOf(PropTypes.number),
  useWeightedCalculation: PropTypes.bool,
  onCalculationModeChange: PropTypes.func
}

export default BugRateAnalysisTable 