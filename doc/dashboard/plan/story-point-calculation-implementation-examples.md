# Story Point Calculation Implementation Examples

This document provides specific implementation examples for updating each component to use the centralized story point calculation function.

## Overview

All components must be updated to use the centralized functions from `src/shared/utils/storyPointCalculations.js` to ensure consistent data across the dashboard.

## 1. Team Contribution Chart Update

### Current Implementation (filterService.js)

**File**: `src/features/developer-quality-dashboard/services/filterService.js`

**Current Code** (lines 179-254):
```javascript
generateTimeBasedChartData: (filteredIssues, timePeriodType = 'month', statusFilter = [], filters = null) => {
  const timeBasedData = new Map()
  
  // Apply project filter if specified
  let issuesToProcess = filteredIssues
  if (filters && filters.projects && filters.projects.length > 0) {
    const projectSet = new Set(filters.projects)
    issuesToProcess = filteredIssues.filter(issue => projectSet.has(issue.project))
  }
  
  let skippedCount = { unassigned: 0, noStoryPoints: 0, statusFilter: 0, processed: 0 }
  
  issuesToProcess.forEach(issue => {
    const assignee = issue.assignee || 'Unassigned'
    const storyPoints = issue.storyPoints || 0
    // API doesn't provide 'updated' field, use 'created' as primary date field
    const updated = issue.created || issue.resolved
    const status = issue.status
    
    // Skip if no assignee or story points
    if (assignee === 'Unassigned') {
      skippedCount.unassigned++;
      return;
    }
    if (storyPoints === 0) {
      skippedCount.noStoryPoints++;
      return;
    }
    
    // Apply status filter if provided
    if (statusFilter && statusFilter.length > 0 && !statusFilter.includes(status)) {
      skippedCount.statusFilter++;
      return;
    }
    
    // ... rest of the logic
  })
}
```

### Updated Implementation

```javascript
import { IssueUtils } from '../../../shared/utils/IssueUtils'

generateTimeBasedChartData: (filteredIssues, timePeriodType, statusFilter = [], filters = null) => {
  // CRITICAL: timePeriodType must come from Zustand filters.timeframe, not be hardcoded
  if (!timePeriodType) {
    console.error('timePeriodType is required from Zustand filters.timeframe')
    return []
  }
  
  // Use IssueUtils class method (DRY & SOLID compliant)
  const chartData = IssueUtils.calculateStoryPointsByTimePeriod(
    filteredIssues, 
    timePeriodType, // Dynamic from Zustand filters.timeframe
    {
      projectFilter: filters?.projects || null,
      developerFilter: filters?.developers || null
      // No statusFilter needed - delivered statuses are mandatory
    }
  )
  
  return chartData
}
```

### Key Changes:
1. **Import centralized function**: `calculateStoryPointsByTimePeriod`
2. **Remove manual filtering logic**: All filtering is now handled centrally
3. **Consistent date field**: Now uses `updated || resolved || created` priority
4. **Consistent status filtering**: Uses delivered statuses from configuration

## 2. Individual Tickets Component Update

### Current Implementation (useDeveloperTickets.js)

**File**: `src/features/developer-quality-dashboard/hooks/useDeveloperTickets.js`

**Current Code** (lines 64-84):
```javascript
// Filter tickets by developer, projects, and status from Filter components
const developerTickets = minimalIssues.filter(ticket => {
  // Developer filter (existing)
  if (ticket.assignee !== developerName) return false
  
  // Project filter - respect filters.projects from Filter components
  if (filters.projects && filters.projects.length > 0) {
    // Only show tickets from selected projects
    if (!filters.projects.includes(ticket.project)) return false
  }
  
  // Status filter - exclude specific statuses as mentioned by user
  // User wants "all statuses except: todo, inprogress, rejected"
  const excludedStatuses = ['To Do', 'In Progress', 'Rejected', 'todo', 'inprogress', 'rejected']
  if (ticket.status && excludedStatuses.some(excludedStatus => 
    ticket.status.toLowerCase() === excludedStatus.toLowerCase()
  )) {
    return false
  }
  
  return true
})
```

### Updated Implementation

```javascript
import { 
  calculateDeveloperTicketsByTimePeriod,
  calculateTotalStoryPoints,
  debugStoryPointCalculation
} from '../../../shared/utils/storyPointCalculations'

export const useDeveloperTickets = (developerName) => {
  // Get store state
  const { data, filters } = useDeveloperQualityStore()
  
  // Memoized filtered and grouped tickets with performance monitoring
  const developerTicketData = useMemo(() => {
    const timer = performanceMonitor.startTimer('developerTicketFiltering')
    
    try {
      // Early return if no data or developer
      if (!data?.minimalIssues || !developerName) {
        timer?.end()
        return {
          groupedTickets: new Map(),
          totalTickets: 0,
          isEmpty: true,
          error: null
        }
      }

      const { minimalIssues } = data
      const timeframe = filters?.timeframe || 'month'
      
      // CRITICAL: timeframe must come from Zustand filters.timeframe
      if (!timeframe) {
        console.error('timeframe is required from Zustand filters.timeframe')
        return {
          groupedTickets: new Map(),
          totalTickets: 0,
          isEmpty: true,
          error: 'Missing timeframe from filters'
        }
      }
      
      // Use IssueUtils class method (DRY & SOLID compliant)
      const groupedTickets = IssueUtils.calculateDeveloperTicketsByTimePeriod(
        minimalIssues, 
        developerName, 
        timeframe, // This comes from Zustand filters.timeframe
        {
          projectFilter: filters?.projects || null
          // Delivered statuses are mandatory - no parameter needed
        }
      )
      
      // Debug logging if needed
      if (process.env.NODE_ENV === 'development') {
        const filteredIssues = minimalIssues.filter(issue => issue.assignee === developerName)
        debugStoryPointCalculation(filteredIssues, Array.from(groupedTickets.values()).flat(), 'Individual Tickets')
      }
      
      // Calculate total tickets
      const totalTickets = Array.from(groupedTickets.values()).reduce((total, tickets) => total + tickets.length, 0)
      
      timer?.end()
      
      return {
        groupedTickets,
        totalTickets,
        isEmpty: totalTickets === 0,
        error: null,
        metadata: {
          timeframe,
          periodCount: groupedTickets.size,
          processingTime: timer?.duration || 0
        }
      }
      
    } catch (error) {
      timer?.end()
      console.error('Error in useDeveloperTickets:', error)
      
      return {
        groupedTickets: new Map(),
        totalTickets: 0,
        isEmpty: true,
        error: error.message || 'Unknown error filtering developer tickets'
      }
    }
  }, [data?.minimalIssues, developerName, filters?.timeframe, filters?.projects])
  
  // Additional computed values using centralized functions
  const computedData = useMemo(() => {
    if (developerTicketData.isEmpty) {
      return {
        ...developerTicketData,
        ticketsByType: new Map(),
        ticketsByStatus: new Map(),
        averageStoryPoints: 0,
        totalStoryPoints: 0
      }
    }
    
    // Get all tickets for calculations
    const allTickets = Array.from(developerTicketData.groupedTickets.values()).flat()
    
    // Use centralized function for total story points
    const totalStoryPoints = calculateTotalStoryPoints(allTickets)
    
    // ... rest of the calculations remain the same
    
    return {
      ...developerTicketData,
      ticketsByType,
      ticketsByStatus,
      averageStoryPoints: Math.round(averageStoryPoints * 10) / 10,
      totalStoryPoints
    }
  }, [developerTicketData])
  
  return computedData
}
```

### Key Changes:
1. **Replace hardcoded exclusions**: No more manual status exclusions
2. **Use delivered statuses**: Now uses centralized configuration
3. **Consistent date logic**: Automatic standardized date handling
4. **Centralized grouping**: Uses `calculateDeveloperTicketsByTimePeriod`
5. **Debug support**: Built-in debugging capabilities

## 3. Velocity Trends (EffortEffectivenessChart) Update

### Current Implementation (EffortEffectivenessChart.jsx)

**File**: `src/features/developer-quality-dashboard/components/EffortEffectivenessChart/EffortEffectivenessChart.jsx`

**Current Code** (lines 97-100):
```javascript
// Filter issues by status for "delivered" metrics
const deliveredIssues = developerData.timeTrackingIssues.filter(issue => 
  statusFilter.includes(issue.status) || statusFilter.length === 0
)
```

### Updated Implementation

```javascript
import { IssueUtils } from '../../../../shared/utils/IssueUtils'

const EffortEffectivenessChart = ({ 
  developerData = null, 
  selectedDeveloper, 
  timeframe = 'month',
  projectData = null
}) => {
  // Calculate totals from the developer data
  const metrics = useMemo(() => {
    if (!developerData || !developerData.timeTrackingIssues) {
      return {
        totalStoryPoints: 0,
        totalTimeSpent: 0,
        totalIssues: 0,
        timePerStoryPoint: 0,
        efficiency: 'N/A',
        allStoryPoints: 0,
        allTimeSpent: 0
      }
    }

    // Use IssueUtils filtering (delivered statuses are mandatory)
    const deliveredIssues = IssueUtils.filterDeliveredIssues(
      developerData.timeTrackingIssues
      // No filters needed - delivered statuses are mandatory
    )
    
    // Debug logging if needed
    if (process.env.NODE_ENV === 'development') {
      IssueUtils.debugCalculation(
        developerData.timeTrackingIssues, 
        deliveredIssues, 
        'Velocity Trends'
      )
    }
    
    // Calculate totals using IssueUtils
    const totalStoryPoints = IssueUtils.calculateTotalStoryPoints(deliveredIssues)
    
    // Calculate total time spent (existing logic)
    const totalTimeSpent = deliveredIssues.reduce((total, issue) => {
      return total + (issue.timeSpentSeconds || 0)
    }, 0)
    
    const totalIssues = deliveredIssues.length
    const timePerStoryPoint = totalStoryPoints > 0 ? totalTimeSpent / totalStoryPoints : 0
    
    // Calculate efficiency rating
    let efficiency = 'N/A'
    if (totalStoryPoints > 0 && totalTimeSpent > 0) {
      const hoursPerPoint = timePerStoryPoint / 3600 // Convert seconds to hours
      if (hoursPerPoint <= 8) efficiency = 'Excellent'
      else if (hoursPerPoint <= 16) efficiency = 'Good'
      else if (hoursPerPoint <= 24) efficiency = 'Average'
      else efficiency = 'Needs Improvement'
    }
    
    return {
      totalStoryPoints,
      totalTimeSpent,
      totalIssues,
      timePerStoryPoint,
      efficiency,
      allStoryPoints: totalStoryPoints, // Now consistent
      allTimeSpent: totalTimeSpent
    }
  }, [developerData, statusFilter])
  
  // ... rest of component remains the same
}
```

### Key Changes:
1. **Use centralized filtering**: `filterDeliveredIssues` instead of manual filter
2. **Remove default statusFilter**: Let centralized function handle defaults
3. **Use centralized calculation**: `calculateTotalStoryPoints` for consistency
4. **Add debug support**: Built-in debugging for development
5. **Consistent delivered status logic**: No more custom filter logic

## 4. Validation Integration

### Add Validation Hook

**File**: `src/features/developer-quality-dashboard/hooks/useStoryPointValidation.js`

```javascript
import { useEffect, useMemo } from 'react'
import { validateStoryPointConsistency } from '../../../shared/utils/storyPointCalculations'
import { useDeveloperQualityStore } from '../store/developerQualityStore'

/**
 * Hook to validate story point consistency across components
 * @param {Object} options - Validation options
 * @returns {Object} Validation results
 */
export const useStoryPointValidation = (options = {}) => {
  const { enableLogging = process.env.NODE_ENV === 'development' } = options
  const { data, filteredData } = useDeveloperQualityStore()
  
  const validation = useMemo(() => {
    if (!data || !filteredData) {
      return { isConsistent: true, inconsistencies: [], totals: {} }
    }
    
    const teamData = filteredData.filteredChartData?.teamContributionChart?.data || []
    const individualData = null // Would need to get from individual tickets component
    const velocityData = data.chartData?.effortEffectivenessChart?.data || []
    
    return validateStoryPointConsistency({
      teamData,
      individualData,
      velocityData
    })
  }, [data, filteredData])
  
  useEffect(() => {
    if (enableLogging && !validation.isConsistent) {
      console.warn('🚨 Story Point Inconsistency Detected:', validation.inconsistencies)
      console.table(validation.totals)
    }
  }, [validation, enableLogging])
  
  return validation
}
```

## 5. Implementation Checklist

### Phase 1: Foundation
- [x] Create centralized calculation function
- [x] Create comprehensive unit tests
- [x] Create implementation documentation

### Phase 2: Component Updates (Recommended Order)
- [ ] Update Team Contribution Chart (filterService.js)
- [ ] Update Individual Tickets component (useDeveloperTickets.js)
- [ ] Update Velocity Trends component (EffortEffectivenessChart.jsx)

### Phase 3: Integration & Validation
- [ ] Create validation hook
- [ ] Add consistency monitoring
- [ ] Add debug logging support
- [ ] Create integration tests

### Phase 4: Testing & Verification
- [ ] Test each component individually
- [ ] Test cross-component consistency
- [ ] Verify Ahmad Alfan data matches between views
- [ ] Performance testing

## 6. Expected Results

After implementation, all components should show:

### For Ahmad Alfan (Week grouping example):
- **Team Contribution Chart**: X story points total
- **Individual Tickets**: Same X story points, same ticket count
- **Velocity Trends**: Same X story points, consistent efficiency metrics

### Key Benefits:
1. **Data Consistency**: All views show identical totals for same filters
2. **Single Source of Truth**: All changes made in one place
3. **Maintainability**: Easier to update calculation logic
4. **Debugging**: Built-in validation and logging
5. **Performance**: Optimized calculation logic
6. **Testing**: Comprehensive unit test coverage

## 7. Migration Strategy

1. **Backup current implementation**: Create backup branches
2. **Implement in development**: Test thoroughly in dev environment
3. **Feature flag**: Use feature toggle to switch between old/new logic
4. **Gradual rollout**: Enable for specific users/projects first
5. **Monitor & validate**: Check for any data inconsistencies
6. **Full deployment**: Roll out to all users after validation

## 8. Rollback Plan

If issues are discovered:
1. **Immediate**: Toggle feature flag to revert to old logic
2. **Investigation**: Analyze logs and inconsistencies
3. **Fix**: Update centralized function based on findings
4. **Re-deploy**: Test and re-enable new logic
5. **Documentation**: Update implementation guides based on learnings