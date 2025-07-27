/**
 * Effort Effectiveness Chart Component
 * Shows total delivered story points vs total time spent for individual developer analysis
 * Uses Chart.js (react-chartjs-2) for visualization
 */

import React, { useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import { memberConfiguration, getSeverityConfig, getSeverityWeights } from '../../../../constants/memberConfiguration'
import { IssueUtils } from '../../../../shared/utils/IssueUtils'
import { calculateProjectSeverityRates } from '../../../../shared/utils/severityCalculations'
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
  Paper
} from '@mui/material'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import AssignmentIcon from '@mui/icons-material/Assignment'
// Import centralized time utilities to fix data alignment issues
import { getTimePeriodKey } from '../../../../shared/utils/timeUtils.js'
import { useDeveloperQualityStore } from '../../store/developerQualityStore'

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

// Severity weights are now centralized in severityConstants.js and memberConfiguration.js

const EffortEffectivenessChart = ({ 
  developerData = null, 
  selectedDeveloper, 
  timeframe = 'month',
  projectData = null  // New prop for project-level severity calculations
}) => {

  // Using centralized severity utilities from shared/utils/severityCalculations.js
  
  // Project Severity Rate Storage - stores severity rate data from Project Overview for cross-dashboard integration
  const projectSeverityRates = useMemo(() => {
    if (!projectData || !Array.isArray(projectData)) {
      return []
    }
    
    // Calculate project severity rates using centralized utilities
    return calculateProjectSeverityRates(projectData)
  }, [projectData])

  // Store severity weights configuration for the current project context
  const currentSeverityWeights = useMemo(() => {
    const projectKey = selectedDeveloper?.projectKey || null
    return getSeverityWeights(projectKey)
  }, [selectedDeveloper?.projectKey])

  // Expose project severity rates for other components to consume
  // This enables cross-dashboard data sharing as specified in the implementation plan
  const getProjectSeverityRates = () => projectSeverityRates
  const getCurrentSeverityWeights = () => currentSeverityWeights


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

    // CRITICAL FIX: Use the same data source as DeveloperTicketTable for consistency
    // Instead of using developerData.timeTrackingIssues, use the store's minimalIssues
    // This ensures both components use identical data filtering logic
    const { data } = useDeveloperQualityStore()
    const storeIssues = data?.minimalIssues || []
    
    // Filter by developer first, then apply delivered filter (same as DeveloperTicketTable)
    const developerIssues = storeIssues.filter(issue => issue.assignee === selectedDeveloper)
    const deliveredIssues = IssueUtils.filterDeliveredIssues(developerIssues)

    // Debug logging using IssueUtils
    if (process.env.NODE_ENV === 'development') {
      IssueUtils.debugCalculation(
        developerIssues,
        deliveredIssues,
        'Velocity Trends (Fixed)'
      )
    }

    // Calculate delivered metrics using IssueUtils
    const totalStoryPoints = IssueUtils.calculateTotalStoryPoints(deliveredIssues)
    const totalTimeSpent = deliveredIssues.reduce(
      (sum, issue) => sum + (issue.timeSpentHours || 0), 0
    )
    const totalIssues = deliveredIssues.length

    // Calculate all metrics (unfiltered) for comparison
    const allStoryPoints = IssueUtils.calculateTotalStoryPoints(developerIssues)
    const allTimeSpent = developerIssues.reduce(
      (sum, issue) => sum + (issue.timeSpentHours || 0), 0
    )

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
  }, [developerData, selectedDeveloper, timeframe])

  // Calculate time-based metrics for trends
  const timeBasedData = useMemo(() => {
    if (!developerData || !developerData.timeTrackingIssues) {
      return { chartData: null, issuesData: [] }
    }

    // CRITICAL FIX: Use the same data source as DeveloperTicketTable for consistency
    const { data } = useDeveloperQualityStore()
    const storeIssues = data?.minimalIssues || []
    
    // Filter by developer first, then apply delivered filter (same as DeveloperTicketTable)
    const developerIssues = storeIssues.filter(issue => issue.assignee === selectedDeveloper)
    const deliveredIssues = IssueUtils.filterDeliveredIssues(developerIssues)

    // Group issues by time period for the velocity trends chart
    const timeGroups = new Map()
    
    deliveredIssues.forEach(issue => {
      // Use IssueUtils.getDeliveredDate for consistent date logic
      const deliveredDate = IssueUtils.getDeliveredDate(issue)
      if (deliveredDate) {
        // Use timeframe setting for the chart (not hardcoded to month)
        const periodKey = getTimePeriodKey(deliveredDate, timeframe)
        if (!timeGroups.has(periodKey)) {
          timeGroups.set(periodKey, {
            period: periodKey,
            storyPoints: 0,
            timeSpent: 0
          })
        }
        const group = timeGroups.get(periodKey)
        group.storyPoints += issue.storyPoints || 0
        group.timeSpent += issue.timeSpentHours || 0
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
      chartData
    }
  }, [developerData, selectedDeveloper, timeframe])


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
          text: `Story Points & Time Tracking - ${selectedDeveloper} (by ${timeframe})`,
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
            text: `Time Period (${timeframe})`
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
  }, [selectedDeveloper, timeframe])


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
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', mb: 2 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TrendingUpIcon color="primary" />
            Effort Effectiveness Analysis ({timeframe})
          </Typography>
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
            Velocity Trends by {timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}
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
          
          
        </Box>
      </CardContent>
    </Card>
  )
}

EffortEffectivenessChart.propTypes = {
  developerData: PropTypes.object,
  selectedDeveloper: PropTypes.string.isRequired,
  statusFilter: PropTypes.arrayOf(PropTypes.string),
  timeframe: PropTypes.oneOf(['week', 'month', 'quarter']),
  projectData: PropTypes.shape({
    projects: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.string,
      projectKey: PropTypes.string,
      name: PropTypes.string,
      totalIssues: PropTypes.number,
      bugs: PropTypes.array,
      progress: PropTypes.number,
      qualityScore: PropTypes.number,
      healthScore: PropTypes.number
    }))
  })
}


export default EffortEffectivenessChart