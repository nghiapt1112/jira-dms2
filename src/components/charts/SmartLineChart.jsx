import React from 'react';
import PropTypes from 'prop-types';
import { selectChartComponent } from '../../config/features';
import { chartPerformanceMonitor } from '../../utils/chartPerformance';

// MUI X Charts component
import MUILineChart from './LineChart';

// Chart.js component
import { ChartJSLineChart } from './ChartJS';

/**
 * Smart Line Chart component that switches between MUI and Chart.js based on feature flags
 */
const SmartLineChart = React.memo(({ data, title, height, ...props }) => {
  const chartLibrary = selectChartComponent('simple');
  const chartId = `line-chart-${title?.replace(/\s+/g, '-').toLowerCase()}`;

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
      <ChartJSLineChart
        data={data}
        title={title}
        height={height}
        {...props}
      />
    );
  }

  // Render MUI X Charts version (default)
  return (
    <MUILineChart
      data={data}
      title={title}
      height={height}
      {...props}
    />
  );
});

SmartLineChart.propTypes = {
  data: PropTypes.arrayOf(PropTypes.shape({
    x: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    y: PropTypes.number.isRequired,
  })),
  title: PropTypes.string,
  height: PropTypes.number,
};

SmartLineChart.displayName = 'SmartLineChart';

export default SmartLineChart;