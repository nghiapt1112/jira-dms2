import React, { useMemo } from 'react'
import PropTypes from 'prop-types'
import { Box, Typography } from '@mui/material'
import { BarChart } from '@mui/x-charts'

// Helper function to convert week string to date range
const getWeekDateRange = (weekString) => {
  if (!weekString || !weekString.includes('-W')) {
    return { startDate: null, endDate: null, formatted: weekString }
  }
  
  const [year, weekNum] = weekString.split('-W')
  const yearNum = parseInt(year)
  const week = parseInt(weekNum)
  
  // Calculate the date of the first day of the year
  const firstDayOfYear = new Date(yearNum, 0, 1)
  
  // Calculate the start date of the week (assuming Monday as start of week)
  const daysToAdd = (week - 1) * 7 - firstDayOfYear.getDay() + 1
  const startDate = new Date(yearNum, 0, 1 + daysToAdd)
  
  // Calculate end date (Sunday)
  const endDate = new Date(startDate)
  endDate.setDate(startDate.getDate() + 6)
  
  // Format dates as DD-MM-YYYY
  const formatDate = (date) => {
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    return `${day}-${month}-${year}`
  }
  
  return {
    startDate,
    endDate,
    formatted: `${formatDate(startDate)} - ${formatDate(endDate)}`
  }
}

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
        tooltip={{
          trigger: 'item',
          content: ({ label, payload }) => {
            if (!payload || payload.length === 0) return null
            
            // Get date range for week format
            const dateRange = getWeekDateRange(label)
            const isWeekFormat = label && label.includes('-W')
            const title = isWeekFormat ? dateRange.formatted : label
            
            // Calculate total story points for this period
            const total = payload.reduce((sum, entry) => sum + (entry.value || 0), 0)
            
            return (
              <Box sx={{ 
                bgcolor: 'background.paper', 
                p: 2, 
                border: '1px solid', 
                borderColor: 'divider',
                borderRadius: 1,
                boxShadow: 2,
                minWidth: 200
              }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {title}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1, color: 'primary.main' }}>
                  Total: {total} story points
                </Typography>
                {payload.map((entry, index) => (
                  <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                    <Box 
                      sx={{ 
                        width: 12, 
                        height: 12, 
                        bgcolor: entry.color, 
                        mr: 1,
                        borderRadius: 0.5
                      }} 
                    />
                    <Typography variant="body2">
                      {entry.name}: {entry.value} points
                    </Typography>
                  </Box>
                ))}
              </Box>
            )
          }
        }}
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