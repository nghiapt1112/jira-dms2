import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider, createTheme } from '@mui/material'
import ProfileMenu from './ProfileMenu'

const theme = createTheme()

const MockedProfileMenu = (props) => (
  <ThemeProvider theme={theme}>
    <BrowserRouter>
      <ProfileMenu {...props} />
    </BrowserRouter>
  </ThemeProvider>
)

describe('ProfileMenu', () => {
  const defaultUser = {
    username: 'admin',
    role: 'ADMIN',
    userId: 'user_001'
  }

  const defaultProps = {
    user: defaultUser,
    onLogout: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders user avatar and name', () => {
    render(<MockedProfileMenu {...defaultProps} />)
    
    // Should show user initial in avatar
    expect(screen.getByText('A')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Profile menu' })).toBeInTheDocument()
  })

  it('opens menu on click', async () => {
    const user = userEvent.setup()
    render(<MockedProfileMenu {...defaultProps} />)
    
    const profileButton = screen.getByRole('button', { name: 'Profile menu' })
    await user.click(profileButton)
    
    // Menu should be open and show user info
    expect(screen.getByText('admin')).toBeInTheDocument()
    expect(screen.getByText('ADMIN')).toBeInTheDocument()
    expect(screen.getByText('View Profile')).toBeInTheDocument()
    expect(screen.getByText('Settings')).toBeInTheDocument()
    expect(screen.getByText('Logout')).toBeInTheDocument()
  })

  it('calls logout function', async () => {
    const user = userEvent.setup()
    render(<MockedProfileMenu {...defaultProps} />)
    
    const profileButton = screen.getByRole('button', { name: 'Profile menu' })
    await user.click(profileButton)
    
    const logoutItem = screen.getByText('Logout')
    await user.click(logoutItem)
    
    expect(defaultProps.onLogout).toHaveBeenCalled()
  })

  it('shows profile options', async () => {
    const user = userEvent.setup()
    render(<MockedProfileMenu {...defaultProps} />)
    
    const profileButton = screen.getByRole('button', { name: 'Profile menu' })
    await user.click(profileButton)
    
    expect(screen.getByText('View Profile')).toBeInTheDocument()
    expect(screen.getByText('Settings')).toBeInTheDocument()
    expect(screen.getByText('Logout')).toBeInTheDocument()
  })

  it('handles user with no username', () => {
    const userWithoutUsername = { role: 'USER' }
    render(<MockedProfileMenu {...defaultProps} user={userWithoutUsername} />)
    
    // Should show default 'U' for unknown user
    expect(screen.getByText('U')).toBeInTheDocument()
  })

  it('handles null user', () => {
    render(<MockedProfileMenu {...defaultProps} user={null} />)
    
    // Should show default 'U' for unknown user
    expect(screen.getByText('U')).toBeInTheDocument()
  })

  it('closes menu when clicking outside', async () => {
    const user = userEvent.setup()
    render(<MockedProfileMenu {...defaultProps} />)
    
    const profileButton = screen.getByRole('button', { name: 'Profile menu' })
    await user.click(profileButton)
    
    // Menu should be open
    expect(screen.getByText('View Profile')).toBeInTheDocument()
    
    // Click outside to close
    await user.click(document.body)
    
    // Menu should be closed
    await waitFor(() => {
      expect(screen.queryByText('View Profile')).not.toBeInTheDocument()
    })
  })

  it('has proper ARIA attributes', async () => {
    const user = userEvent.setup()
    render(<MockedProfileMenu {...defaultProps} />)
    
    const profileButton = screen.getByRole('button', { name: 'Profile menu' })
    
    // Check initial ARIA attributes
    expect(profileButton).toHaveAttribute('aria-haspopup', 'true')
    expect(profileButton).toHaveAttribute('aria-expanded', 'false')
    expect(profileButton).not.toHaveAttribute('aria-controls')
    
    // Open menu
    await user.click(profileButton)
    
    // Check ARIA attributes when open
    expect(profileButton).toHaveAttribute('aria-expanded', 'true')
    expect(profileButton).toHaveAttribute('aria-controls', 'profile-menu')
  })
})