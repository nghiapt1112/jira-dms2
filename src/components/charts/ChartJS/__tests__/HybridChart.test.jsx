import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ChartJSHybridChart from '../HybridChart';

// Mock Chart.js
jest.mock('react-chartjs-2', () => ({
  Bar: ({ data, options }) => (
    <div data-testid="hybrid-chart">
      <div data-testid="chart-labels">{JSON.stringify(data.labels)}</div>
      <div data-testid="chart-datasets">{JSON.stringify(data.datasets)}</div>
      <div data-testid="chart-options">{JSON.stringify(options)}</div>
    </div>
  ),
}));

const theme = createTheme();

const mockData = [
  { timePeriod: '2025-01', 'John Doe': 15, 'John Doe_hours': 32 },
  { timePeriod: '2025-02', 'John Doe': 12, 'John Doe_hours': 28 },
  { timePeriod: '2025-03', 'John Doe': 18, 'John Doe_hours': 35 },
];

const mockBarSeries = [
  { dataKey: 'John Doe', label: 'John Doe (Story Points)', color: '#1976d2' }
];

const mockLineSeries = [
  { dataKey: 'John Doe_hours', label: 'John Doe (Hours)', color: '#ff6b35' }
];

const renderChart = (props = {}) => {
  return render(
    <ThemeProvider theme={theme}>
      <ChartJSHybridChart
        data={mockData}
        barSeries={mockBarSeries}
        lineSeries={mockLineSeries}
        {...props}
      />
    </ThemeProvider>
  );
};

describe('ChartJSHybridChart', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders hybrid chart with data', () => {
    renderChart();
    
    expect(screen.getByTestId('hybrid-chart')).toBeInTheDocument();
    expect(screen.getByText('Hybrid Chart')).toBeInTheDocument();
  });

  test('renders correct labels from data', () => {
    renderChart();
    
    const labelsElement = screen.getByTestId('chart-labels');
    expect(labelsElement).toHaveTextContent('["2025-01","2025-02","2025-03"]');
  });

  test('creates correct datasets for bar and line series', () => {
    renderChart();
    
    const datasetsElement = screen.getByTestId('chart-datasets');
    const datasets = JSON.parse(datasetsElement.textContent);
    
    expect(datasets).toHaveLength(2);
    
    // Check bar dataset
    expect(datasets[0]).toMatchObject({
      type: 'bar',
      label: 'John Doe (Story Points)',
      data: [15, 12, 18],
      yAxisID: 'y',
    });
    
    // Check line dataset
    expect(datasets[1]).toMatchObject({
      type: 'line',
      label: 'John Doe (Hours)',
      data: [32, 28, 35],
      yAxisID: 'y1',
    });
  });

  test('applies custom options', () => {
    const customOptions = {
      leftAxisLabel: 'Custom Story Points',
      rightAxisLabel: 'Custom Hours',
      leftAxisUnit: 'pts',
      rightAxisUnit: 'hrs',
    };
    
    renderChart({ options: customOptions });
    
    const optionsElement = screen.getByTestId('chart-options');
    const options = JSON.parse(optionsElement.textContent);
    
    expect(options.scales.y.title.text).toBe('Custom Story Points');
    expect(options.scales.y1.title.text).toBe('Custom Hours');
  });

  test('renders no data message when data is empty', () => {
    renderChart({ data: [] });
    
    expect(screen.getByText('No data available')).toBeInTheDocument();
    expect(screen.queryByTestId('hybrid-chart')).not.toBeInTheDocument();
  });

  test('handles custom title', () => {
    const customTitle = 'Developer Performance Chart';
    renderChart({ title: customTitle });
    
    expect(screen.getByText(customTitle)).toBeInTheDocument();
  });

  test('handles missing series gracefully', () => {
    renderChart({ barSeries: [], lineSeries: [] });
    
    const datasetsElement = screen.getByTestId('chart-datasets');
    const datasets = JSON.parse(datasetsElement.textContent);
    
    expect(datasets).toHaveLength(0);
  });

  test('applies correct colors from series', () => {
    renderChart();
    
    const datasetsElement = screen.getByTestId('chart-datasets');
    const datasets = JSON.parse(datasetsElement.textContent);
    
    expect(datasets[0].backgroundColor).toBe('#1976d2');
    expect(datasets[1].borderColor).toBe('#ff6b35');
  });

  test('creates dual y-axes configuration', () => {
    renderChart();
    
    const optionsElement = screen.getByTestId('chart-options');
    const options = JSON.parse(optionsElement.textContent);
    
    expect(options.scales.y).toBeDefined();
    expect(options.scales.y1).toBeDefined();
    expect(options.scales.y.position).toBe('left');
    expect(options.scales.y1.position).toBe('right');
  });
});