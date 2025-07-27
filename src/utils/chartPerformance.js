import React from 'react';
import { FEATURE_FLAGS } from '../config/features';

/**
 * Performance monitoring for charts
 */
class ChartPerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.enabled = FEATURE_FLAGS.ENABLE_CHART_PERFORMANCE_MONITORING;
  }

  /**
   * Start timing a chart operation
   */
  startTimer(chartId, operation = 'render') {
    if (!this.enabled) return null;

    const key = `${chartId}_${operation}`;
    const startTime = performance.now();
    
    this.metrics.set(key, {
      startTime,
      chartId,
      operation,
      type: 'timer',
    });

    return {
      end: () => this.endTimer(key),
      key,
    };
  }

  /**
   * End timing a chart operation
   */
  endTimer(key) {
    if (!this.enabled) return null;

    const metric = this.metrics.get(key);
    if (!metric) return null;

    const endTime = performance.now();
    const duration = endTime - metric.startTime;

    const completedMetric = {
      ...metric,
      endTime,
      duration,
      completed: true,
    };

    this.metrics.set(key, completedMetric);

    // Log performance in development
    if (FEATURE_FLAGS.ENABLE_CHART_DEBUG) {
      console.log(`📊 Chart Performance: ${metric.chartId} ${metric.operation} took ${duration.toFixed(2)}ms`);
    }

    return completedMetric;
  }

  /**
   * Record memory usage
   */
  recordMemory(chartId, operation = 'render') {
    if (!this.enabled || !window.performance.memory) return null;

    const key = `${chartId}_${operation}_memory`;
    const memory = {
      used: window.performance.memory.usedJSHeapSize,
      total: window.performance.memory.totalJSHeapSize,
      limit: window.performance.memory.jsHeapSizeLimit,
    };

    this.metrics.set(key, {
      chartId,
      operation,
      type: 'memory',
      memory,
      timestamp: Date.now(),
    });

    return memory;
  }

  /**
   * Record data size metrics
   */
  recordDataSize(chartId, data, operation = 'render') {
    if (!this.enabled) return null;

    const key = `${chartId}_${operation}_data`;
    const dataSize = {
      dataPoints: Array.isArray(data) ? data.length : 0,
      dataSize: JSON.stringify(data).length,
      complexity: this.calculateComplexity(data),
    };

    this.metrics.set(key, {
      chartId,
      operation,
      type: 'data',
      dataSize,
      timestamp: Date.now(),
    });

    return dataSize;
  }

  /**
   * Calculate data complexity score
   */
  calculateComplexity(data) {
    if (!Array.isArray(data)) return 0;

    let complexity = data.length; // Base complexity from data points

    // Add complexity for nested objects
    data.forEach(item => {
      if (typeof item === 'object' && item !== null) {
        complexity += Object.keys(item).length;
      }
    });

    return complexity;
  }

  /**
   * Get performance metrics for a chart
   */
  getMetrics(chartId) {
    if (!this.enabled) return null;

    const chartMetrics = {};
    
    this.metrics.forEach((metric, key) => {
      if (metric.chartId === chartId) {
        chartMetrics[key] = metric;
      }
    });

    return chartMetrics;
  }

  /**
   * Get performance summary
   */
  getSummary() {
    if (!this.enabled) return null;

    const summary = {
      totalCharts: new Set(Array.from(this.metrics.values()).map(m => m.chartId)).size,
      totalOperations: this.metrics.size,
      averageRenderTime: 0,
      slowestChart: null,
      fastestChart: null,
      memoryUsage: {},
    };

    const renderMetrics = Array.from(this.metrics.values())
      .filter(m => m.type === 'timer' && m.operation === 'render' && m.completed);

    if (renderMetrics.length > 0) {
      const totalTime = renderMetrics.reduce((sum, m) => sum + m.duration, 0);
      summary.averageRenderTime = totalTime / renderMetrics.length;

      summary.slowestChart = renderMetrics.reduce((slowest, current) => 
        current.duration > slowest.duration ? current : slowest
      );

      summary.fastestChart = renderMetrics.reduce((fastest, current) => 
        current.duration < fastest.duration ? current : fastest
      );
    }

    // Memory usage summary
    const memoryMetrics = Array.from(this.metrics.values())
      .filter(m => m.type === 'memory');

    if (memoryMetrics.length > 0) {
      const latestMemory = memoryMetrics[memoryMetrics.length - 1];
      summary.memoryUsage = latestMemory.memory;
    }

    return summary;
  }

  /**
   * Clear all metrics
   */
  clear() {
    this.metrics.clear();
  }

  /**
   * Export metrics as JSON
   */
  exportMetrics() {
    if (!this.enabled) return null;

    return {
      timestamp: Date.now(),
      summary: this.getSummary(),
      metrics: Array.from(this.metrics.entries()).map(([key, metric]) => ({
        key,
        ...metric,
      })),
    };
  }

  /**
   * Compare performance between chart libraries
   */
  compareLibraries(chartId) {
    if (!this.enabled) return null;

    const muiMetrics = this.getMetrics(`${chartId}_mui`);
    const chartjsMetrics = this.getMetrics(`${chartId}_chartjs`);

    if (!muiMetrics || !chartjsMetrics) return null;

    const comparison = {
      renderTime: {
        mui: muiMetrics.render?.duration || 0,
        chartjs: chartjsMetrics.render?.duration || 0,
        improvement: 0,
      },
      memory: {
        mui: muiMetrics.memory?.memory || {},
        chartjs: chartjsMetrics.memory?.memory || {},
      },
    };

    if (comparison.renderTime.mui > 0 && comparison.renderTime.chartjs > 0) {
      comparison.renderTime.improvement = 
        ((comparison.renderTime.mui - comparison.renderTime.chartjs) / comparison.renderTime.mui) * 100;
    }

    return comparison;
  }
}

// Global instance
export const chartPerformanceMonitor = new ChartPerformanceMonitor();

/**
 * Performance monitoring hook for React components
 */
export const useChartPerformance = (chartId) => {
  const startRender = () => chartPerformanceMonitor.startTimer(chartId, 'render');
  const recordMemory = () => chartPerformanceMonitor.recordMemory(chartId, 'render');
  const recordData = (data) => chartPerformanceMonitor.recordDataSize(chartId, data, 'render');
  const getMetrics = () => chartPerformanceMonitor.getMetrics(chartId);

  return {
    startRender,
    recordMemory,
    recordData,
    getMetrics,
  };
};

/**
 * Performance wrapper component
 */
export const withChartPerformance = (WrappedComponent, chartId) => {
  return React.forwardRef((props, ref) => {
    const { startRender, recordMemory, recordData } = useChartPerformance(chartId);

    React.useEffect(() => {
      const timer = startRender();
      recordMemory();
      if (props.data) {
        recordData(props.data);
      }

      return () => {
        timer?.end();
      };
    }, [props.data]);

    return <WrappedComponent {...props} ref={ref} />;
  });
};