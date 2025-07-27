import React from 'react'
import { render, screen } from '@testing-library/react'
import { ThemeProvider } from '@mui/material/styles'
import theme from '../../../../../theme'
import TeamTabContent from '../TeamTabContent'

// Helper function for rendering with theme
const renderWithTheme = (component) => 
  render(<ThemeProvider theme={theme}>{component}</ThemeProvider>)

// Mock chart components to avoid canvas issues
jest.mock('../../TeamContributionChart', () => {
  return function MockTeamContributionChart({ filters }) {
    return <div data-testid="team-contribution-chart">Team Contribution Chart - {filters.projects.join(',')}</div>
  }
})

jest.mock('../../ProjectTeamPerformance', () => {
  return function MockProjectTeamPerformance({ filters }) {
    return <div data-testid="project-team-performance">Project Team Performance - {filters.projects.join(',')}</div>
  }
})

jest.mock('../../BugTrendAnalysis', () => {
  return function MockBugTrendAnalysis({ context, title }) {
    return <div data-testid="bug-trend-analysis">{title || 'Bug Trend Analysis'} - {context}</div>
  }
})

jest.mock('../../RootCauseAnalysis', () => {
  return function MockRootCauseAnalysis({ context, title }) {
    return <div data-testid="root-cause-analysis">{title || 'Root Cause Analysis'} - {context}</div>
  }
})

jest.mock('../../BugRateAnalysisTable', () => {
  return function MockBugRateAnalysisTable({ context, onRowClick }) {
    return (
      <div data-testid="bug-rate-analysis-table">
        Bug Rate Analysis Table - {context}
        <button onClick={() => onRowClick('test-developer')}>Test Developer</button>
      </div>
    )
  }
})

// Mock data for testing
const mockDashboardData = {
  filteredData: {
    filteredChartData: {
      teamContributionChart: { data: [] },
      bugTrendChart: { data: [] },
      rootCauseChart: { data: [] }
    },
    filteredMetrics: {
      teamContribution: {},
      bugAnalysis: {},
      rootCauseAnalysis: {},
      bugRateAnalysis: {}
    }
  },
  filters: {
    projects: ['PROJ-A'],
    developers: [],
    timeframe: 'month',
    statusFilter: []
  },
  filterOptions: {
    projects: ['PROJ-A'],
    developers: ['john.doe'],
    issueTypes: ['Bug']
  }
}

const mockDashboardActions = {
  onFiltersChange: jest.fn(),
  onTimePeriodChange: jest.fn(),
  onStatusFilterChange: jest.fn(),
  onPerformanceControlsChange: jest.fn()
}

const mockDashboardState = {
  selectedDeveloper: null,
  selectedSingleProject: true,
  performanceControls: {
    showTargetLines: true,
    performanceFilter: 'all'
  },
  isLoading: false
}

describe('TeamTabContent', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders without crashing', () => {
    renderWithTheme(
      <TeamTabContent
        dashboardData={mockDashboardData}
        dashboardActions={mockDashboardActions}
        dashboardState={mockDashboardState}
      />
    )
    
    expect(screen.getByTestId('team-contribution-chart')).toBeInTheDocument()
  })

  it('always shows TeamContributionChart', () => {
    renderWithTheme(
      <TeamTabContent
        dashboardData={mockDashboardData}
        dashboardActions={mockDashboardActions}
        dashboardState={mockDashboardState}
      />
    )
    
    expect(screen.getByTestId('team-contribution-chart')).toBeInTheDocument()
    expect(screen.getByText(/Team Contribution Chart - PROJ-A/)).toBeInTheDocument()
  })

  it('shows ProjectTeamPerformance when single project is selected', () => {
    renderWithTheme(
      <TeamTabContent
        dashboardData={mockDashboardData}
        dashboardActions={mockDashboardActions}
        dashboardState={mockDashboardState}
      />
    )
    
    expect(screen.getByTestId('project-team-performance')).toBeInTheDocument()
    expect(screen.getByText(/Project Team Performance - PROJ-A/)).toBeInTheDocument()
  })

  it('hides ProjectTeamPerformance when multiple projects selected', () => {
    const multipleProjectsState = {
      ...mockDashboardState,
      selectedSingleProject: false
    }
    
    renderWithTheme(
      <TeamTabContent
        dashboardData={mockDashboardData}
        dashboardActions={mockDashboardActions}
        dashboardState={multipleProjectsState}
      />
    )
    
    expect(screen.queryByTestId('project-team-performance')).not.toBeInTheDocument()
  })

  it('renders all supporting analytics components', () => {
    renderWithTheme(
      <TeamTabContent
        dashboardData={mockDashboardData}
        dashboardActions={mockDashboardActions}
        dashboardState={mockDashboardState}
      />
    )
    
    // Bug Trend Analysis with team context
    expect(screen.getByTestId('bug-trend-analysis')).toBeInTheDocument()
    expect(screen.getByText('Team Bug Trends - team')).toBeInTheDocument()
    
    // Root Cause Analysis with team context  
    expect(screen.getByTestId('root-cause-analysis')).toBeInTheDocument()
    expect(screen.getByText('Team Root Cause Analysis - team')).toBeInTheDocument()
  })

  it('renders BugRateAnalysisTable with team context', () => {
    renderWithTheme(
      <TeamTabContent
        dashboardData={mockDashboardData}
        dashboardActions={mockDashboardActions}
        dashboardState={mockDashboardState}
      />
    )
    
    expect(screen.getByTestId('bug-rate-analysis-table')).toBeInTheDocument()
    expect(screen.getByText('Bug Rate Analysis Table - team')).toBeInTheDocument()
  })

  it('handles BugRateAnalysisTable row click', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
    
    renderWithTheme(
      <TeamTabContent
        dashboardData={mockDashboardData}
        dashboardActions={mockDashboardActions}
        dashboardState={mockDashboardState}
      />
    )
    
    const testButton = screen.getByText('Test Developer')
    testButton.click()
    
    expect(consoleSpy).toHaveBeenCalledWith('Team view - Show details for developer:', 'test-developer')
    
    consoleSpy.mockRestore()
  })

  it('passes correct props to TeamContributionChart', () => {
    renderWithTheme(
      <TeamTabContent
        dashboardData={mockDashboardData}
        dashboardActions={mockDashboardActions}
        dashboardState={mockDashboardState}
      />
    )
    
    // TeamContributionChart should receive the project filter
    expect(screen.getByText(/Team Contribution Chart - PROJ-A/)).toBeInTheDocument()
  })

  it('handles different timeframe configurations', () => {
    const weeklyData = {
      ...mockDashboardData,
      filters: {
        ...mockDashboardData.filters,
        timeframe: 'week'
      }
    }
    
    renderWithTheme(
      <TeamTabContent
        dashboardData={weeklyData}
        dashboardActions={mockDashboardActions}
        dashboardState={mockDashboardState}
      />
    )
    
    // Should still render all components with weekly timeframe
    expect(screen.getByTestId('team-contribution-chart')).toBeInTheDocument()
    expect(screen.getByTestId('bug-trend-analysis')).toBeInTheDocument()
  })

  it('handles empty project selection', () => {
    const noProjectData = {
      ...mockDashboardData,
      filters: {
        ...mockDashboardData.filters,
        projects: []
      }
    }
    
    const noProjectState = {
      ...mockDashboardState,
      selectedSingleProject: false
    }
    
    renderWithTheme(
      <TeamTabContent
        dashboardData={noProjectData}
        dashboardActions={mockDashboardActions}
        dashboardState={noProjectState}
      />
    )
    
    // Should still show main components but not ProjectTeamPerformance
    expect(screen.getByTestId('team-contribution-chart')).toBeInTheDocument()
    expect(screen.queryByTestId('project-team-performance')).not.toBeInTheDocument()
  })
})