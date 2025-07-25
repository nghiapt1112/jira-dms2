import React, { useMemo, useCallback, useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { Box, Grid, Typography, Paper, Alert, Button, CircularProgress } from '@mui/material'
import { Refresh as RefreshIcon, CloudDownload as DownloadIcon, BugReport as LogIcon } from '@mui/icons-material'
import { memberConfiguration } from '../../../../constants/memberConfiguration'

import { useDeveloperQualityCache } from '../../hooks/useDeveloperQualityCache'
import { useDeveloperQualityFilters } from '../../hooks/useDeveloperQualityFilters'
import { useDeveloperQualityStore } from '../../store/developerQualityStore'
import DeveloperQualityErrorBoundary from '../ErrorBoundary'
import FilterPanel from '../FilterPanel'
import TeamContributionChart from '../TeamContributionChart'
import DeveloperDetailPanel from '../DeveloperDetailPanel'
import BugTrendAnalysis from '../BugTrendAnalysis'
import RootCauseAnalysis from '../RootCauseAnalysis'
import DeveloperRootCauseAnalysis from '../DeveloperRootCauseAnalysis'
import BugRateAnalysisTable from '../BugRateAnalysisTable'
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
  
  // Debug logging for filter changes and URL sync
  useEffect(() => {
    console.log('🔄 DeveloperQualityDashboard: Filters changed:', filters)
    console.log('🔄 URL Sync Status:', urlSyncStatus)
  }, [filters, filteredData, urlSyncStatus])
  
  // Debug logging for cache state
  useEffect(() => {
  }, [cacheData, isLoading, error, needsInitialization, filteredData])
  
  // Check if single developer is selected for detail panel
  const selectedDeveloper = useMemo(() => {
    const developers = filters?.developers || []
    return developers.length === 1 ? developers[0] : null
  }, [filters?.developers])
  
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
    console.log('📊 DASHBOARD: Performance controls changed:', newControls)
    setPerformanceControls(newControls)
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
  
  // 4. Early returns
  if (isLoading) {
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


  if (needsInitialization || !filteredData) {
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
      
      
      <Grid container spacing={{ xs: 2, sm: 3 }}>
        {/* Team Contribution Chart */}
        <Grid item xs={12}>
          <TeamContributionChart
            data={filteredData.filteredChartData.teamContributionChart}
            metrics={filteredData.filteredMetrics.teamContribution}
            statusFilter={filters.statusFilter}
            onStatusFilterChange={handleStatusFilterChange}
            filters={filters} // Pass complete filters object including projects
            showTargetLines={performanceControls.showTargetLines}
            performanceFilter={performanceControls.performanceFilter}
          />
        </Grid>

        {/* Developer Detail Panel - Shows when single developer is selected */}
        {selectedDeveloper && (
          <Grid item xs={12}>
            <DeveloperDetailPanel
              developerName={selectedDeveloper}
              metrics={filteredData.filteredMetrics}
              filteredData={filteredData}
              statusFilter={filters?.statusFilter || memberConfiguration.filterDefaults.statusFilter}
              timeframe={filters?.timeframe || 'month'}
            />
          </Grid>
        )}
        
        {/* Bug Trend Analysis */}
        <Grid item xs={12} md={6}>
          <BugTrendAnalysis
            data={{
              ...filteredData.filteredChartData.bugTrendChart,
              config: {
                timePeriod: filters?.timeframe || 'month',
                periodKey: filters?.timeframe === 'week' ? 'week' : 'month'
              }
            }}
            metrics={filteredData.filteredMetrics.bugAnalysis}
          />
        </Grid>
        
        {/* Root Cause Analysis */}
        <Grid item xs={12} md={6}>
          <RootCauseAnalysis
            data={filteredData.filteredChartData.rootCauseChart}
            metrics={filteredData.filteredMetrics.rootCauseAnalysis}
          />
        </Grid>
        
        {/* Developer Root Cause Analysis */}
        <Grid item xs={12} md={6}>
          <DeveloperRootCauseAnalysis
            data={filteredData.filteredChartData.developerRootCauseChart}
            metrics={filteredData.filteredMetrics.developerRootCause}
          />
        </Grid>
        
        {/* Bug Rate Analysis Table */}
        <Grid item xs={12}>
          <BugRateAnalysisTable
            data={filteredData.filteredMetrics.bugRateAnalysis}
            onRowClick={(developer) => {
              // Show detailed issues for developer
              console.log('Show issues for:', developer)
            }}
          />
        </Grid>
      </Grid>
    </Box>
    </DeveloperQualityErrorBoundary>
  )
})

// ✅ This component doesn't accept props - using hooks for data management

export default DeveloperQualityDashboard 