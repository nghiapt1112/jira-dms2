import React from 'react';
import PropTypes from 'prop-types';
import { selectChartComponent } from '../../config/features';
import { chartPerformanceMonitor } from '../../utils/chartPerformance';

// MUI X Charts component
import MUIPieChart from './PieChart';

// Chart.js component
import { ChartJSPieChart } from './ChartJS';

/**
 * Smart Pie Chart component that switches between MUI and Chart.js based on feature flags
 */
const SmartPieChart = React.memo(({ data, title, height, ...props }) => {
  const chartLibrary = selectChartComponent('simple');
  const chartId = `pie-chart-${title?.replace(/\s+/g, '-').toLowerCase()}`;

  // Performance monitoring
  React.useEffect(() => {
    const timer = chartPerformanceMonitor.startTimer(`${chartId}_${chartLibrary}`, 'render');
    chartPerformanceMonitor.recordDataSize(`${chartId}_${chartLibrary}`, data, 'render');
    
    return () => {
      timer?.end();
    };
  }, [data, chartLibrary, chartId]);

  // Render Chart.js version
  if (chartLibrary === 'chartjs') {
    return (
      <ChartJSPieChart
        data={data}
        title={title}
        height={height}
        {...props}
      />
    );
  }

  // Render MUI X Charts version (default)
  return (
    <MUIPieChart
      data={data}
      title={title}
      height={height}
      {...props}
    />
  );
});

SmartPieChart.propTypes = {
  data: PropTypes.arrayOf(PropTypes.shape({
    label: PropTypes.string.isRequired,
    value: PropTypes.number.isRequired,
  })),
  title: PropTypes.string,
  height: PropTypes.number,
};

SmartPieChart.displayName = 'SmartPieChart';

export default SmartPieChart;