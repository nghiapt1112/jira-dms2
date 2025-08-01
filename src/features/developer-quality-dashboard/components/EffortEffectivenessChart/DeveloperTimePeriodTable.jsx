/**
 * Developer Time Period Table Component
 * Shows detailed time period data for a selected developer based on current filters
 */

import React, { useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Card,
  CardContent,
  Box,
  Chip,
  Collapse,
  IconButton,
  TablePagination,
  Tooltip
} from '@mui/material'
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material'

const DeveloperTimePeriodTable = ({
  eeTimeBasedData = [],
  selectedDeveloper,
  timeframe = 'month'
}) => {
  const [expanded, setExpanded] = useState(true)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  // Sort data by period (most recent first)
  const sortedData = useMemo(() => {
    return [...eeTimeBasedData].sort((a, b) => b.period.localeCompare(a.period))
  }, [eeTimeBasedData])

  // Paginated data
  const paginatedData = useMemo(() => {
    const startIndex = page * rowsPerPage
    return sortedData.slice(startIndex, startIndex + rowsPerPage)
  }, [sortedData, page, rowsPerPage])

  const handleChangePage = (event, newPage) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  // Get efficiency rating color
  const getEfficiencyColor = (value, type) => {
    switch (type) {
      case 'ee':
        if (value >= 200) return 'success'
        if (value >= 100) return 'primary'
        if (value >= 50) return 'warning'
        return 'error'
      case 'quality':
        if (value >= 95) return 'success'
        if (value >= 85) return 'primary'
        if (value >= 70) return 'warning'
        return 'error'
      case 'spHour':
        if (value >= 2) return 'success'
        if (value >= 1) return 'primary'
        if (value >= 0.5) return 'warning'
        return 'error'
      default:
        return 'default'
    }
  }

  // Get rating text
  const getRatingText = (value, type) => {
    switch (type) {
      case 'ee':
        if (value >= 200) return 'Excellent'
        if (value >= 100) return 'Good'
        if (value >= 50) return 'Average'
        return 'Poor'
      case 'quality':
        if (value >= 95) return 'Excellent'
        if (value >= 85) return 'Good'
        if (value >= 70) return 'Average'
        return 'Poor'
      case 'spHour':
        if (value >= 2) return 'Excellent'
        if (value >= 1) return 'Good'
        if (value >= 0.5) return 'Average'
        return 'Poor'
      default:
        return 'N/A'
    }
  }

  if (!eeTimeBasedData || eeTimeBasedData.length === 0) {
    return (
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <TimelineIcon color="primary" />
            <Typography variant="h6">
              Time Period Analysis - {selectedDeveloper}
            </Typography>
          </Box>
          <Typography color="textSecondary">
            No time period data available for analysis
          </Typography>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card sx={{ mt: 3 }}>
      <CardContent>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TimelineIcon color="primary" />
            <Typography variant="h6">
              Time Period Analysis - {selectedDeveloper}
            </Typography>
            <Chip 
              label={`${sortedData.length} ${timeframe}s`} 
              size="small" 
              color="primary" 
              variant="outlined" 
            />
          </Box>
          <IconButton
            onClick={() => setExpanded(!expanded)}
            sx={{ transform: expanded ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.3s' }}
          >
            <ExpandMoreIcon />
          </IconButton>
        </Box>

        <Collapse in={expanded}>
          <TableContainer component={Paper} sx={{ maxHeight: 600, overflow: 'auto' }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', bgcolor: 'grey.50' }}>
                    {timeframe.charAt(0).toUpperCase() + timeframe.slice(1)} Period
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', bgcolor: 'grey.50' }}>
                    Issues
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', bgcolor: 'grey.50' }}>
                    Story Points
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', bgcolor: 'grey.50' }}>
                    Time (h)
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', bgcolor: 'grey.50' }}>
                    SP/Hour
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', bgcolor: 'grey.50' }}>
                    Bugs
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', bgcolor: 'grey.50' }}>
                    EE (%)
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', bgcolor: 'grey.50' }}>
                    EE Quality (%)
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', bgcolor: 'grey.50' }}>
                    Bug Rate (%)
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedData.map((row, index) => (
                  <TableRow 
                    key={row.period} 
                    sx={{ 
                      '&:nth-of-type(odd)': { bgcolor: 'grey.25' },
                      '&:hover': { bgcolor: 'action.hover' }
                    }}
                  >
                    <TableCell sx={{ fontWeight: 'medium' }}>
                      {row.period}
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title={`Total issues in this ${timeframe}`}>
                        <Chip 
                          label={row.totalIssues} 
                          size="small" 
                          color="default" 
                          variant="outlined"
                        />
                      </Tooltip>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Story points delivered">
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                          {row.storyPoints}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Total time spent">
                        <Typography variant="body2">
                          {row.timeSpent}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title={`Productivity: ${getRatingText(row.storyPointsPerHour, 'spHour')}`}>
                        <Chip 
                          label={row.storyPointsPerHour}
                          size="small"
                          color={getEfficiencyColor(row.storyPointsPerHour, 'spHour')}
                          variant="filled"
                        />
                      </Tooltip>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Number of bugs found">
                        <Chip 
                          label={row.bugs} 
                          size="small" 
                          color={row.bugs > 0 ? 'error' : 'success'} 
                          variant="outlined"
                        />
                      </Tooltip>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title={`Effort Efficiency: ${getRatingText(row.effortEfficiency, 'ee')}`}>
                        <Chip 
                          label={`${row.effortEfficiency}%`}
                          size="small"
                          color={getEfficiencyColor(row.effortEfficiency, 'ee')}
                          variant="filled"
                        />
                      </Tooltip>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title={`Code Quality: ${getRatingText(row.qualityEfficiency, 'quality')}`}>
                        <Chip 
                          label={`${row.qualityEfficiency}%`}
                          size="small"
                          color={getEfficiencyColor(row.qualityEfficiency, 'quality')}
                          variant="filled"
                        />
                      </Tooltip>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Weighted bug rate (severity-adjusted)">
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: row.weightedBugRate > 20 ? 'error.main' : 
                                   row.weightedBugRate > 10 ? 'warning.main' : 'success.main'
                          }}
                        >
                          {row.weightedBugRate}%
                        </Typography>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          <TablePagination
            component="div"
            count={sortedData.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25, 50]}
            sx={{ borderTop: 1, borderColor: 'divider' }}
          />

          {/* Summary */}
          <Box sx={{ mt: 2, p: 2, bgcolor: 'rgba(0, 0, 0, 0.02)', borderRadius: 1 }}>
            <Typography variant="body2" color="textSecondary">
              <strong>Period Summary:</strong> Showing {sortedData.length} {timeframe} periods for {selectedDeveloper}.{' '}
              Total: {sortedData.reduce((sum, row) => sum + row.storyPoints, 0)} story points,{' '}
              {Math.round(sortedData.reduce((sum, row) => sum + row.timeSpent, 0) * 100) / 100} hours,{' '}
              {sortedData.reduce((sum, row) => sum + row.bugs, 0)} bugs across{' '}
              {sortedData.reduce((sum, row) => sum + row.totalIssues, 0)} issues.
            </Typography>
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  )
}

DeveloperTimePeriodTable.propTypes = {
  eeTimeBasedData: PropTypes.arrayOf(PropTypes.shape({
    period: PropTypes.string.isRequired,
    storyPoints: PropTypes.number.isRequired,
    timeSpent: PropTypes.number.isRequired,
    bugs: PropTypes.number.isRequired,
    totalIssues: PropTypes.number.isRequired,
    effortEfficiency: PropTypes.number.isRequired,
    qualityEfficiency: PropTypes.number.isRequired,
    weightedBugRate: PropTypes.number.isRequired,
    storyPointsPerHour: PropTypes.number.isRequired
  })),
  selectedDeveloper: PropTypes.string.isRequired,
  timeframe: PropTypes.oneOf(['week', 'month', 'quarter'])
}

export default DeveloperTimePeriodTable