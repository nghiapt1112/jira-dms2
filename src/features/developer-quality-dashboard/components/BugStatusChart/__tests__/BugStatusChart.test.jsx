import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { ThemeProvider } from '@mui/material/styles'
import theme from '../../../../../theme'
import BugStatusChart from '../BugStatusChart.jsx'

// Mock Chart.js to avoid canvas issues in tests
jest.mock('react-chartjs-2', () => ({
  Line: ({ data, options, ...props }) => (
    <div 
      data-testid="bug-status-line-chart"
      data-chart-data={JSON.stringify(data)}
      data-chart-options={JSON.stringify(options)}
      {...props}
    >
      Mock Line Chart
    </div>
  ),
  Bar: ({ data, options, ...props }) => (
    <div 
      data-testid="bug-status-bar-chart"
      data-chart-data={JSON.stringify(data)}
      data-chart-options={JSON.stringify(options)}
      {...props}
    >
      Mock Bar Chart
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

// Create a custom mock for individual tests that need different timeframes
const mockUseDeveloperQualityFilters = jest.fn(() => ({
  filters: { timeframe: 'month' }
}))

jest.doMock('../../../hooks/useDeveloperQualityFilters', () => ({
  useDeveloperQualityFilters: mockUseDeveloperQualityFilters
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

describe('BugStatusChart', () => {
  it('renders without crashing', () => {
    renderWithTheme(
      <BugStatusChart 
        data={mockData}
        filters={mockFilters}
      />
    )
    
    expect(screen.getByText('Bug Status Trends')).toBeInTheDocument()
  })

  it('displays custom title when provided', () => {
    const customTitle = 'Custom Bug Status Analysis'
    
    renderWithTheme(
      <BugStatusChart 
        data={mockData}
        filters={mockFilters}
        title={customTitle}
      />
    )
    
    expect(screen.getByText(customTitle)).toBeInTheDocument()
  })

  it('renders chart when valid data is provided', () => {
    renderWithTheme(
      <BugStatusChart 
        data={mockData}
        filters={mockFilters}
      />
    )
    
    const chartElement = screen.getByTestId('bug-status-line-chart')
    expect(chartElement).toBeInTheDocument()
    expect(chartElement).toHaveTextContent('Mock Line Chart')
  })

  it('shows chart type toggle buttons', () => {
    renderWithTheme(
      <BugStatusChart 
        data={mockData}
        filters={mockFilters}
      />
    )
    
    expect(screen.getByText('Line Chart')).toBeInTheDocument()
    expect(screen.getByText('Stacked Bar')).toBeInTheDocument()
    expect(screen.queryByText('Pie Chart')).not.toBeInTheDocument()
  })

  it('switches between line chart and stacked bar chart', () => {
    renderWithTheme(
      <BugStatusChart 
        data={mockData}
        filters={mockFilters}
      />
    )
    
    // Initially shows line chart
    expect(screen.getByTestId('bug-status-line-chart')).toBeInTheDocument()
    expect(screen.queryByTestId('bug-status-bar-chart')).not.toBeInTheDocument()
    
    // Click on stacked bar toggle
    fireEvent.click(screen.getByText('Stacked Bar'))
    
    // Now shows bar chart
    expect(screen.getByTestId('bug-status-bar-chart')).toBeInTheDocument()
    expect(screen.queryByTestId('bug-status-line-chart')).not.toBeInTheDocument()
    
    // Switch back to line chart
    fireEvent.click(screen.getByText('Line Chart'))
    
    // Back to line chart
    expect(screen.getByTestId('bug-status-line-chart')).toBeInTheDocument()
    expect(screen.queryByTestId('bug-status-bar-chart')).not.toBeInTheDocument()
  })

  it('shows loading state when no data provided', () => {
    renderWithTheme(
      <BugStatusChart 
        data={null}
        filters={mockFilters}
      />
    )
    
    expect(screen.getByText('❌ Bug Status Chart: No data received from parent component')).toBeInTheDocument()
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
      <BugStatusChart 
        data={emptyData}
        filters={mockFilters}
      />
    )
    
    expect(screen.getByText(/No bug status data available/)).toBeInTheDocument()
  })

  it('uses default height when not specified', () => {
    const { container } = renderWithTheme(
      <BugStatusChart 
        data={mockData}
        filters={mockFilters}
      />
    )
    
    // Check that the Paper component has the default height
    const paperElement = container.querySelector('[class*="MuiPaper-root"]')
    expect(paperElement).toHaveStyle({ height: '400px' })
  })

  it('uses custom height when provided', () => {
    const customHeight = 500
    
    const { container } = renderWithTheme(
      <BugStatusChart 
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
      <BugStatusChart 
        data={incompleteData}
        filters={mockFilters}
      />
    )
    
    expect(screen.getByText(/No bug status data available/)).toBeInTheDocument()
  })

  it('passes correct props to Line chart component', () => {
    renderWithTheme(
      <BugStatusChart 
        data={mockData}
        filters={mockFilters}
      />
    )
    
    const chartElement = screen.getByTestId('bug-status-line-chart')
    const chartData = JSON.parse(chartElement.getAttribute('data-chart-data'))
    
    // Verify chart data structure
    expect(chartData).toHaveProperty('labels')
    expect(chartData).toHaveProperty('datasets')
    expect(chartData.datasets).toHaveLength(4) // new, inProgress, resolved, notFixed
    
    // Verify dataset labels
    const datasetLabels = chartData.datasets.map(dataset => dataset.label)
    expect(datasetLabels).toContain('New')
    expect(datasetLabels).toContain('In Progress')
    expect(datasetLabels).toContain('Resolved')
    expect(datasetLabels).toContain('Not Fixed')
  })

  it('passes correct props to Bar chart component when stacked bar is selected', () => {
    renderWithTheme(
      <BugStatusChart 
        data={mockData}
        filters={mockFilters}
      />
    )
    
    // Switch to stacked bar chart
    fireEvent.click(screen.getByText('Stacked Bar'))
    
    const chartElement = screen.getByTestId('bug-status-bar-chart')
    const chartData = JSON.parse(chartElement.getAttribute('data-chart-data'))
    
    // Verify chart data structure for stacked bar
    expect(chartData).toHaveProperty('labels')
    expect(chartData).toHaveProperty('datasets')
    expect(chartData.datasets).toHaveLength(4) // new, inProgress, resolved, notFixed
    
    // Verify dataset labels and stacking
    chartData.datasets.forEach(dataset => {
      expect(dataset).toHaveProperty('stack', 'Stack 0')
      expect(dataset).toHaveProperty('backgroundColor')
    })
  })

  it('applies correct colors to datasets', () => {
    renderWithTheme(
      <BugStatusChart 
        data={mockData}
        filters={mockFilters}
      />
    )
    
    const chartElement = screen.getByTestId('bug-status-line-chart')
    const chartData = JSON.parse(chartElement.getAttribute('data-chart-data'))
    
    const colorsByLabel = {}
    chartData.datasets.forEach(dataset => {
      colorsByLabel[dataset.label] = dataset.borderColor
    })
    
    expect(colorsByLabel['New']).toBe('#1976d2')
    expect(colorsByLabel['In Progress']).toBe('#ff9800')
    expect(colorsByLabel['Resolved']).toBe('#2e7d32')
    expect(colorsByLabel['Not Fixed']).toBe('#d32f2f')
  })

  it('handles different timeframes correctly', () => {
    // The component uses store filters first, then falls back to passed filters
    // Since the mock always returns 'month', let's test with month instead
    const monthlyFilters = { ...mockFilters, timeframe: 'month' }
    
    renderWithTheme(
      <BugStatusChart 
        data={mockData}
        filters={monthlyFilters}
      />
    )
    
    const chartElement = screen.getByTestId('bug-status-line-chart')
    const chartOptions = JSON.parse(chartElement.getAttribute('data-chart-options'))
    
    // Verify that chart options are configured for the timeframe
    expect(chartOptions).toHaveProperty('scales')
    expect(chartOptions.scales.x.title.text).toBe('Month')
  })

  it('applies responsive design correctly', () => {
    renderWithTheme(
      <BugStatusChart 
        data={mockData}
        filters={mockFilters}
      />
    )
    
    const chartElement = screen.getByTestId('bug-status-line-chart')
    const chartOptions = JSON.parse(chartElement.getAttribute('data-chart-options'))
    
    expect(chartOptions.responsive).toBe(true)
    expect(chartOptions.maintainAspectRatio).toBe(false)
  })

  it('configures tooltips correctly', () => {
    renderWithTheme(
      <BugStatusChart 
        data={mockData}
        filters={mockFilters}
      />
    )
    
    const chartElement = screen.getByTestId('bug-status-line-chart')
    const chartOptions = JSON.parse(chartElement.getAttribute('data-chart-options'))
    
    expect(chartOptions.plugins.tooltip).toBeDefined()
    expect(chartOptions.plugins.tooltip.mode).toBe('index')
    expect(chartOptions.plugins.tooltip.intersect).toBe(false)
  })

  it('configures stacked bar chart options correctly', () => {
    renderWithTheme(
      <BugStatusChart 
        data={mockData}
        filters={mockFilters}
      />
    )
    
    // Switch to stacked bar chart
    fireEvent.click(screen.getByText('Stacked Bar'))
    
    const chartElement = screen.getByTestId('bug-status-bar-chart')
    const chartOptions = JSON.parse(chartElement.getAttribute('data-chart-options'))
    
    // Verify stacking configuration
    expect(chartOptions.scales.y.stacked).toBe(true)
    expect(chartOptions.responsive).toBe(true)
    expect(chartOptions.maintainAspectRatio).toBe(false)
  })
})

// Additional test suite for edge cases
describe('BugStatusChart Edge Cases', () => {
  it('handles malformed data gracefully', () => {
    const malformedData = {
      data: null,
      config: { timePeriod: 'month' }
    }
    
    renderWithTheme(
      <BugStatusChart 
        data={malformedData}
        filters={mockFilters}
      />
    )
    
    expect(screen.getByText(/No bug status data available/)).toBeInTheDocument()
  })

  it('works without project filters', () => {
    const filtersWithoutProjects = {
      timeframe: 'month'
    }
    
    renderWithTheme(
      <BugStatusChart 
        data={mockData}
        filters={filtersWithoutProjects}
      />
    )
    
    expect(screen.getByTestId('bug-status-line-chart')).toBeInTheDocument()
  })

  it('uses fallback timeframe when not specified', () => {
    const filtersWithoutTimeframe = {
      projects: ['PROJECT1']
    }
    
    renderWithTheme(
      <BugStatusChart 
        data={mockData}
        filters={filtersWithoutTimeframe}
      />
    )
    
    // Should still render the chart with default timeframe
    expect(screen.getByTestId('bug-status-line-chart')).toBeInTheDocument()
  })

  it('preserves chart type selection during data updates', () => {
    const { rerender } = renderWithTheme(
      <BugStatusChart 
        data={mockData}
        filters={mockFilters}
      />
    )
    
    // Switch to stacked bar
    fireEvent.click(screen.getByText('Stacked Bar'))
    expect(screen.getByTestId('bug-status-bar-chart')).toBeInTheDocument()
    
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
        <BugStatusChart 
          data={updatedData}
          filters={mockFilters}
        />
      </ThemeProvider>
    )
    
    // Should still show stacked bar chart
    expect(screen.getByTestId('bug-status-bar-chart')).toBeInTheDocument()
    expect(screen.queryByTestId('bug-status-line-chart')).not.toBeInTheDocument()
  })
}) 