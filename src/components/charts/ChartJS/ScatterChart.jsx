import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Scatter } from 'react-chartjs-2';
import { Box, Typography, Paper, useTheme } from '@mui/material';
import { useChartTheme, mergeChartOptions, generateColorPalette } from '../../../utils/chartTheme';
import { defaultChartOptions } from '../../../config/chartjs.config';

const ChartJSScatterChart = React.memo(({ 
  data = [], 
  title = 'Scatter Chart', 
  height = 400, 
  groupBy = null,
  onClick = null,
  options = {},
  ...props 
}) => {
  const theme = useTheme();
  const chartTheme = useChartTheme();

  const chartData = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) return { datasets: [] };

    if (!groupBy) {
      // Single dataset
      return {
        datasets: [{
          label: 'Data Points',
          data: data.map(item => ({
            x: item.x,
            y: item.y,
            label: item.label,
            ...item,
          })),
          backgroundColor: chartTheme.colors.primary,
          borderColor: chartTheme.colors.primary,
          pointRadius: 6,
          pointHoverRadius: 8,
        }],
      };
    }

    // Multiple datasets grouped by field
    const groups = {};
    data.forEach(item => {
      const group = item[groupBy];
      if (!groups[group]) {
        groups[group] = [];
      }
      groups[group].push({
        x: item.x,
        y: item.y,
        label: item.label,
        ...item,
      });
    });

    const colors = generateColorPalette(Object.keys(groups).length);
    const datasets = Object.entries(groups).map(([group, points], index) => ({
      label: group,
      data: points,
      backgroundColor: colors[index],
      borderColor: colors[index],
      pointRadius: 6,
      pointHoverRadius: 8,
    }));

    return { datasets };
  }, [data, groupBy, chartTheme]);

  const chartOptions = useMemo(() => {
    return mergeChartOptions({
      ...defaultChartOptions,
      ...options,
      maintainAspectRatio: false,
      onClick: onClick ? (event, elements) => {
        if (elements.length > 0) {
          const element = elements[0];
          const datasetIndex = element.datasetIndex;
          const index = element.index;
          const pointData = chartData.datasets[datasetIndex].data[index];
          onClick(pointData, event);
        }
      } : undefined,
      plugins: {
        ...defaultChartOptions.plugins,
        tooltip: {
          callbacks: {
            title: function(context) {
              return context[0].raw.label || `Point ${context[0].dataIndex + 1}`;
            },
            label: function(context) {
              const point = context.raw;
              return [
                `X: ${point.x}`,
                `Y: ${point.y}`,
                ...(point.additionalInfo ? [point.additionalInfo] : [])
              ];
            },
          },
        },
        ...options.plugins,
      },
      scales: {
        x: {
          type: 'linear',
          position: 'bottom',
          title: {
            display: true,
            text: options.xAxisLabel || 'X Axis',
          },
        },
        y: {
          type: 'linear',
          title: {
            display: true,
            text: options.yAxisLabel || 'Y Axis',
          },
        },
        ...options.scales,
      },
    }, theme);
  }, [options, theme, onClick, chartData]);

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
        <Scatter data={chartData} options={chartOptions} />
      </Box>
    </Paper>
  );
});

ChartJSScatterChart.propTypes = {
  data: PropTypes.arrayOf(PropTypes.shape({
    x: PropTypes.number.isRequired,
    y: PropTypes.number.isRequired,
    label: PropTypes.string,
  })).isRequired,
  title: PropTypes.string,
  height: PropTypes.number,
  groupBy: PropTypes.string,
  onClick: PropTypes.func,
  options: PropTypes.shape({
    xAxisLabel: PropTypes.string,
    yAxisLabel: PropTypes.string,
    plugins: PropTypes.object,
    scales: PropTypes.object,
  }),
};

ChartJSScatterChart.displayName = 'ChartJSScatterChart';

export default ChartJSScatterChart;