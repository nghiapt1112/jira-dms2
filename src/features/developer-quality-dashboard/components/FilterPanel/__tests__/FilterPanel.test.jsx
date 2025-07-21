import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ThemeProvider } from '@mui/material/styles'
import theme from '../../../../../theme'

import FilterPanel from '../FilterPanel'

const renderWithTheme = (component) =>
  render(<ThemeProvider theme={theme}>{component}</ThemeProvider>)

const mockFilterOptions = {
  developers: ['john.doe', 'jane.smith', 'bob.wilson'],
  projects: ['PROJ-A', 'PROJ-B', 'PROJ-C'],
  issueTypes: ['Bug', 'Story', 'Task', 'Epic'],
  severities: ['Critical', 'Major', 'Minor', 'Low', 'Cosmetic']
}

const mockFilters = {
  developers: [],
  projects: [],
  issueTypes: [],
  severities: [],
  dateRange: null
}

const mockOnFiltersChange = jest.fn()

describe('FilterPanel', () => {
  beforeEach(() => {
    mockOnFiltersChange.mockClear()
  })

  describe('Rendering', () => {
    it('renders without crashing', () => {
      renderWithTheme(
        <FilterPanel
          filters={mockFilters}
          onFiltersChange={mockOnFiltersChange}
          filterOptions={mockFilterOptions}
        />
      )
      
      expect(screen.getByText('Filters')).toBeInTheDocument()
    })

    it('renders all filter controls', () => {
      renderWithTheme(
        <FilterPanel
          filters={mockFilters}
          onFiltersChange={mockOnFiltersChange}
          filterOptions={mockFilterOptions}
        />
      )

      // Check that all select elements are rendered by role
      const selects = screen.getAllByRole('combobox')
      expect(selects).toHaveLength(4)
      
      // Check that the labels exist (they appear multiple times due to MUI structure)
      expect(screen.getAllByText('Developers')).toHaveLength(2)
      expect(screen.getAllByText('Projects')).toHaveLength(2)
      expect(screen.getAllByText('Issue Types')).toHaveLength(2)
      expect(screen.getAllByText('Severities')).toHaveLength(2)
    })

    it('does not render when filterOptions is null', () => {
      const { container } = renderWithTheme(
        <FilterPanel
          filters={mockFilters}
          onFiltersChange={mockOnFiltersChange}
          filterOptions={null}
        />
      )
      
      expect(container.firstChild).toBeNull()
    })

    it('shows Clear All button when filters are active', () => {
      const filtersWithValues = {
        ...mockFilters,
        developers: ['john.doe'],
        projects: ['PROJ-A']
      }

      renderWithTheme(
        <FilterPanel
          filters={filtersWithValues}
          onFiltersChange={mockOnFiltersChange}
          filterOptions={mockFilterOptions}
        />
      )

      expect(screen.getByText('Clear All')).toBeInTheDocument()
    })

    it('does not show Clear All button when no filters are active', () => {
      renderWithTheme(
        <FilterPanel
          filters={mockFilters}
          onFiltersChange={mockOnFiltersChange}
          filterOptions={mockFilterOptions}
        />
      )

      expect(screen.queryByText('Clear All')).not.toBeInTheDocument()
    })
  })

  describe('Filter Summary', () => {
    it('shows filter summary when filters are active', () => {
      const filtersWithValues = {
        ...mockFilters,
        developers: ['john.doe', 'jane.smith'],
        projects: ['PROJ-A'],
        issueTypes: ['Bug'],
        severities: ['Critical', 'High', 'Medium']
      }

      renderWithTheme(
        <FilterPanel
          filters={filtersWithValues}
          onFiltersChange={mockOnFiltersChange}
          filterOptions={mockFilterOptions}
        />
      )

      expect(screen.getByText(/Active filters:/)).toBeInTheDocument()
      expect(screen.getByText(/2 developers/)).toBeInTheDocument()
      expect(screen.getByText(/1 project/)).toBeInTheDocument()
      expect(screen.getByText(/1 issue type/)).toBeInTheDocument()
      expect(screen.getByText(/3 severities/)).toBeInTheDocument()
    })

    it('uses correct singular/plural forms', () => {
      const filtersWithSingleValues = {
        ...mockFilters,
        developers: ['john.doe'],
        projects: ['PROJ-A'],
        issueTypes: ['Bug'],
        severities: ['Critical']
      }

      renderWithTheme(
        <FilterPanel
          filters={filtersWithSingleValues}
          onFiltersChange={mockOnFiltersChange}
          filterOptions={mockFilterOptions}
        />
      )

      expect(screen.getByText(/1 developer,/)).toBeInTheDocument()
      expect(screen.getByText(/1 project,/)).toBeInTheDocument()
      expect(screen.getByText(/1 issue type,/)).toBeInTheDocument()
      expect(screen.getByText(/1 severity/)).toBeInTheDocument()
    })

    it('does not show filter summary when no filters are active', () => {
      renderWithTheme(
        <FilterPanel
          filters={mockFilters}
          onFiltersChange={mockOnFiltersChange}
          filterOptions={mockFilterOptions}
        />
      )

      expect(screen.queryByText(/Active filters:/)).not.toBeInTheDocument()
    })
  })

  describe('Filter Interactions', () => {
    it('calls onFiltersChange when developer filter changes', () => {
      renderWithTheme(
        <FilterPanel
          filters={mockFilters}
          onFiltersChange={mockOnFiltersChange}
          filterOptions={mockFilterOptions}
        />
      )

      // Find the select by role and click it
      const developerSelect = screen.getAllByRole('combobox')[0]
      fireEvent.mouseDown(developerSelect)
      
      // Find and click an option
      const johnOption = screen.getByText('john.doe')
      fireEvent.click(johnOption)

      expect(mockOnFiltersChange).toHaveBeenCalledWith(expect.any(Function))
    })

    it('calls onFiltersChange when project filter changes', () => {
      renderWithTheme(
        <FilterPanel
          filters={mockFilters}
          onFiltersChange={mockOnFiltersChange}
          filterOptions={mockFilterOptions}
        />
      )

      // Find the select by role and click it
      const projectSelect = screen.getAllByRole('combobox')[1]
      fireEvent.mouseDown(projectSelect)
      
      // Find and click an option
      const projAOption = screen.getByText('PROJ-A')
      fireEvent.click(projAOption)

      expect(mockOnFiltersChange).toHaveBeenCalledWith(expect.any(Function))
    })

    it('calls onFiltersChange when issue type filter changes', () => {
      renderWithTheme(
        <FilterPanel
          filters={mockFilters}
          onFiltersChange={mockOnFiltersChange}
          filterOptions={mockFilterOptions}
        />
      )

      // Find the select by role and click it
      const issueTypeSelect = screen.getAllByRole('combobox')[2]
      fireEvent.mouseDown(issueTypeSelect)
      
      // Find and click an option
      const bugOption = screen.getByText('Bug')
      fireEvent.click(bugOption)

      expect(mockOnFiltersChange).toHaveBeenCalledWith(expect.any(Function))
    })

    it('calls onFiltersChange when severity filter changes', () => {
      renderWithTheme(
        <FilterPanel
          filters={mockFilters}
          onFiltersChange={mockOnFiltersChange}
          filterOptions={mockFilterOptions}
        />
      )

      // Find the select by role and click it
      const severitySelect = screen.getAllByRole('combobox')[3]
      fireEvent.mouseDown(severitySelect)
      
      // Find and click an option
      const criticalOption = screen.getByText('Critical')
      fireEvent.click(criticalOption)

      expect(mockOnFiltersChange).toHaveBeenCalledWith(expect.any(Function))
    })
  })

  describe('Clear All Functionality', () => {
    it('clears all filters when Clear All button is clicked', () => {
      const filtersWithValues = {
        ...mockFilters,
        developers: ['john.doe'],
        projects: ['PROJ-A'],
        issueTypes: ['Bug'],
        severities: ['Critical']
      }

      renderWithTheme(
        <FilterPanel
          filters={filtersWithValues}
          onFiltersChange={mockOnFiltersChange}
          filterOptions={mockFilterOptions}
        />
      )

      const clearAllButton = screen.getByText('Clear All')
      fireEvent.click(clearAllButton)

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        developers: [],
        projects: [],
        issueTypes: [],
        severities: [],
        dateRange: null
      })
    })
  })

  describe('Loading State', () => {
    it('disables all controls when loading', () => {
      renderWithTheme(
        <FilterPanel
          filters={mockFilters}
          onFiltersChange={mockOnFiltersChange}
          filterOptions={mockFilterOptions}
          isLoading={true}
        />
      )

      // Check that the select elements have disabled state
      const selects = screen.getAllByRole('combobox')
      selects.forEach(select => {
        expect(select).toHaveAttribute('aria-disabled', 'true')
      })
    })

    it('disables Clear All button when loading', () => {
      const filtersWithValues = {
        ...mockFilters,
        developers: ['john.doe']
      }

      renderWithTheme(
        <FilterPanel
          filters={filtersWithValues}
          onFiltersChange={mockOnFiltersChange}
          filterOptions={mockFilterOptions}
          isLoading={true}
        />
      )

      expect(screen.getByText('Clear All')).toBeDisabled()
    })
  })

  describe('Chip Rendering', () => {
    it('renders chips for selected values', () => {
      const filtersWithValues = {
        ...mockFilters,
        developers: ['john.doe', 'jane.smith']
      }

      renderWithTheme(
        <FilterPanel
          filters={filtersWithValues}
          onFiltersChange={mockOnFiltersChange}
          filterOptions={mockFilterOptions}
        />
      )

      expect(screen.getByText('john.doe')).toBeInTheDocument()
      expect(screen.getByText('jane.smith')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('handles undefined filter values gracefully', () => {
      const filtersWithUndefined = {
        developers: undefined,
        projects: undefined,
        issueTypes: undefined,
        severities: undefined,
        dateRange: null
      }

      renderWithTheme(
        <FilterPanel
          filters={filtersWithUndefined}
          onFiltersChange={mockOnFiltersChange}
          filterOptions={mockFilterOptions}
        />
      )

      expect(screen.getByText('Filters')).toBeInTheDocument()
      expect(screen.queryByText('Clear All')).not.toBeInTheDocument()
    })

    it('handles empty filter options gracefully', () => {
      const emptyFilterOptions = {
        developers: [],
        projects: [],
        issueTypes: [],
        severities: []
      }

      renderWithTheme(
        <FilterPanel
          filters={mockFilters}
          onFiltersChange={mockOnFiltersChange}
          filterOptions={emptyFilterOptions}
        />
      )

      expect(screen.getByText('Filters')).toBeInTheDocument()
    })

    it('handles missing filter option properties gracefully', () => {
      const partialFilterOptions = {
        developers: ['john.doe'],
        projects: ['PROJ-A']
        // issueTypes and severities missing
      }

      renderWithTheme(
        <FilterPanel
          filters={mockFilters}
          onFiltersChange={mockOnFiltersChange}
          filterOptions={partialFilterOptions}
        />
      )

      expect(screen.getByText('Filters')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      renderWithTheme(
        <FilterPanel
          filters={mockFilters}
          onFiltersChange={mockOnFiltersChange}
          filterOptions={mockFilterOptions}
        />
      )

      // Check that select elements have proper roles
      const selects = screen.getAllByRole('combobox')
      expect(selects).toHaveLength(4)
      
      selects.forEach(select => {
        expect(select).toHaveAttribute('aria-haspopup', 'listbox')
        expect(select).toHaveAttribute('aria-expanded', 'false')
      })
    })

    it('supports keyboard navigation', () => {
      renderWithTheme(
        <FilterPanel
          filters={mockFilters}
          onFiltersChange={mockOnFiltersChange}
          filterOptions={mockFilterOptions}
        />
      )

      // Check that select elements are focusable
      const selects = screen.getAllByRole('combobox')
      selects.forEach(select => {
        expect(select).toHaveAttribute('tabindex', '0')
      })
    })
  })
}) 