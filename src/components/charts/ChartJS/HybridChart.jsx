import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Chart as ChartJS } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { Box, Typography, Paper, useTheme } from '@mui/material';
import { useChartTheme, mergeChartOptions } from '../../../utils/chartTheme';
import { hybridChartOptions } from '../../../config/chartjs.config';

const ChartJSHybridChart = React.memo(({ 
  data = [], 
  title = 'Hybrid Chart', 
  height = 400, 
  barSeries = [],
  lineSeries = [],
  options = {},
  ...props 
}) => {
  const theme = useTheme();
  const chartTheme = useChartTheme();

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return { labels: [], datasets: [] };
    
    const labels = data.map(item => item.timePeriod || item.x);
    const datasets = [];

    // Add bar datasets
    barSeries.forEach((series, index) => {
      datasets.push({
        type: 'bar',
        label: series.label || `Bar Series ${index + 1}`,
        data: data.map(item => item[series.dataKey] || 0),
        backgroundColor: series.color || chartTheme.colors.primary,
        borderColor: series.color || chartTheme.colors.primary,
        borderWidth: 1,
        borderRadius: 4,
        borderSkipped: false,
        yAxisID: 'y',
      });
    });

    // Add line datasets
    lineSeries.forEach((series, index) => {
      datasets.push({
        type: 'line',
        label: series.label || `Line Series ${index + 1}`,
        data: data.map(item => item[series.dataKey] || 0),
        backgroundColor: `${series.color || chartTheme.colors.secondary}20`,
        borderColor: series.color || chartTheme.colors.secondary,
        borderWidth: 2,
        pointBackgroundColor: series.color || chartTheme.colors.secondary,
        pointBorderColor: chartTheme.colors.background,
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        fill: false,
        tension: 0.1,
        yAxisID: 'y1',
      });
    });

    return {
      labels,
      datasets,
    };
  }, [data, barSeries, lineSeries, chartTheme]);

  const chartOptions = useMemo(() => {
    return mergeChartOptions({
      ...hybridChartOptions,
      ...options,
      maintainAspectRatio: false,
      scales: {
        ...hybridChartOptions.scales,
        y: {
          ...hybridChartOptions.scales.y,
          title: {
            display: true,
            text: options.leftAxisLabel || 'Left Axis',
          },
        },
        y1: {
          ...hybridChartOptions.scales.y1,
          title: {
            display: true,
            text: options.rightAxisLabel || 'Right Axis',
          },
        },
        ...options.scales,
      },
      plugins: {
        ...hybridChartOptions.plugins,
        tooltip: {
          mode: 'index',
          intersect: false,
          callbacks: {
            label: function(context) {
              const label = context.dataset.label || '';
              const value = context.parsed.y;
              const unit = context.dataset.yAxisID === 'y1' ? 
                (options.rightAxisUnit || '') : 
                (options.leftAxisUnit || '');
              return `${label}: ${value}${unit}`;
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
        <Bar data={chartData} options={chartOptions} />
      </Box>
    </Paper>
  );
});

ChartJSHybridChart.propTypes = {
  data: PropTypes.arrayOf(PropTypes.object).isRequired,
  title: PropTypes.string,
  height: PropTypes.number,
  barSeries: PropTypes.arrayOf(PropTypes.shape({
    dataKey: PropTypes.string.isRequired,
    label: PropTypes.string,
    color: PropTypes.string,
  })),
  lineSeries: PropTypes.arrayOf(PropTypes.shape({
    dataKey: PropTypes.string.isRequired,
    label: PropTypes.string,
    color: PropTypes.string,
  })),
  options: PropTypes.shape({
    leftAxisLabel: PropTypes.string,
    rightAxisLabel: PropTypes.string,
    leftAxisUnit: PropTypes.string,
    rightAxisUnit: PropTypes.string,
    plugins: PropTypes.object,
    scales: PropTypes.object,
  }),
};

ChartJSHybridChart.displayName = 'ChartJSHybridChart';

export default ChartJSHybridChart;