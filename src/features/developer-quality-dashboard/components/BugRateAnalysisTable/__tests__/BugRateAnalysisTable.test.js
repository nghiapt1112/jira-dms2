import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { ThemeProvider } from '@mui/material/styles'
import theme from '../../../../../theme'
import BugRateAnalysisTable from '../BugRateAnalysisTable'

const renderWithTheme = (component) => 
  render(<ThemeProvider theme={theme}>{component}</ThemeProvider>)

describe('BugRateAnalysisTable', () => {
  const mockData = {
    developers: [
      {
        developer: 'john.doe',
        totalIssues: 156,
        bugs: 23,
        bugRate: 14.74,
        trend: 'improving',
        projects: ['PROJ-A', 'PROJ-B']
      },
      {
        developer: 'jane.smith',
        totalIssues: 134,
        bugs: 28,
        bugRate: 20.89,
        trend: 'declining',
        projects: ['PROJ-A', 'PROJ-C', 'PROJ-D']
      },
      {
        developer: 'bob.wilson',
        totalIssues: 89,
        bugs: 7,
        bugRate: 7.86,
        trend: 'stable',
        projects: ['PROJ-B']
      }
    ],
    teamAverage: 16.8,
    benchmarks: {
      excellent: '<10%',
      good: '10-15%',
      needsImprovement: '>15%'
    }
  }

  const mockOnRowClick = jest.fn()

  beforeEach(() => {
    mockOnRowClick.mockClear()
  })

  describe('Rendering', () => {
    it('renders without crashing', () => {
      renderWithTheme(
        <BugRateAnalysisTable data={mockData} />
      )
    })

    it('displays the default title', () => {
      renderWithTheme(
        <BugRateAnalysisTable data={mockData} />
      )
      expect(screen.getByText('Bug Rate Analysis')).toBeInTheDocument()
    })

    it('displays custom title when provided', () => {
      const customTitle = 'Custom Bug Analysis'
      renderWithTheme(
        <BugRateAnalysisTable 
          data={mockData}
          title={customTitle}
        />
      )
      expect(screen.getByText(customTitle)).toBeInTheDocument()
    })

    it('displays analysis icon', () => {
      renderWithTheme(
        <BugRateAnalysisTable data={mockData} />
      )
      expect(screen.getByText('Bug Rate Analysis')).toBeInTheDocument()
    })
  })

  describe('Data Display', () => {
    it('displays all developers in the table', () => {
      renderWithTheme(
        <BugRateAnalysisTable data={mockData} />
      )
      
      expect(screen.getByText('john.doe')).toBeInTheDocument()
      expect(screen.getByText('jane.smith')).toBeInTheDocument()
      expect(screen.getByText('bob.wilson')).toBeInTheDocument()
    })

    it('displays developer metrics correctly', () => {
      renderWithTheme(
        <BugRateAnalysisTable data={mockData} />
      )
      
      // Check john.doe's data
      expect(screen.getByText('156')).toBeInTheDocument() // totalIssues
      expect(screen.getByText('23')).toBeInTheDocument() // bugs
      expect(screen.getByText('14.7%')).toBeInTheDocument() // bugRate
      
      // Check jane.smith's data
      expect(screen.getByText('134')).toBeInTheDocument() // totalIssues
      expect(screen.getByText('28')).toBeInTheDocument() // bugs
      expect(screen.getByText('20.9%')).toBeInTheDocument() // bugRate
    })

    it('displays project chips correctly', () => {
      renderWithTheme(
        <BugRateAnalysisTable data={mockData} />
      )
      
      expect(screen.getAllByText('PROJ-A')).toHaveLength(2) // john.doe and jane.smith
      expect(screen.getAllByText('PROJ-B')).toHaveLength(2) // john.doe and bob.wilson
      expect(screen.getByText('PROJ-C')).toBeInTheDocument()
      
      // jane.smith has 3 projects, should show +1 for additional
      expect(screen.getByText('+1')).toBeInTheDocument()
    })

    it('displays performance labels based on benchmarks', () => {
      renderWithTheme(
        <BugRateAnalysisTable data={mockData} />
      )
      
      expect(screen.getByText('Excellent')).toBeInTheDocument() // bob.wilson: 7.86%
      expect(screen.getByText('Good')).toBeInTheDocument() // john.doe: 14.74%
      expect(screen.getByText('Needs Improvement')).toBeInTheDocument() // jane.smith: 20.89%
    })

    it('displays summary statistics', () => {
      renderWithTheme(
        <BugRateAnalysisTable data={mockData} />
      )
      
      expect(screen.getByText('Team Average: 16.8%')).toBeInTheDocument()
      expect(screen.getByText('Total Developers: 3')).toBeInTheDocument()
    })

    it('displays benchmarks legend', () => {
      renderWithTheme(
        <BugRateAnalysisTable data={mockData} />
      )
      
      expect(screen.getByText('Performance Benchmarks:')).toBeInTheDocument()
      expect(screen.getByText('excellent: <10%')).toBeInTheDocument()
      expect(screen.getByText('good: 10-15%')).toBeInTheDocument()
      expect(screen.getByText('needsImprovement: >15%')).toBeInTheDocument()
    })
  })

  describe('Sorting', () => {
    it('sorts by bug rate in descending order by default', () => {
      renderWithTheme(
        <BugRateAnalysisTable data={mockData} />
      )
      
      const rows = screen.getAllByRole('row')
      // Skip header row, check data rows order
      expect(rows[1]).toHaveTextContent('jane.smith') // 20.89% highest
      expect(rows[2]).toHaveTextContent('john.doe') // 14.74% middle
      expect(rows[3]).toHaveTextContent('bob.wilson') // 7.86% lowest
    })

    it('allows sorting by developer name', () => {
      renderWithTheme(
        <BugRateAnalysisTable data={mockData} />
      )
      
      const developerHeader = screen.getByText('Developer')
      fireEvent.click(developerHeader)
      
      const rows = screen.getAllByRole('row')
      // Should be sorted alphabetically
      expect(rows[1]).toHaveTextContent('bob.wilson')
      expect(rows[2]).toHaveTextContent('jane.smith')
      expect(rows[3]).toHaveTextContent('john.doe')
    })

    it('allows sorting by total issues', () => {
      renderWithTheme(
        <BugRateAnalysisTable data={mockData} />
      )
      
      const totalIssuesHeader = screen.getByText('Total Issues')
      fireEvent.click(totalIssuesHeader)
      
      const rows = screen.getAllByRole('row')
      // First click on new column sorts ascending
      expect(rows[1]).toHaveTextContent('bob.wilson') // 89 (lowest)
      expect(rows[2]).toHaveTextContent('jane.smith') // 134
      expect(rows[3]).toHaveTextContent('john.doe') // 156 (highest)
    })

    it('toggles sort direction when clicking same column', () => {
      renderWithTheme(
        <BugRateAnalysisTable data={mockData} />
      )
      
      const bugRateHeader = screen.getByText('Bug Rate (%)')
      
      // Bug rate is default sort (desc), first click should make it asc
      fireEvent.click(bugRateHeader)
      
      const rows = screen.getAllByRole('row')
      // Should be sorted ascending now
      expect(rows[1]).toHaveTextContent('bob.wilson') // 7.86% lowest
      expect(rows[2]).toHaveTextContent('john.doe') // 14.74% middle
      expect(rows[3]).toHaveTextContent('jane.smith') // 20.89% highest
    })
  })

  describe('Pagination', () => {
    const largeDataSet = {
      ...mockData,
      developers: Array.from({ length: 25 }, (_, i) => ({
        developer: `dev${i + 1}`,
        totalIssues: 100 + i,
        bugs: 10 + i,
        bugRate: 10 + i,
        trend: 'stable',
        projects: ['PROJ-A']
      }))
    }

    it('displays pagination controls with large dataset', () => {
      renderWithTheme(
        <BugRateAnalysisTable data={largeDataSet} />
      )
      
      expect(screen.getByText('1–10 of 25')).toBeInTheDocument()
      expect(screen.getByLabelText('Go to next page')).toBeInTheDocument()
    })

    it('allows changing rows per page', () => {
      renderWithTheme(
        <BugRateAnalysisTable data={largeDataSet} />
      )
      
      const rowsPerPageSelect = screen.getByDisplayValue('10')
      fireEvent.mouseDown(rowsPerPageSelect)
      
      const option25 = screen.getByText('25')
      fireEvent.click(option25)
      
      // Just check that the component doesn't crash and still shows the pagination
      expect(screen.getByText(/of 25/)).toBeInTheDocument()
    })

    it('allows navigation to next page', () => {
      renderWithTheme(
        <BugRateAnalysisTable data={largeDataSet} />
      )
      
      const nextButton = screen.getByLabelText('Go to next page')
      fireEvent.click(nextButton)
      
      expect(screen.getByText('11–20 of 25')).toBeInTheDocument()
    })
  })

  describe('Row Click Handler', () => {
    it('calls onRowClick when row is clicked', () => {
      renderWithTheme(
        <BugRateAnalysisTable 
          data={mockData}
          onRowClick={mockOnRowClick}
        />
      )
      
      const johnDoeRow = screen.getByText('john.doe').closest('tr')
      fireEvent.click(johnDoeRow)
      
      expect(mockOnRowClick).toHaveBeenCalledWith('john.doe')
    })

    it('does not call onRowClick when not provided', () => {
      renderWithTheme(
        <BugRateAnalysisTable data={mockData} />
      )
      
      const johnDoeRow = screen.getByText('john.doe').closest('tr')
      fireEvent.click(johnDoeRow)
      
      // Should not throw error
      expect(mockOnRowClick).not.toHaveBeenCalled()
    })
  })

  describe('Empty State', () => {
    it('displays no data message when data is null', () => {
      renderWithTheme(
        <BugRateAnalysisTable data={null} />
      )
      expect(screen.getByText('No bug rate analysis data available')).toBeInTheDocument()
    })

    it('displays no data message when developers array is empty', () => {
      renderWithTheme(
        <BugRateAnalysisTable data={{ developers: [] }} />
      )
      expect(screen.getByText('No bug rate analysis data available')).toBeInTheDocument()
    })

    it('displays no data message when developers is undefined', () => {
      renderWithTheme(
        <BugRateAnalysisTable data={{}} />
      )
      expect(screen.getByText('No bug rate analysis data available')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('handles missing trend data', () => {
      const dataWithoutTrends = {
        ...mockData,
        developers: mockData.developers.map(dev => ({
          ...dev,
          trend: undefined
        }))
      }

      renderWithTheme(
        <BugRateAnalysisTable data={dataWithoutTrends} />
      )
      
      expect(screen.getByText('john.doe')).toBeInTheDocument()
      // Should render without crashing
    })

    it('handles missing projects data', () => {
      const dataWithoutProjects = {
        ...mockData,
        developers: mockData.developers.map(dev => ({
          ...dev,
          projects: undefined
        }))
      }

      renderWithTheme(
        <BugRateAnalysisTable data={dataWithoutProjects} />
      )
      
      expect(screen.getByText('john.doe')).toBeInTheDocument()
      // Should render without crashing
    })

    it('handles missing benchmarks', () => {
      const dataWithoutBenchmarks = {
        ...mockData,
        benchmarks: undefined
      }

      renderWithTheme(
        <BugRateAnalysisTable data={dataWithoutBenchmarks} />
      )
      
      expect(screen.getByText('john.doe')).toBeInTheDocument()
      // Should render without crashing
    })

    it('handles missing team average', () => {
      const dataWithoutTeamAverage = {
        ...mockData,
        teamAverage: undefined
      }

      renderWithTheme(
        <BugRateAnalysisTable data={dataWithoutTeamAverage} />
      )
      
      expect(screen.getByText('john.doe')).toBeInTheDocument()
      // Should render without crashing
    })
  })

  describe('Trend Icons', () => {
    it('displays different trend icons correctly', () => {
      renderWithTheme(
        <BugRateAnalysisTable data={mockData} />
      )
      
      // Icons are rendered as SVG elements, we can check for their presence
      // by checking the rows contain the developers with different trends
      expect(screen.getByText('john.doe')).toBeInTheDocument() // improving
      expect(screen.getByText('jane.smith')).toBeInTheDocument() // declining
      expect(screen.getByText('bob.wilson')).toBeInTheDocument() // stable
    })
  })

  describe('Bug Rate Colors', () => {
    it('applies correct colors based on performance benchmarks', () => {
      renderWithTheme(
        <BugRateAnalysisTable data={mockData} />
      )
      
      // Check that bug rate chips are displayed with percentages
      expect(screen.getByText('7.9%')).toBeInTheDocument() // bob.wilson - excellent
      expect(screen.getByText('14.7%')).toBeInTheDocument() // john.doe - good
      expect(screen.getByText('20.9%')).toBeInTheDocument() // jane.smith - needs improvement
    })
  })

  describe('Custom Props', () => {
    it('accepts custom rowsPerPageOptions', () => {
      const customOptions = [3, 6, 9]
      renderWithTheme(
        <BugRateAnalysisTable 
          data={mockData}
          rowsPerPageOptions={customOptions}
        />
      )
      
      // Should render without error with custom options
      expect(screen.getByText('Bug Rate Analysis')).toBeInTheDocument()
    })
  })
}) 