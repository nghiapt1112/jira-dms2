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

const FilterPanel = React.memo(({ 
  filters, 
  onFiltersChange, 
  filterOptions, 
  isLoading = false 
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
    if (filters.severities?.length > 0) {
      activeFilters.push(`${filters.severities.length} severit${filters.severities.length > 1 ? 'ies' : 'y'}`)
    }
    return activeFilters
  }, [filters])
  
  // 3. Callbacks
  const handleFilterChange = useCallback((filterType, value) => {
    onFiltersChange(prev => ({
      ...prev,
      [filterType]: value
    }))
  }, [onFiltersChange])
  
  const handleClearAllFilters = useCallback(() => {
    onFiltersChange({
      developers: [],
      projects: [],
      issueTypes: [],
      severities: [],
      dateRange: null
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
          md: 'repeat(4, 1fr)'
        },
        gap: { xs: 2, sm: 3 },
        alignItems: 'start'
      }}>
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
            onChange={(e) => handleFilterChange('projects', e.target.value)}
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
    severities: PropTypes.arrayOf(PropTypes.string),
    dateRange: PropTypes.object
  }).isRequired,
  onFiltersChange: PropTypes.func.isRequired,
  filterOptions: PropTypes.shape({
    developers: PropTypes.arrayOf(PropTypes.string),
    projects: PropTypes.arrayOf(PropTypes.string),
    issueTypes: PropTypes.arrayOf(PropTypes.string),
    severities: PropTypes.arrayOf(PropTypes.string)
  }).isRequired,
  isLoading: PropTypes.bool
}

export default FilterPanel 