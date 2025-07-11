# Project Context Analysis Report

Generated: 2025-07-11T15:36:13.305Z

## Project Statistics

- **Total Components**: 42
- **Total Services**: 12
- **Total Stores**: 3
- **Total TODOs**: 1

## Architecture Overview

### Component Types
- **memoized-functional**: 15 components
- **unknown**: 14 components
- **class**: 1 components
- **functional**: 12 components

### State Management
### authStore
- **State Properties**: 
- **Actions**: setUser, setToken, setLoading, setError, logout, initializeAuth, login, clearError

### dashboardStore
- **State Properties**: chartData, lineChartData, barChartData, pieChartData, isLoading, error, dateRange, start, end
- **Actions**: setChartData, setLineChartData, setBarChartData, setPieChartData, setLoading, setError, clearError, setDateRange, setFilters, fetchChartData, resetData

### jiraDataStore
- **State Properties**: 
- **Actions**: setSnapshots, setCurrentQuarter, setAllIssues, setLoading, setError, setMetadata, setLoadingStage, setOverallProgress, setCurrentOperation, setDownloadProgress, setCurrentDownload, incrementCompletedSnapshots, setCurrentDownloadingFile, addFailedDownload, clearFailedDownload, setFilters, resetFilters, resetData, resetLoadingStates, clearError

### Data Flow Patterns

### State Consumers (9 components)
- **MobileNav** uses: useAuthStore
- **Sidebar** uses: useAuthStore
- **ProtectedRoute** uses: useAuthStore
- **useAuth** uses: useAuthStore
- **authStore** uses: useAuthStore
- **dashboardStore** uses: useDashboardStore
- **useJiraData** uses: useJiraDataStore
- **useJiraDataLoader** uses: useJiraDataStore
- **jiraDataStore** uses: useJiraDataStore

### API Consumers (7 components)
- **ProtectedRoute** uses: ../../services/jwtService
- **useAuth** uses: ../services/authService
- **useProfile** uses: ../services/authService
- **authService** uses: ../../../shared/services/axiosConfig
- **authStore** uses: ../services/authService, ../services/jwtService
- **DataLoadingProgress** uses: ../../services/s3DownloadService
- **jiraIssuesService** uses: ../../../shared/services/axiosConfig


## Component Details

### index
- **Type**: memoized-functional
- **Props**: None
- **Hooks**: useMemo
- **Path**: /Users/duongthao/data/sources/ai-agent/source/jira-dms2/src/components/charts/BarChart/index.jsx

### index
- **Type**: memoized-functional
- **Props**: None
- **Hooks**: useMemo
- **Path**: /Users/duongthao/data/sources/ai-agent/source/jira-dms2/src/components/charts/LineChart/index.jsx

### index
- **Type**: memoized-functional
- **Props**: None
- **Hooks**: useMemo
- **Path**: /Users/duongthao/data/sources/ai-agent/source/jira-dms2/src/components/charts/PieChart/index.jsx

### MobileNav
- **Type**: memoized-functional
- **Props**: None
- **Hooks**: useTheme, useNavigationStore, useAuthStore, useCallback
- **Path**: /Users/duongthao/data/sources/ai-agent/source/jira-dms2/src/components/navigation/MobileNav/MobileNav.js

### index
- **Type**: unknown
- **Props**: None
- **Hooks**: None
- **Path**: /Users/duongthao/data/sources/ai-agent/source/jira-dms2/src/components/navigation/MobileNav/index.js

### NavigationItem
- **Type**: memoized-functional
- **Props**: None
- **Hooks**: useNavigate
- **Path**: /Users/duongthao/data/sources/ai-agent/source/jira-dms2/src/components/navigation/NavigationItem/NavigationItem.js

### index
- **Type**: unknown
- **Props**: None
- **Hooks**: None
- **Path**: /Users/duongthao/data/sources/ai-agent/source/jira-dms2/src/components/navigation/NavigationItem/index.js

### Sidebar
- **Type**: memoized-functional
- **Props**: None
- **Hooks**: useEffect, useState, useCallback, useTheme, useMediaQuery, useNavigationStore, useAuthStore, useLocation, useNavigate
- **Path**: /Users/duongthao/data/sources/ai-agent/source/jira-dms2/src/components/navigation/Sidebar/Sidebar.js

### SidebarStyles
- **Type**: unknown
- **Props**: None
- **Hooks**: None
- **Path**: /Users/duongthao/data/sources/ai-agent/source/jira-dms2/src/components/navigation/Sidebar/SidebarStyles.js

### index
- **Type**: unknown
- **Props**: None
- **Hooks**: None
- **Path**: /Users/duongthao/data/sources/ai-agent/source/jira-dms2/src/components/navigation/Sidebar/index.js

*... and 32 more components*

## Services

### authService
- **Methods**: authService, response, refreshToken, response, response, response, token, payload, token, payload
- **Path**: /Users/duongthao/data/sources/ai-agent/source/jira-dms2/src/features/authentication/services/authService.js

### authValidation
- **Methods**: authValidation, errors, errors, fieldErrors, usernameValidation, passwordValidation, fieldErrors, usernameValidation, emailValidation, firstNameValidation, lastNameValidation, errors, emailRegex, errors, validRoles, errors, fieldErrors, value, rules, validation
- **Path**: /Users/duongthao/data/sources/ai-agent/source/jira-dms2/src/features/authentication/services/authValidation.js

### jwtService
- **Methods**: jwtService, base64Url, base64, jsonPayload, decoded, currentTime, decoded, decoded, decoded, decoded, currentTime
- **Path**: /Users/duongthao/data/sources/ai-agent/source/jira-dms2/src/features/authentication/services/jwtService.js

### cacheService
- **Methods**: cacheService, cacheKey, metadataKey, timestamp, cacheObject, dataString, dataSizeMB, essentialData, essentialData, cacheKey, metadataKey, metadataString, metadata, dataString, data, cachedTime, now, hoursDiff, keysToRemove, key, cacheKey, metadataKey, dataSize, metadataSize, totalSize, totalSizeMB, metadataKey, metadataString, metadata, metadataKey, metadataString, metadataKey, existing, updated
- **Path**: /Users/duongthao/data/sources/ai-agent/source/jira-dms2/src/features/jira-data/services/cacheService.js

### dataProcessingService
- **Methods**: dataProcessingService, startTime, uniqueIssues, validIssues, enrichedIssues, processingTime, stats, allIssues, uniqueIssues, cleanedIssues, enrichedIssues, processingTime, stats, seen, duplicates, uniqueIssues, invalidIssues, validIssues, enriched, duplicatesRemoved, duplicatePercentage, projectsMap, project, dates, earliest, latest, date, created, now, ageInMs, created, resolved, timeInMs, dueDate, now, isResolved, latestSprint, match, groups, value, projects, dateRange, issueTypes, statuses, priorities, type, status, priority
- **Path**: /Users/duongthao/data/sources/ai-agent/source/jira-dms2/src/features/jira-data/services/dataProcessingService.js

### jiraIssuesService
- **Methods**: jiraIssuesService, defaultPayload, response, validSnapshots, currentTime, expirationTime, response, delay, totalRecords, totalSize, conditions, dateObj, year, month, day
- **Path**: /Users/duongthao/data/sources/ai-agent/source/jira-dms2/src/features/jira-data/services/jiraIssuesService.js

### s3DownloadService
- **Methods**: s3DownloadService, controller, timeoutId, startTime, response, percentCompleted, elapsed, speed, remainingBytes, eta, results, totalSnapshots, snapshot, snapshotName, data, delay, k, sizes, i, sampleSize, validItems, successful, failed, totalIssues, totalSize, elapsed, speed, remainingBytes, eta, progress
- **Path**: /Users/duongthao/data/sources/ai-agent/source/jira-dms2/src/features/jira-data/services/s3DownloadService.js

### apiService
- **Methods**: get
- **Path**: /Users/duongthao/data/sources/ai-agent/source/jira-dms2/src/shared/services/apiService.js

### apiService.test
- **Methods**: token, errorResponse, token, refreshResponse, result, mockData, result
- **Path**: /Users/duongthao/data/sources/ai-agent/source/jira-dms2/src/shared/services/apiService.test.js

### authService
- **Methods**: response, refreshToken, response, cachedUser, response, user, login, post
- **Path**: /Users/duongthao/data/sources/ai-agent/source/jira-dms2/src/shared/services/authService.js

### axiosConfig
- **Methods**: API_BASE_URL, REQUEST_TIMEOUT, JWT_TOKEN, axiosInstance, token, originalRequest, refreshToken, response, retryAfter, createAxiosInstance
- **Path**: /Users/duongthao/data/sources/ai-agent/source/jira-dms2/src/shared/services/axiosConfig.js

### jiraDataService
- **Methods**: CHUNK_SIZE, jql, payload, response, cacheKey, controller, fileId, response, progress, data, allData, downloadSnapshot, data, snapshotPromises, results, cached, mergedData, issueMap, key, existingIssue, index, serializedData, chunks, chunkSize, timestamp, age, chunks, chunk, chunks, controller, urlObj, pathParts, uniqueMap, key, existing, constructor, Map, Map
- **Path**: /Users/duongthao/data/sources/ai-agent/source/jira-dms2/src/shared/services/jiraDataService.js

## Stores

### authStore
- **State**: None detected
- **Actions**: setUser, setToken, setLoading, setError, logout, initializeAuth, login, clearError
- **Path**: /Users/duongthao/data/sources/ai-agent/source/jira-dms2/src/features/authentication/store/authStore.js

### dashboardStore
- **State**: chartData, lineChartData, barChartData, pieChartData, isLoading, error, dateRange, start, end
- **Actions**: setChartData, setLineChartData, setBarChartData, setPieChartData, setLoading, setError, clearError, setDateRange, setFilters, fetchChartData, resetData
- **Path**: /Users/duongthao/data/sources/ai-agent/source/jira-dms2/src/features/dashboard/store/dashboardStore.js

### jiraDataStore
- **State**: None detected
- **Actions**: setSnapshots, setCurrentQuarter, setAllIssues, setLoading, setError, setMetadata, setLoadingStage, setOverallProgress, setCurrentOperation, setDownloadProgress, setCurrentDownload, incrementCompletedSnapshots, setCurrentDownloadingFile, addFailedDownload, clearFailedDownload, setFilters, resetFilters, resetData, resetLoadingStates, clearError
- **Path**: /Users/duongthao/data/sources/ai-agent/source/jira-dms2/src/features/jira-data/store/jiraDataStore.js

## Pending TODOs

- TODO: 'To Do', (constants/jiraConstants.js:63)

## Recommendations

- Add React.memo to 12 functional components
- Add PropTypes to 42 components
