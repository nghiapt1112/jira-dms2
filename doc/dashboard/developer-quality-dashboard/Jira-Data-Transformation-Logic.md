# Jira Data Transformation Logic - Pure Data Processing Analysis
## Bug Rate Analysis: From Raw Jira Issues to JSON Payload

This document focuses purely on data transformation logic - how raw Jira issues are parsed and converted into the final JSON payload, without React components or state management.

---

## Table of Contents
1. [Jira Field Constants](#1-jira-field-constants)
2. [Root Cause Extraction](#2-root-cause-extraction)
3. [Bug Severity Detection](#3-bug-severity-detection)
4. [Story Points Parsing](#4-story-points-parsing)
5. [Changelog Analysis for Reopens](#5-changelog-analysis-for-reopens)
6. [Developer Data Aggregation](#6-developer-data-aggregation)
7. [JSON Transformation Pipeline](#7-json-transformation-pipeline)

---

## 1. Jira Field Constants

### 1.1 Custom Field Mappings
**Source**: `/src/constants.js`

```javascript
// Jira custom field IDs used for data extraction
export const STORY_POINTS_FIELD = 'customfield_10028';    // Story Points
export const SPRINT_FIELD = 'customfield_10020';          // Sprint
export const BUG_TYPE_FIELD = 'customfield_10271';        // Bug Type
export const ROOT_CAUSE_FIELD = 'customfield_10272';      // Bug Root Cause
export const BUG_SEVERITY_FIELD = 'customfield_10049';    // Bug Severity
export const START_DATE_FIELD = 'customfield_10015';      // Start Date
export const BUG_CAUSE_BY_FIELD = 'customfield_10636';    // Bug Caused By
```

### 1.2 Field Structure in Raw Jira Issues
```javascript
// Example raw Jira issue structure
{
  key: "PROJ-123",
  fields: {
    assignee: {
      displayName: "John Doe",
      accountId: "557058:abc123",
      avatarUrls: { "48x48": "https://avatar.url" }
    },
    issuetype: { name: "Bug" },
    priority: { name: "High" },
    status: { name: "Done" },
    severity: { value: "Major" },                           // customfield_10049
    customfield_10028: 5,                                   // Story Points
    customfield_10272: [{ value: "Logic Error" }],          // Root Cause Array
    customfield_10636: {                                    // Bug Caused By
      displayName: "Jane Smith",
      accountId: "557058:def456"
    }
  },
  changelog: { histories: [...] }
}
```

---

## 2. Root Cause Extraction

### 2.1 Root Cause Processing Logic
**Source**: `/src/services/bug-rate-service.js` processRootCauseData function

```javascript
// Extract root cause from custom field array
const extractedRootCauses = issue.fields[ROOT_CAUSE_FIELD]
  ? issue.fields[ROOT_CAUSE_FIELD].map((item) =>
      item.value.substring(0, 13).trim().toUpperCase().replace(/ /g, '_')
    )
  : ['Unknown'];
```

### 2.2 Root Cause Data Structure
```javascript
// Input: Raw Jira root cause field
customfield_10272: [
  { value: "Logic Error in Validation" },
  { value: "Missing Error Handling" }
]

// Output: Processed root causes
[
  "LOGIC_ERROR_I",     // Truncated to 13 chars, spaces to underscores
  "MISSING_ERROR"      // Uppercase conversion applied
]
```

### 2.3 Root Cause Aggregation
```javascript
// Overall root cause counting
extractedRootCauses.forEach((rootCause) => {
  // Count overall root causes
  if (!rootCauseCounts.has(rootCause)) {
    rootCauseCounts.set(rootCause, 0);
  }
  rootCauseCounts.set(rootCause, rootCauseCounts.get(rootCause) + 1);
});

// Developer-specific root cause tracking
if (!developerRootCauses.has(causedBy)) {
  developerRootCauses.set(causedBy, {
    developer: causedBy,
    totalBugs: 0,
    rootCauses: {},
    bugIds: [],
    rootCauseBugIds: {},
  });
}

const devData = developerRootCauses.get(causedBy);
if (!devData.rootCauses[rootCause]) {
  devData.rootCauses[rootCause] = 0;
  devData.rootCauseBugIds[rootCause] = [];
}
devData.rootCauses[rootCause]++;
devData.rootCauseBugIds[rootCause].push(issue.key);
```

---

## 3. Bug Severity Detection

### 3.1 Severity Configuration Matrix
**Source**: `/src/components/utils/workflow.utils.js`

```javascript
const BUG_SEVERITY_CONFIG = {
  // Priority to severity mapping groups
  priorityMapping: {
    highest: ['Critical', 'Blocker', 'P1', 'Highest'],
    high: ['Major', 'P2', 'High'],
    medium: ['Medium', 'Moderate', 'P3'],
    low: ['Low', 'P4', 'Trivial'],
    lowest: ['Lowest', 'P5', 'Minor'],
  },

  // Severity weights for calculations
  severityWeights: {
    Critical: 1.0,    // Maximum impact
    Major: 0.7,       // High impact
    Medium: 0.5,      // Moderate impact
    Moderate: 0.5,    // Same as Medium
    Low: 0.3,         // Minor impact
    Lowest: 0.1,      // Minimal impact
    Minor: 0.1,       // Same as Lowest
  },

  // Normalized severity mapping
  normalizedSeverities: {
    Critical: 'Critical', Major: 'Major', Medium: 'Medium',
    Moderate: 'Medium', Low: 'Low', Lowest: 'Lowest',
    Minor: 'Lowest', Blocker: 'Critical', P1: 'Critical',
    P2: 'Major', P3: 'Medium', P4: 'Low', P5: 'Lowest',
    Trivial: 'Low', Highest: 'Critical', High: 'Major',
  },

  defaultSeverity: 'Medium',
};
```

### 3.2 Severity Detection Algorithm
```javascript
export const getBugSeverity = (issue) => {
  const isBug = issue.fields?.issuetype?.name?.toUpperCase() === 'BUG';

  // Step 1: Try severity field first (highest priority)
  const severity = issue.fields?.severity?.value;
  if (severity) {
    const normalizedSeverity = BUG_SEVERITY_CONFIG.normalizedSeverities[severity.toUpperCase()];
    if (normalizedSeverity) {
      return normalizedSeverity;
    }
  }

  // Step 2: Fall back to priority field
  const priority = issue.fields?.priority?.name;
  if (priority) {
    const upperPriority = priority.toUpperCase();

    // Direct mapping check
    const directMapping = BUG_SEVERITY_CONFIG.normalizedSeverities[upperPriority];
    if (directMapping) {
      return directMapping;
    }

    // Bug-specific priority mapping
    if (isBug) {
      if (BUG_SEVERITY_CONFIG.priorityMapping.highest.some((p) => p.toUpperCase() === upperPriority)) {
        return 'Critical';
      }
      if (BUG_SEVERITY_CONFIG.priorityMapping.high.some((p) => p.toUpperCase() === upperPriority)) {
        return 'Major';
      }
      if (BUG_SEVERITY_CONFIG.priorityMapping.lowest.some((p) => p.toUpperCase() === upperPriority)) {
        return 'Lowest';
      }
    }

    // Group-based mapping
    for (const [level, severities] of Object.entries(BUG_SEVERITY_CONFIG.priorityMapping)) {
      if (severities.some((s) => s.toUpperCase() === upperPriority)) {
        return BUG_SEVERITY_CONFIG.normalizedSeverities[severities[0]];
      }
    }
  }

  // Step 3: Default values
  if (isBug) {
    return 'Major';  // Default for bugs without severity/priority
  }
  return BUG_SEVERITY_CONFIG.defaultSeverity;  // 'Medium' for non-bugs
};
```

### 3.3 Severity Detection Examples
```javascript
// Example 1: Direct severity field
{
  fields: {
    issuetype: { name: "Bug" },
    severity: { value: "Critical" }
  }
}
// Result: "Critical"

// Example 2: Priority fallback
{
  fields: {
    issuetype: { name: "Bug" },
    priority: { name: "Blocker" }
  }
}
// Result: "Critical" (Blocker maps to Critical)

// Example 3: Default for bugs
{
  fields: {
    issuetype: { name: "Bug" }
    // No severity or priority
  }
}
// Result: "Major"
```

---

## 4. Story Points Parsing

### 4.1 Story Points Extraction Logic
**Source**: Multiple locations with field validation

```javascript
// Primary method - direct field access
const storyPoints = issue.fields[STORY_POINTS_FIELD] || 0;
// Where STORY_POINTS_FIELD = 'customfield_10028'

// Alternative method with cleaning
const cleanStoryPoints = (storyPoints) => {
  if (storyPoints === null || storyPoints === undefined) return 0;
  const points = parseFloat(storyPoints);
  return isNaN(points) ? 0 : Math.max(0, points);
};
```

### 4.2 Story Points Data Types
```javascript
// Jira story points field can contain different data types
customfield_10028: 5        // Number
customfield_10028: "5"      // String number
customfield_10028: 5.5      // Decimal
customfield_10028: null     // Null value
customfield_10028: ""       // Empty string

// All converted to: 
// Numbers: kept as-is
// Strings: parsed to float
// Null/undefined/empty: converted to 0
// Invalid: converted to 0
// Negative: converted to 0 (Math.max)
```

### 4.3 Story Points Aggregation
```javascript
// Planned effort calculation
const estimatedStoryPoints = issue.fields?.[STORY_POINTS_FIELD] || 0;
project.plannedEffort += estimatedStoryPoints;

// Actual effort (only for completed issues)
if (issue.fields?.status?.name === 'Done') {
  project.actualEffort += estimatedStoryPoints;
}

// Efficiency calculation
const efficiency = completedEstimatedStoryPoints > 0 
  ? (completedStoryPoints / completedEstimatedStoryPoints) * 100 
  : 100;
```

---

## 5. Changelog Analysis for Reopens

### 5.1 Reopen Detection Algorithm
**Source**: `/src/services/bug-rate-service.js` getBugAndReopenData function

```javascript
// Sort changelog history chronologically
const sortedHistory = [...history].sort((a, b) => new Date(a.created) - new Date(b.created));

let reopenCount = 0;
let lastReopenDate = null;
let totalResolutionTime = 0;

sortedHistory.forEach((change) => {
  const changeDate = new Date(change.created);

  change.items.forEach((item) => {
    if (item.field === 'status') {
      // Detect resolution (moving to completed status)
      if (workflowUtils.isCompleted(item.toString, projectKey)) {
        if (lastReopenDate) {
          const timeToResolve = (changeDate - lastReopenDate) / (1000 * 60 * 60 * 24);
          totalResolutionTime += timeToResolve;
          lastReopenDate = null;
        }
      }

      // Detect reopen - two scenarios:
      // 1. Direct transition to reopened status
      // 2. Moving from completed to non-completed status
      if (
        workflowUtils.isReopened(item.toString, projectKey) ||
        (workflowUtils.isCompleted(item.fromString, projectKey) &&
         !workflowUtils.isCompleted(item.toString, projectKey))
      ) {
        reopenCount++;
        lastReopenDate = changeDate;
      }
    }
  });
});
```

### 5.2 Changelog Data Structure
```javascript
// Raw changelog structure from Jira
changelog: {
  histories: [
    {
      id: "12345",
      author: {
        displayName: "John Doe",
        accountId: "557058:abc123"
      },
      created: "2024-01-15T10:30:00.000+0000",
      items: [
        {
          field: "status",
          fieldtype: "jira",
          fromString: "Done",
          toString: "Reopened"
        }
      ]
    },
    {
      id: "12346",
      author: { displayName: "Jane Smith" },
      created: "2024-01-16T14:20:00.000+0000",
      items: [
        {
          field: "status",
          fromString: "Reopened",
          toString: "Done"
        }
      ]
    }
  ]
}
```

### 5.3 Workflow Status Classification
```javascript
// Default workflow statuses for reopen detection
const DEFAULT_WORKFLOW = {
  reopenedStatuses: ['REOPENED', 'REOPEN', 'REJECTED', 'NEEDS WORK'],
  completedStatuses: ['DONE', 'CLOSED', 'RESOLVED', 'VERIFIED', 'COMPLETE'],
  developmentStatuses: ['IN PROGRESS', 'DEVELOPMENT', 'WIP', 'IN DEVELOPMENT']
};

// Status check functions
const isCompleted = (status, projectKey) => {
  return DEFAULT_WORKFLOW.completedStatuses.includes(status.toUpperCase());
};

const isReopened = (status, projectKey) => {
  return DEFAULT_WORKFLOW.reopenedStatuses.includes(status.toUpperCase());
};
```

### 5.4 Reopen Metrics Calculation
```javascript
// After processing all changelog entries
if (reopenCount > 0) {
  devData.reopenedBugs++;                           // Count of bugs that were reopened
  devData.totalReopens += reopenCount;              // Total number of reopen events
  devData.maxReopens = Math.max(devData.maxReopens, reopenCount); // Max reopens for single bug
  devData.totalResolutionTime += totalResolutionTime; // Total time to resolve after reopens
}

// Final calculations
const reopenRate = dev.totalBugs > 0 ? (dev.reopenedBugs / dev.totalBugs) * 100 : 0;
const avgReopens = dev.reopenedBugs > 0 ? dev.totalReopens / dev.reopenedBugs : 0;
const avgResolutionTime = dev.reopenedBugs > 0 ? dev.totalResolutionTime / dev.reopenedBugs : 0;
```

---

## 6. Developer Data Aggregation

### 6.1 Developer Data Structure Initialization
```javascript
const initializeDeveloperData = (developer, avatar = '') => {
  return {
    developer,
    avatar,
    
    // Bug rate metrics
    features: 0,
    featureTickets: [],
    bugs: 0,
    bugsCaused: 0,
    bugTickets: [],
    causedBugTickets: [],
    bugRate: 0,
    ratio: 0,
    
    // Development time
    devTime: 0,
    
    // Bug severity breakdown
    criticalBugs: 0,
    majorBugs: 0,
    minorBugs: 0,
    
    // Reopen metrics
    totalBugs: 0,
    reopenedBugs: 0,
    totalReopens: 0,
    maxReopens: 0,
    totalResolutionTime: 0,
    avgResolutionTime: 0,
    reopenRate: 0,
    avgReopens: 0,
  };
};
```

### 6.2 Bug Cause Developer Extraction
```javascript
const extractBugCauseDeveloper = (issue, defaultName = 'Unassigned') => {
  let causedBy = '';
  let causeAvatar = '';

  if (issue.fields[BUG_CAUSE_BY_FIELD]) {
    const bugCauseField = issue.fields[BUG_CAUSE_BY_FIELD];

    // Handle array format
    if (Array.isArray(bugCauseField) && bugCauseField.length > 0) {
      causedBy = bugCauseField[0].displayName || '';
      causeAvatar = bugCauseField[0].avatarUrls?.['48x48'] || '';
    } 
    // Handle single object format
    else if (bugCauseField.displayName) {
      causedBy = bugCauseField.displayName;
      causeAvatar = bugCauseField.avatarUrls?.['48x48'] || '';
    }
  }

  // Fallback to default if no bug cause field
  if (!causedBy) {
    causedBy = defaultName;
  }

  return { causedBy, causeAvatar };
};
```

### 6.3 Issue Processing Logic
```javascript
// Single-pass processing of all issues
allIssues.forEach((issue) => {
  const assignee = issue.fields.assignee?.displayName || 'Unassigned';
  const avatar = issue.fields.assignee?.avatarUrls?.['48x48'] || '';
  const isBug = issue.fields.issuetype?.name?.toLowerCase().includes('bug');
  const issueStatus = issue.fields.status?.name || '';

  // Initialize developer if not exists
  if (!developerMap.has(assignee)) {
    developerMap.set(assignee, initializeDeveloperData(assignee, avatar));
  }

  const devData = developerMap.get(assignee);

  if (isBug) {
    // Process bug assignment
    devData.bugs++;
    devData.bugTickets.push({
      key: issue.key,
      summary: issue.fields.summary,
      priority: issue.fields.priority?.name,
      status: issue.fields.status?.name,
    });

    // Process bug causation
    const { causedBy, causeAvatar } = extractBugCauseDeveloper(issue, assignee);
    if (causedBy && causedBy !== 'Unassigned') {
      // Update the developer who caused the bug
      if (!developerMap.has(causedBy)) {
        developerMap.set(causedBy, initializeDeveloperData(causedBy, causeAvatar));
      }
      
      const causeDevData = developerMap.get(causedBy);
      causeDevData.bugsCaused++;
      causeDevData.causedBugTickets.push({
        key: issue.key,
        summary: issue.fields.summary,
        priority: issue.fields.priority?.name,
        status: issue.fields.status?.name,
      });

      // Categorize by priority
      categorizeBugByPriority(issue, causeDevData);
    }

    // Process reopen metrics
    processReopenData(devData, issue);
    
  } else if (!isBug && issueStatus.toUpperCase() !== 'TO DO') {
    // Count as feature if non-bug and started
    devData.features++;
    devData.featureTickets.push({
      key: issue.key,
      summary: issue.fields.summary,
      priority: issue.fields.priority?.name,
      status: issue.fields.status?.name,
    });
  }

  // Calculate development time
  const devTime = calculateDevTime(issue, projectWorkflows);
  devData.devTime += devTime;
});
```

### 6.4 Priority Categorization
```javascript
const categorizeBugByPriority = (issue, devData) => {
  const priority = issue.fields.priority?.name?.toLowerCase() || '';

  if (priority.includes('critical') || priority.includes('blocker')) {
    devData.criticalBugs++;
  } else if (priority.includes('major') || priority.includes('high')) {
    devData.majorBugs++;
  } else {
    devData.minorBugs++;
  }
};
```

---

## 7. JSON Transformation Pipeline

### 7.1 Final Data Structure Transformation
```javascript
// Convert Map to Array and calculate final metrics
const combinedData = Array.from(developerMap.values())
  .filter((dev) => dev.features > 0 || dev.bugs > 0) // Only active developers
  .map((dev) => {
    // Calculate derived metrics
    const bugRate = dev.features > 0 ? (dev.bugsCaused / dev.features) * 100 : 0;
    const ratio = dev.features > 0 ? dev.bugsCaused / dev.features : 0;
    const reopenRate = dev.totalBugs > 0 ? (dev.reopenedBugs / dev.totalBugs) * 100 : 0;
    const avgReopens = dev.reopenedBugs > 0 ? dev.totalReopens / dev.reopenedBugs : 0;
    const avgResolutionTime = dev.reopenedBugs > 0 ? dev.totalResolutionTime / dev.reopenedBugs : 0;

    return {
      ...dev,
      bugRate: Number(bugRate.toFixed(2)),
      ratio: Number(ratio.toFixed(2)),
      reopenRate: Number(reopenRate.toFixed(2)),
      avgReopens: Number(avgReopens.toFixed(2)),
      avgResolutionTime: Number(avgResolutionTime.toFixed(2)),
    };
  });
```

### 7.2 Complete Data Transformation Example

**Input: Raw Jira Issue**
```javascript
{
  key: "PROJ-123",
  fields: {
    assignee: {
      displayName: "John Doe",
      accountId: "557058:abc123",
      avatarUrls: { "48x48": "https://avatar.url" }
    },
    issuetype: { name: "Bug" },
    priority: { name: "High" },
    status: { name: "Done" },
    severity: { value: "Major" },
    customfield_10028: 5,  // Story Points
    customfield_10272: [{ value: "Logic Error" }],  // Root Cause
    customfield_10636: {   // Bug Caused By
      displayName: "Jane Smith",
      accountId: "557058:def456"
    },
    summary: "Login validation fails",
    created: "2024-01-01T10:00:00.000Z",
    resolutiondate: "2024-01-02T15:30:00.000Z"
  },
  changelog: {
    histories: [
      {
        created: "2024-01-01T14:00:00.000Z",
        items: [{ field: "status", fromString: "To Do", toString: "In Progress" }]
      },
      {
        created: "2024-01-02T10:00:00.000Z",
        items: [{ field: "status", fromString: "In Progress", toString: "Done" }]
      },
      {
        created: "2024-01-03T09:00:00.000Z",
        items: [{ field: "status", fromString: "Done", toString: "Reopened" }]
      },
      {
        created: "2024-01-03T17:00:00.000Z",
        items: [{ field: "status", fromString: "Reopened", toString: "Done" }]
      }
    ]
  }
}
```

**Output: Processed Developer Data**
```javascript
// For John Doe (assignee)
{
  developer: "John Doe",
  avatar: "https://avatar.url",
  bugs: 1,
  features: 0,
  bugsCaused: 0,
  bugRate: 0,
  ratio: 0,
  totalBugs: 1,
  reopenedBugs: 1,
  totalReopens: 1,
  maxReopens: 1,
  reopenRate: 100.00,     // (1/1) * 100
  avgReopens: 1.00,       // 1/1
  avgResolutionTime: 0.33, // 8 hours / 24 = 0.33 days
  bugTickets: [
    {
      key: "PROJ-123",
      summary: "Login validation fails",
      priority: "High",
      status: "Done"
    }
  ]
}

// For Jane Smith (bug caused by)
{
  developer: "Jane Smith",
  avatar: "",
  bugs: 0,
  features: 0,
  bugsCaused: 1,
  bugRate: 0,              // No features to calculate rate
  ratio: 0,
  majorBugs: 1,            // Categorized as Major from High priority
  causedBugTickets: [
    {
      key: "PROJ-123",
      summary: "Login validation fails",
      priority: "High",
      status: "Done"
    }
  ]
}

// Root cause data
{
  name: "LOGIC_ERROR",      // Truncated and formatted
  value: 1                  // Count of occurrences
}
```

### 7.3 Data Processing Performance
```javascript
// Processing metrics for 1000 issues:
// - Single-pass algorithm: O(n) complexity
// - Memory efficiency: Map-based aggregation
// - Chronological sorting: O(h log h) where h = changelog entries
// - Total processing time: ~500-1000ms for initial load
// - Filter updates: <50ms (V4 architecture)
```

---

## Summary

The data transformation pipeline converts raw Jira issues into structured JSON payload through:

1. **Field Extraction**: Maps Jira custom fields to meaningful data using constants
2. **Severity Detection**: Multi-step algorithm with fallback priority mapping
3. **Root Cause Processing**: Array parsing with normalization and truncation
4. **Changelog Analysis**: Chronological reopen detection with time calculations
5. **Aggregation**: Developer-centric data grouping with Map-based efficiency
6. **Calculation**: Derived metrics (rates, averages, ratios) with precision formatting
7. **Transformation**: Final JSON structure optimized for UI consumption

The system handles missing data gracefully, provides multiple fallback mechanisms, and maintains data consistency across different Jira configurations while processing large datasets efficiently.