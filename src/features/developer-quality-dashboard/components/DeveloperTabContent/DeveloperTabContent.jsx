import React, { useMemo } from 'react'
import PropTypes from 'prop-types'
import { Grid, Box, Paper, Typography } from '@mui/material'
import { Person as PersonIcon } from '@mui/icons-material'

// Import developer-focused components
import DeveloperDetailPanel from '../DeveloperDetailPanel'
import BugTrendAnalysis from '../BugTrendAnalysis'
import RootCauseAnalysis from '../RootCauseAnalysis'

/**
 * DeveloperTabContent - Developer-focused dashboard layout
 * 
 * Optimized workflow for individual developer analysis:
 * - Individual developer metrics (DeveloperDetailPanel when single developer selected)
 * - Shared analytics (BugTrendAnalysis, RootCauseAnalysis) in developer context
 * - Guidance for developer selection when needed
 * 
 * Layout Strategy:
 * - Primary section: DeveloperDetailPanel (conditional on single developer selection)
 * - Supporting analytics: BugTrendAnalysis + RootCauseAnalysis (always visible)
 * - User guidance: Help text when no single developer is selected
 * 
 * @param {Object} props - Component props
 * @param {Object} props.dashboardData - Filtered data, filters, and options
 * @param {Object} props.dashboardActions - Event handlers
 * @param {Object} props.dashboardState - Component state
 * @returns {JSX.Element} Developer tab content with optimized layout
 */
const DeveloperTabContent = React.memo(({
  dashboardData,
  dashboardActions,
  dashboardState
}) => {
  // 1. Extract data and state
  const { filteredData, filters } = dashboardData
  const { selectedDeveloper } = dashboardState

  // 2. Determine if single developer is selected
  const isSingleDeveloperSelected = useMemo(() => {
    return filters.developers && filters.developers.length === 1
  }, [filters.developers])

  const selectedDeveloperName = useMemo(() => {
    return isSingleDeveloperSelected ? filters.developers[0] : null
  }, [isSingleDeveloperSelected, filters.developers])

  // 3. Memoized grid configurations for consistent responsive design
  const gridConfig = useMemo(() => ({
    // Developer detail panel - full width when shown
    primary: { xs: 12 },
    // Supporting analytics - balanced on medium+ screens
    supporting: { xs: 12, md: 6 },
    // Full-width components
    fullWidth: { xs: 12 }
  }), [])

  // 4. Render developer-focused layout
  return (
    <Grid container spacing={{ xs: 2, sm: 3 }}>
      {/* Developer Selection Guidance */}
      {!isSingleDeveloperSelected && (
        <Grid item {...gridConfig.fullWidth}>
          <Paper sx={{ p: 3, mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <PersonIcon color="primary" />
              <Typography variant="h6">
                Individual Developer Analysis
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              Select a single developer from the filters above to view detailed individual metrics and analysis.
              The charts below show developer-focused trends across all selected developers.
            </Typography>
          </Paper>
        </Grid>
      )}

      {/* Primary Developer Analysis Section */}
      
      {/* Developer Detail Panel - Conditional based on single developer selection */}
      {isSingleDeveloperSelected && selectedDeveloperName && (
        <Grid item {...gridConfig.primary}>
          <DeveloperDetailPanel
            developerName={selectedDeveloperName}
            metrics={filteredData.filteredMetrics}
            filteredData={filteredData}
            statusFilter={filters.statusFilter}
            timeframe={filters.timeframe || 'month'}
          />
        </Grid>
      )}

      {/* Supporting Analytics Section - Developer Context */}
      
      {/* Bug Trend Analysis - Developer context */}
      <Grid item {...gridConfig.supporting}>
        <BugTrendAnalysis
          data={{
            ...filteredData.filteredChartData.bugTrendChart,
            config: {
              timePeriod: filters?.timeframe || 'month',
              periodKey: filters?.timeframe === 'week' ? 'week' : 'month'
            }
          }}
          metrics={filteredData.filteredMetrics.bugAnalysis}
          title={isSingleDeveloperSelected && selectedDeveloperName 
            ? `Bug Trends: ${selectedDeveloperName}` 
            : 'Developer Bug Trends'}
          context="developer"
        />
      </Grid>

      {/* Root Cause Analysis - Developer context */}
      <Grid item {...gridConfig.supporting}>
        <RootCauseAnalysis
          data={filteredData.filteredChartData.rootCauseChart}
          metrics={filteredData.filteredMetrics.rootCauseAnalysis}
          title={isSingleDeveloperSelected && selectedDeveloperName 
            ? `Root Causes: ${selectedDeveloperName}` 
            : 'Developer Root Cause Analysis'}
          context="developer"
        />
      </Grid>
    </Grid>
  )
})

// PropTypes validation
DeveloperTabContent.propTypes = {
  dashboardData: PropTypes.shape({
    filteredData: PropTypes.shape({
      filteredChartData: PropTypes.shape({
        bugTrendChart: PropTypes.object.isRequired,
        rootCauseChart: PropTypes.object.isRequired
      }).isRequired,
      filteredMetrics: PropTypes.shape({
        bugAnalysis: PropTypes.object.isRequired,
        rootCauseAnalysis: PropTypes.object.isRequired,
        bugRateAnalysis: PropTypes.object
      }).isRequired
    }).isRequired,
    filters: PropTypes.shape({
      projects: PropTypes.arrayOf(PropTypes.string),
      developers: PropTypes.arrayOf(PropTypes.string),
      timeframe: PropTypes.oneOf(['week', 'month', 'quarter']),
      statusFilter: PropTypes.arrayOf(PropTypes.string)
    }).isRequired,
    filterOptions: PropTypes.object.isRequired
  }).isRequired,
  dashboardActions: PropTypes.shape({
    onFiltersChange: PropTypes.func.isRequired,
    onTimePeriodChange: PropTypes.func.isRequired,
    onStatusFilterChange: PropTypes.func.isRequired,
    onPerformanceControlsChange: PropTypes.func.isRequired
  }).isRequired,
  dashboardState: PropTypes.shape({
    selectedDeveloper: PropTypes.string,
    selectedSingleProject: PropTypes.bool.isRequired,
    performanceControls: PropTypes.shape({
      showTargetLines: PropTypes.bool.isRequired,
      performanceFilter: PropTypes.oneOf(['all', 'under', 'over']).isRequired
    }).isRequired,
    isLoading: PropTypes.bool
  }).isRequired
}

DeveloperTabContent.displayName = 'DeveloperTabContent'

export default DeveloperTabContent