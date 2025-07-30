/**
 * Bug Root Cause Bar Chart
 * Uses react-chartjs-2 with pre-processed data following coding conventions
 * Implements DRY, SOLID principles and proper caching strategy
 */

import React, { useMemo } from 'react'
import PropTypes from 'prop-types'
import { Card, CardContent, Typography, Box } from '@mui/material'
import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

const BugRootCauseBarChart = React.memo(({ 
  chartData,
  title = 'Bug Root Cause Analysis',
  height = 300,
  ...props 
}) => {
  // Memoize chart options for performance (SOLID principle)
  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false // Hide legend for single dataset
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const total = context.dataset.data.reduce((a, b) => a + b, 0)
            const percentage = ((context.parsed.y / total) * 100).toFixed(1)
            return `${context.parsed.y} bugs (${percentage}%)`
          }
        }
      }
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Root Cause'
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45
        }
      },
      y: {
        display: true,
        title: {
          display: true,
          text: 'Number of Bugs'
        },
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
      }
    }
  }), [])

  // Early return for loading/empty state
  if (!chartData || !chartData.labels || chartData.labels.length === 0) {
    return (
      <Card {...props}>
        <CardContent>
          <Typography variant="h6">{title}</Typography>
          <Box sx={{ 
            height, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            p: 2 
          }}>
            <Typography variant="body2" color="text.secondary">
              No root cause data available
            </Typography>
          </Box>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card {...props}>
      <CardContent>
        <Typography variant="h6" gutterBottom>{title}</Typography>
        <Box sx={{ height, width: '100%' }}>
          <Bar data={chartData} options={chartOptions} />
        </Box>
      </CardContent>
    </Card>
  )
})

BugRootCauseBarChart.propTypes = {
  chartData: PropTypes.shape({
    labels: PropTypes.arrayOf(PropTypes.string).isRequired,
    datasets: PropTypes.arrayOf(PropTypes.shape({
      label: PropTypes.string.isRequired,
      data: PropTypes.arrayOf(PropTypes.number).isRequired,
      backgroundColor: PropTypes.string,
      borderColor: PropTypes.string,
      borderWidth: PropTypes.number,
      hoverBackgroundColor: PropTypes.string,
      hoverBorderColor: PropTypes.string,
      hoverBorderWidth: PropTypes.number
    })).isRequired
  }),
  title: PropTypes.string,
  height: PropTypes.number
}

BugRootCauseBarChart.displayName = 'BugRootCauseBarChart'

export default BugRootCauseBarChart