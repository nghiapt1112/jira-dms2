# Section 5: Business Logic Extraction
## Developer Quality Dashboard - Business Logic Implementation

> **Reverse-Engineered from Implementation**  
> This document captures the actual business logic as implemented, including sophisticated algorithms, configurable rules, and advanced metric calculations.

---

## 5.1 Core Business Logic Architecture

### **Single-Loop Processing Engine**

**Primary Business Logic Pattern**: O(n) efficiency with integrated processing

```javascript
// developerQualityService.js:processJiraIssuesForDeveloperQuality()
const processJiraIssuesForDeveloperQuality = (issues, options = {}) => {
  // Initialize all data structures
  const developerStats = new Map()
  const performanceMetadata = new Map() // Project → Developer → Period → Metrics
  const indices = initializeIndices()
  const chartData = { datasets: [], labels: [] }
  
  // SINGLE LOOP - Process each issue exactly once
  issues.forEach((issue, index) => {
    // 1. Member filtering with business rules
    const memberCheck = shouldIncludeMember(
      issue.fields?.assignee?.displayName,
      issue.fields?.assignee?.accountId
    )
    
    if (!memberCheck.isIncluded) {
      return // Skip non-configured members
    }
    
    // 2. Extract core business data
    const businessData = {
      issueKey: issue.key,
      assignee: memberCheck.memberInfo,
      project: issue.fields?.project?.key,
      issueType: issue.fields?.issuetype?.name,
      status: issue.fields?.status?.name,
      storyPoints: issue.fields?.customfield_10028 || 0,
      severity: parseSeverity(issue, project),
      rootCause: extractRootCauseAnalysis(issue),
      timeTracking: calculateTimeTrackingMetrics(issue),
      created: new Date(issue.fields?.created),
      resolved: issue.fields?.resolutiondate ? new Date(issue.fields?.resolutiondate) : null
    }
    
    // 3. Update developer statistics (complex business logic)
    updateDeveloperStats(developerStats, businessData, issue)
    
    // 4. Update performance metadata (triple-nested structure)
    updatePerformanceMetadata(performanceMetadata, businessData, memberCheck.memberInfo)
    
    // 5. Build indices for O(1) filtering
    buildIndicesForIssue(indices, businessData)
    
    // 6. Progress tracking
    if (options.onProgress && index % 100 === 0) {
      options.onProgress({
        processed: index + 1,
        total: issues.length,
        currentDeveloper: businessData.assignee.name
      })
    }
  })
  
  // 7. Post-processing calculations
  const finalStats = calculateFinalStatistics(developerStats, performanceMetadata)
  const preprocessedChartData = preprocessChartData(finalStats, performanceMetadata)
  
  return {
    developerStats: finalStats,
    performanceMetadata,
    indices,
    chartData: preprocessedChartData,
    metadata: {
      processedAt: new Date(),
      issueCount: issues.length,
      developerCount: developerStats.size
    }
  }
}
```

---

## 5.2 Developer Statistics Business Logic

### **Extended Developer Stats Calculation**

**Complex 15+ Field Business Logic** (lines 427-462 in developerQualityService.js):

```javascript
const updateDeveloperStats = (developerStats, businessData, rawIssue) => {
  const { assignee, issueType, storyPoints, severity, timeTracking } = businessData
  
  // Get or create developer stats
  if (!developerStats.has(assignee.name)) {
    developerStats.set(assignee.name, createExtendedDeveloperStats(assignee))
  }
  
  const stats = developerStats.get(assignee.name)
  
  // Core metric updates
  stats.totalIssues += 1
  stats.totalStoryPoints += storyPoints || 0
  
  // Bug-specific business logic
  if (issueType === 'Bug') {
    stats.totalBugs += 1
    
    // Reopen detection business logic
    const reopenMetrics = calculateReopenMetrics(rawIssue, businessData.project)
    if (reopenMetrics.isReopened) {
      stats.reopenCount += reopenMetrics.reopenCount
    }
    
    // Resolution time business logic
    const resolutionMetrics = calculateResolutionTimeMetrics(rawIssue, businessData.project)
    if (resolutionMetrics.resolutionTimeHours !== null) {
      stats.resolutionTimes.push(resolutionMetrics)
      
      if (resolutionMetrics.isOverdue) {
        stats.overdueCount += 1
      }
    }
    
    // Severity breakdown business logic
    updateSeverityBreakdown(stats.severityBreakdown, severity)
    
    // Root cause breakdown business logic
    if (businessData.rootCause.rootCause !== 'Unknown') {
      stats.rootCauseBreakdown[businessData.rootCause.rootCause] = 
        (stats.rootCauseBreakdown[businessData.rootCause.rootCause] || 0) + 1
    }
    
    // Recent bugs tracking (for trend analysis)
    stats.recentBugs.push({
      key: businessData.issueKey,
      created: businessData.created,
      resolved: businessData.resolved,
      severity: severity.severity,
      rootCause: businessData.rootCause.rootCause,
      isReopened: reopenMetrics.isReopened
    })
    
    // Keep only last 50 bugs for performance
    if (stats.recentBugs.length > 50) {
      stats.recentBugs = stats.recentBugs.slice(-50)
    }
  }
  
  // Time tracking business logic
  if (timeTracking.hasTimeLogged) {
    stats.timeTrackingData.totalTimeSpentHours += timeTracking.timeSpentHours
    stats.timeTrackingData.timeLoggedIssues += 1
    
    if (timeTracking.estimationAccuracy !== null) {
      stats.timeTrackingData.estimationAccuracy.push(timeTracking.estimationAccuracy)
    }
    
    // Weekly time tracking aggregation
    const weekKey = getWeekKey(businessData.created)
    if (!stats.timeTrackingData.weeklyTimeTracking.has(weekKey)) {
      stats.timeTrackingData.weeklyTimeTracking.set(weekKey, {
        totalTime: 0,
        storyPoints: 0,
        timePerStoryPoint: 0
      })
    }
    
    const weekData = stats.timeTrackingData.weeklyTimeTracking.get(weekKey)
    weekData.totalTime += timeTracking.timeSpentHours
    weekData.storyPoints += storyPoints || 0
    weekData.timePerStoryPoint = weekData.storyPoints > 0 ? 
      weekData.totalTime / weekData.storyPoints : 0
    
    // Individual time tracking record
    stats.timeTrackingData.timeTrackingIssues.push({
      issueKey: businessData.issueKey,
      originalEstimateHours: timeTracking.originalEstimateHours,
      timeSpentHours: timeTracking.timeSpentHours,
      storyPoints: storyPoints || 0,
      estimationAccuracy: timeTracking.estimationAccuracy,
      timePerStoryPoint: (storyPoints || 0) > 0 ? timeTracking.timeSpentHours / storyPoints : 0
    })
  }
  
  // Calculate derived metrics
  stats.bugRate = stats.totalIssues > 0 ? (stats.totalBugs / stats.totalIssues) * 100 : 0
  stats.reopenRate = stats.totalBugs > 0 ? (stats.reopenCount / stats.totalBugs) * 100 : 0
  stats.overdueRate = stats.totalBugs > 0 ? (stats.overdueCount / stats.totalBugs) * 100 : 0
  stats.timeTrackingData.timePerStoryPoint = stats.timeTrackingData.totalStoryPoints > 0 ?
    stats.timeTrackingData.totalTimeSpentHours / stats.timeTrackingData.totalStoryPoints : 0
  
  // Update averages
  if (stats.resolutionTimes.length > 0) {
    stats.averageResolutionTimeHours = stats.resolutionTimes.reduce((sum, rt) => 
      sum + (rt.resolutionTimeHours || 0), 0) / stats.resolutionTimes.length
  }
  
  // Calculate time efficiency score
  stats.timeEfficiencyScore = calculateTimeEfficiency(stats.resolutionTimes)
}
```

### **Configurable Member Inclusion Logic**

**Business Rule**: Only configured team members have KPIs calculated

```javascript
// memberConfiguration.js:shouldIncludeMember()
const shouldIncludeMember = (memberName, jiraId = null) => {
  if (!memberName || memberName === 'Unassigned') {
    return { isIncluded: false, role: null, memberInfo: null }
  }
  
  // Check developers by name or jiraId (exact match)
  const developerMatch = memberConfiguration.developers.find(dev => 
    dev.name === memberName || (jiraId && dev.jiraId === jiraId)
  )
  
  if (developerMatch) {
    return { 
      isIncluded: true, 
      role: 'developer', 
      memberInfo: {
        ...developerMatch,
        level: developerMatch.level || 'middle' // Default level
      }
    }
  }
  
  // Check QA team by name or jiraId
  const qaMatch = memberConfiguration.qa.find(qa => 
    qa.name === memberName || (jiraId && qa.jiraId === jiraId)
  )
  
  if (qaMatch) {
    return { 
      isIncluded: true, 
      role: 'qa', 
      memberInfo: qaMatch 
    }
  }
  
  // Business rule: Include all members if configuration allows
  if (!memberConfiguration.kpiSettings.onlyCalculateForConfiguredMembers) {
    return { 
      isIncluded: true, 
      role: 'developer', 
      memberInfo: { 
        name: memberName, 
        jiraId: jiraId || memberName,
        level: 'middle' // Default for unconfigured members
      }
    }
  }
  
  return { isIncluded: false, role: null, memberInfo: null }
}
```

---

## 5.3 Performance Metadata Business Logic

### **Triple-Nested Performance Tracking**

**Complex Performance Calculation**: Project → Developer → Time Period → Metrics

```javascript
const updatePerformanceMetadata = (performanceMetadata, businessData, memberInfo) => {
  const { project, storyPoints, created } = businessData
  
  // Initialize nested Maps if needed
  if (!performanceMetadata.has(project)) {
    performanceMetadata.set(project, new Map())
  }
  
  if (!performanceMetadata.get(project).has(memberInfo.name)) {
    performanceMetadata.get(project).set(memberInfo.name, new Map())
  }
  
  const developerMap = performanceMetadata.get(project).get(memberInfo.name)
  
  // Calculate time periods (week, month, quarter)
  const timePeriods = {
    week: getWeekKey(created),
    month: getMonthKey(created),
    quarter: getQuarterKey(created)
  }
  
  // Update each time period
  Object.entries(timePeriods).forEach(([periodType, periodKey]) => {
    if (!developerMap.has(periodKey)) {
      developerMap.set(periodKey, createPerformancePeriodData(periodType))
    }
    
    const periodData = developerMap.get(periodKey)
    
    // Core performance business logic
    periodData.totalPoints += storyPoints || 0
    periodData.issueCount += 1
    
    // Calculate target based on project type and developer level
    const target = calculatePerformanceTarget(project, memberInfo.level, periodType)
    if (target) {
      periodData.targetPoints = target
      
      // Performance classification business logic
      if (periodData.totalPoints >= target) {
        periodData.performance = "over"
        periodData.efficiency = (periodData.totalPoints / target) * 100
      } else {
        periodData.performance = "under"
        periodData.efficiency = (periodData.totalPoints / target) * 100
      }
    }
    
    // Quality metrics integration
    if (businessData.issueType === 'Bug') {
      periodData.qualityMetrics.bugsCreated += 1
      periodData.qualityMetrics.bugRate = 
        (periodData.qualityMetrics.bugsCreated / periodData.issueCount) * 100
    }
    
    // Time tracking integration
    if (businessData.timeTracking.hasTimeLogged) {
      periodData.qualityMetrics.totalTimeLogged += businessData.timeTracking.timeSpentHours
      periodData.qualityMetrics.timeEfficiency = calculateTimeEfficiency([{
        timeSpentHours: businessData.timeTracking.timeSpentHours,
        storyPoints: storyPoints || 0,
        estimationAccuracy: businessData.timeTracking.estimationAccuracy
      }])
    }
  })
}
```

### **Dynamic Target Calculation Business Logic**

```javascript
const calculatePerformanceTarget = (projectKey, developerLevel, timePeriod) => {
  // Get project configuration
  const projectConfig = memberConfiguration.projects.find(p => p.key === projectKey)
  if (!projectConfig) return null
  
  const { pointType } = projectConfig
  const targets = memberConfiguration.performanceTargets[pointType]
  
  if (!targets) return null
  
  // Business logic for target calculation
  if (pointType === "HOURS_BASE") {
    // Hours-based projects: same target for all levels
    return targets.all?.[`totalPoint${timePeriod.charAt(0).toUpperCase() + timePeriod.slice(1)}Target`]
  } else if (pointType === "STORYPOINT_BASE") {
    // Story point-based projects: different targets by level
    const levelTargets = targets[developerLevel] || targets['middle'] // Default to middle
    return levelTargets?.[`totalPoint${timePeriod.charAt(0).toUpperCase() + timePeriod.slice(1)}Target`]
  }
  
  return null
}
```

---

## 5.4 Advanced Metric Calculations

### **Reopen Detection Business Logic**

**Configurable Reopen Rules** (metricCalculations.js:calculateReopenMetrics):

```javascript
const calculateReopenMetrics = (issue, projectKey = null) => {
  // Only process Bug tickets
  const issueType = issue.fields?.issuetype?.name || issue.issueType
  if (issueType !== 'Bug') {
    return {
      reopenCount: 0,
      isReopened: false,
      lastReopenDate: null,
      hasReopenHistory: false
    }
  }
  
  const changelog = issue.changelog?.histories || []
  let reopenCount = 0
  let isReopened = false
  let lastReopenDate = null
  
  // Get configurable reopen detection settings
  const reopenConfig = getReopenDetectionConfig(projectKey)
  const { reopenStatuses, reopenTransitions } = reopenConfig
  
  // Business logic: Check for status changes in changelog
  changelog.forEach(history => {
    const statusChanges = history.items?.filter(item => item.field === 'status') || []
    
    statusChanges.forEach(statusChange => {
      const fromStatus = statusChange.fromString
      const toStatus = statusChange.toString
      
      // Business rule 1: Check for explicit reopen statuses
      if (reopenStatuses.some(status => 
        toStatus?.toLowerCase() === status.toLowerCase()
      )) {
        reopenCount += 1
        isReopened = true
        lastReopenDate = history.created
        return
      }
      
      // Business rule 2: Check for reopen transitions (from closed states back to active)
      reopenTransitions.forEach(transition => {
        const matchesFromStatus = transition.from.some(fromState => 
          fromStatus?.toLowerCase().includes(fromState.toLowerCase())
        )
        const matchesToStatus = transition.to.some(toState => 
          toStatus?.toLowerCase().includes(toState.toLowerCase())
        )
        
        if (matchesFromStatus && matchesToStatus) {
          reopenCount += 1
          isReopened = true
          lastReopenDate = history.created
        }
      })
    })
  })
  
  return {
    reopenCount,
    isReopened,
    lastReopenDate,
    hasReopenHistory: reopenCount > 0
  }
}
```

### **Resolution Time SLA Business Logic**

**Severity-Based SLA Calculations**:

```javascript
const calculateResolutionTimeMetrics = (issue, projectKey = null) => {
  const created = issue.fields?.created
  const resolved = issue.fields?.resolutiondate
  const severityResult = parseSeverity(issue, projectKey)
  const severity = severityResult.severity
  
  if (!created || !resolved) {
    return {
      resolutionTimeHours: null,
      resolutionTimeDays: null,
      isOverdue: false,
      efficiencyScore: null
    }
  }
  
  // Time calculation business logic
  const createdDate = new Date(created)
  const resolvedDate = new Date(resolved)
  const timeDiffMs = resolvedDate.getTime() - createdDate.getTime()
  const resolutionTimeHours = timeDiffMs / (1000 * 60 * 60)
  const resolutionTimeDays = timeDiffMs / (1000 * 60 * 60 * 24)
  
  // SLA target business logic (severity-based)
  const slaTargets = {
    [SEVERITY_LEVELS.CRITICAL]: 4,    // 4 hours
    [SEVERITY_LEVELS.MAJOR]: 24,      // 1 day
    [SEVERITY_LEVELS.MINOR]: 72,      // 3 days
    [SEVERITY_LEVELS.LOW]: 168,       // 1 week
    [SEVERITY_LEVELS.COSMETIC]: 168,  // 1 week
    [SEVERITY_LEVELS.UNKNOWN]: 72     // Default to 3 days
  }
  
  const slaTarget = slaTargets[severity] || slaTargets[SEVERITY_LEVELS.MINOR]
  const isOverdue = resolutionTimeHours > slaTarget
  
  // Efficiency score business logic (0-100, higher is better)
  const efficiencyScore = Math.max(0, Math.min(100, 
    100 - ((resolutionTimeHours - slaTarget) / slaTarget * 100)
  ))
  
  return {
    resolutionTimeHours: Math.round(resolutionTimeHours * 100) / 100,
    resolutionTimeDays: Math.round(resolutionTimeDays * 100) / 100,
    isOverdue,
    efficiencyScore: Math.round(efficiencyScore),
    slaTarget
  }
}
```

### **Root Cause Analysis Business Logic**

**Pattern Matching with Confidence Levels**:

```javascript
const extractRootCauseAnalysis = (issue) => {
  // Business rule 1: Check for specific root cause field
  const rootCauseField = issue.fields?.customfield_10636
  if (rootCauseField && rootCauseField.value) {
    return {
      rootCause: rootCauseField.value,
      confidence: 'high',
      source: 'field'
    }
  }
  
  // Business rule 2: Fallback to text analysis
  const summary = issue.fields?.summary || ''
  const description = issue.fields?.description || ''
  const text = `${summary} ${description}`.toLowerCase()
  
  // Enhanced keyword matching with confidence scores
  const patterns = [
    { keywords: ['logic', 'algorithm', 'calculation', 'formula'], category: 'Logic Error', confidence: 'medium' },
    { keywords: ['integration', 'api', 'service', 'endpoint'], category: 'Integration Issue', confidence: 'medium' },
    { keywords: ['performance', 'slow', 'timeout', 'memory', 'cpu'], category: 'Performance', confidence: 'medium' },
    { keywords: ['ui', 'ux', 'interface', 'frontend', 'display'], category: 'UI/UX', confidence: 'medium' },
    { keywords: ['data', 'database', 'query', 'sql', 'migration'], category: 'Data Issue', confidence: 'medium' },
    { keywords: ['security', 'vulnerability', 'auth', 'permission'], category: 'Security', confidence: 'medium' },
    { keywords: ['config', 'configuration', 'environment', 'deploy'], category: 'Configuration', confidence: 'medium' },
    { keywords: ['test', 'testing', 'unit test', 'integration test'], category: 'Test Issue', confidence: 'low' }
  ]
  
  // Pattern matching business logic
  for (const pattern of patterns) {
    if (pattern.keywords.some(keyword => text.includes(keyword))) {
      return {
        rootCause: pattern.category,
        confidence: pattern.confidence,
        source: 'text_analysis'
      }
    }
  }
  
  // Default case
  return {
    rootCause: 'Unknown',
    confidence: 'low',
    source: 'default'
  }
}
```

---

## 5.5 Quality Trend Analysis Business Logic

### **Linear Regression for Bug Trends**

**Statistical Analysis for Quality Improvement**:

```javascript
const calculateQualityTrend = (recentIssues, timeWindowDays = 30) => {
  if (!recentIssues || recentIssues.length === 0) {
    return {
      trend: 'stable',
      trendValue: 0,
      trendPercentage: 0,
      dataPoints: []
    }
  }
  
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - timeWindowDays)
  
  // Group issues by week (business logic for time bucketing)
  const weeklyData = new Map()
  
  recentIssues.forEach(issue => {
    const createdDate = new Date(issue.created)
    if (createdDate >= cutoffDate) {
      const weekKey = getWeekKey(createdDate)
      if (!weeklyData.has(weekKey)) {
        weeklyData.set(weekKey, { total: 0, bugs: 0 })
      }
      const weekData = weeklyData.get(weekKey)
      weekData.total += 1
      if (issue.issueType === 'Bug') {
        weekData.bugs += 1
      }
    }
  })
  
  // Calculate bug rates for each week
  const dataPoints = Array.from(weeklyData.entries())
    .map(([week, data]) => ({
      week,
      bugRate: data.total > 0 ? (data.bugs / data.total) * 100 : 0,
      total: data.total,
      bugs: data.bugs
    }))
    .sort((a, b) => a.week.localeCompare(b.week))
  
  if (dataPoints.length < 2) {
    return {
      trend: 'stable',
      trendValue: 0,
      trendPercentage: 0,
      dataPoints
    }
  }
  
  // Linear regression business logic
  const trendValue = calculateLinearTrend(dataPoints.map(d => d.bugRate))
  const firstRate = dataPoints[0].bugRate
  const lastRate = dataPoints[dataPoints.length - 1].bugRate
  
  // Trend classification business logic
  let trend = 'stable'
  if (trendValue < -1) trend = 'improving'  // Bug rate decreasing is improving
  else if (trendValue > 1) trend = 'declining'  // Bug rate increasing is declining
  
  const trendPercentage = firstRate > 0 ? ((lastRate - firstRate) / firstRate) * 100 : 0
  
  return {
    trend,
    trendValue,
    trendPercentage: Math.round(trendPercentage),
    dataPoints
  }
}
```

---

## 5.6 Time Tracking Business Logic

### **Time Efficiency Calculation**

**Estimation Accuracy and Efficiency Scoring**:

```javascript
const calculateTimeTrackingMetrics = (issue) => {
  const timetracking = issue.fields?.timetracking || {}
  const timeSpentSeconds = timetracking.timeSpentSeconds || 0
  const remainingEstimateSeconds = timetracking.remainingEstimateSeconds || 0
  const originalEstimateSeconds = timetracking.originalEstimateSeconds || 0
  
  // Business logic for estimation accuracy
  const estimationAccuracy = originalEstimateSeconds > 0 ? 
    (timeSpentSeconds / originalEstimateSeconds) * 100 : null
  
  return {
    timeSpentHours: timeSpentSeconds / 3600,
    timeSpentSeconds,
    remainingEstimateHours: remainingEstimateSeconds / 3600,
    originalEstimateHours: originalEstimateSeconds / 3600,
    hasTimeLogged: timeSpentSeconds > 0,
    hasEstimate: originalEstimateSeconds > 0,
    estimationAccuracy
  }
}
```

### **Developer Time Efficiency Business Logic**

```javascript
const calculateDeveloperTimeEfficiency = (timeTrackingData) => {
  if (!timeTrackingData || timeTrackingData.length === 0) {
    return {
      averageTimePerStoryPoint: 0,
      estimationAccuracy: 0,
      timeEfficiencyScore: 0,
      totalTimeSpent: 0
    }
  }
  
  const totalTime = timeTrackingData.reduce((sum, data) => sum + data.timeSpentHours, 0)
  const totalStoryPoints = timeTrackingData.reduce((sum, data) => sum + (data.storyPoints || 0), 0)
  const accuracyData = timeTrackingData.filter(data => data.estimationAccuracy !== null)
  
  const averageTimePerStoryPoint = totalStoryPoints > 0 ? totalTime / totalStoryPoints : 0
  const estimationAccuracy = accuracyData.length > 0 ? 
    accuracyData.reduce((sum, data) => sum + data.estimationAccuracy, 0) / accuracyData.length : 0
  
  // Efficiency score business logic (0-100, higher is better)
  let timeEfficiencyScore = 0
  if (averageTimePerStoryPoint > 0) {
    // Business rule: Ideal is 4 hours per story point, acceptable is 8 hours
    timeEfficiencyScore = Math.max(0, Math.min(100, 
      100 - ((averageTimePerStoryPoint - 4) / 4 * 100)
    ))
  }
  
  return {
    averageTimePerStoryPoint,
    estimationAccuracy,
    timeEfficiencyScore: Math.round(timeEfficiencyScore),
    totalTimeSpent: totalTime
  }
}
```

---

## 5.7 Severity Mapping Business Logic

### **Configurable Severity Rules**

**Project-Specific Severity Configuration**:

```javascript
const parseSeverity = (issue, projectKey = null) => {
  const severityConfig = getSeverityConfig(projectKey)
  
  // Business rule 1: Try custom severity field first
  const severityField = issue.fields?.[severityConfig.severityField]
  let severityValue = null
  
  if (severityField) {
    if (typeof severityField === 'string') {
      severityValue = severityField
    } else if (severityField.value) {
      severityValue = severityField.value
    } else if (severityField.name) {
      severityValue = severityField.name
    }
  }
  
  // Business rule 2: Fallback to priority field if configured
  if (!severityValue && severityConfig.usePriorityFallback) {
    const priority = issue.fields?.priority
    if (priority) {
      severityValue = priority.name || priority.value
    }
  }
  
  // Business rule 3: Map to standardized severity levels
  let mappedSeverity = severityConfig.defaultSeverity || 'Minor'
  
  if (severityValue) {
    // Check severity mapping configuration
    const mapping = severityConfig.severityMapping[severityValue]
    if (mapping) {
      mappedSeverity = mapping
    } else {
      // Fallback mapping logic
      const lowerValue = severityValue.toLowerCase()
      if (lowerValue.includes('critical') || lowerValue.includes('blocker')) {
        mappedSeverity = 'Critical'
      } else if (lowerValue.includes('major') || lowerValue.includes('high')) {
        mappedSeverity = 'Major'  
      } else if (lowerValue.includes('minor') || lowerValue.includes('medium')) {
        mappedSeverity = 'Minor'
      } else if (lowerValue.includes('low') || lowerValue.includes('trivial')) {
        mappedSeverity = 'Low'
      }
    }
  }
  
  return {
    severity: mappedSeverity,
    originalValue: severityValue,
    source: severityValue ? (severityField ? 'severity_field' : 'priority_field') : 'default',
    confidence: severityValue ? 'high' : 'low'
  }
}
```

---

## 5.8 ISO Week Calculation Business Logic

### **Consistent Time Period Calculations**

**ISO 8601 Week Standards for Reporting**:

```javascript
const getWeekKey = (date) => {
  // Business logic: Use ISO week calculation for consistency
  const year = date.getFullYear()
  const week = Math.ceil((date.getTime() - new Date(year, 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000))
  return `${year}-W${week.toString().padStart(2, '0')}`
}

const getMonthKey = (date) => {
  // Business logic: YYYY-MM format for month aggregation
  return date.toISOString().substring(0, 7)
}

const getQuarterKey = (date) => {
  // Business logic: Quarter calculation
  const year = date.getFullYear()
  const quarter = Math.ceil((date.getMonth() + 1) / 3)
  return `${year}-Q${quarter}`
}
```

---

## 5.9 Filter Application Business Logic

### **Index-Based Filtering Logic**

**O(1) Filter Performance with Set Operations**:

```javascript
const applyFilters = (filters, data) => {
  if (!data || !data.indices) return null
  
  let filteredIssueIds = new Set()
  let isFirstFilter = true
  
  // Business logic: Apply filters using pre-built indices
  
  // Developer filter
  if (filters.developers.length > 0) {
    const developerIds = new Set()
    filters.developers.forEach(developer => {
      const devIssues = data.indices.byDeveloper.get(developer) || new Set()
      devIssues.forEach(id => developerIds.add(id))
    })
    
    if (isFirstFilter) {
      filteredIssueIds = developerIds
      isFirstFilter = false
    } else {
      filteredIssueIds = new Set([...filteredIssueIds].filter(id => developerIds.has(id)))
    }
  }
  
  // Project filter  
  if (filters.projects.length > 0) {
    const projectIds = new Set()
    filters.projects.forEach(project => {
      const projIssues = data.indices.byProject.get(project) || new Set()
      projIssues.forEach(id => projectIds.add(id))
    })
    
    if (isFirstFilter) {
      filteredIssueIds = projectIds
      isFirstFilter = false
    } else {
      filteredIssueIds = new Set([...filteredIssueIds].filter(id => projectIds.has(id)))
    }
  }
  
  // Continue for other filter dimensions...
  
  // Business logic: If no filters applied, return all data
  if (isFirstFilter) {
    // No filters applied - return all issues
    filteredIssueIds = new Set(data.allIssueIds)
  }
  
  // Convert filtered IDs back to issue objects and recalculate metrics
  const filteredIssues = Array.from(filteredIssueIds)
    .map(id => data.issueMap.get(id))
    .filter(Boolean)
  
  // Recalculate aggregated metrics for filtered data
  const filteredMetrics = recalculateMetricsForFiltered(filteredIssues, data.memberConfiguration)
  
  return {
    filteredIssues,
    filteredMetrics,
    filterSummary: {
      totalIssues: data.allIssues.length,
      filteredIssues: filteredIssues.length,
      filterPercentage: (filteredIssues.length / data.allIssues.length) * 100
    }
  }
}
```

---

## 5.10 Master Data Approach

### **Filter Options Generation Business Logic**

**Dynamic Filter Options from Processed Data**:

```javascript
const generateFilterOptions = (processedData) => {
  const filterOptions = {
    developers: [],
    projects: [],
    issueTypes: [],
    statuses: [],
    severities: [],
    rootCauses: []
  }
  
  // Business logic: Generate options from actual data
  
  // Developer options (only configured members with data)
  const developersWithData = new Set()
  processedData.developerStats.forEach((stats, developerName) => {
    if (stats.totalIssues > 0) {
      developersWithData.add(developerName)
    }
  })
  
  filterOptions.developers = Array.from(developersWithData)
    .map(name => {
      const memberInfo = memberConfiguration.developers.find(dev => dev.name === name)
      return {
        name,
        level: memberInfo?.level || 'middle',
        issueCount: processedData.developerStats.get(name)?.totalIssues || 0
      }
    })
    .sort((a, b) => b.issueCount - a.issueCount) // Sort by issue count
  
  // Project options (only projects with data)
  const projectsWithData = new Set()
  processedData.performanceMetadata.forEach((developerMap, projectKey) => {
    if (developerMap.size > 0) {
      projectsWithData.add(projectKey)
    }
  })
  
  filterOptions.projects = Array.from(projectsWithData)
    .map(key => {
      const projectConfig = memberConfiguration.projects.find(p => p.key === key)
      return {
        key,
        name: projectConfig?.name || key,
        pointType: projectConfig?.pointType || 'STORYPOINT_BASE'
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name))
  
  // Dynamic options from indices
  filterOptions.issueTypes = Array.from(processedData.indices.byIssueType.keys())
    .map(type => ({
      name: type,
      count: processedData.indices.byIssueType.get(type).size
    }))
    .sort((a, b) => b.count - a.count)
  
  filterOptions.statuses = Array.from(processedData.indices.byStatus.keys())
    .map(status => ({
      name: status,
      count: processedData.indices.byStatus.get(status).size
    }))
    .sort((a, b) => b.count - a.count)
  
  filterOptions.severities = Array.from(processedData.indices.bySeverity.keys())
    .map(severity => ({
      name: severity,
      count: processedData.indices.bySeverity.get(severity).size
    }))
    .sort((a, b) => {
      // Business logic: Sort by severity priority
      const severityOrder = ['Critical', 'Major', 'Minor', 'Low', 'Cosmetic', 'Unknown']
      return severityOrder.indexOf(a.name) - severityOrder.indexOf(b.name)
    })
  
  return filterOptions
}
```

---

## 5.11 Business Logic Summary

### **Core Business Rules Implemented**

1. **Member Inclusion Rules**:
   - Only configured members (32+ developers) have KPIs calculated
   - Match by name or JIRA account ID for flexibility
   - Role-based separation (developer vs QA)

2. **Performance Target Rules**:
   - Project-specific targets based on point type (HOURS_BASE vs STORYPOINT_BASE)
   - Developer level-based targets (senior vs middle)
   - Time period-based targets (week/month/quarter)

3. **Quality Assessment Rules**:
   - Severity-based SLA targets (Critical: 4h, Major: 24h, Minor: 72h, Low: 168h)
   - Configurable reopen detection with project-specific overrides
   - Root cause pattern matching with confidence scoring

4. **Time Tracking Rules**:
   - Estimation accuracy calculation (spent vs estimated)
   - Time efficiency scoring (ideal: 4h per story point)
   - Weekly/monthly aggregation for trend analysis

5. **Filtering Rules**:
   - Index-based O(1) filtering performance
   - Master data approach for filter options
   - Dynamic filter validation and feedback

### **Advanced Business Logic Patterns**

1. **Single-Loop Efficiency**: Process each issue exactly once for O(n) complexity
2. **Configurable Rules Engine**: Project-specific overrides for severity, reopen detection
3. **Statistical Analysis**: Linear regression for quality trend analysis
4. **Multi-Dimensional Indexing**: Pre-built indices for instant filtering
5. **Performance Metadata**: Triple-nested Maps for complex performance tracking
6. **Time Period Consistency**: ISO week calculations for reliable reporting
7. **Graceful Defaults**: Fallback values and configurations for missing data
8. **Dynamic Validation**: Real-time business rule validation
9. **Master Data Management**: Centralized configuration with helper functions
10. **Quality Metrics Integration**: Comprehensive quality assessment framework

---

**Business Logic Complexity**: The dashboard implements sophisticated business logic that goes far beyond simple data aggregation, including configurable rule engines, statistical analysis, performance optimization, and comprehensive quality assessment frameworks that scale to handle 10,000+ issues with complex filtering and real-time calculations.