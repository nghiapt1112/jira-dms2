import React, { useCallback, useMemo } from 'react'
import PropTypes from 'prop-types'
import { 
  Box, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Chip, 
  OutlinedInput,
  Typography,
  Button,
  Paper
} from '@mui/material'
import { Clear as ClearIcon } from '@mui/icons-material'
// Direct store access
import { useDeveloperQualityStore } from '../../store/developerQualityStore'

const FilterPanel = React.memo(({ 
  filters, 
  onFiltersChange, 
  filterOptions, 
  isLoading = false,
  // Backward compatibility props
  onTimePeriodChange,
  onStatusFilterChange
}) => {
  // 1. Hooks first (none needed)
  
  // 2. Memoized values
  const hasActiveFilters = useMemo(() => {
    return Object.values(filters).some(filter => 
      Array.isArray(filter) ? filter.length > 0 : Boolean(filter)
    )
  }, [filters])
  
  const filterSummary = useMemo(() => {
    const activeFilters = []
    if (filters.developers?.length > 0) {
      activeFilters.push(`${filters.developers.length} developer${filters.developers.length > 1 ? 's' : ''}`)
    }
    if (filters.projects?.length > 0) {
      activeFilters.push(`${filters.projects.length} project${filters.projects.length > 1 ? 's' : ''}`)
    }
    if (filters.issueTypes?.length > 0) {
      activeFilters.push(`${filters.issueTypes.length} issue type${filters.issueTypes.length > 1 ? 's' : ''}`)
    }
    if (filters.statuses?.length > 0) {
      activeFilters.push(`${filters.statuses.length} status${filters.statuses.length > 1 ? 'es' : ''}`)
    }
    if (filters.severities?.length > 0) {
      activeFilters.push(`${filters.severities.length} severit${filters.severities.length > 1 ? 'ies' : 'y'}`)
    }
    if (filters.rootCauses?.length > 0) {
      activeFilters.push(`${filters.rootCauses.length} root cause${filters.rootCauses.length > 1 ? 's' : ''}`)
    }
    return activeFilters
  }, [filters])
  
  // 3. Callbacks
  const handleFilterChange = useCallback((filterType, value) => {
    console.log(`FilterPanel: Changing ${filterType} filter:`, value)
    
    // Force filter change by creating new array reference for arrays
    if (Array.isArray(value)) {
      const newValue = [...value] // Create a new array reference
      console.log(`FilterPanel: Created new array reference for ${filterType}:`, newValue)
      
      onFiltersChange(prev => ({
        ...prev,
        [filterType]: newValue
      }))
    } else {
      onFiltersChange(prev => ({
        ...prev,
        [filterType]: value
      }))
    }
  }, [onFiltersChange])
  
  const handleClearAllFilters = useCallback(() => {
    onFiltersChange({
      developers: [],
      projects: [],
      issueTypes: [],
      statuses: [],
      severities: [],
      rootCauses: [],
      dateRange: {
        startDate: null,
        endDate: null
      },
      timeframe: 'month',
      statusFilter: ['Done', 'In Progress', 'In Review']
    })
  }, [onFiltersChange])
  
  const renderChips = useCallback((selected) => (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
      {selected.map((value) => (
        <Chip 
          key={value} 
          label={value} 
          size="small"
          sx={{ 
            fontSize: { xs: '0.75rem', sm: '0.8125rem' },
            height: { xs: 24, sm: 28 }
          }}
        />
      ))}
    </Box>
  ), [])
  
  // 4. Early returns
  if (!filterOptions) return null
  
  // 5. Render
  return (
    <Paper 
      elevation={1} 
      sx={{ 
        p: { xs: 2, sm: 3 }, 
        backgroundColor: 'background.paper',
        borderRadius: 1
      }}
    >
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        mb: { xs: 2, sm: 3 }
      }}>
        <Typography 
          variant="h6"
          sx={{ 
            fontSize: { xs: '1rem', sm: '1.25rem' },
            fontWeight: 600
          }}
        >
          Filters
        </Typography>
        
        {hasActiveFilters && (
          <Button
            variant="outlined"
            size="small"
            startIcon={<ClearIcon />}
            onClick={handleClearAllFilters}
            disabled={isLoading}
            sx={{ 
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              px: { xs: 1, sm: 2 }
            }}
          >
            Clear All
          </Button>
        )}
      </Box>
      
      {/* Filter Summary */}
      {filterSummary.length > 0 && (
        <Box sx={{ mb: { xs: 2, sm: 3 } }}>
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
          >
            Active filters: {filterSummary.join(', ')}
          </Typography>
        </Box>
      )}
      
      {/* Filter Controls */}
      <Box sx={{ 
        display: 'grid',
        gridTemplateColumns: { 
          xs: '1fr',
          sm: 'repeat(2, 1fr)',
          md: 'repeat(3, 1fr)',
          lg: 'repeat(4, 1fr)'
        },
        gap: { xs: 2, sm: 3 },
        alignItems: 'start'
      }}>
        {/* Time Period Selector */}
        <FormControl 
          fullWidth
          disabled={isLoading}
          sx={{ minWidth: 180 }}
        >
          <InputLabel>Time Period</InputLabel>
          <Select
            value={filters.timeframe || 'month'}
            onChange={(e) => {
              handleFilterChange('timeframe', e.target.value)
              if (onTimePeriodChange) {
                onTimePeriodChange(e.target.value)
              }
            }}
            input={<OutlinedInput label="Time Period" />}
          >
            <MenuItem value="week">Weekly</MenuItem>
            <MenuItem value="month">Monthly</MenuItem>
            <MenuItem value="quarter">Quarterly</MenuItem>
          </Select>
        </FormControl>
        
        {/* Status Filter */}
        <FormControl 
          fullWidth
          disabled={isLoading}
          sx={{ minWidth: 180 }}
        >
          <InputLabel>Statuses</InputLabel>
          <Select
            multiple
            value={filters.statusFilter || []}
            onChange={(e) => {
              handleFilterChange('statusFilter', e.target.value)
              if (onStatusFilterChange) {
                onStatusFilterChange(e.target.value)
              }
            }}
            input={<OutlinedInput label="Statuses" />}
            renderValue={renderChips}
            MenuProps={{
              PaperProps: {
                style: {
                  maxHeight: 224,
                  width: 250,
                },
              },
            }}
          >
            {filterOptions.statuses?.map((status) => (
              <MenuItem key={status} value={status}>
                {status}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        {/* Developer Filter */}
        <FormControl 
          fullWidth
          disabled={isLoading}
          sx={{ minWidth: 180 }}
        >
          <InputLabel>Developers</InputLabel>
          <Select
            multiple
            value={filters.developers || []}
            onChange={(e) => handleFilterChange('developers', e.target.value)}
            input={<OutlinedInput label="Developers" />}
            renderValue={renderChips}
            MenuProps={{
              PaperProps: {
                style: {
                  maxHeight: 224,
                  width: 250,
                },
              },
            }}
          >
            {filterOptions.developers?.map((developer) => (
              <MenuItem key={developer} value={developer}>
                {developer}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        {/* Project Filter */}
        <FormControl 
          fullWidth
          disabled={isLoading}
          sx={{ minWidth: 180 }}
        >
          <InputLabel>Projects</InputLabel>
          <Select
            multiple
            value={filters.projects || []}
            onChange={(e) => {
              // Get direct access to the dedicated project filter setter
              const setProjectFilters = useDeveloperQualityStore.getState().setProjectFilters
              
              // Create a new array from the selected values
              const newProjects = Array.from(e.target.value)
              
              console.log('Project filter changing to:', newProjects)
              
              // First, update through normal channels for UI consistency
              handleFilterChange('projects', newProjects)
              
              // Use the dedicated project filter setter to ensure change is detected
              console.log('Using dedicated setProjectFilters with:', newProjects)
              setProjectFilters(newProjects)
            }}
            input={<OutlinedInput label="Projects" />}
            renderValue={renderChips}
            MenuProps={{
              PaperProps: {
                style: {
                  maxHeight: 224,
                  width: 250,
                },
              },
            }}
          >
            {filterOptions.projects?.map((project) => (
              <MenuItem key={project} value={project}>
                {project}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        {/* Issue Type Filter */}
        <FormControl 
          fullWidth
          disabled={isLoading}
          sx={{ minWidth: 180 }}
        >
          <InputLabel>Issue Types</InputLabel>
          <Select
            multiple
            value={filters.issueTypes || []}
            onChange={(e) => handleFilterChange('issueTypes', e.target.value)}
            input={<OutlinedInput label="Issue Types" />}
            renderValue={renderChips}
            MenuProps={{
              PaperProps: {
                style: {
                  maxHeight: 224,
                  width: 250,
                },
              },
            }}
          >
            {filterOptions.issueTypes?.map((type) => (
              <MenuItem key={type} value={type}>
                {type}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        {/* Severity Filter */}
        <FormControl 
          fullWidth
          disabled={isLoading}
          sx={{ minWidth: 180 }}
        >
          <InputLabel>Severities</InputLabel>
          <Select
            multiple
            value={filters.severities || []}
            onChange={(e) => handleFilterChange('severities', e.target.value)}
            input={<OutlinedInput label="Severities" />}
            renderValue={renderChips}
            MenuProps={{
              PaperProps: {
                style: {
                  maxHeight: 224,
                  width: 250,
                },
              },
            }}
          >
            {filterOptions.severities?.map((severity) => (
              <MenuItem key={severity} value={severity}>
                {severity}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        {/* Root Causes Filter */}
        <FormControl 
          fullWidth
          disabled={isLoading}
          sx={{ minWidth: 180 }}
        >
          <InputLabel>Root Causes</InputLabel>
          <Select
            multiple
            value={filters.rootCauses || []}
            onChange={(e) => handleFilterChange('rootCauses', e.target.value)}
            input={<OutlinedInput label="Root Causes" />}
            renderValue={renderChips}
            MenuProps={{
              PaperProps: {
                style: {
                  maxHeight: 224,
                  width: 250,
                },
              },
            }}
          >
            {filterOptions.rootCauses?.map((rootCause) => (
              <MenuItem key={rootCause} value={rootCause}>
                {rootCause}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
    </Paper>
  )
})

// ✅ REQUIRED: PropTypes
FilterPanel.propTypes = {
  filters: PropTypes.shape({
    developers: PropTypes.arrayOf(PropTypes.string),
    projects: PropTypes.arrayOf(PropTypes.string),
    issueTypes: PropTypes.arrayOf(PropTypes.string),
    statuses: PropTypes.arrayOf(PropTypes.string),
    severities: PropTypes.arrayOf(PropTypes.string),
    rootCauses: PropTypes.arrayOf(PropTypes.string),
    dateRange: PropTypes.object,
    timeframe: PropTypes.string,
    statusFilter: PropTypes.arrayOf(PropTypes.string)
  }).isRequired,
  onFiltersChange: PropTypes.func.isRequired,
  filterOptions: PropTypes.shape({
    developers: PropTypes.arrayOf(PropTypes.string),
    projects: PropTypes.arrayOf(PropTypes.string),
    issueTypes: PropTypes.arrayOf(PropTypes.string),
    severities: PropTypes.arrayOf(PropTypes.string),
    rootCauses: PropTypes.arrayOf(PropTypes.string),
    statuses: PropTypes.arrayOf(PropTypes.string)
  }).isRequired,
  isLoading: PropTypes.bool,
  // Backward compatibility props
  onTimePeriodChange: PropTypes.func,
  onStatusFilterChange: PropTypes.func
}

export default FilterPanel 