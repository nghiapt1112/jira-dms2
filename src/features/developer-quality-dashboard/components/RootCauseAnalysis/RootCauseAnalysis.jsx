import React, { useMemo } from 'react'
import PropTypes from 'prop-types'
import { Box, Paper, Typography, Chip, List, ListItem, ListItemText } from '@mui/material'
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
import { Psychology, TrendingUp, TrendingDown, TrendingFlat } from '@mui/icons-material'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

const RootCauseAnalysis = React.memo(({ 
  data, 
  metrics, 
  title = 'Root Cause Analysis', 
  height = 400 
}) => {
  // 1. Hooks first (none needed)
  
  // 2. Memoized values
  const chartData = useMemo(() => {

    if (!data || !data.data || data.data.length === 0) return null
    
    // Color palette for root causes - using semantic colors
    const getColorForCategory = (category, value, maxValue) => {
      const intensity = maxValue > 0 ? value / maxValue : 0
      
      // Base colors for different root cause types
      const categoryColors = {
        'Implementation': '#1976d2',    // Blue
        'Requirements': '#2e7d32',      // Green
        'Testing': '#ed6c02',           // Orange
        'Environment': '#9c27b0',       // Purple
        'Communication': '#dc004e',     // Pink
        'Process': '#795548',           // Brown
        'Legacy': '#607d8b',            // Blue Grey
        'Human': '#ff5722',             // Deep Orange
        'Other': '#757575'              // Grey
      }
      
      // Try to match category to color based on keywords
      let baseColor = '#1976d2' // Default blue
      for (const [key, color] of Object.entries(categoryColors)) {
        if (category.toLowerCase().includes(key.toLowerCase())) {
          baseColor = color
          break
        }
      }
      
      // Adjust opacity based on value intensity
      const alpha = Math.max(0.6, intensity)
      const hex = baseColor.replace('#', '')
      const r = parseInt(hex.substr(0, 2), 16)
      const g = parseInt(hex.substr(2, 2), 16)
      const b = parseInt(hex.substr(4, 2), 16)
      
      return `rgba(${r}, ${g}, ${b}, ${alpha})`
    }

    const maxValue = Math.max(...data.data.map(item => item.value))
    
    // Sort data by value for better visualization
    const sortedData = [...data.data].sort((a, b) => b.value - a.value)

    // Calculate total for percentage calculation
    const totalIssues = sortedData.reduce((sum, item) => sum + item.value, 0)
    
    // Transform data for horizontal bar chart
    const labels = sortedData.map(item => item.name)
    const values = sortedData.map(item => totalIssues > 0 ? (item.value / totalIssues * 100) : 0)
    const backgroundColors = sortedData.map(item => getColorForCategory(item.name, item.value, maxValue))

    return {
      labels: labels,
      datasets: [{
        label: 'Percentage',
        data: values,
        backgroundColor: backgroundColors,
        borderColor: backgroundColors.map(color => color.replace(/rgba\(([^)]+),\s*[\d.]+\)/, 'rgb($1)')),
        borderWidth: 1,
        borderRadius: 4,
        // Store original data for tooltips
        _originalData: sortedData
      }]
    }
  }, [data])
  
  const chartOptions = useMemo(() => ({
    indexAxis: 'y', // Horizontal bar chart
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: false
      },
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        cornerRadius: 6,
        displayColors: false,
        callbacks: {
          title: function(context) {
            return context[0]?.label || 'Unknown Category'
          },
          label: function(context) {
            const percentage = context.parsed?.x || context.raw || 0
            const dataset = context.dataset
            const originalData = dataset._originalData?.[context.dataIndex]
            const issueCount = originalData?.value || 0
            
            return [
              `Percentage: ${percentage.toFixed(1)}%`,
              `Issues: ${issueCount}`
            ]
          },
          afterLabel: function(context) {
            const percentage = context.parsed?.x || context.raw || 0
            if (percentage === 0) return 'No issues found'
            if (percentage <= 10) return 'Low priority'
            if (percentage <= 25) return 'Moderate priority'
            if (percentage <= 50) return 'High priority'
            return 'Critical - needs immediate attention'
          }
        }
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Percentage (%)',
          font: {
            size: 12,
            weight: 'bold'
          }
        },
        ticks: {
          callback: function(value) {
            return value.toFixed(1) + '%'
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        }
      },
      y: {
        title: {
          display: true,
          text: 'Root Cause Categories',
          font: {
            size: 12,
            weight: 'bold'
          }
        },
        ticks: {
          maxTicksLimit: 10, // Limit number of categories shown
          font: {
            size: 10
          },
          callback: function(value, index) {
            const label = this.getLabelForValue(value)
            // Truncate long labels
            return label.length > 25 ? label.substring(0, 22) + '...' : label
          }
        },
        grid: {
          display: false
        }
      }
    }
  }), [])
  
  const getTrendIcon = (trend) => {
    switch (trend?.toLowerCase()) {
      case 'increasing':
        return <TrendingUp sx={{ fontSize: 16 }} />
      case 'decreasing':
        return <TrendingDown sx={{ fontSize: 16 }} />
      default:
        return <TrendingFlat sx={{ fontSize: 16 }} />
    }
  }
  
  const getTrendColor = (trend) => {
    switch (trend?.toLowerCase()) {
      case 'increasing':
        return 'error.main'
      case 'decreasing':
        return 'success.main'
      default:
        return 'warning.main'
    }
  }
  
  const categoryTrends = useMemo(() => {
    if (!metrics?.trends) return []
    
    return Object.entries(metrics.trends).map(([category, trend]) => ({
      category,
      trend,
      icon: getTrendIcon(trend),
      color: getTrendColor(trend)
    }))
  }, [metrics?.trends])
  
  const topCategories = useMemo(() => {
    if (!metrics?.categories) return []
    
    return Object.entries(metrics.categories)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([category, count]) => ({
        category,
        count,
        percentage: Object.values(metrics.categories).reduce((sum, c) => sum + c, 0) > 0 
          ? (count / Object.values(metrics.categories).reduce((sum, c) => sum + c, 0) * 100)
          : 0
      }))
  }, [metrics?.categories])
  
  // 3. Callbacks (none needed)
  
  // 4. Early returns
  if (!chartData || !chartData.datasets || !metrics) {
    return (
      <Paper 
        elevation={1} 
        sx={{ 
          p: { xs: 2, sm: 3 }, 
          width: '100%',
          backgroundColor: 'background.paper'
        }}
      >
        <Typography variant="h6" color="text.secondary">
          {title} - No Data Available
        </Typography>
      </Paper>
    )
  }
  
  // 5. Render
  return (
    <Paper 
      elevation={1} 
      sx={{ 
        p: { xs: 2, sm: 3 }, 
        width: '100%',
        backgroundColor: 'background.paper'
      }}
    >
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1,
        mb: { xs: 2, sm: 3 }
      }}>
        <Psychology sx={{ fontSize: 20, color: 'primary.main' }} />
        <Typography 
          variant="h6" 
          sx={{ 
            fontSize: { xs: '1rem', sm: '1.25rem' },
            fontWeight: 600
          }}
        >
          {title}
        </Typography>
      </Box>
      
      {/* Chart */}
      <Box sx={{ 
        height: { xs: Math.min(height, 300), sm: height },
        width: '100%',
        mb: { xs: 2, sm: 3 }
      }}>
        {chartData && chartData.datasets && chartData.datasets[0]?.data?.length > 0 ? (
          <Bar 
            data={chartData}
            options={chartOptions}
          />
        ) : (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            height: '100%',
            backgroundColor: 'grey.50',
            borderRadius: 1
          }}>
            <Typography variant="body2" color="text.secondary">
              Root Cause chart loading... (Check console for errors)
            </Typography>
          </Box>
        )}
      </Box>
      
      {/* Chart Guide */}
      <Box sx={{ 
        mb: { xs: 2, sm: 3 },
        p: 1.5,
        bgcolor: 'rgba(0, 0, 0, 0.02)',
        borderRadius: 1
      }}>
      </Box>
      
      {/* Total Issues Summary */}
      <Box sx={{ 
        mt: { xs: 2, sm: 3 },
        pt: { xs: 2, sm: 3 },
        borderTop: 1,
        borderColor: 'divider',
        textAlign: 'center'
      }}>
        <Typography 
          variant="h4"
          sx={{ 
            fontSize: { xs: '1.5rem', sm: '2rem' },
            fontWeight: 600,
            color: 'primary.main'
          }}
        >
          {Object.values(metrics.categories || {}).reduce((sum, count) => sum + count, 0).toLocaleString()}
        </Typography>
        <Typography 
          variant="body2" 
          color="text.secondary"
          sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
        >
          Total Issues Analyzed
        </Typography>
      </Box>
    </Paper>
  )
})

// ✅ REQUIRED: PropTypes
RootCauseAnalysis.propTypes = {
  data: PropTypes.shape({
    data: PropTypes.arrayOf(PropTypes.shape({
      name: PropTypes.string.isRequired,
      value: PropTypes.number.isRequired,
      percentage: PropTypes.number.isRequired
    }))
  }),
  metrics: PropTypes.shape({
    categories: PropTypes.objectOf(PropTypes.number),
    trends: PropTypes.objectOf(PropTypes.string)
  }),
  title: PropTypes.string,
  height: PropTypes.number
}

export default RootCauseAnalysis 