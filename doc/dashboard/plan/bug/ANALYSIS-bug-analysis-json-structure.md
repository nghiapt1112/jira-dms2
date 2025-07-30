# Bug Analysis JSON Structure

## Overview

This document defines the JSON structure for detailed bug analysis in the Developer Quality Dashboard. The structure groups bugs by project and time periods (week, month), providing comprehensive metrics for each period.

## JSON Payload Structure

```json
{
  "PROJECT_KEY": {
    "week": {
      "2025-W01": {
        // Basic counts
        "created": 100,
        "resolved": 20,
        "new": 100,
        "inProgress": 10,
        "notFix": 0,
        
        // Bug Type breakdown (from customfield_10271)
        "Functional": 10,
        "UI": 20,
        "Performance": 15,
        "Security": 5,
        "Regression": 10,
        "Integration": 10,
        "Unknown": 30,
        
        // Root Cause breakdown (from customfield_10272)
        "CodeError": 20,
        "DesignIssue": 15,
        "RequirementGap": 10,
        "Configuration": 15,
        "DataIssue": 20,
        "ExternalDependency": 10,
        "RootCauseUnknown": 10,
        
        // Severity breakdown (from customfield_10049)
        "Critical": 10,
        "Major": 30,
        "Minor": 40,
        "Trivial": 20,
        
        // Resolution metrics
        "avgResolutionTimeHours": 48.5,
        "reopenedCount": 5,
        "reopenRate": 5.0,
        "overdueCount": 3,
        
        // Time tracking
        "totalTimeSpentHours": 320.5,
        "avgTimePerBug": 3.2,
        
        // Period metadata
        "periodStart": "2025-01-01",
        "periodEnd": "2025-01-07",
        "lastUpdated": "2025-01-07T12:00:00Z"
      },
      "2025-W02": {
        // Same structure as above
      }
    },
    "month": {
      "2025-01": {
        // Same metrics as week but aggregated for the month
        "created": 400,
        "resolved": 350,
        "new": 50,
        "inProgress": 40,
        "notFix": 10,
        
        // Bug Types
        "Functional": 40,
        "UI": 80,
        "Performance": 60,
        "Security": 20,
        "Regression": 40,
        "Integration": 40,
        "Unknown": 120,
        
        // Root Causes
        "CodeError": 80,
        "DesignIssue": 60,
        "RequirementGap": 40,
        "Configuration": 60,
        "DataIssue": 80,
        "ExternalDependency": 40,
        "RootCauseUnknown": 40,
        
        // Severities
        "Critical": 40,
        "Major": 120,
        "Minor": 160,
        "Trivial": 80,
        
        // Resolution metrics
        "avgResolutionTimeHours": 52.3,
        "reopenedCount": 20,
        "reopenRate": 5.0,
        "overdueCount": 15,
        
        // Time tracking
        "totalTimeSpentHours": 1280.0,
        "avgTimePerBug": 3.2,
        
        // Period metadata
        "periodStart": "2025-01-01",
        "periodEnd": "2025-01-31",
        "lastUpdated": "2025-01-31T23:59:59Z"
      }
    }
  },
  "PROJECT_KEY_2": {
    // Same structure for other projects
  }
}
```

## Field Mappings

### Bug Status Categories
- **new**: Issues created in the period (based on created date)
- **inProgress**: Issues currently being worked on
- **resolved**: Issues resolved in the period (based on resolutiondate)
- **notFix**: Issues marked as "Won't Fix" or similar

### Bug Type Categories (from customfield_10271)
- Maps raw values to standardized categories using memberConfiguration
- Categories: Functional, UI, Performance, Security, Regression, Integration, Unknown

### Root Cause Categories (from customfield_10272)
- Extracted from array field, taking first value
- Categories: CodeError, DesignIssue, RequirementGap, Configuration, DataIssue, ExternalDependency, Unknown

### Severity Levels (from customfield_10049)
- Uses existing severityParser.js
- Levels: Critical, Major, Minor, Trivial, Unknown

## Implementation Notes

1. **Data Source**: Filtered by `Filter.projects` from Zustand store
2. **Time Periods**: Supports both week (ISO week format) and month grouping
3. **Incremental Updates**: Can be calculated during main processing loop
4. **Caching**: Results can be cached in IndexedDB for performance

## Usage Example

```javascript
// Get filtered projects from Zustand store
const { filters } = useDeveloperQualityStore()
const projectFilter = filters.projects // ["PROJECT1", "PROJECT2"]

// Generate analysis for filtered projects
const bugAnalysis = await bugAnalysisService.generateProjectBugAnalysis(
  issues,
  projectFilter
)

// Display in plain text panel
<BugAnalysisPanel data={bugAnalysis} />
```

## Future Enhancements

1. Add quarter aggregation
2. Include trend analysis (week-over-week, month-over-month)
3. Add developer-specific bug metrics
4. Include SLA compliance metrics
5. Add bug age distribution