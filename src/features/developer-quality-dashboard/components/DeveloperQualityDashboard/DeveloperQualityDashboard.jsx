import React, { useMemo } from 'react'
import PropTypes from 'prop-types'
import { Box, Grid, Typography, Paper, Alert, Button, CircularProgress } from '@mui/material'
import { Refresh as RefreshIcon, CloudDownload as DownloadIcon } from '@mui/icons-material'

import { useDeveloperQualityCache } from '../../hooks/useDeveloperQualityCache'
import { useDeveloperQualityFilters } from '../../hooks/useDeveloperQualityFilters'
import DeveloperQualityErrorBoundary from '../ErrorBoundary'
import FilterPanel from '../FilterPanel'
import TeamContributionChart from '../TeamContributionChart'
import BugTrendAnalysis from '../BugTrendAnalysis'
import RootCauseAnalysis from '../RootCauseAnalysis'
import DeveloperRootCauseAnalysis from '../DeveloperRootCauseAnalysis'
import BugRateAnalysisTable from '../BugRateAnalysisTable'

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
    updateFilters, 
    applyFilters,
    resetFilters 
  } = useDeveloperQualityFilters()
  
  // 2. Memoized values
  const filteredData = useMemo(() => {
    if (!cacheData) return null
    return applyFilters(cacheData)
  }, [cacheData, applyFilters])
  
  // 3. Early returns
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
            <Button 
              color="inherit" 
              size="small" 
              onClick={handleForceReload}
              startIcon={<DownloadIcon />}
            >
              Load Data from S3
            </Button>
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
      
      <Paper 
        elevation={1} 
        sx={{ 
          p: { xs: 1, sm: 2 }, 
          mb: { xs: 2, sm: 3 },
          backgroundColor: 'background.paper'
        }}
      >
        <FilterPanel
          filters={filters}
          onFiltersChange={updateFilters}
          filterOptions={cacheData.filterOptions}
        />
      </Paper>
      
      <Grid container spacing={{ xs: 2, sm: 3 }}>
        {/* Team Contribution Chart */}
        <Grid item xs={12} md={6}>
          <TeamContributionChart
            data={filteredData.filteredChartData.teamContributionChart}
            metrics={filteredData.filteredMetrics.teamContribution}
          />
        </Grid>
        
        {/* Bug Trend Analysis */}
        <Grid item xs={12} md={6}>
          <BugTrendAnalysis
            data={filteredData.filteredChartData.bugTrendChart}
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

// ✅ REQUIRED: PropTypes (none needed for this component)
DeveloperQualityDashboard.propTypes = {}

export default DeveloperQualityDashboard 