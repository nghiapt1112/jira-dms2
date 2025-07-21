/**
 * Data transformation utilities for converting MUI X Charts data to Chart.js format
 */

/**
 * Transform simple x/y data for Bar/Line charts
 */
export const transformSimpleData = (data = []) => {
  if (!Array.isArray(data) || data.length === 0) {
    return { labels: [], datasets: [] };
  }

  return {
    labels: data.map(item => item.x || item.label),
    datasets: [{
      data: data.map(item => item.y || item.value),
    }]
  };
};

/**
 * Transform MUI X Charts series data to Chart.js format
 */
export const transformSeriesData = (data = [], series = []) => {
  if (!Array.isArray(data) || data.length === 0) {
    return { labels: [], datasets: [] };
  }

  const labels = data.map(item => item.timePeriod || item.x || item.label);
  
  const datasets = series.map(s => ({
    label: s.label,
    data: data.map(item => item[s.dataKey] || 0),
    backgroundColor: s.color || s.backgroundColor,
    borderColor: s.color || s.borderColor,
    borderWidth: s.borderWidth || 2,
    fill: s.fill || false,
    tension: s.tension || 0.1,
  }));

  return { labels, datasets };
};

/**
 * Transform pie chart data
 */
export const transformPieData = (data = []) => {
  if (!Array.isArray(data) || data.length === 0) {
    return { labels: [], datasets: [] };
  }

  return {
    labels: data.map(item => item.name || item.label),
    datasets: [{
      data: data.map(item => item.value),
      backgroundColor: data.map(item => item.color),
    }]
  };
};

/**
 * Transform stacked bar chart data
 */
export const transformStackedBarData = (data = [], categories = []) => {
  if (!Array.isArray(data) || data.length === 0) {
    return { labels: [], datasets: [] };
  }

  const labels = data.map(item => item.developer || item.label);
  
  const datasets = categories.map(category => ({
    label: category.label || category,
    data: data.map(item => item[category.key || category] || 0),
    backgroundColor: category.color,
    stack: 'Stack 0',
  }));

  return { labels, datasets };
};

/**
 * Transform scatter plot data
 */
export const transformScatterData = (data = [], groupBy = null) => {
  if (!Array.isArray(data) || data.length === 0) {
    return { datasets: [] };
  }

  if (!groupBy) {
    return {
      datasets: [{
        label: 'Data Points',
        data: data.map(item => ({
          x: item.x,
          y: item.y,
          label: item.label,
        })),
      }]
    };
  }

  // Group data by specified field
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
    });
  });

  const datasets = Object.entries(groups).map(([group, points]) => ({
    label: group,
    data: points,
  }));

  return { datasets };
};

/**
 * Transform hybrid chart data (bars + lines)
 */
export const transformHybridData = (data = [], barSeries = [], lineSeries = []) => {
  if (!Array.isArray(data) || data.length === 0) {
    return { labels: [], datasets: [] };
  }

  const labels = data.map(item => item.timePeriod || item.x || item.label);
  const datasets = [];

  // Add bar datasets
  barSeries.forEach(series => {
    datasets.push({
      type: 'bar',
      label: series.label,
      data: data.map(item => item[series.dataKey] || 0),
      backgroundColor: series.color,
      borderColor: series.color,
      borderWidth: 1,
      yAxisID: 'y',
    });
  });

  // Add line datasets
  lineSeries.forEach(series => {
    datasets.push({
      type: 'line',
      label: series.label,
      data: data.map(item => item[series.dataKey] || 0),
      borderColor: series.color,
      backgroundColor: `${series.color}20`,
      borderWidth: 2,
      fill: false,
      tension: 0.1,
      yAxisID: 'y1',
    });
  });

  return { labels, datasets };
};

/**
 * Transform time series data with proper date handling
 */
export const transformTimeSeriesData = (data = [], series = []) => {
  if (!Array.isArray(data) || data.length === 0) {
    return { labels: [], datasets: [] };
  }

  const labels = data.map(item => {
    const date = new Date(item.date || item.timePeriod || item.x);
    return date.toLocaleDateString();
  });

  const datasets = series.map(s => ({
    label: s.label,
    data: data.map(item => ({
      x: item.date || item.timePeriod || item.x,
      y: item[s.dataKey] || 0,
    })),
    borderColor: s.color,
    backgroundColor: `${s.color}20`,
    borderWidth: 2,
    fill: s.fill || false,
    tension: 0.1,
  }));

  return { labels, datasets };
};

/**
 * Calculate chart dimensions based on data complexity
 */
export const calculateOptimalDimensions = (data = [], chartType = 'bar') => {
  const dataLength = Array.isArray(data) ? data.length : 0;
  
  const baseDimensions = {
    bar: { width: 400, height: 300 },
    line: { width: 500, height: 300 },
    pie: { width: 400, height: 400 },
    scatter: { width: 500, height: 400 },
    hybrid: { width: 600, height: 400 },
  };

  const base = baseDimensions[chartType] || baseDimensions.bar;
  
  // Adjust width for large datasets
  if (dataLength > 10) {
    base.width = Math.min(base.width + (dataLength - 10) * 20, 800);
  }
  
  // Adjust height for hybrid charts
  if (chartType === 'hybrid') {
    base.height = Math.max(base.height, 350);
  }

  return base;
};

/**
 * Generate responsive chart options
 */
export const generateResponsiveOptions = (baseOptions = {}, breakpoint = 'md') => {
  const mobileOptions = {
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          boxWidth: 12,
          fontSize: 10,
        },
      },
    },
    scales: {
      x: {
        ticks: {
          maxRotation: 45,
          fontSize: 10,
        },
      },
      y: {
        ticks: {
          fontSize: 10,
        },
      },
    },
  };

  const tabletOptions = {
    plugins: {
      legend: {
        position: 'top',
        labels: {
          boxWidth: 15,
          fontSize: 12,
        },
      },
    },
    scales: {
      x: {
        ticks: {
          maxRotation: 30,
          fontSize: 11,
        },
      },
      y: {
        ticks: {
          fontSize: 11,
        },
      },
    },
  };

  switch (breakpoint) {
    case 'xs':
    case 'sm':
      return { ...baseOptions, ...mobileOptions };
    case 'md':
      return { ...baseOptions, ...tabletOptions };
    default:
      return baseOptions;
  }
};