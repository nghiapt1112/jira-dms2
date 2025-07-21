import React, { useMemo } from 'react'
import PropTypes from 'prop-types'
import { Box, Paper, Typography, Chip, Grid } from '@mui/material'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import { Chart } from 'react-chartjs-2'
import { AccountBox as DeveloperIcon, TrendingUp, TrendingDown, TrendingFlat } from '@mui/icons-material'
import logger from '../../../../utils/logger'

// Chart.js Matrix/Heatmap plugin
import { MatrixController, MatrixElement } from 'chartjs-chart-matrix'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  MatrixController,
  MatrixElement,
  Title,
  Tooltip,
  Legend
)

const DeveloperRootCauseAnalysis = React.memo(({ 
  data, 
  metrics, 
  title = 'Developer Root Cause Analysis', 
  height = 400 
}) => {
  // 1. Hooks first (none needed)
  
  // Helper function to normalize root cause names for consistency
  const normalizeRootCause = (text) => {
    if (!text) return text
    return text
      .replace(/\(.*?\)/g, '') // Remove anything in parentheses
      .replace(/[^\w\s]/g, '') // Remove special characters except spaces
      .trim()
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .toUpperCase() // Convert to uppercase
  }

  // Helper function to create display name (shorter for chart)
  const createDisplayName = (text, maxLength = 20) => {
    if (!text) return text
    
    // Common abbreviations for frequent root causes (updated with more specific mappings)
    const commonAbbreviations = {
      'IMPLEMENTATION_ISSUE': 'IMPL_ISSUE',
      'USER_INPUT_VALIDATION_FAILURE': 'INPUT_VALID',
      'INADEQUATE_REQUIREMENTS_ANALYSIS': 'REQ_ANALYSIS',
      'INFRASTRUCTURE_OR_DEPLOYMENT_ISSUES': 'INFRA_DEPLOY',
      'VERSION_CONTROL_MISMANAGEMENT': 'VERSION_CTRL',
      'RELEASE_CODE_MERGE_ISSUE': 'MERGE_ISSUE',
      'CHANGE_IN_REQUIREMENTS': 'REQ_CHANGE',
      'CHANGE_IN_DESIGN': 'DESIGN_CHG',
      'TOOL_OR_AUTOMATION_ISSUE': 'TOOL_AUTO',
      'INSUFFICIENT_TESTING': 'INSUFF_TEST',
      'COMMUNICATION_GAPS': 'COMM_GAPS',
      'CUSTOMER_PERSPECTIVE': 'CUSTOMER',
      'CONCURRENCY_ISSUE': 'CONCURRENCY',
      'ENVIRONMENT_ISSUE': 'ENV_ISSUE',
      'DATA_MIGRATION': 'DATA_MIGR',
      'TEST_DATA_ISSUE': 'TEST_DATA',
      'PROCESS_GAPS': 'PROC_GAPS',
      'MISSED_REQUIREMENT': 'MISSED_REQ',
      'THIRD_PARTY_ISSUE': 'THIRD_PARTY',
      'LEGACY_CODE': 'LEGACY',
      'HUMAN_ERROR': 'HUMAN_ERR',
      'OTHER_IF_OTHER_PLEASE_DECRIBE_IN_THE_ROOT_CAUSE_TEXT_BOX': 'OTHER',
      'OTHER': 'OTHER'
    }
    
    // First normalize
    const normalized = normalizeRootCause(text)
    
    // Check if we have a predefined abbreviation
    if (commonAbbreviations[normalized]) {
      return commonAbbreviations[normalized]
    }
    
    if (normalized.length <= maxLength) {
      return normalized
    }
    
    // Smart abbreviation: take first letters of words + some chars
    const words = normalized.split('_')
    if (words.length > 1) {
      // Multi-word: use first 3-4 chars of each word depending on word count
      const charsPerWord = Math.max(3, Math.floor(maxLength / words.length))
      return words.map(word => word.substring(0, charsPerWord)).join('_')
    } else {
      // Single word: use first chars
      return normalized.substring(0, maxLength)
    }
  }

  // Helper function to truncate long root cause names  
  const truncateText = (text, maxLength = 15) => {
    if (!text) return text
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
  }

  // 2. Memoized values
  const chartData = useMemo(() => {
    logger.heatmap('HEATMAP', 'Input data received', {
      hasData: !!data,
      dataKeys: data ? Object.keys(data) : null,
      hasDataArray: !!data?.data,
      dataLength: data?.data?.length,
      dataType: Array.isArray(data?.data) ? 'array' : typeof data?.data,
      firstItem: data?.data?.[0],
      allData: data?.data
    })
    
    if (!data || !data.data || data.data.length === 0) {
      logger.heatmap('HEATMAP', 'No valid data found, should use mock data')
      return null
    }
    
    // Handle both data formats: { data: [...] } and direct array
    const actualData = data.data || data
    
    // Create mapping from original to normalized root cause names
    const rootCauseMapping = new Map()
    const normalizedData = []
    
    // First pass: normalize the data and build mapping
    actualData.forEach(item => {
      const normalizedItem = { developer: item.developer }
      
      Object.keys(item).forEach(key => {
        if (key !== 'developer') {
          const normalizedKey = normalizeRootCause(key)
          rootCauseMapping.set(normalizedKey, key) // Store original name for tooltips
          
          // Aggregate values for the same normalized key
          if (normalizedItem[normalizedKey]) {
            normalizedItem[normalizedKey] += item[key] || 0
          } else {
            normalizedItem[normalizedKey] = item[key] || 0
          }
        }
      })
      
      normalizedData.push(normalizedItem)
    })
    
    logger.heatmap('HEATMAP', 'Root cause mapping', {
      originalCount: new Set(actualData.flatMap(item => Object.keys(item).filter(k => k !== 'developer'))).size,
      normalizedCount: rootCauseMapping.size,
      mappingPreview: Array.from(rootCauseMapping.entries()).slice(0, 10).map(([norm, orig]) => ({
        original: orig,
        normalized: norm,
        displayName: createDisplayName(norm)
      })),
      sampleNormalizedData: normalizedData[0]
    })
    
    // Extract all unique normalized root cause categories
    const categories = new Set()
    normalizedData.forEach(item => {
      Object.keys(item).forEach(key => {
        if (key !== 'developer') {
          categories.add(key)
        }
      })
    })
    
    const categoryArray = Array.from(categories).sort()
    const developers = normalizedData.map(item => item.developer)
    
    logger.heatmap('HEATMAP', 'Extracted data', {
      categories: categoryArray,
      developers: developers,
      categoriesCount: categoryArray.length,
      developersCount: developers.length
    })
    
    // Create heatmap data points (X=categories, Y=developers)
    const matrixData = []
    let maxValue = 0
    
    categoryArray.forEach((category, catIndex) => {
      developers.forEach((developer, devIndex) => {
        const developerData = normalizedData.find(item => item.developer === developer)
        const value = developerData?.[category] || 0
        maxValue = Math.max(maxValue, value)
        matrixData.push({
          x: catIndex,    // X-axis: categories (root causes)
          y: devIndex,    // Y-axis: developers
          v: value,
          category: category,
          normalizedCategory: category,
          originalCategory: rootCauseMapping.get(category) || category,
          developer: developer
        })
      })
    })

    
    // Create color scale function
    const getColorForValue = (value, max) => {
      if (value === 0) return 'rgba(240, 240, 240, 0.8)' // Light grey for no issues
      if (max === 0) return 'rgba(240, 240, 240, 0.8)'   // Handle edge case
      const intensity = value / max
      if (intensity <= 0.2) return 'rgba(76, 175, 80, 0.6)'   // Light green
      if (intensity <= 0.4) return 'rgba(255, 235, 59, 0.8)'  // Yellow  
      if (intensity <= 0.6) return 'rgba(255, 152, 0, 0.8)'   // Orange
      if (intensity <= 0.8) return 'rgba(244, 67, 54, 0.8)'   // Red
      return 'rgba(183, 28, 28, 0.9)'                         // Dark red
    }
    
    return {
      labels: categoryArray.map(cat => createDisplayName(cat, 20)), // X-axis labels (clean, short names)
      datasets: [{
        label: 'Root Cause Issues',
        data: matrixData,
        backgroundColor: (context) => {
          if (!context.parsed) return 'rgba(240, 240, 240, 0.8)'
          const value = context.parsed.v || 0
          return getColorForValue(value, maxValue)
        },
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        width: ({chart}) => (chart.chartArea || {}).width / categoryArray.length * 0.9,
        height: ({chart}) => (chart.chartArea || {}).height / developers.length * 0.9
      }],
      // Store mapping for tooltips
      _rootCauseMapping: rootCauseMapping
    }
  }, [data])
  
  const chartOptions = useMemo(() => {
    if (!data || !data.data || data.data.length === 0) return {}
    
    // Extract categories and developers for axis labels
    const categories = new Set()
    data.data.forEach(item => {
      Object.keys(item).forEach(key => {
        if (key !== 'developer') {
          categories.add(key)
        }
      })
    })
    const categoryArray = Array.from(categories).sort()
    const developers = data.data.map(item => item.developer)
    
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false // Hide legend for heatmap
        },
        title: {
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
              const point = context[0]
              const dataPoint = point.dataset.data[point.dataIndex]
              const category = dataPoint?.category || categoryArray[point.parsed.x] || 'Unknown'
              const developer = dataPoint?.developer || developers[point.parsed.y] || 'Unknown'
              return `${developer} - ${category}`
            },
            label: function(context) {
              const value = context.parsed.v || 0
              return `${value} issue${value !== 1 ? 's' : ''}`
            },
            afterLabel: function(context) {
              const value = context.parsed.v || 0
              if (value === 0) return 'No issues found'
              if (value <= 2) return 'Low impact'
              if (value <= 5) return 'Moderate impact'
              if (value <= 10) return 'High impact'
              return 'Critical - needs attention'
            }
          }
        }
      },
      scales: {
        x: {
          type: 'linear',
          position: 'bottom',
          min: -0.5,
          max: categoryArray.length - 0.5,
          title: {
            display: true,
            text: 'Root Cause Categories',
            font: {
              size: 12,
              weight: 'bold'
            }
          },
          ticks: {
            stepSize: 1,
            callback: function(value) {
              const category = categoryArray[Math.round(value)]
              return category ? createDisplayName(category, 20) : ''
            },
            maxRotation: 90,
            minRotation: 45,
            font: {
              size: 10
            }
          },
          grid: {
            display: false
          }
        },
        y: {
          type: 'linear',
          min: -0.5,
          max: developers.length - 0.5,
          title: {
            display: true,
            text: 'Developers',
            font: {
              size: 12,
              weight: 'bold'
            }
          },
          ticks: {
            stepSize: 1,
            callback: function(value) {
              return developers[Math.round(value)] || ''
            },
            font: {
              size: 9
            }
          },
          grid: {
            display: false
          }
        }
      }
    }
  }, [data])
  
  const topDevelopers = useMemo(() => {
    if (!data || !data.data) return []
    
    return data.data
      .map(item => {
        const total = Object.keys(item)
          .filter(key => key !== 'developer')
          .reduce((sum, key) => sum + (item[key] || 0), 0)
        return { developer: item.developer, total }
      })
      .sort((a, b) => b.total - a.total)
      .slice(0, 3)
  }, [data])
  
  const getTrendIcon = useMemo(() => (trend) => {
    switch (trend) {
      case 'increasing':
        return <TrendingUp sx={{ fontSize: 16, color: 'error.main' }} />
      case 'decreasing':
        return <TrendingDown sx={{ fontSize: 16, color: 'success.main' }} />
      default:
        return <TrendingFlat sx={{ fontSize: 16, color: 'text.secondary' }} />
    }
  }, [])
  
  // 3. Callbacks (none needed)
  

  
  // Check if we have meaningful root cause data
  const hasRealRootCauseData = data?.data && Array.isArray(data.data) && data.data.length > 0 && 
    data.data.some(item => {
      // Check if any developer has root cause data (fields other than 'developer')
      const nonDeveloperKeys = Object.keys(item).filter(key => key !== 'developer')
      const hasNonZeroValues = nonDeveloperKeys.some(key => item[key] > 0)

      return hasNonZeroValues
    })

  
  // Also check if data is directly an array (alternative format)
  const isDirectArray = Array.isArray(data) && data.length > 0
  const hasRealDataInArray = isDirectArray && data.some(item => {
    const nonDeveloperKeys = Object.keys(item).filter(key => key !== 'developer')
    return nonDeveloperKeys.some(key => item[key] > 0)
  })


  // Use mock data if no real root cause data is available
  if (!hasRealRootCauseData && !hasRealDataInArray) {

    // Create mock data for demonstration purposes when no real root cause data exists
    const mockData = {
      data: [
        { developer: "Imamul Akhyar", "Communication Gaps": 4, "Implementation Issue": 3, "User Input Validation Failure": 2, "Legacy Code": 1 },
        { developer: "Manh Nguyen", "Third-Party Issue": 5, "Environment Issue": 3, "Change in Design": 2, "Implementation Issue": 1 },
        { developer: "Renal Apriansyah", "Legacy Code": 6, "Infrastructure or Deployment Issues": 4, "Communication Gaps": 2, "Customer Perspective": 1 },
        { developer: "Henry Phung", "User Input Validation Failure": 3, "Implementation Issue": 2, "Environment Issue": 2, "Third-Party Issue": 1 },
        { developer: "Duy Tang", "Change in Design": 4, "Communication Gaps": 3, "Legacy Code": 2, "Implementation Issue": 1 },
        { developer: "Ahmad Alfan", "Infrastructure or Deployment Issues": 3, "Third-Party Issue": 2, "Environment Issue": 2, "Customer Perspective": 1 },
        { developer: "Thanh Hoang", "Implementation Issue": 5, "User Input Validation Failure": 3, "Communication Gaps": 2, "Legacy Code": 1 },
        { developer: "Izal Fathoni", "Environment Issue": 4, "Change in Design": 3, "Third-Party Issue": 2, "Infrastructure or Deployment Issues": 1 }
      ]
    }
    

    // Re-run the data processing with mock data
    const mockChartData = (() => {
      const categories = new Set()
      mockData.data.forEach(item => {
        Object.keys(item).forEach(key => {
          if (key !== 'developer') {
            categories.add(key)
          }
        })
      })
      
      const categoryArray = Array.from(categories).sort()
      const developers = mockData.data.map(item => item.developer)
      
      const matrixData = []
      let maxValue = 0
      
      categoryArray.forEach((category, catIndex) => {
        developers.forEach((developer, devIndex) => {
          const developerData = mockData.data.find(item => item.developer === developer)
          const value = developerData?.[category] || 0
          maxValue = Math.max(maxValue, value)
          matrixData.push({
            x: catIndex,
            y: devIndex,
            v: value,
            category: category,
            developer: developer
          })
        })
      })
      
      const getColorForValue = (value, max) => {
        if (value === 0) return 'rgba(240, 240, 240, 0.8)'
        if (max === 0) return 'rgba(240, 240, 240, 0.8)'
        const intensity = value / max
        if (intensity <= 0.2) return 'rgba(76, 175, 80, 0.6)'
        if (intensity <= 0.4) return 'rgba(255, 235, 59, 0.8)'
        if (intensity <= 0.6) return 'rgba(255, 152, 0, 0.8)'
        if (intensity <= 0.8) return 'rgba(244, 67, 54, 0.8)'
        return 'rgba(183, 28, 28, 0.9)'
      }
      
      return {
        labels: categoryArray.map(cat => createDisplayName(cat, 20)),
        datasets: [{
          label: 'Root Cause Issues',
          data: matrixData,
          backgroundColor: (context) => {
            if (!context.parsed) return 'rgba(240, 240, 240, 0.8)'
            const value = context.parsed.v || 0
            return getColorForValue(value, maxValue)
          },
          borderColor: 'rgba(255, 255, 255, 0.2)',
          borderWidth: 1,
          width: ({chart}) => (chart.chartArea || {}).width / categoryArray.length * 0.9,
          height: ({chart}) => (chart.chartArea || {}).height / developers.length * 0.9
        }]
      }
    })()

    // Process mock chart options
    const mockChartOptions = (() => {
      const categories = new Set()
      mockData.data.forEach(item => {
        Object.keys(item).forEach(key => {
          if (key !== 'developer') {
            categories.add(key)
          }
        })
      })
      const categoryArray = Array.from(categories).sort()
      const developers = mockData.data.map(item => item.developer)
      
      return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          title: { display: false },
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
                const point = context[0]
                const dataPoint = point.dataset.data[point.dataIndex]
                const developer = dataPoint?.developer || developers[point.parsed.y] || 'Unknown'
                // Use original category name for tooltip
                const originalCategory = dataPoint?.originalCategory || categoryArray[point.parsed.x] || 'Unknown'
                return `${developer} - ${originalCategory}`
              },
              label: function(context) {
                const value = context.parsed.v || 0
                return `${value} issue${value !== 1 ? 's' : ''}`
              },
              afterLabel: function(context) {
                const value = context.parsed.v || 0
                if (value === 0) return 'No issues found'
                if (value <= 2) return 'Low impact'
                if (value <= 5) return 'Moderate impact'
                if (value <= 10) return 'High impact'
                return 'Critical - needs attention'
              }
            }
          }
        },
        scales: {
          x: {
            type: 'linear',
            position: 'bottom',
            min: -0.5,
            max: categoryArray.length - 0.5,
            title: {
              display: true,
              text: 'Root Cause Categories',
              font: { size: 12, weight: 'bold' }
            },
            ticks: {
              stepSize: 1,
              callback: function(value) {
                const category = categoryArray[Math.round(value)]
                return category ? createDisplayName(category, 20) : ''
              },
              maxRotation: 90,
              minRotation: 45,
              font: { size: 10 }
            },
            grid: { display: false }
          },
          y: {
            type: 'linear',
            min: -0.5,
            max: developers.length - 0.5,
            title: {
              display: true,
              text: 'Developers',
              font: { size: 12, weight: 'bold' }
            },
            ticks: {
              stepSize: 1,
              callback: function(value) {
                return developers[Math.round(value)] || ''
              },
              font: { size: 9 }
            },
            grid: { display: false }
          }
        }
      }
    })()
    
    return (
      <Paper 
        elevation={1} 
        sx={{ 
          p: { xs: 1, sm: 2 }, 
          width: '100%',
          backgroundColor: 'background.paper'
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          mb: { xs: 1, sm: 2 } 
        }}>
          <DeveloperIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography 
            variant="h6"
            sx={{ 
              fontSize: { xs: '1rem', sm: '1.25rem' }
            }}
          >
            {title} (Demo Data)
          </Typography>
        </Box>
        
        <Box sx={{ 
          height: { xs: 300, sm: height },
          width: '100%',
          mb: { xs: 1, sm: 2 }
        }}>
          <Chart 
            type="matrix"
            data={mockChartData}
            options={mockChartOptions}
            height={height}
          />
        </Box>
        
        {/* Usage Instructions & Color Legend */}
        <Box sx={{ 
          mb: { xs: 1, sm: 2 },
          p: 1,
          bgcolor: 'rgba(0, 0, 0, 0.02)',
          borderRadius: 1
        }}>
          <Typography variant="body2" sx={{ mb: 1, fontWeight: 'medium', fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
            💡 Demo Mode: X-axis shows root causes (truncated), Y-axis shows developers. Hover over cells for details.
          </Typography>
          <Typography variant="body2" sx={{ mb: 1, fontWeight: 'medium', fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
            Issue Intensity Scale:
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ width: 16, height: 16, bgcolor: 'rgba(240, 240, 240, 0.8)', border: '1px solid #ccc' }} />
              <Typography variant="caption" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>None</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ width: 16, height: 16, bgcolor: 'rgba(76, 175, 80, 0.6)' }} />
              <Typography variant="caption" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>Low (1-2)</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ width: 16, height: 16, bgcolor: 'rgba(255, 235, 59, 0.8)' }} />
              <Typography variant="caption" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>Moderate (3-5)</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ width: 16, height: 16, bgcolor: 'rgba(255, 152, 0, 0.8)' }} />
              <Typography variant="caption" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>High (6-10)</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ width: 16, height: 16, bgcolor: 'rgba(244, 67, 54, 0.8)' }} />
              <Typography variant="caption" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>Critical (11+)</Typography>
            </Box>
          </Box>
        </Box>
        
        <Grid container spacing={{ xs: 1, sm: 2 }}>
          {/* Top Developers */}
          <Grid item xs={12} sm={6}>
            <Typography 
              variant="subtitle2" 
              gutterBottom
              sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
            >
              Most Issues by Developer
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              <Chip label="Imamul Akhyar (10)" size="small" variant="outlined" color="primary" />
              <Chip label="Renal Apriansyah (13)" size="small" variant="outlined" color="primary" />
              <Chip label="Thanh Hoang (11)" size="small" variant="outlined" color="primary" />
            </Box>
          </Grid>
          
          {/* Category Trends */}
          <Grid item xs={12} sm={6}>
            <Typography 
              variant="subtitle2" 
              gutterBottom
              sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
            >
              Category Trends
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUp sx={{ fontSize: 16, color: 'error.main' }} />
                <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                  Implementation Issue: increasing
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingFlat sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                  Communication Gaps: stable
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingDown sx={{ fontSize: 16, color: 'success.main' }} />
                <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                  Legacy Code: decreasing
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
        
        {/* Summary Statistics */}
        <Box sx={{ 
          mt: { xs: 1, sm: 2 },
          pt: { xs: 1, sm: 2 },
          borderTop: 1,
          borderColor: 'divider',
          display: 'flex',
          flexWrap: 'wrap',
          gap: { xs: 1, sm: 2 }
        }}>
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
          >
            Total Developers: 8 (Demo)
          </Typography>
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
          >
            Total Issues: 80 (Demo)
          </Typography>
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
          >
            Categories: 8 (Demo)
          </Typography>
        </Box>
      </Paper>
    )
  }
  
  // 5. Render
  return (
    <Paper 
      elevation={1} 
      sx={{ 
        p: { xs: 1, sm: 2 }, 
        width: '100%',
        backgroundColor: 'background.paper'
      }}
    >
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        mb: { xs: 1, sm: 2 } 
      }}>
        <DeveloperIcon sx={{ mr: 1, color: 'primary.main' }} />
        <Typography 
          variant="h6"
          sx={{ 
            fontSize: { xs: '1rem', sm: '1.25rem' }
          }}
        >
          {title}
        </Typography>
      </Box>
      
      <Box sx={{ 
        height: { xs: 300, sm: height },
        width: '100%',
        mb: { xs: 1, sm: 2 }
      }}>
        <Chart 
          type="matrix"
          data={chartData}
          options={chartOptions}
          height={height}
        />
      </Box>
      
      {/* Usage Instructions & Color Legend */}
      <Box sx={{ 
        mb: { xs: 1, sm: 2 },
        p: 1,
        bgcolor: 'rgba(0, 0, 0, 0.02)',
        borderRadius: 1
      }}>
        <Typography variant="body2" sx={{ mb: 1, fontWeight: 'medium', fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
          💡 Heatmap Guide: X-axis shows root causes (truncated), Y-axis shows developers. Hover over cells for details.
        </Typography>
        <Typography variant="body2" sx={{ mb: 1, fontWeight: 'medium', fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
          Issue Intensity Scale:
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 16, height: 16, bgcolor: 'rgba(240, 240, 240, 0.8)', border: '1px solid #ccc' }} />
            <Typography variant="caption" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>None</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 16, height: 16, bgcolor: 'rgba(76, 175, 80, 0.6)' }} />
            <Typography variant="caption" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>Low (1-2)</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 16, height: 16, bgcolor: 'rgba(255, 235, 59, 0.8)' }} />
            <Typography variant="caption" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>Moderate (3-5)</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 16, height: 16, bgcolor: 'rgba(255, 152, 0, 0.8)' }} />
            <Typography variant="caption" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>High (6-10)</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 16, height: 16, bgcolor: 'rgba(244, 67, 54, 0.8)' }} />
            <Typography variant="caption" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>Critical (11+)</Typography>
          </Box>
        </Box>
      </Box>
      
      <Grid container spacing={{ xs: 1, sm: 2 }}>
        {/* Top Developers */}
        <Grid item xs={12} sm={6}>
          <Typography 
            variant="subtitle2" 
            gutterBottom
            sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
          >
            Most Issues by Developer
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {topDevelopers.map(({ developer, total }) => (
              <Chip
                key={developer}
                label={`${developer} (${total})`}
                size="small"
                variant="outlined"
                color="primary"
              />
            ))}
          </Box>
        </Grid>
        
        {/* Category Trends */}
        <Grid item xs={12} sm={6}>
          <Typography 
            variant="subtitle2" 
            gutterBottom
            sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
          >
            Category Trends
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {Object.entries(metrics.trends || {}).slice(0, 3).map(([category, trend]) => (
              <Box 
                key={category} 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1 
                }}
              >
                {getTrendIcon(trend)}
                <Typography 
                  variant="body2" 
                  sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                >
                  {category}: {trend}
                </Typography>
              </Box>
            ))}
          </Box>
        </Grid>
      </Grid>
      
      {/* Summary Statistics */}
      <Box sx={{ 
        mt: { xs: 1, sm: 2 },
        pt: { xs: 1, sm: 2 },
        borderTop: 1,
        borderColor: 'divider',
        display: 'flex',
        flexWrap: 'wrap',
        gap: { xs: 1, sm: 2 }
      }}>
        <Typography 
          variant="body2" 
          color="text.secondary"
          sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
        >
          Total Developers: {data.data.length}
        </Typography>
        <Typography 
          variant="body2" 
          color="text.secondary"
          sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
        >
          Total Issues: {data.data.reduce((sum, item) => {
            return sum + Object.keys(item)
              .filter(key => key !== 'developer')
              .reduce((itemSum, key) => itemSum + (item[key] || 0), 0)
          }, 0)}
        </Typography>
        <Typography 
          variant="body2" 
          color="text.secondary"
          sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
        >
          Categories: {(() => {
            const categories = new Set()
            data.data.forEach(item => {
              Object.keys(item).forEach(key => {
                if (key !== 'developer') {
                  categories.add(key)
                }
              })
            })
            return categories.size
          })()}
        </Typography>
      </Box>
    </Paper>
  )
})

// ✅ REQUIRED: PropTypes
DeveloperRootCauseAnalysis.propTypes = {
  data: PropTypes.shape({
    data: PropTypes.arrayOf(PropTypes.object)
  }),
  metrics: PropTypes.shape({
    trends: PropTypes.object
  }),
  title: PropTypes.string,
  height: PropTypes.number
}

export default DeveloperRootCauseAnalysis 