import React, { useMemo } from 'react'
import PropTypes from 'prop-types'
import { Grid } from '@mui/material'

// Import team-focused components
import TeamContributionChart from '../TeamContributionChart'
import ProjectTeamPerformance from '../ProjectTeamPerformance'
import BugTrendAnalysis from '../BugTrendAnalysis'
import RootCauseAnalysis from '../RootCauseAnalysis'
import BugRateAnalysisTable from '../BugRateAnalysisTable'

/**
 * TeamTabContent - Team-focused dashboard layout
 * 
 * Optimized workflow for team analysis:
 * - Team performance metrics (TeamContributionChart, ProjectTeamPerformance)
 * - Shared analytics (BugTrendAnalysis, RootCauseAnalysis) 
 * - Team data table (BugRateAnalysisTable)
 * 
 * Layout Strategy:
 * - Primary charts: TeamContributionChart + conditional ProjectTeamPerformance
 * - Supporting charts: BugTrendAnalysis + RootCauseAnalysis
 * - Full-width table: BugRateAnalysisTable for detailed team data
 * 
 * @param {Object} props - Component props
 * @param {Object} props.dashboardData - Filtered data, filters, and options
 * @param {Object} props.dashboardActions - Event handlers
 * @param {Object} props.dashboardState - Component state
 * @returns {JSX.Element} Team tab content with optimized layout
 */
const TeamTabContent = React.memo(({
  dashboardData,
  dashboardActions,
  dashboardState
}) => {
  // 1. Extract data and state
  const { filteredData, filters } = dashboardData
  const { onStatusFilterChange } = dashboardActions
  const { selectedSingleProject, performanceControls } = dashboardState

  // 2. Memoized grid configurations for consistent responsive design
  const gridConfig = useMemo(() => ({
    // Primary team charts - responsive layout
    primary: { xs: 12, lg: 6 },
    // Supporting analytics - balanced on medium+ screens
    supporting: { xs: 12, md: 6 },
    // Full-width components
    fullWidth: { xs: 12 }
  }), [])

  // 3. Render optimized team layout
  return (
    <Grid container spacing={{ xs: 2, sm: 3 }}>
      {/* Primary Team Performance Section */}
      
      {/* Team Contribution Chart - Always visible, core team metric */}
      <Grid item {...gridConfig.primary}>
        <TeamContributionChart
          data={filteredData.filteredChartData.teamContributionChart}
          metrics={filteredData.filteredMetrics.teamContribution}
          statusFilter={filters.statusFilter}
          onStatusFilterChange={onStatusFilterChange}
          filters={filters} // Pass complete filters object including projects
          showTargetLines={performanceControls.showTargetLines}
          performanceFilter={performanceControls.performanceFilter}
        />
      </Grid>

      {/* Project Team Performance - Conditional based on single project selection */}
      {selectedSingleProject && (
        <Grid item {...gridConfig.primary}>
          <ProjectTeamPerformance
            data={filteredData.filteredChartData.teamContributionChart}
            metrics={filteredData.filteredMetrics}
            filters={filters}
            showTargetLines={performanceControls.showTargetLines}
            performanceFilter={performanceControls.performanceFilter}
          />
        </Grid>
      )}

      {/* Supporting Analytics Section */}
      
      {/* Bug Trend Analysis - Team context */}
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
          context="team"
          title="Team Bug Trends"
        />
      </Grid>

      {/* Root Cause Analysis - Team context */}
      <Grid item {...gridConfig.supporting}>
        <RootCauseAnalysis
          data={filteredData.filteredChartData.rootCauseChart}
          metrics={filteredData.filteredMetrics.rootCauseAnalysis}
          context="team"
          title="Team Root Cause Analysis"
        />
      </Grid>

      {/* Detailed Team Data Section */}
      
      {/* Bug Rate Analysis Table - Full width for comprehensive team data */}
      <Grid item {...gridConfig.fullWidth}>
        <BugRateAnalysisTable
          data={filteredData.filteredMetrics.bugRateAnalysis}
          onRowClick={(developer) => {
            // Future enhancement: Could auto-switch to Developer tab
            console.log('Team view - Show details for developer:', developer)
          }}
          context="team"
        />
      </Grid>
    </Grid>
  )
})

// PropTypes validation
TeamTabContent.propTypes = {
  dashboardData: PropTypes.shape({
    filteredData: PropTypes.shape({
      filteredChartData: PropTypes.shape({
        teamContributionChart: PropTypes.object.isRequired,
        bugTrendChart: PropTypes.object.isRequired,
        rootCauseChart: PropTypes.object.isRequired
      }).isRequired,
      filteredMetrics: PropTypes.shape({
        teamContribution: PropTypes.object.isRequired,
        bugAnalysis: PropTypes.object.isRequired,
        rootCauseAnalysis: PropTypes.object.isRequired,
        bugRateAnalysis: PropTypes.object.isRequired
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

TeamTabContent.displayName = 'TeamTabContent'

export default TeamTabContent