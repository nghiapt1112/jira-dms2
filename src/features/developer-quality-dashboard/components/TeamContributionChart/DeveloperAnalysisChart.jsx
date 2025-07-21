import React, { useMemo } from 'react'
import PropTypes from 'prop-types'
import { Box, Typography } from '@mui/material'
import { BarChart, ResponsiveChartContainer, BarPlot, LinePlot, ChartsXAxis, ChartsYAxis, ChartsLegend, ChartsTooltip } from '@mui/x-charts'
import { ChartJSHybridChart } from '../../../../components/charts/ChartJS'
import { selectChartComponent } from '../../../../config/features'

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
    console.log('📊 DEVELOPER ANALYSIS: Processing chart data', {
      selectedDeveloper,
      hasStoryPointsData: !!storyPointsData,
      hasTimeTrackingData: !!timeTrackingData,
      storyPointsDataLength: storyPointsData?.length || 0,
      timeTrackingDataLength: timeTrackingData?.length || 0
    })

    if (!storyPointsData || storyPointsData.length === 0 || !selectedDeveloper) {
      return null
    }

    // Check if developer has time tracking data
    const developerHasTimeData = timeTrackingData && timeTrackingData.some(item => 
      item[selectedDeveloper] && item[selectedDeveloper] > 0
    )

    console.log('📊 DEVELOPER ANALYSIS: Time tracking availability', {
      developerHasTimeData,
      timeTrackingDataStructure: timeTrackingData?.map(item => ({
        timePeriod: item.timePeriod,
        [selectedDeveloper]: item[selectedDeveloper] || 0,
        allKeys: Object.keys(item)
      }))
    })

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

    console.log('📊 DEVELOPER ANALYSIS: Generated chart data', {
      mergedDatasetLength: mergedDataset.length,
      hasTimeTrackingSeries: !!timeTrackingSeries,
      sampleData: mergedDataset[0]
    })

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

  // Determine which chart implementation to use
  const useChartJS = selectChartComponent('hybrid') === 'chartjs'

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

      {chartData.timeTrackingSeries && useChartJS ? (
        // Use Chart.js for hybrid chart (bars + line)
        <ChartJSHybridChart
          data={chartData.dataset}
          title={`Analysis - ${selectedDeveloper}`}
          height={height}
          barSeries={chartData.barSeries}
          lineSeries={chartData.timeTrackingSeries.map(series => ({
            dataKey: series.dataKey,
            label: series.label,
            color: series.color
          }))}
          options={{
            leftAxisLabel: 'Story Points',
            rightAxisLabel: 'Hours Logged',
            leftAxisUnit: '',
            rightAxisUnit: 'h',
            plugins: {
              title: {
                display: false
              }
            }
          }}
        />
      ) : chartData.timeTrackingSeries ? (
        // Use MUI X Charts for hybrid chart (bars + line)
        <ResponsiveChartContainer
          dataset={chartData.dataset}
          series={[
            // Bar series for Story Points
            {
              dataKey: selectedDeveloper,
              label: `${selectedDeveloper} (Story Points)`,
              color: '#1976d2',
              type: 'bar',
              yAxisKey: 'left'
            },
            // Line series for Time Tracking
            ...chartData.timeTrackingSeries.map(series => ({
              ...series,
              type: 'line',
              yAxisKey: 'right'
            }))
          ]}
          xAxis={chartData.xAxis}
          yAxis={[
            {
              id: 'left',
              label: 'Story Points',
              position: 'left'
            },
            {
              id: 'right', 
              label: 'Hours Logged',
              position: 'right'
            }
          ]}
          height={height}
          margin={{
            top: 20,
            right: 20,
            bottom: chartData.dataset.length > 6 ? 80 : 60,
            left: 80,
            ...chartConfig.margin
          }}
          grid={{ horizontal: true }}
          {...chartConfig}
        >
          <BarPlot />
          <LinePlot />
          <ChartsXAxis />
          <ChartsYAxis axisId="left" />
          <ChartsYAxis axisId="right" />
          <ChartsLegend />
          <ChartsTooltip />
        </ResponsiveChartContainer>
      ) : (
        // Fallback to simple bar chart if no time tracking data
        <BarChart
          dataset={chartData.dataset}
          series={chartData.barSeries}
          xAxis={chartData.xAxis}
          yAxis={[{ 
            label: 'Story Points'
          }]}
          height={height}
          margin={{
            top: 20,
            right: 20,
            bottom: chartData.dataset.length > 6 ? 80 : 60,
            left: 80,
            ...chartConfig.margin
          }}
          grid={{ horizontal: true }}
          {...chartConfig}
        />
      )}
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