import React from 'react'
import PropTypes from 'prop-types'
import { Box, Typography, Autocomplete, TextField, Chip } from '@mui/material'
import { FilterList, TrendingUp, TrendingDown, ShowChart } from '@mui/icons-material'

// Performance filter options
const PERFORMANCE_OPTIONS = [
  {
    value: 'all',
    label: 'All Performance',
    description: 'Show all developers regardless of performance',
    icon: ShowChart,
    color: 'default'
  },
  {
    value: 'under',
    label: 'Under Performance',
    description: 'Show only developers performing below target',
    icon: TrendingDown,
    color: 'error'
  },
  {
    value: 'over',
    label: 'Over Performance', 
    description: 'Show only developers performing above target',
    icon: TrendingUp,
    color: 'success'
  }
]

/**
 * PerformanceFilter - Dropdown filter for performance-based developer filtering
 * Only enabled when exactly one project is selected and target lines are shown
 * 
 * @param {Object} props - Component props
 * @param {string} props.value - Current filter value ('all', 'under', 'over')
 * @param {Function} props.onChange - Callback function when filter changes
 * @param {boolean} props.disabled - Whether the filter is disabled
 * @param {string} props.projectName - Name of the selected project for context
 * @returns {JSX.Element} Performance filter component
 */
const PerformanceFilter = ({ 
  value, 
  onChange, 
  disabled = false,
  projectName = ''
}) => {
  const selectedOption = PERFORMANCE_OPTIONS.find(option => option.value === value) || PERFORMANCE_OPTIONS[0]

  const handleChange = (event, newValue) => {
    if (newValue) {
      onChange(newValue.value)
    }
  }

  return (
    <Box sx={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: 1,
      minWidth: 200
    }}>
      <FilterList 
        color={disabled ? 'disabled' : 'primary'} 
        fontSize="small" 
      />
      
      <Autocomplete
        value={selectedOption}
        onChange={handleChange}
        options={PERFORMANCE_OPTIONS}
        getOptionLabel={(option) => option.label}
        disabled={disabled}
        disableClearable
        size="small"
        sx={{ 
          minWidth: 180,
          '& .MuiOutlinedInput-root': {
            bgcolor: disabled ? 'action.disabledBackground' : 'background.paper'
          }
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            variant="outlined"
            placeholder="Filter by performance"
            sx={{
              '& .MuiInputLabel-root': {
                fontSize: '0.875rem'
              }
            }}
          />
        )}
        renderOption={(props, option) => {
          const IconComponent = option.icon
          return (
            <Box component="li" {...props} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconComponent 
                fontSize="small" 
                color={option.color === 'default' ? 'action' : option.color}
              />
              <Box>
                <Typography variant="body2" fontWeight={500}>
                  {option.label}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {option.description}
                </Typography>
              </Box>
            </Box>
          )
        }}
        renderTags={(value, getTagProps) =>
          value.map((option, index) => {
            const IconComponent = option.icon
            return (
              <Chip
                {...getTagProps({ index })}
                key={option.value}
                icon={<IconComponent fontSize="small" />}
                label={option.label}
                size="small"
                color={option.color === 'default' ? 'primary' : option.color}
                variant="outlined"
              />
            )
          })
        }
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
          in {projectName}
        </Typography>
      )}
    </Box>
  )
}

PerformanceFilter.propTypes = {
  value: PropTypes.oneOf(['all', 'under', 'over']).isRequired,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  projectName: PropTypes.string
}

export default React.memo(PerformanceFilter)