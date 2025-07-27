# Tabbed Dashboard Implementation Plan

## Current State Analysis

### Current Components in DeveloperQualityDashboard:
1. **TeamContributionChart** - Team-focused, always visible
2. **ProjectTeamPerformance** - Team-focused, conditional (single project only)
3. **BugTrendAnalysis** - Shared component, always visible
4. **RootCauseAnalysis** - Shared component, always visible
5. **DeveloperDetailPanel** - Developer-focused, conditional (single developer only)
6. **BugRateAnalysisTable** - Team-focused, always visible

### Current Grid Layout Issues:
- **Responsive inconsistency**: Different breakpoints (md={6}, xl={3}, etc.)
- **Conditional rendering complexity**: Multiple components show/hide based on selections
- **Layout jumping**: Grid reorganizes when conditional components appear/disappear
- **Information overload**: All components visible simultaneously

## Proposed Tabbed Architecture

### Tab Structure:
```
┌─ Team Tab ────────────────────────────────────────────────────────────┐
│  Focus: Team-wide performance, project analysis, team metrics         │
│  Components: TeamContributionChart, ProjectTeamPerformance,            │
│             BugTrendAnalysis, RootCauseAnalysis, BugRateAnalysisTable  │
└───────────────────────────────────────────────────────────────────────┘

┌─ Developer Tab ───────────────────────────────────────────────────────┐
│  Focus: Individual developer performance and detailed analysis         │
│  Components: DeveloperDetailPanel, BugTrendAnalysis, RootCauseAnalysis │
└───────────────────────────────────────────────────────────────────────┘
```

### UX Improvements:
1. **Focused workflow**: Clear separation between team and developer analysis
2. **Stable layout**: No jumping when selections change
3. **Contextual information**: Components relevant to the current focus
4. **Reduced cognitive load**: Less information on screen at once

## Technical Implementation Plan

### 1. Component Architecture

#### A. Create TabContainer Component
**Location**: `/src/features/developer-quality-dashboard/components/TabContainer/`

```jsx
const TabContainer = ({ 
  activeTab, 
  onTabChange, 
  filteredData, 
  filters, 
  performanceControls,
  selectedDeveloper,
  selectedSingleProject,
  // ... other props
}) => {
  return (
    <Box>
      <Tabs value={activeTab} onChange={onTabChange}>
        <Tab label="Team" />
        <Tab label="Developer" />
      </Tabs>
      
      <TabPanel value={activeTab} index={0}>
        <TeamTabContent {...teamTabProps} />
      </TabPanel>
      
      <TabPanel value={activeTab} index={1}>
        <DeveloperTabContent {...developerTabProps} />
      </TabPanel>
    </Box>
  )
}
```

#### B. Create Tab Content Components

**TeamTabContent.jsx**
```jsx
const TeamTabContent = ({
  filteredData,
  filters,
  performanceControls,
  selectedSingleProject,
  onStatusFilterChange
}) => {
  return (
    <Grid container spacing={{ xs: 2, sm: 3 }}>
      {/* Team Contribution Chart - Always visible */}
      <Grid item xs={12} lg={6}>
        <TeamContributionChart {...props} />
      </Grid>

      {/* Project Team Performance - Conditional */}
      {selectedSingleProject && (
        <Grid item xs={12} lg={6}>
          <ProjectTeamPerformance {...props} />
        </Grid>
      )}

      {/* Bug Trend Analysis - Shared */}
      <Grid item xs={12} md={6}>
        <BugTrendAnalysis {...props} />
      </Grid>

      {/* Root Cause Analysis - Shared */}
      <Grid item xs={12} md={6}>
        <RootCauseAnalysis {...props} />
      </Grid>

      {/* Bug Rate Analysis Table - Team focused */}
      <Grid item xs={12}>
        <BugRateAnalysisTable {...props} />
      </Grid>
    </Grid>
  )
}
```

**DeveloperTabContent.jsx**
```jsx
const DeveloperTabContent = ({
  filteredData,
  filters,
  selectedDeveloper,
  // ... other props
}) => {
  // Show selection prompt if no developer selected
  if (!selectedDeveloper) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          Select a Developer
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Choose a developer from the filters to view detailed analysis
        </Typography>
      </Paper>
    )
  }

  return (
    <Grid container spacing={{ xs: 2, sm: 3 }}>
      {/* Developer Detail Panel - Main focus */}
      <Grid item xs={12} lg={8}>
        <DeveloperDetailPanel {...props} />
      </Grid>

      {/* Bug Trend Analysis - Shared, developer context */}
      <Grid item xs={12} lg={4}>
        <BugTrendAnalysis 
          {...props}
          title="Developer Bug Trends"
          // Could be filtered to show developer-specific data
        />
      </Grid>

      {/* Root Cause Analysis - Shared, developer context */}
      <Grid item xs={12} lg={4}>
        <RootCauseAnalysis 
          {...props}
          title="Developer Root Causes"
          // Could be filtered to show developer-specific data
        />
      </Grid>
    </Grid>
  )
}
```

### 2. State Management

#### A. Tab State
```jsx
// In DeveloperQualityDashboard.jsx
const [activeTab, setActiveTab] = useState(0) // 0: Team, 1: Developer

const handleTabChange = useCallback((event, newValue) => {
  setActiveTab(newValue)
}, [])
```

#### B. Auto-switching Logic
```jsx
// Auto-switch to Developer tab when developer is selected
useEffect(() => {
  if (selectedDeveloper && activeTab === 0) {
    setActiveTab(1) // Switch to Developer tab
  }
}, [selectedDeveloper, activeTab])

// Could also auto-switch to Team tab when project is selected
useEffect(() => {
  if (selectedSingleProject && activeTab === 1 && !selectedDeveloper) {
    setActiveTab(0) // Switch to Team tab
  }
}, [selectedSingleProject, activeTab, selectedDeveloper])
```

### 3. Responsive Design Strategy

#### A. Consistent Grid Breakpoints
```jsx
// Standardized breakpoints across all tabs
const gridBreakpoints = {
  primary: { xs: 12, lg: 6 },    // Main charts
  secondary: { xs: 12, md: 6 },   // Supporting charts
  full: { xs: 12 },              // Tables and large components
  detail: { xs: 12, lg: 8 },     // Detail panels
  sidebar: { xs: 12, lg: 4 }     // Sidebar components
}
```

#### B. Mobile-first Tab Design
```jsx
<Tabs 
  value={activeTab} 
  onChange={handleTabChange}
  variant="fullWidth"  // Mobile-friendly
  sx={{
    borderBottom: 1,
    borderColor: 'divider',
    '& .MuiTab-root': {
      fontSize: { xs: '0.875rem', sm: '1rem' },
      minHeight: { xs: 48, sm: 56 }
    }
  }}
>
  <Tab 
    label="Team" 
    icon={<GroupIcon />}
    iconPosition="start"
    sx={{ gap: 1 }}
  />
  <Tab 
    label="Developer" 
    icon={<PersonIcon />}
    iconPosition="start"
    sx={{ gap: 1 }}
  />
</Tabs>
```

### 4. Component Sharing Strategy

#### A. Shared Components (Bug Trend Analysis, Root Cause Analysis)
- **Props-based customization**: Pass context-specific props
- **Data filtering**: Components can filter data based on current tab context
- **Title customization**: Different titles for different contexts
- **No duplication**: Same component instances, different configurations

#### B. Context-aware Data Filtering
```jsx
// In shared components
const BugTrendAnalysis = ({ 
  data, 
  context = 'team', // 'team' | 'developer'
  selectedDeveloper = null,
  title,
  ...props 
}) => {
  const contextualData = useMemo(() => {
    if (context === 'developer' && selectedDeveloper) {
      // Filter data for specific developer
      return filterDataForDeveloper(data, selectedDeveloper)
    }
    return data // Return team-wide data
  }, [data, context, selectedDeveloper])

  const contextualTitle = title || (context === 'developer' 
    ? `Bug Trends - ${selectedDeveloper}` 
    : 'Team Bug Trends')

  return (
    <Paper>
      <Typography variant="h6">{contextualTitle}</Typography>
      {/* Chart implementation with contextualData */}
    </Paper>
  )
}
```

### 5. URL State Integration

#### A. Tab State in URL
```jsx
// Update existing URL sync to include tab state
const urlSyncStatus = useUrlFilterSync(
  { ...filters, activeTab }, 
  (newState) => {
    setFilters(newState)
    if (newState.activeTab !== undefined) {
      setActiveTab(newState.activeTab)
    }
  },
  {
    enableUrlSync: true,
    logOperations: true
  }
)
```

#### B. Shareable URLs
- `/dashboard?tab=team&projects=PROJ-A` - Team tab with project selected
- `/dashboard?tab=developer&developers=john.doe` - Developer tab with developer selected

### 6. Animation and Transitions

#### A. Smooth Tab Transitions
```jsx
<TabPanel 
  value={activeTab} 
  index={index}
  sx={{
    mt: 2,
    opacity: activeTab === index ? 1 : 0,
    transform: activeTab === index ? 'translateX(0)' : 'translateX(20px)',
    transition: 'all 0.3s ease-in-out'
  }}
>
  {children}
</TabPanel>
```

#### B. Component Loading States
- Skeleton loading for tab content
- Smooth transitions between tabs
- Prevent layout shift during tab switches

## Implementation Phases

### Phase 1: Create Tab Infrastructure (High Priority)
1. **Create TabContainer component** with basic tab switching
2. **Update DeveloperQualityDashboard** to use TabContainer
3. **Move existing components** into TeamTabContent temporarily

### Phase 2: Team Tab Implementation (High Priority)
1. **Create TeamTabContent component**
2. **Optimize grid layout** for team-focused workflow
3. **Test responsive behavior** across breakpoints

### Phase 3: Developer Tab Implementation (High Priority)
1. **Create DeveloperTabContent component**
2. **Implement developer selection prompt**
3. **Add context-aware shared components**

### Phase 4: Enhanced Features (Medium Priority)
1. **Auto-switching logic** between tabs
2. **URL state integration** for tab persistence
3. **Animation and transitions**

### Phase 5: Testing and Polish (Medium Priority)
1. **Comprehensive testing** for both tabs
2. **Performance optimization**
3. **Accessibility improvements**

## Benefits of This Approach

### UX Benefits:
1. **Focused workflows**: Clear separation between team and developer analysis
2. **Stable layout**: No more jumping when selections change
3. **Contextual relevance**: Only show relevant information for current focus
4. **Intuitive navigation**: Natural flow between team and developer analysis

### Technical Benefits:
1. **Cleaner code**: Better component organization
2. **Easier maintenance**: Clear separation of concerns
3. **Better responsive design**: Consistent grid patterns
4. **Enhanced testability**: Isolated tab logic

### Performance Benefits:
1. **Lazy loading**: Only render active tab content
2. **Reduced DOM complexity**: Fewer components in DOM at once
3. **Better caching**: Components can be cached per tab

## File Structure

```
src/features/developer-quality-dashboard/components/
├── DeveloperQualityDashboard/
│   └── DeveloperQualityDashboard.jsx (updated with tab logic)
├── TabContainer/
│   ├── TabContainer.jsx
│   ├── index.js
│   └── __tests__/
│       └── TabContainer.test.jsx
├── TeamTabContent/
│   ├── TeamTabContent.jsx
│   ├── index.js
│   └── __tests__/
│       └── TeamTabContent.test.jsx
├── DeveloperTabContent/
│   ├── DeveloperTabContent.jsx
│   ├── index.js
│   └── __tests__/
│       └── DeveloperTabContent.test.jsx
└── shared/ (existing components, potentially enhanced)
    ├── BugTrendAnalysis/ (enhanced with context props)
    └── RootCauseAnalysis/ (enhanced with context props)
```

## Technical Specifications

### Dependencies:
- `@mui/material` Tabs, Tab, TabPanel components
- Existing dashboard infrastructure
- No new external dependencies required

### Component Props Interface:
```jsx
TabContainer.propTypes = {
  filteredData: PropTypes.object.isRequired,
  filters: PropTypes.object.isRequired,
  performanceControls: PropTypes.object.isRequired,
  selectedDeveloper: PropTypes.string,
  selectedSingleProject: PropTypes.bool,
  onStatusFilterChange: PropTypes.func.isRequired,
  // ... other existing props
}
```

This approach provides a clean, maintainable solution that improves both UX and code organization while leveraging existing components and maintaining backward compatibility.