# Bug Analysis - JSON Payload Only

## Overview

This document focuses **only on the JSON payload generation** for bug analysis. No UI components or visualizations needed - just the data structure and processing logic.

## Final JSON Structure

```json
{
  "WON": {
    "week": {
      "2025-W01": {
        "created": 45,
        "resolved": 38,
        "new": 12,
        "inProgress": 15,
        "notFix": 2,
        
        "Functional": 18,
        "UI": 12,
        "Performance": 8,
        "Security": 2,
        "Integration": 5,
        
        "CodeError": 15,
        "DesignIssue": 10,
        "RequirementGap": 8,
        "Configuration": 7,
        "DataIssue": 5,
        
        "Critical": 3,
        "Major": 12,
        "Minor": 25,
        "Trivial": 5,
        
        "avgResolutionTimeHours": 28.5,
        "reopenedCount": 3,
        "reopenRate": 7.9,
        "overdueCount": 4,
        "totalTimeSpentHours": 245.5,
        "avgTimePerBug": 5.5,
        
        "periodStart": "2025-01-01",
        "periodEnd": "2025-01-07",
        "lastUpdated": "2025-01-07T16:30:00Z"
      }
    },
    "month": {
      "2025-01": {
        "created": 285,
        "resolved": 248,
        "new": 65,
        "inProgress": 72,
        "notFix": 8,
        
        "Functional": 95,
        "UI": 68,
        "Performance": 42,
        "Security": 15,
        "Integration": 35,
        "Unknown": 30,
        
        "CodeError": 80,
        "DesignIssue": 60,
        "RequirementGap": 40,
        "Configuration": 60,
        "DataIssue": 80,
        "ExternalDependency": 40,
        "RootCauseUnknown": 40,
        
        "Critical": 40,
        "Major": 120,
        "Minor": 160,
        "Trivial": 80,
        
        "avgResolutionTimeHours": 52.3,
        "reopenedCount": 20,
        "reopenRate": 5.0,
        "overdueCount": 15,
        "totalTimeSpentHours": 1280.0,
        "avgTimePerBug": 3.2,
        
        "periodStart": "2025-01-01",
        "periodEnd": "2025-01-31",
        "lastUpdated": "2025-01-31T23:59:59Z"
      }
    }
  },
  "YUIM": {
    "week": { /* similar structure */ },
    "month": { /* similar structure */ }
  }
}
```

## Integration Points

### 1. Data Source
- Filtered by `Filter.projects` from Zustand store
- Time periods: `Filters.timePeriod` (week/month)

### 2. Custom Field Mappings
- **Bug Type**: `customfield_10271` → Functional, UI, Performance, etc.
- **Root Cause**: `customfield_10272` → CodeError, DesignIssue, etc.
- **Severity**: `customfield_10049` → Critical, Major, Minor, Trivial

### 3. Processing Strategy
- **One-time generation** during main data processing loop
- **Cached in IndexedDB** for instant retrieval
- **Client-side filtering** by selected projects

## Implementation Focus

### Required Processing Functions (Only)

```javascript
// In developerQualityService.js - add to main processing loop
processBugAnalysis: (issue, bugAnalysisData) => {
  if (issue.fields?.issuetype?.name !== 'Bug') return
  
  const projectKey = issue.fields?.project?.key
  if (!projectKey) return
  
  // Extract bug metadata using existing utilities
  const bugData = {
    bugType: extractBugType(issue),           // reuse existing
    rootCause: extractRootCause(issue),       // reuse existing  
    severity: parseSeverity(issue, projectKey).severity, // reuse existing
    // ... other fields
  }
  
  // Update JSON structure
  updateBugAnalysisJSON(bugAnalysisData, projectKey, bugData)
}
```

### Cache Storage (Only)
```javascript
// Save generated JSON to IndexedDB
await developerQualityIndexedDB.saveBugAnalysis(bugAnalysisJSON)

// Retrieve JSON when needed
const bugAnalysisJSON = await developerQualityIndexedDB.getBugAnalysis()
```

## What You Get

1. **JSON Structure**: Complete data format specification
2. **Processing Logic**: How to generate the JSON during main loop
3. **Caching Strategy**: Store once, retrieve many times
4. **Field Mappings**: How to extract from JIRA custom fields
5. **Project Filtering**: Filter JSON by selected projects

## What You DON'T Get (As Requested)

- ❌ UI Components
- ❌ Chart implementations
- ❌ React components
- ❌ Visual mockups
- ❌ Dashboard panels

## Next Steps

1. Review the JSON structure
2. Implement the processing functions in main loop
3. Add caching to IndexedDB
4. Filter JSON by `Filter.projects` when needed

The JSON payload will be ready for any future UI implementation or data analysis needs.