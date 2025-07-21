import { useTheme } from '@mui/material/styles';

/**
 * Hook to get Chart.js theme configuration based on MUI theme
 */
export const useChartTheme = () => {
  const theme = useTheme();
  
  return {
    colors: {
      primary: theme.palette.primary.main,
      secondary: theme.palette.secondary.main,
      background: theme.palette.background.paper,
      text: theme.palette.text.primary,
      textSecondary: theme.palette.text.secondary,
      divider: theme.palette.divider,
      success: theme.palette.success.main,
      error: theme.palette.error.main,
      warning: theme.palette.warning.main,
      info: theme.palette.info.main,
    },
    fontFamily: theme.typography.fontFamily,
    fontSize: theme.typography.body2.fontSize,
    fontWeight: theme.typography.body2.fontWeight,
    borderRadius: theme.shape.borderRadius,
  };
};

/**
 * Generate color palette for multiple series
 */
export const generateColorPalette = (count = 10) => {
  const colors = [
    '#1976d2', '#dc004e', '#2e7d32', '#ed6c02', '#9c27b0',
    '#00796b', '#d32f2f', '#7b1fa2', '#388e3c', '#f57c00',
    '#303f9f', '#c2185b', '#689f38', '#ff5722', '#512da8'
  ];
  
  return Array.from({ length: count }, (_, i) => colors[i % colors.length]);
};

/**
 * Convert MUI theme to Chart.js options
 */
export const getChartOptionsFromTheme = (theme) => {
  return {
    plugins: {
      legend: {
        labels: {
          color: theme.palette.text.primary,
          font: {
            family: theme.typography.fontFamily,
            size: parseInt(theme.typography.body2.fontSize),
          },
        },
      },
      title: {
        color: theme.palette.text.primary,
        font: {
          family: theme.typography.fontFamily,
          size: parseInt(theme.typography.h6.fontSize),
          weight: theme.typography.h6.fontWeight,
        },
      },
      tooltip: {
        backgroundColor: theme.palette.background.paper,
        titleColor: theme.palette.text.primary,
        bodyColor: theme.palette.text.primary,
        borderColor: theme.palette.divider,
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        ticks: {
          color: theme.palette.text.secondary,
          font: {
            family: theme.typography.fontFamily,
            size: parseInt(theme.typography.body2.fontSize),
          },
        },
        grid: {
          color: theme.palette.divider,
        },
      },
      y: {
        ticks: {
          color: theme.palette.text.secondary,
          font: {
            family: theme.typography.fontFamily,
            size: parseInt(theme.typography.body2.fontSize),
          },
        },
        grid: {
          color: theme.palette.divider,
        },
      },
    },
  };
};

/**
 * Merge Chart.js options with theme-aware options
 */
export const mergeChartOptions = (baseOptions, theme) => {
  const themeOptions = getChartOptionsFromTheme(theme);
  
  return {
    ...baseOptions,
    plugins: {
      ...baseOptions.plugins,
      ...themeOptions.plugins,
    },
    scales: {
      ...baseOptions.scales,
      x: {
        ...baseOptions.scales?.x,
        ...themeOptions.scales.x,
      },
      y: {
        ...baseOptions.scales?.y,
        ...themeOptions.scales.y,
      },
    },
  };
};