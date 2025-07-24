import React from 'react'
import PropTypes from 'prop-types'
import { Box, Typography, Switch, FormControlLabel } from '@mui/material'
import { ShowChart } from '@mui/icons-material'

/**
 * PerformanceToggle - Toggle control for showing/hiding target lines
 * Only displays when exactly one project is selected for performance analysis
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.showTargetLines - Current state of target lines visibility
 * @param {Function} props.onToggle - Callback function when toggle state changes
 * @param {boolean} props.disabled - Whether the toggle is disabled
 * @param {string} props.projectName - Name of the selected project for context
 * @returns {JSX.Element} Performance toggle component
 */
const PerformanceToggle = ({ 
  showTargetLines, 
  onToggle, 
  disabled = false,
  projectName = ''
}) => {
  return (
    <Box sx={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: 1,
      minWidth: 'fit-content'
    }}>
      <ShowChart 
        color={disabled ? 'disabled' : 'primary'} 
        fontSize="small" 
      />
      
      <FormControlLabel
        control={
          <Switch
            checked={showTargetLines}
            onChange={(event) => onToggle(event.target.checked)}
            disabled={disabled}
            size="small"
            color="primary"
          />
        }
        label={
          <Typography 
            variant="body2" 
            color={disabled ? 'text.disabled' : 'text.primary'}
            fontWeight={500}
          >
            Show Target Lines
          </Typography>
        }
        sx={{
          margin: 0,
          '& .MuiFormControlLabel-label': {
            fontSize: '0.875rem'
          }
        }}
      />
      
      {projectName && !disabled && (
        <Typography 
          variant="caption" 
          color="text.secondary"
          sx={{ 
            fontStyle: 'italic',
            maxWidth: 120,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          for {projectName}
        </Typography>
      )}
    </Box>
  )
}

PerformanceToggle.propTypes = {
  showTargetLines: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  projectName: PropTypes.string
}

export default React.memo(PerformanceToggle)