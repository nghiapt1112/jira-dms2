import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { ThemeProvider } from '@mui/material/styles'
import theme from '../../../../../theme'
import TabContainer from '../TabContainer'

// Mock TeamTabContent to avoid chart.js dependencies in tests
jest.mock('../../TeamTabContent', () => {
  return function MockTeamTabContent() {
    return <div data-testid="team-tab-content">Team Tab Content - All existing dashboard components will be moved here</div>
  }
})

// Mock DeveloperTabContent to avoid chart.js dependencies in tests
jest.mock('../../DeveloperTabContent', () => {
  return function MockDeveloperTabContent() {
    return <div data-testid="developer-tab-content">Developer Tab Content - DeveloperDetailPanel and shared components</div>
  }
})

// Helper function for rendering with theme
const renderWithTheme = (component) => 
  render(<ThemeProvider theme={theme}>{component}</ThemeProvider>)

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
    projects: [],
    developers: [],
    timeframe: 'month'
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
  selectedSingleProject: false,
  performanceControls: {
    showTargetLines: false,
    performanceFilter: 'all'
  },
  isLoading: false
}

const mockOnTabChange = jest.fn()

describe('TabContainer', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders without crashing', () => {
    renderWithTheme(
      <TabContainer
        activeTab={0}
        onTabChange={mockOnTabChange}
        dashboardData={mockDashboardData}
        dashboardActions={mockDashboardActions}
        dashboardState={mockDashboardState}
      />
    )
    
    expect(screen.getByText('Team')).toBeInTheDocument()
    expect(screen.getByText('Developer')).toBeInTheDocument()
  })

  it('displays Team tab as active by default', () => {
    renderWithTheme(
      <TabContainer
        activeTab={0}
        onTabChange={mockOnTabChange}
        dashboardData={mockDashboardData}
        dashboardActions={mockDashboardActions}
        dashboardState={mockDashboardState}
      />
    )
    
    // Team tab should be selected (active)
    const teamTab = screen.getByRole('tab', { name: /team/i })
    expect(teamTab).toHaveAttribute('aria-selected', 'true')
    
    // Developer tab should not be selected
    const developerTab = screen.getByRole('tab', { name: /developer/i })
    expect(developerTab).toHaveAttribute('aria-selected', 'false')
  })

  it('switches to Developer tab when clicked', () => {
    renderWithTheme(
      <TabContainer
        activeTab={0}
        onTabChange={mockOnTabChange}
        dashboardData={mockDashboardData}
        dashboardActions={mockDashboardActions}
        dashboardState={mockDashboardState}
      />
    )
    
    const developerTab = screen.getByRole('tab', { name: /developer/i })
    fireEvent.click(developerTab)
    
    expect(mockOnTabChange).toHaveBeenCalledWith(1)
  })

  it('shows Team tab content when activeTab is 0', () => {
    renderWithTheme(
      <TabContainer
        activeTab={0}
        onTabChange={mockOnTabChange}
        dashboardData={mockDashboardData}
        dashboardActions={mockDashboardActions}
        dashboardState={mockDashboardState}
      />
    )
    
    // Should show Team tab content
    expect(screen.getByTestId('team-tab-content')).toBeInTheDocument()
    
    // Should not show Developer tab content
    expect(screen.queryByTestId('developer-tab-content')).not.toBeInTheDocument()
  })

  it('shows Developer tab content when activeTab is 1', () => {
    renderWithTheme(
      <TabContainer
        activeTab={1}
        onTabChange={mockOnTabChange}
        dashboardData={mockDashboardData}
        dashboardActions={mockDashboardActions}
        dashboardState={mockDashboardState}
      />
    )
    
    // Should show Developer tab content
    expect(screen.getByTestId('developer-tab-content')).toBeInTheDocument()
    
    // Should not show Team tab content
    expect(screen.queryByTestId('team-tab-content')).not.toBeInTheDocument()
  })

  it('has proper accessibility attributes', () => {
    renderWithTheme(
      <TabContainer
        activeTab={0}
        onTabChange={mockOnTabChange}
        dashboardData={mockDashboardData}
        dashboardActions={mockDashboardActions}
        dashboardState={mockDashboardState}
      />
    )
    
    // Check tab attributes
    const teamTab = screen.getByRole('tab', { name: /team/i })
    const developerTab = screen.getByRole('tab', { name: /developer/i })
    
    expect(teamTab).toHaveAttribute('id', 'dashboard-tab-0')
    expect(teamTab).toHaveAttribute('aria-controls', 'dashboard-tabpanel-0')
    
    expect(developerTab).toHaveAttribute('id', 'dashboard-tab-1')
    expect(developerTab).toHaveAttribute('aria-controls', 'dashboard-tabpanel-1')
    
    // Check tabpanel attributes
    const teamPanel = screen.getByRole('tabpanel')
    expect(teamPanel).toHaveAttribute('id', 'dashboard-tabpanel-0')
    expect(teamPanel).toHaveAttribute('aria-labelledby', 'dashboard-tab-0')
  })

  it('handles tab change with proper event handling', () => {
    renderWithTheme(
      <TabContainer
        activeTab={0}
        onTabChange={mockOnTabChange}
        dashboardData={mockDashboardData}
        dashboardActions={mockDashboardActions}
        dashboardState={mockDashboardState}
      />
    )
    
    // Click Developer tab (switching from Team to Developer)
    const developerTab = screen.getByRole('tab', { name: /developer/i })
    fireEvent.click(developerTab)
    expect(mockOnTabChange).toHaveBeenCalledWith(1)
    
    expect(mockOnTabChange).toHaveBeenCalledTimes(1)
  })

  it('renders with icons in tabs', () => {
    const { container } = renderWithTheme(
      <TabContainer
        activeTab={0}
        onTabChange={mockOnTabChange}
        dashboardData={mockDashboardData}
        dashboardActions={mockDashboardActions}
        dashboardState={mockDashboardState}
      />
    )
    
    // Icons should be present (MUI renders them as SVG elements)
    const svgElements = container.querySelectorAll('svg')
    expect(svgElements.length).toBeGreaterThanOrEqual(2) // Should have at least 2 icons (Group and Person)
  })
})