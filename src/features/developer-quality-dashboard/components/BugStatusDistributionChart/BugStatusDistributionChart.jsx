import React, { useMemo } from 'react'
import PropTypes from 'prop-types'
import { Box, Paper, Typography, Alert } from '@mui/material'
import { Pie } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'

import { useDeveloperQualityFilters } from '../../hooks/useDeveloperQualityFilters'

import {
  transformBugStatusDataForPieChart,
  getBugStatusPieChartConfig,
  getEmptyBugStatusPieChartData
} from '../../utils/bugStatusChartUtils'

// Register Chart.js components (following .cursorrules for tree-shaking)
ChartJS.register(ArcElement, Title, Tooltip, Legend)

const BugStatusDistributionChart = React.memo(({
  data,
  filters,
  height = 350,
  title = 'Bug Status Distribution'
}) => {
  // 1. Hooks first
  const { filters: storeFilters } = useDeveloperQualityFilters()
  
  // 2. Memoized values
  // Use timeframe from store filters or default to month
  const timeframe = useMemo(() => {
    return storeFilters?.timeframe || filters?.timeframe || 'month'
  }, [storeFilters?.timeframe, filters?.timeframe])
  
  // Transform data for pie chart
  const chartData = useMemo(() => {
    if (!data) {
      return getEmptyBugStatusPieChartData()
    }
    
    const transformedData = transformBugStatusDataForPieChart(data, filters, timeframe)
    
    // For pie chart, check if we have valid data
    if (!transformedData || !transformedData.datasets[0].data.some(val => val > 0)) {
      return getEmptyBugStatusPieChartData()
    }
    
    return transformedData
  }, [data, filters, timeframe])
  
  // Chart configuration
  const chartConfig = useMemo(() => {
    return getBugStatusPieChartConfig()
  }, [])
  
  // Check if we have data to display
  const hasData = useMemo(() => {
    return chartData.datasets[0].data.some(value => value > 0)
  }, [chartData])
  
  // Calculate total for display
  const totalBugs = useMemo(() => {
    return chartData.datasets[0].data.reduce((sum, value) => sum + value, 0)
  }, [chartData])
  
  // 3. Early returns
  if (!data) {
    return (
      <Paper elevation={1} sx={{ p: 2, height }}>
        <Typography variant="h6" sx={{ mb: 2 }}>{title}</Typography>
        <Alert severity="error">
          ❌ Bug Status Distribution: No data received from parent component
        </Alert>
      </Paper>
    )
  }
  
  // 4. Render
  return (
    <Paper elevation={1} sx={{ p: 2, height, width: '100%' }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 2 
      }}>
        <Typography variant="h6">
          {title}
        </Typography>
        
        {hasData && (
          <Typography variant="body2" color="text.secondary">
            Total: {totalBugs} bugs
          </Typography>
        )}
      </Box>
      
      {hasData ? (
        <Box sx={{ 
          height: height - 80,
          width: '100%',
          position: 'relative'
        }}>
          <Pie 
            data={chartData} 
            options={chartConfig}
            style={{ width: '100%', height: '100%' }}
          />
        </Box>
      ) : (
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          height: height - 80
        }}>
          {(() => {
            // Check if selected projects are known to have no bug data
            const selectedProjects = filters?.projects || []
            const projectsWithoutBugData = ["Yubisui", "Sekisuiheim"] // Based on the availability report
            const isSelectingProjectsWithoutData = selectedProjects.some(project => 
              projectsWithoutBugData.includes(project)
            )
            
            return (
              <Alert 
                severity={isSelectingProjectsWithoutData ? "info" : "warning"} 
                sx={{ maxWidth: 600 }}
              >
                {isSelectingProjectsWithoutData ? (
                  <>
                    <strong>📊 No Bug Data for Selected Project(s)</strong><br/>
                    The project(s) <strong>{selectedProjects.filter(p => projectsWithoutBugData.includes(p)).join(", ")}</strong> do not have Bug-type issues in the current dataset.<br/>
                    <br/>
                    <strong>✅ Try these projects with bug data:</strong><br/>
                    Yuime, Oops, PROMAX, Borderless City Project, Daicolo, echo, etc.<br/>
                    <br/>
                    <em>Note: This is normal if the project doesn't use Bug-type issues in JIRA.</em>
                  </>
                ) : (
                  <>
                    <strong>No bug distribution data available</strong><br/>
                    Current filters: Projects={JSON.stringify(selectedProjects || 'All')}, Timeframe={timeframe}<br/>
                    Try clearing project filters or selecting a different time period.
                  </>
                )}
              </Alert>
            )
          })()}
        </Box>
      )}
    </Paper>
  )
})

BugStatusDistributionChart.propTypes = {
  data: PropTypes.shape({
    data: PropTypes.shape({
      aggregated: PropTypes.object,
      byProject: PropTypes.object,
      metadata: PropTypes.object
    }),
    config: PropTypes.shape({
      timePeriod: PropTypes.oneOf(['week', 'month', 'quarter']),
      periodKey: PropTypes.string
    })
  }),
  filters: PropTypes.shape({
    projects: PropTypes.arrayOf(PropTypes.string),
    timeframe: PropTypes.oneOf(['week', 'month', 'quarter'])
  }),
  height: PropTypes.number,
  title: PropTypes.string
}

export default BugStatusDistributionChart 