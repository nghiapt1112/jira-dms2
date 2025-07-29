# Bug Status Chart Implementation Plan

## 🎯 Overview

Create a new Bug Status chart that inherits from the Developer Quality Dashboard's sophisticated caching and processing architecture. The chart will display bug status trends over time periods (week, month, quarter) with proper project-based filtering and IndexedDB caching.

## 📊 Chart Specifications

### Chart Type
- **Line Chart** using react-chartjs-2 (consistent with Developer Quality Dashboard)
- Multiple lines representing different bug statuses
- Responsive design with proper mobile/desktop breakpoints

### Data Display
- **Y-Axis**: Total bugs count for each status category
- **X-Axis**: Time periods (week names, month names, quarter names)
- **Lines**: 4 **fixed** bug status categories (UI display):
  - New (Blue #1976d2)
  - In Progress/WIP (Orange #ff9800) 
  - Resolved (Green #2e7d32)
  - Not Fixed (Red #d32f2f)
- **Background Status Mapping**: Configurable per project via `memberConfiguration.js` BUG_STATUS_MAPPING

### Interactive Features
- **Tooltips**: Show detailed breakdown on hover
  - Title: Date range in DD/MM/YYYY format
  - Values: Count for each status with percentages
- **Project Filtering**: Re-render based on selected projects
- **Time Period Toggle**: Week/Month/Quarter switching

### Integration Scope
- **Team Tab Only**: Chart will be integrated into the Team tab initially
- **Future Enhancement**: Can be extended to Developer tab if needed

## 🏗️ Architecture Design

### 1. Component Structure
```
src/features/developer-quality-dashboard/components/BugStatusChart/
├── BugStatusChart.jsx           # Main chart component
├── index.js                     # Export file
├── __tests__/
│   └── BugStatusChart.test.jsx  # Comprehensive test suite
└── README.md                    # Component documentation
```

### 2. Data Flow Integration

#### Inherit from Developer Quality Dashboard
- **Single Processing Loop**: Extend `developerQualityService.js` to include bug status processing
- **IndexedDB Caching**: Store bug status data in existing granular IndexedDB structure
- **Filter Integration**: Use existing `filterService.js` for project-based filtering
- **Time Period Handling**: Leverage existing `timeUtils.js` for period calculations

#### Data Processing Pipeline
```
Raw JIRA Issues (Bugs only)
    ↓
Filter: issueType === 'Bug'
    ↓
Process with bugCategorization.js (uses memberConfiguration.js BUG_STATUS_MAPPING)
    ↓
Group by: Project + TimePeriod + Status Category (4 fixed UI categories)
    ↓
Cache in IndexedDB
    ↓
Apply Filters (Projects, TimePeriod)
    ↓
Generate Chart Data
```

### 3. Data Structure Design

#### IndexedDB Cache Structure
```javascript
// Add to existing CACHE_KEYS in developerQualityIndexedDB.js
CHART_DATA: {
  BUG_STATUS_CHART: 'bug_status_chart'
}

// Data structure
bugStatusChart: {
  config: {
    timePeriod: 'month', // 'week', 'month', 'quarter'
    dateRange: { startDate, endDate },
    lastProcessed: timestamp
  },
  data: {
    byProject: {
      'PROJECT_KEY': {
        byTimePeriod: {
          '2024-01': {
            new: 5,
            inProgress: 3, 
            resolved: 12,
            notFixed: 2,
            total: 22,
            // Additional metadata for tooltips
            dateRange: {
              start: '2024-01-01',
              end: '2024-01-31',
              formatted: '01/01/2024 - 31/01/2024'
            }
          }
        }
      }
    },
    // Aggregated across all projects
    aggregated: {
      '2024-01': { new: 15, inProgress: 8, resolved: 35, notFixed: 7, total: 65 }
    }
  }
}
```

#### Processing Data Structure
```javascript
// Extend existing metrics in developerQualityService.js
metrics.bugStatusAnalysis = {
  byProject: Map, // projectKey -> Map(timePeriod -> statusCounts)
  aggregated: Map, // timePeriod -> statusCounts
  totalBugs: number,
  statusBreakdown: {
    new: number,
    inProgress: number, 
    resolved: number,
    notFixed: number
  }
}
```

## 🔧 Implementation Details

### 1. Data Processing Extension

#### Extend Developer Quality Service
```javascript
// In src/features/developer-quality-dashboard/services/developerQualityService.js

processBugStatusMetrics: (issue, index, data) => {
  // Only process Bug type issues
  const issueType = issue.fields?.issuetype?.name || issue.issueType
  if (issueType !== 'Bug') return

  const projectKey = issue.fields?.project?.key || issue.project
  const status = issue.fields?.status?.name || issue.status
  
  // Use existing bugCategorization utility
  const statusCategory = categorizeBugStatus(status)
  
  // Process for different time periods
  const dates = {
    created: issue.fields?.created || issue.created,
    updated: issue.fields?.updated || issue.updated,
    resolved: issue.fields?.resolutiondate || issue.resolved
  }
  
  // Use appropriate date based on status
  const relevantDate = getRelevantDateForBugStatus(dates, statusCategory)
  
  if (relevantDate) {
    ['week', 'month', 'quarter'].forEach(period => {
      const periodKey = getTimePeriodKey(relevantDate, period)
      
      // Update project-specific metrics
      updateBugStatusMetrics(data.metrics.bugStatusAnalysis.byProject, 
                           projectKey, periodKey, statusCategory)
      
      // Update aggregated metrics  
      updateBugStatusMetrics(data.metrics.bugStatusAnalysis.aggregated,
                           null, periodKey, statusCategory)
    })
  }
}
```

#### Date Logic for Bug Status
```javascript
// Determine which date to use based on bug status category
// Following user specifications for date precedence
const getRelevantDateForBugStatus = (dates, statusCategory) => {
  switch (statusCategory) {
    case 'resolved':
    case 'notFixed':
      // Use resolutionDate first, fallback to updated
      return dates.resolved || dates.updated
    case 'new':
      // Use created first, fallback to updated
      return dates.created || dates.updated
    case 'inProgress':
    default:
      // All others use updated (JIRA sets updated == created for new issues)
      return dates.updated
  }
}
```

### 2. Chart Component Implementation

#### Component Structure
```javascript
// src/features/developer-quality-dashboard/components/BugStatusChart/BugStatusChart.jsx

import React, { useMemo } from 'react'
import PropTypes from 'prop-types'
import { Box, Paper, Typography } from '@mui/material'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'

// Register Chart.js components (following .cursorrules for tree-shaking)
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

const BugStatusChart = React.memo(({
  filteredData,
  filters,
  height = 400,
  title = 'Bug Status Trends'
}) => {
  // 1. Hooks
  const { timeframe } = useDeveloperQualityFilters()
  
  // 2. Memoized chart data
  const chartData = useMemo(() => {
    return transformBugStatusDataForChart(filteredData, filters, timeframe)
  }, [filteredData, filters, timeframe])
  
  // 3. Memoized chart config
  const chartConfig = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      tooltip: {
        callbacks: {
          title: (context) => formatTooltipTitle(context, timeframe),
          label: (context) => formatTooltipLabel(context)
        }
      }
    },
    scales: {
      x: { title: { display: true, text: getXAxisLabel(timeframe) } },
      y: { title: { display: true, text: 'Number of Bugs' } }
    }
  }), [timeframe])
  
  // 4. Render
  return (
    <Paper elevation={1} sx={{ p: 2, height }}>
      <Typography variant="h6" sx={{ mb: 2 }}>{title}</Typography>
      <Box sx={{ height: height - 80 }}>
        <Line data={chartData} options={chartConfig} />
      </Box>
    </Paper>
  )
})
```

### 3. Data Transformation Utilities

#### Chart Data Transformer
```javascript
// src/features/developer-quality-dashboard/utils/bugStatusChartUtils.js

export const transformBugStatusDataForChart = (filteredData, filters, timeframe) => {
  const bugStatusData = filteredData?.filteredChartData?.bugStatusChart
  if (!bugStatusData?.data) return null
  
  // Apply project filtering
  const projectFilter = filters?.projects || []
  const dataToUse = projectFilter.length > 0 
    ? getProjectFilteredData(bugStatusData.data, projectFilter)
    : bugStatusData.data.aggregated
    
  // Transform to Chart.js format
  return {
    labels: Array.from(dataToUse.keys()).sort(),
    datasets: [
      {
        label: 'New',
        data: Array.from(dataToUse.entries()).map(([_, values]) => values.new || 0),
        borderColor: '#1976d2',
        backgroundColor: 'rgba(25, 118, 210, 0.1)',
        tension: 0.1
      },
      {
        label: 'In Progress', 
        data: Array.from(dataToUse.entries()).map(([_, values]) => values.inProgress || 0),
        borderColor: '#ff9800',
        backgroundColor: 'rgba(255, 152, 0, 0.1)',
        tension: 0.1
      },
      {
        label: 'Resolved',
        data: Array.from(dataToUse.entries()).map(([_, values]) => values.resolved || 0), 
        borderColor: '#2e7d32',
        backgroundColor: 'rgba(46, 125, 50, 0.1)',
        tension: 0.1
      },
      {
        label: 'Not Fixed',
        data: Array.from(dataToUse.entries()).map(([_, values]) => values.notFixed || 0),
        borderColor: '#d32f2f', 
        backgroundColor: 'rgba(211, 47, 47, 0.1)',
        tension: 0.1
      }
    ]
  }
}
```

### 4. Tooltip Formatting

#### Date Range Formatting (DRY with dateUtils.js)
```javascript
// Extend src/shared/utils/dateUtils.js with new function
export const formatTooltipDateRange = (periodKey, timeframe) => {
  switch (timeframe) {
    case 'week': {
      const weekRange = getWeekDateRange(periodKey)
      return `${formatDateDDMMYYYY(weekRange.startDate)} - ${formatDateDDMMYYYY(weekRange.endDate)}`
    }
    case 'quarter': {
      const [year, quarter] = periodKey.split('-Q')
      const startMonth = (parseInt(quarter) - 1) * 3 + 1
      const endMonth = startMonth + 2
      const startDate = new Date(year, startMonth - 1, 1)
      const endDate = new Date(year, endMonth, 0)
      return `${formatDateDDMMYYYY(startDate)} - ${formatDateDDMMYYYY(endDate)}`
    }
    case 'month':
    default: {
      const [year, month] = periodKey.split('-')
      const startDate = new Date(year, month - 1, 1)
      const endDate = new Date(year, month, 0)
      return `${formatDateDDMMYYYY(startDate)} - ${formatDateDDMMYYYY(endDate)}`
    }
  }
}
```

## 🔄 Integration Points

### 1. Filter Service Extension
```javascript
// Extend src/features/developer-quality-dashboard/services/filterService.js

recalculateChartDataFromIndices: (resultIndices, cacheData, timeframe) => {
  return {
    // ... existing chart data
    bugStatusChart: filterService.calculateBugStatusChartData(resultIndices, cacheData, timeframe)
  }
}
```

### 2. IndexedDB Cache Keys Extension
```javascript
// In src/features/developer-quality-dashboard/services/developerQualityIndexedDB.js
CHART_DATA: {
  // ... existing keys
  BUG_STATUS_CHART: 'bug_status_chart'
}
```

### 3. Store Integration
```javascript
// The chart will automatically use existing store state and filters
// No additional store modifications needed due to proper architecture inheritance
```

## 🧪 Testing Strategy

### 1. Unit Tests
- Component rendering with different data states
- Chart data transformation utilities
- Tooltip formatting functions
- Date range calculations
- Filter integration

### 2. Integration Tests  
- Data processing pipeline
- IndexedDB caching operations
- Filter state changes
- Time period switching

### 3. Performance Tests
- Large dataset rendering
- Cache hit/miss scenarios
- Memory usage validation
- Filter response times

## 📋 Implementation Checklist

### Phase 1: Data Processing
- [ ] Extend `developerQualityService.js` with bug status processing
- [ ] Add bug status metrics to data structure
- [ ] Implement date logic for different bug statuses
- [ ] Add IndexedDB cache keys and storage logic

### Phase 2: Chart Component  
- [ ] Create `BugStatusChart.jsx` component
- [ ] Implement chart data transformation utilities
- [ ] Add tooltip formatting with date ranges
- [ ] Integrate with existing filter system

### Phase 3: Integration
- [ ] Extend filter service for bug status data
- [ ] Add chart to Team tab in Developer Quality Dashboard
- [ ] Implement project-based filtering
- [ ] Add time period switching support

### Phase 4: Testing & Polish
- [ ] Write comprehensive unit tests
- [ ] Add integration tests
- [ ] Performance validation
- [ ] Documentation and README

## ⚡ Performance Considerations

### Caching Strategy
- **Single Processing**: Bug status data processed once during initial data load
- **Granular Storage**: Project-specific data cached separately for efficient filtering  
- **Memory Optimization**: Use indices and minimal data structures
- **Cache Invalidation**: Automatic cache refresh on data updates

### Rendering Optimization
- **React.memo**: Prevent unnecessary re-renders
- **useMemo**: Cache expensive calculations
- **useCallback**: Optimize event handlers  
- **Chart.js Configuration**: Optimize chart plugins and interactions

## 🎨 UI/UX Design

### Visual Design
- Clean, minimal interface following MUI design system
- Consistent with existing Developer Quality Dashboard
- Proper spacing using theme.spacing
- Responsive grid layout

### Accessibility
- Proper ARIA labels for chart elements
- Keyboard navigation support
- High contrast color scheme
- Screen reader compatible tooltips

### Mobile Responsiveness
- Responsive chart sizing
- Touch-optimized tooltips
- Collapsible legend on small screens
- Optimized for different screen sizes

---

## 🔄 Future Enhancements

1. **Export Functionality**: Add chart export to PNG/PDF
2. **Advanced Filtering**: Add severity-based filtering
3. **Drill-down Capability**: Click to view detailed bug list
4. **Comparison Mode**: Compare multiple projects side-by-side
5. **Trend Analysis**: Add trend indicators and predictions
6. **Custom Date Ranges**: Support for custom date range selection

This implementation plan ensures the new Bug Status chart will be fully integrated with the existing Developer Quality Dashboard architecture while maintaining high performance, proper caching, and excellent user experience. 