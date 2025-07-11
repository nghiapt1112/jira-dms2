# Software Requirements Specification (SRS)
# Main Dashboard Component

## 1. Introduction

### 1.1 Purpose
This document specifies the software requirements for the Main Dashboard component of the JIRA DMS (Data Management System) front-end application. The Main Dashboard provides comprehensive analytics for project health, delivery performance, and sprint metrics, serving as the primary landing page for project management insights.

### 1.2 Scope
The Main Dashboard component analyzes JIRA issues to provide insights into project health, delivery performance, quality metrics, and sprint-level analytics. It serves as the central hub for project management and team performance monitoring across multiple projects.

### 1.3 Document Overview
This SRS covers:
- Component architecture and caching optimization
- Functional requirements for project analytics
- Chart specifications and data visualization
- Cache management and performance optimization
- Integration requirements and dependencies
- Performance requirements and caching strategy

## 2. Overall Description

### 2.1 Component Context
The Main Dashboard is accessible through:
- Primary route: `/main-dashboard` 
- Parent component: Application root navigation
- Integrates with global FilterContext for project selection

All routes are protected by authentication via the ProtectedRoute wrapper.

### 2.2 Component Architecture
```
MainDashboard
├── Data Transformation
│   ├── transformIssuesForProjectOverview
│   ├── useMainDashboardCache (hook)
│   └── dashboardData.service
├── UI Components
│   ├── ProjectHealthOverview
│   │   ├── Quality vs Delivery Performance (ScatterChart)
│   │   ├── Quality vs Health Performance (ScatterChart)
│   │   └── Project Health Table (Material-UI Table)
│   ├── ProjectDelivery
│   │   ├── Overall Delivery Summary (Circular Dashboard)
│   │   ├── Delivery Efficiency Chart (BarChart)
│   │   └── Recent Deliveries Grid (Material-UI Grid)
│   └── SprintMetricsChartsDashboard
│       ├── Timeliness Stacked Bar Chart (Recharts)
│       ├── Timeliness Monthly Aggregation (BarChart)
│       ├── Scope Creep Stacked Bar Chart (Recharts)
│       └── Scope Creep Monthly Aggregation (BarChart)
├── Supporting Services
│   ├── projectOverview.service
│   ├── projectQuality.service
│   ├── projectDelivery.service
│   ├── sprintMetricsData.service
│   └── sprintMetricsDetails.service
├── Cache Management
│   ├── CacheManager (collapsible)
│   └── CachePerformanceMonitor (collapsible)
└── Utilities
    ├── FilterContext
    └── Cache optimization hooks
```

### 2.3 User Classes
- **Project Managers**: Monitor overall project health and delivery performance
- **Team Leads**: Track sprint metrics and team productivity
- **Executives**: View high-level project portfolio health and delivery
- **Scrum Masters**: Analyze sprint timeliness and scope creep metrics

### 2.4 Cache Architecture
The component implements advanced caching that:
- Processes project data ONCE into optimized structures
- Provides instant response for project filtering
- Maintains data consistency across project selections
- Includes performance monitoring and manual cache management

## 3. Functional Requirements

### 3.1 Data Processing Requirements

#### 3.1.1 Project Data Transformation
- **Requirement ID**: FR-MD-001
- **Description**: Transform JIRA issues into project-centric data structures
- **Input**: Array of JIRA issue objects and selected project keys
- **Processing**:
  - Initialize project maps with default metrics
  - Process issues to update project metrics
  - Calculate derived metrics (progress, quality, delivery)
  - Calculate sprint metrics (timeliness, scope creep)
  - Generate enhanced quality metrics with bug weighting
- **Output**: Array of enhanced project objects with comprehensive metrics

#### 3.1.2 Cache Management
- **Requirement ID**: FR-MD-002
- **Description**: Optimize data access through intelligent caching
- **Features**:
  - Automatic cache key generation based on project selection
  - Cache invalidation on data changes
  - Performance monitoring and statistics
  - Manual cache management controls
- **Purpose**: Reduce computation overhead and improve user experience

#### 3.1.3 Quality Metrics Calculation
- **Requirement ID**: FR-MD-003
- **Description**: Calculate comprehensive quality metrics
- **Metrics**:
  - Bug rate with severity weighting
  - Quality score based on bug impact
  - Health score combining quality, progress, and delivery
  - High severity bug counting
- **Weighting**: Bugs weighted by severity (Fatal: 1.0, Major: 0.7, Medium: 0.5, Low: 0.3)

### 3.2 User Interface Requirements

#### 3.2.1 Layout Structure
- **Requirement ID**: FR-MD-004
- **Layout**: Responsive single-column layout with component sections
- **Components**:
  1. Header with title and collapsible cache controls
  2. Cache performance monitor (collapsible)
  3. Cache manager (collapsible)
  4. ProjectHealthOverview section (full width)
  5. ProjectDelivery section (full width)
  6. SprintMetricsChartsDashboard section (full width)

#### 3.2.2 Loading States
- **Requirement ID**: FR-MD-005
- **States**:
  - Loading: Linear progress with cache status message
  - Error: Error alert with cache error details
  - Empty: Message prompting project selection
  - Loaded: Dashboard content with optional cache status indicator

#### 3.2.3 Cache Controls
- **Requirement ID**: FR-MD-006
- **Controls**:
  - Cache Performance Monitor toggle
  - Cache Manager toggle
  - Collapsible panels for cache debugging
  - Performance statistics display

### 3.3 Chart and Visualization Requirements

#### 3.3.1 ProjectHealthOverview Component
- **Requirement ID**: FR-MD-007
- **Chart Types**: 
  - Quality vs Delivery Performance (ScatterChart)
  - Quality vs Health Performance (ScatterChart)
  - Project Health Table (Material-UI Table with pagination)
- **Data Structure**: See [ProjectHealthOverview Chart Data](./data-structures.md#121-projecthealthoverview-scatter-chart-data-quality-vs-delivery-performance)
- **Features**:
  - Interactive scatter plots with tooltips
  - Bubble size represents effort/story points
  - Color-coded project performance
  - Sortable and paginated table view
  - Dense table option toggle

##### 3.3.1.1 Quality vs Delivery Performance Chart
- **Chart Type**: ScatterChart (Recharts)
- **Default Settings**:
  - X-axis: Quality Score (0-100%, Bug Impact)
  - Y-axis: Delivery Score (0-100%, On-time Completion)
  - Z-axis: Effort (Story Points) - determines bubble size
  - Bubble size range: 50-400 pixels
- **Features**:
  - Custom tooltips showing project details
  - Quality score, delivery percentage, effort, bug counts
  - High severity bug indicators
  - Responsive container with 400px height
- **UI Behavior**:
  - Hover tooltips with comprehensive project metrics
  - Color-coded bubbles using CHART_COLORS array
  - Information tooltip explaining metric calculations

##### 3.3.1.2 Quality vs Health Performance Chart
- **Chart Type**: ScatterChart (Recharts)
- **Default Settings**:
  - X-axis: Quality Score (0-100%, Bug Impact)
  - Y-axis: Health Score (0-100%, Overall Project Status)
  - Z-axis: Effort (Story Points) - determines bubble size
  - Bubble size range: 50-400 pixels
- **Features**:
  - Combined health metric visualization
  - Health score combines quality (40%), bug rate (30%), progress (30%)
  - Custom tooltips with project health breakdown
  - Responsive container with 400px height
- **UI Behavior**:
  - Interactive tooltips with health score components
  - Color-coded bubbles for visual distinction
  - Information tooltip explaining health calculation

##### 3.3.1.3 Project Health Table
- **Chart Type**: Material-UI Table with pagination
- **Default Settings**:
  - Rows per page: 15 (options: 5, 10, 15, 25, 50)
  - Dense padding toggle available
  - Sorted by quality status (Poor → Excellent)
- **Columns**:
  - Project: Project name with tooltip
  - Progress: LinearProgress bar with percentage
  - Issues: Total issue count
  - Total Bugs: Bug count with severity breakdown tooltip
  - Story Points: Planned effort metric
  - Bug Rate: Weighted bug rate with severity tooltip
  - Quality Score: LinearProgress bar with detailed tooltip
  - Quality Status: Color-coded chip (Poor/Needs Improvement/Satisfactory/Good/Excellent)
  - Health: Color-coded chip with health level
- **Features**:
  - Sticky header for scrolling
  - Hover effects on table rows
  - Detailed tooltips for all metrics
  - Pagination controls at bottom
  - Quality status color coding

#### 3.3.2 ProjectDelivery Component
- **Requirement ID**: FR-MD-008
- **Chart Types**:
  - Overall Delivery Summary (Circular Dashboard)
  - Delivery Efficiency Chart (BarChart)
  - Recent Deliveries Grid (Material-UI Grid)
- **Data Structure**: See [ProjectDelivery Chart Data](./data-structures.md#124-projectdelivery-bar-chart-data-delivery-efficiency)
- **Features**:
  - Delivery rate visualization
  - Project-level efficiency comparison
  - Recent delivery tracking

##### 3.3.2.1 Overall Delivery Summary
- **Chart Type**: Custom circular dashboard
- **Default Settings**:
  - Circular progress indicator (120px diameter)
  - Delivery rate percentage display
  - Color-coded based on delivery health
- **Categories**:
  - On Time: ≥80% delivery rate (Green)
  - Delayed: 60-79% delivery rate (Orange)
  - Critical: <60% delivery rate (Red)
- **Features**:
  - Central percentage display
  - Category breakdown with counts
  - Color-coded circular border
  - Responsive container

##### 3.3.2.2 Delivery Efficiency Chart
- **Chart Type**: BarChart (Recharts)
- **Default Settings**:
  - Y-axis: Delivery efficiency (0-100%)
  - X-axis: Project names
  - Bar size: 20px
  - Color-coded bars based on efficiency
- **Features**:
  - Custom tooltips showing on-time vs delayed tasks
  - Efficiency percentage calculation
  - Color coding: Green (≥80%), Orange (60-79%), Red (<60%)
  - Responsive container with CartesianGrid
- **UI Behavior**:
  - Hover tooltips with task breakdown
  - Information tooltip explaining efficiency calculation
  - Responsive design with minimum 200px height

##### 3.3.2.3 Recent Deliveries Grid
- **Chart Type**: Material-UI Grid with project cards
- **Default Settings**:
  - Shows last 3 projects with completed deliveries
  - 4-column grid on medium screens
  - Efficiency chips with color coding
- **Features**:
  - Project delivery date display
  - Efficiency percentage chips
  - LinearProgress bars showing delivery success
  - Formatted delivery dates
- **UI Behavior**:
  - Progress bar tooltips with task counts
  - Color-coded efficiency chips
  - Responsive grid layout

#### 3.3.3 SprintMetricsChartsDashboard Component
- **Requirement ID**: FR-MD-009
- **Chart Types**:
  - Timeliness Stacked Bar Chart (Recharts)
  - Timeliness Monthly Aggregation (BarChart)
  - Scope Creep Stacked Bar Chart (Recharts)
  - Scope Creep Monthly Aggregation (BarChart)
- **Data Structure**: See [Sprint Metrics Chart Data](./data-structures.md#127-sprint-metrics-legacy-line-chart-data-timeliness)
- **Features**:
  - Project filtering capability
  - Sprint-level and monthly aggregation views
  - Detail popup for issue exploration
  - Responsive two-column layout

##### 3.3.3.1 Project Filter
- **Component**: ProjectFilter dropdown
- **Default Settings**:
  - Single project selection
  - Empty by default (no project selected)
  - Shows all available projects
- **Features**:
  - Dynamic project list from data
  - Selection affects both timeliness and scope creep charts
  - Clear selection capability
- **UI Behavior**:
  - Filter applies to sprint-level charts only
  - Monthly aggregation charts show all projects
  - Placeholder text when no project selected

##### 3.3.3.2 Sprint Timeliness Metrics
- **Chart Types**:
  - Timeliness Stacked Bar Chart (when project selected)
  - Timeliness Monthly Aggregation (BarChart V2)
- **Default Settings**:
  - Stacked bars: On-time vs Late issues
  - Monthly aggregation: Average timeliness percentage
  - Color scheme: Green (on-time), Red (late)
- **Features**:
  - Interactive "View Late Issues" button
  - Detail popup with filtered late issues
  - Project-specific sprint filtering
  - Monthly trend visualization
- **UI Behavior**:
  - Shows placeholder when no project selected
  - Real-time filter updates
  - Responsive chart containers

##### 3.3.3.3 Sprint Scope Creep Metrics
- **Chart Types**:
  - Scope Creep Stacked Bar Chart (when project selected)
  - Scope Creep Monthly Aggregation (BarChart V2)
- **Default Settings**:
  - Stacked bars: Planned vs Added issues
  - Monthly aggregation: Average scope creep percentage
  - Color scheme: Blue (planned), Orange (added)
- **Features**:
  - Interactive "View Scope Creep Issues" button
  - Detail popup with filtered scope creep issues
  - Project-specific sprint filtering
  - Monthly trend visualization
- **UI Behavior**:
  - Shows placeholder when no project selected
  - Real-time filter updates
  - Responsive chart containers

##### 3.3.3.4 Sprint Metrics Detail Popup
- **Component**: SprintMetricsDetailsPopup modal
- **Default Settings**:
  - Modal width: 800px
  - Issue list with pagination
  - Jira integration links
- **Features**:
  - Filtered issue display (late issues or scope creep)
  - Issue details: key, summary, status, assignee
  - External Jira links
  - Responsive modal design
- **UI Behavior**:
  - Opens from "View Details" buttons
  - Scrollable issue list
  - Click-to-close functionality

### 3.4 Data Analysis Requirements

#### 3.4.1 Project Health Metrics
- **Requirement ID**: FR-MD-010
- **Metrics**:
  - Progress: (Completed Issues / Total Issues) × 100
  - Quality Score: Based on weighted bug impact
  - Health Score: Weighted average of quality (40%), bug rate (30%), progress (30%)
  - Bug Rate: (Weighted Bug Count / Total Issues) × 100
  - Delivery Rate: (On-time Deliveries / Total Deliveries) × 100

#### 3.4.2 Sprint Metrics Analysis
- **Requirement ID**: FR-MD-011
- **Metrics**:
  - Timeliness: Percentage of issues completed on time within sprint
  - Scope Creep: Percentage of issues added during sprint execution
  - Monthly Aggregation: Average metrics across all sprints in month
  - Issue Breakdown: On-time vs late, planned vs added

#### 3.4.3 Delivery Performance Metrics
- **Requirement ID**: FR-MD-012
- **Metrics**:
  - Overall Delivery Rate: Average delivery performance across projects
  - Project Categorization: On Time (≥80%), Delayed (60-79%), Critical (<60%)
  - Delivery Efficiency: Project-specific on-time delivery percentage
  - Recent Delivery Tracking: Last 3 projects with completion dates

## 4. Performance Requirements

### 4.1 Cache Performance Targets
- **Requirement ID**: PR-MD-001
- **Specifications**:
  - Initial data processing: < 3 seconds for 20,000 issues
  - Cache hit response: < 10ms
  - Chart rendering: < 800ms
  - Project filtering: < 200ms

### 4.2 Scalability
- **Requirement ID**: PR-MD-002
- **Specifications**:
  - Support up to 50 projects simultaneously
  - Handle up to 50,000 issues in processing
  - Maintain responsive UI with large datasets
  - Efficient memory usage with caching

### 4.3 UI Performance
- **Requirement ID**: PR-MD-003
- **Specifications**:
  - Responsive design breakpoints
  - Smooth animations and transitions
  - Efficient table pagination
  - Optimized chart rendering

## 5. Integration Requirements

### 5.1 External Dependencies
- **Requirement ID**: IR-MD-001
- **Dependencies**:
  - React 16.8+ (hooks support)
  - Material-UI components (Tables, Progress bars, Grids)
  - Recharts for data visualization:
    - ScatterChart (ProjectHealthOverview)
    - BarChart (ProjectDelivery, SprintMetrics)
    - ResponsiveContainer for all charts
  - Chart.js compatibility for future enhancements

### 5.2 Service Integration
- **Requirement ID**: IR-MD-002
- **Services**:
  - transformIssuesForProjectOverview: Main data transformation
  - projectOverview.service: Project health calculations
  - projectQuality.service: Quality metric calculations
  - projectDelivery.service: Delivery performance analysis
  - sprintMetricsData.service: Sprint metrics processing
  - sprintMetricsDetails.service: Detail popup data

### 5.3 Context Integration
- **Requirement ID**: IR-MD-003
- **Context Usage**:
  - FilterContext: For global project selection
  - Cache context: For performance monitoring and management
  - Authentication context: For route protection

## 6. Data Flow

### 6.1 Main Data Flow
```
1. User navigates to /main-dashboard
2. Component receives selectedProjects and allIssues from parent
3. useMainDashboardCache hook processes data:
   - Check cache for existing processed data
   - If not cached: Transform issues using transformIssuesForProjectOverview
   - Store processed data in cache
4. Component renders with cached data:
   - ProjectHealthOverview renders scatter charts and table
   - ProjectDelivery renders summary, efficiency chart, and recent deliveries
   - SprintMetricsChartsDashboard renders timeliness and scope creep charts
5. Cache performance monitoring active in background
```

### 6.2 Project Selection Flow
```
1. User selects different projects in FilterContext
2. Main dashboard filters object updates
3. Cache hook recalculates cache key
4. If cache miss: Re-transform data for new project selection
5. All sub-components re-render with new project data
6. Sprint metrics charts update project filter options
```

### 6.3 Sprint Metrics Interaction Flow
```
1. User selects project in SprintMetricsChartsDashboard filter
2. Project-specific sprint charts become visible
3. User clicks "View Details" button
4. Detail popup queries filtered issues
5. Modal displays relevant issues with Jira links
6. User can close modal or navigate to external Jira
```

## 7. Chart Specifications

### 7.1 ProjectHealthOverview Charts
- **Chart Library**: Recharts
- **Chart Types**:
  - ScatterChart: Quality vs Delivery Performance
  - ScatterChart: Quality vs Health Performance
  - Material-UI Table: Project Health Overview
- **Data Structure**: See [data-structures.md#121](./data-structures.md#121-projecthealthoverview-scatter-chart-data-quality-vs-delivery-performance)
- **Features**:
  - Interactive tooltips with project details
  - Bubble size scaling based on effort
  - Color-coded project performance
  - Responsive containers with 400px height

### 7.2 ProjectDelivery Charts
- **Chart Library**: Recharts + Material-UI
- **Chart Types**:
  - Custom Circular Dashboard: Overall delivery summary
  - BarChart: Delivery efficiency comparison
  - Material-UI Grid: Recent delivery cards
- **Data Structure**: See [data-structures.md#124](./data-structures.md#124-projectdelivery-bar-chart-data-delivery-efficiency)
- **Features**:
  - Color-coded delivery categories
  - Efficiency percentage calculations
  - Recent delivery tracking

### 7.3 SprintMetricsChartsDashboard Charts
- **Chart Library**: Recharts
- **Chart Types**:
  - BarChart: Timeliness stacked bars (project-specific)
  - BarChart: Timeliness monthly aggregation
  - BarChart: Scope creep stacked bars (project-specific)
  - BarChart: Scope creep monthly aggregation
- **Data Structure**: See [data-structures.md#127](./data-structures.md#127-sprint-metrics-legacy-line-chart-data-timeliness)
- **Features**:
  - Project filtering capability
  - Detail popup integration
  - Monthly trend visualization
  - Responsive two-column layout

## 8. Error Handling

### 8.1 Data Processing Errors
- **Requirement ID**: EH-MD-001
- **Error Types**:
  - Invalid project selection
  - Malformed JIRA issue data
  - Cache corruption or failure
  - Service integration failures

### 8.2 UI Error States
- **Requirement ID**: EH-MD-002
- **Error Handling**:
  - Cache error alert with details
  - Empty state for no project selection
  - Fallback UI for chart rendering failures
  - Loading state timeout handling

### 8.3 Chart Error Handling
- **Requirement ID**: EH-MD-003
- **Error Handling**:
  - Graceful degradation for missing data
  - Placeholder charts for empty datasets
  - Tooltip error boundaries
  - Responsive container fallbacks

## 9. Security Requirements

### 9.1 Data Privacy
- **Requirement ID**: SR-MD-001
- **Specifications**:
  - Project data access control
  - User permission validation
  - Secure cache storage
  - No sensitive data in browser storage

### 9.2 Authentication Integration
- **Requirement ID**: SR-MD-002
- **Specifications**:
  - Protected route enforcement
  - Session management integration
  - Role-based access control
  - Secure API communications

## 10. Future Enhancements

### 10.1 Planned Features

#### 10.1.1 ProjectHealthOverview Enhancements
- Real-time project health monitoring
- Predictive quality analytics
- Automated quality gate recommendations
- Integration with CI/CD pipeline metrics

#### 10.1.2 ProjectDelivery Enhancements
- Delivery forecasting capabilities
- Resource allocation optimization
- Integration with project planning tools
- Automated delivery risk assessment

#### 10.1.3 SprintMetricsChartsDashboard Enhancements
- Advanced sprint analytics
- Velocity tracking and forecasting
- Team performance comparisons
- Integration with sprint planning tools

### 10.2 Technical Improvements
- Real-time data updates
- Advanced caching strategies
- Mobile-responsive enhancements
- Performance optimization

## 11. References

### 11.1 Data Structures Documentation
All data structures used in the Main Dashboard are documented in:
- **File**: [data-structures.md](./data-structures.md)
- **Section**: [MainDashboard Data Structures](./data-structures.md#1-maindashboard-data-structures)

### 11.2 Related Documentation
- [DeveloperQualityDashboard-SRS.md](./DeveloperQualityDashboard-SRS.md) - Related dashboard architecture
- [Cache Performance Guide](./cache-performance-guide.md) - Caching best practices
- [Sprint Metrics Analysis](./sprint-metrics-analysis.md) - Sprint analytics methodology

This comprehensive documentation ensures consistency across all components and provides implementation guidance for the Main Dashboard architecture.