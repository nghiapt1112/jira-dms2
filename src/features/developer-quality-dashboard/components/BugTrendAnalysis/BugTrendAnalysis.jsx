import React, { useMemo } from 'react'
import PropTypes from 'prop-types'
import { Box, Paper, Typography, Chip } from '@mui/material'
import { LineChart } from '@mui/x-charts/LineChart'
import { ChartJSLineChart } from '../../../../components/charts/ChartJS'
import { selectChartComponent } from '../../../../config/features'
import { transformSeriesData } from '../../../../utils/dataTransformers'
import { TrendingUp, TrendingDown, TrendingFlat, BugReport } from '@mui/icons-material'

const BugTrendAnalysis = React.memo(({ 
  data, 
  metrics, 
  title = 'Bug Trend Analysis', 
  height = 400 
}) => {
  // 1. Hooks first (none needed)
  
  // 2. Memoized values
  const useChartJS = selectChartComponent('medium') === 'chartjs'
  
  const chartData = useMemo(() => {
    console.log('🔍 BUG_TREND: Processing chart data', {
      hasData: !!data,
      dataLength: data?.data?.length || 0,
      timePeriod: data?.config?.timePeriod,
      periodKey: data?.config?.periodKey,
      sampleData: data?.data?.[0],
      allDataKeys: data?.data?.[0] ? Object.keys(data.data[0]) : [],
      fullDataSample: data?.data?.slice(0, 3), // Show more sample data
      weekFormatExists: data?.data?.[0]?._weekStartFormatted ? 'EXISTS' : 'MISSING',
      allDataItems: data?.data?.map((item, idx) => ({
        index: idx,
        week: item.week,
        month: item.month,
        quarter: item.quarter,
        period: item.period,
        periodKeyValue: item[data?.config?.periodKey || 'month'],
        _weekStartFormatted: item._weekStartFormatted,
        allKeys: Object.keys(item)
      })) || [],
      timestamp: new Date().toISOString()
    })
    
    if (!data || !data.data || data.data.length === 0) {
      console.warn('🔍 BUG_TREND: No data available', { data })
      return null
    }
    
    // Get time period from config or default to month
    const timePeriod = data.config?.timePeriod || 'month'
    const periodKey = data.config?.periodKey || 'month'
    
    console.log('🔍 BUG_TREND: Time period configuration', {
      timePeriod,
      periodKey,
      dataHasPeriodKey: data.data[0] && periodKey in data.data[0],
      availableKeys: data.data[0] ? Object.keys(data.data[0]) : [],
      periodKeyValue: data.data[0] ? data.data[0][periodKey] : 'NO_DATA',
      samplePeriodValues: data.data.slice(0, 3).map(item => item[periodKey])
    })
    
    const muiData = {
      dataset: data.data,
      series: [
        {
          dataKey: 'total',
          label: 'Total Bugs',
          color: '#dc004e',
          curve: 'linear'
        },
        {
          dataKey: 'resolved',
          label: 'Resolved',
          color: '#2e7d32',
          curve: 'linear'
        },
        {
          dataKey: 'pending',
          label: 'Pending',
          color: '#ed6c02',
          curve: 'linear'
        }
      ],
      xAxis: [{
        dataKey: periodKey,
        scaleType: 'point',
        tickLabelStyle: {
          angle: data.data.length > 6 ? -45 : 0,
          textAnchor: data.data.length > 6 ? 'end' : 'middle'
        }
      }]
    }
    
    console.log('🔍 BUG_TREND: Chart configuration prepared', {
      useChartJS,
      dataLength: data.data.length,
      seriesKeys: muiData.series.map(s => s.dataKey),
      xAxisDataKey: periodKey,
      sampleDataPoint: data.data[0],
      hasRequiredKeys: {
        total: data.data[0] && 'total' in data.data[0],
        resolved: data.data[0] && 'resolved' in data.data[0],
        pending: data.data[0] && 'pending' in data.data[0],
        periodKey: data.data[0] && periodKey in data.data[0]
      }
    })
    
    if (useChartJS) {
      // Prepare data for Chart.js transformation - ensure it has the right structure
      const chartJSData = data.data.map(item => {
        // For weekly data, prioritize the actual week field over periodKey
        let labelValue = item[periodKey]
        if (timePeriod === 'week' && item.week) {
          labelValue = item.week
        } else if (timePeriod === 'quarter' && item.quarter) {
          labelValue = item.quarter
        } else if (timePeriod === 'month' && item.month) {
          labelValue = item.month
        }
        
        return {
          ...item,
          timePeriod: labelValue, // Use the correct period value for Chart.js labels
          x: labelValue,
          label: labelValue
        }
      })
      
      // Transform data for Chart.js
      const transformedData = transformSeriesData(chartJSData, muiData.series)
      
      // Add original data reference for tooltips - attach to ALL datasets
      if (transformedData.datasets && transformedData.datasets.length > 0) {
        transformedData.datasets.forEach(dataset => {
          // Use the original data.data which should have the formatted week dates
          dataset._originalData = data.data // Use original data structure for tooltips
        })
      }
      
      console.log('🔍 BUG_TREND: ChartJS data transformed', {
        periodKey,
        originalLength: data.data.length,
        chartJSDataSample: chartJSData?.[0],
        transformedLabels: transformedData?.labels?.slice(0, 10),
        allTransformedLabels: transformedData?.labels,
        transformedDatasetsCount: transformedData?.datasets?.length,
        firstDatasetSample: transformedData?.datasets?.[0]?.data?.slice(0, 5),
        hasOriginalData: !!transformedData?.datasets?.[0]?._originalData,
        originalDataSample: data.data?.[0],
        allOriginalDataKeys: data.data?.[0] ? Object.keys(data.data[0]) : [],
        weekDataExists: data.data?.[0]?._weekStartFormatted ? 'YES' : 'NO',
        allDatasets: transformedData?.datasets?.map(d => ({
          label: d.label,
          hasOriginalData: !!d._originalData,
          originalDataLength: d._originalData?.length
        })),
        chartJSDataLabels: chartJSData.map(item => ({
          timePeriod: item.timePeriod,
          x: item.x, 
          label: item.label,
          periodKeyValue: item[periodKey],
          weekField: item.week,
          monthField: item.month,
          quarterField: item.quarter,
          allItemKeys: Object.keys(item)
        }))
      })
      return transformedData
    }
    
    console.log('🔍 BUG_TREND: Using MUI X-Charts', {
      datasetLength: muiData.dataset.length,
      seriesCount: muiData.series.length
    })
    
    return muiData
  }, [data, useChartJS])
  
  const chartConfig = useMemo(() => ({
    height: height,
    margin: { 
      top: 20, 
      right: 20, 
      bottom: data?.data?.length > 6 ? 80 : 60, 
      left: 80 
    },
    grid: { horizontal: true, vertical: true }
  }), [height, data?.data?.length])
  
  const trendIcon = useMemo(() => {
    if (!metrics?.bugTrend) return null
    
    switch (metrics.bugTrend.toLowerCase()) {
      case 'increasing':
        return <TrendingUp sx={{ fontSize: 16, color: 'error.main' }} />
      case 'decreasing':
        return <TrendingDown sx={{ fontSize: 16, color: 'success.main' }} />
      default:
        return <TrendingFlat sx={{ fontSize: 16, color: 'warning.main' }} />
    }
  }, [metrics?.bugTrend])
  
  // Helper function for severity colors (must be declared before use)
  const getSeverityColor = (severity) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 'error'
      case 'high':
        return 'warning'
      case 'medium':
        return 'info'
      case 'low':
        return 'success'
      default:
        return 'default'
    }
  }

  const severityData = useMemo(() => {
    if (!metrics?.severityDistribution) return []
    
    const distribution = metrics.severityDistribution
    const total = Object.values(distribution).reduce((sum, count) => sum + count, 0)
    
    return Object.entries(distribution).map(([severity, count]) => ({
      severity,
      count,
      percentage: total > 0 ? (count / total * 100) : 0,
      color: getSeverityColor(severity)
    }))
  }, [metrics?.severityDistribution])
  
  // 3. Callbacks (none needed)
  
  // 4. Early returns
  if (!chartData || !metrics) {
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
        justifyContent: 'space-between',
        mb: { xs: 2, sm: 3 },
        flexWrap: 'wrap',
        gap: 1
      }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1 
        }}>
          <BugReport sx={{ fontSize: 20, color: 'error.main' }} />
          <Typography 
            variant="h6" 
            sx={{ 
              fontSize: { xs: '1rem', sm: '1.25rem' },
              fontWeight: 600
            }}
          >
            {title} {chartData && data.config?.timePeriod && `(by ${data.config.timePeriod})`}
          </Typography>
        </Box>
        
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1 
        }}>
          {trendIcon}
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ 
              textTransform: 'capitalize',
              fontSize: { xs: '0.75rem', sm: '0.875rem' }
            }}
          >
            {metrics.bugTrend}
          </Typography>
        </Box>
      </Box>
      
      {/* Chart */}
      <Box sx={{ 
        height: { xs: Math.min(height, 300), sm: height },
        width: '100%',
        mb: { xs: 2, sm: 3 }
      }}>
        {useChartJS ? (
          <ChartJSLineChart
            data={chartData}
            title=""
            height={height}
            options={{
              plugins: {
                legend: {
                  position: 'top',
                },
                title: {
                  display: false,
                },
                tooltip: {
                  backgroundColor: 'rgba(0, 0, 0, 0.9)',
                  titleColor: 'white',
                  bodyColor: 'white',
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                  borderWidth: 1,
                  cornerRadius: 6,
                  callbacks: {
                    title: function(context) {
                      console.log('🔍 BUG_TREND: Full tooltip context:', {
                        context,
                        contextLength: context?.length,
                        firstItem: context?.[0],
                        dataPoint: context?.[0] ? {
                          dataIndex: context[0].dataIndex,
                          label: context[0].label,
                          parsed: context[0].parsed,
                          dataset: {
                            label: context[0].dataset?.label,
                            hasOriginalData: !!context[0].dataset?._originalData,
                            originalDataKeys: context[0].dataset?._originalData ? Object.keys(context[0].dataset._originalData[0] || {}) : null
                          }
                        } : null
                      })
                      
                      if (!context || !context[0]) return 'No context'
                      
                      const dataPoint = context[0]
                      const timePeriod = data.config?.timePeriod || 'month'
                      const dataIndex = dataPoint.dataIndex
                      
                      console.log('🔍 BUG_TREND: Tooltip processing', {
                        timePeriod,
                        dataIndex,
                        hasOriginalData: !!dataPoint.dataset._originalData,
                        originalDataLength: dataPoint.dataset._originalData?.length,
                        sampleOriginalData: dataPoint.dataset._originalData?.[dataIndex],
                        allOriginalData: dataPoint.dataset._originalData
                      })
                      
                      // For weekly data, show date range format
                      if (timePeriod === 'week' && dataPoint.dataset._originalData) {
                        const originalData = dataPoint.dataset._originalData[dataIndex]
                        
                        console.log('🔍 BUG_TREND: Weekly tooltip data', {
                          originalData,
                          hasWeekStart: !!originalData?._weekStartFormatted,
                          hasWeekEnd: !!originalData?._weekEndFormatted,
                          weekStart: originalData?._weekStartFormatted,
                          weekEnd: originalData?._weekEndFormatted,
                          total: originalData?.total
                        })
                        
                        if (originalData && originalData._weekStartFormatted && originalData._weekEndFormatted) {
                          const totalBugs = originalData.total || 0
                          return `${originalData._weekStartFormatted}-${originalData._weekEndFormatted}, Total Bugs: ${totalBugs}`
                        }
                      }
                      
                      // Default format for month/quarter
                      const label = dataPoint.label || ''
                      const originalData = dataPoint.dataset._originalData?.[dataIndex]
                      const totalBugs = originalData?.total || 0
                      
                      console.log('🔍 BUG_TREND: Default tooltip format', {
                        label,
                        totalBugs,
                        originalData
                      })
                      
                      return `${label}, Total Bugs: ${totalBugs}`
                    },
                    label: function(context) {
                      const datasetLabel = context.dataset.label || ''
                      const value = context.parsed?.y || 0
                      return `${datasetLabel}: ${value}`
                    }
                  }
                }
              },
              scales: {
                x: {
                  title: {
                    display: true,
                    text: data.config?.timePeriod ? 
                      `${data.config.timePeriod.charAt(0).toUpperCase() + data.config.timePeriod.slice(1)}` : 
                      'Month'
                  }
                },
                y: {
                  title: {
                    display: true,
                    text: 'Bug Count'
                  }
                }
              }
            }}
          />
        ) : (
          <LineChart
            dataset={chartData.dataset}
            series={chartData.series}
            xAxis={chartData.xAxis}
            {...chartConfig}
          />
        )}
      </Box>
      
      {/* Metrics Summary */}
      <Box sx={{ 
        display: 'grid',
        gridTemplateColumns: { 
          xs: '1fr',
          sm: 'repeat(2, 1fr)'
        },
        gap: { xs: 2, sm: 3 }
      }}>
        {/* Total Bugs */}
        <Box>
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ 
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              mb: 1
            }}
          >
            Total Bugs
          </Typography>
          <Typography 
            variant="h4"
            sx={{ 
              fontSize: { xs: '1.5rem', sm: '2rem' },
              fontWeight: 600,
              color: 'error.main'
            }}
          >
            {metrics.totalBugs?.toLocaleString() || 0}
          </Typography>
        </Box>
        
        {/* Severity Distribution */}
        <Box>
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ 
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              mb: 1
            }}
          >
            Severity Distribution
          </Typography>
          <Box sx={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: 0.5 
          }}>
            {severityData.map((item) => (
              <Chip
                key={item.severity}
                label={`${item.severity}: ${item.count} (${item.percentage.toFixed(1)}%)`}
                size="small"
                color={item.color}
                variant="outlined"
                sx={{ 
                  fontSize: { xs: '0.65rem', sm: '0.75rem' },
                  height: { xs: 24, sm: 28 }
                }}
              />
            ))}
          </Box>
        </Box>
      </Box>
      
      {/* Monthly Trend Summary */}
      {metrics.monthlyBugTrend && metrics.monthlyBugTrend.length > 0 && (
        <Box sx={{ mt: { xs: 2, sm: 3 } }}>
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ 
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              mb: 1
            }}
          >
            Recent Months Summary
          </Typography>
          <Box sx={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: 1 
          }}>
            {metrics.monthlyBugTrend.slice(-3).map((monthData) => (
              <Box
                key={monthData.month}
                sx={{
                  p: 1,
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1,
                  minWidth: 120
                }}
              >
                <Typography 
                  variant="caption" 
                  color="text.secondary"
                  sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}
                >
                  {monthData.month}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                  <Typography 
                    variant="body2"
                    sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                  >
                    New: {monthData.bugs}
                  </Typography>
                  <Typography 
                    variant="body2"
                    color="success.main"
                    sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                  >
                    Resolved: {monthData.resolved}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </Paper>
  )
})

// ✅ REQUIRED: PropTypes
BugTrendAnalysis.propTypes = {
  data: PropTypes.shape({
    data: PropTypes.arrayOf(PropTypes.shape({
      month: PropTypes.string.isRequired,
      total: PropTypes.number.isRequired,
      resolved: PropTypes.number.isRequired,
      pending: PropTypes.number.isRequired
    }))
  }),
  metrics: PropTypes.shape({
    totalBugs: PropTypes.number,
    bugTrend: PropTypes.oneOf(['increasing', 'decreasing', 'stable']),
    severityDistribution: PropTypes.shape({
      critical: PropTypes.number,
      high: PropTypes.number,
      medium: PropTypes.number,
      low: PropTypes.number
    }),
    monthlyBugTrend: PropTypes.arrayOf(PropTypes.shape({
      month: PropTypes.string.isRequired,
      bugs: PropTypes.number.isRequired,
      resolved: PropTypes.number.isRequired
    }))
  }),
  title: PropTypes.string,
  height: PropTypes.number
}

export default BugTrendAnalysis 