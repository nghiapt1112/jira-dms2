/**
 * Effort Effectiveness Chart Component
 * Shows total delivered story points vs total time spent for individual developer analysis
 * Uses Chart.js (react-chartjs-2) for visualization
 */

import React, { useMemo } from 'react'
import PropTypes from 'prop-types'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement
} from 'chart.js'
import { Bar } from 'react-chartjs-2'
import { Box, Typography, Card, CardContent, Grid, Chip } from '@mui/material'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import AssignmentIcon from '@mui/icons-material/Assignment'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
)

const EffortEffectivenessChart = ({ developerData, selectedDeveloper, statusFilter = ['Done'] }) => {
  // Calculate totals from the developer data
  const metrics = useMemo(() => {
    if (!developerData || !developerData.timeTrackingIssues) {
      return {
        totalStoryPoints: 0,
        totalTimeSpent: 0,
        totalIssues: 0,
        timePerStoryPoint: 0,
        efficiency: 'N/A',
        allStoryPoints: 0,
        allTimeSpent: 0
      }
    }

    // Filter issues by status for "delivered" metrics
    const deliveredIssues = developerData.timeTrackingIssues.filter(issue => 
      statusFilter.includes(issue.status) || statusFilter.length === 0
    )

    // Calculate delivered metrics (status-filtered)
    const totalStoryPoints = deliveredIssues.reduce(
      (sum, issue) => sum + (issue.storyPoints || 0), 0
    )
    const totalTimeSpent = deliveredIssues.reduce(
      (sum, issue) => sum + (issue.timeSpentHours || 0), 0
    )
    const totalIssues = deliveredIssues.length

    // Calculate all metrics (unfiltered) for comparison
    const allStoryPoints = developerData.timeTrackingIssues.reduce(
      (sum, issue) => sum + (issue.storyPoints || 0), 0
    )
    const allTimeSpent = developerData.totalTimeSpentHours || 0

    // Calculate efficiency based on delivered work only
    const timePerStoryPoint = totalStoryPoints > 0 ? totalTimeSpent / totalStoryPoints : 0

    // Calculate efficiency rating based on time per story point
    let efficiency = 'Good'
    if (timePerStoryPoint > 2) efficiency = 'Needs Improvement'
    else if (timePerStoryPoint > 1.5) efficiency = 'Average'
    else if (timePerStoryPoint > 0.5) efficiency = 'Good'
    else if (timePerStoryPoint > 0) efficiency = 'Excellent'

    return {
      totalStoryPoints,
      totalTimeSpent: Math.round(totalTimeSpent * 100) / 100,
      totalIssues,
      timePerStoryPoint: Math.round(timePerStoryPoint * 100) / 100,
      efficiency,
      allStoryPoints,
      allTimeSpent: Math.round(allTimeSpent * 100) / 100
    }
  }, [developerData, statusFilter])

  // Chart data configuration
  const chartData = useMemo(() => {
    return {
      labels: ['Effort Effectiveness'],
      datasets: [
        {
          label: 'Story Points Delivered',
          data: [metrics.totalStoryPoints],
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 2,
          yAxisID: 'y'
        },
        {
          label: 'Time Spent (Hours)',
          data: [metrics.totalTimeSpent],
          backgroundColor: 'rgba(255, 99, 132, 0.6)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 2,
          yAxisID: 'y1'
        }
      ]
    }
  }, [metrics])

  // Chart options configuration
  const chartOptions = useMemo(() => {
    return {
      responsive: true,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          position: 'top'
        },
        title: {
          display: true,
          text: `Delivered Work Effectiveness - ${selectedDeveloper}`,
          font: {
            size: 16,
            weight: 'bold'
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.dataset.label || ''
              const value = context.parsed.y
              if (label.includes('Story Points')) {
                return `${label}: ${value} SP`
              } else if (label.includes('Time')) {
                return `${label}: ${value} hours`
              }
              return `${label}: ${value}`
            }
          }
        }
      },
      scales: {
        x: {
          display: true,
          title: {
            display: true,
            text: 'Developer Metrics'
          }
        },
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          title: {
            display: true,
            text: 'Story Points',
            color: 'rgba(54, 162, 235, 1)'
          },
          ticks: {
            color: 'rgba(54, 162, 235, 1)'
          },
          grid: {
            drawOnChartArea: false
          }
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          title: {
            display: true,
            text: 'Time (Hours)',
            color: 'rgba(255, 99, 132, 1)'
          },
          ticks: {
            color: 'rgba(255, 99, 132, 1)'
          },
          grid: {
            drawOnChartArea: false
          }
        }
      }
    }
  }, [selectedDeveloper])

  // Get efficiency color
  const getEfficiencyColor = (efficiency) => {
    switch (efficiency) {
      case 'Excellent': return 'success'
      case 'Good': return 'primary'
      case 'Average': return 'warning'
      case 'Needs Improvement': return 'error'
      default: return 'default'
    }
  }

  if (!developerData) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Effort Effectiveness
          </Typography>
          <Typography color="textSecondary">
            No data available for effort effectiveness analysis
          </Typography>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TrendingUpIcon color="primary" />
          Effort Effectiveness Analysis
        </Typography>

        {/* Metrics Summary */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'rgba(54, 162, 235, 0.1)', borderRadius: 1 }}>
              <AssignmentIcon sx={{ fontSize: 32, color: 'rgba(54, 162, 235, 1)', mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'rgba(54, 162, 235, 1)' }}>
                {metrics.totalStoryPoints}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Story Points Delivered
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'rgba(255, 99, 132, 0.1)', borderRadius: 1 }}>
              <AccessTimeIcon sx={{ fontSize: 32, color: 'rgba(255, 99, 132, 1)', mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'rgba(255, 99, 132, 1)' }}>
                {metrics.totalTimeSpent}h
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Total Time Spent
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'rgba(75, 192, 192, 0.1)', borderRadius: 1 }}>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'rgba(75, 192, 192, 1)' }}>
                {metrics.timePerStoryPoint}h
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Hours per Story Point
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: 'center', p: 1 }}>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                Efficiency Rating
              </Typography>
              <Chip
                label={metrics.efficiency}
                color={getEfficiencyColor(metrics.efficiency)}
                sx={{ fontWeight: 'bold' }}
              />
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                {metrics.totalIssues} issues tracked
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Chart */}
        <Box sx={{ height: 400, mt: 2 }}>
          <Bar data={chartData} options={chartOptions} />
        </Box>

        {/* Insights */}
        <Box sx={{ mt: 2, p: 2, bgcolor: 'rgba(0, 0, 0, 0.02)', borderRadius: 1 }}>
          <Typography variant="body2" color="textSecondary">
            <strong>Delivered Work Analysis:</strong> {selectedDeveloper} has completed{' '}
            <strong>{metrics.totalStoryPoints} story points</strong> in{' '}
            <strong>{metrics.totalTimeSpent} hours</strong> (filtered by status), averaging{' '}
            <strong>{metrics.timePerStoryPoint} hours per story point</strong>.{' '}
            {metrics.efficiency === 'Excellent' && 'This is an excellent efficiency rate for delivered work!'}
            {metrics.efficiency === 'Good' && 'This shows good productivity for delivered work.'}
            {metrics.efficiency === 'Average' && 'There is room for improvement in delivery efficiency.'}
            {metrics.efficiency === 'Needs Improvement' && 'Consider reviewing task complexity and delivery process.'}
          </Typography>
          
          {metrics.allStoryPoints !== metrics.totalStoryPoints && (
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1, fontStyle: 'italic' }}>
              <strong>Note:</strong> Total work includes {metrics.allStoryPoints} story points and {metrics.allTimeSpent} hours across all statuses.
              This chart focuses on delivered work only (status-filtered).
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  )
}

EffortEffectivenessChart.propTypes = {
  developerData: PropTypes.object,
  selectedDeveloper: PropTypes.string.isRequired,
  statusFilter: PropTypes.arrayOf(PropTypes.string)
}

EffortEffectivenessChart.defaultProps = {
  developerData: null,
  statusFilter: ['Done']
}

export default EffortEffectivenessChart