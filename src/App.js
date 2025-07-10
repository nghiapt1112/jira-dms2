import React, { Suspense, useEffect } from 'react'
import { ThemeProvider, CssBaseline } from '@mui/material'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import theme from './theme'
import PageLayout from './pages/Layout'
import ErrorBoundary from './components/ui/ErrorBoundary'
import LoadingIndicator from './components/ui/LoadingIndicator'
import { useUIStore } from './shared/store/uiStore'
import { useAuthStore } from './features/authentication/store/authStore'
import ProtectedRoute from './features/authentication/components/ProtectedRoute'

// Lazy load components
const LoginPage = React.lazy(() => import('./pages/LoginPage'))
const Dashboard = React.lazy(() => import('./pages/Dashboard'))

const MainDashboard = React.lazy(() => import('./pages/Dashboard'))
const QualityDashboard = React.lazy(() => import('./pages/Dashboard'))

const DeveloperMetrics = React.lazy(() => import('./pages/Dashboard'))
const QAMetrics = React.lazy(() => import('./pages/Dashboard'))

const SprintReports = React.lazy(() => import('./pages/Dashboard'))
const ProjectReports = React.lazy(() => import('./pages/Dashboard'))

const UserManagement = React.lazy(() => import('./pages/Dashboard'))
const SystemSettings = React.lazy(() => import('./pages/Dashboard'))

const GlobalLoadingIndicator = React.memo(() => {
  const { globalLoading } = useUIStore()
  
  if (!globalLoading) return null
  
  return <LoadingIndicator overlay message="Processing..." />
})

const App = React.memo(() => {
  const { initializeAuth } = useAuthStore()
  
  useEffect(() => {
    // Initialize authentication state on app startup
    initializeAuth()
  }, [initializeAuth])
  
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ErrorBoundary>
        <Router>
          <GlobalLoadingIndicator />
          <Suspense fallback={<LoadingIndicator overlay />}>
            <Routes>
              {/* Public Login Route */}
              <Route path="/login" element={<LoginPage />} />
              
              {/* Protected Routes */}
              <Route path="/" element={
                <ProtectedRoute>
                  <PageLayout />
                </ProtectedRoute>
              }>
                <Route index element={<Navigate to="/main-dashboard" replace />} />
                
                <Route path="main-dashboard" element={<MainDashboard />} />
                <Route path="quality-dashboard" element={<QualityDashboard />} />
                
                <Route path="analytics">
                  <Route path="developers" element={<DeveloperMetrics />} />
                  <Route path="qa" element={<QAMetrics />} />
                </Route>
                
                <Route path="reports">
                  <Route path="sprints" element={<SprintReports />} />
                  <Route path="projects" element={<ProjectReports />} />
                </Route>
                
                <Route path="admin">
                  <Route path="users" element={
                    <ProtectedRoute requiredRole="ADMIN">
                      <UserManagement />
                    </ProtectedRoute>
                  } />
                  <Route path="settings" element={
                    <ProtectedRoute requiredRole="ADMIN">
                      <SystemSettings />
                    </ProtectedRoute>
                  } />
                </Route>
                
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </Suspense>
        </Router>
      </ErrorBoundary>
    </ThemeProvider>
  )
})

App.displayName = 'App'

export default App