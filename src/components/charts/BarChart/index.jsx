import React, { useMemo } from 'react'
import PropTypes from 'prop-types'
import { Box, Typography, Paper } from '@mui/material'
import { BarChart } from '@mui/x-charts/BarChart'

const CustomBarChart = React.memo(({ data, title, height = 400, ...props }) => {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return { series: [], xAxis: [] }
    
    return {
      series: [{
        data: data.map(item => item.y),
        label: title || 'Data',
      }],
      xAxis: [{
        data: data.map(item => item.x),
        scaleType: 'band',
      }],
    }
  }, [data, title])

  if (!data || data.length === 0) {
    return (
      <Paper elevation={1} sx={{ p: 2, width: '100%' }} {...props}>
        <Typography variant="h6">{title}</Typography>
        <Box sx={{ 
          height, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}>
          <Typography color="text.secondary">No data available</Typography>
        </Box>
      </Paper>
    )
  }

  return (
    <Paper elevation={1} sx={{ p: 2, width: '100%' }} {...props}>
      <Typography variant="h6" sx={{ mb: 1 }}>{title}</Typography>
      <Box sx={{ height, width: '100%' }}>
        <BarChart
          series={chartData.series}
          xAxis={chartData.xAxis}
          height={height}
          margin={{ left: 50, right: 50, top: 20, bottom: 50 }}
        />
      </Box>
    </Paper>
  )
})

CustomBarChart.propTypes = {
  data: PropTypes.arrayOf(PropTypes.shape({
    x: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    y: PropTypes.number.isRequired,
  })),
  title: PropTypes.string,
  height: PropTypes.number,
}

CustomBarChart.defaultProps = {
  data: [],
  title: 'Bar Chart',
  height: 400,
}

export default CustomBarChart