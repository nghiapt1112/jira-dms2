# Team Contribution Chart Issue Analysis - CORRECTED

## Problem Summary

The "Team Contribution by Story Points" chart is not showing data for the OOPS project with configuration:
```javascript
{ key: "OOPS", name: "Oops", pointType: "HOURS_BASE" }
```

## Root Cause Analysis (CORRECTED)

### Issue Identified
The OOPS project tickets have **0 or null values in the `customfield_10028` (Story Points) field**, and the filtering logic excludes all tickets with zero story points. This results in "No Data Available" for the chart.

**Note**: `HOURS_BASE` means story points are measured in hours (1 story point = 1 hour), but still uses the same `customfield_10028` field. The issue is NOT about using different fields.

### Code Location - The Filtering Problem
**File**: `/src/shared/utils/IssueUtils.js`
**Line**: Around line where filterDeliveredIssues filters zero story points
```javascript
// Skip unassigned and zero story points
if (issue.assignee === 'Unassigned' || !issue.storyPoints || issue.storyPoints === 0) {
  return false
}
```

### Project Configuration
From `/src/constants/memberConfiguration.js`, OOPS is configured as:
```javascript
{ key: "OOPS", name: "Oops", pointType: "HOURS_BASE" }
```

This means OOPS story points represent hours, but they still come from `customfield_10028`.

## Technical Details

### Complete Filtering Pipeline
1. **Data Processing**: `developerQualityService.js:493` extracts story points from `customfield_10028`
2. **Status Filtering**: `IssueUtils.isDeliveredStatus()` checks if status is in delivered status list:
   ```javascript
   // Must be in delivered statuses (from memberConfiguration.filterDefaults.statusFilter)
   statusFilter: ["BACK FROM QA", "BLOCK", "BLOCKED", "Blocked", "Done", "IN QA", "In QA", ...]
   ```
3. **Date Filtering**: `IssueUtils.getDeliveredDate()` checks for valid delivered date (resolved || updated || created)
4. **Project/Developer Filtering**: Optional filters for specific projects or developers
5. **Zero Story Points Filtering**: `IssueUtils.filterDeliveredIssues()` excludes issues with 0 story points:
   ```javascript
   // Skip unassigned and zero story points
   if (issue.assignee === 'Unassigned' || !issue.storyPoints || issue.storyPoints === 0) {
     return false  // ← THIS IS WHERE OOPS TICKETS GET FILTERED OUT
   }
   ```
6. **Chart Generation**: `filterService.generateTimeBasedChartData()` processes the remaining issues
7. **Result**: Empty data array leads to "No Data Available"

### The Problem
**OOPS tickets are being filtered out at step 5** because:
- `customfield_10028` is 0 or null for OOPS tickets
- The filtering logic excludes ALL tickets with zero story points
- Even if the tickets have valid statuses, dates, and assignees

## Possible Root Causes

### 1. OOPS Tickets Not Estimated
The most likely cause is that OOPS project tickets simply haven't been estimated yet:
- Story points field (`customfield_10028`) is 0 or null
- This is common for projects that use time tracking instead of estimation
- Solution: OOPS team needs to add hour estimates to their tickets

### 2. Different Workflow for OOPS
OOPS might use a different workflow where:
- They track actual time spent but don't estimate upfront
- Story points are filled after work is completed
- Current tickets are works-in-progress with no estimates yet

### 3. Data Entry Issue
- OOPS tickets exist but story points field is not being populated
- Could be a JIRA configuration issue specific to OOPS project
- Could be a team process issue

## Immediate Debugging Steps

### 1. Check OOPS Data in Browser Console
Add this debug code to see what OOPS tickets look like:
```javascript
// In browser console on the dashboard
const jiraData = /* get from store */
const oopsTickets = jiraData.filter(issue => issue.project === 'OOPS')
console.log('OOPS Tickets:', oopsTickets.length)
console.log('OOPS Sample:', oopsTickets.slice(0, 5))
console.log('Story Points Distribution:', oopsTickets.map(t => t.storyPoints))
```

### 2. Use Existing Debug Function
The code has a debug utility in `IssueUtils.debugCalculation()`:
```javascript
// This will show detailed filtering breakdown
IssueUtils.debugCalculation(allIssues, filteredIssues, 'OOPS Analysis')
```

## Solutions

### Solution 1: Business Process Fix (RECOMMENDED)
**Ensure OOPS tickets have story point estimates**
1. OOPS team should estimate their tickets in hours and put the values in the Story Points field
2. For HOURS_BASE projects, 1 story point = 1 hour of estimated work
3. This is the intended workflow and requires no code changes

### Solution 2: Code Fix - Allow Zero Story Points for HOURS_BASE Projects
If OOPS team prefers not to estimate upfront, modify the filtering logic:

**File**: `/src/shared/utils/IssueUtils.js`
```javascript
// BEFORE:
if (issue.assignee === 'Unassigned' || !issue.storyPoints || issue.storyPoints === 0) {
  return false
}

// AFTER:
// Get project configuration to check if zero points are allowed
const projectKey = issue.project
const projectConfig = memberConfiguration.projects.find(p => p.key === projectKey)
const isHoursBase = projectConfig?.pointType === 'HOURS_BASE'

// For HOURS_BASE projects, allow zero story points if they have time logged
if (issue.assignee === 'Unassigned') {
  return false
}

if (!isHoursBase && (!issue.storyPoints || issue.storyPoints === 0)) {
  return false // Still exclude zero points for STORYPOINT_BASE projects
}

// For HOURS_BASE with zero points, check if they have time spent
if (isHoursBase && (!issue.storyPoints || issue.storyPoints === 0)) {
  // Allow if they have actual time logged (fallback to time tracking)
  if (!issue.timeSpentHours || issue.timeSpentHours === 0) {
    return false
  }
}
```

### Solution 3: Debug-First Approach (RECOMMENDED FOR INVESTIGATION)
Before making changes, first confirm the root cause:

1. **Add logging to see OOPS data:**
   ```javascript
   // In developerQualityService.js around line 493
   if (project === 'OOPS') {
     console.log('OOPS Ticket:', {
       key: issue.key,
       storyPoints: issue.fields?.customfield_10028,
       status: issue.fields?.status?.name,
       assignee: assignee,
       resolved: issue.fields?.resolutiondate
     })
   }
   ```

2. **Check the actual data in browser console when OOPS is selected**

3. **Determine if it's a data issue or filtering issue**

## Validation Steps

### Before Any Code Changes:
1. **Select only OOPS project** in the filter
2. **Open browser console** and look for any existing debug logs
3. **Check if OOPS tickets exist** in the raw data
4. **Verify OOPS ticket statuses** are in the delivered status list
5. **Check if OOPS tickets have assignees** in the member configuration

### If Data Exists but Chart Shows "No Data":
- The issue is in the filtering logic (likely zero story points)
- Implement Solution 2 above

### If No OOPS Data Exists:
- The issue is upstream (data fetching, project configuration, etc.)
- Check JIRA query parameters and date ranges

### Expected Behavior After Fix:
1. **OOPS Project Selected**: Chart shows contributor data
2. **Mixed Projects**: Chart shows combined data appropriately  
3. **Performance**: No degradation in loading time
4. **Other Projects**: YUIM, CF, etc. continue to work normally

## Files That May Need Changes

- `/src/shared/utils/IssueUtils.js` (filtering logic)
- `/src/features/developer-quality-dashboard/services/developerQualityService.js` (debug logging)
- Possibly `/src/constants/memberConfiguration.js` (if project config needs updates)

## Impact Assessment

### Low Risk Changes:
- Adding debug logging to investigate
- Business process changes (team starts estimating tickets)

### Medium Risk Changes:
- Modifying filtering logic to allow zero story points for HOURS_BASE projects
- Could affect performance targets and other calculations

### Recommendation:
Start with **Solution 3 (Debug-First)** to confirm the root cause, then proceed with the appropriate solution.