/**
 * Bug Created/Resolved Line Chart
 * Uses react-chartjs-2 with pre-processed data following coding conventions
 * Implements DRY, SOLID principles and proper caching strategy
 */

import React, { useMemo } from 'react'
import PropTypes from 'prop-types'
import { Card, CardContent, Typography, Box } from '@mui/material'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

const BugCreatedResolvedChart = React.memo(({ 
  chartData, 
  title = 'Bugs Created vs Resolved',
  height = 300,
  timeframe = 'month',
  ...props 
}) => {
  // Memoize chart options for performance (SOLID principle)
  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${context.parsed.y} bugs`
          }
        }
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: timeframe.charAt(0).toUpperCase() + timeframe.slice(1)
        }
      },
      y: {
        display: true,
        title: {
          display: true,
          text: 'Number of Bugs'
        },
        beginAtZero: true
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  }), [timeframe])

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
              No data available for the selected timeframe
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
          <Line data={chartData} options={chartOptions} />
        </Box>
      </CardContent>
    </Card>
  )
})

BugCreatedResolvedChart.propTypes = {
  chartData: PropTypes.shape({
    labels: PropTypes.arrayOf(PropTypes.string).isRequired,
    datasets: PropTypes.arrayOf(PropTypes.shape({
      label: PropTypes.string.isRequired,
      data: PropTypes.arrayOf(PropTypes.number).isRequired,
      borderColor: PropTypes.string,
      backgroundColor: PropTypes.string,
      borderWidth: PropTypes.number,
      fill: PropTypes.bool,
      tension: PropTypes.number
    })).isRequired
  }),
  title: PropTypes.string,
  height: PropTypes.number,
  timeframe: PropTypes.oneOf(['week', 'month'])
}

BugCreatedResolvedChart.displayName = 'BugCreatedResolvedChart'

export default BugCreatedResolvedChart