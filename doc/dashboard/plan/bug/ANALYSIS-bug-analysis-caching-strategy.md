# Bug Analysis Caching Strategy

## Overview

Bug analysis JSON is generated **once** during the main data processing loop and stored in cache (IndexedDB). The UI always loads from cache for optimal performance.

## Data Flow

```
1. Initial Processing (One-time)
   JIRA Issues → Bug Analysis Service → JSON Structure → IndexedDB Cache

2. UI Display (Every time)
   UI Component → Load from IndexedDB → Display JSON
```

## Implementation

### 1. Integration with Main Processing Loop

```javascript
// In developerQualityService.js - processJiraIssuesForDeveloperQuality()

// Add to initialization
const developerQualityData = {
  metrics: developerQualityService.initializeMetrics(),
  chartData: developerQualityService.initializeChartData(),
  indices: developerQualityService.initializeIndices(),
  filterOptions: developerQualityService.initializeFilterOptions(),
  minimalIssues: [],
  // NEW: Add bug analysis structure
  bugAnalysis: {}
}

// During issue processing loop
issues.forEach((issue, index) => {
  // Existing processing...
  
  // NEW: Process bug analysis (one-time)
  if (issue.fields?.issuetype?.name === 'Bug') {
    developerQualityService.processBugAnalysis(issue, developerQualityData.bugAnalysis)
  }
})

// After loop, finalize bug analysis
developerQualityService.finalizeBugAnalysis(developerQualityData.bugAnalysis)
```

### 2. IndexedDB Storage

```javascript
// In developerQualityIndexedDB.js

// Add new store
const STORES = {
  // Existing stores...
  BUG_ANALYSIS: 'bug_analysis'
}

// Save bug analysis
async saveBugAnalysis(bugAnalysisData) {
  const db = await this.openDB()
  const tx = db.transaction([STORES.BUG_ANALYSIS], 'readwrite')
  const store = tx.objectStore(STORES.BUG_ANALYSIS)
  
  await store.put({
    id: 'current',
    data: bugAnalysisData,
    timestamp: new Date().toISOString(),
    version: '1.0'
  })
  
  await tx.complete
}

// Load bug analysis
async getBugAnalysis() {
  const db = await this.openDB()
  const tx = db.transaction([STORES.BUG_ANALYSIS], 'readonly')
  const store = tx.objectStore(STORES.BUG_ANALYSIS)
  
  const result = await store.get('current')
  return result?.data || null
}
```

### 3. UI Component Loading from Cache

```javascript
// In BugAnalysisPanel component

import { developerQualityIndexedDB } from '../services/developerQualityIndexedDB'

const BugAnalysisPanel = ({ projects, timeframe = 'month' }) => {
  const [bugAnalysisData, setBugAnalysisData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  
  // Load from cache on mount
  useEffect(() => {
    const loadFromCache = async () => {
      try {
        setIsLoading(true)
        const cachedData = await developerQualityIndexedDB.getBugAnalysis()
        setBugAnalysisData(cachedData)
      } catch (error) {
        console.error('Failed to load bug analysis from cache:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadFromCache()
  }, []) // Only run once on mount
  
  // Filter cached data based on selected projects
  const filteredData = useMemo(() => {
    if (!bugAnalysisData || projects.length === 0) {
      return bugAnalysisData
    }
    
    return Object.fromEntries(
      Object.entries(bugAnalysisData).filter(([projectKey]) => 
        projects.includes(projectKey)
      )
    )
  }, [bugAnalysisData, projects])
  
  if (isLoading) {
    return <div>Loading bug analysis...</div>
  }
  
  // Rest of component...
}
```

### 4. Processing Functions (One-time)

```javascript
// Helper functions for one-time processing

processBugAnalysis: (issue, bugAnalysisData) => {
  const projectKey = issue.fields?.project?.key
  if (!projectKey) return
  
  // Initialize project if needed
  if (!bugAnalysisData[projectKey]) {
    bugAnalysisData[projectKey] = {
      week: {},
      month: {},
      _temp: { // Temporary data for aggregation
        weeklyData: {},
        monthlyData: {}
      }
    }
  }
  
  // Extract all bug data once
  const bugData = {
    type: extractBugType(issue),
    rootCause: extractRootCause(issue),
    severity: parseSeverity(issue, projectKey).severity,
    status: categorizeBugStatus(issue.fields?.status?.name),
    created: issue.fields?.created,
    resolved: issue.fields?.resolutiondate,
    timeSpentHours: (issue.fields?.timespent || 0) / 3600,
    isReopened: checkIfReopened(issue),
    resolutionTimeHours: calculateResolutionTime(issue)
  }
  
  // Determine time periods
  const relevantDate = getRelevantDateForBug(bugData)
  if (!relevantDate) return
  
  const weekKey = getWeekFromDate(relevantDate)
  const monthKey = relevantDate.substring(0, 7)
  
  // Update temporary aggregation data
  updateTempPeriodData(
    bugAnalysisData[projectKey]._temp.weeklyData,
    weekKey,
    bugData
  )
  
  updateTempPeriodData(
    bugAnalysisData[projectKey]._temp.monthlyData,
    monthKey,
    bugData
  )
},

finalizeBugAnalysis: (bugAnalysisData) => {
  // Convert temporary data to final structure
  Object.values(bugAnalysisData).forEach(projectData => {
    // Process weekly data
    Object.entries(projectData._temp.weeklyData).forEach(([weekKey, tempData]) => {
      projectData.week[weekKey] = convertTempToFinal(tempData)
    })
    
    // Process monthly data
    Object.entries(projectData._temp.monthlyData).forEach(([monthKey, tempData]) => {
      projectData.month[monthKey] = convertTempToFinal(tempData)
    })
    
    // Remove temporary data
    delete projectData._temp
  })
}
```

## Benefits

1. **Performance**: JSON generated once, not on every filter change
2. **Scalability**: Can handle large datasets without UI lag
3. **Consistency**: All users see the same analysis until next data refresh
4. **Simplicity**: UI components just read from cache
5. **Reliability**: Data persists across page refreshes

## Cache Invalidation

Cache is cleared and regenerated when:
- New JIRA data is fetched
- Manual refresh is triggered
- Cache expiry time is reached (configurable)

## Storage Estimate

For 10,000 bugs across 20 projects:
- Estimated JSON size: ~2-5 MB
- IndexedDB can handle this easily
- Compression can be added if needed