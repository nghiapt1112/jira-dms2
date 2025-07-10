import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider, createTheme } from '@mui/material'
import Sidebar from './Sidebar'
import { useNavigationStore } from '../../../shared/store/navigationStore'

jest.mock('../../../shared/store/navigationStore')

const theme = createTheme()

const MockedSidebar = ({ onDrawerToggle }) => (
  <ThemeProvider theme={theme}>
    <BrowserRouter>
      <Sidebar onDrawerToggle={onDrawerToggle} />
    </BrowserRouter>
  </ThemeProvider>
)

describe('Sidebar', () => {
  const mockStore = {
    isOpen: true,
    activeItem: null,
    toggleSidebar: jest.fn(),
    setActiveItem: jest.fn(),
    setMobile: jest.fn(),
    closeSidebar: jest.fn(),
  }

  beforeEach(() => {
    useNavigationStore.mockReturnValue(mockStore)
    jest.clearAllMocks()
  })

  it('renders without crashing', () => {
    render(<MockedSidebar />)
    expect(screen.getByText('JIRA DMS')).toBeInTheDocument()
  })

  it('toggles open/closed state', () => {
    const onDrawerToggle = jest.fn()
    render(<MockedSidebar onDrawerToggle={onDrawerToggle} />)
    
    const toggleButton = screen.getByLabelText('toggle drawer')
    fireEvent.click(toggleButton)
    
    expect(mockStore.toggleSidebar).toHaveBeenCalled()
    expect(onDrawerToggle).toHaveBeenCalled()
  })

  it('handles mobile responsive behavior', () => {
    window.matchMedia = jest.fn().mockImplementation(query => ({
      matches: query === '(max-width: 900px)',
      media: query,
      onchange: null,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }))

    render(<MockedSidebar />)
    expect(mockStore.setMobile).toHaveBeenCalledWith(true)
  })

  it('highlights active navigation item', async () => {
    mockStore.activeItem = 'main-dashboard'
    render(<MockedSidebar />)
    
    await waitFor(() => {
      const dashboardItem = screen.getByText('Main Dashboard')
      const listItemButton = dashboardItem.closest('button')
      expect(listItemButton).toHaveClass('Mui-selected')
    })
  })

  it('renders all menu items correctly', () => {
    render(<MockedSidebar />)
    
    expect(screen.getByText('Dashboards')).toBeInTheDocument()
    expect(screen.getByText('Analytics')).toBeInTheDocument()
    expect(screen.getByText('Reports')).toBeInTheDocument()
    expect(screen.getByText('Administration')).toBeInTheDocument()
    
    fireEvent.click(screen.getByText('Dashboards'))
    
    expect(screen.getByText('Main Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Quality Dashboard')).toBeInTheDocument()
  })
})