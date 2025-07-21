/**
 * Get environment variable safely (works in both Node.js and browser)
 */
const getEnvVar = (key, defaultValue = '') => {
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key] || defaultValue;
  }
  return defaultValue;
};

/**
 * Feature flags for gradual rollout and A/B testing
 */
export const FEATURE_FLAGS = {
  // Chart.js migration flags
  USE_CHARTJS_HYBRID: getEnvVar('REACT_APP_USE_CHARTJS_HYBRID', 'true') !== 'false', // Default enabled
  USE_CHARTJS_SIMPLE: getEnvVar('REACT_APP_USE_CHARTJS_SIMPLE', 'false') === 'true', // Default disabled
  USE_CHARTJS_MEDIUM: getEnvVar('REACT_APP_USE_CHARTJS_MEDIUM', 'false') === 'true', // Default disabled
  USE_CHARTJS_COMPLEX: getEnvVar('REACT_APP_USE_CHARTJS_COMPLEX', 'false') === 'true', // Default disabled
  
  // Performance monitoring
  ENABLE_CHART_PERFORMANCE_MONITORING: getEnvVar('REACT_APP_CHART_PERF_MONITORING', 'false') === 'true',
  
  // Development flags
  ENABLE_CHART_DEBUG: getEnvVar('NODE_ENV', 'production') === 'development',
};

/**
 * Check if a feature is enabled
 */
export const isFeatureEnabled = (featureName) => {
  return FEATURE_FLAGS[featureName] || false;
};

/**
 * Get all enabled features
 */
export const getEnabledFeatures = () => {
  return Object.entries(FEATURE_FLAGS)
    .filter(([_, enabled]) => enabled)
    .map(([feature, _]) => feature);
};

/**
 * Chart component selector based on feature flags
 */
export const selectChartComponent = (complexity) => {
  switch (complexity) {
    case 'simple':
      return isFeatureEnabled('USE_CHARTJS_SIMPLE') ? 'chartjs' : 'mui';
    case 'medium':
      return isFeatureEnabled('USE_CHARTJS_MEDIUM') ? 'chartjs' : 'mui';
    case 'complex':
      return isFeatureEnabled('USE_CHARTJS_COMPLEX') ? 'chartjs' : 'mui';
    case 'hybrid':
      return isFeatureEnabled('USE_CHARTJS_HYBRID') ? 'chartjs' : 'mui';
    default:
      return 'mui';
  }
};