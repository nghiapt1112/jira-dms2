/**
 * Effort Effectiveness Chart Component
 * Shows total delivered story points vs total time spent for individual developer analysis
 * Uses Chart.js (react-chartjs-2) for visualization
 */

import React, { useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import { memberConfiguration } from '../../../../constants/memberConfiguration'
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
import { Bar, Line } from 'react-chartjs-2'
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Grid, 
  Chip, 
  ToggleButton,
  ToggleButtonGroup,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material'
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

const EffortEffectivenessChart = ({ 
  developerData, 
  selectedDeveloper, 
  statusFilter = memberConfiguration.filterDefaults.statusFilter 
}) => {
  // State for time period
  const [timePeriod, setTimePeriod] = useState('month')

  // Helper function to get time period key from date
  const getTimePeriodKey = (dateString, period) => {
    const date = new Date(dateString)
    switch (period) {
      case 'week':
        const year = date.getFullYear()
        const week = Math.ceil((date.getTime() - new Date(year, 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000))
        return `${year}-W${week.toString().padStart(2, '0')}`
      case 'quarter':
        const quarter = Math.ceil((date.getMonth() + 1) / 3)
        return `${date.getFullYear()}-Q${quarter}`
      case 'month':
      default:
        return dateString.substring(0, 7) // YYYY-MM
    }
  }

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

  // Calculate time-based metrics for trends
  const timeBasedData = useMemo(() => {
    if (!developerData || !developerData.timeTrackingIssues) {
      return { chartData: null, issuesData: [] }
    }

    // Filter issues by status
    const deliveredIssues = developerData.timeTrackingIssues.filter(issue => 
      statusFilter.includes(issue.status) || statusFilter.length === 0
    )

    // Group issues by time period
    const timeGroups = new Map()
    
    deliveredIssues.forEach(issue => {
      if (issue.created) {
        const periodKey = getTimePeriodKey(issue.created, timePeriod)
        if (!timeGroups.has(periodKey)) {
          timeGroups.set(periodKey, {
            period: periodKey,
            storyPoints: 0,
            timeSpent: 0,
            issues: []
          })
        }
        const group = timeGroups.get(periodKey)
        group.storyPoints += issue.storyPoints || 0
        group.timeSpent += issue.timeSpentHours || 0
        group.issues.push(issue)
      }
    })

    // Sort periods chronologically
    const sortedPeriods = Array.from(timeGroups.values()).sort((a, b) => 
      a.period.localeCompare(b.period)
    )

    // Prepare chart data
    const chartData = {
      labels: sortedPeriods.map(p => p.period),
      datasets: [
        {
          type: 'bar',
          label: 'Story Points',
          data: sortedPeriods.map(p => p.storyPoints),
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 2,
          yAxisID: 'y'
        },
        {
          type: 'line',
          label: 'Time Spent (Hours)',
          data: sortedPeriods.map(p => p.timeSpent),
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 3,
          fill: false,
          tension: 0.4,
          yAxisID: 'y1'
        }
      ]
    }

    return { 
      chartData, 
      issuesData: deliveredIssues.sort((a, b) => 
        new Date(b.created || 0).getTime() - new Date(a.created || 0).getTime()
      )
    }
  }, [developerData, statusFilter, timePeriod])

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

  // Trend chart options
  const trendChartOptions = useMemo(() => {
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
          text: `Story Points & Time Tracking - ${selectedDeveloper} (by ${timePeriod})`,
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
            text: `Time Period (${timePeriod})`
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
  }, [selectedDeveloper, timePeriod])

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
        {/* Header with Time Period Selector */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TrendingUpIcon color="primary" />
            Effort Effectiveness Analysis
          </Typography>
          
          {/* Time Period Selector */}
          <ToggleButtonGroup
            value={timePeriod}
            exclusive
            onChange={(e, newPeriod) => newPeriod && setTimePeriod(newPeriod)}
            size="small"
          >
            <ToggleButton value="week">Week</ToggleButton>
            <ToggleButton value="month">Month</ToggleButton>
            <ToggleButton value="quarter">Quarter</ToggleButton>
          </ToggleButtonGroup>
        </Box>

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

        {/* Velocity Trends Chart */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'medium' }}>
            Velocity Trends by {timePeriod.charAt(0).toUpperCase() + timePeriod.slice(1)}
          </Typography>
          <Box sx={{ height: 400 }}>
            {timeBasedData.chartData ? (
              <Bar data={timeBasedData.chartData} options={trendChartOptions} />
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <Typography color="textSecondary">
                  No time tracking data available for trends analysis
                </Typography>
              </Box>
            )}
          </Box>
        </Box>

        {/* Issue Details Table */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'medium' }}>
            Detailed Issue Breakdown
          </Typography>
          
          <TableContainer 
              component={Paper} 
              sx={{ maxHeight: 500, border: '1px solid rgba(0, 0, 0, 0.12)' }}
            >
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Issue Key</strong></TableCell>
                    <TableCell align="right"><strong>Story Points</strong></TableCell>
                    <TableCell align="right"><strong>Time Spent (h)</strong></TableCell>
                    <TableCell align="right"><strong>Efficiency (h/SP)</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell><strong>Created</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {timeBasedData.issuesData.length > 0 ? (
                    timeBasedData.issuesData.map((issue, index) => {
                      const efficiency = issue.storyPoints > 0 ? 
                        (issue.timeSpentHours / issue.storyPoints).toFixed(2) : 'N/A'
                      return (
                        <TableRow key={`${issue.issueKey}-${index}`} hover>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                              {issue.issueKey}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Chip 
                              label={issue.storyPoints || 0} 
                              size="small" 
                              color="primary" 
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2">
                              {(issue.timeSpentHours || 0).toFixed(1)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography 
                              variant="body2" 
                              color={efficiency !== 'N/A' && parseFloat(efficiency) > 2 ? 'error' : 'textPrimary'}
                            >
                              {efficiency}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={issue.status} 
                              size="small" 
                              color={issue.status === 'Done' ? 'success' : 'default'}
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="textSecondary">
                              {issue.created ? new Date(issue.created).toLocaleDateString() : 'N/A'}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <Typography color="textSecondary" sx={{ py: 2 }}>
                          No issues found with time tracking data
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
          </TableContainer>
        </Box>

        {/* Combined Insights */}
        <Box sx={{ mt: 3, p: 2, bgcolor: 'rgba(0, 0, 0, 0.02)', borderRadius: 1 }}>
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
          
          {timeBasedData.issuesData.length > 0 && (
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
              <strong>Issues Summary:</strong> Showing {timeBasedData.issuesData.length} issues with time tracking data. 
              Red efficiency values (>2h/SP) may indicate complex work or estimation issues.
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
  statusFilter: memberConfiguration.filterDefaults.statusFilter
}

export default EffortEffectivenessChart