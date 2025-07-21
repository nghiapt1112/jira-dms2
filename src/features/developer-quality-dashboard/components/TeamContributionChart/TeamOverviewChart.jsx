import React, { useMemo } from 'react'
import PropTypes from 'prop-types'
import { Box, Typography } from '@mui/material'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import { Bar } from 'react-chartjs-2'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

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
  
  // Format dates as DD/MM/YYYY
  const formatDate = (date) => {
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
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
  // Generate Chart.js data structure
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

    // Create Chart.js datasets for each developer
    const datasets = developersArray.map((developer, index) => ({
      label: developer,
      data: data.map(item => item[developer] || 0),
      backgroundColor: colors[index % colors.length],
      borderColor: colors[index % colors.length],
      borderWidth: 1
    }))

    console.log('📊 TEAM OVERVIEW: Generated chart data', {
      developersCount: developersArray.length,
      datasetsCount: datasets.length,
      dataPointsCount: data.length
    })

    return {
      labels: data.map(item => item.timePeriod),
      datasets: datasets
    }
  }, [data])

  // Chart.js configuration
  const chartOptions = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          position: 'top',
          labels: {
            usePointStyle: true,
            pointStyle: 'rect',
            padding: 15,
            font: {
              size: 12
            }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: 'white',
          bodyColor: 'white',
          borderColor: 'rgba(0, 0, 0, 0.1)',
          borderWidth: 1,
          cornerRadius: 6,
          displayColors: true,
          callbacks: {
            title: function(tooltipItems) {
              if (tooltipItems.length === 0) return ''
              
              const label = tooltipItems[0].label
              const dateRange = getWeekDateRange(label)
              const isWeekFormat = label && label.includes('-W')
              
              return isWeekFormat ? dateRange.formatted : label
            },
            afterTitle: function(tooltipItems) {
              if (tooltipItems.length === 0) return ''
              
              // Calculate total story points for this period
              const total = tooltipItems.reduce((sum, item) => sum + (item.parsed.y || 0), 0)
              return `Total: ${total} story points`
            },
            label: function(context) {
              return `${context.dataset.label}: ${context.parsed.y} points`
            }
          }
        }
      },
      scales: {
        x: {
          stacked: true,
          grid: {
            display: false
          },
          ticks: {
            maxRotation: data && data.length > 6 ? 45 : 0,
            minRotation: 0,
            font: {
              size: 11
            }
          }
        },
        y: {
          stacked: true,
          beginAtZero: true,
          title: {
            display: true,
            text: 'Story Points',
            font: {
              size: 12,
              weight: 'bold'
            }
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.1)'
          },
          ticks: {
            font: {
              size: 11
            }
          }
        }
      }
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
      <Bar 
        data={chartData}
        options={chartOptions}
        height={height}
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