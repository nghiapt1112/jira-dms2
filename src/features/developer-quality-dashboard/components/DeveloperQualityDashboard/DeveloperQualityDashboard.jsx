import React, { useMemo, useCallback, useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { Box, Typography, Paper, Alert, Button, CircularProgress } from '@mui/material'
import { Refresh as RefreshIcon, CloudDownload as DownloadIcon, BugReport as LogIcon } from '@mui/icons-material'
import { memberConfiguration } from '../../../../constants/memberConfiguration'

import { useDeveloperQualityCache } from '../../hooks/useDeveloperQualityCache'
import { useDeveloperQualityFilters } from '../../hooks/useDeveloperQualityFilters'
import { useDeveloperQualityStore } from '../../store/developerQualityStore'
import DeveloperQualityErrorBoundary from '../ErrorBoundary'
import FilterPanel from '../FilterPanel'
import TabContainer from '../TabContainer'
import useUrlFilterSync from '../../hooks/useUrlFilterSync'

const DeveloperQualityDashboard = React.memo(() => {
  // 1. Hooks first
  const { 
    data: cacheData, 
    isLoading, 
    error, 
    needsInitialization,
    handleForceReload,
    handleRefresh
  } = useDeveloperQualityCache()
  const { 
    filters,
    filterOptions,
    isLoading: isFiltersLoading, 
    error: filtersError,
    clearFilters,
    updateFilters,
    applyFilters,
    updateTimeframe,
    updateStatusFilter,
    filteredData
  } = useDeveloperQualityFilters()
  const { loadData, setFilters } = useDeveloperQualityStore()
  
  // URL Filter Synchronization - Safe integration with existing filter system
  const urlSyncStatus = useUrlFilterSync(filters, setFilters, {
    enableUrlSync: true,
    logOperations: true
  })
  
  // Performance controls state
  const [performanceControls, setPerformanceControls] = useState({
    showTargetLines: false,
    performanceFilter: 'all'
  })
  
  // Tab state management
  const [activeTab, setActiveTab] = useState(0) // 0: Team, 1: Developer
  
  
  // Debug logging for cache state
  useEffect(() => {
  }, [cacheData, isLoading, error, needsInitialization, filteredData])
  
  // Check if single developer is selected for detail panel
  const selectedDeveloper = useMemo(() => {
    const developers = filters?.developers || []
    return developers.length === 1 ? developers[0] : null
  }, [filters?.developers])

  // Check if single project is selected for team performance chart
  const selectedSingleProject = useMemo(() => {
    const projects = filters?.projects || []
    return projects.length === 1
  }, [filters?.projects])
  
  // 2. Memoized values
  const handleFiltersChange = useCallback((newFilters) => {

    // Support both function and direct object calls
    if (typeof newFilters === 'function') {
      // If it's a function, call it with current filters
      const updatedFilters = newFilters(filters)
      updateFilters(updatedFilters)
    } else {
      // If it's a direct object, use it
      updateFilters(newFilters)
    }
  }, [updateFilters, filters])
  
  const handleTimePeriodChange = useCallback((newTimePeriod) => {
    updateTimeframe(newTimePeriod)
  }, [updateTimeframe])
  
  const handleStatusFilterChange = useCallback((newStatusFilter) => {
    updateStatusFilter(newStatusFilter)
  }, [updateStatusFilter])
  
  // Performance controls callback
  const handlePerformanceControlsChange = useCallback((newControls) => {
    setPerformanceControls(newControls)
  }, [])
  
  // Tab change callback
  const handleTabChange = useCallback((newTab) => {
    setActiveTab(newTab)
  }, [])

  const handleExportLogs = useCallback(() => {
    // Logger functionality removed
  }, [])

  // Temporary function to load test data for debugging
  const handleLoadTestData = useCallback(async () => {
    try {
      const response = await fetch('/api/test-data/Q1-2025-tickets-256KB.json')
      if (!response.ok) {
        // Fallback: try to load from static files or use mock data
        throw new Error('Test data not available from API')
      }
      const testData = await response.json()
      await loadData(testData)
    } catch (error) {
      // Load minimal mock data for testing filter options
      const mockData = [
        {
          "id": "70354", "key": "YUIM-129",
          "fields": {
            "issuetype": { "name": "Task" },
            "created": "2025-03-24T18:47:01.131+0900",
            "project": { "key": "YUIM", "name": "Yuime" },
            "assignee": { "displayName": "John Doe" },
            "status": { "name": "Done" },
            "priority": { "name": "Medium" },
            "customfield_10028": 5,
            "summary": "Test task for filter options"
          }
        },
        {
          "id": "70355", "key": "PROJ-100",
          "fields": {
            "issuetype": { "name": "Bug" },
            "created": "2025-03-25T10:30:00.000+0900",
            "project": { "key": "PROJ", "name": "Project Alpha" },
            "assignee": { "displayName": "Jane Smith" },
            "status": { "name": "In Progress" },
            "priority": { "name": "High" },
            "customfield_10028": 3,
            "summary": "Fix critical bug"
          }
        }
      ]
      await loadData(mockData)
    }
  }, [loadData])
  
  // 4. Early returns - Consolidated loading logic to prevent flashing
  // Show loading if any data loading is happening OR if we need initialization but might have cache
  const isAnyLoading = isLoading || isFiltersLoading || (needsInitialization && !error)
  
  if (isAnyLoading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center',
        minHeight: 400,
        p: 4
      }}>
        <CircularProgress size={48} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading developer quality data...
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {isLoading ? 'Processing data...' : 'Checking cache...'}
        </Typography>
      </Box>
    )
  }
  
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert 
          severity="error"
          action={
            <Button 
              color="inherit" 
              size="small" 
              onClick={handleRefresh}
              startIcon={<RefreshIcon />}
            >
              Retry
            </Button>
          }
        >
          {error.message || 'Failed to load developer quality data'}
        </Alert>
      </Box>
    )
  }

  // Only show "no data" if we truly have no data and no loading is happening
  if (!filteredData && !isAnyLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert 
          severity="info"
          action={
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button 
                color="inherit" 
                size="small" 
                onClick={handleForceReload}
                startIcon={<DownloadIcon />}
              >
                Load Data from S3
              </Button>
              <Button 
                color="secondary" 
                size="small" 
                onClick={handleLoadTestData}
                startIcon={<RefreshIcon />}
              >
                Load Test Data
              </Button>
            </Box>
          }
        >
          No developer quality data available. Click "Load Data from S3" to download and process JIRA data.
        </Alert>
      </Box>
    )
  }
  
  // 4. Render
  return (
    <DeveloperQualityErrorBoundary
      fallbackMessage="The Developer Quality Dashboard encountered an error. This might be due to data processing issues or network connectivity problems."
      onError={(error, errorInfo) => {
        console.error('Dashboard Error:', error, errorInfo)
      }}
    >
      <Box sx={{ 
        p: { xs: 1, sm: 2 }, 
        maxWidth: '100%',
        backgroundColor: 'background.default'
      }}>
      {/* Header with refresh button */}
      <Box sx={{ 
        mb: { xs: 2, sm: 3 }, 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 2
      }}>
        <Typography 
          variant="h4" 
          component="h1"
          sx={{ 
            fontSize: { xs: '1.5rem', sm: '2rem' },
            fontWeight: 'bold'
          }}
        >
          Developer Quality Dashboard
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            color="secondary"
            size="small"
            startIcon={<LogIcon />}
            onClick={handleExportLogs}
            title="Export debug logs to file"
          >
            Export Logs
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : <RefreshIcon />}
            onClick={handleRefresh}
            disabled={isLoading}
            title="Refresh data from server"
          >
            {isLoading ? 'Refreshing...' : 'Refresh Data'}
          </Button>
        </Box>
      </Box>
      
      <Paper 
        elevation={1} 
        sx={{ 
          p: { xs: 1, sm: 2 }, 
          mb: { xs: 2, sm: 3 },
          backgroundColor: 'background.paper'
        }}
      >
        {/* Filter Panel - Using consolidated filter state */}
        <FilterPanel 
          filters={filters} 
          onFiltersChange={handleFiltersChange} 
          filterOptions={filterOptions}
          isLoading={isFiltersLoading}
          onTimePeriodChange={handleTimePeriodChange}
          onStatusFilterChange={handleStatusFilterChange}
          onPerformanceControlsChange={handlePerformanceControlsChange}
        />
      </Paper>
      
      {/* Tab Container - Phase 1: Basic infrastructure with placeholder content */}
      {(() => {
        // Structure props for clean architecture
        const dashboardData = {
          filteredData,
          filters,
          filterOptions
        }
        
        const dashboardActions = {
          onFiltersChange: handleFiltersChange,
          onTimePeriodChange: handleTimePeriodChange,
          onStatusFilterChange: handleStatusFilterChange,
          onPerformanceControlsChange: handlePerformanceControlsChange
        }
        
        const dashboardState = {
          selectedDeveloper,
          selectedSingleProject,
          performanceControls,
          isLoading: isFiltersLoading
        }
        
        return (
          <TabContainer
            activeTab={activeTab}
            onTabChange={handleTabChange}
            dashboardData={dashboardData}
            dashboardActions={dashboardActions}
            dashboardState={dashboardState}
          />
        )
      })()}
    </Box>
    </DeveloperQualityErrorBoundary>
  )
})

// ✅ This component doesn't accept props - using hooks for data management

export default DeveloperQualityDashboard 