import React from 'react';
import PropTypes from 'prop-types';
import { selectChartComponent } from '../../config/features';
import { chartPerformanceMonitor } from '../../utils/chartPerformance';

// MUI X Charts component
import MUIBarChart from './BarChart';

// Chart.js component
import { ChartJSBarChart } from './ChartJS';

/**
 * Smart Bar Chart component that switches between MUI and Chart.js based on feature flags
 */
const SmartBarChart = React.memo(({ data, title, height, ...props }) => {
  const chartLibrary = selectChartComponent('simple');
  const chartId = `bar-chart-${title?.replace(/\s+/g, '-').toLowerCase()}`;

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
      <ChartJSBarChart
        data={data}
        title={title}
        height={height}
        {...props}
      />
    );
  }

  // Render MUI X Charts version (default)
  return (
    <MUIBarChart
      data={data}
      title={title}
      height={height}
      {...props}
    />
  );
});

SmartBarChart.propTypes = {
  data: PropTypes.arrayOf(PropTypes.shape({
    x: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    y: PropTypes.number.isRequired,
  })),
  title: PropTypes.string,
  height: PropTypes.number,
};

SmartBarChart.displayName = 'SmartBarChart';

export default SmartBarChart;