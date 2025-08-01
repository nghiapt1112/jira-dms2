/**
 * Effort Effectiveness Chart Component
 * Shows total delivered story points vs total time spent for individual developer analysis
 * Uses Chart.js (react-chartjs-2) for visualization
 */

import React, { useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import { memberConfiguration, getSeverityConfig, getSeverityWeights } from '../../../../constants/memberConfiguration'
import { IssueUtils } from '../../../../shared/utils/IssueUtils'
import { 
  calculateProjectSeverityRates,
  calculateEffortMetrics,
  calculateEffortEfficiency,
  calculateQualityEfficiency,
  calculateWeightedBugRate
} from '../../../../shared/utils/severityCalculations'
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
import SpeedIcon from '@mui/icons-material/Speed'
import VerifiedIcon from '@mui/icons-material/Verified'
// Import centralized time utilities to fix data alignment issues
import { getTimePeriodKey } from '../../../../shared/utils/timeUtils.js'
import { useDeveloperQualityStore } from '../../store/developerQualityStore'
import DebugDataViewer from './DebugDataViewer'

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
  projectData = null,  // New prop for project-level severity calculations
  filteredData = null  // CRITICAL: Add filteredData prop to respect filter state
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
    // CRITICAL FIX: Use filteredData to respect current filter state
    // If filteredData is available, use it; otherwise fall back to store data
    let issuesToProcess = []
    
    if (filteredData && filteredData.filteredIssues) {
      // Use filtered data that respects all current filter options
      issuesToProcess = filteredData.filteredIssues.filter(issue => issue.assignee === selectedDeveloper)
    } else if (developerData && developerData.timeTrackingIssues) {
      // Fallback to developer data if no filtered data available
      issuesToProcess = developerData.timeTrackingIssues.filter(issue => issue.assignee === selectedDeveloper)
    } else {
      // Final fallback to store data
      const { data } = useDeveloperQualityStore()
      const storeIssues = data?.minimalIssues || []
      issuesToProcess = storeIssues.filter(issue => issue.assignee === selectedDeveloper)
    }
    
    // CRITICAL: Ensure issuesToProcess is always defined
    if (!issuesToProcess) {
      issuesToProcess = []
    }
    
    if (!issuesToProcess || issuesToProcess.length === 0) {
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

    // Apply delivered filter to get final issues for calculation
    const deliveredIssues = IssueUtils.filterDeliveredIssues(issuesToProcess)



    // Calculate delivered metrics using IssueUtils
    const totalStoryPoints = IssueUtils.calculateTotalStoryPoints(deliveredIssues)
    const totalTimeSpent = deliveredIssues.reduce(
      (sum, issue) => sum + (issue.timeSpentHours || 0), 0
    )
    const totalIssues = deliveredIssues.length

    // Calculate all metrics (unfiltered) for comparison
    const allStoryPoints = IssueUtils.calculateTotalStoryPoints(issuesToProcess)
    const allTimeSpent = issuesToProcess.reduce(
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

    // Calculate EE and EE Quality metrics using the new functions
    const effortMetrics = calculateEffortMetrics(deliveredIssues, selectedDeveloper?.projectKey)
    
    // Calculate EE rating based on story points per hour
    let eeRating = 'Good'
    const storyPointsPerHour = effortMetrics.storyPointsPerHour
    if (storyPointsPerHour >= 2) eeRating = 'Excellent'
    else if (storyPointsPerHour >= 1) eeRating = 'Good'
    else if (storyPointsPerHour >= 0.5) eeRating = 'Average'
    else if (storyPointsPerHour > 0) eeRating = 'Needs Improvement'
    else eeRating = 'N/A'

    // Calculate EE Quality rating based on quality efficiency
    let eeQualityRating = 'Good'
    if (effortMetrics.qualityEfficiency >= 95) eeQualityRating = 'Excellent'
    else if (effortMetrics.qualityEfficiency >= 85) eeQualityRating = 'Good'
    else if (effortMetrics.qualityEfficiency >= 70) eeQualityRating = 'Average'
    else if (effortMetrics.qualityEfficiency >= 50) eeQualityRating = 'Needs Improvement'
    else eeQualityRating = 'Poor'

    return {
      totalStoryPoints,
      totalTimeSpent: Math.round(totalTimeSpent * 100) / 100,
      totalIssues,
      timePerStoryPoint: Math.round(timePerStoryPoint * 100) / 100,
      efficiency,
      allStoryPoints,
      allTimeSpent: Math.round(allTimeSpent * 100) / 100,
      // New EE metrics
      effortEfficiency: Math.round(effortMetrics.effortEfficiency * 100) / 100,
      qualityEfficiency: Math.round(effortMetrics.qualityEfficiency * 100) / 100,
      weightedBugRate: Math.round(effortMetrics.weightedBugRate * 100) / 100,
      totalBugs: effortMetrics.totalBugs,
      eeRating,
      eeQualityRating,
      storyPointsPerHour: Math.round(effortMetrics.storyPointsPerHour * 100) / 100,
      bugDensity: Math.round(effortMetrics.bugDensity * 100) / 100
    }
  }, [developerData, selectedDeveloper, timeframe, filteredData])

  // Calculate time-based metrics for trends
  const timeBasedData = useMemo(() => {
    // CRITICAL FIX: Use filteredData to respect current filter state for time-based calculations
    let issuesToProcess = []
    
    if (filteredData && filteredData.filteredIssues) {
      // Use filtered data that respects all current filter options
      issuesToProcess = filteredData.filteredIssues.filter(issue => issue.assignee === selectedDeveloper)
    } else if (developerData && developerData.timeTrackingIssues) {
      // Fallback to developer data if no filtered data available
      issuesToProcess = developerData.timeTrackingIssues.filter(issue => issue.assignee === selectedDeveloper)
    } else {
      // Final fallback to store data
      const { data } = useDeveloperQualityStore()
      const storeIssues = data?.minimalIssues || []
      issuesToProcess = storeIssues.filter(issue => issue.assignee === selectedDeveloper)
    }
    
    if (!issuesToProcess || issuesToProcess.length === 0) {
      return { chartData: null, issuesData: [] }
    }

    // Apply delivered filter to get final issues for time-based calculations
    const deliveredIssues = IssueUtils.filterDeliveredIssues(issuesToProcess)

    // Group issues by time period for the velocity trends chart with EE metrics
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
            timeSpent: 0,
            bugs: 0,
            totalIssues: 0,
            issues: []
          })
        }
        const group = timeGroups.get(periodKey)
        group.storyPoints += issue.storyPoints || 0
        group.timeSpent += issue.timeSpentHours || 0
        group.totalIssues += 1
        group.issues.push(issue)
        
        // Count bugs for EE Quality calculation
        if (issue.issueType === 'Bug' || issue.fields?.issuetype?.name?.toLowerCase() === 'bug') {
          group.bugs += 1
        }
      }
    })

    // Sort periods chronologically and calculate EE metrics for each period
    const sortedPeriods = Array.from(timeGroups.values())
      .sort((a, b) => a.period.localeCompare(b.period))
      .map(period => {
        // Calculate EE for this time period
        const effortEfficiency = period.timeSpent > 0 ? (period.storyPoints / period.timeSpent) * 100 : 0
        
        // Calculate proper EE Quality using weighted bug rate with severity weights
        // First, extract bugs from the issues in this period
        const periodBugs = period.issues.filter(issue => 
          issue.issueType === 'Bug' || 
          issue.fields?.issuetype?.name?.toLowerCase() === 'bug'
        )
        
        // Calculate weighted bug rate and EE Quality using existing functions
        const projectKey = selectedDeveloper?.projectKey || null
        const weightedBugRate = calculateWeightedBugRate(periodBugs, period.totalIssues, projectKey)
        const qualityEfficiency = Math.max(0, 100 - weightedBugRate)
        
        return {
          ...period,
          effortEfficiency: Math.round(effortEfficiency * 100) / 100,
          qualityEfficiency: Math.round(qualityEfficiency * 100) / 100,
          weightedBugRate: Math.round(weightedBugRate * 100) / 100,
          storyPointsPerHour: period.timeSpent > 0 ? Math.round((period.storyPoints / period.timeSpent) * 100) / 100 : 0
        }
      })

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
      eeTimeBasedData: sortedPeriods,
      eeMetricsSummary: {
        avgEffortEfficiency: sortedPeriods.length > 0 ? 
          sortedPeriods.reduce((sum, p) => sum + p.effortEfficiency, 0) / sortedPeriods.length : 0,
        avgQualityEfficiency: sortedPeriods.length > 0 ? 
          sortedPeriods.reduce((sum, p) => sum + p.qualityEfficiency, 0) / sortedPeriods.length : 0,
        totalBugsOverTime: sortedPeriods.reduce((sum, p) => sum + p.bugs, 0),
        totalIssuesOverTime: sortedPeriods.reduce((sum, p) => sum + p.totalIssues, 0)
      }
    }
  }, [developerData, selectedDeveloper, timeframe, filteredData])


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
            title: function(context) {
              return `Period: ${context[0].label}`
            },
            label: function(context) {
              const label = context.dataset.label || ''
              const value = context.parsed.y
              const dataIndex = context.dataIndex
              const periodData = timeBasedData.eeTimeBasedData?.[dataIndex]
              
              if (label.includes('Story Points')) {
                return [
                  `${label}: ${value} SP`,
                  periodData ? `  Total Issues: ${periodData.totalIssues}` : '',
                  periodData ? `  Efficiency: ${periodData.storyPointsPerHour} SP/hour` : ''
                ].filter(Boolean)
              } else if (label.includes('Time')) {
                return [
                  `${label}: ${value} hours`,
                  periodData ? `  Story Points: ${periodData.storyPoints} SP` : '',
                  periodData ? `  Hours/SP: ${periodData.storyPoints > 0 ? Math.round((value / periodData.storyPoints) * 100) / 100 : 0}` : ''
                ].filter(Boolean)
              }
              return `${label}: ${value}`
            },
            footer: function(context) {
              const dataIndex = context[0].dataIndex
              const periodData = timeBasedData.eeTimeBasedData?.[dataIndex]
              
              if (periodData) {
                return [
                  '',
                  `Summary for ${context[0].label}:`,
                  `Total Issues: ${periodData.totalIssues}`,
                  `Story Points: ${periodData.storyPoints} SP`,
                  `Time Spent: ${periodData.timeSpent}h`,
                  `Bugs: ${periodData.bugs}`,
                  `Efficiency: ${periodData.effortEfficiency}%`
                ]
              }
              return ''
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

  // EE (Effort Efficiency) Chart data configuration
  const eeChartData = useMemo(() => {
    if (!timeBasedData.eeTimeBasedData || timeBasedData.eeTimeBasedData.length === 0) {
      return null
    }

    return {
      labels: timeBasedData.eeTimeBasedData.map(p => p.period),
      datasets: [
        {
          label: 'EE (Effort Efficiency %)',
          data: timeBasedData.eeTimeBasedData.map(p => p.effortEfficiency),
          backgroundColor: 'rgba(76, 175, 80, 0.2)',
          borderColor: 'rgba(76, 175, 80, 1)',
          borderWidth: 3,
          fill: false,
          tension: 0.4,
          yAxisID: 'y'
        },
        {
          label: 'Story Points/Hour',
          data: timeBasedData.eeTimeBasedData.map(p => p.storyPointsPerHour),
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 2,
          fill: false,
          tension: 0.4,
          yAxisID: 'y1'
        }
      ]
    }
  }, [timeBasedData])

  // EE Quality Chart data configuration  
  const eeQualityChartData = useMemo(() => {
    if (!timeBasedData.eeTimeBasedData || timeBasedData.eeTimeBasedData.length === 0) {
      return null
    }

    return {
      labels: timeBasedData.eeTimeBasedData.map(p => p.period),
      datasets: [
        {
          label: 'EE Quality %',
          data: timeBasedData.eeTimeBasedData.map(p => p.qualityEfficiency),
          backgroundColor: 'rgba(156, 39, 176, 0.2)',
          borderColor: 'rgba(156, 39, 176, 1)',
          borderWidth: 3,
          fill: false,
          tension: 0.4,
          yAxisID: 'y'
        },
        {
          label: 'Bug Count',
          data: timeBasedData.eeTimeBasedData.map(p => p.bugs),
          backgroundColor: 'rgba(244, 67, 54, 0.6)',
          borderColor: 'rgba(244, 67, 54, 1)',
          borderWidth: 2,
          type: 'bar',
          yAxisID: 'y1'
        }
      ]
    }
  }, [timeBasedData])

  // EE Chart options configuration
  const eeChartOptions = useMemo(() => {
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
          text: `Effort Efficiency (EE) - ${selectedDeveloper} (by ${timeframe})`,
          font: {
            size: 16,
            weight: 'bold'
          }
        },
        tooltip: {
          callbacks: {
            title: function(context) {
              return `Period: ${context[0].label}`
            },
            label: function(context) {
              const label = context.dataset.label || ''
              const value = context.parsed.y
              const dataIndex = context.dataIndex
              const periodData = timeBasedData.eeTimeBasedData[dataIndex]
              
              if (label.includes('EE (Effort Efficiency')) {
                return [
                  `${label}: ${Math.round(value * 100) / 100}%`,
                  `  Story Points: ${periodData.storyPoints}`,
                  `  Time Spent: ${periodData.timeSpent}h`,
                  `  Total Issues: ${periodData.totalIssues}`
                ]
              } else if (label.includes('Story Points/Hour')) {
                return [
                  `${label}: ${Math.round(value * 100) / 100}`,
                  `  Story Points: ${periodData.storyPoints}`,
                  `  Time Spent: ${periodData.timeSpent}h`
                ]
              }
              return `${label}: ${Math.round(value * 100) / 100}`
            },
            footer: function(context) {
              const dataIndex = context[0].dataIndex
              const periodData = timeBasedData.eeTimeBasedData[dataIndex]
              return [
                '',
                `Summary for ${context[0].label}:`,
                `Story Points: ${periodData.storyPoints} SP`,
                `Time Spent: ${periodData.timeSpent}h`,
                `Efficiency: ${periodData.effortEfficiency}%`
              ]
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
            text: 'EE (%)',
            color: 'rgba(76, 175, 80, 1)'
          },
          ticks: {
            color: 'rgba(76, 175, 80, 1)'
          }
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          title: {
            display: true,
            text: 'Story Points/Hour',
            color: 'rgba(54, 162, 235, 1)'
          },
          ticks: {
            color: 'rgba(54, 162, 235, 1)'
          },
          grid: {
            drawOnChartArea: false
          }
        }
      }
    }
  }, [selectedDeveloper, timeframe])

  // EE Quality Chart options configuration
  const eeQualityChartOptions = useMemo(() => {
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
          text: `Quality Efficiency (EE Quality) - ${selectedDeveloper} (by ${timeframe})`,
          font: {
            size: 16,
            weight: 'bold'
          }
        },
        tooltip: {
          callbacks: {
            title: function(context) {
              return `Period: ${context[0].label}`
            },
            label: function(context) {
              const label = context.dataset.label || ''
              const value = context.parsed.y
              const dataIndex = context.dataIndex
              const periodData = timeBasedData.eeTimeBasedData[dataIndex]
              
              if (label.includes('EE Quality')) {
                return [
                  `${label}: ${Math.round(value * 100) / 100}%`,
                  `  Bugs: ${periodData.bugs}`,
                  `  Total Issues: ${periodData.totalIssues}`,
                  `  Bug Rate: ${periodData.weightedBugRate}%`
                ]
              } else if (label.includes('Bug Count')) {
                return [
                  `${label}: ${value} bugs`,
                  `  Total Issues: ${periodData.totalIssues}`,
                  `  Bug Density: ${Math.round((value / periodData.totalIssues) * 100)}%`
                ]
              }
              return `${label}: ${Math.round(value * 100) / 100}`
            },
            footer: function(context) {
              const dataIndex = context[0].dataIndex
              const periodData = timeBasedData.eeTimeBasedData[dataIndex]
              return [
                '',
                `Summary for ${context[0].label}:`,
                `Total Issues: ${periodData.totalIssues}`,
                `Bugs Found: ${periodData.bugs}`,
                `Quality Score: ${periodData.qualityEfficiency}%`
              ]
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
            text: 'EE Quality (%)',
            color: 'rgba(156, 39, 176, 1)'
          },
          ticks: {
            color: 'rgba(156, 39, 176, 1)'
          }
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          title: {
            display: true,
            text: 'Bug Count',
            color: 'rgba(244, 67, 54, 1)'
          },
          ticks: {
            color: 'rgba(244, 67, 54, 1)'
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

          {/* EE (Effort Efficiency) Metric */}
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'rgba(76, 175, 80, 0.1)', borderRadius: 1 }}>
              <SpeedIcon sx={{ fontSize: 32, color: 'rgba(76, 175, 80, 1)', mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'rgba(76, 175, 80, 1)' }}>
                {metrics.effortEfficiency}%
              </Typography>
              <Typography variant="body2" color="textSecondary">
                EE (Effort Efficiency)
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                <Chip
                  label={metrics.eeRating}
                  color={getEfficiencyColor(metrics.eeRating)}
                  size="small"
                  sx={{ fontWeight: 'bold' }}
                />
              </Typography>
            </Box>
          </Grid>

          {/* EE Quality Metric */}
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'rgba(156, 39, 176, 0.1)', borderRadius: 1 }}>
              <VerifiedIcon sx={{ fontSize: 32, color: 'rgba(156, 39, 176, 1)', mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'rgba(156, 39, 176, 1)' }}>
                {metrics.qualityEfficiency}%
              </Typography>
              <Typography variant="body2" color="textSecondary">
                EE Quality (Bug-Weighted)
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                <Chip
                  label={metrics.eeQualityRating}
                  color={getEfficiencyColor(metrics.eeQualityRating)}
                  size="small"
                  sx={{ fontWeight: 'bold' }}
                />
              </Typography>
              <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5, display: 'block' }}>
                {metrics.totalBugs} bugs tracked
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

        {/* EE (Effort Efficiency) Chart */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'medium' }}>
            Effort Efficiency (EE) Trends by {timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}
          </Typography>
          <Box sx={{ height: 400 }}>
            {timeBasedData.eeTimeBasedData && timeBasedData.eeTimeBasedData.length > 0 ? (
              <Line data={eeChartData} options={eeChartOptions} />
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <Typography color="textSecondary">
                  No EE data available for trends analysis
                </Typography>
              </Box>
            )}
          </Box>
        </Box>

        {/* EE Quality Chart */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'medium' }}>
            Quality Efficiency (EE Quality) Trends by {timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}
          </Typography>
          <Box sx={{ height: 400 }}>
            {timeBasedData.eeTimeBasedData && timeBasedData.eeTimeBasedData.length > 0 ? (
              <Line data={eeQualityChartData} options={eeQualityChartOptions} />
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <Typography color="textSecondary">
                  No EE Quality data available for trends analysis
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
          
          {/* EE and EE Quality Insights */}
          <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
            <strong>Effort Efficiency (EE):</strong> Achieving{' '}
            <strong>{metrics.effortEfficiency}% efficiency</strong> ({metrics.storyPointsPerHour} story points per hour).{' '}
            {metrics.eeRating === 'Excellent' && 'Outstanding efficiency - delivering substantial value per hour!'}
            {metrics.eeRating === 'Good' && 'Good efficiency rate for story point delivery.'}
            {metrics.eeRating === 'Average' && 'Moderate efficiency - consider optimizing work processes.'}
            {metrics.eeRating === 'Needs Improvement' && 'Low efficiency - review task complexity and development practices.'}
          </Typography>

          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            <strong>Quality Efficiency (EE Quality):</strong> Quality score of{' '}
            <strong>{metrics.qualityEfficiency}%</strong> with {metrics.totalBugs} bugs detected{' '}
            (weighted bug rate: {metrics.weightedBugRate}%).{' '}
            {metrics.eeQualityRating === 'Excellent' && 'Exceptional quality - minimal bug impact!'}
            {metrics.eeQualityRating === 'Good' && 'Good quality standards maintained.'}
            {metrics.eeQualityRating === 'Average' && 'Average quality - some room for improvement.'}
            {metrics.eeQualityRating === 'Needs Improvement' && 'Quality needs attention - high bug impact detected.'}
            {metrics.eeQualityRating === 'Poor' && 'Poor quality - significant bug issues require immediate attention.'}
          </Typography>

          {/* EE Trends Summary */}
          {timeBasedData.eeMetricsSummary && (
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
              <strong>Trends Analysis:</strong> Average EE efficiency over time:{' '}
              <strong>{Math.round(timeBasedData.eeMetricsSummary.avgEffortEfficiency * 100) / 100}%</strong>,{' '}
              Average EE Quality: <strong>{Math.round(timeBasedData.eeMetricsSummary.avgQualityEfficiency * 100) / 100}%</strong>.{' '}
              Total bugs across all periods: {timeBasedData.eeMetricsSummary.totalBugsOverTime} out of{' '}
              {timeBasedData.eeMetricsSummary.totalIssuesOverTime} issues tracked.
            </Typography>
          )}

          {metrics.allStoryPoints !== metrics.totalStoryPoints && (
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1, fontStyle: 'italic' }}>
              <strong>Note:</strong> Total work includes {metrics.allStoryPoints} story points and {metrics.allTimeSpent} hours across all statuses.
              This chart focuses on delivered work only (status-filtered).
            </Typography>
          )}
          
          
        </Box>

        {/* Debug Data Viewer */}
        <DebugDataViewer 
          developerData={developerData}
          selectedDeveloper={selectedDeveloper}
          filteredData={filteredData}
          metrics={metrics}
        />
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
  }),
  filteredData: PropTypes.object  // CRITICAL: Add filteredData prop to respect filter state
}


export default EffortEffectivenessChart