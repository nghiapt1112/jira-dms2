# Data Structures Documentation
## JIRA DMS Application

This document contains all data structures used across the JIRA DMS application components.

---

## Table of Contents
1. [MainDashboard Data Structures](#1-maindashboard-data-structures)
2. [DeveloperQualityDashboard Data Structures](#2-developerqualitydashboard-data-structures)
3. [QAPerformanceDashboard Data Structures](#3-qaperformancedashboard-data-structures)
4. [Common Data Structures](#4-common-data-structures)
5. [JIRA Custom Field Constants](#5-jira-custom-field-constants)

---

## 1. MainDashboard Data Structures

### 1.1 Project Object Structure
The core project object used throughout the MainDashboard component.

```javascript
{
  id: string,
  key: string,
  name: string,
  status: 'On Track' | 'At Risk' | 'Delayed' | 'Completed',
  progress: number (0-100),
  quality: number (0-100),
  effort: number,
  delivery: number (0-100),
  health: number (0-100),
  totalIssues: number,
  completedIssues: number,
  bugs: array | number,
  critical: number,
  highSeverity: number,
  plannedEffort: number,
  actualEffort: number,
  onTimeDelivery: number,
  delayedDelivery: number,
  latenessPercent: number,
  scopeCreepPercent: number,
  weightedBugCount: number,
  qualityScore: number,
  // Additional fields for charts
  highSeverityBugs: number,
  bugRate: number,
  lastDelivery: Date,
  tasksOnTime: number,
  tasksDelayed: number
}
```

### 1.2 Chart Data Structures

#### 1.2.1 ProjectHealthOverview - Scatter Chart Data (Quality vs Delivery Performance)
**Chart Type**: ScatterChart (Recharts)  
**Purpose**: Visualize relationship between project quality and delivery performance  
**Data Payload**:
```javascript
[
  {
    "id": "PROJ-001",
    "key": "PROJ-001", 
    "name": "E-commerce Platform",
    "qualityScore": 85.67,
    "delivery": 78.50,
    "effort": 120,
    "bugs": [
      {
        "key": "PROJ-123",
        "fields": {
          "issuetype": {"name": "Bug"},
          "customfield_10049": {"value": "Major"}
        }
      }
    ],
    "highSeverityBugs": 3,
    "weightedBugCount": 12.45,
    "totalIssues": 45
  }
]
```

#### 1.2.2 ProjectHealthOverview - Scatter Chart Data (Quality vs Health Performance)  
**Chart Type**: ScatterChart (Recharts)  
**Purpose**: Show relationship between quality and overall project health  
**Data Payload**:
```javascript
[
  {
    "id": "PROJ-001",
    "key": "PROJ-001",
    "name": "E-commerce Platform", 
    "qualityScore": 85.67,
    "health": 82.34,
    "effort": 120,
    "bugs": [
      {
        "key": "PROJ-123",
        "fields": {
          "issuetype": {"name": "Bug"},
          "customfield_10049": {"value": "Critical"}
        }
      }
    ],
    "highSeverityBugs": 3,
    "progress": 75.20
  }
]
```

#### 1.2.3 ProjectHealthOverview - Data Table Payload
**Component**: Material-UI Table with pagination  
**Purpose**: Detailed project metrics in tabular format  
**Data Payload**:
```javascript
[
  {
    "id": "PROJ-001",
    "key": "PROJ-001",
    "name": "E-commerce Platform",
    "progress": 75.20,
    "totalIssues": 45,
    "bugs": [
      {"key": "PROJ-123", "fields": {"issuetype": {"name": "Bug"}}},
      {"key": "PROJ-124", "fields": {"issuetype": {"name": "Bug"}}}
    ],
    "storyPoints": 120.5,
    "weightedBugCount": 12.45,
    "highSeverityBugs": 3,
    "qualityScore": 85.67,
    "health": 82.34
  }
]
```

#### 1.2.4 ProjectDelivery - Bar Chart Data (Delivery Efficiency)
**Chart Type**: BarChart (Recharts)  
**Purpose**: Compare delivery efficiency across projects  
**Data Payload**:
```javascript
[
  {
    "name": "E-commerce Platform",
    "delivery": 78.50,
    "onTime": 31,
    "delayed": 9,
    "efficiency": 78.50
  },
  {
    "name": "Mobile App",
    "delivery": 85.20,
    "onTime": 17,
    "delayed": 3,
    "efficiency": 85.20
  }
]
```

#### 1.2.5 ProjectDelivery - Circular Summary Data
**Component**: Custom circular dashboard  
**Purpose**: Overall delivery rate visualization  
**Data Payload**:
```javascript
{
  "overall": 81.75,
  "categories": [
    {
      "label": "On Time",
      "count": 15,
      "color": "#4caf50"
    },
    {
      "label": "Delayed", 
      "count": 8,
      "color": "#ff9800"
    },
    {
      "label": "Critical",
      "count": 2,
      "color": "#f44336"
    }
  ]
}
```

#### 1.2.6 ProjectDelivery - Recent Deliveries Grid Data
**Component**: Material-UI Grid with project cards  
**Purpose**: Display last 3 projects with completed deliveries  
**Data Payload**:
```javascript
[
  {
    "key": "PROJ-001",
    "name": "E-commerce Platform",
    "lastDelivery": "2024-01-15T10:30:00.000Z",
    "tasksOnTime": 31,
    "tasksDelayed": 9,
    "efficiency": 78.50
  },
  {
    "key": "PROJ-002", 
    "name": "Mobile App",
    "lastDelivery": "2024-01-12T14:20:00.000Z",
    "tasksOnTime": 17,
    "tasksDelayed": 3,
    "efficiency": 85.20
  }
]
```

#### 1.2.7 Sprint Metrics - Legacy Line Chart Data (Timeliness)
**Chart Type**: LineChart (Recharts) - Currently hidden  
**Purpose**: Sprint-by-sprint timeliness trends  
**Data Payload**:
```javascript
[
  {
    "sprintName": "Sprint 15",
    "project_PROJ001": 78.5,
    "project_PROJ002": 85.2,
    "project_PROJ003": 92.1
  },
  {
    "sprintName": "Sprint 16", 
    "project_PROJ001": 82.3,
    "project_PROJ002": 79.8,
    "project_PROJ003": 88.6
  }
]
```

#### 1.2.8 Sprint Metrics - Stacked Bar Chart Data (Timeliness)
**Chart Type**: BarChart (Recharts) with stacked bars  
**Purpose**: Sprint-level on-time vs late issues breakdown  
**Data Payload**:
```javascript
[
  {
    "sprintName": "Sprint 15",
    "totalIssues": 40,
    "onTimeIssues": 31,
    "lateIssues": 9,
    "timeliness": 77.5
  },
  {
    "sprintName": "Sprint 16",
    "totalIssues": 35,
    "onTimeIssues": 29,
    "lateIssues": 6,
    "timeliness": 82.9
  }
]
```

#### 1.2.9 Sprint Metrics - Monthly Aggregation Bar Chart (Timeliness V2)
**Chart Type**: BarChart (Recharts)  
**Purpose**: Aggregated timeliness by month across all projects  
**Data Payload**:
```javascript
[
  {
    "month": "Jan 2024",
    "timeliness": 81.2
  },
  {
    "month": "Feb 2024", 
    "timeliness": 78.9
  },
  {
    "month": "Mar 2024",
    "timeliness": 85.3
  }
]
```

#### 1.2.10 Sprint Metrics - Stacked Bar Chart Data (Scope Creep)
**Chart Type**: BarChart (Recharts) with stacked bars  
**Purpose**: Sprint-level planned vs added issues breakdown  
**Data Payload**:
```javascript
[
  {
    "sprintName": "Sprint 15",
    "plannedIssues": 35,
    "addedIssues": 5,
    "totalIssues": 40,
    "scopeCreep": 12.5
  },
  {
    "sprintName": "Sprint 16",
    "plannedIssues": 32,
    "addedIssues": 3,
    "totalIssues": 35,
    "scopeCreep": 8.6
  }
]
```

#### 1.2.11 Sprint Metrics - Monthly Aggregation Bar Chart (Scope Creep V2)
**Chart Type**: BarChart (Recharts)  
**Purpose**: Aggregated scope creep by month across all projects  
**Data Payload**:
```javascript
[
  {
    "month": "Jan 2024",
    "scopeCreep": 15.7
  },
  {
    "month": "Feb 2024",
    "scopeCreep": 11.2
  },
  {
    "month": "Mar 2024", 
    "scopeCreep": 8.9
  }
]
```

#### 1.2.12 Sprint Metrics - Project-Centric Data Structure
**Purpose**: Data organized by project for chart filtering and processing  
**Data Payload**:
```javascript
{
  "projectTimelinessData": {
    "PROJ-001": {
      "projectName": "E-commerce Platform",
      "data": [
        {
          "month": "2024-01",
          "monthName": "Jan 2024",
          "onTime": 31,
          "late": 9,
          "total": 40,
          "percentage": 77.5
        },
        {
          "month": "2024-02",
          "monthName": "Feb 2024", 
          "onTime": 28,
          "late": 7,
          "total": 35,
          "percentage": 80.0
        }
      ]
    }
  },
  "projectScopeCreepData": {
    "PROJ-001": {
      "projectName": "E-commerce Platform",
      "data": [
        {
          "month": "2024-01",
          "monthName": "Jan 2024",
          "scopeCreep": 5,
          "normal": 35,
          "total": 40,
          "percentage": 12.5
        }
      ]
    }
  }
}
```

#### 1.2.13 Sprint Metrics - Detail Popup Issue Data
**Component**: SprintMetricsDetailsPopup modal  
**Purpose**: Filtered issues displayed in detail popup  
**Data Payload**:
```javascript
[
  {
    "key": "PROJ-123",
    "summary": "User login validation failing",
    "status": "Done",
    "assignee": "John Doe",
    "created": "2024-01-10T09:15:00.000Z",
    "resolved": "2024-01-18T16:30:00.000Z",
    "sprint": "Sprint 15",
    "project": "E-commerce Platform",
    "issuetype": "Bug",
    "priority": "High",
    "storyPoints": 3,
    "url": "https://jira.example.com/browse/PROJ-123"
  }
]
```

### 1.3 Component Props Interfaces

#### MainDashboard Props
```typescript
interface MainDashboardProps {
  selectedProjects: string[];
  allIssues: JiraIssue[];
  isLoading: boolean;
}
```

#### SprintMetricsChartsDashboard Props
```typescript
interface SprintMetricsChartsDashboardProps {
  projects: Project[];
  allIssues: JiraIssue[];
  config?: {
    jiraBaseUrl: string;
  };
}
```

### 1.4 Cache Structures

#### Cache Key Generation Parameters
```javascript
{
  selectedProjects: string[],
  totalIssues: number,
  lastUpdated: string
}
```

#### Cache Metadata
```javascript
{
  timestamp: number,
  issueCount: number,
  filters: {
    selectedProjects: string[],
    totalIssues: number,
    lastUpdated: string
  }
}
```

---

## 2. DeveloperQualityDashboard Data Structures

### 2.1 V4 Data Transformation Output

#### 2.1.1 Main Transformed Data Structure
```javascript
{
  teamContributionData: {
    // Chart.js compatible data structure
    labels: string[],           // Time period labels
    datasets: ChartDataset[]    // Developer contribution datasets
  },
  bugAnalysisData: {
    // Recharts compatible data structure
    byRootCause: RootCauseData[],
    byDeveloper: DeveloperRootCauseData[],
    timeline: TimelineBugData[]
  },
  filterOptions: {
    projects: ProjectOption[],
    developers: DeveloperOption[],
    issueTypes: IssueTypeOption[],
    statuses: StatusOption[],
    teamMembers: TeamMemberOption[]
  }
}
```

#### 2.1.2 Dimensional Data Structure (V4 Architecture)
```javascript
{
  byProject: {
    [projectKey]: {
      byDeveloper: {
        [developerId]: {
          byTimeframe: {
            [timeKey]: {
              storyPoints: number,
              issueCount: number,
              issues: Issue[]
            }
          }
        }
      }
    }
  },
  byDeveloper: {
    [developerId]: {
      byProject: {
        [projectKey]: {
          byTimeframe: {
            [timeKey]: {
              storyPoints: number,
              issueCount: number,
              issues: Issue[]
            }
          }
        }
      }
    }
  },
  byTimeframe: {
    [timeKey]: {
      byProject: {
        [projectKey]: {
          byDeveloper: {
            [developerId]: {
              storyPoints: number,
              issueCount: number,
              issues: Issue[]
            }
          }
        }
      }
    }
  },
  byRootCause: {
    [rootCause]: {
      byDeveloper: {
        [developerId]: {
          bugCount: number,
          bugs: Issue[]
        }
      }
    }
  }
}
```

### 2.1.3 Legacy V3 Transformed Data Structure
The main data structure returned by `transformIssuesForDeveloperQuality()`:

```javascript
{
  // Team contribution chart data
  teamContributionData: {
    labels: string[], // Time periods (e.g., ['2024-01', '2024-02'])
    datasets: [
      {
        label: string, // Developer name
        data: number[], // Metric values per time period
        backgroundColor: string,
        borderColor: string,
        borderWidth: number,
        type?: string // Chart type ('bar', 'line')
      }
    ]
  },
  
  // Bug analysis data for root cause analysis
  bugAnalysisData: {
    rootCauseData: {
      [rootCause: string]: {
        count: number,
        percentage: number,
        color: string,
        issues: Issue[]
      }
    },
    projectBugData: {
      [projectKey: string]: {
        bugCount: number,
        totalIssues: number,
        bugRate: number,
        developers: DeveloperMetrics[]
      }
    },
    developerBugData: {
      [developerId: string]: {
        name: string,
        email: string,
        avatar?: string,
        bugs: number,
        totalIssues: number,
        bugRate: number,
        reopenRate: number,
        avgReopenTime: number,
        devTime: number
      }
    }
  },
  
  // Filter options for UI controls
  filterOptions: {
    projects: ProjectOption[],
    developers: DeveloperOption[],
    issueTypes: IssueTypeOption[],
    statuses: StatusOption[],
    teamMembers: TeamMemberOption[]
  },
  
  // Available filter values
  availableProjects: string[],
  availableDevelopers: string[],
  
  // Metadata about the transformation
  metadata: {
    totalIssues: number,
    filteredIssues: number,
    selectedProjects: string[],
    selectedDevelopers: string[],
    filters: FilterObject,
    lastUpdated: string, // ISO date
    version: string // '4.0' for V4, '3.0' for V3 fallback
  }
}
```

### 2.2 Developer Quality Filters Structure
```javascript
{
  selectedProjects: string[],
  selectedDevelopers: string[],
  timeframe: 'week' | 'month' | 'quarter',
  metricType: 'count' | 'storyPoints',
  selectedIssueTypes: string[],
  targetStatus: string[], // Status names to include
  selectedTeamMembers: string[],
  selectedProject: string[], // For team contribution filtering
  showTargetLine: boolean,
  targetFilter: 'all' | 'under' | 'over',
  showLast3Months: boolean
}
```

### 2.3 Chart Data Structures

#### 2.3.1 Team Contribution Chart Data (Chart.js format)
```javascript
{
  labels: string[], // Time periods
  datasets: [
    {
      label: string, // Developer name
      data: number[], // Values for each time period
      backgroundColor: string | string[],
      borderColor: string | string[],
      borderWidth: number,
      type?: 'bar' | 'line'
    }
  ]
}
```

#### 2.3.1.1 Team Contribution Chart Filter Options Structure
```javascript
{
  // Basic filter options
  timeframe: 'week' | 'month' | 'quarter',
  metricType: 'storyPoints' | 'issues',
  selectedIssueTypes: string[],
  targetStatus: string[],
  selectedProject: string[],
  selectedTeamMembers: string[],
  
  // Advanced filter options
  showLast3Months: boolean,
  showTargetLine: boolean,
  targetFilter: 'all' | 'under' | 'over',
  
  // Available options for dropdowns
  filterOptions: {
    issueTypes: string[],
    statuses: string[],
    projects: string[],
    teamMembers: string[]
  },
  
  // Props for filter controls
  projectOptions: string[],
  targetStatusOptions: string[],
  teamMembers: string[]
}
```

#### 2.3.2 Root Cause Analysis Chart Data (Recharts format)
```javascript
// Bar Chart Data
[
  {
    name: string, // Root cause name
    value: number, // Count of issues
    percentage: number, // Percentage of total
    color: string // Color for this root cause
  }
]

// Pie Chart Data
[
  {
    name: string,
    value: number,
    color: string
  }
]

// Treemap Data
[
  {
    name: string,
    size: number,
    color: string
  }
]
```

### 2.4 Filter Option Data Structures

#### 2.4.1 Project Options
```javascript
[
  {
    id: string,             // Project key
    name: string,           // Project name
    issueCount: number,     // Total issues in project
    developers: string[]    // Developers in project
  }
]
```

#### 2.4.2 Developer Options
```javascript
[
  {
    id: string,             // Developer ID
    name: string,           // Developer display name
    email: string,          // Developer email
    projects: string[],     // Projects developer works on
    totalStoryPoints: number, // Total story points delivered
    totalIssues: number     // Total issues completed
  }
]
```

#### 2.4.3 Issue Type Options
```javascript
[
  {
    id: string,             // Issue type ID
    name: string,           // Issue type name
    iconUrl: string,        // Issue type icon URL
    count: number           // Number of issues of this type
  }
]
```

#### 2.4.4 Status Options
```javascript
[
  {
    id: string,             // Status ID
    name: string,           // Status name
    category: string,       // Status category (To Do, In Progress, Done)
    count: number           // Number of issues in this status
  }
]
```

### 2.5 Bug Analysis Data Structures

#### 2.5.1 Bug Rate Analysis Data
```javascript
{
  bugsByDeveloper: {
    [developerId]: {
      bugsCaused: number,         // Bugs caused by developer
      featuresCompleted: number,  // Features completed by developer
      bugRate: number,            // Bug rate percentage
      reopenRate: number,         // Reopen rate percentage
      avgReopenTime: number,      // Average reopen time (days)
      totalDevTime: number,       // Total development time (days)
      issuesWithBugs: Issue[],    // Issues that caused bugs
      reopenedIssues: Issue[]     // Issues that were reopened
    }
  },
  projectMetrics: {
    [projectKey]: {
      totalBugs: number,          // Total bugs in project
      totalFeatures: number,      // Total features in project
      overallBugRate: number,     // Project bug rate
      developersInvolved: number  // Number of developers
    }
  },
  timelineData: {
    weekly: WeeklyBugData[],     // Weekly bug metrics
    monthly: MonthlyBugData[]    // Monthly bug metrics
  },
  rootCauseAnalysis: {
    byRootCause: RootCauseData[],           // Root cause distribution
    byDeveloper: DeveloperRootCauseData[]   // Developer root cause mapping
  }
}
```

#### 2.5.2 Weekly/Monthly Bug Data
```javascript
{
  period: string,           // "2024-W01" or "2024-01"
  bugsFound: number,        // Bugs discovered in period
  bugsFixed: number,        // Bugs resolved in period
  bugsCaused: number,       // Bugs caused by development in period
  reopenCount: number,      // Issues reopened in period
  avgFixTime: number,       // Average time to fix bugs (days)
  escapeRate: number,       // Bugs that escaped to production
  regressionRate: number    // Bugs caused by fixes
}
```

#### 2.5.3 Bug Trend Analysis Data Structure (ComposedChart)
```javascript
[
  {
    week: string,           // Week identifier ("2024-W01") or
    month: string,          // Month identifier ("2024-01")
    opened: number,         // New bugs opened in period
    closed: number,         // Bugs closed in period
    reopened: number,       // Bugs reopened in period
    backlogTrend: number,   // Backlog trend value
    totalBugs: number       // Total bugs count
  }
]
```

#### 2.5.4 Developer Root Cause Matrix Data Structure (Heatmap/Table)
```javascript
[
  {
    developer: string,      // Developer name
    totalBugs: number,      // Total bugs for developer
    bugIds: string[],       // Array of bug IDs
    rootCauses: {           // Root cause breakdown
      [rootCauseName]: number  // Count for each root cause
    },
    rootCauseBugIds: {      // Bug IDs per root cause
      [rootCauseName]: string[]  // Bug IDs for each root cause
    }
  }
]
```

#### 2.5.5 Bug Rate Analysis Table Data Structure
```javascript
[
  {
    developer: string,         // Developer name
    avatar: string,            // Avatar URL
    projects: string[],        // Projects list
    bugRate: number,           // Bug rate percentage
    features: number,          // Features completed
    bugs: number,              // Bugs assigned
    bugsCaused: number,        // Bugs caused by developer
    reopenRate: number,        // Reopen rate percentage
    reopenedBugs: number,      // Count of reopened bugs
    avgReopens: number,        // Average reopens per bug
    maxReopens: number,        // Maximum reopens for single bug
    avgTime: number,           // Average resolution time (days)
    criticalAvgTime: number,   // Critical bug avg time
    majorAvgTime: number,      // Major bug avg time
    minorAvgTime: number,      // Minor bug avg time
    efficiency: number,        // Estimation efficiency percentage
    completionPercentage: number,  // Issue completion percentage
    avgResolutionTime: number, // Average resolution time
    
    // Ticket arrays for modal popups
    featureTickets: Ticket[],  // Feature tickets
    bugTickets: Ticket[],      // Bug tickets
    causedBugTickets: Ticket[] // Caused bug tickets
  }
]
```

#### 2.5.6 Ticket Data Structure (for Modal Popups)
```javascript
{
  key: string,              // Ticket key (e.g., "PROJ-123")
  summary: string,          // Ticket summary
  priority: string,         // Priority level
  status: string            // Current status
}
```

#### 2.5.7 Treemap Data Structure
```javascript
[
  {
    name: string,           // Root cause name
    size: number,           // Bug count (determines rectangle size)
    color: string,          // Rectangle color
    children: [             // Sub-categories (optional)
      {
        name: string,       // Sub-category name
        size: number,       // Sub-category bug count
        color: string       // Sub-category color
      }
    ]
  }
]
```

### 2.6 V4 Architecture Data Structures

#### 2.6.1 Dimensional Data Structure
```javascript
{
  // Pre-processed dimensional data for instant filtering
  byProject: {
    [projectKey: string]: {
      issues: Issue[],
      metrics: ProjectMetrics,
      developers: DeveloperMetrics[]
    }
  },
  byDeveloper: {
    [developerId: string]: {
      issues: Issue[],
      metrics: DeveloperMetrics,
      projects: ProjectMetrics[]
    }
  },
  byTimeframe: {
    [timeKey: string]: {
      issues: Issue[],
      metrics: TimeframeMetrics
    }
  },
  byRootCause: {
    [rootCause: string]: {
      issues: Issue[],
      count: number,
      percentage: number
    }
  },
  byIssueType: {
    [issueType: string]: {
      issues: Issue[],
      count: number
    }
  },
  byStatus: {
    [status: string]: {
      issues: Issue[],
      count: number
    }
  },
  filterOptions: FilterOptions,
  metadata: {
    processedAt: string,
    totalRecords: number,
    version: string,
    dataHash: string
  }
}
```

#### 2.6.2 Cache Data Structures

##### 2.6.2.1 V4 Cache Entry
```javascript
{
  key: string,              // Cache key (hash of filter parameters)
  data: any,                // Cached data
  timestamp: number,        // Cache creation timestamp
  hash: string,             // Data hash for validation
  filterHash: string,       // Filter combination hash
  expiryTime: number       // Cache expiry timestamp
}
```

##### 2.6.2.2 Cache Performance Metrics
```javascript
{
  hitCount: number,         // Cache hits
  missCount: number,        // Cache misses
  hitRate: number,          // Hit rate percentage
  avgResponseTime: number,  // Average response time (ms)
  storageUsed: number,      // Storage used (bytes)
  storageLimit: number,     // Storage limit (bytes)
  lastCleanup: number      // Last cleanup timestamp
}
```

##### 2.6.2.3 IndexedDB Storage Schema
```javascript
// Main stores in IndexedDB
const DB_STORES = {
  DIMENSIONAL_DATA: 'dimensional_data',
  FILTER_CACHE: 'filter_cache',
  METADATA: 'metadata'
};

// Dimensional Data Table
{
  id: string,               // Primary key
  projectKey: string,       // Project identifier
  developerId: string,      // Developer identifier
  timeframe: string,        // Time period
  storyPoints: number,      // Story points value
  issueCount: number,       // Issue count
  issues: Issue[],          // Issue objects
  createdAt: number,        // Creation timestamp
  updatedAt: number        // Last update timestamp
}

// Filter Cache Table
{
  filterHash: string,       // Primary key (filter combination hash)
  result: any,              // Cached result
  timestamp: number,        // Cache timestamp
  dataHash: string,         // Source data hash
  expiryTime: number       // Expiry timestamp
}
```

### 2.5 Component Props Interfaces

#### DeveloperQualityDashboard Props
```typescript
interface DeveloperQualityDashboardProps {
  allIssues: JiraIssue[];
}
```

#### TeamContributionChart Props
```typescript
interface TeamContributionChartProps {
  chartData: ChartData;
  filterOptions: FilterOptions;
  timeframe: 'week' | 'month' | 'quarter';
  metricType: 'count' | 'storyPoints';
  selectedIssueTypes: string[];
  targetStatus: string[];
  selectedTeamMembers: string[];
  selectedProject: string[];
  showLast3Months: boolean;
  showTargetLine: boolean;
  targetFilter: 'all' | 'under' | 'over';
  teamMembers: TeamMemberOption[];
  projectOptions: ProjectOption[];
  targetStatusOptions: StatusOption[];
  onTimeframeChange: (event: SelectChangeEvent) => void;
  onMetricTypeChange: (event: SelectChangeEvent) => void;
  onIssueTypeFilterChange: (event: SelectChangeEvent) => void;
  onTargetStatusChange: (event: SelectChangeEvent) => void;
  onProjectChange: (event: SelectChangeEvent) => void;
  onDateRangeChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onTargetLineChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onTargetFilterChange: (event: SelectChangeEvent) => void;
  onTeamMemberChange: (event: SelectChangeEvent, newValue: string[]) => void;
}
```

#### RootCauseAnalysis Props
```typescript
interface RootCauseAnalysisProps {
  analysisData: BugAnalysisData;
  availableProjects: string[];
  availableDevelopers: string[];
  onProjectChange: (projects: string[]) => void;
  onDeveloperChange: (developers: string[]) => void;
}
```

---

## 3. QAPerformanceDashboard Data Structures

### 3.1 Transformed Data Structure
The main data structure returned by `transformIssuesForQAPerformance()`:

```javascript
{
  // QA performance data
  qaData: {
    bugDetection: {
      qaVsProductionRatio: {
        qa: number,        // Percentage of bugs found by QA
        production: number // Percentage of bugs found in production
      },
      detectionTimeAvg: number,        // Average time to detect bugs (hours)
      bugsPerHour: number,             // Bugs found per testing hour
      userBugDetection: UserBugDetection[],  // QA team member metrics
      bugFounderDetails: BugFounderDetail[]  // Detailed bug founder information
    }
  },
  
  // QA metrics summary
  qaMetrics: {
    totalIssues: number,
    totalTests: number,
    totalReleases: number,
    qaTeamSize: number,
    avgDetectionTime: number,
    bugDetectionRate: number,
    testCoverage: number
  },
  
  // Metadata about the transformation
  metadata: {
    totalIssues: number,
    totalTests: number,
    totalReleases: number,
    lastUpdated: string,  // ISO date
    version: string       // '1.0'
  }
}
```

### 3.2 User Bug Detection Structure
```javascript
{
  id: string,                    // Unique identifier for QA team member
  name: string,                  // Display name
  avatar: string,                // Avatar URL
  bugsDetected: number,          // Total bugs detected
  criticalBugs: number,          // Critical severity bugs
  majorBugs: number,             // Major severity bugs
  minorBugs: number,             // Minor severity bugs
  avgTimeToDetect: number,       // Average detection time (hours)
  detectionScore: number         // Detection score (0-100)
}
```

### 3.3 Bug Founder Detail Structure
```javascript
{
  name: string,                  // Reporter/founder name
  avatar: string,                // Avatar URL
  totalBugs: number,             // Total bugs reported
  severities: {                  // Severity breakdown
    [severityName: string]: number
  },
  bugTypes: {                    // Bug type breakdown
    [bugType: string]: number
  }
}
```

### 3.4 Chart Data Structures

#### 3.4.1 QA vs Production Pie Chart Data (Chart.js format)
```javascript
{
  labels: ['Found by QA', 'Found in Production'],
  datasets: [{
    data: [number, number],      // [qaPercentage, productionPercentage]
    backgroundColor: ['#4caf50', '#f44336'],
    borderColor: ['#388e3c', '#d32f2f'],
    borderWidth: 1
  }]
}
```

#### 3.4.2 Time-to-Detect Bar Chart Data (Chart.js format)
```javascript
{
  labels: ['< 4 Hours', '4-8 Hours', '8-24 Hours', '1-3 Days', '> 3 Days'],
  datasets: [{
    label: 'Number of Bugs',
    data: [number, number, number, number, number],
    backgroundColor: 'rgba(54, 162, 235, 0.6)',
    borderColor: 'rgba(54, 162, 235, 1)',
    borderWidth: 1
  }]
}
```

#### 3.4.3 User Bug Detection Horizontal Bar Chart Data (Chart.js format)
```javascript
{
  labels: string[],              // QA team member names
  datasets: [
    {
      label: 'Critical Bugs',
      data: number[],            // Critical bugs per member
      backgroundColor: '#f44336',
      stack: 'Stack 0'
    },
    {
      label: 'Major Bugs',
      data: number[],            // Major bugs per member
      backgroundColor: '#ff9800',
      stack: 'Stack 0'
    },
    {
      label: 'Minor Bugs',
      data: number[],            // Minor bugs per member
      backgroundColor: '#4caf50',
      stack: 'Stack 0'
    }
  ]
}
```

#### 3.4.4 Detection Score Doughnut Chart Data (Chart.js format)
```javascript
{
  labels: string[],              // QA team member names
  datasets: [{
    data: number[],              // Detection scores (0-100)
    backgroundColor: string[],    // Color array from CHART_COLORS
    borderColor: string[],        // White borders
    borderWidth: 2
  }]
}
```

### 3.5 Filter Options Structure

#### 3.5.1 QA Performance Dashboard Filter Options
```javascript
{
  // Configuration options
  testData: Array,               // Test execution data
  releaseData: Array,            // Release data
  showTestMetrics: boolean,      // Show/hide test metrics
  showReleaseMetrics: boolean,   // Show/hide release metrics
  showTeamMetrics: boolean,      // Show/hide team metrics
  
  // Bug Detection Efficiency filters
  timeFrame: 'all' | 'month' | 'quarter' | 'year'
}
```

### 3.6 Component Props Interfaces

#### QAPerformanceDashboard Props
```typescript
interface QAPerformanceDashboardProps {
  allIssues: JiraIssue[];
}
```

#### BugDetectionEfficiency Props
```typescript
interface BugDetectionEfficiencyProps {
  qaData: QAData;
  qaMetrics: QAMetrics;
  showTestMetrics?: boolean;
  showReleaseMetrics?: boolean;
  showTeamMetrics?: boolean;
  onTestDataUpdate?: (testData: Array) => void;
  onReleaseDataUpdate?: (releaseData: Array) => void;
  onMetricVisibilityChange?: (metricKey: string) => void;
}
```

### 3.7 Cache Configuration Structure
```javascript
{
  testData: Array,               // Test execution data for caching
  releaseData: Array,            // Release data for caching
  totalIssues: number,           // Total issues count
  lastUpdated: string            // ISO date for cache invalidation
}
```

---

## 4. Common Data Structures

### 4.1 JIRA Issue Object
The standard JIRA issue object received from the API.

```javascript
{
  id: string,
  key: string,
  fields: {
    summary: string,
    description: string,
    issuetype: {
      name: string,
      id: string
    },
    status: {
      name: string,
      id: string,
      statusCategory: {
        name: string,
        key: string
      }
    },
    project: {
      key: string,
      name: string,
      id: string
    },
    created: string, // ISO date string
    updated: string, // ISO date string
    resolutiondate: string | null, // ISO date string
    priority: {
      name: string,
      id: string
    },
    assignee: {
      accountId: string,
      displayName: string,
      emailAddress: string
    } | null,
    reporter: {
      accountId: string,
      displayName: string,
      emailAddress: string
    },
    customfield_10028: number, // Story Points (STORY_POINTS_FIELD from constants.js)
    customfield_10020: Array<{ // Sprint field (SPRINT_FIELD from constants.js)
      id: number,
      name: string,
      state: string,
      startDate: string,
      endDate: string,
      completeDate: string
    }>,
    customfield_10271: { // Bug Type (BUG_TYPE_FIELD from constants.js)
      value: string,
      id: string
    } | null,
    customfield_10272: { // Root Cause (ROOT_CAUSE_FIELD from constants.js)
      value: string,
      id: string
    } | null,
    customfield_10049: { // Bug Severity (BUG_SEVERITY_FIELD from constants.js)
      value: string,
      id: string
    } | null,
    customfield_10015: string, // Start Date (START_DATE_FIELD from constants.js)
    customfield_10636: { // Bug Caused By (BUG_CAUSE_BY_FIELD from constants.js)
      accountId: string,
      displayName: string,
      emailAddress: string
    } | null
  },
  changelog?: {
    histories: Array<{
      id: string,
      created: string,
      items: Array<{
        field: string,
        fieldtype: string,
        from: string | null,
        fromString: string | null,
        to: string | null,
        toString: string | null
      }>
    }>
  }
}
```

### 4.2 Color Schemes
```javascript
const CHART_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const STATUS_COLORS = {
  'On Track': '#1976d2', // blue
  'At Risk': '#ed6c02', // orange
  'Delayed': '#d32f2f', // red
  'Completed': '#2e7d32' // green
};

const HEALTH_COLORS = {
  'Excellent': '#4caf50', // green (≥75%)
  'Good': '#ffc107', // yellow (50-74%)
  'Fair': '#ff9800', // orange (25-49%)
  'Poor': '#f44336' // red (<25%)
};

const DELIVERY_EFFICIENCY_COLORS = {
  'High': '#4caf50', // green (≥80%)
  'Moderate': '#ff9800', // orange (60-79%)
  'Low': '#f44336' // red (<60%)
};
```

### 4.3 Metric Calculation Constants
```javascript
const METRIC_WEIGHTS = {
  quality: 0.3,
  delivery: 0.3,
  progress: 0.2,
  lateness: 0.1,
  scopeCreep: 0.1
};

const BUG_SEVERITY_WEIGHTS = {
  'Fatal': 10,
  'Critical': 8,
  'Major': 5,
  'Minor': 2,
  'Trivial': 1
};

const STATUS_THRESHOLDS = {
  delayed: {
    quality: 60,
    delivery: 60
  },
  atRisk: {
    quality: 75,
    delivery: 75
  },
  completed: {
    progress: 100
  }
};
```

---

## 5. JIRA Custom Field Constants

The following constants are defined in `src/constants.js` and used throughout the application to reference JIRA custom fields:

```javascript
// From src/constants.js
export const STORY_POINTS_FIELD = 'customfield_10028';    // Story Points
export const SPRINT_FIELD = 'customfield_10020';          // Sprint information
export const BUG_TYPE_FIELD = 'customfield_10271';        // Bug Type
export const ROOT_CAUSE_FIELD = 'customfield_10272';      // Bug Root Cause
export const BUG_SEVERITY_FIELD = 'customfield_10049';    // Bug Severity
export const START_DATE_FIELD = 'customfield_10015';      // Start Date
export const BUG_CAUSE_BY_FIELD = 'customfield_10636';    // Bug Caused By
```

### Usage in Code
When accessing these fields from JIRA issue objects, use the constants instead of hardcoded field names:

```javascript
// Example usage patterns found in codebase
import { STORY_POINTS_FIELD, SPRINT_FIELD, BUG_SEVERITY_FIELD } from './constants';

// Story Points - always defaults to 0 if null
const storyPoints = issue.fields[STORY_POINTS_FIELD] || 0;

// Sprint Field - array of sprint objects, defaults to empty array
const sprints = issue.fields[SPRINT_FIELD] || [];
const lastSprint = sprints[sprints.length - 1]; // Get most recent sprint

// Bug Severity - object with value property, needs null check
const bugSeverity = issue.fields[BUG_SEVERITY_FIELD]?.value || 'Minor';

// Sprint processing patterns
if (issue.fields[SPRINT_FIELD] && issue.fields[SPRINT_FIELD].length > 0) {
  const sprintInfo = issue.fields[SPRINT_FIELD][0]; // First sprint
  const sprintName = sprintInfo.name;
  const sprintStartDate = parseJiraDate(sprintInfo.startDate);
}
```

### Field Mapping Reference
| Constant Name | JIRA Field ID | Description | Data Type | Usage Pattern |
|--------------|---------------|-------------|-----------|---------------|
| STORY_POINTS_FIELD | customfield_10028 | Story Points estimation | number | `issue.fields[STORY_POINTS_FIELD] \|\| 0` |
| SPRINT_FIELD | customfield_10020 | Sprint information array | Array<SprintObject> | `issue.fields[SPRINT_FIELD] \|\| []` |
| BUG_TYPE_FIELD | customfield_10271 | Type/category of bug | {value: string, id: string} \| null | Used in API field selection only |
| ROOT_CAUSE_FIELD | customfield_10272 | Root cause analysis | {value: string, id: string} \| null | Used in API field selection only |
| BUG_SEVERITY_FIELD | customfield_10049 | Bug severity level | {value: string, id: string} \| null | `issue.fields[BUG_SEVERITY_FIELD]?.value \|\| 'Minor'` |
| START_DATE_FIELD | customfield_10015 | Issue start date | string (ISO date) | Used in API field selection only |
| BUG_CAUSE_BY_FIELD | customfield_10636 | Person who caused bug | User object \| null | Used in API field selection only |

### Sprint Object Structure
```javascript
{
  id: number,
  name: string,
  state: string,
  startDate: string, // ISO date string
  endDate: string,   // ISO date string
  completeDate: string // ISO date string
}
```

---

## Notes

- All percentage values are stored as numbers from 0-100
- Dates are typically stored as JavaScript Date objects or ISO string format
- Arrays of issues can be either full JIRA issue objects or filtered subsets
- The `customfield_` references are defined in `src/constants.js` to maintain consistency
- Always use the constants from `constants.js` instead of hardcoding custom field IDs
- Custom field IDs may vary between JIRA installations - update constants.js if needed