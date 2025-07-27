import React from 'react'
import { render, screen } from '@testing-library/react'
import { ThemeProvider } from '@mui/material/styles'
import theme from '../../../../../theme'
import DeveloperTabContent from '../DeveloperTabContent'

// Mock Chart.js to avoid canvas issues in tests
jest.mock('react-chartjs-2', () => ({
  Bar: () => <div data-testid="mock-bar-chart">Mock Bar Chart</div>,
  Line: () => <div data-testid="mock-line-chart">Mock Line Chart</div>
}))

// Mock child components to avoid complex dependencies
jest.mock('../../DeveloperDetailPanel', () => {
  return function MockDeveloperDetailPanel({ developerName }) {
    return <div data-testid="developer-detail-panel">Developer Detail Panel: {developerName}</div>
  }
})

jest.mock('../../BugTrendAnalysis', () => {
  return function MockBugTrendAnalysis({ title, context }) {
    return <div data-testid="bug-trend-analysis">{title} ({context})</div>
  }
})

jest.mock('../../RootCauseAnalysis', () => {
  return function MockRootCauseAnalysis({ title, context }) {
    return <div data-testid="root-cause-analysis">{title} ({context})</div>
  }
})

// Helper function for rendering with theme
const renderWithTheme = (component) => 
  render(<ThemeProvider theme={theme}>{component}</ThemeProvider>)

// Mock data for testing
const mockDashboardData = {
  filteredData: {
    filteredChartData: {
      bugTrendChart: { data: [] },
      rootCauseChart: { data: [] }
    },
    filteredMetrics: {
      bugAnalysis: {},
      rootCauseAnalysis: {},
      bugRateAnalysis: {}
    }
  },
  filters: {
    projects: [],
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
  selectedSingleProject: false,
  performanceControls: {
    showTargetLines: false,
    performanceFilter: 'all'
  },
  isLoading: false
}

describe('DeveloperTabContent', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders without crashing', () => {
    renderWithTheme(
      <DeveloperTabContent
        dashboardData={mockDashboardData}
        dashboardActions={mockDashboardActions}
        dashboardState={mockDashboardState}
      />
    )
    
    expect(screen.getByText('Individual Developer Analysis')).toBeInTheDocument()
    expect(screen.getByTestId('bug-trend-analysis')).toBeInTheDocument()
    expect(screen.getByTestId('root-cause-analysis')).toBeInTheDocument()
  })

  it('shows guidance message when no single developer is selected', () => {
    renderWithTheme(
      <DeveloperTabContent
        dashboardData={mockDashboardData}
        dashboardActions={mockDashboardActions}
        dashboardState={mockDashboardState}
      />
    )
    
    expect(screen.getByText(/Select a single developer from the filters above to view detailed individual metrics and analysis/)).toBeInTheDocument()
    expect(screen.queryByTestId('developer-detail-panel')).not.toBeInTheDocument()
  })

  it('shows DeveloperDetailPanel when single developer is selected', () => {
    const mockDataWithSingleDeveloper = {
      ...mockDashboardData,
      filters: {
        ...mockDashboardData.filters,
        developers: ['john.doe']
      }
    }

    renderWithTheme(
      <DeveloperTabContent
        dashboardData={mockDataWithSingleDeveloper}
        dashboardActions={mockDashboardActions}
        dashboardState={mockDashboardState}
      />
    )
    
    expect(screen.getByTestId('developer-detail-panel')).toBeInTheDocument()
    expect(screen.getByText('Developer Detail Panel: john.doe')).toBeInTheDocument()
    expect(screen.queryByText('Select a single developer from the filters above')).not.toBeInTheDocument()
  })

  it('shows developer-specific titles when single developer is selected', () => {
    const mockDataWithSingleDeveloper = {
      ...mockDashboardData,
      filters: {
        ...mockDashboardData.filters,
        developers: ['john.doe']
      }
    }

    renderWithTheme(
      <DeveloperTabContent
        dashboardData={mockDataWithSingleDeveloper}
        dashboardActions={mockDashboardActions}
        dashboardState={mockDashboardState}
      />
    )
    
    expect(screen.getByText('Bug Trends: john.doe (developer)')).toBeInTheDocument()
    expect(screen.getByText('Root Causes: john.doe (developer)')).toBeInTheDocument()
  })

  it('shows generic titles when multiple developers are selected', () => {
    const mockDataWithMultipleDevelopers = {
      ...mockDashboardData,
      filters: {
        ...mockDashboardData.filters,
        developers: ['john.doe', 'jane.smith']
      }
    }

    renderWithTheme(
      <DeveloperTabContent
        dashboardData={mockDataWithMultipleDevelopers}
        dashboardActions={mockDashboardActions}
        dashboardState={mockDashboardState}
      />
    )
    
    expect(screen.getByText('Developer Bug Trends (developer)')).toBeInTheDocument()
    expect(screen.getByText('Developer Root Cause Analysis (developer)')).toBeInTheDocument()
  })

  it('always shows shared analytics components', () => {
    renderWithTheme(
      <DeveloperTabContent
        dashboardData={mockDashboardData}
        dashboardActions={mockDashboardActions}
        dashboardState={mockDashboardState}
      />
    )
    
    // Shared components should always be visible regardless of developer selection
    expect(screen.getByTestId('bug-trend-analysis')).toBeInTheDocument()
    expect(screen.getByTestId('root-cause-analysis')).toBeInTheDocument()
  })

  it('passes correct context to shared components', () => {
    renderWithTheme(
      <DeveloperTabContent
        dashboardData={mockDashboardData}
        dashboardActions={mockDashboardActions}
        dashboardState={mockDashboardState}
      />
    )
    
    // Check that context="developer" is passed to shared components
    expect(screen.getByText('Developer Bug Trends (developer)')).toBeInTheDocument()
    expect(screen.getByText('Developer Root Cause Analysis (developer)')).toBeInTheDocument()
  })

  it('handles missing developers filter gracefully', () => {
    const mockDataWithoutDevelopers = {
      ...mockDashboardData,
      filters: {
        ...mockDashboardData.filters,
        developers: undefined
      }
    }

    renderWithTheme(
      <DeveloperTabContent
        dashboardData={mockDataWithoutDevelopers}
        dashboardActions={mockDashboardActions}
        dashboardState={mockDashboardState}
      />
    )
    
    // Should show guidance message and not crash
    expect(screen.getByText('Individual Developer Analysis')).toBeInTheDocument()
    expect(screen.queryByTestId('developer-detail-panel')).not.toBeInTheDocument()
  })
})