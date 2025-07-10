import React from 'react'
import { render, screen } from '@testing-library/react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider, createTheme } from '@mui/material'
import ProtectedRoute from './ProtectedRoute'
import { useAuthStore } from '../../store/authStore'

// Mock the auth store
jest.mock('../../store/authStore')

const theme = createTheme()

const MockedProtectedRoute = ({ children, ...props }) => (
  <ThemeProvider theme={theme}>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<div>Login Page</div>} />
        <Route 
          path="/" 
          element={
            <ProtectedRoute {...props}>
              {children}
            </ProtectedRoute>
          } 
        />
      </Routes>
    </BrowserRouter>
  </ThemeProvider>
)

describe('ProtectedRoute', () => {
  const mockAuthStore = {
    isAuthenticated: false,
    user: null,
    token: null,
    isLoading: false,
    initializeAuth: jest.fn()
  }

  beforeEach(() => {
    useAuthStore.mockReturnValue(mockAuthStore)
    localStorage.clear()
    jest.clearAllMocks()
  })

  it('redirects to login when not authenticated', () => {
    render(
      <MockedProtectedRoute>
        <div>Protected Content</div>
      </MockedProtectedRoute>
    )
    
    expect(screen.getByText('Login Page')).toBeInTheDocument()
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('renders children when authenticated', () => {
    useAuthStore.mockReturnValue({
      ...mockAuthStore,
      isAuthenticated: true,
      user: { username: 'admin', role: 'ADMIN' },
      token: 'valid-token'
    })
    
    render(
      <MockedProtectedRoute>
        <div>Protected Content</div>
      </MockedProtectedRoute>
    )
    
    expect(screen.getByText('Protected Content')).toBeInTheDocument()
    expect(screen.queryByText('Login Page')).not.toBeInTheDocument()
  })

  it('shows loading state while initializing', () => {
    useAuthStore.mockReturnValue({
      ...mockAuthStore,
      isLoading: true
    })
    
    render(
      <MockedProtectedRoute>
        <div>Protected Content</div>
      </MockedProtectedRoute>
    )
    
    expect(screen.getByText('Loading...')).toBeInTheDocument()
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('allows access with correct role', () => {
    useAuthStore.mockReturnValue({
      ...mockAuthStore,
      isAuthenticated: true,
      user: { username: 'admin', role: 'ADMIN' },
      token: 'valid-token'
    })
    
    render(
      <MockedProtectedRoute requiredRole="ADMIN">
        <div>Admin Content</div>
      </MockedProtectedRoute>
    )
    
    expect(screen.getByText('Admin Content')).toBeInTheDocument()
  })

  it('denies access with incorrect role', () => {
    useAuthStore.mockReturnValue({
      ...mockAuthStore,
      isAuthenticated: true,
      user: { username: 'user', role: 'USER' },
      token: 'valid-token'
    })
    
    render(
      <MockedProtectedRoute requiredRole="ADMIN">
        <div>Admin Content</div>
      </MockedProtectedRoute>
    )
    
    expect(screen.getByText('Access Denied')).toBeInTheDocument()
    expect(screen.getByText(/You do not have the required permissions/)).toBeInTheDocument()
    expect(screen.getByText(/Required role: ADMIN/)).toBeInTheDocument()
    expect(screen.getByText(/Your role: USER/)).toBeInTheDocument()
  })

  it('initializes auth on mount', () => {
    render(
      <MockedProtectedRoute>
        <div>Protected Content</div>
      </MockedProtectedRoute>
    )
    
    expect(mockAuthStore.initializeAuth).toHaveBeenCalled()
  })

  it('handles missing user role gracefully', () => {
    useAuthStore.mockReturnValue({
      ...mockAuthStore,
      isAuthenticated: true,
      user: { username: 'user' }, // No role property
      token: 'valid-token'
    })
    
    render(
      <MockedProtectedRoute requiredRole="ADMIN">
        <div>Admin Content</div>
      </MockedProtectedRoute>
    )
    
    expect(screen.getByText('Access Denied')).toBeInTheDocument()
    expect(screen.getByText(/Your role: Unknown/)).toBeInTheDocument()
  })
})