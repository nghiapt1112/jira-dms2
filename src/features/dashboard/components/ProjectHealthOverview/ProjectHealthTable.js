import React, { useState, useMemo, useCallback } from 'react'
import PropTypes from 'prop-types'
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  Chip,
  LinearProgress,
  Tooltip,
  IconButton,
  Switch,
  FormControlLabel,
  useTheme
} from '@mui/material'
import { Info as InfoIcon } from '@mui/icons-material'

const ProjectHealthTable = React.memo(({ 
  data, 
  title = 'Project Health Overview',
  onProjectClick,
  ...props 
}) => {
  const theme = useTheme()
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(15)
  const [orderBy, setOrderBy] = useState('healthScore')
  const [order, setOrder] = useState('desc')
  const [dense, setDense] = useState(false)

  const handleRequestSort = useCallback((property) => {
    const isAsc = orderBy === property && order === 'asc'
    setOrder(isAsc ? 'desc' : 'asc')
    setOrderBy(property)
  }, [order, orderBy])

  const handleChangePage = useCallback((event, newPage) => {
    setPage(newPage)
  }, [])

  const handleChangeRowsPerPage = useCallback((event) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }, [])

  const handleDenseChange = useCallback((event) => {
    setDense(event.target.checked)
  }, [])

  const sortedData = useMemo(() => {
    if (!data || data.length === 0) return []

    const comparator = (a, b) => {
      let aValue = a[orderBy]
      let bValue = b[orderBy]

      if (orderBy === 'name') {
        aValue = (aValue || '').toLowerCase()
        bValue = (bValue || '').toLowerCase()
      } else {
        aValue = aValue || 0
        bValue = bValue || 0
      }

      if (order === 'desc') {
        return bValue < aValue ? -1 : bValue > aValue ? 1 : 0
      }
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
    }

    return [...data].sort(comparator)
  }, [data, order, orderBy])

  const paginatedData = useMemo(() => {
    const start = page * rowsPerPage
    return sortedData.slice(start, start + rowsPerPage)
  }, [sortedData, page, rowsPerPage])

  const getQualityStatusColor = useCallback((status) => {
    switch (status?.toLowerCase()) {
      case 'excellent': return 'success'
      case 'good': return 'info'
      case 'satisfactory': return 'info'
      case 'needs improvement': return 'warning'
      case 'poor': return 'error'
      default: return 'default'
    }
  }, [])

  const getHealthStatusColor = useCallback((health) => {
    switch (health?.toLowerCase()) {
      case 'healthy': return 'success'
      case 'moderate': return 'info'
      case 'at risk': return 'warning'
      case 'critical': return 'error'
      default: return 'default'
    }
  }, [])

  const formatBugTooltip = useCallback((project) => {
    const severityBreakdown = project.severityBreakdown || {}
    const SEVERITY_WEIGHTS = {
      Critical: 1.0,
      Major: 0.7,
      Medium: 0.5,
      Low: 0.3,
      Lowest: 0.1
    }
    
    return (
      <Box>
        <Typography variant="caption" sx={{ display: 'block', fontWeight: 'bold', mb: 0.5 }}>
          Bug Severity Breakdown:
        </Typography>
        {Object.entries(SEVERITY_WEIGHTS).map(([severity, weight]) => {
          const count = severityBreakdown[severity] || 0
          if (count === 0) return null
          
          const getSeverityColor = (sev) => {
            switch (sev) {
              case 'Critical': return theme.palette.error.main
              case 'Major': return theme.palette.error.light
              case 'Medium': return theme.palette.warning.main
              case 'Low': return theme.palette.info.main
              case 'Lowest': return theme.palette.success.main
              default: return theme.palette.text.secondary
            }
          }
          
          return (
            <Typography 
              key={severity}
              variant="caption" 
              sx={{ 
                display: 'block', 
                color: getSeverityColor(severity),
                pl: 1
              }}
            >
              • {severity}: {count} bug{count > 1 ? 's' : ''} (weight: {weight.toFixed(1)})
            </Typography>
          )
        })}
        {Object.values(severityBreakdown).every(count => count === 0) && (
          <Typography variant="caption" sx={{ display: 'block', color: theme.palette.text.secondary, pl: 1 }}>
            No bugs found
          </Typography>
        )}
      </Box>
    )
  }, [theme])

  const TableHeaderCell = ({ property, label, numeric = false, sortable = true }) => (
    <TableCell
      align={numeric ? 'right' : 'left'}
      sortDirection={orderBy === property ? order : false}
      sx={{ fontWeight: 'bold' }}
    >
      {sortable ? (
        <TableSortLabel
          active={orderBy === property}
          direction={orderBy === property ? order : 'asc'}
          onClick={() => handleRequestSort(property)}
        >
          {label}
        </TableSortLabel>
      ) : (
        label
      )}
    </TableCell>
  )

  const handleRowClick = useCallback((project) => {
    if (onProjectClick) {
      onProjectClick(project.id || project.projectKey, project)
    }
  }, [onProjectClick])

  if (!data || data.length === 0) {
    return (
      <Paper elevation={1} sx={{ p: 2, width: '100%' }} {...props}>
        <Typography variant="h6">{title}</Typography>
        <Box sx={{ 
          minHeight: 200, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}>
          <Typography color="text.secondary">No project data available</Typography>
        </Box>
      </Paper>
    )
  }

  return (
    <Paper elevation={1} sx={{ p: 2, width: '100%' }} {...props}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 2,
        flexWrap: 'wrap',
        gap: 1
      }}>
        <Typography variant="h6">{title}</Typography>
        <FormControlLabel
          control={
            <Switch
              checked={dense}
              onChange={handleDenseChange}
              size="small"
            />
          }
          label="Dense padding"
        />
      </Box>

      <TableContainer>
        <Table size={dense ? 'small' : 'medium'}>
          <TableHead>
            <TableRow>
              <TableHeaderCell property="name" label="Project" />
              <TableHeaderCell 
                property="progress" 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    Progress
                    <Tooltip title="Progress = (Completed Issues / Total Issues) × 100" arrow>
                      <InfoIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                    </Tooltip>
                  </Box>
                } 
                numeric 
              />
              <TableHeaderCell property="totalIssues" label="Issues" numeric sortable={false} />
              <TableHeaderCell property="bugs" label="Total Bugs" numeric sortable={false} />
              <TableHeaderCell property="totalStoryPoints" label="Story Points" numeric />
              <TableHeaderCell 
                property="bugRate" 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    Bug Rate (%)
                    <Tooltip title="Weighted bug rate per 100 issues using severity weights: Critical(1.0), Major(0.7), Medium(0.5), Low(0.3), Minor(0.1)" arrow>
                      <InfoIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                    </Tooltip>
                  </Box>
                } 
                numeric 
              />
              <TableHeaderCell 
                property="qualityScore" 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    Quality Score
                    <Tooltip title="Quality Score = Math.max(1, 100 - weighted bug rate)" arrow>
                      <InfoIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                    </Tooltip>
                  </Box>
                } 
                numeric 
              />
              <TableHeaderCell property="qualityStatus" label="Quality Status" sortable={false} />
              <TableHeaderCell property="health" label="Health" sortable={false} />
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedData.map((project) => (
              <TableRow
                key={project.id || project.projectKey}
                hover
                onClick={() => handleRowClick(project)}
                sx={{ cursor: onProjectClick ? 'pointer' : 'default' }}
              >
                <TableCell>
                  <Tooltip title={project.name || project.projectKey}>
                    <Typography 
                      variant="body2" 
                      noWrap 
                      sx={{ maxWidth: 150 }}
                    >
                      {project.name || project.projectKey}
                    </Typography>
                  </Tooltip>
                </TableCell>

                <TableCell align="right">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(project.progress || 0, 100)}
                      sx={{ 
                        width: 60, 
                        height: 6,
                        borderRadius: 3
                      }}
                    />
                    <Typography variant="caption">
                      {(project.progress || 0).toFixed(0)}%
                    </Typography>
                  </Box>
                </TableCell>

                <TableCell align="right">
                  <Typography variant="body2">
                    {project.totalIssues || project.issues?.length || 0}
                  </Typography>
                </TableCell>

                <TableCell align="right">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2">
                      {project.bugs?.length || 0}
                    </Typography>
                    {(project.bugs?.length || 0) > 0 && (
                      <Tooltip title={formatBugTooltip(project)}>
                        <IconButton size="small">
                          <InfoIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </TableCell>

                <TableCell align="right">
                  <Typography variant="body2">
                    {project.totalStoryPoints || 0}
                  </Typography>
                </TableCell>

                <TableCell align="right">
                  <Tooltip title={`Bug Rate: ${(project.bugRate || 0).toFixed(2)}%`}>
                    <Typography 
                      variant="body2"
                      color={(project.bugRate || 0) > 10 ? 'error' : 'text.primary'}
                    >
                      {(project.bugRate || 0).toFixed(1)}%
                    </Typography>
                  </Tooltip>
                </TableCell>

                <TableCell align="right">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LinearProgress
                      variant="determinate"
                      value={project.qualityScore || 0}
                      color={
                        (project.qualityScore || 0) >= 80 ? 'success' :
                        (project.qualityScore || 0) >= 60 ? 'warning' : 'error'
                      }
                      sx={{ 
                        width: 60, 
                        height: 6,
                        borderRadius: 3
                      }}
                    />
                    <Tooltip title={`Quality Score: ${(project.qualityScore || 0).toFixed(2)}%`}>
                      <Typography variant="caption">
                        {(project.qualityScore || 0).toFixed(0)}%
                      </Typography>
                    </Tooltip>
                  </Box>
                </TableCell>

                <TableCell>
                  <Chip
                    label={project.qualityStatus || 'Unknown'}
                    color={getQualityStatusColor(project.qualityStatus)}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>

                <TableCell>
                  <Chip
                    label={project.health || 'Unknown'}
                    color={getHealthStatusColor(project.health)}
                    size="small"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={[5, 10, 15, 25, 50]}
        component="div"
        count={sortedData.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        sx={{
          [theme.breakpoints.down('sm')]: {
            '& .MuiTablePagination-spacer': {
              flex: 'none'
            },
            '& .MuiTablePagination-selectLabel': {
              fontSize: '0.75rem'
            },
            '& .MuiTablePagination-displayedRows': {
              fontSize: '0.75rem'
            }
          }
        }}
      />
    </Paper>
  )
})

ProjectHealthTable.propTypes = {
  data: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string,
    projectKey: PropTypes.string,
    name: PropTypes.string,
    progress: PropTypes.number,
    issues: PropTypes.array,
    bugs: PropTypes.array,
    totalStoryPoints: PropTypes.number,
    bugRate: PropTypes.number,
    qualityScore: PropTypes.number,
    qualityStatus: PropTypes.string,
    health: PropTypes.string,
    highSeverityBugs: PropTypes.number,
    severityBreakdown: PropTypes.shape({
      Critical: PropTypes.number,
      Major: PropTypes.number,
      Medium: PropTypes.number,
      Low: PropTypes.number,
      Lowest: PropTypes.number
    })
  })),
  title: PropTypes.string,
  onProjectClick: PropTypes.func
}

ProjectHealthTable.displayName = 'ProjectHealthTable'

export default ProjectHealthTable