import React, { useMemo } from 'react'
import PropTypes from 'prop-types'
import { Box, Typography } from '@mui/material'
import { BarChart } from '@mui/x-charts'

/**
 * TeamOverviewChart - Dedicated component for displaying team-wide story points comparison
 * Shows story points as stacked bars for all developers in the team
 * 
 * @param {Object} props - Component props
 * @param {Array} props.data - Chart data array with timePeriod and developer story points
 * @param {Object} props.metrics - Metrics object containing team statistics
 * @param {number} props.height - Chart height in pixels
 * @param {Object} props.chartConfig - Chart configuration object
 * @returns {JSX.Element} Team overview chart component
 */
const TeamOverviewChart = ({ 
  data, 
  metrics, 
  height = 400,
  chartConfig = {}
}) => {
  // Generate chart series and colors for all developers
  const chartData = useMemo(() => {
    console.log('📊 TEAM OVERVIEW: Processing chart data', {
      hasData: !!data,
      dataLength: data?.length || 0,
      firstDataPoint: data?.[0]
    })

    if (!data || data.length === 0) {
      return null
    }

    // Extract all developers from the data dynamically
    const developers = new Set()
    data.forEach(item => {
      Object.keys(item).forEach(key => {
        if (key !== 'timePeriod') {
          developers.add(key)
        }
      })
    })

    const developersArray = Array.from(developers).sort()
    
    // Generate colors for each developer
    const colors = [
      '#1976d2', '#dc004e', '#2e7d32', '#ed6c02', '#9c27b0',
      '#00796b', '#d32f2f', '#7b1fa2', '#388e3c', '#f57c00',
      '#303f9f', '#c2185b', '#689f38', '#ff5722', '#512da8'
    ]

    // Create series configuration for story points
    const series = developersArray.map((developer, index) => ({
      dataKey: developer,
      label: developer,
      color: colors[index % colors.length],
      stack: 'storyPoints'
    }))

    console.log('📊 TEAM OVERVIEW: Generated chart data', {
      developersCount: developersArray.length,
      seriesCount: series.length,
      dataPointsCount: data.length
    })

    return {
      dataset: data,
      series: series,
      xAxis: [{
        dataKey: 'timePeriod',
        scaleType: 'band',
        tickLabelStyle: {
          angle: data.length > 6 ? -45 : 0,
          textAnchor: data.length > 6 ? 'end' : 'middle'
        }
      }]
    }
  }, [data])

  // Early return if no data
  if (!chartData || !data || data.length === 0) {
    return (
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        height: height,
        minHeight: 200
      }}>
        <Typography variant="body1" color="text.secondary">
          No team story points data available
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ 
      height: { xs: Math.min(height, 300), sm: height },
      width: '100%'
    }}>
      <BarChart
        dataset={chartData.dataset}
        series={chartData.series}
        xAxis={chartData.xAxis}
        yAxis={[{ 
          label: 'Story Points'
        }]}
        height={height}
        margin={{
          top: 20,
          right: 20,
          bottom: data.length > 6 ? 80 : 60,
          left: 80,
          ...chartConfig.margin
        }}
        grid={{ horizontal: true }}
        {...chartConfig}
      />
    </Box>
  )
}

TeamOverviewChart.propTypes = {
  data: PropTypes.arrayOf(PropTypes.shape({
    timePeriod: PropTypes.string.isRequired
    // Dynamic developer properties validated at runtime
  })).isRequired,
  metrics: PropTypes.shape({
    totalContributions: PropTypes.number,
    totalStoryPoints: PropTypes.number,
    topContributors: PropTypes.array
  }),
  height: PropTypes.number,
  chartConfig: PropTypes.object
}

export default TeamOverviewChart