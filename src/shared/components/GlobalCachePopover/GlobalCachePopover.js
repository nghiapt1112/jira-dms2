import React, { useState, useCallback } from 'react'
import PropTypes from 'prop-types'
import {
  Box,
  Fab,
  Popover,
  Typography,
  Paper,
  IconButton,
  Divider,
  useTheme,
  useMediaQuery,
  Tooltip
} from '@mui/material'
import {
  Storage as StorageIcon,
  Close as CloseIcon
} from '@mui/icons-material'
import CacheManager from '../../../features/dashboard/utils/CacheManager'
import CachePerformanceMonitor from '../../../features/dashboard/utils/CachePerformanceMonitor'
import { useMainDashboardCache } from '../../../features/dashboard/hooks/useMainDashboardCache'

const GlobalCachePopover = React.memo(({ 
  selectedProjects = [],
  fabStyle = {},
  ...props 
}) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [anchorEl, setAnchorEl] = useState(null)

  // Use the same cache hook as the main dashboard
  const cacheHook = useMainDashboardCache(selectedProjects)
  const { cacheStatus, performanceMetrics } = cacheHook

  const handleClick = useCallback((event) => {
    setAnchorEl(event.currentTarget)
  }, [])

  const handleClose = useCallback(() => {
    setAnchorEl(null)
  }, [])

  const open = Boolean(anchorEl)
  const id = open ? 'global-cache-popover' : undefined

  // Get status color for the FAB indicator
  const getStatusColor = useCallback(() => {
    if (!cacheStatus.status) return theme.palette.grey[500]
    
    switch (cacheStatus.status) {
      case 'valid': return theme.palette.success.main
      case 'expired': return theme.palette.warning.main
      case 'empty': return theme.palette.info.main
      default: return theme.palette.grey[500]
    }
  }, [cacheStatus.status, theme.palette])

  const getTooltipText = useCallback(() => {
    const entries = performanceMetrics.cacheSize || 0
    const status = cacheStatus.status || 'unknown'
    const hitRate = performanceMetrics.hitRate || 0
    
    return `Global Management | Cache: ${entries} entries | Status: ${status} | Hit Rate: ${hitRate.toFixed(1)}%`
  }, [performanceMetrics, cacheStatus])

  return (
    <>
      {/* Floating Action Button - Only show on desktop */}
      {!isMobile && (
        <Tooltip title={getTooltipText()} placement="left">
          <Fab
            color="primary"
            aria-describedby={id}
            onClick={handleClick}
            sx={{
              position: 'fixed',
              top: '50%',
              right: 24,
              transform: 'translateY(-50%)',
              zIndex: theme.zIndex.speedDial,
              backgroundColor: getStatusColor(),
              '&:hover': {
                backgroundColor: getStatusColor(),
                opacity: 0.8
              },
              // Add a small indicator dot for cache status
              '&::after': {
                content: '""',
                position: 'absolute',
                top: 8,
                right: 8,
                width: 12,
                height: 12,
                borderRadius: '50%',
                backgroundColor: cacheStatus.status === 'valid' 
                  ? theme.palette.success.main 
                  : cacheStatus.status === 'expired'
                  ? theme.palette.warning.main
                  : theme.palette.error.main,
                border: `2px solid ${theme.palette.background.paper}`,
                display: cacheStatus.status ? 'block' : 'none'
              },
              ...fabStyle
            }}
            {...props}
          >
            <StorageIcon />
          </Fab>
        </Tooltip>
      )}

      {/* Cache Management Popover */}
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        sx={{
          '& .MuiPopover-paper': {
            width: isMobile ? 'calc(100vw - 32px)' : 800,
            maxWidth: isMobile ? 'calc(100vw - 32px)' : 800,
            maxHeight: isMobile ? 'calc(100vh - 64px)' : 600,
            overflow: 'auto'
          }
        }}
      >
        <Paper sx={{ width: '100%' }}>
          {/* Header */}
          <Box sx={{ 
            p: 2, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            backgroundColor: theme.palette.primary.main,
            color: theme.palette.primary.contrastText
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <StorageIcon />
              <Typography variant="h6">
                Global Management
              </Typography>
            </Box>
            
            <IconButton 
              onClick={handleClose} 
              size="small"
              sx={{ color: 'inherit' }}
            >
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Cache Status Summary */}
          <Box sx={{ p: 2, backgroundColor: theme.palette.background.default }}>
            <Typography variant="subtitle2" gutterBottom>
              Quick Status
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Typography variant="body2" color="text.secondary">
                Entries: <strong>{performanceMetrics.cacheSize || 0}</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Status: <strong style={{ color: getStatusColor() }}>
                  {cacheStatus.status || 'Unknown'}
                </strong>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Hit Rate: <strong>{(performanceMetrics.hitRate || 0).toFixed(1)}%</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Avg Response: <strong>{(performanceMetrics.avgResponseTime || 0).toFixed(1)}ms</strong>
              </Typography>
            </Box>
          </Box>


          {/* Cache Manager */}
          <Box sx={{ p: 2 }}>
            <CacheManager
              cacheHook={cacheHook}
              title="Cache Management"
              defaultExpanded={true}
              showDebugInfo={false}
              elevation={0}
            />
          </Box>

          <Divider />

          {/* Cache Performance Monitor */}
          <Box sx={{ p: 2 }}>
            <CachePerformanceMonitor
              cacheHook={cacheHook}
              title="Performance Monitor"
              defaultExpanded={true}
              showDetailedMetrics={true}
              elevation={0}
            />
          </Box>
        </Paper>
      </Popover>
    </>
  )
})

GlobalCachePopover.propTypes = {
  selectedProjects: PropTypes.arrayOf(PropTypes.string),
  fabStyle: PropTypes.object
}

GlobalCachePopover.displayName = 'GlobalCachePopover'

export default GlobalCachePopover