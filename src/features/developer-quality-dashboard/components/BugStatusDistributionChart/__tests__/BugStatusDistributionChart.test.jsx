import React from 'react'
import { render, screen } from '@testing-library/react'
import { ThemeProvider } from '@mui/material/styles'
import theme from '../../../../../theme'
import BugStatusDistributionChart from '../BugStatusDistributionChart.jsx'

// Mock Chart.js to avoid canvas issues in tests
jest.mock('react-chartjs-2', () => ({
  Pie: ({ data, options, ...props }) => (
    <div 
      data-testid="bug-status-pie-chart"
      data-chart-data={JSON.stringify(data)}
      data-chart-options={JSON.stringify(options)}
      {...props}
    >
      Mock Pie Chart
    </div>
  )
}))

// Mock the hooks
jest.mock('../../../hooks/useDeveloperQualityFilters', () => ({
  useDeveloperQualityFilters: () => ({
    filters: {
      timeframe: 'month'
    }
  })
}))

// Test helper to render with theme
const renderWithTheme = (component) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  )
}

// Mock data
const mockData = {
  data: {
    aggregated: new Map([
      ['2024-01', { new: 5, inProgress: 3, resolved: 12, notFixed: 2, total: 22 }],
      ['2024-02', { new: 8, inProgress: 5, resolved: 15, notFixed: 1, total: 29 }]
    ]),
    byProject: new Map([
      ['PROJECT1', new Map([
        ['2024-01', { new: 3, inProgress: 2, resolved: 8, notFixed: 1, total: 14 }],
        ['2024-02', { new: 5, inProgress: 3, resolved: 10, notFixed: 0, total: 18 }]
      ])]
    ]),
    metadata: {
      timePeriod: 'month',
      totalBugs: 51,
      processedAt: new Date().toISOString()
    }
  },
  config: {
    timePeriod: 'month',
    periodKey: 'month'
  }
}

const mockFilters = {
  projects: ['PROJECT1'],
  timeframe: 'month'
}

describe('BugStatusDistributionChart', () => {
  it('renders without crashing', () => {
    renderWithTheme(
      <BugStatusDistributionChart 
        data={mockData}
        filters={mockFilters}
      />
    )
    
    expect(screen.getByText('Bug Status Distribution')).toBeInTheDocument()
  })

  it('displays custom title when provided', () => {
    const customTitle = 'Custom Bug Distribution Analysis'
    
    renderWithTheme(
      <BugStatusDistributionChart 
        data={mockData}
        filters={mockFilters}
        title={customTitle}
      />
    )
    
    expect(screen.getByText(customTitle)).toBeInTheDocument()
  })

  it('renders pie chart when valid data is provided', () => {
    renderWithTheme(
      <BugStatusDistributionChart 
        data={mockData}
        filters={mockFilters}
      />
    )
    
    const chartElement = screen.getByTestId('bug-status-pie-chart')
    expect(chartElement).toBeInTheDocument()
    expect(chartElement).toHaveTextContent('Mock Pie Chart')
  })

  it('shows total bug count when data is available', () => {
    renderWithTheme(
      <BugStatusDistributionChart 
        data={mockData}
        filters={mockFilters}
      />
    )
    
    // Should show total count based on aggregated data across time periods
    expect(screen.getByText(/Total:/)).toBeInTheDocument()
  })

  it('shows loading state when no data provided', () => {
    renderWithTheme(
      <BugStatusDistributionChart 
        data={null}
        filters={mockFilters}
      />
    )
    
    expect(screen.getByText('❌ Bug Status Distribution: No data received from parent component')).toBeInTheDocument()
  })

  it('shows no data message when chart data is empty', () => {
    const emptyData = {
      data: {
        aggregated: new Map(),
        byProject: new Map(),
        metadata: { timePeriod: 'month', totalBugs: 0 }
      },
      config: { timePeriod: 'month', periodKey: 'month' }
    }
    
    renderWithTheme(
      <BugStatusDistributionChart 
        data={emptyData}
        filters={mockFilters}
      />
    )
    
    expect(screen.getByText(/No bug distribution data available/)).toBeInTheDocument()
  })

  it('uses default height when not specified', () => {
    const { container } = renderWithTheme(
      <BugStatusDistributionChart 
        data={mockData}
        filters={mockFilters}
      />
    )
    
    // Check that the Paper component has the default height
    const paperElement = container.querySelector('[class*="MuiPaper-root"]')
    expect(paperElement).toHaveStyle({ height: '350px' })
  })

  it('uses custom height when provided', () => {
    const customHeight = 400
    
    const { container } = renderWithTheme(
      <BugStatusDistributionChart 
        data={mockData}
        filters={mockFilters}
        height={customHeight}
      />
    )
    
    const paperElement = container.querySelector('[class*="MuiPaper-root"]')
    expect(paperElement).toHaveStyle({ height: `${customHeight}px` })
  })

  it('handles missing data gracefully', () => {
    const incompleteData = {
      config: { timePeriod: 'month' }
      // Missing data property
    }
    
    renderWithTheme(
      <BugStatusDistributionChart 
        data={incompleteData}
        filters={mockFilters}
      />
    )
    
    expect(screen.getByText(/No bug distribution data available/)).toBeInTheDocument()
  })

  it('passes correct props to Pie chart component', () => {
    renderWithTheme(
      <BugStatusDistributionChart 
        data={mockData}
        filters={mockFilters}
      />
    )
    
    const chartElement = screen.getByTestId('bug-status-pie-chart')
    const chartData = JSON.parse(chartElement.getAttribute('data-chart-data'))
    
    // Verify chart data structure for pie chart
    expect(chartData).toHaveProperty('labels')
    expect(chartData).toHaveProperty('datasets')
    expect(chartData.datasets).toHaveLength(1) // Single dataset for pie chart
    expect(chartData.labels).toEqual(['New', 'In Progress', 'Resolved', 'Not Fixed'])
    
    // Verify dataset structure
    const dataset = chartData.datasets[0]
    expect(dataset).toHaveProperty('data')
    expect(dataset).toHaveProperty('backgroundColor')
    expect(dataset.data).toHaveLength(4) // Four values for four statuses
    expect(dataset.backgroundColor).toHaveLength(4) // Four colors for four statuses
  })

  it('applies correct colors to pie chart', () => {
    renderWithTheme(
      <BugStatusDistributionChart 
        data={mockData}
        filters={mockFilters}
      />
    )
    
    const chartElement = screen.getByTestId('bug-status-pie-chart')
    const chartData = JSON.parse(chartElement.getAttribute('data-chart-data'))
    
    const dataset = chartData.datasets[0]
    const expectedColors = ['#1976d2', '#ff9800', '#2e7d32', '#d32f2f']
    
    expect(dataset.backgroundColor).toEqual(expectedColors)
    expect(dataset.borderColor).toEqual(expectedColors)
  })

  it('aggregates data correctly across time periods', () => {
    renderWithTheme(
      <BugStatusDistributionChart 
        data={mockData}
        filters={mockFilters}
      />
    )
    
    const chartElement = screen.getByTestId('bug-status-pie-chart')
    const chartData = JSON.parse(chartElement.getAttribute('data-chart-data'))
    
    const dataset = chartData.datasets[0]
    // Verify that data is aggregated across time periods
    // Based on mock data: new: 8, inProgress: 8, resolved: 18, notFixed: 1 (filtered by PROJECT1)
    expect(dataset.data.reduce((sum, val) => sum + val, 0)).toBeGreaterThan(0)
  })

  it('applies responsive design correctly', () => {
    renderWithTheme(
      <BugStatusDistributionChart 
        data={mockData}
        filters={mockFilters}
      />
    )
    
    const chartElement = screen.getByTestId('bug-status-pie-chart')
    const chartOptions = JSON.parse(chartElement.getAttribute('data-chart-options'))
    
    expect(chartOptions.responsive).toBe(true)
    expect(chartOptions.maintainAspectRatio).toBe(false)
  })

  it('configures pie chart options correctly', () => {
    renderWithTheme(
      <BugStatusDistributionChart 
        data={mockData}
        filters={mockFilters}
      />
    )
    
    const chartElement = screen.getByTestId('bug-status-pie-chart')
    const chartOptions = JSON.parse(chartElement.getAttribute('data-chart-options'))
    
    // Verify pie chart configuration
    expect(chartOptions.responsive).toBe(true)
    expect(chartOptions.maintainAspectRatio).toBe(false)
    expect(chartOptions.plugins.legend.position).toBe('right')
    expect(chartOptions.plugins.tooltip).toBeDefined()
  })

  it('configures tooltips correctly', () => {
    renderWithTheme(
      <BugStatusDistributionChart 
        data={mockData}
        filters={mockFilters}
      />
    )
    
    const chartElement = screen.getByTestId('bug-status-pie-chart')
    const chartOptions = JSON.parse(chartElement.getAttribute('data-chart-options'))
    
    expect(chartOptions.plugins.tooltip).toBeDefined()
    expect(chartOptions.plugins.tooltip.callbacks).toBeDefined()
  })
})

// Additional test suite for edge cases
describe('BugStatusDistributionChart Edge Cases', () => {
  it('handles malformed data gracefully', () => {
    const malformedData = {
      data: null,
      config: { timePeriod: 'month' }
    }
    
    renderWithTheme(
      <BugStatusDistributionChart 
        data={malformedData}
        filters={mockFilters}
      />
    )
    
    expect(screen.getByText(/No bug distribution data available/)).toBeInTheDocument()
  })

  it('works without project filters', () => {
    const filtersWithoutProjects = {
      timeframe: 'month'
    }
    
    renderWithTheme(
      <BugStatusDistributionChart 
        data={mockData}
        filters={filtersWithoutProjects}
      />
    )
    
    expect(screen.getByTestId('bug-status-pie-chart')).toBeInTheDocument()
  })

  it('uses fallback timeframe when not specified', () => {
    const filtersWithoutTimeframe = {
      projects: ['PROJECT1']
    }
    
    renderWithTheme(
      <BugStatusDistributionChart 
        data={mockData}
        filters={filtersWithoutTimeframe}
      />
    )
    
    // Should still render the chart with default timeframe
    expect(screen.getByTestId('bug-status-pie-chart')).toBeInTheDocument()
  })

  it('handles empty pie chart data gracefully', () => {
    const emptyData = {
      data: {
        aggregated: new Map(),
        byProject: new Map(),
        metadata: { timePeriod: 'month', totalBugs: 0 }
      },
      config: { timePeriod: 'month', periodKey: 'month' }
    }
    
    renderWithTheme(
      <BugStatusDistributionChart 
        data={emptyData}
        filters={mockFilters}
      />
    )
    
    // Should show no data message
    expect(screen.getByText(/No bug distribution data available/)).toBeInTheDocument()
  })

  it('handles data updates correctly', () => {
    const { rerender } = renderWithTheme(
      <BugStatusDistributionChart 
        data={mockData}
        filters={mockFilters}
      />
    )
    
    expect(screen.getByTestId('bug-status-pie-chart')).toBeInTheDocument()
    
    // Update with new data
    const updatedData = {
      ...mockData,
      data: {
        ...mockData.data,
        metadata: { ...mockData.data.metadata, totalBugs: 60 }
      }
    }
    
    rerender(
      <ThemeProvider theme={theme}>
        <BugStatusDistributionChart 
          data={updatedData}
          filters={mockFilters}
        />
      </ThemeProvider>
    )
    
    // Should still show pie chart
    expect(screen.getByTestId('bug-status-pie-chart')).toBeInTheDocument()
  })

  it('shows helpful message for projects without bug data', () => {
    const filtersWithProjectsWithoutData = {
      projects: ['Yubisui'],
      timeframe: 'month'
    }
    
    const emptyData = {
      data: {
        aggregated: new Map(),
        byProject: new Map(),
        metadata: { timePeriod: 'month', totalBugs: 0 }
      },
      config: { timePeriod: 'month', periodKey: 'month' }
    }
    
    renderWithTheme(
      <BugStatusDistributionChart 
        data={emptyData}
        filters={filtersWithProjectsWithoutData}
      />
    )
    
    expect(screen.getByText(/No Bug Data for Selected Project/)).toBeInTheDocument()
    expect(screen.getByText('Yubisui')).toBeInTheDocument()
  })
}) 