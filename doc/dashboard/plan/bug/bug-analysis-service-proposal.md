# Bug Analysis Service Proposal

## Overview

This document outlines the implementation plan for the bug analysis service that generates detailed JSON data for project bug metrics.

## Service Architecture (DRY & SOLID Principles)

### Overview
Bug analysis follows DRY and SOLID principles by reusing existing utilities and creating shared components. JSON is generated **once** during main data processing and stored in IndexedDB cache.

### Key Principles:
- **DRY**: Reuse existing `parseSeverity`, `getWeekFromDate`, `mapBugTypeToCategory`
- **Single Responsibility**: Each utility/service has one clear purpose
- **Open/Closed**: Easy to extend without modifying existing code

### 1. Integration with Main Processing Loop (Reusing Existing Code)

```javascript
// In developerQualityService.js - processJiraIssuesForDeveloperQuality()

// Add bug analysis to main data structure
const developerQualityData = {
  metrics: developerQualityService.initializeMetrics(),
  chartData: developerQualityService.initializeChartData(),
  indices: developerQualityService.initializeIndices(),
  filterOptions: developerQualityService.initializeFilterOptions(),
  minimalIssues: [],
  // NEW: Bug analysis data
  bugAnalysis: {}
}

// During single loop processing
issues.forEach((issue, index) => {
  // Existing processing...
  
  // NEW: Process bug analysis (one-time during main loop)
  if (issue.fields?.issuetype?.name === 'Bug') {
    developerQualityService.processBugAnalysis(issue, developerQualityData.bugAnalysis)
  }
})

// After loop, finalize and cache
developerQualityService.finalizeBugAnalysis(developerQualityData.bugAnalysis)

// Save to IndexedDB cache
await developerQualityIndexedDB.saveBugAnalysis(developerQualityData.bugAnalysis)

return developerQualityData // Include bug analysis in returned data
```

### 2. Helper Functions

```javascript
// Extract bug metadata
const extractBugMetadata = (issue) => {
  const projectKey = issue.fields?.project?.key
  
  return {
    // Bug type from customfield_10271
    bugType: extractBugType(issue, projectKey),
    
    // Root cause from customfield_10272
    rootCause: extractRootCause(issue),
    
    // Severity from customfield_10049
    severity: parseSeverity(issue, projectKey).severity,
    
    // Status categorization
    status: categorizeBugStatus(issue.fields?.status?.name),
    
    // Time metrics
    created: issue.fields?.created,
    resolved: issue.fields?.resolutiondate,
    updated: issue.fields?.updated,
    
    // Time tracking
    timeSpent: issue.fields?.timespent || 0,
    
    // Resolution metrics
    isReopened: checkIfReopened(issue),
    resolutionTimeHours: calculateResolutionTime(issue)
  }
}

// Process issue for different time periods
const processIssuePeriods = (issue, projectData) => {
  const metadata = extractBugMetadata(issue)
  const relevantDate = getRelevantDate(issue, metadata.status)
  
  if (!relevantDate) return
  
  // Process for week
  const weekKey = getWeekFromDate(relevantDate)
  updatePeriodData(projectData.week, weekKey, metadata, 'week')
  
  // Process for month
  const monthKey = relevantDate.substring(0, 7)
  updatePeriodData(projectData.month, monthKey, metadata, 'month')
}
```

### 3. UI Component Loads from Cache

```javascript
// In Developer Quality Dashboard component
import { developerQualityIndexedDB } from '../services/developerQualityIndexedDB'

const DeveloperQualityDashboard = () => {
  const { filters } = useDeveloperQualityStore()
  
  return (
    <div>
      {/* Existing dashboard content */}
      
      {/* New Bug Analysis Panel - loads from cache internally */}
      <BugAnalysisPanel 
        projects={filters.projects}
        timeframe={filters.timeframe}
      />
    </div>
  )
}

// BugAnalysisPanel loads from cache
const BugAnalysisPanel = ({ projects, timeframe }) => {
  const [bugAnalysisData, setBugAnalysisData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  
  // Load from cache on mount (one-time)
  useEffect(() => {
    const loadFromCache = async () => {
      try {
        const cachedData = await developerQualityIndexedDB.getBugAnalysis()
        setBugAnalysisData(cachedData)
      } catch (error) {
        console.error('Failed to load bug analysis from cache:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadFromCache()
  }, []) // Only runs once on mount
  
  // Filter cached data by selected projects
  const filteredData = useMemo(() => {
    if (!bugAnalysisData || projects.length === 0) return bugAnalysisData
    
    return Object.fromEntries(
      Object.entries(bugAnalysisData).filter(([projectKey]) => 
        projects.includes(projectKey)
      )
    )
  }, [bugAnalysisData, projects])
  
  // Component renders filtered cached data
  return <div>{/* Render filteredData */}</div>
}
```

### 4. MVP Display Component

```javascript
// src/features/developer-quality-dashboard/components/BugAnalysisPanel.jsx

const BugAnalysisPanel = ({ data, projects }) => {
  const [showRawData, setShowRawData] = useState(false)
  
  if (!data) return null
  
  // Filter data to show only selected projects
  const filteredData = projects.length > 0 
    ? Object.fromEntries(
        Object.entries(data).filter(([key]) => projects.includes(key))
      )
    : data
  
  return (
    <div className="bug-analysis-panel">
      <div className="panel-header">
        <h3>Bug Analysis by Project</h3>
        <button onClick={() => setShowRawData(!showRawData)}>
          {showRawData ? 'Hide' : 'Show'} Raw JSON
        </button>
      </div>
      
      {showRawData && (
        <pre className="json-display">
          {JSON.stringify(filteredData, null, 2)}
        </pre>
      )}
      
      {!showRawData && (
        <div className="analysis-summary">
          {/* Future: Add visual representation */}
          <p>Projects analyzed: {Object.keys(filteredData).length}</p>
        </div>
      )}
    </div>
  )
}
```

## Implementation Steps (Caching-First Approach)

1. **Phase 1 - Core Processing Functions**
   - Add `processBugAnalysis()` and `finalizeBugAnalysis()` to `developerQualityService.js`
   - Integrate into existing single-loop processing
   - Add bug type, root cause, and severity extractors

2. **Phase 2 - Caching Layer**
   - Add `BUG_ANALYSIS` store to `developerQualityIndexedDB.js`
   - Implement `saveBugAnalysis()` and `getBugAnalysis()` methods
   - Store generated JSON in IndexedDB after main processing

3. **Phase 3 - Cache-Loading UI**
   - Create `BugAnalysisPanel` component that loads from cache
   - Add project filtering on cached data (client-side)
   - Implement raw JSON display with copy/download

4. **Phase 4 - Performance & Polish**
   - Add loading states and error handling
   - Optimize JSON structure for display
   - Add visual enhancements (syntax highlighting, collapsible sections)

## Benefits

1. **Comprehensive Analysis**: All bug metrics in one place
2. **Time-based Insights**: Track bug trends over weeks/months
3. **Project Filtering**: Focus on specific projects
4. **Extensible**: Easy to add new metrics
5. **Performance**: Leverages existing processing loop

## Next Steps

1. Review and approve JSON structure
2. Implement core service
3. Create MVP display component
4. Test with real data
5. Gather feedback and iterate