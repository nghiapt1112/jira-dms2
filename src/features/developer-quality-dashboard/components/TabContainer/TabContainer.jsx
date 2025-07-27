import React, { useMemo, useCallback } from 'react'
import PropTypes from 'prop-types'
import { Box, Tabs, Tab, Paper } from '@mui/material'
import { Group as GroupIcon, Person as PersonIcon } from '@mui/icons-material'
import TeamTabContent from '../TeamTabContent'
import DeveloperTabContent from '../DeveloperTabContent'

// TabPanel helper component for consistent rendering
const TabPanel = React.memo(({ children, value, index, ...other }) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`dashboard-tabpanel-${index}`}
    aria-labelledby={`dashboard-tab-${index}`}
    {...other}
  >
    {value === index && (
      <Box sx={{ mt: 3 }}>
        {children}
      </Box>
    )}
  </div>
))

TabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.number.isRequired,
  value: PropTypes.number.isRequired
}

TabPanel.displayName = 'TabPanel'

/**
 * TabContainer - Main tab orchestrator for Developer Quality Dashboard
 * 
 * Manages tab switching and content rendering with optimized performance:
 * - Only renders active tab content
 * - Memoized tab content components
 * - Responsive tab design
 * - Structured prop distribution
 * 
 * @param {Object} props - Component props
 * @param {number} props.activeTab - Currently active tab index (0: Team, 1: Developer)
 * @param {Function} props.onTabChange - Tab change handler
 * @param {Object} props.dashboardData - All dashboard data (filteredData, filters, etc.)
 * @param {Object} props.dashboardActions - All event handlers
 * @param {Object} props.dashboardState - Component state (selectedDeveloper, etc.)
 * @returns {JSX.Element} Tab container with content
 */
const TabContainer = React.memo(({
  activeTab,
  onTabChange,
  dashboardData,
  dashboardActions,
  dashboardState
}) => {
  // 1. Memoized values
  const tabProps = useMemo(() => ({
    sx: {
      borderBottom: 1,
      borderColor: 'divider',
      '& .MuiTab-root': {
        fontSize: { xs: '0.875rem', sm: '1rem' },
        minHeight: { xs: 48, sm: 56 },
        textTransform: 'none',
        fontWeight: 600
      }
    }
  }), [])

  // 2. Callbacks
  const handleTabChange = useCallback((event, newValue) => {
    onTabChange(newValue)
  }, [onTabChange])

  // 3. Tab accessibility props
  const getTabProps = useCallback((index) => ({
    id: `dashboard-tab-${index}`,
    'aria-controls': `dashboard-tabpanel-${index}`
  }), [])

  // 4. Team content - Phase 2: Real TeamTabContent component
  const renderTeamContent = useMemo(() => {
    return (
      <TeamTabContent
        dashboardData={dashboardData}
        dashboardActions={dashboardActions}
        dashboardState={dashboardState}
      />
    )
  }, [dashboardData, dashboardActions, dashboardState])

  // 5. Developer content - Phase 3: Real DeveloperTabContent component
  const renderDeveloperContent = useMemo(() => {
    return (
      <DeveloperTabContent
        dashboardData={dashboardData}
        dashboardActions={dashboardActions}
        dashboardState={dashboardState}
      />
    )
  }, [dashboardData, dashboardActions, dashboardState])

  // 6. Render
  return (
    <Box sx={{ width: '100%' }}>
      {/* Tab Navigation */}
      <Paper elevation={0} sx={{ backgroundColor: 'transparent' }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="fullWidth"
          {...tabProps}
        >
          <Tab
            label="Team"
            icon={<GroupIcon />}
            iconPosition="start"
            sx={{ gap: 1 }}
            {...getTabProps(0)}
          />
          <Tab
            label="Developer"
            icon={<PersonIcon />}
            iconPosition="start"
            sx={{ gap: 1 }}
            {...getTabProps(1)}
          />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      <TabPanel value={activeTab} index={0}>
        {renderTeamContent}
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        {renderDeveloperContent}
      </TabPanel>
    </Box>
  )
})

// PropTypes validation
TabContainer.propTypes = {
  activeTab: PropTypes.number.isRequired,
  onTabChange: PropTypes.func.isRequired,
  dashboardData: PropTypes.shape({
    filteredData: PropTypes.object.isRequired,
    filters: PropTypes.object.isRequired,
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
    performanceControls: PropTypes.object.isRequired,
    isLoading: PropTypes.bool
  }).isRequired
}

TabContainer.displayName = 'TabContainer'

export default TabContainer