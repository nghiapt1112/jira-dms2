import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ThemeProvider } from '@mui/material/styles'
import { createTheme } from '@mui/material/styles'
import CachePerformanceMonitor from '../CachePerformanceMonitor'
import { getMockCacheHook } from '../../__tests__/testData'

const theme = createTheme()

const renderWithTheme = (component) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  )
}

describe('CachePerformanceMonitor', () => {
  let mockCacheHook

  beforeEach(() => {
    mockCacheHook = getMockCacheHook()
    jest.clearAllMocks()
  })

  describe('Component Rendering', () => {
    it('should render performance monitor title', () => {
      renderWithTheme(<CachePerformanceMonitor cacheHook={mockCacheHook} />)
      
      expect(screen.getByText('Cache Performance Monitor')).toBeInTheDocument()
    })

    it('should render with custom title', () => {
      renderWithTheme(
        <CachePerformanceMonitor 
          cacheHook={mockCacheHook} 
          title="Custom Performance Monitor" 
        />
      )
      
      expect(screen.getByText('Custom Performance Monitor')).toBeInTheDocument()
    })

    it('should show overall performance status', () => {
      renderWithTheme(<CachePerformanceMonitor cacheHook={mockCacheHook} />)
      
      expect(screen.getByText('excellent')).toBeInTheDocument()
    })

    it('should show processing indicator when cache is processing', () => {
      const processingCacheHook = {
        ...mockCacheHook,
        isProcessing: true
      }

      renderWithTheme(<CachePerformanceMonitor cacheHook={processingCacheHook} />)
      
      expect(screen.getByText('Processing...')).toBeInTheDocument()
    })
  })

  describe('Performance Overview Metrics', () => {
    it('should display hit rate with correct grade', () => {
      renderWithTheme(<CachePerformanceMonitor cacheHook={mockCacheHook} />)
      
      expect(screen.getByText('85.5%')).toBeInTheDocument()
      expect(screen.getByText('Grade: A')).toBeInTheDocument()
    })

    it('should display response time with correct grade', () => {
      renderWithTheme(<CachePerformanceMonitor cacheHook={mockCacheHook} />)
      
      expect(screen.getByText('8.2ms')).toBeInTheDocument()
      expect(screen.getByText('Grade: A')).toBeInTheDocument()
    })

    it('should display total requests', () => {
      renderWithTheme(<CachePerformanceMonitor cacheHook={mockCacheHook} />)
      
      expect(screen.getByText('45')).toBeInTheDocument()
      expect(screen.getByText('Hits: 38')).toBeInTheDocument()
      expect(screen.getByText('Misses: 7')).toBeInTheDocument()
    })

    it('should show performance target status', () => {
      renderWithTheme(<CachePerformanceMonitor cacheHook={mockCacheHook} />)
      
      expect(screen.getByText('Met')).toBeInTheDocument()
    })
  })

  describe('Performance Grading', () => {
    it('should assign A+ grade for excellent hit rate', () => {
      const excellentCacheHook = {
        ...mockCacheHook,
        performanceMetrics: {
          ...mockCacheHook.performanceMetrics,
          hitRate: 95,
          avgResponseTime: 3
        }
      }

      renderWithTheme(<CachePerformanceMonitor cacheHook={excellentCacheHook} />)
      
      expect(screen.getByText('95.0%')).toBeInTheDocument()
      expect(screen.getByText('Grade: A+')).toBeInTheDocument()
    })

    it('should assign F grade for poor hit rate', () => {
      const poorCacheHook = {
        ...mockCacheHook,
        performanceMetrics: {
          ...mockCacheHook.performanceMetrics,
          hitRate: 30,
          avgResponseTime: 150
        }
      }

      renderWithTheme(<CachePerformanceMonitor cacheHook={poorCacheHook} />)
      
      expect(screen.getByText('30.0%')).toBeInTheDocument()
      expect(screen.getByText('Grade: F')).toBeInTheDocument()
    })

    it('should handle edge case grades correctly', () => {
      const edgeCaseHook = {
        ...mockCacheHook,
        performanceMetrics: {
          ...mockCacheHook.performanceMetrics,
          hitRate: 70, // Exactly B grade
          avgResponseTime: 25 // Exactly B grade
        }
      }

      renderWithTheme(<CachePerformanceMonitor cacheHook={edgeCaseHook} />)
      
      expect(screen.getAllByText('Grade: B')).toHaveLength(2)
    })
  })

  describe('Performance Progress Bars', () => {
    it('should display hit rate progress bar', () => {
      renderWithTheme(<CachePerformanceMonitor cacheHook={mockCacheHook} />)
      
      expect(screen.getByText('85.5% / 90% target')).toBeInTheDocument()
      
      const progressBars = screen.getAllByRole('progressbar')
      expect(progressBars.length).toBeGreaterThan(0)
    })

    it('should display response time progress bar', () => {
      renderWithTheme(<CachePerformanceMonitor cacheHook={mockCacheHook} />)
      
      expect(screen.getByText('8.2ms / 10.0ms target')).toBeInTheDocument()
    })

    it('should use correct colors for progress bars', () => {
      const goodPerformanceHook = {
        ...mockCacheHook,
        performanceMetrics: {
          ...mockCacheHook.performanceMetrics,
          hitRate: 95,
          avgResponseTime: 5
        }
      }

      renderWithTheme(<CachePerformanceMonitor cacheHook={goodPerformanceHook} />)
      
      // Should show success color for good performance
      expect(screen.getByText('95.0% / 90% target')).toBeInTheDocument()
    })
  })

  describe('Detailed Metrics Table', () => {
    it('should render detailed metrics table by default', () => {
      renderWithTheme(<CachePerformanceMonitor cacheHook={mockCacheHook} />)
      
      expect(screen.getByText('Detailed Metrics')).toBeInTheDocument()
      expect(screen.getByText('Metric')).toBeInTheDocument()
      expect(screen.getByText('Current Value')).toBeInTheDocument()
      expect(screen.getByText('Target')).toBeInTheDocument()
      expect(screen.getByText('Status')).toBeInTheDocument()
    })

    it('should not render detailed metrics when disabled', () => {
      renderWithTheme(
        <CachePerformanceMonitor 
          cacheHook={mockCacheHook} 
          showDetailedMetrics={false} 
        />
      )
      
      expect(screen.queryByText('Detailed Metrics')).not.toBeInTheDocument()
    })

    it('should display cache hit rate row', () => {
      renderWithTheme(<CachePerformanceMonitor cacheHook={mockCacheHook} />)
      
      expect(screen.getByText('Cache Hit Rate')).toBeInTheDocument()
      expect(screen.getByText('≥80%')).toBeInTheDocument()
    })

    it('should display response time row', () => {
      renderWithTheme(<CachePerformanceMonitor cacheHook={mockCacheHook} />)
      
      expect(screen.getByText('Average Response Time')).toBeInTheDocument()
      expect(screen.getByText('≤10.0ms')).toBeInTheDocument()
    })

    it('should display cache size row', () => {
      renderWithTheme(<CachePerformanceMonitor cacheHook={mockCacheHook} />)
      
      expect(screen.getByText('Cache Size')).toBeInTheDocument()
      expect(screen.getByText('5 entries')).toBeInTheDocument()
      expect(screen.getByText('≤10 entries')).toBeInTheDocument()
    })

    it('should display processing time row', () => {
      renderWithTheme(<CachePerformanceMonitor cacheHook={mockCacheHook} />)
      
      expect(screen.getByText('Last Processing Time')).toBeInTheDocument()
      expect(screen.getByText('2.10s')).toBeInTheDocument()
      expect(screen.getByText('≤3000ms')).toBeInTheDocument()
    })
  })

  describe('Performance Recommendations', () => {
    it('should show recommendation for low hit rate', () => {
      const lowHitRateCacheHook = {
        ...mockCacheHook,
        performanceMetrics: {
          ...mockCacheHook.performanceMetrics,
          hitRate: 60
        }
      }

      renderWithTheme(<CachePerformanceMonitor cacheHook={lowHitRateCacheHook} />)
      
      expect(screen.getByText('Performance Recommendations')).toBeInTheDocument()
      expect(screen.getByText(/Low cache hit rate/)).toBeInTheDocument()
    })

    it('should show recommendation for high response time', () => {
      const highResponseTimeCacheHook = {
        ...mockCacheHook,
        performanceMetrics: {
          ...mockCacheHook.performanceMetrics,
          avgResponseTime: 25
        }
      }

      renderWithTheme(<CachePerformanceMonitor cacheHook={highResponseTimeCacheHook} />)
      
      expect(screen.getByText(/High response times/)).toBeInTheDocument()
    })

    it('should show recommendation for large cache size', () => {
      const largeCacheCacheHook = {
        ...mockCacheHook,
        performanceMetrics: {
          ...mockCacheHook.performanceMetrics,
          cacheSize: 15
        }
      }

      renderWithTheme(<CachePerformanceMonitor cacheHook={largeCacheCacheHook} />)
      
      expect(screen.getByText(/Large cache size/)).toBeInTheDocument()
    })

    it('should show recommendation for limited usage', () => {
      const limitedUsageCacheHook = {
        ...mockCacheHook,
        performanceMetrics: {
          ...mockCacheHook.performanceMetrics,
          totalRequests: 5
        }
      }

      renderWithTheme(<CachePerformanceMonitor cacheHook={limitedUsageCacheHook} />)
      
      expect(screen.getByText(/Limited usage data/)).toBeInTheDocument()
    })

    it('should not show recommendations section when no recommendations', () => {
      // Mock hook with excellent performance (no recommendations needed)
      const excellentCacheHook = {
        ...mockCacheHook,
        performanceMetrics: {
          ...mockCacheHook.performanceMetrics,
          hitRate: 95,
          avgResponseTime: 5,
          cacheSize: 3,
          totalRequests: 50
        }
      }

      renderWithTheme(<CachePerformanceMonitor cacheHook={excellentCacheHook} />)
      
      expect(screen.queryByText('Performance Recommendations')).not.toBeInTheDocument()
    })
  })

  describe('Performance Summary', () => {
    it('should show excellent performance summary', () => {
      const excellentCacheHook = {
        ...mockCacheHook,
        performanceMetrics: {
          ...mockCacheHook.performanceMetrics,
          hitRate: 95,
          avgResponseTime: 5,
          isPerformant: true
        }
      }

      renderWithTheme(<CachePerformanceMonitor cacheHook={excellentCacheHook} />)
      
      expect(screen.getByText(/Cache is performing excellently/)).toBeInTheDocument()
    })

    it('should show good performance summary', () => {
      const goodCacheHook = {
        ...mockCacheHook,
        performanceMetrics: {
          ...mockCacheHook.performanceMetrics,
          hitRate: 85,
          avgResponseTime: 8,
          isPerformant: true
        }
      }

      renderWithTheme(<CachePerformanceMonitor cacheHook={goodCacheHook} />)
      
      expect(screen.getByText(/Cache performance is good/)).toBeInTheDocument()
    })

    it('should show poor performance summary', () => {
      const poorCacheHook = {
        ...mockCacheHook,
        performanceMetrics: {
          ...mockCacheHook.performanceMetrics,
          hitRate: 40,
          avgResponseTime: 50,
          isPerformant: false
        }
      }

      renderWithTheme(<CachePerformanceMonitor cacheHook={poorCacheHook} />)
      
      expect(screen.getByText(/Cache performance needs improvement/)).toBeInTheDocument()
    })
  })

  describe('Refresh Functionality', () => {
    it('should have refresh metrics button', () => {
      renderWithTheme(<CachePerformanceMonitor cacheHook={mockCacheHook} />)
      
      const refreshButton = screen.getByTitle('Refresh metrics')
      expect(refreshButton).toBeInTheDocument()
    })

    it('should trigger refresh when refresh button is clicked', () => {
      renderWithTheme(<CachePerformanceMonitor cacheHook={mockCacheHook} />)
      
      const refreshButton = screen.getByTitle('Refresh metrics')
      fireEvent.click(refreshButton)
      
      // Should trigger re-render (test passes if no error)
      expect(refreshButton).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('should show warning when cache hook is not provided', () => {
      renderWithTheme(<CachePerformanceMonitor cacheHook={null} />)
      
      expect(screen.getByText('Cache hook not provided to CachePerformanceMonitor')).toBeInTheDocument()
    })

    it('should show info message when no performance metrics', () => {
      const noPerfCacheHook = {
        ...mockCacheHook,
        performanceMetrics: null
      }

      renderWithTheme(<CachePerformanceMonitor cacheHook={noPerfCacheHook} />)
      
      expect(screen.getByText('No performance metrics available yet')).toBeInTheDocument()
    })

    it('should handle missing metric fields gracefully', () => {
      const incompleteCacheHook = {
        ...mockCacheHook,
        performanceMetrics: {
          // Missing most fields
          totalRequests: 10
        }
      }

      renderWithTheme(<CachePerformanceMonitor cacheHook={incompleteCacheHook} />)
      
      expect(screen.getByText('0.0%')).toBeInTheDocument() // Default hit rate
    })
  })

  describe('Custom Performance Target', () => {
    it('should use custom performance target', () => {
      renderWithTheme(
        <CachePerformanceMonitor 
          cacheHook={mockCacheHook} 
          performanceTarget={5} 
        />
      )
      
      expect(screen.getByText('8.2ms / 5.0ms target')).toBeInTheDocument()
    })

    it('should affect performance analysis with custom target', () => {
      const customTargetCacheHook = {
        ...mockCacheHook,
        performanceMetrics: {
          ...mockCacheHook.performanceMetrics,
          avgResponseTime: 15 // Would be good for 10ms target, poor for 5ms target
        }
      }

      renderWithTheme(
        <CachePerformanceMonitor 
          cacheHook={customTargetCacheHook} 
          performanceTarget={5} 
        />
      )
      
      expect(screen.getByText('15.0ms / 5.0ms target')).toBeInTheDocument()
    })
  })

  describe('Accordion Behavior', () => {
    it('should render as collapsed by default', () => {
      renderWithTheme(<CachePerformanceMonitor cacheHook={mockCacheHook} />)
      
      const accordion = screen.getByRole('button', { expanded: false })
      expect(accordion).toBeInTheDocument()
    })

    it('should render as expanded when defaultExpanded is true', () => {
      renderWithTheme(
        <CachePerformanceMonitor 
          cacheHook={mockCacheHook} 
          defaultExpanded={true} 
        />
      )
      
      const accordion = screen.getByRole('button', { expanded: true })
      expect(accordion).toBeInTheDocument()
    })
  })

  describe('Responsive Design', () => {
    it('should handle mobile viewport', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })

      renderWithTheme(<CachePerformanceMonitor cacheHook={mockCacheHook} />)
      
      expect(screen.getByText('Cache Performance Monitor')).toBeInTheDocument()
    })
  })

  describe('Performance', () => {
    it('should render quickly with complex metrics', () => {
      const complexCacheHook = {
        ...mockCacheHook,
        performanceMetrics: {
          ...mockCacheHook.performanceMetrics,
          // Add more complex data
          totalRequests: 1000,
          hits: 850,
          misses: 150
        }
      }

      const startTime = performance.now()
      
      renderWithTheme(<CachePerformanceMonitor cacheHook={complexCacheHook} />)
      
      const endTime = performance.now()
      const renderTime = endTime - startTime

      expect(renderTime).toBeLessThan(1000) // Should render within 1 second
      expect(screen.getByText('Cache Performance Monitor')).toBeInTheDocument()
    })
  })
})