/**
 * Base Chart Components - Following DRY & SOLID Principles
 * Reusable chart components for bug analysis dashboard
 */

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../../../shared/components/ui/card'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
} from 'chart.js'
import { Line, Pie, Bar } from 'react-chartjs-2'

// Register Chart.js components once
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement
)

/**
 * Base Chart Component - Open/Closed Principle
 * Can be extended but not modified
 */
export const BaseChart = ({ 
  title, 
  subtitle, 
  data, 
  options, 
  height = 300,
  loading = false,
  error = null,
  children 
}) => {
  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center" style={{ height }}>
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-600">Loading chart...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }
  
  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p>Error loading chart: {error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }
  
  if (!data) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-gray-600">No data available</p>
        </CardContent>
      </Card>
    )
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
      </CardHeader>
      <CardContent>
        <div style={{ height }}>
          {children}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Time Series Chart - Extends BaseChart
 * For created/resolved trends
 */
export const TimeSeriesChart = ({ 
  title = "Trend Analysis",
  subtitle,
  data,
  datasets,
  height = 300,
  ...props 
}) => {
  const chartData = {
    labels: data?.labels || [],
    datasets: datasets.map(dataset => ({
      label: dataset.label,
      data: dataset.data,
      borderColor: dataset.color,
      backgroundColor: dataset.backgroundColor || `${dataset.color}20`,
      tension: 0.4,
      fill: dataset.fill !== false
    }))
  }
  
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      title: { display: false }
    },
    scales: {
      y: { 
        beginAtZero: true,
        grid: { color: '#f1f5f9' }
      },
      x: {
        grid: { color: '#f1f5f9' }
      }
    }
  }
  
  return (
    <BaseChart 
      title={title} 
      subtitle={subtitle} 
      data={data} 
      height={height}
      {...props}
    >
      <Line data={chartData} options={options} />
    </BaseChart>
  )
}

/**
 * Distribution Chart - Extends BaseChart
 * For pie charts (status, bug types)
 */
export const DistributionChart = ({ 
  title,
  subtitle,
  data,
  colors,
  height = 300,
  legendPosition = 'right',
  ...props 
}) => {
  const chartData = {
    labels: data?.labels || [],
    datasets: [{
      data: data?.values || [],
      backgroundColor: colors || data?.colors,
      borderWidth: 2,
      borderColor: '#ffffff'
    }]
  }
  
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: legendPosition }
    }
  }
  
  return (
    <BaseChart 
      title={title} 
      subtitle={subtitle} 
      data={data} 
      height={height}
      {...props}
    >
      <Pie data={chartData} options={options} />
    </BaseChart>
  )
}

/**
 * Comparison Chart - Extends BaseChart
 * For bar charts (root causes)
 */
export const ComparisonChart = ({ 
  title,
  subtitle,
  data,
  colors,
  height = 300,
  horizontal = false,
  ...props 
}) => {
  const chartData = {
    labels: data?.labels || [],
    datasets: [{
      label: data?.label || 'Count',
      data: data?.values || [],
      backgroundColor: colors || data?.colors,
      borderRadius: 4
    }]
  }
  
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: horizontal ? 'y' : 'x',
    plugins: {
      legend: { display: false }
    },
    scales: {
      y: { 
        beginAtZero: true,
        grid: { color: '#f1f5f9' }
      },
      x: {
        grid: { display: !horizontal, color: '#f1f5f9' }
      }
    }
  }
  
  return (
    <BaseChart 
      title={title} 
      subtitle={subtitle} 
      data={data} 
      height={height}
      {...props}
    >
      <Bar data={chartData} options={options} />
    </BaseChart>
  )
}

/**
 * Summary Card Component - Reusable metric display
 */
export const SummaryCard = ({ icon: Icon, label, value, color = 'blue' }) => {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    orange: 'bg-orange-100 text-orange-600',
    purple: 'bg-purple-100 text-purple-600',
    red: 'bg-red-100 text-red-600'
  }
  
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center">
          <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-500">{label}</p>
            <p className="text-2xl font-semibold text-gray-900">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Chart Container - Layout component for chart grids
 */
export const ChartContainer = ({ children, columns = 2 }) => {
  const gridClass = columns === 1 ? 'grid-cols-1' : `grid-cols-1 lg:grid-cols-${columns}`
  
  return (
    <div className={`grid ${gridClass} gap-6`}>
      {children}
    </div>
  )
}

/**
 * Data Empty State - Reusable empty state component
 */
export const EmptyState = ({ message = "No data available", icon: Icon }) => {
  return (
    <div className="text-center py-12">
      {Icon && <Icon className="w-12 h-12 text-gray-400 mx-auto mb-4" />}
      <p className="text-gray-500">{message}</p>
    </div>
  )
}