import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { ThemeProvider } from '@mui/material/styles'
import { createTheme } from '@mui/material/styles'
import MainDashboard from '../MainDashboard'
import { getMockJiraDataHook, getMockCacheHook, getMockProjectData } from '../../__tests__/testData'

// Mock the hooks
jest.mock('../../../jira-data/hooks/useJiraData')
jest.mock('../../hooks/useMainDashboardCache')

// Mock the child components
jest.mock('../ProjectHealthOverview', () => {
  return function MockProjectHealthOverview({ data, onProjectClick }) {
    return (
      <div data-testid="project-health-overview">
        <div>Project Health Overview</div>
        <div>Projects: {data?.length || 0}</div>
        <button onClick={() => onProjectClick?.('TEST-1', data?.[0])}>
          Click Project
        </button>
      </div>
    )
  }
})

jest.mock('../ProjectDelivery', () => {
  return function MockProjectDelivery({ data, onProjectClick }) {
    return (
      <div data-testid="project-delivery">
        <div>Project Delivery</div>
        <div>Projects: {data?.length || 0}</div>
      </div>
    )
  }
})

jest.mock('../SprintMetricsChartsDashboard', () => {
  return function MockSprintMetricsChartsDashboard({ data, defaultSelectedProject }) {
    return (
      <div data-testid="sprint-metrics-dashboard">
        <div>Sprint Metrics Dashboard</div>
        <div>Selected Project: {defaultSelectedProject}</div>
        <div>Issues: {data?.length || 0}</div>
      </div>
    )
  }
})

jest.mock('../../utils/CacheManager', () => {
  return function MockCacheManager({ cacheHook, defaultExpanded }) {
    return (
      <div data-testid="cache-manager">
        <div>Cache Manager</div>
        <div>Expanded: {defaultExpanded ? 'true' : 'false'}</div>
        <button onClick={() => cacheHook?.clearCache()}>Clear Cache</button>
      </div>
    )
  }
})

jest.mock('../../utils/CachePerformanceMonitor', () => {
  return function MockCachePerformanceMonitor({ cacheHook, defaultExpanded }) {
    return (
      <div data-testid="cache-performance-monitor">
        <div>Cache Performance Monitor</div>
        <div>Hit Rate: {cacheHook?.performanceMetrics?.hitRate || 0}%</div>
      </div>
    )
  }
})

// Create theme for testing
const theme = createTheme()

const renderWithTheme = (component, props = {}) => {
  return render(
    <ThemeProvider theme={theme}>
      {React.cloneElement(component, props)}
    </ThemeProvider>
  )
}

describe('MainDashboard', () => {
  let mockUseJiraData
  let mockUseMainDashboardCache

  beforeEach(() => {
    // Reset mocks
    mockUseJiraData = getMockJiraDataHook()
    mockUseMainDashboardCache = getMockCacheHook()

    require('../../../jira-data/hooks/useJiraData').useJiraData.mockReturnValue(mockUseJiraData)
    require('../../hooks/useMainDashboardCache').useMainDashboardCache.mockReturnValue(mockUseMainDashboardCache)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Loading States', () => {
    it('should show loading indicator when data is loading', () => {
      mockUseJiraData.isLoading = true
      mockUseJiraData.hasData = false

      renderWithTheme(<MainDashboard />)

      expect(screen.getByText('Loading JIRA data...')).toBeInTheDocument()
      expect(screen.getByRole('progressbar')).toBeInTheDocument()
    })

    it('should show cache processing indicator', async () => {
      // Set up state where data exists but cache is processing
      mockUseJiraData.hasData = true
      mockUseJiraData.isLoading = false

      renderWithTheme(<MainDashboard />)

      // Wait for the component to process cache
      await waitFor(() => {
        expect(screen.getByText('Processing dashboard data...')).toBeInTheDocument()
      })
    })
  })

  describe('Error States', () => {
    it('should show error message when data loading fails', () => {
      mockUseJiraData.error = new Error('Failed to load data')
      mockUseJiraData.hasData = false
      mockUseJiraData.isLoading = false

      renderWithTheme(<MainDashboard />)

      expect(screen.getByText('Failed to load data')).toBeInTheDocument()
      expect(screen.getByText('Retry')).toBeInTheDocument()
    })

    it('should call refreshData when retry button is clicked', () => {
      mockUseJiraData.error = new Error('Failed to load data')
      mockUseJiraData.hasData = false
      mockUseJiraData.isLoading = false

      renderWithTheme(<MainDashboard />)

      fireEvent.click(screen.getByText('Retry'))
      expect(mockUseJiraData.refreshData).toHaveBeenCalled()
    })
  })

  describe('No Data State', () => {
    it('should show no data message when no data is available', () => {
      mockUseJiraData.hasData = false
      mockUseJiraData.isLoading = false
      mockUseJiraData.error = null

      renderWithTheme(<MainDashboard />)

      expect(screen.getByText('No JIRA data available. Click "Load Data" to fetch issues.')).toBeInTheDocument()
      expect(screen.getByText('Load Data')).toBeInTheDocument()
    })

    it('should call fetchData when Load Data button is clicked', () => {
      mockUseJiraData.hasData = false
      mockUseJiraData.isLoading = false
      mockUseJiraData.error = null

      renderWithTheme(<MainDashboard />)

      fireEvent.click(screen.getByText('Load Data'))
      expect(mockUseJiraData.fetchData).toHaveBeenCalled()
    })
  })

  describe('Dashboard Content', () => {
    beforeEach(() => {
      // Set up successful data state
      mockUseJiraData.hasData = true
      mockUseJiraData.isLoading = false
      mockUseJiraData.error = null
      
      // Mock successful cache processing
      mockUseMainDashboardCache.processIssuesWithCache.mockResolvedValue({
        data: {
          projects: getMockProjectData(),
          metrics: {
            totalProjects: 2,
            avgQualityScore: 80,
            avgHealthScore: 85,
            avgDeliveryScore: 81.5,
            totalIssues: 40,
            totalBugs: 5
          }
        }
      })
    })

    it('should render main dashboard title', async () => {
      renderWithTheme(<MainDashboard />)

      expect(screen.getByText('Main Dashboard')).toBeInTheDocument()
    })

    it('should render refresh button', async () => {
      renderWithTheme(<MainDashboard />)

      const refreshButton = screen.getByText('Refresh')
      expect(refreshButton).toBeInTheDocument()
      
      fireEvent.click(refreshButton)
      expect(mockUseJiraData.refreshData).toHaveBeenCalled()
    })

    it('should show stale data warning when data is stale', async () => {
      mockUseJiraData.isDataStale = jest.fn().mockReturnValue(true)

      renderWithTheme(<MainDashboard />)

      expect(screen.getByText('Data is stale')).toBeInTheDocument()
    })

    it('should render all dashboard components when data is available', async () => {
      renderWithTheme(<MainDashboard />)

      await waitFor(() => {
        expect(screen.getByTestId('project-health-overview')).toBeInTheDocument()
        expect(screen.getByTestId('project-delivery')).toBeInTheDocument()
        expect(screen.getByTestId('sprint-metrics-dashboard')).toBeInTheDocument()
      })
    })

    it('should render cache controls when showCacheControls is true', async () => {
      renderWithTheme(<MainDashboard showCacheControls={true} />)

      await waitFor(() => {
        expect(screen.getByTestId('cache-manager')).toBeInTheDocument()
        expect(screen.getByTestId('cache-performance-monitor')).toBeInTheDocument()
      })
    })

    it('should not render cache controls when showCacheControls is false', async () => {
      renderWithTheme(<MainDashboard showCacheControls={false} />)

      await waitFor(() => {
        expect(screen.queryByTestId('cache-manager')).not.toBeInTheDocument()
        expect(screen.queryByTestId('cache-performance-monitor')).not.toBeInTheDocument()
      })
    })
  })

  describe('Portfolio Overview Metrics', () => {
    beforeEach(() => {
      mockUseJiraData.hasData = true
      mockUseJiraData.isLoading = false
      mockUseJiraData.error = null
      
      mockUseMainDashboardCache.processIssuesWithCache.mockResolvedValue({
        data: {
          projects: getMockProjectData(),
          metrics: {
            totalProjects: 2,
            avgQualityScore: 85,
            avgHealthScore: 90,
            avgDeliveryScore: 82,
            totalIssues: 40,
            totalBugs: 5
          }
        }
      })
    })

    it('should display portfolio overview metrics', async () => {
      renderWithTheme(<MainDashboard />)

      await waitFor(() => {
        expect(screen.getByText('Portfolio Overview')).toBeInTheDocument()
        expect(screen.getByText('Total Projects')).toBeInTheDocument()
        expect(screen.getByText('Total Issues')).toBeInTheDocument()
        expect(screen.getByText('Total Bugs')).toBeInTheDocument()
        expect(screen.getByText('Avg Quality')).toBeInTheDocument()
        expect(screen.getByText('Avg Health')).toBeInTheDocument()
        expect(screen.getByText('Avg Delivery')).toBeInTheDocument()
      })
    })

    it('should show correct metric values', async () => {
      renderWithTheme(<MainDashboard />)

      await waitFor(() => {
        expect(screen.getByText('2')).toBeInTheDocument() // Total Projects
        expect(screen.getByText('40')).toBeInTheDocument() // Total Issues  
        expect(screen.getByText('5')).toBeInTheDocument() // Total Bugs
        expect(screen.getByText('85%')).toBeInTheDocument() // Avg Quality
        expect(screen.getByText('90%')).toBeInTheDocument() // Avg Health
        expect(screen.getByText('82%')).toBeInTheDocument() // Avg Delivery
      })
    })
  })

  describe('Cache Performance Display', () => {
    beforeEach(() => {
      mockUseJiraData.hasData = true
      mockUseJiraData.isLoading = false
      mockUseJiraData.error = null
      mockUseJiraData.lastFetched = Date.now() - 1800000 // 30 minutes ago
    })

    it('should display cache performance summary', async () => {
      renderWithTheme(<MainDashboard showCacheControls={true} />)

      await waitFor(() => {
        expect(screen.getByText('Cache Performance')).toBeInTheDocument()
        expect(screen.getByText('Optimal')).toBeInTheDocument()
        expect(screen.getByText('Hit Rate')).toBeInTheDocument()
        expect(screen.getByText('85.5%')).toBeInTheDocument()
        expect(screen.getByText('Avg Response Time')).toBeInTheDocument()
        expect(screen.getByText('8.2ms')).toBeInTheDocument()
      })
    })
  })

  describe('Project Selection', () => {
    beforeEach(() => {
      mockUseJiraData.hasData = true
      mockUseJiraData.isLoading = false
      mockUseJiraData.error = null
      
      mockUseMainDashboardCache.processIssuesWithCache.mockResolvedValue({
        data: {
          projects: getMockProjectData(),
          metrics: {
            totalProjects: 2,
            avgQualityScore: 80,
            avgHealthScore: 85,
            avgDeliveryScore: 81.5,
            totalIssues: 40,
            totalBugs: 5
          }
        }
      })
    })

    it('should filter projects when selectedProjects prop is provided', async () => {
      renderWithTheme(<MainDashboard selectedProjects={['YUIM']} />)

      await waitFor(() => {
        // Should pass filtered data to components
        expect(screen.getByTestId('project-health-overview')).toBeInTheDocument()
        expect(screen.getByTestId('project-delivery')).toBeInTheDocument()
      })
    })

    it('should handle project click events', async () => {
      renderWithTheme(<MainDashboard />)

      await waitFor(() => {
        const projectButton = screen.getByText('Click Project')
        fireEvent.click(projectButton)
        // Should not throw error when clicking project
        expect(projectButton).toBeInTheDocument()
      })
    })
  })

  describe('Component Integration', () => {
    beforeEach(() => {
      mockUseJiraData.hasData = true
      mockUseJiraData.isLoading = false
      mockUseJiraData.error = null
      
      mockUseMainDashboardCache.processIssuesWithCache.mockResolvedValue({
        data: {
          projects: getMockProjectData(),
          metrics: {
            totalProjects: 2,
            avgQualityScore: 80,
            avgHealthScore: 85,
            avgDeliveryScore: 81.5,
            totalIssues: 40,
            totalBugs: 5
          }
        }
      })
    })

    it('should pass correct props to child components', async () => {
      renderWithTheme(<MainDashboard selectedProjects={['YUIM']} />)

      await waitFor(() => {
        // Check that components receive correct data
        expect(screen.getByText('Projects: 2')).toBeInTheDocument()
        expect(screen.getByText('Selected Project: YUIM')).toBeInTheDocument()
        expect(screen.getByText('Issues: 20')).toBeInTheDocument() // From mock data
      })
    })

    it('should handle cache hook interactions', async () => {
      renderWithTheme(<MainDashboard showCacheControls={true} />)

      await waitFor(() => {
        const clearCacheButton = screen.getByText('Clear Cache')
        fireEvent.click(clearCacheButton)
        expect(mockUseMainDashboardCache.clearCache).toHaveBeenCalled()
      })
    })
  })

  describe('Responsive Behavior', () => {
    it('should render without errors on different screen sizes', async () => {
      // Test mobile viewport
      global.innerWidth = 375
      global.dispatchEvent(new Event('resize'))

      renderWithTheme(<MainDashboard />)

      await waitFor(() => {
        expect(screen.getByText('Main Dashboard')).toBeInTheDocument()
      })

      // Test desktop viewport
      global.innerWidth = 1200
      global.dispatchEvent(new Event('resize'))

      expect(screen.getByText('Main Dashboard')).toBeInTheDocument()
    })
  })
})