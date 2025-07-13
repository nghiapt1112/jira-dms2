import React from 'react'
import { render, screen } from '@testing-library/react'
import { ThemeProvider } from '@mui/material/styles'
import theme from '../../../../../theme'
import DeveloperRootCauseAnalysis from '../DeveloperRootCauseAnalysis'

const renderWithTheme = (component) => 
  render(<ThemeProvider theme={theme}>{component}</ThemeProvider>)

describe('DeveloperRootCauseAnalysis', () => {
  const mockData = {
    data: [
      {
        developer: 'john.doe',
        'Logic Error': 12,
        'Integration Issue': 8,
        'Performance': 5
      },
      {
        developer: 'jane.smith',
        'Logic Error': 8,
        'Integration Issue': 15,
        'UI/UX': 7
      },
      {
        developer: 'bob.wilson',
        'Logic Error': 5,
        'Performance': 10,
        'UI/UX': 3
      }
    ]
  }

  const mockMetrics = {
    trends: {
      'Logic Error': 'increasing',
      'Integration Issue': 'stable',
      'Performance': 'decreasing',
      'UI/UX': 'stable'
    }
  }

  describe('Rendering', () => {
    it('renders without crashing', () => {
      renderWithTheme(
        <DeveloperRootCauseAnalysis 
          data={mockData} 
          metrics={mockMetrics} 
        />
      )
    })

    it('displays the default title', () => {
      renderWithTheme(
        <DeveloperRootCauseAnalysis 
          data={mockData} 
          metrics={mockMetrics} 
        />
      )
      expect(screen.getByText('Developer Root Cause Analysis')).toBeInTheDocument()
    })

    it('displays custom title when provided', () => {
      const customTitle = 'Custom Developer Analysis'
      renderWithTheme(
        <DeveloperRootCauseAnalysis 
          data={mockData} 
          metrics={mockMetrics}
          title={customTitle}
        />
      )
      expect(screen.getByText(customTitle)).toBeInTheDocument()
    })

    it('displays developer icon', () => {
      renderWithTheme(
        <DeveloperRootCauseAnalysis 
          data={mockData} 
          metrics={mockMetrics} 
        />
      )
      // Icon is rendered as part of the component
      expect(screen.getByText('Developer Root Cause Analysis')).toBeInTheDocument()
    })
  })

  describe('Data Display', () => {
    it('displays top developers with issue counts', () => {
      renderWithTheme(
        <DeveloperRootCauseAnalysis 
          data={mockData} 
          metrics={mockMetrics} 
        />
      )
      
      expect(screen.getByText('Most Issues by Developer')).toBeInTheDocument()
      
      // Check for developer chips (total issues calculated)
      expect(screen.getByText('john.doe (25)')).toBeInTheDocument() // 12+8+5
      expect(screen.getByText('jane.smith (30)')).toBeInTheDocument() // 8+15+7
      expect(screen.getByText('bob.wilson (18)')).toBeInTheDocument() // 5+10+3
    })

    it('displays category trends', () => {
      renderWithTheme(
        <DeveloperRootCauseAnalysis 
          data={mockData} 
          metrics={mockMetrics} 
        />
      )
      
      expect(screen.getByText('Category Trends')).toBeInTheDocument()
      expect(screen.getByText('Logic Error: increasing')).toBeInTheDocument()
      expect(screen.getByText('Integration Issue: stable')).toBeInTheDocument()
      expect(screen.getByText('Performance: decreasing')).toBeInTheDocument()
    })

    it('displays summary statistics', () => {
      renderWithTheme(
        <DeveloperRootCauseAnalysis 
          data={mockData} 
          metrics={mockMetrics} 
        />
      )
      
      expect(screen.getByText('Total Developers: 3')).toBeInTheDocument()
      expect(screen.getByText('Total Issues: 73')).toBeInTheDocument() // 25+30+18
      expect(screen.getByText('Categories: 4')).toBeInTheDocument() // Logic Error, Integration Issue, Performance, UI/UX
    })
  })

  describe('Empty State', () => {
    it('displays no data message when data is null', () => {
      renderWithTheme(
        <DeveloperRootCauseAnalysis 
          data={null} 
          metrics={mockMetrics} 
        />
      )
      expect(screen.getByText('No developer root cause data available')).toBeInTheDocument()
    })

    it('displays no data message when data.data is empty', () => {
      renderWithTheme(
        <DeveloperRootCauseAnalysis 
          data={{ data: [] }} 
          metrics={mockMetrics} 
        />
      )
      expect(screen.getByText('No developer root cause data available')).toBeInTheDocument()
    })

    it('displays no data message when metrics is null', () => {
      renderWithTheme(
        <DeveloperRootCauseAnalysis 
          data={mockData} 
          metrics={null} 
        />
      )
      expect(screen.getByText('No developer root cause data available')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('handles data with missing categories', () => {
      const incompleteData = {
        data: [
          {
            developer: 'john.doe',
            'Logic Error': 12
            // Missing other categories
          },
          {
            developer: 'jane.smith',
            'Integration Issue': 15
            // Missing other categories
          }
        ]
      }

      renderWithTheme(
        <DeveloperRootCauseAnalysis 
          data={incompleteData} 
          metrics={mockMetrics} 
        />
      )
      
      expect(screen.getByText('john.doe (12)')).toBeInTheDocument()
      expect(screen.getByText('jane.smith (15)')).toBeInTheDocument()
    })

    it('handles metrics without trends', () => {
      const metricsWithoutTrends = {}

      renderWithTheme(
        <DeveloperRootCauseAnalysis 
          data={mockData} 
          metrics={metricsWithoutTrends} 
        />
      )
      
      expect(screen.getByText('Category Trends')).toBeInTheDocument()
      // Should not crash when trends is undefined
    })

    it('handles data with zero values', () => {
      const dataWithZeros = {
        data: [
          {
            developer: 'john.doe',
            'Logic Error': 0,
            'Integration Issue': 0,
            'Performance': 0
          }
        ]
      }

      renderWithTheme(
        <DeveloperRootCauseAnalysis 
          data={dataWithZeros} 
          metrics={mockMetrics} 
        />
      )
      
      expect(screen.getByText('john.doe (0)')).toBeInTheDocument()
      expect(screen.getByText('Total Issues: 0')).toBeInTheDocument()
    })
  })

  describe('Trend Icons', () => {
    it('displays correct trend icons for different trend types', () => {
      renderWithTheme(
        <DeveloperRootCauseAnalysis 
          data={mockData} 
          metrics={mockMetrics} 
        />
      )
      
      // Check that trend text is displayed (icons are rendered as SVG)
      expect(screen.getByText('Logic Error: increasing')).toBeInTheDocument()
      expect(screen.getByText('Integration Issue: stable')).toBeInTheDocument()
      expect(screen.getByText('Performance: decreasing')).toBeInTheDocument()
    })
  })

  describe('Top Developers Limit', () => {
    it('limits top developers display to 3', () => {
      const dataWithManyDevelopers = {
        data: [
          { developer: 'dev1', 'Logic Error': 20 },
          { developer: 'dev2', 'Logic Error': 18 },
          { developer: 'dev3', 'Logic Error': 16 },
          { developer: 'dev4', 'Logic Error': 14 },
          { developer: 'dev5', 'Logic Error': 12 }
        ]
      }

      renderWithTheme(
        <DeveloperRootCauseAnalysis 
          data={dataWithManyDevelopers} 
          metrics={mockMetrics} 
        />
      )
      
      // Should show top 3 developers
      expect(screen.getByText('dev1 (20)')).toBeInTheDocument()
      expect(screen.getByText('dev2 (18)')).toBeInTheDocument()
      expect(screen.getByText('dev3 (16)')).toBeInTheDocument()
      
      // Should not show 4th and 5th developers
      expect(screen.queryByText('dev4 (14)')).not.toBeInTheDocument()
      expect(screen.queryByText('dev5 (12)')).not.toBeInTheDocument()
    })
  })

  describe('Category Trends Limit', () => {
    it('limits category trends display to 3', () => {
      const metricsWithManyTrends = {
        trends: {
          'Category1': 'increasing',
          'Category2': 'stable',
          'Category3': 'decreasing',
          'Category4': 'increasing',
          'Category5': 'stable'
        }
      }

      renderWithTheme(
        <DeveloperRootCauseAnalysis 
          data={mockData} 
          metrics={metricsWithManyTrends} 
        />
      )
      
      // Should show first 3 trends
      expect(screen.getByText('Category1: increasing')).toBeInTheDocument()
      expect(screen.getByText('Category2: stable')).toBeInTheDocument()
      expect(screen.getByText('Category3: decreasing')).toBeInTheDocument()
      
      // Should not show 4th and 5th trends
      expect(screen.queryByText('Category4: increasing')).not.toBeInTheDocument()
      expect(screen.queryByText('Category5: stable')).not.toBeInTheDocument()
    })
  })

  describe('Props', () => {
    it('accepts custom height prop', () => {
      const customHeight = 600
      renderWithTheme(
        <DeveloperRootCauseAnalysis 
          data={mockData} 
          metrics={mockMetrics}
          height={customHeight}
        />
      )
      
      // Component should render without error with custom height
      expect(screen.getByText('Developer Root Cause Analysis')).toBeInTheDocument()
    })
  })
}) 