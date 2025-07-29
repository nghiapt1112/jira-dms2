import React, { useCallback, useMemo, useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { memberConfiguration } from '../../../../constants/memberConfiguration'
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
  Paper,
  Switch,
  FormControlLabel,
  Autocomplete,
  TextField
} from '@mui/material'
import { Clear as ClearIcon, ShowChart, FilterList, TrendingUp, TrendingDown } from '@mui/icons-material'
// Direct store access
import { useDeveloperQualityStore } from '../../store/developerQualityStore'

const FilterPanel = React.memo(({ 
  filters, 
  onFiltersChange, 
  filterOptions, 
  isLoading = false,
  // Backward compatibility props
  onTimePeriodChange,
  onStatusFilterChange,
  // Performance controls props
  onPerformanceControlsChange
}) => {
  // Single project detection for performance controls (defined early for initial state)
  const isSingleProject = useMemo(() => {
    return filters?.projects?.length === 1
  }, [filters?.projects])
  
  // 1. Performance state - following .cursorrules hooks first pattern
  // Use Zustand store for showTargetLines instead of local state
  const { setFilters } = useDeveloperQualityStore()
  const showTargetLines = filters?.showTargetLines ?? true
  const [performanceFilter, setPerformanceFilter] = useState('all')
  
  const selectedProjectName = useMemo(() => {
    return isSingleProject ? filters.projects[0] : ''
  }, [isSingleProject, filters?.projects])
  
  // Auto-enable target lines when single project is selected
  useEffect(() => {
    if (isSingleProject && !showTargetLines) {
      setFilters(prev => ({ ...prev, showTargetLines: true }))
      if (onPerformanceControlsChange) {
        onPerformanceControlsChange({
          showTargetLines: true,
          performanceFilter: performanceFilter
        })
      }
    }
  }, [isSingleProject, selectedProjectName, showTargetLines, performanceFilter, onPerformanceControlsChange, setFilters])
  
  // Notify parent of initial performance controls state
  useEffect(() => {
    if (onPerformanceControlsChange && isSingleProject) {
      onPerformanceControlsChange({
        showTargetLines,
        performanceFilter
      })
    }
  }, [onPerformanceControlsChange, isSingleProject, showTargetLines, performanceFilter])
  
  // 2. Memoized values
  const hasActiveFilters = useMemo(() => {
    // Only count arrays with items and ignore default values like timeframe
    const checkableFilters = ['developers', 'projects', 'issueTypes', 'statuses', 'severities', 'rootCauses', 'statusFilter']
    return checkableFilters.some(key => {
      const filter = filters[key]
      return Array.isArray(filter) && filter.length > 0
    })
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
    
    
    // Force filter change by creating new array reference for arrays
    if (Array.isArray(value)) {
      const newValue = [...value] // Create a new array reference

      
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
      issueTypes: memberConfiguration.issueTypes || [],
      statuses: memberConfiguration.filterDefaults.statusFilter || [],
      severities: [],
      rootCauses: [],
      dateRange: {
        startDate: null,
        endDate: null
      },
      timeframe: 'month',
      statusFilter: memberConfiguration.filterDefaults.statusFilter
    })
  }, [onFiltersChange])
  
  const renderChips = useCallback((selected, maxVisible = 3) => {
    if (!selected || selected.length === 0) return null
    
    const visibleItems = selected.slice(0, maxVisible)
    const hiddenCount = selected.length - maxVisible
    
    return (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, alignItems: 'center' }}>
        {visibleItems.map((value) => (
          <Chip 
            key={value} 
            label={value} 
            size="small"
            sx={{ 
              fontSize: { xs: '0.75rem', sm: '0.8125rem' },
              height: { xs: 24, sm: 28 },
              maxWidth: 120,
              '& .MuiChip-label': {
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }
            }}
          />
        ))}
        {hiddenCount > 0 && (
          <Chip 
            label={`+${hiddenCount} more`}
            size="small"
            variant="outlined"
            sx={{ 
              fontSize: { xs: '0.75rem', sm: '0.8125rem' },
              height: { xs: 24, sm: 28 },
              color: 'text.secondary',
              borderColor: 'text.secondary'
            }}
          />
        )}
      </Box>
    )
  }, [])
  
  // Performance controls callbacks
  const handleShowTargetLinesChange = useCallback((checked) => {
    setFilters(prev => ({ ...prev, showTargetLines: checked }))
    if (onPerformanceControlsChange) {
      onPerformanceControlsChange({
        showTargetLines: checked,
        performanceFilter: checked ? performanceFilter : 'all'
      })
    }
  }, [performanceFilter, onPerformanceControlsChange, setFilters])
  
  const handlePerformanceFilterChange = useCallback((newFilter) => {
    setPerformanceFilter(newFilter)
    if (onPerformanceControlsChange) {
      onPerformanceControlsChange({
        showTargetLines,
        performanceFilter: newFilter
      })
    }
  }, [showTargetLines, onPerformanceControlsChange])
  
  // Generic function to sort filter options with three-tier hierarchy:
  // 1. filterDefaults.availableStatuses always on top
  // 2. Unselected items (excluding availableStatuses)
  // 3. Selected items sorted alphabetically
  const getSortedOptions = useCallback((options, selectedValues, availableStatuses = []) => {
    if (!options?.length) return []
    
    const allOptions = Array.from(options)
    
    // Separate selected and unselected
    const selected = allOptions.filter(option => selectedValues.includes(option))
    const unselected = allOptions.filter(option => !selectedValues.includes(option))
    
    // Sort selected alphabetically
    const sortedSelected = selected.sort((a, b) => a.localeCompare(b))
    
    // For statuses, use three-tier hierarchy
    if (availableStatuses.length > 0) {
      // 1. Available statuses always on top (in their original order)
      const availableOnTop = availableStatuses.filter(status => allOptions.includes(status))
      
      // 2. Unselected items (excluding available statuses) - also sorted alphabetically
      const unselectedExcludingAvailable = unselected
        .filter(option => !availableStatuses.includes(option))
        .sort((a, b) => a.localeCompare(b))
      
      // 3. Selected items sorted alphabetically
      return [...availableOnTop, ...unselectedExcludingAvailable, ...sortedSelected]
    }
    
    // For other filters, use two-tier hierarchy (unselected first, then selected)
    return [...unselected, ...sortedSelected]
  }, [])

  // Sort statuses with three-tier hierarchy: availableStatuses on top, then unselected, then selected alphabetically
  const sortedStatuses = useMemo(() => {
    const currentSelected = filters.statuses || memberConfiguration.filterDefaults.statusFilter || []
    const availableStatuses = memberConfiguration.filterDefaults.availableStatuses || []
    return getSortedOptions(filterOptions?.statuses, currentSelected, availableStatuses)
  }, [filterOptions?.statuses, filters.statuses, getSortedOptions])

  // Sort developers with unselected on top and selected sorted alphabetically
  const sortedDevelopers = useMemo(() => {
    return getSortedOptions(filterOptions?.developers, filters.developers || [])
  }, [filterOptions?.developers, filters.developers, getSortedOptions])

  // Sort projects with unselected on top and selected sorted alphabetically
  const sortedProjects = useMemo(() => {
    return getSortedOptions(filterOptions?.projects, filters.projects || [])
  }, [filterOptions?.projects, filters.projects, getSortedOptions])

  // Sort issue types with unselected on top and selected sorted alphabetically
  const sortedIssueTypes = useMemo(() => {
    return getSortedOptions(filterOptions?.issueTypes, filters.issueTypes || [])
  }, [filterOptions?.issueTypes, filters.issueTypes, getSortedOptions])

  // Sort severities with unselected on top and selected sorted alphabetically
  const sortedSeverities = useMemo(() => {
    return getSortedOptions(filterOptions?.severities, filters.severities || [])
  }, [filterOptions?.severities, filters.severities, getSortedOptions])

  // Sort root causes with unselected on top and selected sorted alphabetically
  const sortedRootCauses = useMemo(() => {
    return getSortedOptions(filterOptions?.rootCauses, filters.rootCauses || [])
  }, [filterOptions?.rootCauses, filters.rootCauses, getSortedOptions])

  // Performance filter options
  const performanceFilterOptions = useMemo(() => [
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
  ], [])
  
  // 4. Early returns
  if (!filterOptions) {

    return null
  }

  // Debug filterOptions (only when empty)
  if (filterOptions?.developers?.length === 0) {

  }
  
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
            value={filters.statuses || memberConfiguration.filterDefaults.statusFilter || []}
            onChange={(e) => {
              handleFilterChange('statuses', e.target.value)
              if (onStatusFilterChange) {
                onStatusFilterChange(e.target.value)
              }
            }}
            input={<OutlinedInput label="Statuses" />}
            renderValue={(selected) => renderChips(selected, 2)}
            MenuProps={{
              PaperProps: {
                style: {
                  maxHeight: 400,
                  width: 'auto',
                  minWidth: 300,
                  zIndex: 9999,
                },
              },
              anchorOrigin: {
                vertical: 'bottom',
                horizontal: 'left',
              },
              transformOrigin: {
                vertical: 'top',
                horizontal: 'left',
              },
            }}
          >
            {sortedStatuses.length > 0 ? (
              sortedStatuses.map((status) => (
                <MenuItem key={status} value={status}>
                  {status}
                </MenuItem>
              ))
            ) : (
              <MenuItem disabled>
                No statuses available
              </MenuItem>
            )}
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
            renderValue={(selected) => renderChips(selected, 2)}
            MenuProps={{
              PaperProps: {
                style: {
                  maxHeight: 400,
                  width: 'auto',
                  minWidth: 300,
                  zIndex: 9999,
                },
              },
              anchorOrigin: {
                vertical: 'bottom',
                horizontal: 'left',
              },
              transformOrigin: {
                vertical: 'top',
                horizontal: 'left',
              },
            }}
          >
            {sortedDevelopers.length > 0 ? (
              sortedDevelopers.map((developer) => (
                <MenuItem key={developer} value={developer}>
                  {developer}
                </MenuItem>
              ))
            ) : (
              <MenuItem disabled>
                No developers available
              </MenuItem>
            )}
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
              
        
              
              // First, update through normal channels for UI consistency
              handleFilterChange('projects', newProjects)
              
              // Use the dedicated project filter setter to ensure change is detected
        
              setProjectFilters(newProjects)
            }}
            input={<OutlinedInput label="Projects" />}
            renderValue={(selected) => renderChips(selected, 2)}
            MenuProps={{
              PaperProps: {
                style: {
                  maxHeight: 400,
                  width: 'auto',
                  minWidth: 300,
                  zIndex: 9999,
                },
              },
              anchorOrigin: {
                vertical: 'bottom',
                horizontal: 'left',
              },
              transformOrigin: {
                vertical: 'top',
                horizontal: 'left',
              },
            }}
          >
            {sortedProjects.length > 0 ? (
              sortedProjects.map((project) => (
                <MenuItem key={project} value={project}>
                  {project}
                </MenuItem>
              ))
            ) : (
              <MenuItem disabled>
                No projects available
              </MenuItem>
            )}
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
                  maxHeight: 400,
                  width: 'auto',
                  minWidth: 300,
                  zIndex: 9999,
                },
              },
              anchorOrigin: {
                vertical: 'bottom',
                horizontal: 'left',
              },
              transformOrigin: {
                vertical: 'top',
                horizontal: 'left',
              },
            }}
          >
            {sortedIssueTypes.length > 0 ? (
              sortedIssueTypes.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))
            ) : (
              <MenuItem disabled>
                No issue types available
              </MenuItem>
            )}
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
                  maxHeight: 400,
                  width: 'auto',
                  minWidth: 300,
                  zIndex: 9999,
                },
              },
              anchorOrigin: {
                vertical: 'bottom',
                horizontal: 'left',
              },
              transformOrigin: {
                vertical: 'top',
                horizontal: 'left',
              },
            }}
          >
            {sortedSeverities.length > 0 ? (
              sortedSeverities.map((severity) => (
                <MenuItem key={severity} value={severity}>
                  {severity}
                </MenuItem>
              ))
            ) : (
              <MenuItem disabled>
                No severities available
              </MenuItem>
            )}
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
                  maxHeight: 400,
                  width: 'auto',
                  minWidth: 300,
                  zIndex: 9999,
                },
              },
              anchorOrigin: {
                vertical: 'bottom',
                horizontal: 'left',
              },
              transformOrigin: {
                vertical: 'top',
                horizontal: 'left',
              },
            }}
          >
            {sortedRootCauses.length > 0 ? (
              sortedRootCauses.map((rootCause) => (
                <MenuItem key={rootCause} value={rootCause}>
                  {rootCause}
                </MenuItem>
              ))
            ) : (
              <MenuItem disabled>
                No root causes available
              </MenuItem>
            )}
          </Select>
        </FormControl>
        
        {/* Performance Controls - Only show when one project is selected */}
        {isSingleProject && (
          <>
            {/* Performance Toggle */}
            <FormControl 
              fullWidth
              sx={{ minWidth: 180 }}
            >
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                minHeight: 56 // Match other FormControl heights
              }}>
                <ShowChart 
                  color={isLoading ? 'disabled' : 'primary'} 
                  fontSize="small" 
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={showTargetLines}
                      onChange={(event) => handleShowTargetLinesChange(event.target.checked)}
                      disabled={isLoading}
                      size="small"
                      color="primary"
                    />
                  }
                  label={
                    <Typography 
                      variant="body2" 
                      color={isLoading ? 'text.disabled' : 'text.primary'}
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
                
                {selectedProjectName && (
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
                    for {selectedProjectName}
                  </Typography>
                )}
              </Box>
            </FormControl>
            
            {/* Performance Filter */}
            <FormControl 
              fullWidth
              disabled={isLoading || !showTargetLines}
              sx={{ minWidth: 180 }}
            >
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                minHeight: 56
              }}>
                <FilterList 
                  color={isLoading || !showTargetLines ? 'disabled' : 'primary'} 
                  fontSize="small" 
                />
                
                <Autocomplete
                  value={performanceFilterOptions.find(option => option.value === performanceFilter) || performanceFilterOptions[0]}
                  onChange={(event, newValue) => {
                    if (newValue) {
                      handlePerformanceFilterChange(newValue.value)
                    }
                  }}
                  options={performanceFilterOptions}
                  getOptionLabel={(option) => option.label}
                  disabled={isLoading || !showTargetLines}
                  disableClearable
                  size="small"
                  sx={{ 
                    flex: 1,
                    '& .MuiOutlinedInput-root': {
                      bgcolor: (isLoading || !showTargetLines) ? 'action.disabledBackground' : 'background.paper'
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
                    const { key, ...otherProps } = props
                    return (
                      <Box component="li" key={key} {...otherProps} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
                />
              </Box>
            </FormControl>
          </>
        )}
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
    dateRange: PropTypes.shape({
      startDate: PropTypes.instanceOf(Date),
      endDate: PropTypes.instanceOf(Date)
    }),
    timeframe: PropTypes.oneOf(['week', 'month', 'quarter']),
    statusFilter: PropTypes.arrayOf(PropTypes.string)
  }).isRequired,
  onFiltersChange: PropTypes.func.isRequired,
  filterOptions: PropTypes.shape({
    developers: PropTypes.arrayOf(PropTypes.string).isRequired,
    projects: PropTypes.arrayOf(PropTypes.string).isRequired,
    issueTypes: PropTypes.arrayOf(PropTypes.string).isRequired,
    severities: PropTypes.arrayOf(PropTypes.string).isRequired,
    rootCauses: PropTypes.arrayOf(PropTypes.string).isRequired,
    statuses: PropTypes.arrayOf(PropTypes.string).isRequired
  }).isRequired,
  isLoading: PropTypes.bool,
  // Backward compatibility props
  onTimePeriodChange: PropTypes.func,
  onStatusFilterChange: PropTypes.func,
  // Performance controls props
  onPerformanceControlsChange: PropTypes.func
}

FilterPanel.displayName = 'FilterPanel'

export default FilterPanel 