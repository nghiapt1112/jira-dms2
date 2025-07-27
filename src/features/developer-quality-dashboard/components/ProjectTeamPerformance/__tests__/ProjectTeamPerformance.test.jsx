import React from 'react'
import { render, screen } from '@testing-library/react'
import { ThemeProvider } from '@mui/material/styles'
import theme from '../../../../../theme'
import ProjectTeamPerformance from '../ProjectTeamPerformance'

// Helper function for rendering with theme
const renderWithTheme = (component) => 
  render(<ThemeProvider theme={theme}>{component}</ThemeProvider>)

// Mock Chart.js to avoid canvas issues in tests
jest.mock('react-chartjs-2', () => ({
  Chart: ({ data, options, ...props }) => (
    <div data-testid="mock-chart" {...props}>
      <div data-testid="chart-data">{JSON.stringify(data)}</div>
      <div data-testid="chart-options">{JSON.stringify(options)}</div>
    </div>
  )
}))

const mockData = {
  data: [
    { 
      timePeriod: '2024-01',
      'John Doe': 50,
      'Jane Smith': 40,
      'Bob Wilson': 60
    },
    { 
      timePeriod: '2024-02',
      'John Doe': 45,
      'Jane Smith': 35,
      'Bob Wilson': 55
    },
    { 
      timePeriod: '2024-03',
      'John Doe': 55,
      'Jane Smith': 45,
      'Bob Wilson': 65
    }
  ]
}

const mockFilters = {
  projects: ['YUIM'],
  timeframe: 'month'
}

const mockFiltersNoProject = {
  projects: [],
  timeframe: 'month'
}

const mockFiltersMultipleProjects = {
  projects: ['YUIM', 'CF'],
  timeframe: 'month'
}

describe('ProjectTeamPerformance', () => {
  it('renders without crashing', () => {
    renderWithTheme(
      <ProjectTeamPerformance data={mockData} filters={mockFilters} />
    )
    expect(screen.getByText('Project Team Performance')).toBeInTheDocument()
  })
  
  it('displays project name in header', () => {
    renderWithTheme(
      <ProjectTeamPerformance data={mockData} filters={mockFilters} />
    )
    expect(screen.getByText('Project: YUIM')).toBeInTheDocument()
  })
  
  it('shows chart when data is available', () => {
    renderWithTheme(
      <ProjectTeamPerformance data={mockData} filters={mockFilters} />
    )
    expect(screen.getByTestId('mock-chart')).toBeInTheDocument()
  })
  
  it('displays correct number of developers in summary', () => {
    renderWithTheme(
      <ProjectTeamPerformance data={mockData} filters={mockFilters} />
    )
    expect(screen.getByText('Showing 3 developers')).toBeInTheDocument()
  })
  
  it('displays correct total story points', () => {
    renderWithTheme(
      <ProjectTeamPerformance data={mockData} filters={mockFilters} />
    )
    // John: 50+45+55=150, Jane: 40+35+45=120, Bob: 60+55+65=180
    // Should show these totals in the chart
    expect(screen.getByTestId('mock-chart')).toBeInTheDocument()
  })
  
  it('shows no data message when data array is empty', () => {
    const emptyData = { ...mockData, data: [] }
    renderWithTheme(
      <ProjectTeamPerformance data={emptyData} filters={mockFilters} />
    )
    expect(screen.getByText(/No Data Available/i)).toBeInTheDocument()
  })
  
  it('shows select project message when no project is selected', () => {
    renderWithTheme(
      <ProjectTeamPerformance data={mockData} filters={mockFiltersNoProject} />
    )
    expect(screen.getByText(/Select a Single Project/i)).toBeInTheDocument()
  })
  
  it('shows select project message when multiple projects are selected', () => {
    renderWithTheme(
      <ProjectTeamPerformance data={mockData} filters={mockFiltersMultipleProjects} />
    )
    expect(screen.getByText(/Select a Single Project/i)).toBeInTheDocument()
  })
  
  it('displays custom title when provided', () => {
    const customTitle = 'Custom Team Performance Chart'
    renderWithTheme(
      <ProjectTeamPerformance 
        data={mockData} 
        filters={mockFilters} 
        title={customTitle}
      />
    )
    expect(screen.getByText(customTitle)).toBeInTheDocument()
  })
  
  it('shows performance filter information in summary', () => {
    renderWithTheme(
      <ProjectTeamPerformance 
        data={mockData} 
        filters={mockFilters}
        performanceFilter="over"
      />
    )
    expect(screen.getByText(/Showing \d+ developers? \(over target\)/)).toBeInTheDocument()
  })
  
  it('handles showTargetLines prop', () => {
    const { rerender } = renderWithTheme(
      <ProjectTeamPerformance 
        data={mockData} 
        filters={mockFilters}
        showTargetLines={false}
      />
    )
    
    // Should render without target lines
    expect(screen.getByTestId('mock-chart')).toBeInTheDocument()
    
    // Re-render with target lines enabled
    rerender(
      <ThemeProvider theme={theme}>
        <ProjectTeamPerformance 
          data={mockData} 
          filters={mockFilters}
          showTargetLines={true}
        />
      </ThemeProvider>
    )
    
    // Should still render chart (target lines are added internally)
    expect(screen.getByTestId('mock-chart')).toBeInTheDocument()
  })
  
  it('handles different timeframe options', () => {
    const weeklyFilters = { ...mockFilters, timeframe: 'week' }
    renderWithTheme(
      <ProjectTeamPerformance 
        data={mockData} 
        filters={weeklyFilters}
      />
    )
    expect(screen.getByTestId('mock-chart')).toBeInTheDocument()
  })
  
  it('validates chart data structure and aggregated totals', () => {
    renderWithTheme(
      <ProjectTeamPerformance data={mockData} filters={mockFilters} />
    )
    
    const chartDataElement = screen.getByTestId('chart-data')
    const chartData = JSON.parse(chartDataElement.textContent)
    
    // Verify chart data structure
    expect(chartData).toHaveProperty('labels')
    expect(chartData).toHaveProperty('datasets')
    
    // Developers should be sorted by total story points (descending)
    // Bob: 60+55+65=180, John: 50+45+55=150, Jane: 40+35+45=120
    expect(chartData.labels).toEqual(['Bob Wilson', 'John Doe', 'Jane Smith'])
    expect(chartData.datasets[0].data).toEqual([180, 150, 120])
  })
})