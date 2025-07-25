import React, { useCallback, useMemo } from 'react'
import PropTypes from 'prop-types'
import {
  Fab,
  Tooltip,
  Badge,
  useTheme,
  useMediaQuery
} from '@mui/material'
import {
  BugReport as BugReportIcon
} from '@mui/icons-material'
import { useDebugStore } from '../../store/debugStore'

const DebugFab = React.memo(() => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  
  const {
    open,
    isRefreshing,
    isExporting,
    error
  } = useDebugStore()

  // Don't show on mobile to avoid UI clutter
  if (isMobile) return null

  // Memoized FAB state and color (performance optimization)
  const statusColor = useMemo(() => {
    if (error) return 'error'
    if (isRefreshing || isExporting) return 'warning'
    return 'primary'
  }, [error, isRefreshing, isExporting])

  // Memoized tooltip text (performance optimization)
  const tooltipText = useMemo(() => {
    if (error) return `Debug Panel - Error: ${error}`
    if (isRefreshing) return 'Debug Panel - Refreshing data...'
    if (isExporting) return 'Debug Panel - Exporting logs...'
    return 'Open Debug Panel - Export logs & refresh data'
  }, [error, isRefreshing, isExporting])

  // Memoized badge visibility (performance optimization)
  const showBadge = useMemo(() => {
    return isRefreshing || isExporting || !!error
  }, [isRefreshing, isExporting, error])

  // Memoized FAB styles (performance optimization)
  const fabStyles = useMemo(() => ({
    position: 'fixed',
    bottom: 24,
    right: 24,
    zIndex: theme.zIndex.speedDial,
    '&:hover': {
      transform: 'scale(1.1)',
    },
    transition: 'transform 0.2s ease-in-out',
    // Add subtle animation when active
    animation: (isRefreshing || isExporting) ? 'rotate 3s linear infinite' : 'none',
    '@keyframes rotate': {
      '0%': {
        transform: 'rotate(0deg)',
      },
      '100%': {
        transform: 'rotate(360deg)',
      },
    },
  }), [theme.zIndex.speedDial, isRefreshing, isExporting])

  // Memoized badge styles (performance optimization)
  const badgeStyles = useMemo(() => ({
    '& .MuiBadge-badge': {
      right: 8,
      top: 8,
      animation: (isRefreshing || isExporting) ? 'pulse 2s infinite' : 'none',
      '@keyframes pulse': {
        '0%': {
          transform: 'scale(1)',
          opacity: 1,
        },
        '50%': {
          transform: 'scale(1.2)',
          opacity: 0.8,
        },
        '100%': {
          transform: 'scale(1)',
          opacity: 1,
        },
      },
    }
  }), [isRefreshing, isExporting])

  return (
    <Tooltip title={tooltipText} placement="left">
      <Badge
        variant="dot"
        color={statusColor}
        invisible={!showBadge}
        sx={badgeStyles}
      >
        <Fab
          color={statusColor}
          onClick={open}
          sx={fabStyles}
        >
          <BugReportIcon />
        </Fab>
      </Badge>
    </Tooltip>
  )
})

DebugFab.propTypes = {
  // No props expected for this component
}

DebugFab.displayName = 'DebugFab'

export default DebugFab