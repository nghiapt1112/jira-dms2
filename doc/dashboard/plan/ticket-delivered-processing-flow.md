# How a Ticket Gets Marked as "Delivered" and Assigned to a Month

## Overview
This document explains the exact process of how tickets are determined to be "delivered" and how they get assigned to specific months in the developer quality dashboard.

## Step-by-Step Processing Flow

### Step 1: Status Filtering (Determining "Delivered")

**Location**: `EffortEffectivenessChart.jsx` lines 189-191
```javascript
// Filter issues by status
const deliveredIssues = developerData.timeTrackingIssues.filter(issue => 
  statusFilter.includes(issue.status) || statusFilter.length === 0
)
```

**Logic**:
- Check if `issue.status` is included in the `statusFilter` array
- If `statusFilter` is empty (length === 0), all issues are considered delivered
- Only issues that pass this filter are considered "delivered"

### Step 2: Status Filter Configuration

**Location**: `memberConfiguration.js` lines 669-698
```javascript
statusFilter: [
  "BACK FROM QA",
  "BLOCK", 
  "BLOCKED",
  "Back from QA",
  "Blocked",
  "Blocked (QA)",
  "Blocked By QA", 
  "Blocked by QA",
  "CONFIRM BY PM",
  "Dev / QA Done",
  "Dev Test",
  "Done",           // ← Most common "delivered" status
  "IN QA",
  "In QA",
  "In Review",
  "Log Time",
  "NO ACTION",
  "ON HOLD", 
  "Pending",
  "QA",
  "QA Blocked",
  "QA in Progress",
  "Ready for QA",
  "Review",
  "Selected for Development",
  "Test by Dev",
  "Test by dev",
  "Under QA",
  "Verify(DO NOT USE)",
  "Waiting for QA"
]
```

**Key Points**:
- **28 different statuses** are considered "delivered"
- Includes various QA, testing, and completion states
- Not just "Done" - includes work in QA, review, blocked states, etc.

### Step 3: Date Processing & Month Assignment

**Location**: `EffortEffectivenessChart.jsx` lines 196-213
```javascript
deliveredIssues.forEach(issue => {
  if (issue.created) {
    // Always group by month for the table, regardless of timeframe setting
    const periodKey = getTimePeriodKey(issue.created, 'month')
    if (!timeGroups.has(periodKey)) {
      timeGroups.set(periodKey, {
        period: periodKey,
        storyPoints: 0,
        timeSpent: 0,
        issues: []
      })
    }
    const group = timeGroups.get(periodKey)
    group.storyPoints += issue.storyPoints || 0
    group.timeSpent += issue.timeSpentHours || 0
    group.issues.push(issue)
  }
})
```

### Step 4: Month Key Generation

**Location**: `EffortEffectivenessChart.jsx` lines 111-125
```javascript
const getTimePeriodKey = (dateString, period) => {
  const date = new Date(dateString)
  switch (period) {
    case 'month':
    default:
      return dateString.substring(0, 7) // YYYY-MM
  }
}
```

**Process**:
1. Takes `issue.created` date string (e.g., "2024-12-15T10:30:00Z")
2. Extracts first 7 characters: "2024-12"
3. This becomes the month key for grouping

## Real Example Walkthrough

### Example Ticket Data:
```javascript
{
  issueKey: "PROJ-123",
  status: "Done",                    // ← Status check
  created: "2024-12-15T10:30:00Z",   // ← Date for month assignment
  storyPoints: 5,
  timeSpentHours: 8.5
}
```

### Processing Steps:

1. **Status Check**:
   ```javascript
   statusFilter.includes("Done")  // → true (Done is in the 28-status list)
   ```
   ✅ **Result**: Ticket is considered "delivered"

2. **Month Assignment**:
   ```javascript
   getTimePeriodKey("2024-12-15T10:30:00Z", "month")
   // → "2024-12-15T10:30:00Z".substring(0, 7)
   // → "2024-12"
   ```
   ✅ **Result**: Ticket assigned to December 2024

3. **Grouping**:
   ```javascript
   timeGroups.get("2024-12").issues.push(ticket)
   timeGroups.get("2024-12").storyPoints += 5
   timeGroups.get("2024-12").timeSpent += 8.5
   ```
   ✅ **Result**: Ticket contributes to December 2024 metrics

## Key Decision Points

### Which Date Field is Used?
- **Uses**: `issue.created` (ticket creation date)
- **NOT**: `issue.resolved`, `issue.updated`, or completion date
- **Rationale**: Groups tickets by when work started, not when finished

### Which Statuses Count as Delivered?
- **Includes**: 28 different statuses (see full list above)
- **Philosophy**: "Delivered" means "work completed and in delivery pipeline"
- **Includes QA/Review states**: Work is considered delivered even if still in QA

### Month Boundary Logic
- **Format**: YYYY-MM (e.g., "2024-12")
- **Boundary**: Based on creation date, not timezone-adjusted
- **Grouping**: All tickets created in same calendar month grouped together

## Display Logic

### In the Table:
- **Period Headers**: Show "2024-12" format
- **Status Column**: Shows "Delivered" for all tickets in statusFilter
- **Individual Issues**: Grouped under their creation month

### Status Display Logic:
```javascript
// In the table Status column:
label={statusFilter.includes(issue.status) ? 'Delivered' : issue.status}
color={statusFilter.includes(issue.status) ? 'success' : 'default'}
```

- If status is in the 28-status list → Shows "Delivered" (green)
- If status is NOT in the list → Shows actual status (gray)

## Summary

A ticket is marked as "Delivered" and assigned to a month through this process:

1. **Status Check**: `issue.status` must be one of 28 predefined "delivered" statuses
2. **Date Processing**: `issue.created` date is parsed to extract YYYY-MM format
3. **Month Assignment**: Ticket is grouped under its creation month
4. **Display**: Shows as "Delivered" in the Status column, grouped under month headers

This ensures consistent tracking of when work was initiated and completed, regardless of the specific delivery pipeline status.