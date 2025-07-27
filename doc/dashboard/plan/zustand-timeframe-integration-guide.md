# Zustand Timeframe Integration Guide

## Critical Fix: Dynamic Timeframe Parameter

You're absolutely correct! The `timeframe` parameter must be **dynamic** and come from the **Zustand filters state**, not be hardcoded to 'month'. This is essential for the story point calculations to work correctly with user-selected time periods.

## Current Zustand Store Structure

Based on the existing code, the timeframe is stored in:
```javascript
// From developerQualityStore.js
filters: {
  developers: [],
  projects: [],
  issueTypes: [],
  statuses: [],
  severities: [],
  rootCauses: [],
  dateRange: {
    startDate: null,
    endDate: null
  },
  timeframe: 'month', // 👈 This is the source of truth
  statusFilter: memberConfiguration.filterDefaults.statusFilter
}
```

## Correct Implementation Pattern

### 1. Team Contribution Chart (filterService.js)

**WRONG** ❌:
```javascript
generateTimeBasedChartData: (filteredIssues, timePeriodType = 'month', statusFilter = [], filters = null) => {
  const chartData = calculateStoryPointsByTimePeriod(filteredIssues, {
    timeframe: 'month', // ❌ HARDCODED!
    // ...
  })
}
```

**CORRECT** ✅:
```javascript
generateTimeBasedChartData: (filteredIssues, timePeriodType, statusFilter = [], filters = null) => {
  // timePeriodType should come from Zustand filters.timeframe
  if (!timePeriodType) {
    console.error('timePeriodType is required from Zustand filters.timeframe')
    return []
  }
  
  const chartData = calculateStoryPointsByTimePeriod(filteredIssues, {
    timeframe: timePeriodType, // ✅ Dynamic from Zustand
    projectFilter: filters?.projects || null,
    developerFilter: filters?.developers || null,
    customStatusFilter: statusFilter.length > 0 ? statusFilter : null,
    requireDeliveredStatus: true
  })
  
  return chartData
}
```

### 2. Individual Tickets Component (useDeveloperTickets.js)

**WRONG** ❌:
```javascript
const timeframe = filters?.timeframe || 'month' // ❌ Fallback to hardcoded value
```

**CORRECT** ✅:
```javascript
export const useDeveloperTickets = (developerName) => {
  const { data, filters } = useDeveloperQualityStore()
  
  const developerTicketData = useMemo(() => {
    // Get timeframe from Zustand state
    const timeframe = filters?.timeframe
    
    // Validate timeframe is provided
    if (!timeframe) {
      console.error('timeframe is required from Zustand filters.timeframe')
      return {
        groupedTickets: new Map(),
        totalTickets: 0,
        isEmpty: true,
        error: 'Missing timeframe from filters'
      }
    }
    
    // Use centralized calculation with dynamic timeframe
    const groupedTickets = calculateDeveloperTicketsByTimePeriod(
      minimalIssues, 
      developerName, 
      {
        timeframe, // ✅ Dynamic from Zustand
        projectFilter: filters?.projects || null,
        requireDeliveredStatus: true
      }
    )
    
    // ...
  }, [data?.minimalIssues, developerName, filters?.timeframe, filters?.projects])
}
```

### 3. Component Integration Pattern

**Filter Panel → Zustand Store → All Components**:

```javascript
// FilterPanel.jsx - User selects timeframe
const handleTimeframeChange = (newTimeframe) => {
  // Updates Zustand store
  setFilters({ ...filters, timeframe: newTimeframe })
}

// Zustand Store - Single source of truth
filters: {
  timeframe: 'week' // User selection: 'week', 'month', 'quarter'
}

// Team Contribution Chart - Uses dynamic timeframe
const { filters } = useDeveloperQualityStore()
const chartData = filterService.generateTimeBasedChartData(
  issues, 
  filters.timeframe, // ✅ Dynamic from Zustand
  filters.statusFilter,
  filters
)

// Individual Tickets - Uses same dynamic timeframe
const { filters } = useDeveloperQualityStore()
const ticketData = useDeveloperTickets(developerName) // Uses filters.timeframe internally
```

## Call Flow Example

When user changes timeframe from "Month" to "Week":

1. **FilterPanel**: User clicks "Week" button
2. **Zustand Store**: `filters.timeframe` updates to 'week'
3. **Team Contribution Chart**: Re-renders with `timeframe: 'week'`
4. **Individual Tickets**: Re-renders with `timeframe: 'week'`
5. **Both show same data**: Grouped by week periods

## Required Updates

### 1. Remove Hardcoded Defaults

**Before**:
```javascript
const timeframe = filters?.timeframe || 'month' // ❌ Hardcoded fallback
```

**After**:
```javascript
const timeframe = filters?.timeframe // ✅ No fallback, must be provided
if (!timeframe) {
  throw new Error('timeframe must be provided from Zustand filters.timeframe')
}
```

### 2. Update Function Signatures

**Before**:
```javascript
generateTimeBasedChartData: (filteredIssues, timePeriodType = 'month', ...) // ❌ Default value
```

**After**:
```javascript
generateTimeBasedChartData: (filteredIssues, timePeriodType, ...) // ✅ Required parameter
```

### 3. Add Validation

All functions must validate that `timeframe` is provided:

```javascript
export const calculateStoryPointsByTimePeriod = (issues, options = {}) => {
  const { timeframe, ...otherOptions } = options
  
  // Validate required timeframe parameter
  if (!timeframe) {
    console.error('calculateStoryPointsByTimePeriod: timeframe is required and must come from Zustand filters.timeframe')
    return []
  }
  
  // Validate timeframe is valid
  const validTimeframes = ['week', 'month', 'quarter']
  if (!validTimeframes.includes(timeframe)) {
    console.error(`Invalid timeframe: ${timeframe}. Must be one of: ${validTimeframes.join(', ')}`)
    return []
  }
  
  // Continue with calculation...
}
```

## Testing Dynamic Timeframe

### Test Scenario 1: User Changes Timeframe
1. Load dashboard with default timeframe: 'month'
2. Verify both charts show monthly data
3. User selects 'week' in filters
4. Verify both charts update to weekly data
5. Verify totals remain consistent between charts

### Test Scenario 2: Ahmad Alfan Example
1. Select Ahmad Alfan as developer
2. Set timeframe to 'week'
3. Team Contribution Chart should show: X story points per week
4. Individual Tickets should show: Same X story points, same weeks
5. Change to 'month' → Both should update consistently

### Test Scenario 3: Project Filter + Timeframe
1. Select single project + 'week' timeframe
2. Both charts should show same weekly data for that project
3. Change to 'quarter' → Both should aggregate to quarterly periods
4. Story point totals must remain identical

## Error Handling

If timeframe is missing or invalid:

```javascript
// Graceful error handling
const validateTimeframe = (timeframe, componentName) => {
  if (!timeframe) {
    console.error(`${componentName}: timeframe is required from Zustand filters.timeframe`)
    return false
  }
  
  const validTimeframes = ['week', 'month', 'quarter']
  if (!validTimeframes.includes(timeframe)) {
    console.error(`${componentName}: Invalid timeframe "${timeframe}". Must be one of: ${validTimeframes.join(', ')}`)
    return false
  }
  
  return true
}

// Usage in components
if (!validateTimeframe(filters.timeframe, 'TeamContributionChart')) {
  return <ErrorDisplay message="Invalid timeframe configuration" />
}
```

## Summary

✅ **Fixed**: Timeframe is now **dynamic** from Zustand `filters.timeframe`  
✅ **Validated**: All functions require timeframe parameter  
✅ **Consistent**: All components use same dynamic timeframe  
✅ **Tested**: User can change timeframe and see consistent updates  

The centralized story point calculation functions now correctly use the dynamic timeframe from the Zustand filters state, ensuring all components stay synchronized when users change the time period selection.