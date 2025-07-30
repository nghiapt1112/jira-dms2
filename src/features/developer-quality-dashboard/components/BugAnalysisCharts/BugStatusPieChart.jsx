/**
 * Bug Status Pie Chart
 * Uses react-chartjs-2 with pre-processed data following coding conventions
 * Implements DRY, SOLID principles and proper caching strategy
 */

import React, { useMemo } from 'react'
import PropTypes from 'prop-types'
import { Card, CardContent, Typography, Box } from '@mui/material'
import { Pie } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend)

const BugStatusPieChart = React.memo(({ 
  chartData,
  title = 'Bug Status Distribution',
  height = 300,
  ...props 
}) => {
  // Memoize chart options for performance (SOLID principle)
  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const total = context.dataset.data.reduce((a, b) => a + b, 0)
            const percentage = ((context.parsed / total) * 100).toFixed(1)
            return `${context.label}: ${context.parsed} bugs (${percentage}%)`
          }
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
              No status data available
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
          <Pie data={chartData} options={chartOptions} />
        </Box>
      </CardContent>
    </Card>
  )
})

BugStatusPieChart.propTypes = {
  chartData: PropTypes.shape({
    labels: PropTypes.arrayOf(PropTypes.string).isRequired,
    datasets: PropTypes.arrayOf(PropTypes.shape({
      data: PropTypes.arrayOf(PropTypes.number).isRequired,
      backgroundColor: PropTypes.arrayOf(PropTypes.string),
      borderColor: PropTypes.arrayOf(PropTypes.string),
      borderWidth: PropTypes.number,
      hoverBackgroundColor: PropTypes.arrayOf(PropTypes.string),
      hoverBorderWidth: PropTypes.number
    })).isRequired
  }),
  title: PropTypes.string,
  height: PropTypes.number
}

BugStatusPieChart.displayName = 'BugStatusPieChart'

export default BugStatusPieChart