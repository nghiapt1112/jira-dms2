import React from 'react'
import { render, screen } from '@testing-library/react'
import { ThemeProvider } from '@mui/material/styles'
import theme from '../../../../../theme'

import TeamContributionChart from '../TeamContributionChart'

const renderWithTheme = (component) =>
  render(<ThemeProvider theme={theme}>{component}</ThemeProvider>)

describe('TeamContributionChart', () => {
  const mockData = {
    data: [
      { 
        timePeriod: '2024-01',
        'John Doe': 15,
        'Jane Smith': 10,
        'Bob Johnson': 5
      },
      { 
        timePeriod: '2024-02',
        'John Doe': 20,
        'Jane Smith': 8,
        'Bob Johnson': 12
      }
    ]
  }

  const mockMetrics = {
    totalContributions: 1247,
    totalStoryPoints: 2468,
    averageContribution: 89.1,
    averageStoryPoints: 12345.7,
    contributionTrend: 'increasing',
    topContributors: [
      { 
        developer: 'John Doe', 
        contributions: 156, 
        storyPoints: 100,
        percentage: 45.2,
        storyPointsPercentage: 40.5
      },
      { 
        developer: 'Jane Smith', 
        contributions: 134, 
        storyPoints: 80,
        percentage: 38.8,
        storyPointsPercentage: 32.4
      },
      { 
        developer: 'Bob Johnson', 
        contributions: 98, 
        storyPoints: 67,
        percentage: 28.4,
        storyPointsPercentage: 27.1
      }
    ]
  }

  describe('Rendering', () => {
    it('renders without crashing', () => {
      renderWithTheme(<TeamContributionChart data={mockData} metrics={mockMetrics} />)
    })

    it('displays the default title', () => {
      renderWithTheme(<TeamContributionChart data={mockData} metrics={mockMetrics} />)
      expect(screen.getByText('Team Contribution by Story Points')).toBeInTheDocument()
    })

    it('displays custom title when provided', () => {
      const customTitle = 'Custom Team Stats'
      renderWithTheme(
        <TeamContributionChart 
          data={mockData} 
          metrics={mockMetrics} 
          title={customTitle}
        />
      )
      expect(screen.getByText(customTitle)).toBeInTheDocument()
    })

    it('displays trend icon', () => {
      renderWithTheme(<TeamContributionChart data={mockData} metrics={mockMetrics} />)
      expect(screen.getByTestId('TrendingUpIcon')).toBeInTheDocument()
    })
  })

  describe('Data Display', () => {
    it('displays total story points', () => {
      renderWithTheme(<TeamContributionChart data={mockData} metrics={mockMetrics} />)
      expect(screen.getByText('Total Story Points')).toBeInTheDocument()
      expect(screen.getByText('30')).toBeInTheDocument() // 15 + 10 + 5 from mockData
    })

    it('displays average per developer', () => {
      renderWithTheme(<TeamContributionChart data={mockData} metrics={mockMetrics} />)
      expect(screen.getByText('Average per Developer')).toBeInTheDocument()
      expect(screen.getByText('12345.7')).toBeInTheDocument()
    })

    it('displays top contributors with story points', () => {
      renderWithTheme(<TeamContributionChart data={mockData} metrics={mockMetrics} />)
      expect(screen.getByText('Top Contributors (by Story Points)')).toBeInTheDocument()
      expect(screen.getByText('John Doe (100pts)')).toBeInTheDocument()
      expect(screen.getByText('Jane Smith (80pts)')).toBeInTheDocument()
    })

    it('displays trend information', () => {
      renderWithTheme(<TeamContributionChart data={mockData} metrics={mockMetrics} />)
      expect(screen.getByText('increasing')).toBeInTheDocument()
      expect(screen.getByTestId('TrendingUpIcon')).toBeInTheDocument()
    })
  })

  describe('Top Contributors', () => {
    it('displays top contributors correctly', () => {
      renderWithTheme(<TeamContributionChart data={mockData} metrics={mockMetrics} />)
      expect(screen.getByText('Top Contributors (by Story Points)')).toBeInTheDocument()
      expect(screen.getByText('John Doe (100pts)')).toBeInTheDocument()
      expect(screen.getByText('Jane Smith (80pts)')).toBeInTheDocument()
      expect(screen.getByText('Bob Johnson (67pts)')).toBeInTheDocument()
    })

    it('limits top contributors to 3', () => {
      const manyContributors = {
        ...mockMetrics,
        topContributors: [
          { developer: 'dev1', contributions: 100, storyPoints: 50, percentage: 10.0, storyPointsPercentage: 20.0 },
          { developer: 'dev2', contributions: 90, storyPoints: 45, percentage: 9.0, storyPointsPercentage: 18.0 },
          { developer: 'dev3', contributions: 80, storyPoints: 40, percentage: 8.0, storyPointsPercentage: 16.0 },
          { developer: 'dev4', contributions: 70, storyPoints: 35, percentage: 7.0, storyPointsPercentage: 14.0 },
          { developer: 'dev5', contributions: 60, storyPoints: 30, percentage: 6.0, storyPointsPercentage: 12.0 }
        ]
      }
      
      renderWithTheme(<TeamContributionChart data={mockData} metrics={manyContributors} />)
      
      expect(screen.getByText('dev1 (50pts)')).toBeInTheDocument()
      expect(screen.getByText('dev2 (45pts)')).toBeInTheDocument()
      expect(screen.getByText('dev3 (40pts)')).toBeInTheDocument()
      expect(screen.queryByText('dev4 (35pts)')).not.toBeInTheDocument()
    })

    it('handles empty top contributors array', () => {
      const emptyMetrics = {
        ...mockMetrics,
        topContributors: []
      }
      
      renderWithTheme(<TeamContributionChart data={mockData} metrics={emptyMetrics} />)
      expect(screen.getByText('Top Contributors (by Story Points)')).toBeInTheDocument()
      // Should not crash and should render the section
    })
  })

  describe('Trend Icons', () => {
    it('displays increasing trend icon', () => {
      renderWithTheme(<TeamContributionChart data={mockData} metrics={mockMetrics} />)
      expect(screen.getByTestId('TrendingUpIcon')).toBeInTheDocument()
      expect(screen.getByText('increasing')).toBeInTheDocument()
    })

    it('displays decreasing trend icon', () => {
      const decreasingMetrics = { ...mockMetrics, contributionTrend: 'decreasing' }
      renderWithTheme(<TeamContributionChart data={mockData} metrics={decreasingMetrics} />)
      expect(screen.getByTestId('TrendingDownIcon')).toBeInTheDocument()
      expect(screen.getByText('decreasing')).toBeInTheDocument()
    })

    it('displays stable trend icon', () => {
      const stableMetrics = { ...mockMetrics, contributionTrend: 'stable' }
      renderWithTheme(<TeamContributionChart data={mockData} metrics={stableMetrics} />)
      expect(screen.getByTestId('TrendingFlatIcon')).toBeInTheDocument()
      expect(screen.getByText('stable')).toBeInTheDocument()
    })

    it('handles missing trend gracefully', () => {
      const noTrendMetrics = { ...mockMetrics, contributionTrend: undefined }
      renderWithTheme(<TeamContributionChart data={mockData} metrics={noTrendMetrics} />)
      
      // Should render without crashing
      expect(screen.getByText('Team Contribution by Story Points')).toBeInTheDocument()
    })
  })

  describe('Chart Configuration', () => {
    it('adjusts chart margins for many developers', () => {
      const manyDevsData = {
        data: Array.from({ length: 10 }, (_, i) => ({
          timePeriod: `2024-${String(i + 1).padStart(2, '0')}`,
          [`dev${i + 1}`]: Math.floor(Math.random() * 50) + 10
        }))
      }
      
      renderWithTheme(<TeamContributionChart data={manyDevsData} metrics={mockMetrics} height={500} />)
      
      // Should render without issues
      expect(screen.getByText('Team Contribution by Story Points')).toBeInTheDocument()
    })

    it('uses custom height prop', () => {
      renderWithTheme(<TeamContributionChart data={mockData} metrics={mockMetrics} height={600} />)
      
      // Component should render with custom height
      expect(screen.getByText('Team Contribution by Story Points')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('displays no data message when data is null', () => {
      renderWithTheme(<TeamContributionChart data={null} metrics={null} />)
      expect(screen.getByText('Team Contribution by Story Points - No Data Available')).toBeInTheDocument()
    })

    it('displays no data message when data array is empty', () => {
      renderWithTheme(<TeamContributionChart data={{ data: [] }} metrics={mockMetrics} />)
      expect(screen.getByText('Team Contribution by Story Points - No Data Available')).toBeInTheDocument()
    })

    it('handles undefined data properties', () => {
      renderWithTheme(<TeamContributionChart data={undefined} metrics={undefined} />)
      expect(screen.getByText('Team Contribution by Story Points - No Data Available')).toBeInTheDocument()
    })
  })

  describe('Responsive Behavior', () => {
    it('renders correctly with responsive props', () => {
      renderWithTheme(
        <TeamContributionChart
          data={mockData}
          metrics={mockMetrics}
          height={300}
        />
      )
      
      // Check that responsive elements are present
      expect(screen.getByText('Team Contribution by Story Points')).toBeInTheDocument()
      expect(screen.getByText('Total Story Points')).toBeInTheDocument()
      expect(screen.getByText('Average per Developer')).toBeInTheDocument()
      expect(screen.getByText('Top Contributors (by Story Points)')).toBeInTheDocument()
    })
  })
}) 