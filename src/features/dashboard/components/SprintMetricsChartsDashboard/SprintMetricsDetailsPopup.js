import React, { useState, useMemo, useCallback } from 'react'
import PropTypes from 'prop-types'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  Chip,
  IconButton,
  Link,
  Box,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useTheme
} from '@mui/material'
import {
  Close as CloseIcon,
  OpenInNew as OpenInNewIcon,
  Search as SearchIcon
} from '@mui/icons-material'
import { sprintMetricsDetailsService } from '../../services/sprintMetricsDetails.service'

const SprintMetricsDetailsPopup = React.memo(({
  open,
  onClose,
  type,
  data,
  projectKey,
  projectName,
  title,
  ...props
}) => {
  const theme = useTheme()
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(25)
  const [orderBy, setOrderBy] = useState('delayDays')
  const [order, setOrder] = useState('desc')
  const [searchTerm, setSearchTerm] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [assigneeFilter, setAssigneeFilter] = useState('all')
  const [issueTypeFilter, setIssueTypeFilter] = useState('all')

  const processedData = useMemo(() => {
    if (!data || data.length === 0 || !type) return { issues: [], summary: {} }

    const filters = {
      search: searchTerm,
      priority: priorityFilter !== 'all' ? priorityFilter : null,
      assignee: assigneeFilter !== 'all' ? assigneeFilter : null,
      issueType: issueTypeFilter !== 'all' ? issueTypeFilter : null
    }

    switch (type) {
      case 'late_issues':
        return sprintMetricsDetailsService.getLateIssuesDetails(data, projectKey, filters)
      case 'scope_creep':
        return sprintMetricsDetailsService.getScopeCreepIssuesDetails(data, projectKey, filters)
      case 'in_progress':
        return sprintMetricsDetailsService.getIssuesByStatus(data, 'In Progress', projectKey, filters)
      case 'blocked':
        return sprintMetricsDetailsService.getIssuesByStatus(data, 'Blocked', projectKey, filters)
      case 'done':
        return sprintMetricsDetailsService.getIssuesByStatus(data, 'Done', projectKey, filters)
      default:
        return { issues: [], summary: {} }
    }
  }, [data, type, projectKey, searchTerm, priorityFilter, assigneeFilter, issueTypeFilter])

  const sortedData = useMemo(() => {
    if (!processedData.issues || processedData.issues.length === 0) return []

    const comparator = (a, b) => {
      let aValue = a[orderBy]
      let bValue = b[orderBy]

      if (orderBy === 'summary' || orderBy === 'assignee') {
        aValue = (aValue || '').toLowerCase()
        bValue = (bValue || '').toLowerCase()
      } else if (orderBy === 'created' || orderBy === 'dueDate') {
        aValue = new Date(aValue || 0).getTime()
        bValue = new Date(bValue || 0).getTime()
      } else {
        aValue = aValue || 0
        bValue = bValue || 0
      }

      if (order === 'desc') {
        return bValue < aValue ? -1 : bValue > aValue ? 1 : 0
      }
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
    }

    return [...processedData.issues].sort(comparator)
  }, [processedData.issues, order, orderBy])

  const paginatedData = useMemo(() => {
    const start = page * rowsPerPage
    return sortedData.slice(start, start + rowsPerPage)
  }, [sortedData, page, rowsPerPage])

  const availableFilters = useMemo(() => {
    if (!processedData.issues || processedData.issues.length === 0) {
      return { priorities: [], assignees: [], issueTypes: [] }
    }

    const priorities = [...new Set(processedData.issues.map(issue => issue.priority).filter(Boolean))]
    const assignees = [...new Set(processedData.issues.map(issue => issue.assignee).filter(Boolean))]
    const issueTypes = [...new Set(processedData.issues.map(issue => issue.issueType).filter(Boolean))]

    return {
      priorities: priorities.sort(),
      assignees: assignees.sort(),
      issueTypes: issueTypes.sort()
    }
  }, [processedData.issues])

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

  const handleSearchChange = useCallback((event) => {
    setSearchTerm(event.target.value)
    setPage(0)
  }, [])

  const handlePriorityFilterChange = useCallback((event) => {
    setPriorityFilter(event.target.value)
    setPage(0)
  }, [])

  const handleAssigneeFilterChange = useCallback((event) => {
    setAssigneeFilter(event.target.value)
    setPage(0)
  }, [])

  const handleIssueTypeFilterChange = useCallback((event) => {
    setIssueTypeFilter(event.target.value)
    setPage(0)
  }, [])

  const handleClose = useCallback(() => {
    setPage(0)
    setSearchTerm('')
    setPriorityFilter('all')
    setAssigneeFilter('all')
    setIssueTypeFilter('all')
    onClose()
  }, [onClose])

  const getDialogTitle = useCallback(() => {
    if (title) return title

    const baseTitle = projectName ? `${projectName} - ` : ''
    
    switch (type) {
      case 'late_issues':
        return `${baseTitle}Late Issues`
      case 'scope_creep':
        return `${baseTitle}Scope Creep Issues`
      case 'in_progress':
        return `${baseTitle}In Progress Issues`
      case 'blocked':
        return `${baseTitle}Blocked Issues`
      case 'done':
        return `${baseTitle}Completed Issues`
      default:
        return `${baseTitle}Issue Details`
    }
  }, [title, projectName, type])

  const getPriorityColor = useCallback((priority) => {
    switch (priority?.toLowerCase()) {
      case 'critical':
      case 'highest':
        return 'error'
      case 'high':
        return 'warning'
      case 'medium':
        return 'info'
      case 'low':
      case 'lowest':
        return 'success'
      default:
        return 'default'
    }
  }, [])

  const formatDate = useCallback((dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString()
  }, [])

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

  if (!open) return null

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          height: '90vh',
          maxHeight: '90vh'
        }
      }}
      {...props}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        pb: 1
      }}>
        <Box component="span" sx={{ fontWeight: 'medium', fontSize: '1.25rem' }}>
          {getDialogTitle()}
        </Box>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {/* Summary Statistics */}
        {processedData.summary && Object.keys(processedData.summary).length > 0 && (
          <Box sx={{ 
            mb: 3, 
            p: 2, 
            backgroundColor: theme.palette.background.default,
            borderRadius: 1,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: 2,
            textAlign: 'center'
          }}>
            {type === 'late_issues' && (
              <>
                <Box>
                  <Typography variant="h6" color="error.main">
                    {processedData.summary.avgDelayDays || 0}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Avg Delay (days)
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="h6" color="warning.main">
                    {processedData.summary.stillOpenCount || 0}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Still Open
                  </Typography>
                </Box>
              </>
            )}
            
            {type === 'scope_creep' && (
              <>
                <Box>
                  <Typography variant="h6" color="primary.main">
                    {processedData.summary.totalStoryPoints || 0}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Total Story Points
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="h6" color="info.main">
                    {processedData.summary.recentAdditions || 0}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Recent Additions
                  </Typography>
                </Box>
              </>
            )}
            
            <Box>
              <Typography variant="h6" color="secondary.main">
                {processedData.totalCount}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Total Issues
              </Typography>
            </Box>
          </Box>
        )}

        {/* Filters */}
        <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Search issues..."
            value={searchTerm}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 200 }}
          />

          {availableFilters.priorities.length > 0 && (
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Priority</InputLabel>
              <Select
                value={priorityFilter}
                onChange={handlePriorityFilterChange}
                label="Priority"
              >
                <MenuItem value="all">All Priorities</MenuItem>
                {availableFilters.priorities.map(priority => (
                  <MenuItem key={priority} value={priority}>
                    {priority}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {availableFilters.assignees.length > 0 && (
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Assignee</InputLabel>
              <Select
                value={assigneeFilter}
                onChange={handleAssigneeFilterChange}
                label="Assignee"
              >
                <MenuItem value="all">All Assignees</MenuItem>
                {availableFilters.assignees.map(assignee => (
                  <MenuItem key={assignee} value={assignee}>
                    {assignee}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {availableFilters.issueTypes.length > 0 && (
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Type</InputLabel>
              <Select
                value={issueTypeFilter}
                onChange={handleIssueTypeFilterChange}
                label="Type"
              >
                <MenuItem value="all">All Types</MenuItem>
                {availableFilters.issueTypes.map(issueType => (
                  <MenuItem key={issueType} value={issueType}>
                    {issueType}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Box>

        {/* Issues Table */}
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableHeaderCell property="key" label="Issue Key" />
                <TableHeaderCell property="summary" label="Summary" />
                <TableHeaderCell property="issueType" label="Type" sortable={false} />
                <TableHeaderCell property="priority" label="Priority" sortable={false} />
                <TableHeaderCell property="assignee" label="Assignee" />
                <TableHeaderCell property="status" label="Status" sortable={false} />
                {type === 'late_issues' && (
                  <TableHeaderCell property="delayDays" label="Delay (days)" numeric />
                )}
                {type === 'scope_creep' && (
                  <TableHeaderCell property="daysAfterThreshold" label="Days After Threshold" numeric />
                )}
                <TableHeaderCell property="created" label="Created" />
                <TableHeaderCell property="sprints" label="Sprints" sortable={false} />
                <TableHeaderCell property="" label="Actions" sortable={false} />
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedData.map((issue) => (
                <TableRow key={issue.key} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                      {issue.key}
                    </Typography>
                  </TableCell>
                  
                  <TableCell>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        maxWidth: 300,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                      title={issue.summary}
                    >
                      {issue.summary}
                    </Typography>
                  </TableCell>
                  
                  <TableCell>
                    <Chip
                      label={issue.issueType}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  
                  <TableCell>
                    <Chip
                      label={issue.priority}
                      size="small"
                      color={getPriorityColor(issue.priority)}
                    />
                  </TableCell>
                  
                  <TableCell>
                    <Typography variant="body2">
                      {issue.assignee}
                    </Typography>
                  </TableCell>
                  
                  <TableCell>
                    <Chip
                      label={issue.status}
                      size="small"
                      variant="outlined"
                      color={issue.status === 'Done' ? 'success' : 'default'}
                    />
                  </TableCell>
                  
                  {type === 'late_issues' && (
                    <TableCell align="right">
                      <Typography 
                        variant="body2" 
                        color={issue.delayDays > 14 ? 'error' : issue.delayDays > 7 ? 'warning.main' : 'text.primary'}
                      >
                        {issue.delayDays || 0}
                      </Typography>
                    </TableCell>
                  )}
                  
                  {type === 'scope_creep' && (
                    <TableCell align="right">
                      <Typography variant="body2">
                        {issue.daysAfterThreshold || 0}
                      </Typography>
                    </TableCell>
                  )}
                  
                  <TableCell>
                    <Typography variant="body2">
                      {formatDate(issue.created)}
                    </Typography>
                  </TableCell>
                  
                  <TableCell>
                    <Box sx={{ maxWidth: 250 }}>
                      {issue.sprints && issue.sprints.length > 0 ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          <Typography variant="caption" color="text.secondary">
                            {issue.totalSprints} sprint{issue.totalSprints > 1 ? 's' : ''}
                            {issue.isMultiSprint && ' (multi-sprint)'}
                          </Typography>
                          {issue.sprints.map((sprint, index) => (
                            <Chip
                              key={sprint.id}
                              label={`${sprint.name} (${sprint.state})`}
                              size="small"
                              variant="outlined"
                              color={sprint.state === 'ACTIVE' ? 'primary' : sprint.state === 'CLOSED' ? 'success' : 'default'}
                              title={`Start: ${formatDate(sprint.startDate)} | End: ${formatDate(sprint.endDate)}${sprint.goal ? ` | Goal: ${sprint.goal}` : ''}`}
                              sx={{ 
                                fontSize: '0.7rem',
                                height: '20px',
                                '& .MuiChip-label': { 
                                  px: 1,
                                  maxWidth: '200px',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis'
                                }
                              }}
                            />
                          ))}
                        </Box>
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          No sprints
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  
                  <TableCell>
                    <Link
                      href={issue.jiraUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ display: 'inline-flex', alignItems: 'center' }}
                    >
                      <OpenInNewIcon fontSize="small" />
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100]}
          component="div"
          count={sortedData.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  )
})

SprintMetricsDetailsPopup.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  type: PropTypes.oneOf(['late_issues', 'scope_creep', 'in_progress', 'blocked', 'done']),
  data: PropTypes.arrayOf(PropTypes.object),
  projectKey: PropTypes.string,
  projectName: PropTypes.string,
  title: PropTypes.string
}

SprintMetricsDetailsPopup.displayName = 'SprintMetricsDetailsPopup'

export default SprintMetricsDetailsPopup