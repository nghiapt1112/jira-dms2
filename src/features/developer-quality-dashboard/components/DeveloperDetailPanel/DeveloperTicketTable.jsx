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
  TableSortLabel,
  Chip,
  Collapse,
  IconButton,
  Alert,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Stack
} from '@mui/material'
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Assignment as TaskIcon,
  BugReport as BugIcon,
  History as StoryIcon,
  CheckCircle as DoneIcon,
  Schedule as InProgressIcon,
  Pause as TodoIcon
} from '@mui/icons-material'
import { useDeveloperTickets } from '../../hooks/useDeveloperTickets'
import { formatDateDDMMYYYY, getWeekDateRange } from '../../../../shared/utils/timeUtils'

/**
 * Get icon for issue type
 */
const getIssueTypeIcon = (issueType) => {
  switch (issueType?.toLowerCase()) {
    case 'bug':
      return <BugIcon fontSize="small" color="error" />
    case 'story':
      return <StoryIcon fontSize="small" color="primary" />
    case 'task':
    default:
      return <TaskIcon fontSize="small" color="action" />
  }
}

/**
 * Get color for status
 */
const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'done':
    case 'closed':
    case 'resolved':
      return 'success'
    case 'in progress':
    case 'in review':
      return 'primary'
    case 'to do':
    case 'open':
    case 'new':
      return 'default'
    default:
      return 'secondary'
  }
}

/**
 * Get icon for status
 */
const getStatusIcon = (status) => {
  switch (status?.toLowerCase()) {
    case 'done':
    case 'closed':
    case 'resolved':
      return <DoneIcon fontSize="small" />
    case 'in progress':
    case 'in review':
      return <InProgressIcon fontSize="small" />
    case 'to do':
    case 'open':
    case 'new':
      return <TodoIcon fontSize="small" />
    default:
      return null
  }
}

/**
 * Time Group Header Component
 */
const TimeGroupHeader = React.memo(({ 
  periodKey, 
  tickets, 
  timeframe, 
  isExpanded, 
  onToggle 
}) => {
  const theme = useTheme()
  const ticketCount = tickets.length
  const totalStoryPoints = tickets.reduce((sum, ticket) => sum + (ticket.storyPoints || 0), 0)
  
  // Format period label based on timeframe
  const formatPeriodLabel = (periodKey, timeframe) => {
    switch (timeframe) {
      case 'week': {
        const weekRange = getWeekDateRange(periodKey)
        return `Week ${periodKey} (${weekRange.formatted})`
      }
      case 'quarter': {
        return `Quarter ${periodKey}`
      }
      case 'month':
      default: {
        const [year, month] = periodKey.split('-')
        const monthNames = [
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'
        ]
        return `${monthNames[parseInt(month) - 1]} ${year}`
      }
    }
  }
  
  return (
    <TableRow 
      sx={{ 
        backgroundColor: theme.palette.action.hover,
        '&:hover': {
          backgroundColor: theme.palette.action.selected
        }
      }}
    >
      <TableCell 
        colSpan={6} 
        sx={{ 
          py: 1,
          borderBottom: isExpanded ? 'none' : undefined
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton 
              size="small" 
              onClick={onToggle}
              sx={{ p: 0.5 }}
            >
              {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
            <Typography variant="subtitle2" fontWeight="medium">
              {formatPeriodLabel(periodKey, timeframe)}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Chip 
              label={`${ticketCount} ticket${ticketCount !== 1 ? 's' : ''}`}
              size="small"
              variant="outlined"
            />
            <Chip 
              label={`${totalStoryPoints} SP`}
              size="small"
              color="primary"
              variant="outlined"
            />
          </Box>
        </Box>
      </TableCell>
    </TableRow>
  )
})

TimeGroupHeader.propTypes = {
  periodKey: PropTypes.string.isRequired,
  tickets: PropTypes.array.isRequired,
  timeframe: PropTypes.string.isRequired,
  isExpanded: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired
}

/**
 * Ticket Table Row Component
 */
const TicketTableRow = React.memo(({ ticket, isCompact }) => {
  const theme = useTheme()
  
  // Format date (resolved date primary, updated date fallback)
  const formatTicketDate = (ticket) => {
    if (ticket.resolved) {
      return formatDateDDMMYYYY(ticket.resolved)
    }
    if (ticket.updated) {
      return formatDateDDMMYYYY(ticket.updated)
    }
    return 'No date'
  }
  
  return (
    <TableRow 
      hover
      sx={{ 
        '&:last-child td, &:last-child th': { border: 0 },
        height: isCompact ? 40 : 52
      }}
    >
      {/* Task ID */}
      <TableCell>
        <Typography 
          variant="body2" 
          fontFamily="monospace"
          color="primary"
          fontWeight="medium"
        >
          {ticket.key}
        </Typography>
      </TableCell>
      
      {/* Task Type */}
      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {getIssueTypeIcon(ticket.issueType)}
          <Typography variant="body2">
            {ticket.issueType || 'Unknown'}
          </Typography>
        </Box>
      </TableCell>
      
      {/* Status */}
      <TableCell>
        <Chip
          icon={getStatusIcon(ticket.status)}
          label={ticket.status || 'Unknown'}
          size="small"
          color={getStatusColor(ticket.status)}
          variant="outlined"
        />
      </TableCell>
      
      {/* Story Points */}
      <TableCell align="right">
        <Typography 
          variant="body2" 
          fontWeight={ticket.storyPoints > 0 ? "medium" : "normal"}
          color={ticket.storyPoints > 0 ? "text.primary" : "text.secondary"}
        >
          {ticket.storyPoints || '-'}
        </Typography>
      </TableCell>
      
      {/* Date */}
      <TableCell>
        <Typography variant="body2" fontFamily="monospace">
          {formatTicketDate(ticket)}
        </Typography>
      </TableCell>
      
      {/* Project */}
      <TableCell>
        <Chip
          label={ticket.project || 'Unknown'}
          size="small"
          variant="filled"
          color="default"
        />
      </TableCell>
    </TableRow>
  )
})

TicketTableRow.propTypes = {
  ticket: PropTypes.object.isRequired,
  isCompact: PropTypes.bool
}

/**
 * Main Developer Ticket Table Component
 */
const DeveloperTicketTable = ({ 
  developerName,
  maxHeight = 600,
  defaultExpanded = true
}) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  
  // Get ticket data using our custom hook
  const {
    groupedTickets,
    totalTickets,
    isEmpty,
    error,
    metadata,
    totalStoryPoints
  } = useDeveloperTickets(developerName)
  
  // Expansion state for time groups
  const [expandedGroups, setExpandedGroups] = useState(() => {
    // Default expand first group only, or all if defaultExpanded is true
    const initialState = new Set()
    if (defaultExpanded) {
      Array.from(groupedTickets.keys()).forEach(key => initialState.add(key))
    } else if (groupedTickets.size > 0) {
      initialState.add(Array.from(groupedTickets.keys())[0])
    }
    return initialState
  })
  
  // Toggle group expansion
  const toggleGroup = useCallback((periodKey) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev)
      if (newSet.has(periodKey)) {
        newSet.delete(periodKey)
      } else {
        newSet.add(periodKey)
      }
      return newSet
    })
  }, [])
  
  // Expand/collapse all groups
  const toggleAllGroups = useCallback(() => {
    const allKeys = Array.from(groupedTickets.keys())
    const allExpanded = allKeys.every(key => expandedGroups.has(key))
    
    if (allExpanded) {
      setExpandedGroups(new Set())
    } else {
      setExpandedGroups(new Set(allKeys))
    }
  }, [groupedTickets, expandedGroups])
  
  // Memoized table content
  const tableContent = useMemo(() => {
    if (isEmpty || error) return null
    
    return Array.from(groupedTickets.entries()).map(([periodKey, tickets]) => {
      const isExpanded = expandedGroups.has(periodKey)
      
      return (
        <React.Fragment key={periodKey}>
          <TimeGroupHeader
            periodKey={periodKey}
            tickets={tickets}
            timeframe={metadata?.timeframe || 'month'}
            isExpanded={isExpanded}
            onToggle={() => toggleGroup(periodKey)}
          />
          
          <TableRow>
            <TableCell sx={{ py: 0, border: 0 }} colSpan={6}>
              <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                <Table size={isMobile ? "small" : "medium"}>
                  <TableBody>
                    {tickets.map((ticket) => (
                      <TicketTableRow 
                        key={ticket.id || ticket.key}
                        ticket={ticket}
                        isCompact={isMobile}
                      />
                    ))}
                  </TableBody>
                </Table>
              </Collapse>
            </TableCell>
          </TableRow>
        </React.Fragment>
      )
    })
  }, [groupedTickets, expandedGroups, metadata?.timeframe, isMobile, toggleGroup])
  
  // Loading state
  if (!developerName) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography color="text.secondary">
          No developer selected
        </Typography>
      </Paper>
    )
  }
  
  // Error state
  if (error) {
    return (
      <Paper sx={{ p: 3 }}>
        <Alert severity="error">
          Error loading tickets: {error}
        </Alert>
      </Paper>
    )
  }
  
  // Empty state
  if (isEmpty) {
    return (
      <Paper sx={{ p: 3 }}>
        <Alert severity="info">
          No tickets found for {developerName} in the current time period.
        </Alert>
      </Paper>
    )
  }
  
  return (
    <Paper elevation={2} sx={{ mt: 2 }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h6" component="h3">
            Individual Tickets
          </Typography>
          <Stack direction="row" spacing={1}>
            <Chip 
              label={`${metadata?.periodCount || 0} period${metadata?.periodCount !== 1 ? 's' : ''}`}
              size="small"
              variant="outlined"
            />
            <Chip 
              label={`${totalTickets} ticket${totalTickets !== 1 ? 's' : ''}`}
              size="small"
              color="primary"
            />
            <Chip 
              label={`${totalStoryPoints} SP total`}
              size="small"
              color="secondary"
            />
          </Stack>
        </Box>
        
        <Typography variant="body2" color="text.secondary">
          Tickets for {developerName} grouped by {metadata?.timeframe || 'month'}
        </Typography>
      </Box>
      
      {/* Table */}
      <TableContainer sx={{ maxHeight }}>
        <Table stickyHeader size={isMobile ? "small" : "medium"}>
          <TableHead>
            <TableRow>
              <TableCell>Task ID</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Story Points</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Project</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tableContent}
          </TableBody>
        </Table>
      </TableContainer>
      
      {/* Footer with expand/collapse all */}
      {groupedTickets.size > 1 && (
        <Box sx={{ p: 1, borderTop: 1, borderColor: 'divider', textAlign: 'center' }}>
          <IconButton 
            size="small" 
            onClick={toggleAllGroups}
            color="primary"
          >
            {Array.from(groupedTickets.keys()).every(key => expandedGroups.has(key)) ? 
              <ExpandLessIcon /> : <ExpandMoreIcon />
            }
          </IconButton>
        </Box>
      )}
    </Paper>
  )
}

DeveloperTicketTable.propTypes = {
  developerName: PropTypes.string.isRequired,
  maxHeight: PropTypes.number,
  defaultExpanded: PropTypes.bool
}

export default React.memo(DeveloperTicketTable)