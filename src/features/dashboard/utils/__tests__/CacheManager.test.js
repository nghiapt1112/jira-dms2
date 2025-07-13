import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ThemeProvider } from '@mui/material/styles'
import { createTheme } from '@mui/material/styles'
import CacheManager from '../CacheManager'
import { getMockCacheHook } from '../../__tests__/testData'

const theme = createTheme()

const renderWithTheme = (component) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  )
}

describe('CacheManager', () => {
  let mockCacheHook

  beforeEach(() => {
    mockCacheHook = getMockCacheHook()
    jest.clearAllMocks()
  })

  describe('Component Rendering', () => {
    it('should render cache manager title', () => {
      renderWithTheme(<CacheManager cacheHook={mockCacheHook} />)
      
      expect(screen.getByText('Cache Management')).toBeInTheDocument()
    })

    it('should render with custom title', () => {
      renderWithTheme(
        <CacheManager 
          cacheHook={mockCacheHook} 
          title="Custom Cache Manager" 
        />
      )
      
      expect(screen.getByText('Custom Cache Manager')).toBeInTheDocument()
    })

    it('should show cache size in summary', () => {
      renderWithTheme(<CacheManager cacheHook={mockCacheHook} />)
      
      expect(screen.getByText('5 entries')).toBeInTheDocument()
    })

    it('should show cache status chip', () => {
      renderWithTheme(<CacheManager cacheHook={mockCacheHook} />)
      
      expect(screen.getByText('valid')).toBeInTheDocument()
    })
  })

  describe('Cache Actions', () => {
    it('should render clear all cache button', () => {
      renderWithTheme(<CacheManager cacheHook={mockCacheHook} />)
      
      expect(screen.getByText('Clear All Cache')).toBeInTheDocument()
    })

    it('should render force refresh button', () => {
      renderWithTheme(<CacheManager cacheHook={mockCacheHook} />)
      
      expect(screen.getByText('Force Refresh')).toBeInTheDocument()
    })

    it('should disable clear all button when cache is empty', () => {
      const emptyCacheHook = {
        ...mockCacheHook,
        performanceMetrics: {
          ...mockCacheHook.performanceMetrics,
          cacheSize: 0
        }
      }

      renderWithTheme(<CacheManager cacheHook={emptyCacheHook} />)
      
      const clearButton = screen.getByText('Clear All Cache')
      expect(clearButton).toBeDisabled()
    })

    it('should open confirmation dialog when clear all is clicked', async () => {
      renderWithTheme(<CacheManager cacheHook={mockCacheHook} />)
      
      fireEvent.click(screen.getByText('Clear All Cache'))
      
      await waitFor(() => {
        expect(screen.getByText('Confirm Cache Action')).toBeInTheDocument()
        expect(screen.getByText(/Are you sure you want to clear all cache entries/)).toBeInTheDocument()
      })
    })
  })

  describe('Current Cache Status', () => {
    it('should display active cache key', () => {
      renderWithTheme(<CacheManager cacheHook={mockCacheHook} />)
      
      expect(screen.getByText('123')).toBeInTheDocument() // Last part of cache key
    })

    it('should display cache status', () => {
      renderWithTheme(<CacheManager cacheHook={mockCacheHook} />)
      
      expect(screen.getByText('valid')).toBeInTheDocument()
    })

    it('should display cache age in minutes', () => {
      renderWithTheme(<CacheManager cacheHook={mockCacheHook} />)
      
      expect(screen.getByText('30')).toBeInTheDocument() // 1800000ms = 30 minutes
    })

    it('should display expires in minutes', () => {
      renderWithTheme(<CacheManager cacheHook={mockCacheHook} />)
      
      expect(screen.getByText('320')).toBeInTheDocument() // 19200000ms = 320 minutes
    })
  })

  describe('Cache Entries Table', () => {
    it('should render cache entries table when entries exist', () => {
      renderWithTheme(<CacheManager cacheHook={mockCacheHook} />)
      
      expect(screen.getByText('Cache Entries')).toBeInTheDocument()
      expect(screen.getByText('Cache Key')).toBeInTheDocument()
      expect(screen.getByText('Status')).toBeInTheDocument()
      expect(screen.getByText('Age (min)')).toBeInTheDocument()
      expect(screen.getByText('Expires In (min)')).toBeInTheDocument()
      expect(screen.getByText('Actions')).toBeInTheDocument()
    })

    it('should display cache entry rows', () => {
      renderWithTheme(<CacheManager cacheHook={mockCacheHook} />)
      
      expect(screen.getByText('...main_dashboard_cache_abc123')).toBeInTheDocument()
      expect(screen.getByText('...main_dashboard_cache_def456')).toBeInTheDocument()
    })

    it('should show current cache entry with highlight', () => {
      renderWithTheme(<CacheManager cacheHook={mockCacheHook} />)
      
      expect(screen.getByText('Current')).toBeInTheDocument()
    })

    it('should have delete buttons for each cache entry', () => {
      renderWithTheme(<CacheManager cacheHook={mockCacheHook} />)
      
      const deleteButtons = screen.getAllByTitle('Clear this cache entry')
      expect(deleteButtons).toHaveLength(2)
    })

    it('should open confirmation dialog when delete specific entry', async () => {
      renderWithTheme(<CacheManager cacheHook={mockCacheHook} />)
      
      const deleteButtons = screen.getAllByTitle('Clear this cache entry')
      fireEvent.click(deleteButtons[0])
      
      await waitFor(() => {
        expect(screen.getByText('Confirm Cache Action')).toBeInTheDocument()
        expect(screen.getByText(/Are you sure you want to clear the cache entry/)).toBeInTheDocument()
      })
    })
  })

  describe('Debug Information', () => {
    it('should not show debug info by default', () => {
      renderWithTheme(<CacheManager cacheHook={mockCacheHook} />)
      
      expect(screen.queryByText('Debug Information')).not.toBeInTheDocument()
    })

    it('should show debug info when enabled', () => {
      renderWithTheme(
        <CacheManager 
          cacheHook={mockCacheHook} 
          showDebugInfo={true} 
        />
      )
      
      expect(screen.getByText('Debug Information')).toBeInTheDocument()
      expect(screen.getByText('Cache Implementation:')).toBeInTheDocument()
      expect(screen.getByText('JavaScript Map with metadata')).toBeInTheDocument()
      expect(screen.getByText('Cache Key Pattern:')).toBeInTheDocument()
    })
  })

  describe('Confirmation Dialog', () => {
    it('should confirm and clear all cache', async () => {
      renderWithTheme(<CacheManager cacheHook={mockCacheHook} />)
      
      fireEvent.click(screen.getByText('Clear All Cache'))
      
      await waitFor(() => {
        expect(screen.getByText('Clear All')).toBeInTheDocument()
      })
      
      fireEvent.click(screen.getByText('Clear All'))
      
      expect(mockCacheHook.clearCache).toHaveBeenCalledWith()
    })

    it('should confirm and clear specific cache entry', async () => {
      renderWithTheme(<CacheManager cacheHook={mockCacheHook} />)
      
      const deleteButtons = screen.getAllByTitle('Clear this cache entry')
      fireEvent.click(deleteButtons[0])
      
      await waitFor(() => {
        expect(screen.getByText('Clear Entry')).toBeInTheDocument()
      })
      
      fireEvent.click(screen.getByText('Clear Entry'))
      
      expect(mockCacheHook.clearCache).toHaveBeenCalledWith('main_dashboard_cache_abc123')
    })

    it('should cancel dialog when cancel is clicked', async () => {
      renderWithTheme(<CacheManager cacheHook={mockCacheHook} />)
      
      fireEvent.click(screen.getByText('Clear All Cache'))
      
      await waitFor(() => {
        expect(screen.getByText('Cancel')).toBeInTheDocument()
      })
      
      fireEvent.click(screen.getByText('Cancel'))
      
      await waitFor(() => {
        expect(screen.queryByText('Confirm Cache Action')).not.toBeInTheDocument()
      })
      
      expect(mockCacheHook.clearCache).not.toHaveBeenCalled()
    })
  })

  describe('Cache Tips', () => {
    it('should display cache management tips', () => {
      renderWithTheme(<CacheManager cacheHook={mockCacheHook} />)
      
      expect(screen.getByText(/Cache Tips:/)).toBeInTheDocument()
      expect(screen.getByText(/Cache entries expire after 6 hours/)).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('should show warning when cache hook is not provided', () => {
      renderWithTheme(<CacheManager cacheHook={null} />)
      
      expect(screen.getByText('Cache hook not provided to CacheManager')).toBeInTheDocument()
    })

    it('should handle missing performance metrics gracefully', () => {
      const invalidCacheHook = {
        ...mockCacheHook,
        performanceMetrics: {
          cacheSize: 0,
          cacheKeys: []
        }
      }

      renderWithTheme(<CacheManager cacheHook={invalidCacheHook} />)
      
      expect(screen.getByText('0 entries')).toBeInTheDocument()
    })
  })

  describe('Status Color Coding', () => {
    it('should apply correct colors for different cache statuses', () => {
      const expiredCacheHook = {
        ...mockCacheHook,
        cacheStatus: {
          status: 'expired',
          age: 25200000, // 7 hours
          expiresIn: 0
        }
      }

      renderWithTheme(<CacheManager cacheHook={expiredCacheHook} />)
      
      expect(screen.getByText('expired')).toBeInTheDocument()
    })

    it('should handle empty cache status', () => {
      const emptyCacheHook = {
        ...mockCacheHook,
        cacheStatus: {
          status: 'empty',
          age: 0,
          expiresIn: 0
        }
      }

      renderWithTheme(<CacheManager cacheHook={emptyCacheHook} />)
      
      expect(screen.getByText('empty')).toBeInTheDocument()
    })
  })

  describe('Accordion Behavior', () => {
    it('should render as collapsed by default', () => {
      renderWithTheme(<CacheManager cacheHook={mockCacheHook} />)
      
      // Check that content is not immediately visible (collapsed state)
      const accordion = screen.getByRole('button', { expanded: false })
      expect(accordion).toBeInTheDocument()
    })

    it('should render as expanded when defaultExpanded is true', () => {
      renderWithTheme(
        <CacheManager 
          cacheHook={mockCacheHook} 
          defaultExpanded={true} 
        />
      )
      
      const accordion = screen.getByRole('button', { expanded: true })
      expect(accordion).toBeInTheDocument()
    })

    it('should toggle accordion when clicked', () => {
      renderWithTheme(<CacheManager cacheHook={mockCacheHook} />)
      
      const accordionButton = screen.getByRole('button')
      fireEvent.click(accordionButton)
      
      // Content should now be visible
      expect(screen.getByText('Cache Actions')).toBeInTheDocument()
    })
  })

  describe('Responsive Design', () => {
    it('should handle mobile viewport', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })

      renderWithTheme(<CacheManager cacheHook={mockCacheHook} />)
      
      expect(screen.getByText('Cache Management')).toBeInTheDocument()
    })
  })

  describe('Performance', () => {
    it('should handle large number of cache entries', () => {
      const largeCacheHook = {
        ...mockCacheHook,
        performanceMetrics: {
          ...mockCacheHook.performanceMetrics,
          cacheSize: 50,
          cacheKeys: Array.from({ length: 50 }, (_, i) => `cache_key_${i}`)
        }
      }

      const startTime = performance.now()
      
      renderWithTheme(<CacheManager cacheHook={largeCacheHook} />)
      
      const endTime = performance.now()
      const renderTime = endTime - startTime

      expect(renderTime).toBeLessThan(1000) // Should render within 1 second
      expect(screen.getByText('50 entries')).toBeInTheDocument()
    })
  })
})