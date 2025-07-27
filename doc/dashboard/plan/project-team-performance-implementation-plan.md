# Project Team Performance Chart Implementation Plan

## Overview

This document outlines the implementation plan for a new "Project Team Performance" chart component that displays individual developer contributions when a single project is selected in the Developer Quality Dashboard.

## Current State Analysis

### Single Project Selection Flow

1. **Filter Panel Detection** (`FilterPanel.jsx:39-47`)
   - Detects single project: `filters?.projects?.length === 1`
   - Shows performance controls (target lines toggle, performance filter)
   - Uses dedicated `setProjectFilters` method from store

2. **Store Management** (`developerQualityStore.js:92-113`)
   - Special handling for project filter changes
   - Forces cache invalidation
   - Triggers immediate data recalculation

3. **Data Flow to Components**
   ```
   DeveloperQualityDashboard
   ├── filteredData (from useDeveloperQualityFilters hook)
   │   ├── filteredMetrics
   │   │   ├── teamContribution
   │   │   ├── bugAnalysis
   │   │   ├── rootCauseAnalysis
   │   │   └── bugRateAnalysis ← [Our data source]
   │   └── filteredChartData
   └── filters (including projects array)
   ```

### Pre-processed Data Structure

The `bugRateAnalysis` object contains:
```javascript
{
  developers: [
    {
      developer: "John Doe",
      totalIssues: 45,
      bugs: 5,
      bugRate: 11.11,
      totalStoryPoints: 250,  // ← We'll use this
      projects: ["PROJ1"],
      severityBreakdown: { ... },
      // ... other pre-calculated metrics
    },
    // ... more developers
  ],
  teamAverage: 12.5,
  benchmarks: { ... }
}
```

## Component Architecture

### Component Name: ProjectTeamPerformance

**Location**: `/src/features/developer-quality-dashboard/components/ProjectTeamPerformance/`

### Key Features

1. **Bar Chart Display**
   - X-axis: Developer names
   - Y-axis: Total Story Points
   - Uses react-chartjs-2 library

2. **Conditional Rendering**
   - Only displays when `filters.projects.length === 1`
   - Shows project-specific team performance

3. **Performance Features**
   - Target lines based on project type (HOURS_BASE vs STORYPOINT_BASE)
   - Performance filtering (all/under/over target)
   - Responsive to filter changes

### Data Inheritance (No Reprocessing)

```jsx
// Component receives pre-processed data from TeamContributionChart
<ProjectTeamPerformance
  data={filteredData.filteredChartData.teamContributionChart}
  filters={filters}
  showTargetLines={performanceControls.showTargetLines}
  performanceFilter={performanceControls.performanceFilter}
/>
```

**Important**: The component uses the SAME data source as TeamContributionChart. It:
- Aggregates story points by developer from time-series data
- Transforms stacked chart data into individual developer bars
- Uses exact same filtering and project selection logic
- No data reprocessing - just different visualization

## Implementation Details

### 1. Chart Configuration (Following .cursorrules)

```javascript
// REQUIRED: Register only needed Chart.js components
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import { Bar } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

// Inside component - REQUIRED: useMemo for chart data
const chartData = useMemo(() => ({
  labels: data.developers.map(dev => dev.developer),
  datasets: [{
    label: 'Total Story Points',
    data: data.developers.map(dev => dev.totalStoryPoints),
    backgroundColor: '#1976d2',
    borderColor: '#1565c0',
    borderWidth: 1
  }]
}), [data.developers])

// REQUIRED: useMemo for chart options
const chartOptions = useMemo(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    title: { display: false },
    legend: { position: 'top' }
  },
  scales: {
    y: {
      beginAtZero: true,
      title: {
        display: true,
        text: 'Story Points'
      }
    }
  }
}), [])
```

### 2. Target Lines Logic

Based on project configuration in `memberConfiguration.js`:

**HOURS_BASE Projects**:
- Single target line
- Values: 35 (week), 140 (month), 420 (quarter)

**STORYPOINT_BASE Projects**:
- Two target lines (middle/senior)
- Middle: 25 (week), 100 (month), 300 (quarter)
- Senior: 30 (week), 120 (month), 360 (quarter)

### 3. Performance Filtering (Following .cursorrules)

```javascript
// REQUIRED: useCallback for memoized functions
const getFilteredDevelopers = useCallback((developers, performanceFilter, targetValue) => {
  if (performanceFilter === 'all') return developers;
  
  return developers.filter(dev => {
    const performance = dev.totalStoryPoints;
    if (performanceFilter === 'under') {
      return performance < targetValue;
    } else if (performanceFilter === 'over') {
      return performance >= targetValue;
    }
    return true;
  });
}, []);
```

### 4. Component Props Interface

```javascript
ProjectTeamPerformance.propTypes = {
  data: PropTypes.shape({
    developers: PropTypes.arrayOf(PropTypes.shape({
      developer: PropTypes.string.isRequired,
      totalStoryPoints: PropTypes.number.isRequired,
      // ... other fields used for filtering
    })).isRequired,
    teamAverage: PropTypes.number,
    benchmarks: PropTypes.object
  }).isRequired,
  filters: PropTypes.shape({
    projects: PropTypes.arrayOf(PropTypes.string).isRequired,
    timeframe: PropTypes.oneOf(['week', 'month', 'quarter'])
  }).isRequired,
  showTargetLines: PropTypes.bool,
  performanceFilter: PropTypes.oneOf(['all', 'under', 'over'])
}
```

## Integration Plan

### 1. Update DeveloperQualityDashboard.jsx

Add after TeamContributionChart (around line 318):

```jsx
{/* Project Team Performance - Shows when single project selected */}
{filters?.projects?.length === 1 && (
  <Grid item xs={12} md={6}>
    <ProjectTeamPerformance
      data={filteredData.filteredChartData.teamContributionChart}
      filters={filters}
      showTargetLines={performanceControls.showTargetLines}
      performanceFilter={performanceControls.performanceFilter}
    />
  </Grid>
)}
```

**Note**: Using responsive Grid sizing `xs={12} md={6}` per .cursorrules requirements. Uses same data source as TeamContributionChart for consistency.

### 2. Component Structure (Following .cursorrules)

```
src/features/developer-quality-dashboard/components/ProjectTeamPerformance/
├── ProjectTeamPerformance.jsx  // Main component (MUST be .jsx)
├── index.js                     // Export file
└── __tests__/                   // Unit tests
    └── ProjectTeamPerformance.test.jsx
```

### 3. Component Template (Following .cursorrules)

```javascript
// ProjectTeamPerformance.jsx
import React, { useMemo, useCallback } from 'react'
import PropTypes from 'prop-types'
import { Box, Paper, Typography } from '@mui/material'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import { Bar } from 'react-chartjs-2'
import { memberConfiguration } from '../../../../constants/memberConfiguration'

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const ProjectTeamPerformance = React.memo(({
  data,
  filters,
  showTargetLines = false,
  performanceFilter = 'all',
  height = 400
}) => {
  // 1. Hooks first
  const selectedProject = useMemo(() => {
    return filters?.projects?.[0] || null
  }, [filters?.projects])
  
  // 2. Memoized values
  const projectConfig = useMemo(() => {
    if (!selectedProject) return null
    return memberConfiguration.projects.find(p => 
      p.key === selectedProject || p.name === selectedProject
    )
  }, [selectedProject])
  
  // 3. Callbacks
  const getFilteredDevelopers = useCallback((developers) => {
    // Implementation here
  }, [performanceFilter, projectConfig])
  
  // 4. Early returns
  if (!data?.developers || data.developers.length === 0) {
    return (
      <Paper elevation={1} sx={{ p: { xs: 2, sm: 3 }, width: '100%' }}>
        <Typography variant="h6" color="text.secondary">
          Project Team Performance - No Data Available
        </Typography>
      </Paper>
    )
  }
  
  // 5. Render
  return (
    <Paper elevation={1} sx={{ p: { xs: 2, sm: 3 }, width: '100%' }}>
      {/* Chart implementation */}
    </Paper>
  )
})

// REQUIRED: PropTypes
ProjectTeamPerformance.propTypes = {
  data: PropTypes.shape({
    developers: PropTypes.arrayOf(PropTypes.shape({
      developer: PropTypes.string.isRequired,
      totalStoryPoints: PropTypes.number.isRequired
    })).isRequired,
    teamAverage: PropTypes.number,
    benchmarks: PropTypes.object
  }).isRequired,
  filters: PropTypes.shape({
    projects: PropTypes.arrayOf(PropTypes.string).isRequired,
    timeframe: PropTypes.oneOf(['week', 'month', 'quarter'])
  }).isRequired,
  showTargetLines: PropTypes.bool,
  performanceFilter: PropTypes.oneOf(['all', 'under', 'over']),
  height: PropTypes.number
}

export default ProjectTeamPerformance
```

## Technical Specifications

### Dependencies
- react-chartjs-2 (already in project)
- @mui/material (for styling)
- memberConfiguration (for project config and developer levels)

### Performance Considerations (Following .cursorrules)

1. **REQUIRED Optimizations**:
   - `React.memo()` wrapper for component ✓
   - `useMemo()` for chart data and options ✓
   - `useCallback()` for all functions ✓
   - Memoized filtering logic ✓

2. **Responsive Design** (REQUIRED):
   ```javascript
   // Mobile-first with theme breakpoints
   <Box sx={{
     height: { xs: 300, sm: 350, md: 400 },
     p: { xs: 1, sm: 2, md: 3 }
   }}>
   ```

3. **Styling Rules** (MANDATORY):
   - Use `sx` prop only (NO style/className) ✓
   - Use theme values for colors/spacing ✓
   - Maximum 3 levels of nesting ✓

### Error Handling
- Handle empty data gracefully
- Show meaningful messages when no data available
- Validate props with PropTypes

## Testing Strategy (Following .cursorrules)

### 1. Unit Test Template

```javascript
// ProjectTeamPerformance.test.jsx
import React from 'react'
import { render, screen } from '@testing-library/react'
import { ThemeProvider } from '@mui/material/styles'
import theme from '../../../../../../theme'
import ProjectTeamPerformance from '../ProjectTeamPerformance'

// REQUIRED: renderWithTheme helper
const renderWithTheme = (component) => 
  render(<ThemeProvider theme={theme}>{component}</ThemeProvider>)

const mockData = {
  developers: [
    { developer: 'John Doe', totalStoryPoints: 150 },
    { developer: 'Jane Smith', totalStoryPoints: 120 }
  ],
  teamAverage: 135,
  benchmarks: {}
}

const mockFilters = {
  projects: ['PROJ1'],
  timeframe: 'month'
}

describe('ProjectTeamPerformance', () => {
  it('renders without crashing', () => {
    renderWithTheme(
      <ProjectTeamPerformance data={mockData} filters={mockFilters} />
    )
  })
  
  it('displays correct title', () => {
    renderWithTheme(
      <ProjectTeamPerformance data={mockData} filters={mockFilters} />
    )
    expect(screen.getByText(/Project Team Performance/i)).toBeInTheDocument()
  })
  
  it('shows no data message when developers array is empty', () => {
    const emptyData = { ...mockData, developers: [] }
    renderWithTheme(
      <ProjectTeamPerformance data={emptyData} filters={mockFilters} />
    )
    expect(screen.getByText(/No Data Available/i)).toBeInTheDocument()
  })
})
```

### 2. Test Coverage Requirements
- Component renders correctly ✓
- Chart displays proper data ✓
- Target lines calculate correctly ✓
- Performance filtering works ✓
- Responsive behavior ✓
- Memoization effectiveness ✓

## Implementation Checklist (Updated per .cursorrules)

- [ ] Create component file structure in `/src/features/developer-quality-dashboard/components/`
- [ ] Use `.jsx` extension for component file (MANDATORY)
- [ ] Implement `React.memo()` wrapper (MANDATORY)
- [ ] Add `PropTypes` validation (MANDATORY)
- [ ] Use `useMemo()` for chart data and options (MANDATORY)
- [ ] Use `useCallback()` for all functions (MANDATORY)
- [ ] Implement responsive design with theme breakpoints
- [ ] Use `sx` prop only (no style/className)
- [ ] Register only needed Chart.js components
- [ ] Create unit tests with `renderWithTheme`
- [ ] Follow exact import order (React → MUI → Internal)
- [ ] Ensure max 3 levels of component nesting
- [ ] Integrate into dashboard with Grid layout
- [ ] Test with real data
- [ ] Verify performance optimizations

## Notes

- The component uses the SAME data source as TeamContributionChart (`filteredChartData.teamContributionChart`)
- Aggregates time-series data by developer to show individual totals
- No data reprocessing - just transforms stacked chart data into individual bars
- Respects all existing filters (project selection, timeframe, status, etc.)
- Perfect complement to the existing stacked chart view

## Key .cursorrules Compliance Points

1. **File Structure**: Component must be in `/src/features/developer-quality-dashboard/components/ProjectTeamPerformance/`
2. **File Extension**: Component file MUST be `.jsx` (not `.js`)
3. **Component Pattern**: MUST use `React.memo()` wrapper
4. **Props Validation**: MUST include `PropTypes` for all props
5. **Performance**: MUST use `useMemo()` and `useCallback()` for optimizations
6. **Styling**: MUST use `sx` prop only (FORBIDDEN: style, className)
7. **Charts**: Use `react-chartjs-2` with selective imports
8. **Responsive**: MUST use theme breakpoints for mobile-first design
9. **Testing**: MUST include tests with `renderWithTheme` helper
10. **Imports**: MUST follow order: React → MUI → Internal (max 2 levels up)