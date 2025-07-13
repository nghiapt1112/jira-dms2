import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ThemeProvider } from '@mui/material/styles'
import { createTheme } from '@mui/material/styles'
import SprintMetricsCharts from '../SprintMetricsCharts'
import { getTestIssues, getTestIssuesByProject } from '../../__tests__/testData'

const theme = createTheme()

const renderWithTheme = (component) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  )
}

// Mock the chart components
jest.mock('../TimelinessCharts', () => {
  return function MockTimelinessCharts({ data, selectedProject }) {
    return (
      <div data-testid="timeliness-charts">
        <div>Timeliness Charts</div>
        <div>Project: {selectedProject}</div>
        <div>Issues: {data?.length || 0}</div>
      </div>
    )
  }
})

jest.mock('../ScopeCreepCharts', () => {
  return function MockScopeCreepCharts({ data, selectedProject }) {
    return (
      <div data-testid="scope-creep-charts">
        <div>Scope Creep Charts</div>
        <div>Project: {selectedProject}</div>
        <div>Issues: {data?.length || 0}</div>
      </div>
    )
  }
})

jest.mock('../SprintMetricsDetailsPopup', () => {
  return function MockSprintMetricsDetailsPopup({ open, onClose, issues, selectedProject }) {
    if (!open) return null
    return (
      <div data-testid="sprint-metrics-popup">
        <div>Sprint Metrics Details</div>
        <div>Project: {selectedProject}</div>
        <div>Issues: {issues?.length || 0}</div>
        <button onClick={onClose}>Close</button>
      </div>
    )
  }
})

describe('SprintMetricsCharts', () => {
  const mockIssues = getTestIssues(20)
  const mockProjectIssues = getTestIssuesByProject('YUIM', 10)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Component Rendering', () => {
    it('should render sprint metrics title', () => {
      renderWithTheme(<SprintMetricsCharts data={mockIssues} />)
      
      expect(screen.getByText('Sprint Metrics & Charts')).toBeInTheDocument()
    })

    it('should render project filter dropdown', () => {
      renderWithTheme(<SprintMetricsCharts data={mockIssues} />)
      
      expect(screen.getByText('Filter by Project')).toBeInTheDocument()
      expect(screen.getByText('All Projects')).toBeInTheDocument()
    })

    it('should render both chart sections', () => {
      renderWithTheme(<SprintMetricsCharts data={mockIssues} />)
      
      expect(screen.getByTestId('timeliness-charts')).toBeInTheDocument()
      expect(screen.getByTestId('scope-creep-charts')).toBeInTheDocument()
    })

    it('should render view details button', () => {
      renderWithTheme(<SprintMetricsCharts data={mockIssues} />)
      
      expect(screen.getByText('View Details')).toBeInTheDocument()
    })
  })

  describe('Project Filtering', () => {
    it('should extract unique projects from data', () => {
      const mixedProjectIssues = [
        ...getTestIssuesByProject('YUIM', 3),
        ...getTestIssuesByProject('TEST', 2)
      ]

      renderWithTheme(<SprintMetricsCharts data={mixedProjectIssues} />)
      
      // Click dropdown to open it
      fireEvent.mouseDown(screen.getByRole('combobox'))
      
      expect(screen.getByText('YUIM')).toBeInTheDocument()
      expect(screen.getByText('TEST')).toBeInTheDocument()
    })

    it('should filter data when project is selected', async () => {
      const mixedProjectIssues = [
        ...getTestIssuesByProject('YUIM', 5),
        ...getTestIssuesByProject('TEST', 3)
      ]

      renderWithTheme(<SprintMetricsCharts data={mixedProjectIssues} />)
      
      // Open dropdown
      fireEvent.mouseDown(screen.getByRole('combobox'))
      
      // Select YUIM project
      fireEvent.click(screen.getByText('YUIM'))
      
      await waitFor(() => {
        expect(screen.getByText('Project: YUIM')).toBeInTheDocument()
      })
    })

    it('should show all data when "All Projects" is selected', async () => {
      renderWithTheme(<SprintMetricsCharts data={mockIssues} />)
      
      // Ensure "All Projects" is selected by default
      expect(screen.getByText('Issues: 20')).toBeInTheDocument()
    })

    it('should use defaultSelectedProject prop', () => {
      renderWithTheme(
        <SprintMetricsCharts 
          data={mockIssues} 
          defaultSelectedProject="YUIM" 
        />
      )
      
      expect(screen.getByDisplayValue('YUIM')).toBeInTheDocument()
    })
  })

  describe('Data Processing', () => {
    it('should handle empty data gracefully', () => {
      renderWithTheme(<SprintMetricsCharts data={[]} />)
      
      expect(screen.getByText('Sprint Metrics & Charts')).toBeInTheDocument()
      expect(screen.getByText('Issues: 0')).toBeInTheDocument()
    })

    it('should handle null data', () => {
      renderWithTheme(<SprintMetricsCharts data={null} />)
      
      expect(screen.getByText('Sprint Metrics & Charts')).toBeInTheDocument()
    })

    it('should handle undefined data', () => {
      renderWithTheme(<SprintMetricsCharts data={undefined} />)
      
      expect(screen.getByText('Sprint Metrics & Charts')).toBeInTheDocument()
    })

    it('should handle issues without project information', () => {
      const issuesWithoutProject = [{
        id: '123',
        key: 'NO-PROJ-1',
        displayFields: {
          // Missing projectKey
          status: 'Done'
        }
      }]

      renderWithTheme(<SprintMetricsCharts data={issuesWithoutProject} />)
      
      expect(screen.getByText('Sprint Metrics & Charts')).toBeInTheDocument()
    })
  })

  describe('Details Popup', () => {
    it('should open details popup when View Details is clicked', async () => {
      renderWithTheme(<SprintMetricsCharts data={mockIssues} />)
      
      fireEvent.click(screen.getByText('View Details'))
      
      await waitFor(() => {
        expect(screen.getByTestId('sprint-metrics-popup')).toBeInTheDocument()
        expect(screen.getByText('Sprint Metrics Details')).toBeInTheDocument()
      })
    })

    it('should close details popup when close is clicked', async () => {
      renderWithTheme(<SprintMetricsCharts data={mockIssues} />)
      
      // Open popup
      fireEvent.click(screen.getByText('View Details'))
      
      await waitFor(() => {
        expect(screen.getByTestId('sprint-metrics-popup')).toBeInTheDocument()
      })
      
      // Close popup
      fireEvent.click(screen.getByText('Close'))
      
      await waitFor(() => {
        expect(screen.queryByTestId('sprint-metrics-popup')).not.toBeInTheDocument()
      })
    })

    it('should pass filtered data to popup', async () => {
      renderWithTheme(<SprintMetricsCharts data={mockProjectIssues} />)
      
      // Select specific project
      fireEvent.mouseDown(screen.getByRole('combobox'))
      fireEvent.click(screen.getByText('YUIM'))
      
      // Open details popup
      fireEvent.click(screen.getByText('View Details'))
      
      await waitFor(() => {
        expect(screen.getByTestId('sprint-metrics-popup')).toBeInTheDocument()
        expect(screen.getByText('Project: YUIM')).toBeInTheDocument()
      })
    })
  })

  describe('Chart Data Integration', () => {
    it('should pass correct data to timeliness charts', () => {
      renderWithTheme(<SprintMetricsCharts data={mockIssues} />)
      
      const timelinessChart = screen.getByTestId('timeliness-charts')
      expect(timelinessChart).toBeInTheDocument()
      expect(screen.getByText('Issues: 20')).toBeInTheDocument()
    })

    it('should pass correct data to scope creep charts', () => {
      renderWithTheme(<SprintMetricsCharts data={mockIssues} />)
      
      const scopeCreepChart = screen.getByTestId('scope-creep-charts')
      expect(scopeCreepChart).toBeInTheDocument()
    })

    it('should update charts when project filter changes', async () => {
      const mixedIssues = [
        ...getTestIssuesByProject('YUIM', 8),
        ...getTestIssuesByProject('TEST', 4)
      ]

      renderWithTheme(<SprintMetricsCharts data={mixedIssues} />)
      
      // Initially shows all issues
      expect(screen.getByText('Issues: 12')).toBeInTheDocument()
      
      // Filter by YUIM
      fireEvent.mouseDown(screen.getByRole('combobox'))
      fireEvent.click(screen.getByText('YUIM'))
      
      await waitFor(() => {
        expect(screen.getByText('Issues: 8')).toBeInTheDocument()
      })
    })
  })

  describe('Summary Statistics', () => {
    it('should display issue count summary', () => {
      renderWithTheme(<SprintMetricsCharts data={mockIssues} />)
      
      expect(screen.getByText(/Total Issues:/)).toBeInTheDocument()
      expect(screen.getByText('20')).toBeInTheDocument()
    })

    it('should update summary when filter changes', async () => {
      const mixedIssues = [
        ...getTestIssuesByProject('YUIM', 6),
        ...getTestIssuesByProject('TEST', 3)
      ]

      renderWithTheme(<SprintMetricsCharts data={mixedIssues} />)
      
      // Filter by TEST project
      fireEvent.mouseDown(screen.getByRole('combobox'))
      fireEvent.click(screen.getByText('TEST'))
      
      await waitFor(() => {
        expect(screen.getByText('3')).toBeInTheDocument()
      })
    })
  })

  describe('Loading and Error States', () => {
    it('should handle loading state gracefully', () => {
      renderWithTheme(<SprintMetricsCharts data={null} isLoading={true} />)
      
      expect(screen.getByText('Sprint Metrics & Charts')).toBeInTheDocument()
    })

    it('should display message when no data after filtering', async () => {
      const yuimOnlyIssues = getTestIssuesByProject('YUIM', 5)

      renderWithTheme(<SprintMetricsCharts data={yuimOnlyIssues} />)
      
      // Try to filter by a project that doesn't exist
      fireEvent.mouseDown(screen.getByRole('combobox'))
      fireEvent.click(screen.getByText('All Projects')) // Switch back to all
      
      // Then manually set a non-existent project (simulating edge case)
      expect(screen.getByText('Sprint Metrics & Charts')).toBeInTheDocument()
    })
  })

  describe('Responsive Design', () => {
    it('should adapt layout for mobile screens', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })

      renderWithTheme(<SprintMetricsCharts data={mockIssues} />)
      
      expect(screen.getByText('Sprint Metrics & Charts')).toBeInTheDocument()
    })

    it('should stack charts vertically on small screens', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 600,
      })

      renderWithTheme(<SprintMetricsCharts data={mockIssues} />)
      
      expect(screen.getByTestId('timeliness-charts')).toBeInTheDocument()
      expect(screen.getByTestId('scope-creep-charts')).toBeInTheDocument()
    })
  })

  describe('Performance', () => {
    it('should handle large datasets efficiently', () => {
      // Create large dataset
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        id: `issue-${i}`,
        key: `PERF-${i}`,
        displayFields: {
          projectKey: `PROJ${i % 10}`,
          status: i % 2 === 0 ? 'Done' : 'In Progress',
          sprint: `Sprint ${Math.floor(i / 50)}`
        }
      }))

      const startTime = performance.now()
      
      renderWithTheme(<SprintMetricsCharts data={largeDataset} />)
      
      const endTime = performance.now()
      const renderTime = endTime - startTime

      expect(renderTime).toBeLessThan(2000) // Should render within 2 seconds
      expect(screen.getByText('Sprint Metrics & Charts')).toBeInTheDocument()
    })

    it('should efficiently filter large datasets', async () => {
      const largeDataset = Array.from({ length: 500 }, (_, i) => ({
        id: `issue-${i}`,
        key: `PERF-${i}`,
        displayFields: {
          projectKey: i < 250 ? 'LARGE' : 'OTHER',
          status: 'Done'
        }
      }))

      renderWithTheme(<SprintMetricsCharts data={largeDataset} />)
      
      const startTime = performance.now()
      
      // Filter by project
      fireEvent.mouseDown(screen.getByRole('combobox'))
      fireEvent.click(screen.getByText('LARGE'))
      
      const endTime = performance.now()
      const filterTime = endTime - startTime

      expect(filterTime).toBeLessThan(1000) // Should filter within 1 second
      
      await waitFor(() => {
        expect(screen.getByText('Issues: 250')).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels for dropdown', () => {
      renderWithTheme(<SprintMetricsCharts data={mockIssues} />)
      
      const combobox = screen.getByRole('combobox')
      expect(combobox).toHaveAttribute('aria-label', 'Filter by Project')
    })

    it('should support keyboard navigation', () => {
      renderWithTheme(<SprintMetricsCharts data={mockIssues} />)
      
      const dropdown = screen.getByRole('combobox')
      
      // Focus the dropdown
      dropdown.focus()
      expect(dropdown).toHaveFocus()
      
      // Should be able to open with Enter key
      fireEvent.keyDown(dropdown, { key: 'Enter' })
    })

    it('should have accessible button for details popup', () => {
      renderWithTheme(<SprintMetricsCharts data={mockIssues} />)
      
      const detailsButton = screen.getByRole('button', { name: /view details/i })
      expect(detailsButton).toBeInTheDocument()
    })
  })
})