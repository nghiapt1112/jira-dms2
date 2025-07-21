import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Pie } from 'react-chartjs-2';
import { Box, Typography, Paper, useTheme } from '@mui/material';
import { useChartTheme, mergeChartOptions, generateColorPalette } from '../../../utils/chartTheme';
import { defaultChartOptions } from '../../../config/chartjs.config';

const ChartJSPieChart = React.memo(({ 
  data = [], 
  title = 'Pie Chart', 
  height = 400, 
  options = {},
  ...props 
}) => {
  const theme = useTheme();
  const chartTheme = useChartTheme();

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return { labels: [], datasets: [] };
    
    const colors = generateColorPalette(data.length);
    
    return {
      labels: data.map(item => item.label),
      datasets: [
        {
          data: data.map(item => item.value),
          backgroundColor: colors,
          borderColor: chartTheme.colors.background,
          borderWidth: 2,
          hoverOffset: 4,
        },
      ],
    };
  }, [data, chartTheme]);

  const chartOptions = useMemo(() => {
    return mergeChartOptions({
      ...defaultChartOptions,
      ...options,
      maintainAspectRatio: false,
      plugins: {
        ...defaultChartOptions.plugins,
        legend: {
          ...defaultChartOptions.plugins.legend,
          position: 'right',
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = context.parsed;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = ((value / total) * 100).toFixed(1);
              return `${label}: ${value} (${percentage}%)`;
            },
          },
        },
        ...options.plugins,
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
        <Pie data={chartData} options={chartOptions} />
      </Box>
    </Paper>
  );
});

ChartJSPieChart.propTypes = {
  data: PropTypes.arrayOf(PropTypes.shape({
    label: PropTypes.string.isRequired,
    value: PropTypes.number.isRequired,
  })),
  title: PropTypes.string,
  height: PropTypes.number,
  options: PropTypes.object,
};

ChartJSPieChart.displayName = 'ChartJSPieChart';

export default ChartJSPieChart;