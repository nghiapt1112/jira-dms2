# Centralized Data Fetch Architecture Plan

## Overview
This document defines the ideal data flow architecture for the JIRA DMS application, following the principle of "one loop, one time processed, IndexedDB cached".

## Core Principles (Observer Pattern + Event-Driven)

1. **Single Responsibility (SOLID)**: ONE global component handles data fetching/processing
2. **Observer Pattern**: All components subscribe to Zustand state changes
3. **Event-Driven Architecture**: State changes trigger automatic re-renders
4. **Separation of Concerns**: Clear split between "write" (global) and "read" (routes)
5. **DRY Principle**: Zero duplicate fetch logic across components
6. **Abstraction**: Routes abstracted from data fetching complexity

## Architecture Design

### Observer Pattern Architecture
```
┌─────────────────────────────────────────────────┐
│     Global Data Processor (SUBJECT)             │ ← Single Responsibility
│         (FAB/Drawer Component)                   │
├─────────────────────────────────────────────────┤
│ 1. [Fetch Latest Data] Button                   │
│ 2. Call /api/jira/issues/v3                     │
│ 3. Download S3 Files + Show Progress            │
│ 4. Process Data (ONE LOOP)                      │
│ 5. Store in IndexedDB                           │
│ 6. Update Zustand State ──────────┐             │
└─────────────────────────────────────┼───────────┘
                                      │ State Changes (Observable)
                                      ▼
┌─────────────────────────────────────────────────┐
│           Zustand Global State                  │ ← Event-Driven Hub
├─────────────────────────────────────────────────┤
│ • dataStatus: 'idle' | 'loading' | 'ready'      │
│ • progress: 0-100                               │
│ • lastUpdated: timestamp                        │
│ • error: string | null                          │
│ • currentOperation: string                      │
└─────────────────────┬───────────────────────────┘
                      │ Auto-Subscribe (Observer Pattern)
                      ▼
┌─────────────────────────────────────────────────┐
│         ALL ROUTE COMPONENTS (OBSERVERS)        │ ← Reactive & Read-Only
├─────────────────────────────────────────────────┤
│ useEffect(() => {                               │
│   if (dataStatus === 'ready') {                 │
│     loadFromIndexedDB()                         │
│   }                                             │
│ }, [dataStatus])                                │
├─────────────────────────────────────────────────┤
│ • /main-dashboard                               │
│ • /developer-quality-dashboard                  │
│ • /quality-dashboard                            │
│ • /analytics/*                                 │
└─────────────────────┬───────────────────────────┘
                      │ Read when dataStatus === 'ready'
                      ▼
┌─────────────────────────────────────────────────┐
│              IndexedDB (Persistence)            │ ← Single Source of Truth
├─────────────────────────────────────────────────┤
│ • jira_data_cache                               │
│ • indexed-developer-quality-dashboard           │
│ • Other domain-specific caches                  │
└─────────────────────────────────────────────────┘
```

### Observer Pattern Benefits

#### ✅ **SOLID Principles Applied**

1. **Single Responsibility (S)**:
   - Global component: Only data fetching/processing
   - Route components: Only UI rendering
   - Zustand store: Only state management
   - IndexedDB services: Only data persistence

2. **Open/Closed (O)**:
   - Open for extension: Add new routes/data sources easily
   - Closed for modification: Existing components unchanged

3. **Interface Segregation (I)**:
   - Routes only depend on "read" interface (IndexedDB + state)
   - Global component only depends on "write" interface (API + storage)

4. **Dependency Inversion (D)**:
   - High-level components depend on abstractions (Zustand state)
   - Not on concrete implementations (API services)

#### ✅ **Event-Driven Flow**

```javascript
// Global Component (Subject)
const processData = async () => {
  set({ dataStatus: 'loading', progress: 0 })          // Event 1: Start
  
  const data = await fetchFromAPI()
  set({ progress: 30, currentOperation: 'Processing' }) // Event 2: Progress
  
  await storeInIndexedDB(data)
  set({ dataStatus: 'ready', lastUpdated: now() })     // Event 3: Complete
}

// Route Components (Observers) - Auto-React
const Dashboard = () => {
  const { dataStatus, lastUpdated } = useGlobalDataStore()
  
  useEffect(() => {
    if (dataStatus === 'ready') {
      loadFromIndexedDB()  // Automatic reaction to state change
    }
  }, [dataStatus])
  
  // Component is purely reactive - no fetch logic!
}
```

#### ✅ **DRY & Abstraction Benefits**

- **Zero Code Duplication**: No fetch logic scattered across components
- **Loose Coupling**: Components don't know about each other
- **Easy Testing**: Mock Zustand state instead of API calls
- **Predictable State**: Single source of truth for data status

### Component Responsibilities

#### 1. Global Data Processor (Subject)
**Location**: Available on ALL pages (FAB, Drawer, or Header)

**Responsibilities**:
- Trigger API call to `/api/jira/issues/v3`
- Download S3 files with progress tracking
- Process data in single loop
- Store to both IndexedDB databases
- Show loading overlay during processing
- Notify user on completion/failure

**Key Features**:
- Progress bar for S3 downloads
- Cancel button for ongoing fetches
- Last fetch timestamp display
- Data freshness indicator

#### 2. Data Processing Pipeline
**Single Processing Function**:
```javascript
async function processAndCacheAllData(s3Data) {
  // 1. Process raw data
  const processedData = dataProcessingService.processJiraIssues(s3Data)
  
  // 2. Store raw data for JIRA cache
  await cacheService.cacheJiraData(s3Data, metadata)
  
  // 3. Process and store developer quality data
  const devQualityData = developerQualityService.processJiraIssuesForDeveloperQuality(processedData)
  await developerQualityIndexedDB.storeCompleteDataset(devQualityData)
  
  // 4. Process and store other dashboard data
  // ... main dashboard, quality dashboard, etc.
  
  // 5. Update metadata
  await updateLastFetchMetadata()
}
```

#### 3. Route Components (Observers - Reactive & Read-Only)
**Observer Pattern for ALL dashboard routes**:
```javascript
const DashboardComponent = () => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  
  // 🎯 Subscribe to global state (Observer Pattern)
  const { dataStatus, lastUpdated, progress } = useGlobalDataStore()
  
  // 🔄 React to state changes automatically (Event-Driven)
  useEffect(() => {
    if (dataStatus === 'ready') {
      loadFromIndexedDB() // Only triggered when data is actually ready
    }
  }, [dataStatus, lastUpdated]) // Re-run when data changes
  
  const loadFromIndexedDB = async () => {
    // ONLY read from IndexedDB - NO API calls ever
    const cachedData = await indexedDB.getData()
    setData(cachedData)
    setLoading(false)
  }
  
  // 🎨 Reactive rendering based on global state
  if (dataStatus === 'loading') return <LoadingSpinner progress={progress} />
  if (dataStatus === 'error') return <ErrorMessage />
  if (!data) return <NoDataMessage />
  
  return <DashboardContent data={data} />
}
```

### IndexedDB Structure

#### 1. jira_data_cache
- **Purpose**: Store raw JIRA data
- **Key**: 'jira_data_cache'
- **Content**: Complete array of JIRA issues
- **Updated**: On each fetch

#### 2. indexed-developer-quality-dashboard
- **Purpose**: Store processed developer quality metrics
- **Stores**:
  - metrics: Calculated metrics
  - chart_data: Pre-processed chart data
  - indices: Filter indices for performance
  - filter_options: Available filter values
  - minimal_issues: Lightweight issue data
  - metadata: Processing metadata

### Implementation Requirements

#### 1. Global Fetch Component Features
- [ ] Floating Action Button (FAB) or persistent drawer
- [ ] Progress tracking for S3 downloads
- [ ] Loading overlay to prevent navigation
- [ ] Error handling with retry
- [ ] Last fetch timestamp
- [ ] Data freshness indicator (stale after X hours)

#### 2. Processing Pipeline
- [ ] Single entry point for all data processing
- [ ] Atomic transaction (all or nothing)
- [ ] Progress callbacks for UI updates
- [ ] Error recovery mechanisms
- [ ] Memory optimization for large datasets

#### 3. Route Updates Required
- [ ] Remove all direct API calls from components
- [ ] Remove all data processing from components
- [ ] Implement consistent cache-reading pattern
- [ ] Add "No Data" states with fetch prompt
- [ ] Remove loading states for API calls

### Benefits

1. **Performance**
   - Data processed once, read many times
   - No redundant API calls
   - Instant page loads from cache
   - Predictable memory usage

2. **User Experience**
   - Clear loading states
   - No surprise data fetches
   - Offline capability
   - Consistent data across all views

3. **Developer Experience**
   - Simple component logic (read-only)
   - Clear separation of concerns
   - Easy to test components
   - Predictable data flow

4. **Maintenance**
   - Single place to update fetch logic
   - Centralized error handling
   - Easy to add new data sources
   - Clear debugging path

### Migration Strategy

1. **Phase 1**: Create Global Fetch Component
   - Implement FAB/Drawer component
   - Add to app layout
   - Test with sample data

2. **Phase 2**: Centralize Processing
   - Move all processing logic to single pipeline
   - Ensure atomic transactions
   - Add progress tracking

3. **Phase 3**: Update Routes
   - Convert routes to read-only pattern
   - Remove API call logic
   - Add consistent loading/empty states

4. **Phase 4**: Cleanup
   - Remove old fetch functions
   - Delete redundant processing code
   - Update documentation

### Success Criteria

1. **No component** makes direct API calls
2. **All data** flows through central fetch component
3. **Processing** happens exactly once per fetch
4. **All routes** read from IndexedDB only
5. **User controls** when data is fetched
6. **Clear feedback** during fetch/process operations

### Components Not Following This Pattern (AUDIT RESULTS)

#### 🔴 CRITICAL VIOLATIONS - Direct API Fetching

1. **`src/features/jira-data/store/jiraDataStore.js`**
   - **Lines 261-518**: `fetchJiraDataWithProgress()` method makes API calls to `/api/jira/issues/v3`
   - **Lines 278-294**: Calls `jiraIssuesService.getSnapshotUrls()`
   - **Lines 351-463**: Downloads S3 files directly via `s3DownloadService`
   - **Must move to**: Global fetch component

2. **`src/pages/Dashboard.js`** (Generic dashboard route)
   - **Lines 105, 115, 152**: Calls `startDataFetch()` directly 
   - **Lines 102-107**: Auto-fetches data on mount
   - **Must become**: Read-only, cache-consuming component

3. **`src/features/dashboard/components/MainDashboard/MainDashboard.js`**
   - **Lines 143, 196**: Calls `fetchData()` and `refreshData()` directly
   - **Line 251**: Has refresh button triggering API calls
   - **Must become**: Read-only, cache-consuming component

4. **`src/features/developer-quality-dashboard/components/DeveloperQualityDashboard/DeveloperQualityDashboard.jsx`**
   - **Lines 176, 200**: Calls `handleRefresh` and `handleForceReload`
   - **Line 270**: Refresh button triggers S3 downloads
   - **Must become**: Read-only, cache-consuming component

5. **`src/shared/store/dataStore.js`** ⚠️ **NEWLY DISCOVERED**
   - **Lines 27-58**: `fetchJiraData()` method calls `jiraDataService.fetchJiraSnapshots()`
   - **Lines 32, 38**: Direct API service calls
   - **Must become**: Read-only store

6. **`src/shared/store/debugStore.js`** ⚠️ **NEWLY DISCOVERED**
   - **Lines 3, 174**: Imports and uses `jiraIssuesService.getSnapshotUrls()`
   - **Lines 158-220**: `refreshData()` method (lines not shown in snippet)
   - **Must become**: Part of global fetch component

7. **`src/shared/components/DebugPanel/DebugPanel.jsx`** ⚠️ **NEWLY DISCOVERED**
   - **Lines 104-119**: `handleRefreshData()` calls `refreshData()` from debugStore
   - **Lines 296-302**: "Fresh Data" button triggers API calls
   - **Must become**: Part of global fetch component OR remove fetch functionality

#### 🔴 CRITICAL VIOLATIONS - Hooks Exposing Fetch Functions

8. **`src/features/jira-data/hooks/useJiraData.js`**
   - **Lines 23-28**: Exposes `fetchData`, `refreshData`, `loadCachedData` to components
   - **Lines 32-41**: Auto-loads from cache on mount
   - **Must become**: Read-only hook providing cached data only

9. **`src/features/jira-data/hooks/useJiraDataLoader.js`**
   - **Line 30-32**: Exposes `startDataFetch` function to components
   - **Lines 34-42**: Provides retry and cancel functionality
   - **Must become**: Part of global fetch component only

10. **`src/features/developer-quality-dashboard/hooks/useDeveloperQualityCache.js`**
    - **Lines 122, 14**: Exposes `fetchData()` function to components
    - **Lines 118-126**: Handles data fetching logic
    - **Must become**: Read-only hook providing cached data only

11. **`src/shared/hooks/useJiraData.js`** ⚠️ **NEWLY DISCOVERED**
    - **Lines 22, 32, 38**: Auto-fetch logic and `refetchData` function
    - **Lines 30-34**: Auto-fetches on mount
    - **Must become**: Read-only hook

#### 🟡 MODERATE VIOLATIONS - Service Layer (Acceptable in Central Pipeline)

12. **`src/features/jira-data/services/jiraIssuesService.js`**
    - **Lines 48-95**: Makes API calls to `/jira/issues/v3`
    - Service layer - **ACCEPTABLE** as part of central processing pipeline

13. **`src/shared/services/jiraDataService.js`**
    - **Lines 45, 61**: Makes API calls and downloads
    - Service layer - **ACCEPTABLE** as part of central processing pipeline

14. **`src/features/jira-data/services/cacheService.js`**
    - Service layer - **ACCEPTABLE** as part of central processing pipeline

#### UPDATED VIOLATION SUMMARY:
- **🚨 11 components/hooks/stores** directly violate "No component makes direct API calls"
- **🚨 4 route components** violate read-only pattern  
- **🚨 4 hooks** expose fetch functions instead of read-only data
- **🚨 3 stores** contain fetch logic that should be centralized

#### CRITICAL ARCHITECTURAL INSIGHT:
The current system has **MULTIPLE COMPETING FETCH MECHANISMS**:
1. `jiraDataStore.js` fetch system (main)
2. `dataStore.js` fetch system (legacy?)
3. `debugStore.js` fetch system (debug)
4. Direct service calls in components

This creates **data inconsistency** and **circular dependencies**.

#### SOLUTION: Observer Pattern + Event-Driven Architecture

The **Observer Pattern** perfectly solves these violations:

```javascript
// ❌ BEFORE: Scattered fetch logic (11 violations)
const Dashboard = () => {
  const { fetchData } = useJiraData()        // Violation 1
  useEffect(() => fetchData(), [])           // Violation 2
  return <div>Dashboard</div>
}

// ✅ AFTER: Pure Observer Pattern  
const Dashboard = () => {
  const { dataStatus } = useGlobalDataStore() // Subscribe to state
  useEffect(() => {
    if (dataStatus === 'ready') loadFromCache()
  }, [dataStatus])                           // React to state changes
  return <div>Dashboard</div>
}
```

#### ARCHITECTURAL ADVANTAGES:

1. **🎯 Single Source of Truth**: One component controls ALL data fetching
2. **🔄 Automatic Synchronization**: State changes propagate to all components instantly  
3. **🧩 Loose Coupling**: Components don't know about each other
4. **📡 Event-Driven**: Real-time progress updates across all dashboards
5. **🧪 Easy Testing**: Mock Zustand state instead of API calls
6. **🚀 Performance**: No duplicate fetch requests
7. **🛡️ Error Handling**: Centralized error management

### Next Steps

1. ✅ **Audit current components for violations** - COMPLETED
2. **Design global fetch component UI** - Create FAB/Drawer component
3. **Implement central processing pipeline** - Move fetch logic from stores
4. **Migrate routes one by one** - Convert to read-only pattern
5. **Remove old fetch logic** - Clean up stores and hooks  
6. **Update documentation** - Reflect new architecture

### Implementation Priority

**Phase 1 - Implement Observer Pattern Foundation**
- [ ] Create `useGlobalDataStore` Zustand store with observable state
- [ ] Define state schema: `{ dataStatus, progress, lastUpdated, error, currentOperation }`
- [ ] Implement state update methods for all fetch stages
- [ ] Test state propagation across multiple components

**Phase 2 - Create Global Data Processor (Subject)**
- [ ] Design and implement GlobalDataProcessor component (FAB/Drawer)
- [ ] Move ALL fetch logic from competing stores to GlobalDataProcessor
- [ ] Implement real-time state updates during processing
- [ ] Add comprehensive error handling and retry logic

**Phase 3 - Convert Routes to Observers**
- [ ] Update Dashboard.js to use Observer pattern
- [ ] Update MainDashboard.js to use Observer pattern
- [ ] Update DeveloperQualityDashboard.jsx to use Observer pattern
- [ ] Remove ALL fetch logic from route components

**Phase 4 - Cleanup Competing Fetch Mechanisms**
- [ ] Remove fetch methods from jiraDataStore.js
- [ ] Remove fetch methods from dataStore.js
- [ ] Remove fetch methods from debugStore.js
- [ ] Convert all hooks to read-only patterns
- [ ] Delete obsolete fetch-related code