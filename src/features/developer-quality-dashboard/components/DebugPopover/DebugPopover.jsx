import React, { useState, useCallback } from 'react'
import PropTypes from 'prop-types'
import {
  Box,
  IconButton,
  Popover,
  Paper,
  Typography,
  Switch,
  FormControlLabel,
  Divider,
  Tooltip
} from '@mui/material'
import { BugReport as BugIcon } from '@mui/icons-material'

/**
 * DebugPopover - Development tool for toggling debug features
 * 
 * Provides toggles for:
 * - Show/hide severity filter option
 * - Show/hide root cause filter option  
 * - Show/hide raw bug analysis JSON in Team tab
 * 
 * Defaults all options to hidden for production
 */
const DebugPopover = React.memo(({ debugOptions, onDebugOptionsChange }) => {
  const [anchorEl, setAnchorEl] = useState(null)
  
  const handleClick = useCallback((event) => {
    setAnchorEl(event.currentTarget)
  }, [])
  
  const handleClose = useCallback(() => {
    setAnchorEl(null)
  }, [])
  
  const handleToggle = useCallback((option) => (event) => {
    const newOptions = {
      ...debugOptions,
      [option]: event.target.checked
    }
    onDebugOptionsChange(newOptions)
  }, [debugOptions, onDebugOptionsChange])
  
  const open = Boolean(anchorEl)
  
  return (
    <>
      <Tooltip title="Debug Options">
        <IconButton
          onClick={handleClick}
          size="small"
          sx={{
            color: 'text.secondary',
            '&:hover': {
              color: 'primary.main',
              backgroundColor: 'action.hover'
            }
          }}
        >
          <BugIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <Paper sx={{ p: 2, minWidth: 280 }}>
          <Typography variant="h6" gutterBottom sx={{ fontSize: '1rem', fontWeight: 600 }}>
            Debug Options
          </Typography>
          
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
            Toggle visibility of development features
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={debugOptions.showSeverityFilter}
                  onChange={handleToggle('showSeverityFilter')}
                  size="small"
                />
              }
              label="Show Severity Filter"
              sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.875rem' } }}
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={debugOptions.showRootCauseFilter}
                  onChange={handleToggle('showRootCauseFilter')}
                  size="small"
                />
              }
              label="Show Root Cause Filter"
              sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.875rem' } }}
            />
            
            <Divider sx={{ my: 1 }} />
            
            <FormControlLabel
              control={
                <Switch
                  checked={debugOptions.showRawBugAnalysisJson}
                  onChange={handleToggle('showRawBugAnalysisJson')}
                  size="small"
                />
              }
              label="Show Raw Bug Analysis JSON"
              sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.875rem' } }}
            />
          </Box>
          
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2, fontStyle: 'italic' }}>
            Default: All options hidden
          </Typography>
        </Paper>
      </Popover>
    </>
  )
})

DebugPopover.propTypes = {
  debugOptions: PropTypes.shape({
    showSeverityFilter: PropTypes.bool.isRequired,
    showRootCauseFilter: PropTypes.bool.isRequired,
    showRawBugAnalysisJson: PropTypes.bool.isRequired
  }).isRequired,
  onDebugOptionsChange: PropTypes.func.isRequired
}

DebugPopover.displayName = 'DebugPopover'

export default DebugPopover