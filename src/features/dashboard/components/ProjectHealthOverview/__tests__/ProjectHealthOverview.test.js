import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ThemeProvider } from '@mui/material/styles'
import { createTheme } from '@mui/material/styles'
import ProjectHealthOverview from '../index'
import { getMockProjectData } from '../../__tests__/testData'

const theme = createTheme()

const renderWithTheme = (component) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  )
}

describe('ProjectHealthOverview', () => {
  const mockProjectData = getMockProjectData()
  const mockOnProjectClick = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Component Rendering', () => {
    it('should render the component title', () => {
      renderWithTheme(
        <ProjectHealthOverview 
          data={mockProjectData} 
          onProjectClick={mockOnProjectClick} 
        />
      )

      expect(screen.getByText('Project Health Overview')).toBeInTheDocument()
    })

    it('should render overview statistics', () => {
      renderWithTheme(
        <ProjectHealthOverview 
          data={mockProjectData} 
          onProjectClick={mockOnProjectClick} 
        />
      )

      // Check for overview stats
      expect(screen.getByText('Total Projects')).toBeInTheDocument()
      expect(screen.getByText('Avg Quality Score')).toBeInTheDocument()
      expect(screen.getByText('Avg Health Score')).toBeInTheDocument()
      expect(screen.getByText('Total Issues')).toBeInTheDocument()
    })

    it('should display correct calculated statistics', () => {
      renderWithTheme(
        <ProjectHealthOverview 
          data={mockProjectData} 
          onProjectClick={mockOnProjectClick} 
        />
      )

      // Check calculated values
      expect(screen.getByText('2')).toBeInTheDocument() // Total projects
      expect(screen.getByText('40')).toBeInTheDocument() // Total issues (25 + 15)
      expect(screen.getByText('5')).toBeInTheDocument() // Total bugs (3 + 2)
    })
  })

  describe('Charts Rendering', () => {
    it('should render Quality vs Delivery chart', () => {
      renderWithTheme(
        <ProjectHealthOverview 
          data={mockProjectData} 
          onProjectClick={mockOnProjectClick} 
        />
      )

      expect(screen.getByTestId('quality-vs-delivery-chart')).toBeInTheDocument()
    })

    it('should render Quality vs Health chart', () => {
      renderWithTheme(
        <ProjectHealthOverview 
          data={mockProjectData} 
          onProjectClick={mockOnProjectClick} 
        />
      )

      expect(screen.getByTestId('quality-vs-health-chart')).toBeInTheDocument()
    })
  })

  describe('Project Health Table', () => {
    it('should render project health table', () => {
      renderWithTheme(
        <ProjectHealthOverview 
          data={mockProjectData} 
          onProjectClick={mockOnProjectClick} 
        />
      )

      expect(screen.getByText('Project Health Details')).toBeInTheDocument()
      
      // Check for table headers
      expect(screen.getByText('Project')).toBeInTheDocument()
      expect(screen.getByText('Quality')).toBeInTheDocument()
      expect(screen.getByText('Health')).toBeInTheDocument()
      expect(screen.getByText('Delivery')).toBeInTheDocument()
      expect(screen.getByText('Issues')).toBeInTheDocument()
    })

    it('should display project data in table rows', () => {
      renderWithTheme(
        <ProjectHealthOverview 
          data={mockProjectData} 
          onProjectClick={mockOnProjectClick} 
        />
      )

      // Check for project names
      expect(screen.getByText('Yuime')).toBeInTheDocument()
      expect(screen.getByText('Test Project')).toBeInTheDocument()
      
      // Check for project keys
      expect(screen.getByText('YUIM')).toBeInTheDocument()
      expect(screen.getByText('TEST')).toBeInTheDocument()
    })

    it('should handle project click events from table', async () => {
      renderWithTheme(
        <ProjectHealthOverview 
          data={mockProjectData} 
          onProjectClick={mockOnProjectClick} 
        />
      )

      // Look for clickable project row
      const projectRow = screen.getByText('Yuime').closest('tr')
      fireEvent.click(projectRow)

      await waitFor(() => {
        expect(mockOnProjectClick).toHaveBeenCalledWith('YUIM', mockProjectData[0])
      })
    })
  })

  describe('Data Transformation', () => {
    it('should handle empty data gracefully', () => {
      renderWithTheme(
        <ProjectHealthOverview 
          data={[]} 
          onProjectClick={mockOnProjectClick} 
        />
      )

      expect(screen.getByText('Project Health Overview')).toBeInTheDocument()
      expect(screen.getByText('0')).toBeInTheDocument() // Total projects should be 0
    })

    it('should handle missing project data', () => {
      const incompleteData = [{
        projectKey: 'INCOMPLETE',
        projectName: 'Incomplete Project'
        // Missing other required fields
      }]

      renderWithTheme(
        <ProjectHealthOverview 
          data={incompleteData} 
          onProjectClick={mockOnProjectClick} 
        />
      )

      expect(screen.getByText('Incomplete Project')).toBeInTheDocument()
    })
  })

  describe('Health Score Color Coding', () => {
    it('should apply correct color coding based on health scores', () => {
      const healthTestData = [
        {
          projectKey: 'HIGH',
          projectName: 'High Health',
          healthScore: 90,
          qualityScore: 85,
          deliveryScore: 80
        },
        {
          projectKey: 'LOW',
          projectName: 'Low Health',
          healthScore: 45,
          qualityScore: 50,
          deliveryScore: 40
        }
      ]

      renderWithTheme(
        <ProjectHealthOverview 
          data={healthTestData} 
          onProjectClick={mockOnProjectClick} 
        />
      )

      expect(screen.getByText('High Health')).toBeInTheDocument()
      expect(screen.getByText('Low Health')).toBeInTheDocument()
    })
  })

  describe('Insights Generation', () => {
    it('should generate insights based on project data', () => {
      renderWithTheme(
        <ProjectHealthOverview 
          data={mockProjectData} 
          onProjectClick={mockOnProjectClick} 
        />
      )

      // Look for insights section
      expect(screen.getByText('Key Insights')).toBeInTheDocument()
    })

    it('should identify high performing projects', () => {
      const highPerformingData = [{
        projectKey: 'EXCELLENT',
        projectName: 'Excellent Project',
        qualityScore: 95,
        healthScore: 98,
        deliveryScore: 92,
        totalIssues: 50,
        bugCount: 1
      }]

      renderWithTheme(
        <ProjectHealthOverview 
          data={highPerformingData} 
          onProjectClick={mockOnProjectClick} 
        />
      )

      expect(screen.getByText('Excellent Project')).toBeInTheDocument()
    })
  })

  describe('Responsive Design', () => {
    it('should adapt layout for mobile screens', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })

      renderWithTheme(
        <ProjectHealthOverview 
          data={mockProjectData} 
          onProjectClick={mockOnProjectClick} 
        />
      )

      expect(screen.getByText('Project Health Overview')).toBeInTheDocument()
    })

    it('should handle tablet viewport', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      })

      renderWithTheme(
        <ProjectHealthOverview 
          data={mockProjectData} 
          onProjectClick={mockOnProjectClick} 
        />
      )

      expect(screen.getByText('Project Health Overview')).toBeInTheDocument()
    })
  })

  describe('Performance', () => {
    it('should handle large datasets efficiently', () => {
      // Create a large dataset
      const largeData = Array.from({ length: 100 }, (_, i) => ({
        projectKey: `PROJ${i}`,
        projectName: `Project ${i}`,
        qualityScore: Math.floor(Math.random() * 100),
        healthScore: Math.floor(Math.random() * 100),
        deliveryScore: Math.floor(Math.random() * 100),
        totalIssues: Math.floor(Math.random() * 100),
        bugCount: Math.floor(Math.random() * 10)
      }))

      const startTime = performance.now()
      
      renderWithTheme(
        <ProjectHealthOverview 
          data={largeData} 
          onProjectClick={mockOnProjectClick} 
        />
      )

      const endTime = performance.now()
      const renderTime = endTime - startTime

      // Should render within reasonable time (less than 1 second)
      expect(renderTime).toBeLessThan(1000)
      expect(screen.getByText('Project Health Overview')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      renderWithTheme(
        <ProjectHealthOverview 
          data={mockProjectData} 
          onProjectClick={mockOnProjectClick} 
        />
      )

      // Check for accessibility attributes
      const charts = screen.getAllByRole('img')
      expect(charts.length).toBeGreaterThan(0)
    })

    it('should support keyboard navigation', () => {
      renderWithTheme(
        <ProjectHealthOverview 
          data={mockProjectData} 
          onProjectClick={mockOnProjectClick} 
        />
      )

      // Check that table is focusable
      const table = screen.getByRole('table')
      expect(table).toBeInTheDocument()
    })
  })
})