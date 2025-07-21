import { FEATURE_FLAGS } from '../config/features';
import { chartPerformanceMonitor } from './chartPerformance';

/**
 * Migration status tracking and reporting
 */
export const migrationStatus = {
  // Chart components by migration phase
  phases: {
    phase1: {
      name: 'Simple Components',
      components: [
        'CustomBarChart',
        'CustomLineChart', 
        'CustomPieChart'
      ],
      status: 'completed',
      migrated: true
    },
    phase2: {
      name: 'Medium Complexity',
      components: [
        'BugTrendAnalysis',
        'RootCauseAnalysis',
        'DeveloperRootCauseAnalysis',
        'ScopeCreepCharts',
        'TimelinessCharts',
        'DeliveryEfficiencyChart'
      ],
      status: 'in_progress',
      migrated: false
    },
    phase3: {
      name: 'High Complexity',
      components: [
        'TeamContributionChart',
        'QualityVsHealthChart',
        'QualityVsDeliveryChart'
      ],
      status: 'in_progress',
      migrated: false
    }
  },

  // Feature flag status
  featureFlags: FEATURE_FLAGS,

  // Get migration progress
  getProgress() {
    const allComponents = Object.values(this.phases).flatMap(phase => phase.components);
    const completedComponents = Object.values(this.phases)
      .filter(phase => phase.status === 'completed')
      .flatMap(phase => phase.components);
    
    return {
      total: allComponents.length,
      completed: completedComponents.length,
      percentage: (completedComponents.length / allComponents.length) * 100,
      remaining: allComponents.length - completedComponents.length
    };
  },

  // Get current feature flag status
  getCurrentFlags() {
    return {
      hybrid: this.featureFlags.USE_CHARTJS_HYBRID,
      simple: this.featureFlags.USE_CHARTJS_SIMPLE,
      medium: this.featureFlags.USE_CHARTJS_MEDIUM,
      complex: this.featureFlags.USE_CHARTJS_COMPLEX,
      monitoring: this.featureFlags.ENABLE_CHART_PERFORMANCE_MONITORING
    };
  },

  // Get performance comparison
  getPerformanceComparison() {
    if (!this.featureFlags.ENABLE_CHART_PERFORMANCE_MONITORING) {
      return { available: false, reason: 'Performance monitoring disabled' };
    }

    const summary = chartPerformanceMonitor.getSummary();
    if (!summary) {
      return { available: false, reason: 'No performance data available' };
    }

    return {
      available: true,
      data: summary,
      recommendations: this.generateRecommendations(summary)
    };
  },

  // Generate recommendations based on performance data
  generateRecommendations(performanceData) {
    const recommendations = [];

    if (performanceData.averageRenderTime > 100) {
      recommendations.push({
        type: 'performance',
        severity: 'high',
        message: 'Average render time is above 100ms. Consider optimizing chart data or using Chart.js.',
        action: 'Enable Chart.js for better performance'
      });
    }

    if (performanceData.slowestChart?.duration > 200) {
      recommendations.push({
        type: 'performance',
        severity: 'medium',
        message: `Slowest chart (${performanceData.slowestChart.chartId}) takes ${performanceData.slowestChart.duration.toFixed(2)}ms to render.`,
        action: 'Migrate this chart to Chart.js priority'
      });
    }

    if (performanceData.memoryUsage?.used > 50 * 1024 * 1024) { // 50MB
      recommendations.push({
        type: 'memory',
        severity: 'medium',
        message: 'High memory usage detected. Consider optimizing chart data size.',
        action: 'Implement data pagination or lazy loading'
      });
    }

    return recommendations;
  },

  // Get migration report
  getReport() {
    const progress = this.getProgress();
    const flags = this.getCurrentFlags();
    const performance = this.getPerformanceComparison();

    return {
      timestamp: new Date().toISOString(),
      progress,
      flags,
      performance,
      phases: this.phases,
      nextSteps: this.getNextSteps()
    };
  },

  // Get recommended next steps
  getNextSteps() {
    const steps = [];
    
    // Check feature flag readiness
    if (!this.featureFlags.USE_CHARTJS_SIMPLE) {
      steps.push({
        priority: 'high',
        action: 'Enable Chart.js for simple components',
        description: 'Set REACT_APP_USE_CHARTJS_SIMPLE=true to start using Chart.js for basic charts',
        impact: 'Low risk, immediate performance improvement'
      });
    }

    if (!this.featureFlags.USE_CHARTJS_MEDIUM && this.featureFlags.USE_CHARTJS_SIMPLE) {
      steps.push({
        priority: 'medium',
        action: 'Enable Chart.js for medium complexity charts',
        description: 'Set REACT_APP_USE_CHARTJS_MEDIUM=true after validating simple charts',
        impact: 'Medium risk, significant performance improvement'
      });
    }

    if (!this.featureFlags.ENABLE_CHART_PERFORMANCE_MONITORING) {
      steps.push({
        priority: 'low',
        action: 'Enable performance monitoring',
        description: 'Set REACT_APP_CHART_PERF_MONITORING=true to track migration benefits',
        impact: 'No risk, provides valuable metrics'
      });
    }

    return steps;
  },

  // Update phase status
  updatePhaseStatus(phase, status) {
    if (this.phases[phase]) {
      this.phases[phase].status = status;
      if (status === 'completed') {
        this.phases[phase].migrated = true;
      }
    }
  },

  // Export report as JSON
  exportReport() {
    return JSON.stringify(this.getReport(), null, 2);
  },

  // Log migration status to console
  logStatus() {
    const report = this.getReport();
    
    console.group('📊 Chart.js Migration Status');
    console.log(`Progress: ${report.progress.completed}/${report.progress.total} (${report.progress.percentage.toFixed(1)}%)`);
    console.log('Feature Flags:', report.flags);
    
    if (report.performance.available) {
      console.log(`Average Render Time: ${report.performance.data.averageRenderTime.toFixed(2)}ms`);
      if (report.performance.recommendations.length > 0) {
        console.log('Recommendations:', report.performance.recommendations);
      }
    }
    
    if (report.nextSteps.length > 0) {
      console.log('Next Steps:');
      report.nextSteps.forEach(step => {
        console.log(`  ${step.priority.toUpperCase()}: ${step.action}`);
      });
    }
    
    console.groupEnd();
  }
};

// Auto-log status in development
if (process.env.NODE_ENV === 'development') {
  // Log status on page load
  setTimeout(() => {
    migrationStatus.logStatus();
  }, 2000);
}