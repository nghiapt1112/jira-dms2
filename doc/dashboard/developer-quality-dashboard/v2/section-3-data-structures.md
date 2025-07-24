# Section 3: Data Structure Analysis
## Developer Quality Dashboard - Data Structures

> **Reverse-Engineered from Implementation**  
> This document captures the actual data structures as implemented, including complex nested Maps, extended statistics, and optimized index structures.

---

## 3.1 Core Data Structure Overview

### **Data Structure Hierarchy**

```
Primary Data Structures
├── Raw JIRA Issue Objects (Input)
├── Extended Developer Statistics (Processing) 
├── Performance Metadata (Triple-nested Maps)
├── Multi-dimensional Indices (Filtering)
├── Chart Data Structures (Visualization)
├── Filter State Structures (UI State)
├── Cache Metadata Structures (Persistence)
└── Configuration Structures (System Config)
```

---

## 3.2 Raw JIRA Issue Structures

### **Input Data Structure**

**Complete JIRA Issue Object** (50+ fields):

```javascript
const jiraIssue = {
  id: "70354",
  key: "YUIM-129",
  self: "https://jira.example.com/rest/api/2/issue/70354",
  
  fields: {
    // Core identification
    summary: "Fix login validation logic",
    description: "Detailed issue description...",
    issuetype: { 
      name: "Bug", 
      subtask: false,
      iconUrl: "..." 
    },
    
    // Assignment and ownership
    assignee: {
      self: "https://jira.example.com/rest/api/2/user?accountId=123",
      accountId: "712020:92de1f44-d98b-40dc-b39e-244fff709123",
      displayName: "Andra Satria",
      emailAddress: "andra@example.com",
      avatarUrls: { "48x48": "..." }
    },
    
    // Project information
    project: {
      self: "https://jira.example.com/rest/api/2/project/10001",
      id: "10001",
      key: "YUIM",
      name: "Yuime",
      projectTypeKey: "software",
      avatarUrls: { "48x48": "..." }
    },
    
    // Status and resolution
    status: {
      self: "https://jira.example.com/rest/api/2/status/10001",
      description: "This was once resolved...",
      iconUrl: "...",
      name: "Done",
      id: "10001",
      statusCategory: {
        self: "https://jira.example.com/rest/api/2/statuscategory/3",
        id: 3,
        key: "done",
        colorName: "green",
        name: "Done"
      }
    },
    
    resolution: {
      self: "https://jira.example.com/rest/api/2/resolution/10000",
      id: "10000",
      description: "Work has been completed on this issue.",
      name: "Done"
    },
    
    // Priority and severity
    priority: {
      self: "https://jira.example.com/rest/api/2/priority/3",
      iconUrl: "...",
      name: "Medium",
      id: "3"
    },
    
    // Time tracking
    timetracking: {
      originalEstimate: "2h",
      remainingEstimate: "0h", 
      timeSpent: "2h 30m",
      originalEstimateSeconds: 7200,
      remainingEstimateSeconds: 0,
      timeSpentSeconds: 9000
    },
    
    // Custom fields (project-specific)
    customfield_10028: 5,                    // Story Points
    customfield_10049: "Critical",           // Severity
    customfield_10636: "Logic Error",        // Root Cause
    customfield_10272: "Implementation",     // Bug Category
    
    // Date fields
    created: "2024-01-15T10:30:00.000+0000",
    updated: "2024-01-20T15:45:00.000+0000", 
    resolutiondate: "2024-01-20T15:45:00.000+0000",
    duedate: "2024-01-25T00:00:00.000+0000",
    
    // Relationships
    subtasks: [],
    parent: null,
    issuelinks: [
      {
        id: "10001",
        type: { name: "Blocks", inward: "is blocked by", outward: "blocks" },
        outwardIssue: { key: "YUIM-130", fields: { summary: "..." } }
      }
    ],
    
    // Components and labels
    components: [
      { self: "...", id: "10000", name: "Authentication", description: "..." }
    ],
    labels: ["backend", "security", "critical"],
    
    // Environment and versions
    environment: "Production",
    versions: [],
    fixVersions: [
      { self: "...", id: "10001", name: "1.2.0", archived: false, released: false }
    ],
    
    // Comments and attachments
    comment: {
      comments: [
        {
          self: "...",
          id: "10000", 
          author: { displayName: "John Doe", accountId: "..." },
          body: "Comment text...",
          created: "2024-01-16T09:00:00.000+0000"
        }
      ],
      maxResults: 50,
      total: 1,
      startAt: 0
    },
    
    attachment: [
      {
        self: "...",
        id: "10000",
        filename: "screenshot.png",
        author: { displayName: "Jane Smith", accountId: "..." },
        created: "2024-01-15T11:00:00.000+0000",
        size: 125000,
        mimeType: "image/png",
        content: "https://jira.example.com/secure/attachment/10000/screenshot.png"
      }
    ]
  },
  
  // Change history (critical for reopen detection)
  changelog: {
    startAt: 0,
    maxResults: 50,
    total: 5,
    histories: [
      {
        id: "10000",
        author: {
          self: "...",
          accountId: "712020:92de1f44-d98b-40dc-b39e-244fff709123",
          displayName: "Andra Satria",
          emailAddress: "andra@example.com"
        },
        created: "2024-01-16T14:30:00.000+0000",
        items: [
          {
            field: "status",
            fieldtype: "jira",
            fieldId: "status", 
            from: "3",
            fromString: "In Progress",
            to: "10001",
            toString: "Done"
          },
          {
            field: "resolution",
            fieldtype: "jira",
            fieldId: "resolution",
            from: null,
            fromString: null,
            to: "10000", 
            toString: "Done"
          }
        ]
      }
    ]
  }
}
```

---

## 3.3 Extended Developer Statistics

### **Extended Developer Stats Structure**

**Complex 15+ field structure** (lines 427-462 in developerQualityService.js):

```javascript
const extendedDeveloperStats = {
  // Basic identification
  name: "Andra Satria",
  jiraId: "712020:92de1f44-d98b-40dc-b39e-244fff709123",
  level: "senior",
  role: "developer",
  
  // Core metrics
  totalIssues: 147,
  totalStoryPoints: 285,
  totalBugs: 12,
  
  // Bug analysis metrics
  bugRate: 8.16,                    // (bugs / totalIssues) * 100
  reopenCount: 2,
  reopenRate: 16.67,                // (reopenCount / totalBugs) * 100
  
  // Time and efficiency metrics
  averageResolutionTimeHours: 18.5,
  timeEfficiencyScore: 87,
  overdueCount: 3,
  overdueRate: 25.0,                // (overdueCount / totalBugs) * 100
  
  // Detailed breakdowns
  severityBreakdown: {
    Critical: 2,
    Major: 6, 
    Minor: 3,
    Low: 1,
    Cosmetic: 0,
    Unknown: 0
  },
  
  rootCauseBreakdown: {
    "Logic Error": 4,
    "Implementation Issue": 3,
    "Communication Gaps": 2,
    "Insufficient Testing": 2,
    "Unknown": 1
  },
  
  // Resolution time analysis
  resolutionTimes: [
    {
      issueKey: "YUIM-129",
      resolutionTimeHours: 24.5,
      resolutionTimeDays: 1.02,
      isOverdue: false,
      efficiencyScore: 95,
      slaTarget: 72,
      severity: "Major"
    }
  ],
  
  // Recent bugs for trend analysis
  recentBugs: [
    {
      key: "YUIM-129",
      created: "2024-01-15T10:30:00.000+0000",
      resolved: "2024-01-20T15:45:00.000+0000",
      severity: "Critical",
      rootCause: "Logic Error",
      isReopened: false
    }
  ],
  
  // Time tracking detailed data
  timeTrackingData: {
    totalTimeSpentHours: 342.5,
    totalStoryPoints: 285,
    timePerStoryPoint: 1.2,          // hours per story point
    estimationAccuracy: [            // Array of accuracy percentages
      95, 103, 87, 112, 98
    ],
    timeLoggedIssues: 89,            // Issues with time logged
    
    // Temporal aggregations
    weeklyTimeTracking: new Map([
      ["2024-W01", { totalTime: 35.5, storyPoints: 25, efficiency: 1.42 }],
      ["2024-W02", { totalTime: 40.0, storyPoints: 30, efficiency: 1.33 }]
    ]),
    
    monthlyTimeTracking: new Map([
      ["2024-01", { totalTime: 152.5, storyPoints: 120, efficiency: 1.27 }],
      ["2024-02", { totalTime: 145.0, storyPoints: 115, efficiency: 1.26 }]
    ]),
    
    // Individual time tracking records
    timeTrackingIssues: [
      {
        issueKey: "YUIM-129",
        originalEstimateHours: 8,
        timeSpentHours: 9.5,
        storyPoints: 5,
        estimationAccuracy: 118.75,   // (spent/estimate) * 100
        timePerStoryPoint: 1.9
      }
    ]
  }
}
```

---

## 3.4 Performance Metadata Structures

### **Triple-Nested Map Architecture**

**Project → Developer → Time Period → Metrics**:

```javascript
const performanceMetadata = new Map([
  ["YUIM", new Map([
    ["Andra Satria", new Map([
      ["2024-W01", {
        totalPoints: 25,
        targetPoints: 30,
        performance: "under",
        efficiency: 83.33,
        trend: "stable",
        
        // Weekly breakdown
        weeklyMetrics: {
          storyPointsDelivered: 25,
          hoursLogged: 35.5,
          bugsCreated: 1,
          bugsResolved: 2,
          averageResolutionTime: 18.5,
          reopenCount: 0
        },
        
        // Comparative analysis
        vsTarget: {
          pointsDelta: -5,              // vs target
          percentageOfTarget: 83.33,
          ranking: 15,                  // among all developers
          quartile: 3                   // performance quartile
        },
        
        // Quality indicators
        qualityMetrics: {
          bugRate: 4.0,                 // bugs per 100 story points
          timeEfficiency: 87,           // efficiency score 0-100
          estimationAccuracy: 105.2,    // average estimation accuracy
          codeQuality: "good"           // derived quality rating
        }
      }],
      
      ["2024-W02", {
        totalPoints: 30,
        targetPoints: 30, 
        performance: "at_target",
        efficiency: 100.0,
        trend: "improving",
        // ... similar nested structure
      }],
      
      ["2024-01", {                     // Monthly aggregation
        totalPoints: 120,
        targetPoints: 120,
        performance: "at_target", 
        efficiency: 100.0,
        trend: "improving",
        // ... monthly metrics
      }]
    ])]
  ])],
  
  ["CF", new Map([
    ["Tuan Hoang", new Map([
      // ... similar structure for different project
    ])]
  ])]
])
```

### **Performance Target Calculation Structure**

```javascript
const performanceTargets = {
  // Project-based targets
  projectTargets: new Map([
    ["YUIM", {
      pointType: "STORYPOINT_BASE",
      targets: {
        senior: { week: 30, month: 90, quarter: 270 },
        middle: { week: 25, month: 100, quarter: 300 }
      }
    }],
    ["BCP", {
      pointType: "HOURS_BASE", 
      targets: {
        all: { week: 35, month: 140, quarter: 420 }
      }
    }]
  ]),
  
  // Dynamic target resolution
  getTargetForDeveloper: (projectKey, developerLevel, timePeriod) => {
    const project = performanceTargets.projectTargets.get(projectKey)
    if (!project) return null
    
    if (project.pointType === "HOURS_BASE") {
      return project.targets.all[timePeriod]
    } else {
      return project.targets[developerLevel]?.[timePeriod]
    }
  }
}
```

---

## 3.5 Multi-dimensional Index Structures

### **Pre-built Filter Indices** 

**O(1) Filtering Performance**:

```javascript
const filterIndices = {
  // Developer-based indexing
  byDeveloper: new Map([
    ["Andra Satria", new Set([
      "YUIM-129", "YUIM-145", "YUIM-156", "CF-234", "CF-245"
    ])],
    ["Tuan Hoang", new Set([
      "YUIM-167", "YUIM-178", "CF-256", "CF-267"
    ])]
  ]),
  
  // Project-based indexing
  byProject: new Map([
    ["YUIM", new Set([
      "YUIM-129", "YUIM-145", "YUIM-156", "YUIM-167", "YUIM-178"
    ])],
    ["CF", new Set([
      "CF-234", "CF-245", "CF-256", "CF-267" 
    ])]
  ]),
  
  // Status-based indexing
  byStatus: new Map([
    ["Done", new Set(["YUIM-129", "CF-234", "CF-245"])],
    ["In Progress", new Set(["YUIM-145", "CF-256"])],
    ["Ready for QA", new Set(["YUIM-156", "YUIM-167", "CF-267"])]
  ]),
  
  // Issue type indexing
  byIssueType: new Map([
    ["Bug", new Set(["YUIM-129", "CF-234"])],
    ["Story", new Set(["YUIM-145", "YUIM-156", "CF-245"])],
    ["Task", new Set(["YUIM-167", "YUIM-178", "CF-256", "CF-267"])]
  ]),
  
  // Severity-based indexing  
  bySeverity: new Map([
    ["Critical", new Set(["YUIM-129"])],
    ["Major", new Set(["CF-234", "YUIM-145"])],
    ["Minor", new Set(["YUIM-156", "CF-245"])],
    ["Low", new Set(["YUIM-167", "CF-256"])]
  ]),
  
  // Root cause indexing
  byRootCause: new Map([
    ["Logic Error", new Set(["YUIM-129", "CF-234"])],
    ["Implementation Issue", new Set(["YUIM-145"])],
    ["Communication Gaps", new Set(["YUIM-156", "CF-245"])]
  ]),
  
  // Time-based indexing
  byTimeRange: new Map([
    ["2024-W01", new Set(["YUIM-129", "CF-234"])],
    ["2024-W02", new Set(["YUIM-145", "YUIM-156"])],
    ["2024-W03", new Set(["CF-245", "YUIM-167"])]
  ]),
  
  // Composite indexing for common filter combinations
  byDeveloperAndProject: new Map([
    ["Andra Satria|YUIM", new Set(["YUIM-129", "YUIM-145", "YUIM-156"])],
    ["Andra Satria|CF", new Set(["CF-234", "CF-245"])],
    ["Tuan Hoang|YUIM", new Set(["YUIM-167", "YUIM-178"])],
    ["Tuan Hoang|CF", new Set(["CF-256", "CF-267"])]
  ])
}
```

### **Index Building Strategy**

```javascript
const buildIndices = (issues) => {
  const indices = {
    byDeveloper: new Map(),
    byProject: new Map(),
    byStatus: new Map(),
    bySeverity: new Map(),
    byIssueType: new Map(),
    byRootCause: new Map(),
    byTimeRange: new Map()
  }
  
  // Single-pass index building during main processing
  issues.forEach(issue => {
    const issueKey = issue.key
    const assignee = issue.fields?.assignee?.displayName
    const project = issue.fields?.project?.key
    const status = issue.fields?.status?.name
    const issueType = issue.fields?.issuetype?.name
    
    // Build developer index
    if (assignee) {
      if (!indices.byDeveloper.has(assignee)) {
        indices.byDeveloper.set(assignee, new Set())
      }
      indices.byDeveloper.get(assignee).add(issueKey)
    }
    
    // Build project index
    if (project) {
      if (!indices.byProject.has(project)) {
        indices.byProject.set(project, new Set())
      }
      indices.byProject.get(project).add(issueKey)
    }
    
    // Continue for other dimensions...
  })
  
  return indices
}
```

---

## 3.6 Chart Data Structures

### **Chart.js Compatible Data Structure**

**Complex Mixed Chart Configuration**:

```javascript
const chartData = {
  // Chart datasets (stacked bars + line overlays)
  datasets: [
    // Developer story point bars
    {
      label: "Andra Satria",
      data: [25, 30, 28, 32, 27],      // Weekly story points
      backgroundColor: "rgba(33, 150, 243, 0.8)",
      borderColor: "rgba(33, 150, 243, 1)", 
      borderWidth: 1,
      type: "bar",
      stack: "story-points",
      yAxisID: "y",
      
      // Custom metadata for tooltip and interaction
      metadata: {
        developerId: "712020:92de1f44-d98b-40dc-b39e-244fff709123",
        developerLevel: "senior",
        targetPoints: [30, 30, 30, 30, 30],
        performance: ["under", "at_target", "under", "over", "under"]
      }
    },
    
    {
      label: "Tuan Hoang", 
      data: [28, 32, 30, 35, 31],
      backgroundColor: "rgba(76, 175, 80, 0.8)",
      borderColor: "rgba(76, 175, 80, 1)",
      borderWidth: 1,
      type: "bar",
      stack: "story-points", 
      yAxisID: "y",
      
      metadata: {
        developerId: "640e83ba0e6828ab2023c2c8",
        developerLevel: "senior",
        targetPoints: [30, 30, 30, 30, 30],
        performance: ["under", "over", "at_target", "over", "over"]
      }
    },
    
    // Target line overlays (dynamic based on project types)
    {
      label: "Target (Senior)", 
      data: [30, 30, 30, 30, 30],
      borderColor: "#4caf50",
      backgroundColor: "transparent",
      borderWidth: 2,
      borderDash: [5, 5],
      type: "line",
      yAxisID: "y1",
      pointRadius: 0,
      tension: 0,
      
      // Target line metadata
      metadata: {
        targetType: "senior",
        projectType: "STORYPOINT_BASE", 
        timePeriod: "week"
      }
    },
    
    {
      label: "Target (Middle)",
      data: [25, 25, 25, 25, 25], 
      borderColor: "#2196f3",
      backgroundColor: "transparent",
      borderWidth: 2,
      borderDash: [5, 5],
      type: "line",
      yAxisID: "y1",
      pointRadius: 0,
      tension: 0,
      
      metadata: {
        targetType: "middle",
        projectType: "STORYPOINT_BASE",
        timePeriod: "week"
      }
    }
  ],
  
  // Time period labels
  labels: ["W01 2024", "W02 2024", "W03 2024", "W04 2024", "W05 2024"],
  
  // Chart configuration metadata
  metadata: {
    chartType: "teamContribution",
    timeframe: "weekly",
    projectKeys: ["YUIM", "CF", "IS"],
    developerCount: 15,
    totalDataPoints: 75,
    lastUpdated: "2024-01-25T14:30:00.000Z",
    
    // Performance summary
    performanceSummary: {
      overPerformers: ["Tuan Hoang", "David Duy Nguyen"],
      atTarget: ["Minh Tran", "Vincent Yapranz"],
      underPerformers: ["Andra Satria", "Minh Ta"],
      averagePerformance: 98.5
    },
    
    // Filter state when chart was generated
    appliedFilters: {
      developers: ["Andra Satria", "Tuan Hoang", "David Duy Nguyen"],
      projects: ["YUIM", "CF"],
      timeframe: "weekly",
      statusFilter: ["Done", "Ready for QA", "In QA"]
    }
  }
}
```

### **Bug Trend Chart Structure**

```javascript
const bugTrendData = {
  datasets: [
    // Bug rate trend line
    {
      label: "Bug Rate %",
      data: [8.5, 7.2, 6.8, 7.5, 6.1],
      borderColor: "#f44336",
      backgroundColor: "rgba(244, 67, 54, 0.1)",
      borderWidth: 2,
      type: "line",
      yAxisID: "y",
      tension: 0.3,
      
      // Trend analysis metadata
      metadata: {
        trendDirection: "improving",    // improving/stable/declining
        trendValue: -0.8,              // linear regression slope
        confidenceLevel: 0.85,         // statistical confidence
        dataQuality: "high"            // data completeness
      }
    },
    
    // Bug count bars
    {
      label: "Bug Count",
      data: [12, 8, 9, 11, 7],
      backgroundColor: "rgba(244, 67, 54, 0.6)",
      borderColor: "#f44336",
      borderWidth: 1,
      type: "bar",
      yAxisID: "y1"
    }
  ],
  
  labels: ["W01", "W02", "W03", "W04", "W05"],
  
  metadata: {
    analysisType: "bugTrend",
    timeWindow: 5,                     // weeks analyzed
    totalBugs: 47,
    totalIssues: 385,
    overallBugRate: 12.2,
    
    // Statistical analysis
    regression: {
      slope: -0.8,                     // bugs per week change
      intercept: 9.2,
      rSquared: 0.73,
      pValue: 0.045
    },
    
    // Quality insights
    insights: {
      significantImprovement: true,
      confidenceLevel: 0.85,
      recommendedActions: [
        "Continue current quality practices",
        "Monitor for sustained improvement"
      ]
    }
  }
}
```

---

## 3.7 Filter State Structures

### **Comprehensive Filter State**

```javascript
const filterState = {
  // Multi-select filters (arrays)
  developers: [
    "Andra Satria",
    "Tuan Hoang", 
    "David Duy Nguyen"
  ],
  
  projects: [
    "YUIM",
    "CF", 
    "IS"
  ],
  
  issueTypes: [
    "Bug",
    "Story",
    "Task"
  ],
  
  statuses: [
    "Done", 
    "Ready for QA",
    "In QA",
    "Dev Test"
  ],
  
  severities: [
    "Critical",
    "Major",
    "Minor"
  ],
  
  rootCauses: [
    "Logic Error",
    "Implementation Issue",
    "Communication Gaps"
  ],
  
  // Date range filter (object)
  dateRange: {
    startDate: "2024-01-01T00:00:00.000Z",
    endDate: "2024-01-31T23:59:59.999Z"
  },
  
  // Single-select filters
  timeframe: "weekly",               // weekly/monthly/quarterly
  statusFilter: "delivered",         // all/delivered/in_progress
  
  // Performance-specific filters
  performanceFilter: {
    showTargetLines: true,
    showPerformanceMetadata: true,
    performanceThreshold: "all",     // all/over/under/at_target
    levelFilter: "all"               // all/senior/middle
  },
  
  // Advanced filters
  advancedFilters: {
    minStoryPoints: 0,
    maxStoryPoints: null,
    hasTimeLogged: null,             // null/true/false
    isReopened: null,                // null/true/false
    isOverdue: null,                 // null/true/false
    estimationAccuracy: {            // percentage range
      min: null,
      max: null
    }
  },
  
  // Filter metadata
  metadata: {
    lastApplied: "2024-01-25T14:30:00.000Z",
    totalFiltersActive: 8,
    hasActiveFilters: true,
    filterHash: "a7b8c9d0e1f2",      // for cache invalidation
    
    // Filter performance tracking
    performance: {
      lastFilterTime: 45,            // milliseconds
      avgFilterTime: 38,
      filterCount: 1247
    },
    
    // Validation status
    validation: {
      isValid: true,
      errors: [],
      warnings: ["Date range spans multiple quarters"]
    }
  }
}
```

### **Filter Options Structure**

**Available filter values** (dynamically generated):

```javascript
const filterOptions = {
  developers: [
    // All configured developers with metadata
    {
      name: "Andra Satria",
      jiraId: "712020:92de1f44-d98b-40dc-b39e-244fff709123",
      level: "senior",
      role: "developer",
      issueCount: 147,
      active: true
    },
    {
      name: "Tuan Hoang",
      jiraId: "640e83ba0e6828ab2023c2c8", 
      level: "senior",
      role: "developer",
      issueCount: 132,
      active: true
    }
  ],
  
  projects: [
    // All configured projects with metadata
    {
      key: "YUIM",
      name: "Yuime",
      pointType: "STORYPOINT_BASE",
      issueCount: 2847,
      activeDevelopers: 12,
      active: true
    },
    {
      key: "CF", 
      name: "Calbee-FfF",
      pointType: "STORYPOINT_BASE",
      issueCount: 1523,
      activeDevelopers: 8,
      active: true
    }
  ],
  
  issueTypes: [
    { name: "Bug", count: 245, icon: "bug_report" },
    { name: "Story", count: 1834, icon: "auto_stories" },
    { name: "Task", count: 956, icon: "task" },
    { name: "Epic", count: 45, icon: "epic" }
  ],
  
  statuses: [
    { name: "Done", count: 2456, category: "done" },
    { name: "In Progress", count: 345, category: "in_progress" },
    { name: "Ready for QA", count: 123, category: "in_progress" },
    { name: "To Do", count: 234, category: "to_do" }
  ],
  
  severities: [
    { name: "Critical", count: 23, weight: 1.0, color: "#f44336" },
    { name: "Major", count: 156, weight: 0.7, color: "#ff9800" },
    { name: "Minor", count: 234, weight: 0.5, color: "#ffc107" },
    { name: "Low", count: 145, weight: 0.3, color: "#4caf50" }
  ],
  
  rootCauses: [
    { name: "Logic Error", count: 89 },
    { name: "Implementation Issue", count: 67 },
    { name: "Communication Gaps", count: 45 },
    { name: "Insufficient Testing", count: 34 }
  ],
  
  // Metadata about filter options
  metadata: {
    lastUpdated: "2024-01-25T14:30:00.000Z",
    totalDevelopers: 32,
    totalProjects: 25,
    totalIssues: 10547,
    dataCompleteness: 0.98
  }
}
```

---

## 3.8 Cache Metadata Structures

### **IndexedDB Store Structures**

**6-Store Architecture** for granular caching:

#### **Store 1: Metrics**
```javascript
const metricsStore = {
  keyPath: "developerId",
  data: {
    developerId: "712020:92de1f44-d98b-40dc-b39e-244fff709123",
    name: "Andra Satria",
    metrics: {
      // Extended developer stats structure (as defined above)
    },
    timestamp: 1706102400000,
    version: "2.1.0"
  }
}
```

#### **Store 2: Chart Data**
```javascript
const chartDataStore = {
  keyPath: "chartId",
  data: {
    chartId: "teamContribution_weekly_2024-W01-W05",
    chartType: "teamContribution",
    timeframe: "weekly",
    datasets: [
      // Chart.js datasets (as defined above)
    ],
    appliedFilters: {
      // Filter state when generated
    },
    timestamp: 1706102400000,
    expiresAt: 1706188800000
  }
}
```

#### **Store 3: Indices**
```javascript
const indicesStore = {
  keyPath: "indexType",
  data: {
    indexType: "byDeveloper",
    indices: new Map([
      // Index structures (as defined above)
    ]),
    buildTimestamp: 1706102400000,
    recordCount: 10547,
    version: "2.1.0"
  }
}
```

#### **Store 4: Filter Options**
```javascript
const filterOptionsStore = {
  keyPath: "optionType", 
  data: {
    optionType: "developers",
    options: [
      // Filter options array (as defined above)  
    ],
    lastCalculated: 1706102400000,
    cacheExpiry: 604800000          // 7 days
  }
}
```

#### **Store 5: Minimal Issues**
```javascript
const minimalIssuesStore = {
  keyPath: "issueKey",
  data: {
    issueKey: "YUIM-129",
    summary: "Fix login validation logic", 
    assignee: "Andra Satria",
    project: "YUIM",
    status: "Done",
    issueType: "Bug",
    created: "2024-01-15T10:30:00.000Z",
    storyPoints: 5,
    
    // Minimal metadata for fast queries
    searchTokens: ["fix", "login", "validation", "logic"],
    indexHint: "developer:andra_satria|project:yuim|status:done"
  }
}
```

#### **Store 6: Metadata**
```javascript
const metadataStore = {
  keyPath: "metaKey",
  data: {
    metaKey: "cache_info",
    lastUpdated: 1706102400000,
    dataVersion: "2.1.0",
    recordCount: 10547,
    cacheSize: 125000000,            // bytes
    
    // Cache statistics  
    stats: {
      totalCacheHits: 15420,
      totalCacheMisses: 234,
      cacheHitRatio: 0.985,
      avgResponseTime: 45,           // milliseconds
      
      // Per-store statistics
      storeStats: {
        metrics: { size: 45000000, records: 32 },
        chart_data: { size: 35000000, records: 15 },
        indices: { size: 25000000, records: 7 },
        filter_options: { size: 15000000, records: 6 },
        minimal_issues: { size: 5000000, records: 10547 },
        metadata: { size: 100000, records: 10 }
      }
    },
    
    // Cache health
    health: {
      isHealthy: true,
      lastHealthCheck: 1706102400000,
      issues: [],
      recommendations: []
    }
  }
}
```

---

## 3.9 Configuration Data Structures

### **Member Configuration Structure**

**Comprehensive 978-line configuration** (memberConfiguration.js):

```javascript
const memberConfiguration = {
  // Developer array (32+ active developers)
  developers: [
    {
      jiraId: "712020:92de1f44-d98b-40dc-b39e-244fff709123",
      name: "Andra Satria", 
      level: "senior"                // senior/middle
    }
  ],
  
  // QA team array (currently empty, but structure ready)
  qa: [],
  
  // Project configurations (25 active projects)
  projects: [
    {
      key: "YUIM",
      name: "Yuime",
      pointType: "STORYPOINT_BASE"   // STORYPOINT_BASE/HOURS_BASE
    }
  ],
  
  // Available issue types
  issueTypes: [
    "Bug", "Capacity", "Epic", "Improvement", "Meeting",
    "PR Review", "Question", "SD-Improvement", "Story", 
    "Sub-task", "Subtask", "Task"
  ],
  
  // Root cause categories
  rootCauses: [
    "Change in Design", "Change in Requirements", "Communication Gaps",
    "Concurrency Issue", "Customer Perspective", "Data Migration",
    // ... 23 total categories
  ],
  
  // Available statuses
  statuses: [
    "BACK FROM QA", "BLOCK", "BLOCKED", "Back from QA",
    // ... 37 total statuses  
  ],
  
  // KPI calculation settings
  kpiSettings: {
    onlyCalculateForConfiguredMembers: true,
    minimumStoryPointsThreshold: 0,
    excludeUnassigned: true,
    separateByRole: true
  },
  
  // Reopen detection configuration
  reopenDetection: {
    default: {
      reopenStatuses: ["REOPENED", "Reopened"],
      reopenTransitions: [
        { 
          from: ["Done", "Closed", "Resolved"], 
          to: ["In Progress", "To Do", "Open"] 
        }
      ]
    }
  },
  
  // Severity mapping configuration
  severityConfiguration: {
    default: {
      severityField: "customfield_10049",
      usePriorityFallback: true,
      severityMapping: {
        "Critical": "Critical",
        "Functional": "Major",
        "High": "Major",
        "Medium": "Minor",
        "Low": "Low"
      },
      severityLevels: ["Critical", "Major", "Minor", "Low", "Cosmetic"],
      severityWeights: {
        "Critical": 1.0,
        "Major": 0.7,
        "Minor": 0.5,
        "Low": 0.3,
        "Cosmetic": 0.1
      },
      defaultSeverity: "Minor"
    }
  },
  
  // Performance targets by project type and developer level
  performanceTargets: {
    HOURS_BASE: {
      all: {
        totalPointWeekTarget: 35,
        totalPointMonthTarget: 140,
        totalPointQuarterTarget: 420
      }
    },
    STORYPOINT_BASE: {
      middle: {
        totalPointWeekTarget: 25,
        totalPointMonthTarget: 100,
        totalPointQuarterTarget: 300
      },
      senior: {
        totalPointWeekTarget: 30,
        totalPointMonthTarget: 90,
        totalPointQuarterTarget: 270
      }
    }
  },
  
  // Chart.js target line configurations
  targetLineConfig: {
    HOURS_BASE: {
      all: {
        color: '#ff9800',
        borderWidth: 2,
        borderDash: [5, 5],
        label: 'Target (All)'
      }
    },
    STORYPOINT_BASE: {
      middle: {
        color: '#2196f3',
        borderWidth: 2, 
        borderDash: [5, 5],
        label: 'Target (Middle)'
      },
      senior: {
        color: '#4caf50',
        borderWidth: 2,
        borderDash: [5, 5], 
        label: 'Target (Senior)'
      }
    }
  },
  
  // Default filter values
  filterDefaults: {
    statusFilter: [
      "BACK FROM QA", "BLOCK", "BLOCKED", "Done",
      // ... 30 total "delivered" statuses
    ]
  }
}
```

---

## 3.10 Error and State Management Structures

### **Error State Structure**

```javascript
const errorState = {
  // Error information
  hasError: false,
  error: null,
  errorType: null,                   // 'network'|'processing'|'validation'|'system'
  errorCode: null,
  
  // Error context
  errorContext: {
    operation: "processJiraIssues",
    timestamp: "2024-01-25T14:30:00.000Z",
    userAgent: "Mozilla/5.0...",
    url: window.location.href,
    userId: "current_user_id",
    
    // Application state when error occurred
    appState: {
      dataLoaded: true,
      filtersActive: true,
      lastOperation: "filter_update",
      memoryUsage: 245000000
    }
  },
  
  // Recovery information
  recovery: {
    isRecoverable: true,
    retryCount: 0,
    maxRetries: 3,
    retryDelay: 1000,               // milliseconds
    nextRetryAt: null,
    
    // Recovery strategies
    strategies: [
      "clear_cache_and_retry",
      "reload_data_from_source", 
      "reset_filters_and_retry",
      "full_page_reload"
    ]
  },
  
  // Error reporting
  reporting: {
    shouldReport: true,
    reportedAt: null,
    reportId: null,
    
    // Sanitized error details for reporting
    sanitizedError: {
      message: "Processing failed",
      stack: "sanitized_stack_trace",
      userActions: ["applied_filter", "refreshed_data"]
    }
  }
}
```

### **Loading State Structure**

```javascript
const loadingState = {
  // Overall loading status
  isLoading: false,
  
  // Granular loading states
  loadingStates: {
    fetchingData: false,
    processingData: false,
    buildingIndices: false,
    applyingFilters: false,
    generatingCharts: false,
    savingToCache: false
  },
  
  // Progress tracking
  progress: {
    currentOperation: "processingData",
    currentStep: "calculating_extended_stats",
    stepProgress: 0.67,             // 0-1
    totalProgress: 0.45,            // 0-1
    
    // Detailed progress breakdown
    stepDetails: {
      totalIssues: 10547,
      processedIssues: 7034,
      currentDeveloper: "Andra Satria",
      estimatedTimeRemaining: 1500  // milliseconds
    }
  },
  
  // Performance monitoring during loading
  performance: {
    startTime: 1706102400000,
    operations: [
      {
        name: "fetch_data",
        startTime: 1706102400000,
        endTime: 1706102401500,
        duration: 1500
      },
      {
        name: "process_data", 
        startTime: 1706102401500,
        endTime: null,                // Still running
        duration: null
      }
    ]
  }
}
```

---

## 3.11 Data Structure Performance Characteristics

### **Memory Usage Analysis**

```javascript
const memoryUsageBreakdown = {
  // Raw data structures
  rawJiraIssues: 75000000,         // ~75MB for 10k issues
  
  // Processed structures  
  extendedDeveloperStats: 15000000,  // ~15MB for 32 developers
  performanceMetadata: 25000000,     // ~25MB (triple-nested Maps)
  filterIndices: 20000000,           // ~20MB (multi-dimensional indices)
  
  // Chart data
  chartDatasets: 10000000,           // ~10MB (preprocessed chart data)
  
  // Filter and UI state
  filterState: 1000000,              // ~1MB
  uiState: 2000000,                  // ~2MB
  
  // Cache overhead
  cacheMetadata: 5000000,            // ~5MB
  
  // Total estimated memory: ~153MB for 10k issues
  totalEstimated: 153000000,
  
  // Scaling projections
  scalingFactors: {
    issueCount: 0.0075,              // MB per issue
    developerCount: 0.47,            // MB per developer  
    projectCount: 0.8,               // MB per project
    timeWindow: 2.1                  // MB per week of data
  }
}
```

### **Access Pattern Performance**

```javascript
const accessPatterns = {
  // O(1) operations using indices
  developerLookup: "O(1)",          // Map-based developer access
  projectLookup: "O(1)",             // Map-based project access
  filterApplication: "O(1)",         // Set intersection of pre-built indices
  
  // O(log n) operations
  timeRangeLookup: "O(log n)",       // Binary search on sorted time data
  
  // O(n) operations (single-pass)
  dataProcessing: "O(n)",            // Single-loop processing
  indexBuilding: "O(n)",             // Built during processing
  
  // Amortized complexity
  cacheAccess: "O(1) amortized",     // IndexedDB with occasional cache misses
  
  // Performance benchmarks (10k issues)
  benchmarks: {
    fullDataLoad: 3000,              // 3 seconds
    filterApplication: 50,           // 50 milliseconds
    chartRegeneration: 200,          // 200 milliseconds
    cacheHit: 10,                   // 10 milliseconds
    indexLookup: 1                   // 1 millisecond
  }
}
```

---

**Data Structure Summary**:
- **50+ field JIRA structures** with complete metadata
- **15+ field extended developer stats** with nested time tracking
- **Triple-nested performance Maps** for O(1) access
- **Multi-dimensional indices** for instant filtering
- **Complex chart data structures** with metadata
- **Comprehensive filter state** with validation
- **6-store IndexedDB schema** for granular caching
- **978-line configuration** with helper functions
- **Sophisticated error/state management** structures
- **Memory-optimized design** scaling to 50k+ issues