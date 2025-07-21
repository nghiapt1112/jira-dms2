import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Bar } from 'react-chartjs-2';
import { Box, Typography, Paper, useTheme } from '@mui/material';
import { useChartTheme, mergeChartOptions } from '../../../utils/chartTheme';
import { defaultChartOptions } from '../../../config/chartjs.config';

const ChartJSBarChart = React.memo(({ 
  data = [], 
  title = 'Bar Chart', 
  height = 400, 
  options = {},
  ...props 
}) => {
  const theme = useTheme();
  const chartTheme = useChartTheme();

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return { labels: [], datasets: [] };
    
    return {
      labels: data.map(item => item.x),
      datasets: [
        {
          label: title || 'Data',
          data: data.map(item => item.y),
          backgroundColor: chartTheme.colors.primary,
          borderColor: chartTheme.colors.primary,
          borderWidth: 1,
          borderRadius: 4,
          borderSkipped: false,
        },
      ],
    };
  }, [data, title, chartTheme]);

  const chartOptions = useMemo(() => {
    return mergeChartOptions({
      ...defaultChartOptions,
      ...options,
      maintainAspectRatio: false,
      scales: {
        ...defaultChartOptions.scales,
        ...options.scales,
      },
    }, theme);
  }, [options, theme]);

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
    );
  }

  return (
    <Paper elevation={1} sx={{ p: 2, width: '100%' }} {...props}>
      <Typography variant="h6" sx={{ mb: 1 }}>{title}</Typography>
      <Box sx={{ height, width: '100%' }}>
        <Bar data={chartData} options={chartOptions} />
      </Box>
    </Paper>
  );
});

ChartJSBarChart.propTypes = {
  data: PropTypes.arrayOf(PropTypes.shape({
    x: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    y: PropTypes.number.isRequired,
  })),
  title: PropTypes.string,
  height: PropTypes.number,
  options: PropTypes.object,
};

ChartJSBarChart.displayName = 'ChartJSBarChart';

export default ChartJSBarChart;