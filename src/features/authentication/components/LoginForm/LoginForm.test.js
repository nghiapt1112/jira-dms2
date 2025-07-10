import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider, createTheme } from '@mui/material'
import LoginForm from './LoginForm'

const theme = createTheme()

const MockedLoginForm = (props) => (
  <ThemeProvider theme={theme}>
    <LoginForm {...props} />
  </ThemeProvider>
)

describe('LoginForm', () => {
  const defaultProps = {
    onLogin: jest.fn(),
    isLoading: false,
    error: null
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders without crashing', () => {
    render(<MockedLoginForm {...defaultProps} />)
    
    expect(screen.getByText('JIRA DMS')).toBeInTheDocument()
    expect(screen.getByText('Sign in to your account')).toBeInTheDocument()
    expect(screen.getByLabelText('Username')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument()
  })

  it('validates required fields', async () => {
    const user = userEvent.setup()
    render(<MockedLoginForm {...defaultProps} />)
    
    const submitButton = screen.getByRole('button', { name: 'Sign In' })
    await user.click(submitButton)
    
    expect(screen.getByText('Username is required')).toBeInTheDocument()
    expect(screen.getByText('Password is required')).toBeInTheDocument()
    expect(defaultProps.onLogin).not.toHaveBeenCalled()
  })

  it('submits form with correct data', async () => {
    const user = userEvent.setup()
    render(<MockedLoginForm {...defaultProps} />)
    
    const usernameField = screen.getByLabelText('Username')
    const passwordField = screen.getByLabelText('Password')
    const submitButton = screen.getByRole('button', { name: 'Sign In' })
    
    await user.type(usernameField, 'admin')
    await user.type(passwordField, 'password123')
    await user.click(submitButton)
    
    expect(defaultProps.onLogin).toHaveBeenCalledWith('admin', 'password123')
  })

  it('shows loading state during submission', () => {
    render(<MockedLoginForm {...defaultProps} isLoading={true} />)
    
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
    expect(screen.getByLabelText('Username')).toBeDisabled()
    expect(screen.getByLabelText('Password')).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeDisabled()
  })

  it('displays error messages', () => {
    const errorMessage = 'Invalid credentials'
    render(<MockedLoginForm {...defaultProps} error={errorMessage} />)
    
    expect(screen.getByText(errorMessage)).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveClass('MuiAlert-standardError')
  })

  it('toggles password visibility', async () => {
    const user = userEvent.setup()
    render(<MockedLoginForm {...defaultProps} />)
    
    const passwordField = screen.getByLabelText('Password')
    const toggleButton = screen.getByRole('button', { name: '' })
    
    // Initially password should be hidden
    expect(passwordField).toHaveAttribute('type', 'password')
    
    // Click to show password
    await user.click(toggleButton)
    expect(passwordField).toHaveAttribute('type', 'text')
    
    // Click to hide password again
    await user.click(toggleButton)
    expect(passwordField).toHaveAttribute('type', 'password')
  })

  it('clears validation errors when user starts typing', async () => {
    const user = userEvent.setup()
    render(<MockedLoginForm {...defaultProps} />)
    
    const submitButton = screen.getByRole('button', { name: 'Sign In' })
    const usernameField = screen.getByLabelText('Username')
    
    // Trigger validation error
    await user.click(submitButton)
    expect(screen.getByText('Username is required')).toBeInTheDocument()
    
    // Start typing to clear error
    await user.type(usernameField, 'a')
    expect(screen.queryByText('Username is required')).not.toBeInTheDocument()
  })

  it('handles form submission with enter key', async () => {
    const user = userEvent.setup()
    render(<MockedLoginForm {...defaultProps} />)
    
    const usernameField = screen.getByLabelText('Username')
    const passwordField = screen.getByLabelText('Password')
    
    await user.type(usernameField, 'admin')
    await user.type(passwordField, 'password123')
    await user.keyboard('{Enter}')
    
    expect(defaultProps.onLogin).toHaveBeenCalledWith('admin', 'password123')
  })
})