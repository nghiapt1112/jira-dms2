import React from 'react'
import { render, screen } from '@testing-library/react'
import { ThemeProvider } from '@mui/material/styles'
import theme from '../../../../../theme'

import TeamContributionChart from '../TeamContributionChart'

const renderWithTheme = (component) =>
  render(<ThemeProvider theme={theme}>{component}</ThemeProvider>)

const mockData = {
  data: [
    { name: 'john.doe', contributions: 156, percentage: 12.5 },
    { name: 'jane.smith', contributions: 134, percentage: 10.7 },
    { name: 'bob.wilson', contributions: 98, percentage: 7.8 }
  ]
}

const mockMetrics = {
  totalContributions: 1247,
  averageContribution: 89.07,
  contributionTrend: 'increasing',
  topContributors: [
    { developer: 'john.doe', contributions: 156, percentage: 12.5 },
    { developer: 'jane.smith', contributions: 134, percentage: 10.7 },
    { developer: 'bob.wilson', contributions: 98, percentage: 7.8 }
  ]
}

describe('TeamContributionChart', () => {
  describe('Rendering', () => {
    it('renders without crashing', () => {
      renderWithTheme(
        <TeamContributionChart
          data={mockData}
          metrics={mockMetrics}
        />
      )
      
      expect(screen.getByText('Team Contribution')).toBeInTheDocument()
    })

    it('renders with custom title', () => {
      const customTitle = 'Custom Team Chart'
      renderWithTheme(
        <TeamContributionChart
          data={mockData}
          metrics={mockMetrics}
          title={customTitle}
        />
      )
      
      expect(screen.getByText(customTitle)).toBeInTheDocument()
    })

    it('displays no data message when data is missing', () => {
      renderWithTheme(
        <TeamContributionChart
          data={null}
          metrics={null}
        />
      )
      
      expect(screen.getByText('Team Contribution - No Data Available')).toBeInTheDocument()
    })

    it('displays no data message when data array is empty', () => {
      renderWithTheme(
        <TeamContributionChart
          data={{ data: [] }}
          metrics={mockMetrics}
        />
      )
      
      expect(screen.getByText('Team Contribution - No Data Available')).toBeInTheDocument()
    })
  })

  describe('Metrics Display', () => {
    it('displays total contributions correctly', () => {
      renderWithTheme(
        <TeamContributionChart
          data={mockData}
          metrics={mockMetrics}
        />
      )
      
      expect(screen.getByText('Total Contributions')).toBeInTheDocument()
      expect(screen.getByText('1,247')).toBeInTheDocument()
    })

    it('displays average contribution correctly', () => {
      renderWithTheme(
        <TeamContributionChart
          data={mockData}
          metrics={mockMetrics}
        />
      )
      
      expect(screen.getByText('Average per Developer')).toBeInTheDocument()
      expect(screen.getByText('89.1')).toBeInTheDocument()
    })

    it('displays contribution trend correctly', () => {
      renderWithTheme(
        <TeamContributionChart
          data={mockData}
          metrics={mockMetrics}
        />
      )
      
      expect(screen.getByText('increasing')).toBeInTheDocument()
    })

    it('handles missing metrics gracefully', () => {
      const incompleteMetrics = {
        totalContributions: 1247
        // missing other fields
      }
      
      renderWithTheme(
        <TeamContributionChart
          data={mockData}
          metrics={incompleteMetrics}
        />
      )
      
      expect(screen.getByText('1,247')).toBeInTheDocument()
      expect(screen.getByText('0.0')).toBeInTheDocument() // default average
    })
  })

  describe('Top Contributors', () => {
    it('displays top contributors as chips', () => {
      renderWithTheme(
        <TeamContributionChart
          data={mockData}
          metrics={mockMetrics}
        />
      )
      
      expect(screen.getByText('Top Contributors')).toBeInTheDocument()
      expect(screen.getByText('john.doe (12.5%)')).toBeInTheDocument()
      expect(screen.getByText('jane.smith (10.7%)')).toBeInTheDocument()
      expect(screen.getByText('bob.wilson (7.8%)')).toBeInTheDocument()
    })

    it('limits top contributors to 3', () => {
      const metricsWithManyContributors = {
        ...mockMetrics,
        topContributors: [
          { developer: 'dev1', contributions: 100, percentage: 10 },
          { developer: 'dev2', contributions: 90, percentage: 9 },
          { developer: 'dev3', contributions: 80, percentage: 8 },
          { developer: 'dev4', contributions: 70, percentage: 7 },
          { developer: 'dev5', contributions: 60, percentage: 6 }
        ]
      }
      
      renderWithTheme(
        <TeamContributionChart
          data={mockData}
          metrics={metricsWithManyContributors}
        />
      )
      
      expect(screen.getByText('dev1 (10.0%)')).toBeInTheDocument()
      expect(screen.getByText('dev2 (9.0%)')).toBeInTheDocument()
      expect(screen.getByText('dev3 (8.0%)')).toBeInTheDocument()
      expect(screen.queryByText('dev4 (7.0%)')).not.toBeInTheDocument()
      expect(screen.queryByText('dev5 (6.0%)')).not.toBeInTheDocument()
    })

    it('handles empty top contributors array', () => {
      const metricsWithNoContributors = {
        ...mockMetrics,
        topContributors: []
      }
      
      renderWithTheme(
        <TeamContributionChart
          data={mockData}
          metrics={metricsWithNoContributors}
        />
      )
      
      expect(screen.getByText('Top Contributors')).toBeInTheDocument()
      // Should not crash and should render the section
    })
  })

  describe('Trend Icons', () => {
    it('displays increasing trend icon', () => {
      renderWithTheme(
        <TeamContributionChart
          data={mockData}
          metrics={{ ...mockMetrics, contributionTrend: 'increasing' }}
        />
      )
      
      // Check for the trend text
      expect(screen.getByText('increasing')).toBeInTheDocument()
    })

    it('displays decreasing trend icon', () => {
      renderWithTheme(
        <TeamContributionChart
          data={mockData}
          metrics={{ ...mockMetrics, contributionTrend: 'decreasing' }}
        />
      )
      
      expect(screen.getByText('decreasing')).toBeInTheDocument()
    })

    it('displays stable trend icon', () => {
      renderWithTheme(
        <TeamContributionChart
          data={mockData}
          metrics={{ ...mockMetrics, contributionTrend: 'stable' }}
        />
      )
      
      expect(screen.getByText('stable')).toBeInTheDocument()
    })

    it('handles missing trend gracefully', () => {
      const metricsWithoutTrend = {
        ...mockMetrics,
        contributionTrend: undefined
      }
      
      renderWithTheme(
        <TeamContributionChart
          data={mockData}
          metrics={metricsWithoutTrend}
        />
      )
      
      // Should render without crashing
      expect(screen.getByText('Team Contribution')).toBeInTheDocument()
    })
  })

  describe('Chart Configuration', () => {
    it('adjusts chart margins for many developers', () => {
      const dataWithManyDevelopers = {
        data: Array.from({ length: 10 }, (_, i) => ({
          name: `developer${i}`,
          contributions: 100 - i * 5,
          percentage: 10 - i * 0.5
        }))
      }
      
      renderWithTheme(
        <TeamContributionChart
          data={dataWithManyDevelopers}
          metrics={mockMetrics}
          height={500}
        />
      )
      
      // Should render without issues
      expect(screen.getByText('Team Contribution')).toBeInTheDocument()
    })

    it('uses custom height prop', () => {
      renderWithTheme(
        <TeamContributionChart
          data={mockData}
          metrics={mockMetrics}
          height={600}
        />
      )
      
      // Component should render with custom height
      expect(screen.getByText('Team Contribution')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('handles zero contributions', () => {
      const zeroData = {
        data: [
          { name: 'inactive.dev', contributions: 0, percentage: 0 }
        ]
      }
      
      const zeroMetrics = {
        totalContributions: 0,
        averageContribution: 0,
        contributionTrend: 'stable',
        topContributors: []
      }
      
      renderWithTheme(
        <TeamContributionChart
          data={zeroData}
          metrics={zeroMetrics}
        />
      )
      
      // Check that zero values are displayed (there might be multiple 0s)
      expect(screen.getAllByText('0')).toHaveLength(2) // One in chart, one in metrics
      expect(screen.getByText('0.0')).toBeInTheDocument()
    })

    it('handles very large numbers', () => {
      const largeMetrics = {
        totalContributions: 1234567,
        averageContribution: 12345.67,
        contributionTrend: 'increasing',
        topContributors: mockMetrics.topContributors
      }
      
      renderWithTheme(
        <TeamContributionChart
          data={mockData}
          metrics={largeMetrics}
        />
      )
      
      expect(screen.getByText('1,234,567')).toBeInTheDocument()
      expect(screen.getByText('12345.7')).toBeInTheDocument()
    })

    it('handles undefined data properties', () => {
      renderWithTheme(
        <TeamContributionChart
          data={undefined}
          metrics={undefined}
        />
      )
      
      expect(screen.getByText('Team Contribution - No Data Available')).toBeInTheDocument()
    })
  })

  describe('Responsive Behavior', () => {
    it('renders correctly with responsive props', () => {
      renderWithTheme(
        <TeamContributionChart
          data={mockData}
          metrics={mockMetrics}
        />
      )
      
      // Check that responsive elements are present
      expect(screen.getByText('Team Contribution')).toBeInTheDocument()
      expect(screen.getByText('Total Contributions')).toBeInTheDocument()
      expect(screen.getByText('Average per Developer')).toBeInTheDocument()
      expect(screen.getByText('Top Contributors')).toBeInTheDocument()
    })
  })
}) 