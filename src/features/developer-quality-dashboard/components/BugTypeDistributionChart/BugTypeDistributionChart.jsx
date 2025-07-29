import React, { useMemo } from 'react'
import PropTypes from 'prop-types'
import { Box, Typography, Paper } from '@mui/material'
import { Pie } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend)

const BugTypeDistributionChart = React.memo(({ 
  bugTypeData, 
  title = 'Bug Type Distribution',
  height = 400,
  showLegend = true,
  onChartClick = null
}) => {
  // Chart data preprocessing with memoization for performance
  const chartData = useMemo(() => {
    if (!bugTypeData || !bugTypeData.bugTypes) {
      return { labels: [], datasets: [] }
    }

    const bugTypes = Object.entries(bugTypeData.bugTypes)
      .filter(([_, data]) => data.count > 0)
      .sort(([, a], [, b]) => b.count - a.count)

    if (bugTypes.length === 0) {
      return { labels: [], datasets: [] }
    }

    return {
      labels: bugTypes.map(([bugType]) => bugType),
      datasets: [{
        label: 'Bug Count',
        data: bugTypes.map(([_, data]) => data.count),
        backgroundColor: getBugTypeColors(bugTypes.map(([bugType]) => bugType)),
        borderColor: '#ffffff',
        borderWidth: 2,
        hoverBorderWidth: 3,
        hoverBackgroundColor: getBugTypeColors(bugTypes.map(([bugType]) => bugType)).map(color => 
          // Slightly lighter on hover
          color.replace(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/, (match, r, g, b) => 
            `rgba(${Math.min(255, parseInt(r) + 20)}, ${Math.min(255, parseInt(g) + 20)}, ${Math.min(255, parseInt(b) + 20)}, 0.9)`
          )
        )
      }]
    }
  }, [bugTypeData])

  // Chart options with memoization
  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: showLegend,
        position: 'right',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12
          },
          generateLabels: (chart) => {
            const data = chart.data
            return data.labels.map((label, i) => {
              const dataset = data.datasets[0]
              const count = dataset.data[i]
              const percentage = bugTypeData.totalBugs > 0 
                ? ((count / bugTypeData.totalBugs) * 100).toFixed(1)
                : '0.0'
                
              return {
                text: `${label}: ${count} (${percentage}%)`,
                fillStyle: dataset.backgroundColor[i],
                strokeStyle: dataset.borderColor,
                lineWidth: dataset.borderWidth,
                hidden: false,
                index: i
              }
            })
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        callbacks: {
          title: (context) => {
            return `Bug Type: ${context[0].label}`
          },
          label: (context) => {
            const label = context.label || ''
            const count = context.parsed || 0
            const percentage = bugTypeData.totalBugs > 0 
              ? ((count / bugTypeData.totalBugs) * 100).toFixed(1)
              : '0.0'
            return [
              `Count: ${count} bugs`,
              `Percentage: ${percentage}%`
            ]
          }
        }
      }
    },
    onClick: onChartClick,
    // Performance optimizations
    animation: {
      duration: 1000
    },
    elements: {
      arc: {
        borderAlign: 'center'
      }
    }
  }), [bugTypeData, showLegend, onChartClick])

  // Loading state
  if (!bugTypeData) {
    return (
      <Paper elevation={1} sx={{ p: 2, height }}>
        <Typography variant="h6" sx={{ mb: 2 }}>{title}</Typography>
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            height: height - 100 
          }}
        >
          <Typography variant="body2" color="textSecondary">
            Loading bug type data...
          </Typography>
        </Box>
      </Paper>
    )
  }

  // Empty state
  if (!bugTypeData.bugTypes || bugTypeData.totalBugs === 0) {
    return (
      <Paper elevation={1} sx={{ p: 2, height }}>
        <Typography variant="h6" sx={{ mb: 2 }}>{title}</Typography>
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center', 
            justifyContent: 'center', 
            height: height - 100 
          }}
        >
          <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
            No bug type data available
          </Typography>
          <Typography variant="caption" color="textSecondary">
            Bug types will appear here when bug data is processed
          </Typography>
        </Box>
      </Paper>
    )
  }

  return (
    <Paper 
      elevation={1} 
      sx={{ 
        p: 2, 
        height,
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Typography variant="h6" sx={{ mb: 2, flexShrink: 0 }}>
        {title}
        <Typography 
          component="span" 
          variant="body2" 
          color="textSecondary" 
          sx={{ ml: 1 }}
        >
          ({bugTypeData.totalBugs} total bug{bugTypeData.totalBugs !== 1 ? 's' : ''})
        </Typography>
      </Typography>
      
      <Box sx={{ 
        flex: 1, 
        minHeight: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Pie data={chartData} options={chartOptions} />
      </Box>
    </Paper>
  )
})

// Bug type color mapping following the service layer color scheme
const getBugTypeColors = (bugTypes) => {
  const colorMap = {
    'Functional': '#2196f3',    // Blue
    'UI': '#4caf50',           // Green  
    'Performance': '#ff9800',   // Orange
    'Security': '#f44336',      // Red
    'Regression': '#9c27b0',    // Purple
    'Integration': '#607d8b',   // Blue Grey
    'Unknown': '#9e9e9e'        // Grey
  }
  
  return bugTypes.map(bugType => colorMap[bugType] || '#9e9e9e')
}

BugTypeDistributionChart.propTypes = {
  bugTypeData: PropTypes.shape({
    bugTypes: PropTypes.object.isRequired,
    totalBugs: PropTypes.number.isRequired,
    metadata: PropTypes.object
  }),
  title: PropTypes.string,
  height: PropTypes.number,
  showLegend: PropTypes.bool,
  onChartClick: PropTypes.func
}

export default BugTypeDistributionChart 