import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Line } from 'react-chartjs-2';
import { Box, Typography, Paper, useTheme } from '@mui/material';
import { useChartTheme, mergeChartOptions } from '../../../utils/chartTheme';
import { defaultChartOptions } from '../../../config/chartjs.config';

const ChartJSLineChart = React.memo(({ 
  data = [], 
  title = 'Line Chart', 
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
          backgroundColor: `${chartTheme.colors.primary}20`,
          borderColor: chartTheme.colors.primary,
          borderWidth: 2,
          pointBackgroundColor: chartTheme.colors.primary,
          pointBorderColor: chartTheme.colors.background,
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          fill: false,
          tension: 0.1,
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
        x: {
          ...defaultChartOptions.scales.x,
          type: 'category',
        },
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
        <Line data={chartData} options={chartOptions} />
      </Box>
    </Paper>
  );
});

ChartJSLineChart.propTypes = {
  data: PropTypes.arrayOf(PropTypes.shape({
    x: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    y: PropTypes.number.isRequired,
  })),
  title: PropTypes.string,
  height: PropTypes.number,
  options: PropTypes.object,
};

ChartJSLineChart.displayName = 'ChartJSLineChart';

export default ChartJSLineChart;