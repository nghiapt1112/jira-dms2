import React, { useState, useMemo, useCallback } from 'react'
import PropTypes from 'prop-types'
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
  Tooltip
} from '@mui/material'
import {
  Assessment as AnalysisIcon,
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  Person as PersonIcon
} from '@mui/icons-material'

const BugRateAnalysisTable = React.memo(({ 
  data, 
  onRowClick, 
  title = 'Bug Rate Analysis',
  rowsPerPageOptions = [5, 10, 25]
}) => {
  // 1. Hooks first
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [orderBy, setOrderBy] = useState('bugRate')
  const [order, setOrder] = useState('desc')
  
  // 2. Memoized values
  const columns = useMemo(() => [
    { id: 'developer', label: 'Developer', sortable: true, align: 'left' },
    { id: 'totalIssues', label: 'Total Issues', sortable: true, align: 'right' },
    { id: 'bugs', label: 'Bugs', sortable: true, align: 'right' },
    { id: 'bugRate', label: 'Bug Rate (%)', sortable: true, align: 'right' },
    { id: 'trend', label: 'Trend', sortable: true, align: 'center' },
    { id: 'projects', label: 'Projects', sortable: false, align: 'left' },
    { id: 'performance', label: 'Performance', sortable: false, align: 'center' }
  ], [])
  
  const sortedData = useMemo(() => {
    if (!data || !data.developers) return []
    
    const sorted = [...data.developers].sort((a, b) => {
      let aValue = a[orderBy]
      let bValue = b[orderBy]
      
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
  }, [data, orderBy, order])
  
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
                    label={`${(row.bugRate || 0).toFixed(1)}%`}
                    size="small"
                    color={getBugRateColor(row.bugRate || 0, data.benchmarks)}
                    variant="outlined"
                  />
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
          flexWrap: 'wrap'
        }}>
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
      projects: PropTypes.arrayOf(PropTypes.string)
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
  rowsPerPageOptions: PropTypes.arrayOf(PropTypes.number)
}

export default BugRateAnalysisTable 