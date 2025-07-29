import React, { useMemo } from 'react'
import PropTypes from 'prop-types'
import { Box, Typography } from '@mui/material'
import { ChartJSHybridChart } from '../../../../components/charts/ChartJS'

/**
 * DeveloperAnalysisChart - Dedicated component for single developer analysis
 * Shows story points as bars AND time tracking as line overlay for correlation analysis
 * 
 * @param {Object} props - Component props
 * @param {Array} props.storyPointsData - Story points data for the developer
 * @param {Array} props.timeTrackingData - Time tracking data for the developer
 * @param {string} props.selectedDeveloper - Name of the selected developer
 * @param {number} props.height - Chart height in pixels
 * @param {Object} props.chartConfig - Chart configuration object
 * @returns {JSX.Element} Developer analysis chart component
 */
const DeveloperAnalysisChart = ({ 
  storyPointsData, 
  timeTrackingData,
  selectedDeveloper,
  height = 400,
  chartConfig = {}
}) => {
  // Process and merge data for hybrid chart
  const chartData = useMemo(() => {


    if (!storyPointsData || storyPointsData.length === 0 || !selectedDeveloper) {
      return null
    }

    // Check if developer has time tracking data
    const developerHasTimeData = timeTrackingData && timeTrackingData.some(item => 
      item[selectedDeveloper] && item[selectedDeveloper] > 0
    )



    // Merge story points and time tracking data
    const mergedDataset = storyPointsData.map(storyItem => {
      const timeData = timeTrackingData?.find(timeItem => 
        timeItem.timePeriod === storyItem.timePeriod
      )
      
      return {
        ...storyItem,
        [`${selectedDeveloper}_hours`]: timeData?.[selectedDeveloper] || 0
      }
    })

    // Create bar series for story points
    const barSeries = [{
      dataKey: selectedDeveloper,
      label: `${selectedDeveloper} (Story Points)`,
      color: '#1976d2',
      stack: 'storyPoints'
    }]

    // Create line series for time tracking (if available)
    const timeTrackingSeries = developerHasTimeData ? [{
      dataKey: `${selectedDeveloper}_hours`,
      label: `${selectedDeveloper} (Hours)`,
      color: '#ff6b35',
      curve: 'monotoneX',
      connectNulls: true
    }] : null



    return {
      dataset: mergedDataset,
      barSeries: barSeries,
      timeTrackingSeries: timeTrackingSeries,
      xAxis: [{
        dataKey: 'timePeriod',
        scaleType: 'band',
        tickLabelStyle: {
          angle: mergedDataset.length > 6 ? -45 : 0,
          textAnchor: mergedDataset.length > 6 ? 'end' : 'middle'
        }
      }]
    }
  }, [storyPointsData, timeTrackingData, selectedDeveloper])

  // Early return if no data
  if (!chartData || !selectedDeveloper) {
    return (
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        height: height,
        minHeight: 200
      }}>
        <Typography variant="body1" color="text.secondary">
          No developer analysis data available
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ 
      height: { xs: Math.min(height, 300), sm: height },
      width: '100%'
    }}>
      <Typography 
        variant="h6" 
        sx={{ 
          fontSize: { xs: '1rem', sm: '1.25rem' },
          fontWeight: 600,
          mb: 2,
          textAlign: 'center'
        }}
      >
        Individual Analysis - {selectedDeveloper}
      </Typography>

      <ChartJSHybridChart
        data={chartData.dataset}
        title={`Analysis - ${selectedDeveloper}`}
        height={height}
        barSeries={chartData.barSeries}
        lineSeries={chartData.timeTrackingSeries ? chartData.timeTrackingSeries.map(series => ({
          dataKey: series.dataKey,
          label: series.label,
          color: series.color
        })) : []}
        options={{
          leftAxisLabel: 'Story Points',
          rightAxisLabel: chartData.timeTrackingSeries ? 'Hours Logged' : '',
          leftAxisUnit: '',
          rightAxisUnit: 'h',
          plugins: {
            title: {
              display: false
            }
          }
        }}
      />
    </Box>
  )
}

DeveloperAnalysisChart.propTypes = {
  storyPointsData: PropTypes.arrayOf(PropTypes.shape({
    timePeriod: PropTypes.string.isRequired
    // Dynamic developer properties validated at runtime
  })).isRequired,
  timeTrackingData: PropTypes.arrayOf(PropTypes.shape({
    timePeriod: PropTypes.string.isRequired
    // Dynamic developer time tracking properties validated at runtime
  })),
  selectedDeveloper: PropTypes.string.isRequired,
  height: PropTypes.number,
  chartConfig: PropTypes.object
}

export default DeveloperAnalysisChart