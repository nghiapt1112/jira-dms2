import React, { useMemo } from 'react'
import PropTypes from 'prop-types'
import { Box, Paper, Typography, Alert } from '@mui/material'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'

import { useDeveloperQualityFilters } from '../../hooks/useDeveloperQualityFilters'

import {
  transformBugStatusDataForChart,
  getBugStatusChartConfig,
  validateBugStatusChartData,
  getEmptyBugStatusChartData
} from '../../utils/bugStatusChartUtils'

// Register Chart.js components (following .cursorrules for tree-shaking)
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

const BugStatusChart = React.memo(({
  data,
  filters,
  height = 400,
  title = 'Bug Status Trends'
}) => {
  // 1. Hooks first
  const { filters: storeFilters } = useDeveloperQualityFilters()
  
  // 2. Memoized values
  // Use timeframe from store filters or default to month
  const timeframe = useMemo(() => {
    return storeFilters?.timeframe || filters?.timeframe || 'month'
  }, [storeFilters?.timeframe, filters?.timeframe])
  
  // Transform data for chart
  const chartData = useMemo(() => {
    if (!data) {
      return getEmptyBugStatusChartData()
    }
    
    const transformedData = transformBugStatusDataForChart(data, filters, timeframe)
    
    // Validate the transformed data
    if (!transformedData || !validateBugStatusChartData(transformedData)) {
      return getEmptyBugStatusChartData()
    }
    
    return transformedData
  }, [data, filters, timeframe])
  
  // Chart configuration
  const chartConfig = useMemo(() => {
    return getBugStatusChartConfig(timeframe)
  }, [timeframe])
  
  // Check if we have data to display
  const hasData = useMemo(() => {
    const hasLabels = chartData.labels.length > 0
    const hasValues = chartData.datasets.some(dataset => dataset.data.some(value => value > 0))
    return hasLabels && hasValues
  }, [chartData])
  
  // 3. Early returns
  if (!data) {
    return (
      <Paper elevation={1} sx={{ p: 2, height }}>
        <Typography variant="h6" sx={{ mb: 2 }}>{title}</Typography>
        <Alert severity="error">
          ❌ Bug Status Chart: No data received from parent component
        </Alert>
      </Paper>
    )
  }
  
  // 4. Render
  return (
    <Paper elevation={1} sx={{ p: 2, height, width: '100%' }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        {title}
      </Typography>
      
      {hasData ? (
        <Box sx={{ 
          height: height - 80,
          width: '100%',
          position: 'relative'
        }}>
          <Line 
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
                    <strong>No bug status data available</strong><br/>
                    Current filters: Projects={JSON.stringify(selectedProjects || 'All')}, Timeframe={timeframe}<br/>
                    Chart data: {chartData.labels.length} labels, {chartData.datasets.length} datasets<br/>
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

BugStatusChart.propTypes = {
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

export default BugStatusChart 