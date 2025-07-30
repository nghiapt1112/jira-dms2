/**
 * Bug Analysis Charts Panel - Enhanced Component with Visual Charts
 * Displays bug analysis data from cache with interactive charts
 */

import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../../../shared/components/ui/card'
import { Button } from '../../../../shared/components/ui/button'
import { Line, Pie, Bar } from 'react-chartjs-2'
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
import { Bug, CheckCircle, Clock, Percent, ChevronDown, ChevronUp } from 'lucide-react'
import { developerQualityIndexedDB } from '../services/developerQualityIndexedDB'

// Register Chart.js components
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

const BugAnalysisChartsPanel = ({ projects = [], timeframe = 'week' }) => {
  const [bugAnalysisData, setBugAnalysisData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showJsonData, setShowJsonData] = useState(false)
  const [error, setError] = useState(null)
  
  // Load from cache on mount
  useEffect(() => {
    const loadFromCache = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const cachedData = await developerQualityIndexedDB.getBugAnalysis()
        setBugAnalysisData(cachedData)
      } catch (err) {
        console.error('Failed to load bug analysis from cache:', err)
        setError('Failed to load bug analysis data')
      } finally {
        setIsLoading(false)
      }
    }
    
    loadFromCache()
  }, [])
  
  // Filter cached data by selected projects
  const filteredData = useMemo(() => {
    if (!bugAnalysisData) return null
    
    if (projects.length === 0) {
      return bugAnalysisData
    }
    
    return Object.fromEntries(
      Object.entries(bugAnalysisData).filter(([projectKey]) => 
        projects.includes(projectKey)
      )
    )
  }, [bugAnalysisData, projects])
  
  // Process data for charts
  const chartData = useMemo(() => {
    if (!filteredData) return null
    
    const periodData = {}
    const statusTotals = { resolved: 0, inProgress: 0, new: 0, notFix: 0 }
    const bugTypeTotals = {}
    const rootCauseTotals = {}
    
    // Aggregate data across all projects and time periods
    Object.values(filteredData).forEach(projectData => {
      const periods = projectData[timeframe] || {}
      
      Object.entries(periods).forEach(([periodKey, periodStats]) => {
        // Time series data
        if (!periodData[periodKey]) {
          periodData[periodKey] = { created: 0, resolved: 0 }
        }
        periodData[periodKey].created += periodStats.created || 0
        periodData[periodKey].resolved += periodStats.resolved || 0
        
        // Status aggregation
        statusTotals.resolved += periodStats.resolved || 0
        statusTotals.inProgress += periodStats.inProgress || 0
        statusTotals.new += periodStats.new || 0
        statusTotals.notFix += periodStats.notFix || 0
        
        // Bug type aggregation
        Object.entries(periodStats).forEach(([key, value]) => {
          if (['Functional', 'UI', 'Performance', 'Security', 'Integration', 'Unknown'].includes(key)) {
            bugTypeTotals[key] = (bugTypeTotals[key] || 0) + (value || 0)
          }
          
          if (['CodeError', 'DesignIssue', 'Configuration', 'DataIssue', 'RequirementGap', 'ExternalDependency'].includes(key)) {
            rootCauseTotals[key] = (rootCauseTotals[key] || 0) + (value || 0)
          }
        })
      })
    })
    
    // Sort periods chronologically
    const sortedPeriods = Object.keys(periodData).sort()
    
    return {
      timeSeries: {
        labels: sortedPeriods,
        created: sortedPeriods.map(period => periodData[period].created),
        resolved: sortedPeriods.map(period => periodData[period].resolved)
      },
      status: {
        labels: ['Resolved', 'In Progress', 'New', 'Not Fix'],
        data: [statusTotals.resolved, statusTotals.inProgress, statusTotals.new, statusTotals.notFix],
        colors: ['#10b981', '#f59e0b', '#3b82f6', '#ef4444']
      },
      bugTypes: {
        labels: Object.keys(bugTypeTotals),
        data: Object.values(bugTypeTotals),
        colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#6b7280']
      },
      rootCauses: {
        labels: Object.keys(rootCauseTotals),
        data: Object.values(rootCauseTotals),
        colors: ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#6b7280']
      }
    }
  }, [filteredData, timeframe])
  
  // Calculate summary stats
  const summaryStats = useMemo(() => {
    if (!chartData) return null
    
    const totalCreated = chartData.timeSeries.created.reduce((sum, val) => sum + val, 0)
    const totalResolved = chartData.status.data[0] // Resolved count
    const totalInProgress = chartData.status.data[1] // In Progress count
    const resolutionRate = totalCreated > 0 ? Math.round((totalResolved / totalCreated) * 100) : 0
    
    return {
      totalBugs: totalCreated,
      resolved: totalResolved,
      inProgress: totalInProgress,
      resolutionRate
    }
  }, [chartData])
  
  if (isLoading) {
    return (
      <Card className="mt-4">
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-48">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-600">Loading bug analysis...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }
  
  if (error) {
    return (
      <Card className="mt-4">
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }
  
  if (!chartData) {
    return (
      <Card className="mt-4">
        <CardContent className="p-6">
          <p className="text-gray-600">No bug analysis data available</p>
        </CardContent>
      </Card>
    )
  }
  
  // Chart configurations
  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      title: { display: false }
    },
    scales: {
      y: { beginAtZero: true }
    }
  }
  
  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'right' }
    }
  }
  
  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    },
    scales: {
      y: { beginAtZero: true }
    }
  }
  
  return (
    <div className="mt-4 space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Bug className="w-5 h-5 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Total Bugs</p>
                <p className="text-2xl font-semibold text-gray-900">{summaryStats.totalBugs}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Resolved</p>
                <p className="text-2xl font-semibold text-gray-900">{summaryStats.resolved}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">In Progress</p>
                <p className="text-2xl font-semibold text-gray-900">{summaryStats.inProgress}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Percent className="w-5 h-5 text-purple-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Resolution Rate</p>
                <p className="text-2xl font-semibold text-gray-900">{summaryStats.resolutionRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line Chart: Created vs Resolved */}
        <Card>
          <CardHeader>
            <CardTitle>Bugs Created vs Resolved</CardTitle>
            <p className="text-sm text-gray-500">{timeframe}ly trend from JSON data</p>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <Line
                data={{
                  labels: chartData.timeSeries.labels,
                  datasets: [
                    {
                      label: 'Created',
                      data: chartData.timeSeries.created,
                      borderColor: '#ef4444',
                      backgroundColor: 'rgba(239, 68, 68, 0.1)',
                      tension: 0.4,
                      fill: true
                    },
                    {
                      label: 'Resolved',
                      data: chartData.timeSeries.resolved,
                      borderColor: '#10b981',
                      backgroundColor: 'rgba(16, 185, 129, 0.1)',
                      tension: 0.4,
                      fill: true
                    }
                  ]
                }}
                options={lineChartOptions}
              />
            </div>
          </CardContent>
        </Card>
        
        {/* Pie Chart: Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Bug Status Distribution</CardTitle>
            <p className="text-sm text-gray-500">Current status breakdown</p>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <Pie
                data={{
                  labels: chartData.status.labels,
                  datasets: [{
                    data: chartData.status.data,
                    backgroundColor: chartData.status.colors,
                    borderWidth: 2,
                    borderColor: '#ffffff'
                  }]
                }}
                options={pieChartOptions}
              />
            </div>
          </CardContent>
        </Card>
        
        {/* Pie Chart: Bug Types */}
        <Card>
          <CardHeader>
            <CardTitle>Bug Type Distribution</CardTitle>
            <p className="text-sm text-gray-500">Types from customfield_10271</p>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <Pie
                data={{
                  labels: chartData.bugTypes.labels,
                  datasets: [{
                    data: chartData.bugTypes.data,
                    backgroundColor: chartData.bugTypes.colors,
                    borderWidth: 2,
                    borderColor: '#ffffff'
                  }]
                }}
                options={pieChartOptions}
              />
            </div>
          </CardContent>
        </Card>
        
        {/* Bar Chart: Root Causes */}
        <Card>
          <CardHeader>
            <CardTitle>Root Cause Analysis</CardTitle>
            <p className="text-sm text-gray-500">From customfield_10272</p>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <Bar
                data={{
                  labels: chartData.rootCauses.labels,
                  datasets: [{
                    label: 'Bug Count',
                    data: chartData.rootCauses.data,
                    backgroundColor: chartData.rootCauses.colors,
                    borderRadius: 4
                  }]
                }}
                options={barChartOptions}
              />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Raw JSON Data Toggle */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Raw JSON Data</CardTitle>
              <p className="text-sm text-gray-500">Data structure powering the charts above</p>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowJsonData(!showJsonData)}
            >
              {showJsonData ? <ChevronUp className="w-4 h-4 mr-1" /> : <ChevronDown className="w-4 h-4 mr-1" />}
              {showJsonData ? 'Hide' : 'Show'} JSON
            </Button>
          </div>
        </CardHeader>
        {showJsonData && (
          <CardContent>
            <pre className="bg-gray-50 p-4 rounded-lg overflow-auto max-h-96 text-xs">
              {JSON.stringify(filteredData, null, 2)}
            </pre>
          </CardContent>
        )}
      </Card>
    </div>
  )
}

export default BugAnalysisChartsPanel