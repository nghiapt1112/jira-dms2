import React, { useMemo } from 'react'
import PropTypes from 'prop-types'
import { Box, Typography, Paper } from '@mui/material'
import { PieChart } from '@mui/x-charts/PieChart'

const CustomPieChart = React.memo(({ data, title, height = 400, ...props }) => {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return []
    
    return data.map((item, index) => ({
      id: item.id || index,
      value: item.value,
      label: item.label || `Item ${index + 1}`,
    }))
  }, [data])

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
        <PieChart
          series={[{
            data: chartData,
            highlightScope: { faded: 'global', highlighted: 'item' },
            faded: { innerRadius: 30, additionalRadius: -30, color: 'gray' },
          }]}
          height={height}
          margin={{ left: 50, right: 50, top: 20, bottom: 50 }}
        />
      </Box>
    </Paper>
  )
})

CustomPieChart.propTypes = {
  data: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    value: PropTypes.number.isRequired,
    label: PropTypes.string,
  })),
  title: PropTypes.string,
  height: PropTypes.number,
}

CustomPieChart.defaultProps = {
  data: [],
  title: 'Pie Chart',
  height: 400,
}

export default CustomPieChart