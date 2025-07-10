import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { ThemeProvider, createTheme } from '@mui/material'
import MobileNav from './MobileNav'
import { useNavigationStore } from '../../../shared/store/navigationStore'

jest.mock('../../../shared/store/navigationStore')

const theme = createTheme()

const MockedMobileNav = (props) => (
  <ThemeProvider theme={theme}>
    <MobileNav {...props} />
  </ThemeProvider>
)

describe('MobileNav', () => {
  const mockStore = {
    openSidebar: jest.fn(),
  }

  beforeEach(() => {
    useNavigationStore.mockReturnValue(mockStore)
    jest.clearAllMocks()
  })

  it('renders without crashing', () => {
    render(<MockedMobileNav />)
    expect(screen.getByText('JIRA DMS')).toBeInTheDocument()
  })

  it('displays custom title', () => {
    render(<MockedMobileNav title="Custom Title" />)
    expect(screen.getByText('Custom Title')).toBeInTheDocument()
  })

  it('opens sidebar when menu button clicked', () => {
    render(<MockedMobileNav />)
    
    const menuButton = screen.getByLabelText('open drawer')
    fireEvent.click(menuButton)
    
    expect(mockStore.openSidebar).toHaveBeenCalled()
  })

  it('renders notification button', () => {
    render(<MockedMobileNav />)
    expect(screen.getByLabelText('show notifications')).toBeInTheDocument()
  })

  it('renders account button', () => {
    render(<MockedMobileNav />)
    expect(screen.getByLabelText('account of current user')).toBeInTheDocument()
  })
})