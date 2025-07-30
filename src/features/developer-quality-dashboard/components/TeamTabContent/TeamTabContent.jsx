import React, { useMemo } from 'react'
import PropTypes from 'prop-types'
import { Grid, Box } from '@mui/material'


// Import team-focused components
import TeamContributionChart from '../TeamContributionChart'
import ProjectTeamPerformance from '../ProjectTeamPerformance'
import BugRateAnalysisTable from '../BugRateAnalysisTable'
import RawJsonViewer from '../RawJsonViewer'
import { 
  BugCreatedResolvedChart, 
  BugStatusPieChart, 
  BugTypePieChart, 
  BugRootCauseBarChart 
} from '../BugAnalysisCharts'
import { useBugAnalysis } from '../../hooks/useBugAnalysis'
import { convertProjectNamesToKeys } from '../../utils/projectMapping'
// Removed: BugTrendAnalysis, BugStatusChart, BugStatusDistributionChart, BugTypeDistributionChart, RootCauseAnalysis

/**
 * TeamTabContent - Team-focused dashboard with bug analysis charts
 * 
 * Comprehensive workflow for team analysis:
 * - Team performance metrics (TeamContributionChart)
 * - Bug analysis charts (Created/Resolved, Status, Type, Root Cause)
 * - Team data table (BugRateAnalysisTable)
 * - Raw JSON data viewer
 * 
 * Layout Strategy:
 * - Primary charts: TeamContributionChart + Bug analysis charts
 * - Supporting charts: Status and Type pie charts
 * - Full-width table: BugRateAnalysisTable for detailed team data
 * - Full-width Raw JSON viewer for bug analysis data
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
  const { selectedSingleProject, performanceControls, debugOptions } = dashboardState

  // 2. Get bug analysis data with pre-processed chart data
  const projectKeys = useMemo(() => convertProjectNamesToKeys(filters.projects), [filters.projects])
  const { chartData: bugChartData, isLoading: bugDataLoading } = useBugAnalysis(projectKeys, filters.timeframe)

  // 2. Memoized grid configurations for 2-column responsive design
  const gridConfig = useMemo(() => ({
    // Column 1: Team contribution and detail (left column on lg+ screens)
    leftColumn: { xs: 12, lg: 6 },
    // Column 2: Bug analysis charts (right column on lg+ screens)  
    rightColumn: { xs: 12, lg: 6 },
    // Bug charts within right column (responsive within the column)
    bugChart: { xs: 12, md: 6 },
    // Full-width components
    fullWidth: { xs: 12 }
  }), [])



  // 3. Render 2-column responsive layout
  return (
    <Grid container spacing={{ xs: 2, sm: 3 }}>
      {/* Raw JSON Data Section - Full width - Show only if debug option is enabled */}
      {debugOptions?.showRawBugAnalysisJson && (
        <Grid item {...gridConfig.fullWidth}>
          <RawJsonViewer />
        </Grid>
      )}

      {/* Left Column: Team Contribution and Period Detail */}
      <Grid item {...gridConfig.leftColumn}>
        <Grid container spacing={{ xs: 2, sm: 3 }}>
          {/* Team Contribution Chart - Always visible, core team metric */}
          <Grid item xs={12}>
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
          {/* TODO: Team lead fixed to hide this chart. */}
          {false && (
            <Grid item xs={12}>
              <ProjectTeamPerformance
                data={filteredData.filteredChartData.teamContributionChart}
                metrics={filteredData.filteredMetrics}
                filters={filters}
                showTargetLines={performanceControls.showTargetLines}
                performanceFilter={performanceControls.performanceFilter}
              />
            </Grid>
          )}
        </Grid>
      </Grid>

      {/* Right Column: Bug Analysis Charts */}
      <Grid item {...gridConfig.rightColumn}>
        {bugChartData && !bugDataLoading && (
          <Grid container spacing={{ xs: 2, sm: 3 }}>
            {/* Line Chart: Created vs Resolved */}
            <Grid item {...gridConfig.bugChart}>
              <BugCreatedResolvedChart 
                chartData={bugChartData.lineChart}
                timeframe={filters.timeframe}
                title="Bugs Created vs Resolved"
              />
            </Grid>
            
            {/* Pie Chart: Status Distribution */}
            <Grid item {...gridConfig.bugChart}>
              <BugStatusPieChart 
                chartData={bugChartData.statusPie}
                title="Bug Status Distribution"
              />
            </Grid>
            
            {/* Pie Chart: Bug Type Distribution */}
            <Grid item {...gridConfig.bugChart}>
              <BugTypePieChart 
                chartData={bugChartData.typePie}
                title="Bug Type Distribution"
              />
            </Grid>
            
            {/* Bar Chart: Root Cause Analysis */}
            <Grid item {...gridConfig.bugChart}>
              <BugRootCauseBarChart 
                chartData={bugChartData.rootCauseBar}
                title="Bug Root Cause Analysis"
              />
            </Grid>
          </Grid>
        )}
      </Grid>

      {/* Bug Rate Analysis Table - Full width for comprehensive team data */}
      <Grid item {...gridConfig.fullWidth}>
        <BugRateAnalysisTable
          data={filteredData.filteredMetrics.bugRateAnalysis}
          onRowClick={(developer) => {
            // Future enhancement: Could auto-switch to Developer tab
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
        teamContributionChart: PropTypes.object.isRequired
        // Removed: bugTrendChart, bugStatusChart, rootCauseChart (charts removed but logic kept)
      }).isRequired,
      filteredMetrics: PropTypes.shape({
        teamContribution: PropTypes.object.isRequired,
        bugRateAnalysis: PropTypes.object.isRequired
        // Removed: bugAnalysis, rootCauseAnalysis, bugTypeAnalysis (charts removed but logic kept)
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
    isLoading: PropTypes.bool,
    debugOptions: PropTypes.shape({
      showRawBugAnalysisJson: PropTypes.bool
    })
  }).isRequired
}

TeamTabContent.displayName = 'TeamTabContent'

export default TeamTabContent