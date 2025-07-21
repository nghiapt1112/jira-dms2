import React from 'react'
import PropTypes from 'prop-types'
import { Box, Typography, Chip } from '@mui/material'
import { Groups, Person, TrendingUp, AccessTime } from '@mui/icons-material'

/**
 * ChartModeIndicator - Visual indicator showing current chart mode and available metrics
 * Provides clear visual feedback about whether user is viewing team or individual analysis
 * 
 * @param {Object} props - Component props
 * @param {string} props.mode - Current chart mode: 'team' or 'individual'
 * @param {string} props.selectedDeveloper - Name of selected developer (for individual mode)
 * @param {boolean} props.hasTimeTrackingData - Whether time tracking data is available
 * @param {number} props.teamSize - Number of developers in team view
 * @returns {JSX.Element} Chart mode indicator component
 */
const ChartModeIndicator = ({ 
  mode, 
  selectedDeveloper, 
  hasTimeTrackingData = false,
  teamSize = 0
}) => {
  const isTeamMode = mode === 'team'
  const isIndividualMode = mode === 'individual'

  return (
    <Box sx={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between',
      mb: 2,
      p: 2,
      bgcolor: 'background.default',
      borderRadius: 1,
      border: '1px solid',
      borderColor: 'divider'
    }}>
      {/* Mode Indicator */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1 
      }}>
        {isTeamMode ? (
          <>
            <Groups color="primary" />
            <Typography variant="subtitle1" fontWeight={600}>
              Team Overview
            </Typography>
            <Chip 
              size="small" 
              label={`${teamSize} developers`}
              variant="outlined"
              color="primary"
            />
          </>
        ) : isIndividualMode ? (
          <>
            <Person color="primary" />
            <Typography variant="subtitle1" fontWeight={600}>
              Individual Analysis
            </Typography>
            <Chip 
              size="small" 
              label={selectedDeveloper}
              variant="filled"
              color="primary"
            />
          </>
        ) : (
          <>
            <TrendingUp color="disabled" />
            <Typography variant="subtitle1" color="text.secondary">
              Select view mode
            </Typography>
          </>
        )}
      </Box>

      {/* Metrics Available Indicator */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1 
      }}>
        <Typography variant="body2" color="text.secondary">
          Available:
        </Typography>
        
        {/* Story Points - Always available */}
        <Chip 
          size="small"
          icon={<TrendingUp />}
          label="Story Points"
          variant="outlined"
          color="success"
        />

        {/* Time Tracking - Conditional */}
        {hasTimeTrackingData && isIndividualMode ? (
          <Chip 
            size="small"
            icon={<AccessTime />}
            label="Time Tracking"
            variant="outlined"
            color="info"
          />
        ) : isIndividualMode ? (
          <Chip 
            size="small"
            icon={<AccessTime />}
            label="No Time Data"
            variant="outlined"
            color="default"
            disabled
          />
        ) : null}
      </Box>
    </Box>
  )
}

ChartModeIndicator.propTypes = {
  mode: PropTypes.oneOf(['team', 'individual']).isRequired,
  selectedDeveloper: PropTypes.string,
  hasTimeTrackingData: PropTypes.bool,
  teamSize: PropTypes.number
}

export default ChartModeIndicator