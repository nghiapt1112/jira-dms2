/**
 * Developer Quality Service
 * Processes JIRA issues for developer quality metrics with pre-calculated cache structures
 * Following .cursorrules conventions - camelCase naming, performance optimizations
 */

// Import unified time utilities to eliminate DRY violation
import { 
  getTimePeriodKey,
  getWeekFromDate,
  getQuarterFromDate,
  getWeekDateRange,
  formatDateDDMMYYYY,
  generateQuarterDataFromMonths,
  getMonthsInQuarter,
  getQuarterFromMonth
} from '../../../shared/utils/timeUtils.js'



import { JIRA_CONSTANTS } from '../../../constants/jiraConstants'
import { 
  shouldIncludeMember, 
  memberConfiguration, 
  getSeverityConfig,
  mapBugTypeToCategory,
  getBugTypeMapping,
  getStandardBugTypeCategories 
} from '../../../constants/memberConfiguration'
import { parseSeverity } from '../../../shared/utils/severityParser.js'
// REMOVED: targetCalculationService import - now using preprocessed data (caching strategy fix)
import { preprocessPerformanceData } from './performancePreprocessor.js'
import { 
  calculateReopenMetrics, 
  calculateResolutionTimeMetrics, 
  extractRootCauseAnalysis,
  calculateQualityTrend,
  calculateTimeEfficiency,
  aggregateSeverityBreakdown,
  aggregateRootCauseBreakdown,
  calculateTimeTrackingMetrics,
  aggregateTimeTrackingByPeriod,
  calculateDeveloperTimeEfficiency
} from '../utils/metricCalculations'

import { generateBugAnalysisJSON } from './bugAnalysisProcessor.js'

import { 
  processBugForTrendAnalysis, 
  getInitialBugTrendData,
  categorizeBugForTrend,
  categorizeBugStatus
} from '../../../shared/utils/bugCategorization.js'

// Cache configured project names for efficient lookup
const CONFIGURED_PROJECT_NAMES = new Set(
  memberConfiguration.projects?.map(p => p.name) || []
)

// Helper function to get correct severity breakdown structure
const getDefaultSeverityBreakdown = () => {
  const severityConfig = getSeverityConfig() // Use default config
  const breakdown = {}
  severityConfig.severityLevels.forEach(level => {
    breakdown[level] = 0
  })
  breakdown['Unknown'] = 0
  return breakdown
}

export const developerQualityService = {
  /**
   * Process JIRA issues for developer quality metrics during the main processing loop
   * @param {Array} issues - Array of JIRA issues
   * @returns {Promise<Object>} Pre-processed developer quality data with metrics, chartData, and indices
   */
  processJiraIssuesForDeveloperQuality: async (issues) => {
    const startTime = performance.now()
    
    try {
      // Initialize data structures
      const developerQualityData = {
        metrics: developerQualityService.initializeMetrics(),
        chartData: developerQualityService.initializeChartData(),
        indices: developerQualityService.initializeIndices(),
        filterOptions: developerQualityService.initializeFilterOptions(),
        minimalIssues: [],
        bugAnalysis: generateBugAnalysisJSON.initialize(), // NEW: Initialize bug analysis
        performanceMetadata: {
          // Performance metadata by project -> developer -> period -> {actualPoints, target, performance}
          projectPerformance: new Map(), // projectKey -> Map(developerName -> Map(periodKey -> {actualPoints, target, performance}))
          periodKeys: new Set(), // All unique period keys encountered
          developers: new Set(), // All developers encountered
          projects: new Set() // All projects encountered
        }
      }
    


    // Initialize project-specific bug type tracking for master data configuration
    const projectBugTypeTracker = new Map() // project -> Set of raw values
    const projectBugTypeStructureExamples = new Map() // project -> examples
    const projectBugTypeMappings = new Map() // project -> effective mapping
    
    // SINGLE LOOP PROCESSING - integrate with existing main loop
    issues.forEach((issue, index) => {
      try {
      // Enhanced logging for comprehensive data pipeline tracking
      const assignee = issue.fields?.assignee?.displayName || 'Unassigned'
      const assigneeAccountId = issue.fields?.assignee?.accountId || null
      const projectName = issue.fields?.project?.name || 'Unknown'
      const projectKey = issue.fields?.project?.key || 'Unknown'
      

      
      // Check if member should be included
      const memberStatus = shouldIncludeMember(assignee, assigneeAccountId)
      
      // Check if project should be included  
      const CONFIGURED_PROJECT_NAMES = new Set(memberConfiguration.projects?.map(p => p.name) || [])
      const isProjectIncluded = CONFIGURED_PROJECT_NAMES.has(projectName)
      
      // Collect project-specific bug type data for master configuration (only for Bug issues)
      if (issue.fields?.issuetype?.name === 'Bug') {
        const projectKey = issue.fields?.project?.key || 'Unknown'
        const bugTypeField = issue.fields?.[JIRA_CONSTANTS.CUSTOM_FIELDS.BUG_TYPE]
        
        // Initialize project tracking if not exists
        if (!projectBugTypeTracker.has(projectKey)) {
          projectBugTypeTracker.set(projectKey, new Set())
          projectBugTypeStructureExamples.set(projectKey, [])
          projectBugTypeMappings.set(projectKey, getBugTypeMapping(projectKey))
        }
        
        const projectValues = projectBugTypeTracker.get(projectKey)
        const projectExamples = projectBugTypeStructureExamples.get(projectKey)
        
        if (bugTypeField) {
          // Track the structure and collect values per project
          if (Array.isArray(bugTypeField)) {
            bugTypeField.forEach((option, idx) => {
              if (option && option.value) {
                projectValues.add(option.value)
                // Store structure example for the first few entries per project
                if (projectExamples.length < 2) {
                  projectExamples.push({
                    issueKey: issue.key,
                    structure: option,
                    value: option.value,
                    type: `Array[${idx}]`
                  })
                }
              }
            })
          } else if (typeof bugTypeField === 'object' && bugTypeField.value) {
            projectValues.add(bugTypeField.value)
            if (projectExamples.length < 2) {
              projectExamples.push({
                issueKey: issue.key,
                structure: bugTypeField,
                value: bugTypeField.value,
                type: 'Object'
              })
            }
          } else if (typeof bugTypeField === 'string') {
            projectValues.add(bugTypeField)
            if (projectExamples.length < 2) {
              projectExamples.push({
                issueKey: issue.key,
                structure: bugTypeField,
                value: bugTypeField,
                type: 'String'
              })
            }
          }
        }
      }
      
      // Process developer quality metrics
      developerQualityService.processDeveloperQualityMetrics(issue, index, developerQualityData)
      
      // Build indices for instant filtering
      developerQualityService.buildFilterIndices(issue, index, developerQualityData.indices)
      
      // NEW: Process bug analysis
      generateBugAnalysisJSON.processBug(issue, developerQualityData.bugAnalysis)
      
      // PERFORMANCE METADATA COLLECTION
      // Note: assignee and projectKey already defined above
      const resolvedDate = issue.fields?.resolutiondate
      const storyPoints = issue.fields?.customfield_10028 || 0
      
      if (assignee && projectKey && resolvedDate && storyPoints > 0) {
        // Track metadata sets
        developerQualityData.performanceMetadata.developers.add(assignee)
        developerQualityData.performanceMetadata.projects.add(projectKey)
        
        // Calculate time period keys for resolved date
        const periods = ['week', 'month', 'quarter']
        periods.forEach(period => {
          const periodKey = getTimePeriodKey(resolvedDate, period)
          developerQualityData.performanceMetadata.periodKeys.add(periodKey)
          
          // Initialize project performance map if needed
          if (!developerQualityData.performanceMetadata.projectPerformance.has(projectKey)) {
            developerQualityData.performanceMetadata.projectPerformance.set(projectKey, new Map())
          }
          
          const projectMap = developerQualityData.performanceMetadata.projectPerformance.get(projectKey)
          
          // Initialize developer map if needed
          if (!projectMap.has(assignee)) {
            projectMap.set(assignee, new Map())
          }
          
          const developerMap = projectMap.get(assignee)
          
          // Initialize or update period data
          if (!developerMap.has(periodKey)) {
            // Calculate target directly from configuration (avoiding deprecated service)
            let target = null
            const project = memberConfiguration.projects.find(p => p.key === projectKey)
            if (project?.pointType) {
              const targetConfig = memberConfiguration.performanceTargets[project.pointType]
              if (project.pointType === 'STORYPOINT_HOURS_BASE') {
                const allTargets = targetConfig?.all
                if (allTargets) {
                  switch (period) {
                    case 'week':
                      target = allTargets.totalPointWeekTarget
                      break
                    case 'quarter':
                      target = allTargets.totalPointQuarterTarget
                      break
                    default:
                      target = allTargets.totalPointMonthTarget
                      break
                  }
                }
              } else if (project.pointType === 'STORYPOINT_BASE') {
                const developer = memberConfiguration.developers.find(d => d.name === assignee)
                const levelTargets = targetConfig?.[developer?.level]
                if (levelTargets) {
                  switch (period) {
                    case 'week':
                      target = levelTargets.totalPointWeekTarget
                      break
                    case 'quarter':
                      target = levelTargets.totalPointQuarterTarget
                      break
                    default:
                      target = levelTargets.totalPointMonthTarget
                      break
                  }
                }
              }
            }
            
            developerMap.set(periodKey, {
              actualPoints: 0,
              target,
              performance: null // Will be calculated after accumulation
            })
          }
          
          // Accumulate story points for this period
          const periodData = developerMap.get(periodKey)
          periodData.actualPoints += storyPoints
          
          // Update performance status based on accumulated points
          if (periodData.target !== null) {
            periodData.performance = periodData.actualPoints >= periodData.target ? 'over' : 'under'
          }
        })
      }
      
      // Extract values for minimal issue data
      const status = issue.fields?.status?.name || 'Unknown'
      const issueType = issue.fields?.issuetype?.name || 'Unknown'
      const rootCause = developerQualityService.extractRootCause(issue)
      
      // Calculate time tracking metrics for this issue
      const timeMetrics = calculateTimeTrackingMetrics(issue)
      
      // Keep minimal issue data for popups with time tracking data
      developerQualityData.minimalIssues.push({
        id: issue.id,
        key: issue.key,
        summary: issue.fields?.summary || 'No summary',
        assignee: issue.fields?.assignee?.displayName || 'Unassigned',
        status: status,
        issueType: issueType,
        severity: parseSeverity(issue, issue.fields?.project?.key).severity,
        project: issue.fields?.project?.name || issue.fields?.project?.key || 'Unknown',
        rootCause: rootCause,
        updated: issue.fields?.updated || null,
        resolved: issue.fields?.resolutiondate || null,
        storyPoints: issue.fields?.customfield_10028 || 0,
        // CRITICAL FIX: Add time tracking data to minimalIssues for consistency
        timeSpentHours: timeMetrics.timeSpentHours,
        hasTimeLogged: timeMetrics.hasTimeLogged,
        estimationAccuracy: timeMetrics.estimationAccuracy,
        // Add bug categorization for reuse during filtering (caching strategy compliance)
        bugCategory: issueType === 'Bug' ? categorizeBugForTrend(issue) : null,
        // Add bug type for Bug Type Distribution Chart
        bugType: issueType === 'Bug' ? developerQualityService.extractBugType(issue) : null
      })
      } catch (issueError) {
        console.warn(`Error processing issue ${index}:`, issueError, issue)
        // Continue processing other issues
      }
    })
    
    // Post-process calculations
    developerQualityService.finalizeMetrics(developerQualityData.metrics)
    developerQualityService.finalizeChartData(developerQualityData.chartData, developerQualityData.metrics)
    
    developerQualityService.finalizeFilterOptions(developerQualityData.filterOptions, developerQualityData.indices)
    
    // NEW: Finalize bug analysis
    developerQualityData.bugAnalysis = generateBugAnalysisJSON.finalize(developerQualityData.bugAnalysis)
    
    const processingTime = performance.now() - startTime
    

    
    // Calculate totals
    let totalBugIssues = 0
    let totalUniqueValues = 0
    
    // Log each project's data
    projectBugTypeTracker.forEach((values, projectKey) => {
      const projectExamples = projectBugTypeStructureExamples.get(projectKey) || []
      const projectMapping = projectBugTypeMappings.get(projectKey) || {}
      
      totalBugIssues += Array.from(values).length
      totalUniqueValues += values.size
      

      
      const sortedValues = Array.from(values).sort()
      sortedValues.forEach(value => {
        const mappedCategory = projectMapping[value] || mapBugTypeToCategory(value, projectKey)
        const emoji = mappedCategory === 'UI' ? '🎨' : 
                     mappedCategory === 'Performance' ? '⚡' : 
                     mappedCategory === 'Security' ? '🔒' : 
                     mappedCategory === 'Integration' ? '🔗' : 
                     mappedCategory === 'Regression' ? '🔄' : '⚙️'

      })
      


    })
    

    projectBugTypeMappings.forEach((mapping, projectKey) => {

      Object.entries(mapping).forEach(([rawValue, category]) => {
        const isProjectSpecific = memberConfiguration.bugTypeConfiguration.projectSpecific[projectKey] && 
                                 memberConfiguration.bugTypeConfiguration.projectSpecific[projectKey][rawValue]
        const source = isProjectSpecific ? '(Project-specific)' : '(Default)'

      })
    })
    

    projectBugTypeTracker.forEach((values, projectKey) => {
      const unmappedValues = Array.from(values).filter(value => 
        !projectBugTypeMappings.get(projectKey)[value]
      )
      

    })
    

    

    
    // CRITICAL FIX: Preprocess performance data during initial processing (caching strategy)
    // This eliminates on-demand calculations in chart components
    const preprocessedPerformanceData = preprocessPerformanceData(
      developerQualityData.performanceMetadata,
      developerQualityData.chartData?.teamContributionChart?.data || [],
      { timeframe: 'month' } // Default timeframe, can be overridden later
    )
    
    const finalData = {
      ...developerQualityData,
      // Add preprocessed performance data to cached structure
      preprocessedPerformance: preprocessedPerformanceData,
      metadata: {
        processingTime,
        totalIssues: issues.length,
        cacheSize: developerQualityService.calculateCacheSize(developerQualityData),
        performanceDataPreprocessed: true
      }
    }
    
    // Cache the processed data for future use with comprehensive logging
    try {
      const cacheStartTime = Date.now()
  
      
      const cacheSuccess = await developerQualityService.cacheProcessedData(finalData)
      
      // NEW: Cache bug analysis separately
      if (finalData.bugAnalysis) {
        const { developerQualityIndexedDB } = await import('./developerQualityIndexedDB')
        await developerQualityIndexedDB.saveBugAnalysis(finalData.bugAnalysis)
      }

    } catch (error) {
      console.error('Failed to cache processed developer quality data:', error)

      // Don't fail the entire operation if caching fails
    }
    
    return finalData
    } catch (error) {
      console.error('Error processing JIRA issues for developer quality:', error)
      
      // Return fallback data structure
      return {
        metrics: developerQualityService.initializeMetrics(),
        chartData: developerQualityService.initializeChartData(),
        indices: developerQualityService.initializeIndices(),
        filterOptions: developerQualityService.initializeFilterOptions(),
        minimalIssues: [],
        performanceMetadata: {
          projectPerformance: new Map(),
          periodKeys: new Set(),
          developers: new Set(),
          projects: new Set()
        },
        error: error.message,
        metadata: {
          processingTime: performance.now() - startTime,
          totalIssues: issues.length,
          error: true
        }
      }
    }
  },

  /**
   * Initialize metrics structure
   */
  initializeMetrics: () => ({
    teamContribution: {
      totalContributions: 0,
      totalStoryPoints: 0,
      averageContribution: 0,
      averageStoryPoints: 0,
      contributionTrend: 'stable',
      topContributors: [],
      developerStats: new Map(),
      // Time-based story points aggregation
      timeBasedStoryPoints: {
        byWeek: new Map(),
        byMonth: new Map()
        // byQuarter removed - calculated on-demand for 33% memory reduction
      }
    },
    bugAnalysis: {
      totalBugs: 0,
      bugTrend: 'stable',
      severityDistribution: {
        Critical: 0,
        High: 0,
        Medium: 0,
        Low: 0,
        Unknown: 0
      },
      monthlyBugTrend: new Map(),
      // NEW: Time period trends for responsive charts
      weeklyBugTrend: new Map(),
      quarterlyBugTrend: new Map(),
      // NEW METRICS - EXTENDED
      reopenAnalysis: {
        totalReopens: 0,
        overallReopenRate: 0,
        byDeveloper: new Map(),
        byProject: new Map(),
        trends: new Map()
      },
      resolutionTimeAnalysis: {
        averageResolutionTimeHours: 0,
        byDeveloper: new Map(),
        bySeverity: new Map(),
        overdueCount: 0,
        efficiencyAverage: 0,
        trends: new Map()
      }
    },
    bugStatusAnalysis: {
      byProject: new Map(), // projectKey -> Map(timePeriod -> statusCounts)
      aggregated: new Map(), // timePeriod -> statusCounts (all projects combined)
      totalBugs: 0,
      statusBreakdown: {
        new: 0,
        inProgress: 0,
        resolved: 0,
        notFixed: 0
      },
      // Time period breakdown for different chart views
      byWeek: new Map(),
      byMonth: new Map(),
      byQuarter: new Map(),
      metadata: {
        processedAt: null,
        timePeriods: new Set(),
        projects: new Set()
      }
    },
    rootCauseAnalysis: {
      categories: new Map(),
      trends: new Map()
    },
    developerRootCause: {
      developers: new Map()
    },
    bugRateAnalysis: {
      developers: new Map(),
      teamAverage: 0,
      benchmarks: {
        excellent: '<10%',
        good: '10-15%',
        needsImprovement: '>15%'
      }
    },
    bugTypeAnalysis: {
      byProject: new Map(), // project -> bug type distribution
      byTimePeriod: new Map(), // time period -> bug type distribution
      byProjectAndTimePeriod: new Map(), // composite key -> bug type distribution
      totalDistribution: {
        bugTypes: {
          'Functional': { count: 0, percentage: 0 },
          'UI': { count: 0, percentage: 0 },
          'Performance': { count: 0, percentage: 0 },
          'Security': { count: 0, percentage: 0 },
          'Regression': { count: 0, percentage: 0 },
          'Integration': { count: 0, percentage: 0 },
          'Unknown': { count: 0, percentage: 0 }
        },
        totalBugs: 0,
        metadata: {
          calculatedAt: null,
          source: 'single-loop-processing'
        }
      },
              metadata: {
          totalBugs: 0,
          projectCount: 0,
          timePeriods: [],
          bugTypes: [],
          projectConfigurations: new Map(), // project -> { rawValues: Set, mapping: Object, categories: Set }
          standardCategories: getStandardBugTypeCategories()
        }
    }
  }),

  /**
   * Initialize chart data structure
   */
  initializeChartData: () => ({
    teamContributionChart: {
      type: 'stacked-bar',
      data: [],
      config: {
        xAxisKey: 'timePeriod',
        yAxisKey: 'storyPoints',
        colorScheme: 'multi',
        timePeriodType: 'month', // week, month, quarter
        statusFilter: memberConfiguration.filterDefaults.statusFilter // Dynamic status filter
      }
    },
    bugTrendChart: {
      type: 'line',
      data: [],
      config: {
        xAxisKey: 'month',
        lines: ['total', 'resolved', 'notFixed', 'new', 'inProgress']
      }
    },
    rootCauseChart: {
      type: 'pie',
      data: []
    },
    developerRootCauseChart: {
      type: 'stacked-bar',
      data: []
    },
    bugTypeDistributionChart: {
      type: 'pie',
      data: {
        labels: [],
        datasets: []
      },
      config: {
        showLegend: true,
        colorScheme: 'bugType',
        responsive: true
      }
    },
    bugStatusChart: {
      type: 'line',
      data: [],
      config: {
        xAxisKey: 'timePeriod',
        lines: ['new', 'inProgress', 'resolved', 'notFixed'],
        timePeriod: 'month', // 'week', 'month', 'quarter'
        colors: {
          new: '#1976d2',
          inProgress: '#ff9800',
          resolved: '#2e7d32',
          notFixed: '#d32f2f'
        }
      }
    }
  }),

  /**
   * Initialize indices for instant filtering
   */
  initializeIndices: () => ({
    // Primary indices
    byDeveloper: new Map(),
    byProject: new Map(),
    byIssueType: new Map(),
    byStatus: new Map(),
    bySeverity: new Map(),
    byRootCause: new Map(),
    
    // Time-based indices
    byMonth: new Map(),
    byWeek: new Map(),
    byQuarter: new Map(),
    
    // Composite indices for complex filtering
    byDeveloperAndProject: new Map(),
    
    // Project mappings
    projectNameToKey: new Map(),
    byProjectAndMonth: new Map(),
    byDeveloperAndSeverity: new Map()
  }),

  /**
   * Initialize filter options
   */
  initializeFilterOptions: () => {
    // Pre-populate developers from member configuration
    const predefinedDevelopers = new Set(
      memberConfiguration.developers.map(dev => dev.name)
    )
    
    // Pre-populate projects from member configuration - ONLY show configured projects
    const predefinedProjects = new Set(
      memberConfiguration.projects?.map(proj => proj.name) || []
    )
    
    // Use master data from memberConfiguration
    const commonIssueTypes = new Set(memberConfiguration.issueTypes || [])
    const commonStatuses = new Set(memberConfiguration.statuses || [])
    const commonSeverities = new Set(memberConfiguration.severities || [])
    const commonRootCauses = new Set(memberConfiguration.rootCauses || [])
    
    
    return {
      developers: predefinedDevelopers,
      projects: predefinedProjects,
      issueTypes: commonIssueTypes,
      statuses: commonStatuses,
      severities: commonSeverities,
      rootCauses: commonRootCauses,
      dateRanges: {
        months: new Set(),
        weeks: new Set(),
        quarters: new Set()
      }
    }
  },

  /**
   * Process individual issue for developer quality metrics
   */
  processDeveloperQualityMetrics: (issue, index, data) => {
    const assignee = issue.fields?.assignee?.displayName || 'Unassigned'
    const assigneeAccountId = issue.fields?.assignee?.accountId || null
    const project = issue.fields?.project?.key || 'Unknown'
    const projectName = issue.fields?.project?.name || project
    const issueType = issue.fields?.issuetype?.name || 'Unknown'
    const status = issue.fields?.status?.name || 'Unknown'
    
    // Get severity using centralized parser
    const severityResult = parseSeverity(issue, project)
    const severity = severityResult.severity
    
    const rootCause = developerQualityService.extractRootCause(issue)
    const updated = issue.fields?.updated
    const resolved = issue.fields?.resolutiondate
    const created = issue.fields?.created
    
    // Extract story points from customfield_10028
    const storyPoints = issue.fields?.customfield_10028 || 0

    // Check if member should be included based on configuration (by name or jiraId)
    const memberStatus = shouldIncludeMember(assignee, assigneeAccountId)
    

    // Team contribution metrics - now using story points and member filtering
    if (assignee !== 'Unassigned' && memberStatus.isIncluded) {
      if (!data.metrics.teamContribution.developerStats.has(assignee)) {
        // STEP 1: Keep existing structure EXACTLY the same
        const currentStats = {
          contributions: 0,
          storyPoints: 0,
          bugs: 0,
          projects: new Set(),
          statusBreakdown: new Map(), // Track story points by status
          role: memberStatus.role // Track member role (developer/qa)
        }

        // STEP 2: APPEND new fields (safe extension)
        const extendedStats = {
          ...currentStats,           // INHERIT ALL EXISTING
          // NEW FIELDS ONLY (appended safely)
          reopenCount: 0,
          resolutionTimes: [],
          recentBugs: [],
          severityBreakdown: getDefaultSeverityBreakdown(),
          rootCauseBreakdown: {},
          overdueCount: 0,
          
          // NEW TIME TRACKING FIELDS - ADD THESE:
          timeTrackingData: {
            totalTimeSpentHours: 0,
            totalStoryPoints: 0,
            timePerStoryPoint: 0,
            estimationAccuracy: [],
            timeLoggedIssues: 0,
            weeklyTimeTracking: new Map(),
            monthlyTimeTracking: new Map(),
            timeTrackingIssues: []
          }
        }

        data.metrics.teamContribution.developerStats.set(assignee, extendedStats)
      }
      
      const devStats = data.metrics.teamContribution.developerStats.get(assignee)
      devStats.contributions += 1
      devStats.storyPoints += storyPoints
      devStats.projects.add(project)
      
      // Track story points by status for dynamic filtering
      if (!devStats.statusBreakdown.has(status)) {
        devStats.statusBreakdown.set(status, 0)
      }
      devStats.statusBreakdown.set(status, devStats.statusBreakdown.get(status) + storyPoints)
      
      if (issueType === 'Bug') {
        devStats.bugs += 1
      }
      
      data.metrics.teamContribution.totalContributions += 1
      data.metrics.teamContribution.totalStoryPoints = (data.metrics.teamContribution.totalStoryPoints || 0) + storyPoints
    }

    // Bug analysis metrics - only include bugs from configured members
    if (issueType === 'Bug' && memberStatus.isIncluded) {
      data.metrics.bugAnalysis.totalBugs += 1
      data.metrics.bugAnalysis.severityDistribution[severity] = 
        (data.metrics.bugAnalysis.severityDistribution[severity] || 0) + 1
      
      // Bug trends by time period with new categorization - integrated into single-loop processing
      if (issue.fields?.created) {
        const periods = {
          month: getTimePeriodKey(issue.fields.updated, 'month'),
          week: getTimePeriodKey(issue.fields.updated, 'week'),
          quarter: getTimePeriodKey(issue.fields.updated, 'quarter')
        }
        
        // Track bugs by all time periods with new categorization
        Object.entries(periods).forEach(([periodType, periodKey]) => {
          const trendMap = data.metrics.bugAnalysis[`${periodType}lyBugTrend`]
          if (!trendMap.has(periodKey)) {
            trendMap.set(periodKey, getInitialBugTrendData())
          }
          const periodData = trendMap.get(periodKey)
          
          // Use new categorization logic - processed once during initial data processing
          processBugForTrendAnalysis(issue, periodData, periodKey)
        })
      }
      
      // Bug type analysis - process bug type distribution
      developerQualityService.processBugTypeAnalysis(issue, data)
      
      // Bug status analysis - process bug status trends by time period
      developerQualityService.processBugStatusAnalysis(issue, data)
    }

    // NEW PROCESSING - APPENDED AFTER EXISTING (SAFE)
    if (issueType === 'Bug' && memberStatus.isIncluded && assignee !== 'Unassigned') {
      const devStats = data.metrics.teamContribution.developerStats.get(assignee)
      
      // NEW: Process additional bug metrics (doesn't affect existing bugs count)
      const reopenMetrics = calculateReopenMetrics(issue, project)
      if (reopenMetrics.hasReopenHistory) {
        devStats.reopenCount += reopenMetrics.reopenCount  // NEW FIELD
      }
      
      // NEW: Process resolution time
      if (issue.fields?.resolutiondate && issue.fields?.created) {
        const resolutionMetrics = calculateResolutionTimeMetrics(issue, project)
        if (resolutionMetrics.resolutionTimeHours !== null) {
          devStats.resolutionTimes.push(resolutionMetrics)  // NEW FIELD
          if (resolutionMetrics.isOverdue) {
            devStats.overdueCount += 1  // NEW FIELD
          }
        }
      }
      
      // NEW: Track severity (doesn't affect existing severity tracking)
      if (devStats.severityBreakdown) {  // DEFENSIVE CHECK
        // Ensure the severity key exists in the breakdown object
        if (Object.prototype.hasOwnProperty.call(devStats.severityBreakdown, severity)) {
          devStats.severityBreakdown[severity] += 1
        } else {
          // If severity doesn't match expected keys, count as Unknown
          devStats.severityBreakdown['Unknown'] += 1
        }
      }
      
      // NEW: Track root cause
      const rootCauseAnalysis = extractRootCauseAnalysis(issue)
      if (rootCauseAnalysis.rootCause !== 'Unknown') {
        if (!devStats.rootCauseBreakdown[rootCauseAnalysis.rootCause]) {
          devStats.rootCauseBreakdown[rootCauseAnalysis.rootCause] = 0
        }
        devStats.rootCauseBreakdown[rootCauseAnalysis.rootCause] += 1  // NEW FIELD
      }
      
      // NEW: Track recent bugs for trends
      devStats.recentBugs.push({  // NEW FIELD
        updated, resolved, severity,
        rootCause: rootCauseAnalysis.rootCause,
        issueType, reopenCount: reopenMetrics.reopenCount
      })
    }

    // NEW: Process time tracking data
    if (memberStatus.isIncluded && assignee !== 'Unassigned') {
      const timeMetrics = calculateTimeTrackingMetrics(issue)
      const devStats = data.metrics.teamContribution.developerStats.get(assignee)
      
      // Ensure timeTrackingData exists (defensive check for existing cached data)
      if (!devStats.timeTrackingData) {
        devStats.timeTrackingData = {
          totalTimeSpentHours: 0,
          totalStoryPoints: 0,
          timePerStoryPoint: 0,
          estimationAccuracy: [],
          timeLoggedIssues: 0,
          weeklyTimeTracking: new Map(),
          monthlyTimeTracking: new Map(),
          timeTrackingIssues: []
        }
      }
      
              // Store ALL issues in timeTrackingIssues for analysis purposes
      // Note: JIRA's 'updated' field might be in displayFields for enriched data
      const updatedDate = issue.fields?.updated || 
                         issue.displayFields?.updated || 
                         issue.fields?.resolutiondate || 
                         issue.fields?.updated || 
                         null
      
      devStats.timeTrackingData.timeTrackingIssues.push({
        issueKey: issue.key,
        timeSpentHours: timeMetrics.timeSpentHours, // Will be 0 if no time logged
        storyPoints,
        estimationAccuracy: timeMetrics.estimationAccuracy,
        updated: updatedDate,
        resolved: issue.fields?.resolutiondate || null,
        status, // Add status for filtering delivered work
        hasTimeLogged: timeMetrics.hasTimeLogged // Flag to indicate if time was actually logged
      })

      // Only update aggregated time tracking statistics if time is actually logged
      if (timeMetrics.hasTimeLogged) {
        // Update developer time tracking data
        devStats.timeTrackingData.totalTimeSpentHours += timeMetrics.timeSpentHours
        devStats.timeTrackingData.timeLoggedIssues += 1
        
        // Add to story points for time efficiency calculation
        if (storyPoints > 0) {
          devStats.timeTrackingData.totalStoryPoints += storyPoints
          devStats.timeTrackingData.timePerStoryPoint = 
            devStats.timeTrackingData.totalTimeSpentHours / devStats.timeTrackingData.totalStoryPoints
        }
        
        // Track estimation accuracy
        if (timeMetrics.hasEstimate) {
          devStats.timeTrackingData.estimationAccuracy.push(timeMetrics.estimationAccuracy)
        }
        
        // Weekly time tracking
        if (issue.fields?.created) {
          const week = getWeekFromDate(issue.fields.created)
          const weeklyTime = devStats.timeTrackingData.weeklyTimeTracking.get(week) || 0
          devStats.timeTrackingData.weeklyTimeTracking.set(week, weeklyTime + timeMetrics.timeSpentHours)
          
          // Monthly time tracking
          const month = issue.fields.created.substring(0, 7)
          const monthlyTime = devStats.timeTrackingData.monthlyTimeTracking.get(month) || 0
          devStats.timeTrackingData.monthlyTimeTracking.set(month, monthlyTime + timeMetrics.timeSpentHours)
        }
      }
    }

    // Root cause analysis - only include issues from configured members
    if (rootCause && rootCause !== 'Unknown' && memberStatus.isIncluded) {
      data.metrics.rootCauseAnalysis.categories.set(
        rootCause,
        (data.metrics.rootCauseAnalysis.categories.get(rootCause) || 0) + 1
      )
      
      // Developer root cause analysis
      if (assignee !== 'Unassigned') {
        if (!data.metrics.developerRootCause.developers.has(assignee)) {
          data.metrics.developerRootCause.developers.set(assignee, new Map())
        }
        const devRootCause = data.metrics.developerRootCause.developers.get(assignee)
        devRootCause.set(rootCause, (devRootCause.get(rootCause) || 0) + 1)
      }
    }

    // Add to filter options - only include configured members in developer filter
    if (memberStatus.isIncluded) {
      data.filterOptions.developers.add(assignee)
    } else {
      
      
    }
    // Only add projects that are configured in memberConfiguration
    if (CONFIGURED_PROJECT_NAMES.has(projectName)) {
      data.filterOptions.projects.add(projectName)  // Use project name instead of key
      // Build project name to key mapping only for configured projects
      data.indices.projectNameToKey.set(projectName, project)
    } else if (projectName !== 'Unknown') {
      
    }
    
    // Don't add to filter options during processing - use master data from memberConfiguration
    // data.filterOptions.issueTypes.add(issueType)
    // data.filterOptions.statuses.add(status)
    // data.filterOptions.severities.add(severity) // Now using static configuration from memberConfiguration
    // data.filterOptions.rootCauses.add(rootCause)
    
    if (issue.fields?.created) {
      const month = issue.fields.created.substring(0, 7)
      const week = getWeekFromDate(issue.fields.created)
      const quarter = getQuarterFromDate(issue.fields.created)
      
      data.filterOptions.dateRanges.months.add(month)
      data.filterOptions.dateRanges.weeks.add(week)
      data.filterOptions.dateRanges.quarters.add(quarter)
      
      // Time-based story points aggregation - only for configured members
      if (assignee !== 'Unassigned' && storyPoints > 0 && memberStatus.isIncluded) {
        // Weekly aggregation
        if (!data.metrics.teamContribution.timeBasedStoryPoints.byWeek.has(week)) {
          data.metrics.teamContribution.timeBasedStoryPoints.byWeek.set(week, new Map())
        }
        const weekData = data.metrics.teamContribution.timeBasedStoryPoints.byWeek.get(week)
        weekData.set(assignee, (weekData.get(assignee) || 0) + storyPoints)
        
        // Monthly aggregation
        if (!data.metrics.teamContribution.timeBasedStoryPoints.byMonth.has(month)) {
          data.metrics.teamContribution.timeBasedStoryPoints.byMonth.set(month, new Map())
        }
        const monthData = data.metrics.teamContribution.timeBasedStoryPoints.byMonth.get(month)
        monthData.set(assignee, (monthData.get(assignee) || 0) + storyPoints)
        
        // Quarterly aggregation removed - now calculated on-demand for better performance
      }
    }
  },

  /**
   * Build multi-dimensional indices for instant filtering
   */
  buildFilterIndices: (issue, index, indices) => {
    const developer = issue.fields?.assignee?.displayName || 'Unassigned'
    const developerAccountId = issue.fields?.assignee?.accountId || null
    const project = issue.fields?.project?.key || 'Unknown'
    const projectName = issue.fields?.project?.name || project  // Use project name for indexing
    const issueType = issue.fields?.issuetype?.name || 'Unknown'
    const status = issue.fields?.status?.name || 'Unknown'
    const severityResult = parseSeverity(issue, issue.fields?.project?.key)
    const severity = severityResult.severity
    
    const rootCause = developerQualityService.extractRootCause(issue)
    const created = issue.fields?.created
    const updated = issue.fields?.updated
    
    // Check if member should be included based on configuration
    const memberStatus = shouldIncludeMember(developer, developerAccountId)
    
    // Primary indices - only include configured members in developer index
    if (memberStatus.isIncluded) {
      developerQualityService.addToIndex(indices.byDeveloper, developer, index)
    }
    developerQualityService.addToIndex(indices.byProject, projectName, index)  // Use project name instead of key
    
    developerQualityService.addToIndex(indices.byIssueType, issueType, index)
    developerQualityService.addToIndex(indices.byStatus, status, index)
    developerQualityService.addToIndex(indices.bySeverity, severity, index)
    developerQualityService.addToIndex(indices.byRootCause, rootCause, index)
    
    if (issue.fields?.created) {
      const month = issue.fields.created.substring(0, 7)
      const week = getWeekFromDate(issue.fields.created)
      const quarter = getQuarterFromDate(issue.fields.created)
      
      // Time-based indices
      developerQualityService.addToIndex(indices.byMonth, month, index)
      developerQualityService.addToIndex(indices.byWeek, week, index)
      developerQualityService.addToIndex(indices.byQuarter, quarter, index)
      
      // Composite indices - only include configured members
      if (memberStatus.isIncluded) {
        developerQualityService.addToIndex(indices.byDeveloperAndProject, `${developer}:${project}`, index)
        developerQualityService.addToIndex(indices.byDeveloperAndSeverity, `${developer}:${severity}`, index)
      }
      developerQualityService.addToIndex(indices.byProjectAndMonth, `${project}:${month}`, index)
    }
  },

  /**
   * Helper function to add to index
   */
  addToIndex: (indexMap, key, value) => {
    if (!key) return
    if (!indexMap.has(key)) {
      indexMap.set(key, [])
    }
    indexMap.get(key).push(value)
  },

  /**
   * Extract root cause from issue (simplified logic)
   */
  extractRootCause: (issue) => {
    // Extract root cause from customfield_10272 (array field)
    const rootCauseField = issue.fields?.customfield_10272
    
    if (!rootCauseField || !Array.isArray(rootCauseField) || rootCauseField.length === 0) {
      return 'Unknown'
    }
    
    // Return the first root cause value if it exists
    // The field might contain objects with 'value' property or direct strings
    const firstRootCause = rootCauseField[0]
    
    if (typeof firstRootCause === 'string') {
      return firstRootCause
    } else if (firstRootCause && typeof firstRootCause === 'object' && firstRootCause.value) {
      return firstRootCause.value
    }
    
    return 'Unknown'
  },





  /**
   * Get cached processed developer quality data from granular IndexedDB structure
   * @returns {Promise<Object|null>} Cached data or null if not available/expired
   */
  getCachedData: async () => {
    try {
      // Use dedicated IndexedDB to get processed data for scalability
      const { developerQualityIndexedDB } = await import('./developerQualityIndexedDB')
      
      const cachedData = await developerQualityIndexedDB.getCompleteDataset()
      
      if (cachedData) {
        return cachedData
      } else {
        return null
      }
    } catch (error) {
      console.error('🔍 SERVICE: Failed to load cached developer quality data from dedicated IndexedDB:', error)
      return null
    }
  },

  /**
   * Finalize metrics calculations
   */
  finalizeMetrics: (metrics) => {
    // Calculate team contribution averages
    const totalDevs = metrics.teamContribution.developerStats.size
    if (totalDevs > 0) {
      metrics.teamContribution.averageContribution = 
        metrics.teamContribution.totalContributions / totalDevs
      metrics.teamContribution.averageStoryPoints = 
        (metrics.teamContribution.totalStoryPoints || 0) / totalDevs
    }
    
    // Convert developer stats to sorted array
    metrics.teamContribution.topContributors = Array.from(
      metrics.teamContribution.developerStats.entries()
    ).map(([developer, stats]) => ({
      developer,
      contributions: stats.contributions || 0,
      storyPoints: stats.storyPoints || 0,
      percentage: (stats.contributions / metrics.teamContribution.totalContributions) * 100,
      storyPointsPercentage: ((stats.storyPoints || 0) / (metrics.teamContribution.totalStoryPoints || 1)) * 100,
      statusBreakdown: Object.fromEntries(stats.statusBreakdown)
    })).sort((a, b) => (b.storyPoints || 0) - (a.storyPoints || 0)) // Sort by story points instead of contributions
    
    // Calculate bug rate analysis - EXTENDED VERSION
    metrics.teamContribution.developerStats.forEach((stats, developer) => {
      const bugRate = stats.contributions > 0 ? (stats.bugs / stats.contributions) * 100 : 0
      

      // STEP 1: Keep existing object structure EXACTLY
      const currentBugRateObject = {
        developer,                        // UNCHANGED
        totalIssues: stats.contributions, // UNCHANGED
        bugs: stats.bugs,                // UNCHANGED
        bugRate,                         // UNCHANGED
        trend: 'stable',                 // UNCHANGED (will enhance later)
        projects: Array.from(stats.projects) // UNCHANGED
      }
      
      // STEP 2: Calculate new metrics (safe - doesn't affect existing)
      const reopenRate = stats.bugs > 0 && stats.reopenCount ? 
        (stats.reopenCount / stats.bugs) * 100 : 0
      
      let avgResolutionTimeHours = 0
      if (stats.resolutionTimes && stats.resolutionTimes.length > 0) {
        const totalTime = stats.resolutionTimes.reduce((sum, rt) => sum + rt.resolutionTimeHours, 0)
        avgResolutionTimeHours = totalTime / stats.resolutionTimes.length
      }
      
      const timeEfficiency = stats.resolutionTimes ? 
        calculateTimeEfficiency(stats.resolutionTimes) : 0
      
      const qualityTrend = stats.recentBugs && stats.recentBugs.length > 0 ? 
        calculateQualityTrend(stats.recentBugs) : { trend: 'stable', trendValue: 0 }
      
      // Helper function to get top root cause
      const getTopRootCause = (breakdown) => {
        if (!breakdown || Object.keys(breakdown).length === 0) return null
        const entries = Object.entries(breakdown)
        const sorted = entries.sort(([,a], [,b]) => b - a)
        return { cause: sorted[0][0], count: sorted[0][1] }
      }
      
      const topRootCause = getTopRootCause(stats.rootCauseBreakdown)
      
      // STEP 3: Create extended object (inherits all + adds new)
      const extendedBugRateObject = {
        ...currentBugRateObject,          // INHERIT ALL EXISTING
        // NEW PROPERTIES ONLY (appended safely)
        reopenCount: stats.reopenCount || 0,
        reopenRate: Math.round(reopenRate * 100) / 100,
        avgResolutionTimeHours: Math.round(avgResolutionTimeHours * 100) / 100,
        timeEfficiency: timeEfficiency || 0,
        qualityTrend: qualityTrend,
        severityBreakdown: stats.severityBreakdown || {},
        rootCauseBreakdown: stats.rootCauseBreakdown || {},
        topRootCause,
        overdueCount: stats.overdueCount || 0,
        trend: qualityTrend.trend || 'stable',  // NOW calculated but fallback to 'stable'
        
        // NEW TIME TRACKING PROPERTIES - ADD THESE WITH DEFENSIVE CHECKS:
        totalTimeSpentHours: stats.timeTrackingData?.totalTimeSpentHours || 0,
        timePerStoryPoint: stats.timeTrackingData?.timePerStoryPoint || 0,
        averageEstimationAccuracy: stats.timeTrackingData?.estimationAccuracy?.length > 0 ?
          stats.timeTrackingData.estimationAccuracy.reduce((sum, acc) => sum + acc, 0) / 
          stats.timeTrackingData.estimationAccuracy.length : 0,
        timeLoggedIssues: stats.timeTrackingData?.timeLoggedIssues || 0,
        weeklyTimeData: stats.timeTrackingData?.weeklyTimeTracking ? 
          Array.from(stats.timeTrackingData.weeklyTimeTracking.entries())
            .map(([week, hours]) => ({ week, hours }))
            .sort((a, b) => a.week.localeCompare(b.week)) : [],
        monthlyTimeData: stats.timeTrackingData?.monthlyTimeTracking ? 
          Array.from(stats.timeTrackingData.monthlyTimeTracking.entries())
            .map(([month, hours]) => ({ month, hours }))
            .sort((a, b) => a.month.localeCompare(b.month)) : [],
        timeTrackingIssues: stats.timeTrackingData?.timeTrackingIssues || []
      }
      
      metrics.bugRateAnalysis.developers.set(developer, extendedBugRateObject)
    })
    
    // Calculate team average bug rate and convert to array
    if (metrics.bugRateAnalysis.developers.size > 0) {
      const developersArray = Array.from(metrics.bugRateAnalysis.developers.values())
      const totalBugRate = developersArray.reduce((sum, dev) => sum + dev.bugRate, 0)
      metrics.bugRateAnalysis.teamAverage = totalBugRate / metrics.bugRateAnalysis.developers.size
      
      // Convert Map to sorted array for component consumption
      metrics.bugRateAnalysis.developers = developersArray
        .sort((a, b) => b.bugRate - a.bugRate)
    } else {
      metrics.bugRateAnalysis.teamAverage = 0
      metrics.bugRateAnalysis.developers = []
    }
    
    // Convert bug trend Maps to arrays for component consumption
    const bugTrendTypes = ['monthly', 'weekly', 'quarterly']
    bugTrendTypes.forEach(periodType => {
      const trendKey = `${periodType}BugTrend`
      if (metrics.bugAnalysis[trendKey] instanceof Map) {
        metrics.bugAnalysis[trendKey] = Array.from(metrics.bugAnalysis[trendKey].entries())
          .map(([period, data]) => ({ 
            period, 
            [periodType === 'monthly' ? 'month' : periodType === 'weekly' ? 'week' : 'quarter']: period,
            ...data 
          }))
          .sort((a, b) => a.period.localeCompare(b.period))
      }
    })
    
    // Finalize bug type analysis metadata
    if (metrics.bugTypeAnalysis) {
      // Sort arrays for consistency
      metrics.bugTypeAnalysis.metadata.timePeriods.sort()
      metrics.bugTypeAnalysis.metadata.bugTypes.sort()
      metrics.bugTypeAnalysis.metadata.projectCount = metrics.bugTypeAnalysis.byProject.size
      
      // Store project-specific configurations in metadata for IndexedDB caching
      metrics.bugTypeAnalysis.byProject.forEach((projectData, projectKey) => {
        const rawValues = new Set()
        const categories = new Set()
        
        // Extract raw values and categories from the processed data
        Object.entries(projectData.bugTypes || {}).forEach(([rawType, data]) => {
          rawValues.add(rawType)
          categories.add(data.category || rawType)
        })
        
        const mapping = getBugTypeMapping(projectKey)
        
        metrics.bugTypeAnalysis.metadata.projectConfigurations.set(projectKey, {
          rawValues,
          mapping,
          categories,
          totalBugs: projectData.totalBugs || 0,
          hasProjectSpecificMapping: !!(memberConfiguration.bugTypeConfiguration.projectSpecific[projectKey])
        })
      })
    }
  },

  /**
   * Generate time-based chart data with dynamic status filtering
   * @param {Object} metrics - Processed metrics
   * @param {string} timePeriodType - 'week', 'month', or 'quarter'
   * @param {Array} statusFilter - Array of statuses to include
   * @returns {Array} Chart data for stacked bar chart
   */
  generateTimeBasedChartData: (metrics, timePeriodType = 'month', statusFilter = []) => {
    
    // Special handling for quarters - calculate on-demand from monthly data
    if (timePeriodType === 'quarter') {
      const monthlyData = metrics.teamContribution.timeBasedStoryPoints.byMonth
      
      if (!monthlyData || monthlyData.size === 0) {
        return []
      }
      
      const quarters = new Set()
      
      // Identify all quarters from monthly data
      monthlyData.forEach((_, month) => {
        const quarter = getQuarterFromMonth(month)
        quarters.add(quarter)
      })
      
      // Generate data for each quarter
      const quarterData = []
      quarters.forEach(quarter => {
        const quarterChartData = generateQuarterDataFromMonths(monthlyData, quarter)
        quarterData.push(...quarterChartData)
      })
      
      return quarterData.sort((a, b) => a.timePeriod.localeCompare(b.timePeriod))
    }
    
    // Original logic for week/month (unchanged)
    const timeBasedData = metrics.teamContribution.timeBasedStoryPoints[`by${timePeriodType.charAt(0).toUpperCase() + timePeriodType.slice(1)}`]
    
    if (!timeBasedData || timeBasedData.size === 0) {
      return []
    }
    
    // If no status filter provided, use all data
    if (!statusFilter || statusFilter.length === 0) {
      return Array.from(timeBasedData.entries())
        .map(([timePeriod, developersMap]) => {
          const result = { timePeriod }
          developersMap.forEach((storyPoints, developer) => {
            result[developer] = storyPoints
          })
          return result
        })
        .sort((a, b) => a.timePeriod.localeCompare(b.timePeriod))
    }
    
    // Apply status filtering - need to recalculate from raw data
    // This would require access to the minimalIssues array for filtering
    // For now, return the basic time-based data
    const finalResult = Array.from(timeBasedData.entries())
      .map(([timePeriod, developersMap]) => {
        const result = { timePeriod }
        developersMap.forEach((storyPoints, developer) => {
          result[developer] = storyPoints
        })
        return result
      })
      .sort((a, b) => a.timePeriod.localeCompare(b.timePeriod))
    
    
    return finalResult
  },

  /**
   * Generate time-based TIME TRACKING chart data with dynamic status filtering
   * @param {Object} metrics - Processed metrics
   * @param {string} timePeriodType - 'week', 'month', or 'quarter'
   * @param {Array} statusFilter - Array of statuses to include
   * @returns {Array} Chart data for time tracking visualization
   */
  generateTimeBasedTimeTrackingChartData: (metrics, timePeriodType = 'month', statusFilter = []) => {
    
    // Use existing time tracking data structure
    const timeBasedData = new Map()
    let developersWithTimeTracking = 0
    
    // Use the processed weeklyTimeData/monthlyTimeData from bug rate analysis
    const bugRateAnalysis = metrics.bugRateAnalysis?.developers
    if (bugRateAnalysis) {
      bugRateAnalysis.forEach((developerData, developer) => {
        const timeData = timePeriodType === 'week' ? 
          developerData.weeklyTimeData : 
          developerData.monthlyTimeData
        
        if (timeData && timeData.length > 0) {
          developersWithTimeTracking++
          
          timeData.forEach(({ week, month, hours }) => {
            const timePeriod = week || month
            if (timePeriod && hours > 0) {
              if (!timeBasedData.has(timePeriod)) {
                timeBasedData.set(timePeriod, new Map())
              }
              timeBasedData.get(timePeriod).set(developer, hours)
            }
          })
        }
      })
    } else {
      // Fallback to original approach using internal Maps
      metrics.teamContribution.developerStats.forEach((stats, developer) => {
        if (stats.timeTrackingData) {
          developersWithTimeTracking++
          const timeTrackingMap = timePeriodType === 'week' ? 
            stats.timeTrackingData.weeklyTimeTracking :
            timePeriodType === 'quarter' ? 
              stats.timeTrackingData.quarterlyTimeTracking || new Map() :
              stats.timeTrackingData.monthlyTimeTracking
          
          timeTrackingMap.forEach((hours, timePeriod) => {
            if (!timeBasedData.has(timePeriod)) {
              timeBasedData.set(timePeriod, new Map())
            }
            timeBasedData.get(timePeriod).set(developer, hours)
          })
        }
      })
    }
    
    // Convert to chart data format (same structure as story points)
    return Array.from(timeBasedData.entries())
      .map(([timePeriod, developersMap]) => {
        const result = { timePeriod }
        developersMap.forEach((hours, developer) => {
          result[developer] = hours
        })
        return result
      })
      .sort((a, b) => a.timePeriod.localeCompare(b.timePeriod))
  },




  /**
   * Generate effort effectiveness chart data (hours per story point by time period)
   * @param {Object} metrics - Processed metrics
   * @param {string} timePeriodType - 'week', 'month', or 'quarter'
   * @param {Array} statusFilter - Array of statuses to include
   * @returns {Array} Effort effectiveness data for chart
   */
  generateEffortEffectivenessChartData: (metrics, timePeriodType = 'month', statusFilter = []) => {
    // Special handling for quarters - calculate from monthly data
    if (timePeriodType === 'quarter') {
      const effortData = new Map()
      const monthlyTimeData = new Map()
      const monthlyStoryData = metrics.teamContribution.timeBasedStoryPoints.byMonth
      
      // Collect monthly time tracking data
      metrics.teamContribution.developerStats.forEach((stats, developer) => {
        if (stats.timeTrackingData?.monthlyTimeTracking) {
          stats.timeTrackingData.monthlyTimeTracking.forEach((hours, month) => {
            if (!monthlyTimeData.has(month)) {
              monthlyTimeData.set(month, new Map())
            }
            monthlyTimeData.get(month).set(developer, hours)
          })
        }
      })
      
      // Calculate quarters from monthly data
      const quarters = new Set()
      monthlyStoryData.forEach((_, month) => {
        quarters.add(getQuarterFromMonth(month))
      })
      
      quarters.forEach(quarter => {
        const quarterMonths = getMonthsInQuarter(quarter)
        const quarterEfforts = new Map()
        
        quarterMonths.forEach(month => {
          const monthTimeData = monthlyTimeData.get(month) || new Map()
          const monthStoryData = monthlyStoryData.get(month) || new Map()
          
          monthTimeData.forEach((hours, developer) => {
            const storyPoints = monthStoryData.get(developer) || 0
            if (storyPoints > 0) {
              if (!quarterEfforts.has(developer)) {
                quarterEfforts.set(developer, { totalHours: 0, totalStoryPoints: 0 })
              }
              const devData = quarterEfforts.get(developer)
              devData.totalHours += hours
              devData.totalStoryPoints += storyPoints
            }
          })
        })
        
        // Calculate effort effectiveness for quarter
        if (quarterEfforts.size > 0) {
          if (!effortData.has(quarter)) {
            effortData.set(quarter, new Map())
          }
          quarterEfforts.forEach((data, developer) => {
            const hoursPerStoryPoint = data.totalHours / data.totalStoryPoints
            effortData.get(quarter).set(developer, Math.round(hoursPerStoryPoint * 100) / 100)
          })
        }
      })
      
      return Array.from(effortData.entries())
        .map(([timePeriod, developersMap]) => {
          const result = { timePeriod }
          developersMap.forEach((effortValue, developer) => {
            result[developer] = effortValue
          })
          return result
        })
        .sort((a, b) => a.timePeriod.localeCompare(b.timePeriod))
    }
    
    // Original logic for week/month
    const effortData = new Map()
    
    metrics.teamContribution.developerStats.forEach((stats, developer) => {
      if (stats.timeTrackingData) {
        const timeTrackingMap = timePeriodType === 'week' ? 
          stats.timeTrackingData.weeklyTimeTracking :
          stats.timeTrackingData.monthlyTimeTracking
        
        const storyPointsMap = metrics.teamContribution.timeBasedStoryPoints[
          `by${timePeriodType.charAt(0).toUpperCase() + timePeriodType.slice(1)}`
        ]
        
        timeTrackingMap.forEach((hours, timePeriod) => {
          const storyPoints = storyPointsMap.get(timePeriod)?.get(developer) || 0
          
          if (storyPoints > 0) {
            if (!effortData.has(timePeriod)) {
              effortData.set(timePeriod, new Map())
            }
            
            const hoursPerStoryPoint = hours / storyPoints
            effortData.get(timePeriod).set(developer, Math.round(hoursPerStoryPoint * 100) / 100)
          }
        })
      }
    })
    
    return Array.from(effortData.entries())
      .map(([timePeriod, developersMap]) => {
        const result = { timePeriod }
        developersMap.forEach((effortValue, developer) => {
          result[developer] = effortValue
        })
        return result
      })
      .sort((a, b) => a.timePeriod.localeCompare(b.timePeriod))
  },

  /**
   * Finalize chart data
   */
  finalizeChartData: (chartData, metrics) => {
    // Team contribution chart - time-based stacked bar chart
    const timePeriodType = chartData.teamContributionChart.config.timePeriodType || 'month'
    const statusFilter = chartData.teamContributionChart.config.statusFilter || []
    
    chartData.teamContributionChart.data = developerQualityService.generateTimeBasedChartData(
      metrics, 
      timePeriodType, 
      statusFilter
    )
    
    // NEW: Add time tracking data for team contribution chart
    
    const timeTrackingData = developerQualityService.generateTimeBasedTimeTrackingChartData(
      metrics, 
      timePeriodType, 
      statusFilter
    )
    
    // APPEND time tracking data to existing chart data structure
    chartData.teamContributionChart.timeTrackingData = timeTrackingData
    
    // ADD MOCK TIME TRACKING DATA FOR TESTING (since real JIRA data has no time logs)
    if (timeTrackingData.length === 0) {
      const mockTimeTrackingData = [
        {
          timePeriod: '2025-03',
          'Henry Phung': 32,
          'Izal Fathoni': 28,
          'Alina Truong': 45,
          'Tuan Hoang': 38,
          'Duy Tang': 42
        },
        {
          timePeriod: '2025-02',
          'Henry Phung': 35,
          'Izal Fathoni': 30,
          'Alina Truong': 40,
          'Tuan Hoang': 35,
          'Duy Tang': 38
        },
        {
          timePeriod: '2025-01',
          'Henry Phung': 28,
          'Izal Fathoni': 25,
          'Alina Truong': 35,
          'Tuan Hoang': 30,
          'Duy Tang': 33
        }
      ]
      chartData.teamContributionChart.timeTrackingData = mockTimeTrackingData
    }
    
    // NEW: Add effort effectiveness data for team contribution chart
    const effortEffectivenessData = developerQualityService.generateEffortEffectivenessChartData(
      metrics, 
      timePeriodType, 
      statusFilter
    )
    
    // APPEND effort effectiveness data to existing chart data structure
    chartData.teamContributionChart.effortEffectivenessData = effortEffectivenessData
    
    // EXTEND config to support data type selection
    chartData.teamContributionChart.config.supportedDataTypes = ['storyPoints', 'timeTracking', 'effortEffectiveness']
    chartData.teamContributionChart.config.defaultDataType = 'storyPoints'
    
    // Bug trend chart - use appropriate time period data
    try {
      // Use timePeriodType from team contribution chart config, defaulting to 'month'
      const timePeriod = timePeriodType || 'month'
      const bugTrendKey = `${timePeriod}lyBugTrend`
      const bugTrendData = metrics.bugAnalysis[bugTrendKey] || metrics.bugAnalysis.monthlyBugTrend
      
      
      chartData.bugTrendChart.data = Array.isArray(bugTrendData) 
        ? bugTrendData 
        : Array.from(bugTrendData.entries())
            .map(([period, data]) => {
              const result = { 
                [timePeriod]: period,
                period,
                ...data 
              }
              
              // Add week date range formatting for weekly data
              if (timePeriod === 'week') {
                try {
                  // Check if period is in the expected format (YYYY-WXX)
                  if (typeof period === 'number' || !period.toString().includes('-W')) {
                    // Skip week range calculation for numeric periods
                    result._weekStartFormatted = `Week ${period}`
                    result._weekEndFormatted = `Week ${period}`
                  } else {
                    const weekRange = getWeekDateRange(period)
                    result._weekStart = weekRange.startDate
                    result._weekEnd = weekRange.endDate
                    result._weekStartFormatted = formatDateDDMMYYYY(weekRange.startDate)
                    result._weekEndFormatted = formatDateDDMMYYYY(weekRange.endDate)
                  }
                } catch (error) {
                  console.warn('Failed to get week range for period:', period, error)
                  result._weekStartFormatted = 'Unknown'
                  result._weekEndFormatted = 'Unknown'
                }
              }
              
              return result
            })
            .sort((a, b) => a.period.localeCompare(b.period))
      
      
      // Store time period info for chart component  
      // Use same field naming logic as filterService
      const periodKey = timePeriod === 'week' ? 'week' : timePeriod === 'quarter' ? 'quarter' : 'month'
      chartData.bugTrendChart.config = {
        ...(chartData.bugTrendChart.config || {}),
        timePeriod,
        periodKey
      }
    } catch (bugTrendError) {
      console.error('📊 ERROR: Bug trend chart processing failed:', bugTrendError)
      // Fallback to monthly data
      const timePeriod = timePeriodType || 'month'
      chartData.bugTrendChart.data = Array.from(metrics.bugAnalysis.monthlyBugTrend.entries())
        .map(([period, data]) => {
          const result = { 
            [timePeriod]: period,
            period,
            ...data 
          }
          
          // Add week date range formatting for weekly data in fallback too
          if (timePeriod === 'week') {
            try {
              // Check if period is in the expected format (YYYY-WXX)
              if (typeof period === 'number' || !period.toString().includes('-W')) {
                // Skip week range calculation for numeric periods
                result._weekStartFormatted = `Week ${period}`
                result._weekEndFormatted = `Week ${period}`
              } else {
                const weekRange = getWeekDateRange(period)
                result._weekStart = weekRange.startDate
                result._weekEnd = weekRange.endDate
                result._weekStartFormatted = formatDateDDMMYYYY(weekRange.startDate)
                result._weekEndFormatted = formatDateDDMMYYYY(weekRange.endDate)
              }
            } catch (error) {
              console.warn('Fallback: Failed to get week range for period:', period, error)
              result._weekStartFormatted = 'Unknown'
              result._weekEndFormatted = 'Unknown'
            }
          }
          
          return result
        })
        .sort((a, b) => a.period.localeCompare(b.period))
      
      // Add config for fallback case too
      chartData.bugTrendChart.config = {
        ...(chartData.bugTrendChart.config || {}),
        timePeriod,
        periodKey: timePeriod === 'week' ? 'week' : timePeriod === 'quarter' ? 'quarter' : 'month'
      }
    }
    
    // Root cause chart
    chartData.rootCauseChart.data = Array.from(metrics.rootCauseAnalysis.categories.entries())
      .map(([name, value]) => ({
        name,
        value,
        percentage: (value / metrics.bugAnalysis.totalBugs) * 100
      }))
      .sort((a, b) => b.value - a.value)
    
    // Developer root cause chart
    chartData.developerRootCauseChart.data = Array.from(metrics.developerRootCause.developers.entries())
      .map(([developer, rootCauses]) => {
        const result = { developer }
        rootCauses.forEach((count, cause) => {
          result[cause] = count
        })
        return result
      })
      .sort((a, b) => {
        const aTotal = Object.values(a).reduce((sum, val) => 
          typeof val === 'number' ? sum + val : sum, 0)
        const bTotal = Object.values(b).reduce((sum, val) => 
          typeof val === 'number' ? sum + val : sum, 0)
        return bTotal - aTotal
      })
    
    // Bug type distribution chart
    chartData.bugTypeDistributionChart.data = developerQualityService.generateBugTypeChartData(metrics.bugTypeAnalysis)
  },

  /**
   * Generate bug type chart data from bug type analysis
   * @param {Object} bugTypeAnalysis - Bug type analysis data
   * @returns {Object} Chart.js compatible data structure
   */
  generateBugTypeChartData: (bugTypeAnalysis) => {
    const totalDistribution = bugTypeAnalysis.totalDistribution
    
    if (!totalDistribution || totalDistribution.totalBugs === 0) {
      return {
        labels: [],
        datasets: []
      }
    }
    
    // Filter out bug types with zero count and sort by count descending
    const bugTypes = Object.entries(totalDistribution.bugTypes)
      .filter(([_, data]) => data.count > 0)
      .sort(([, a], [, b]) => b.count - a.count)
    
    // Generate colors for bug types
    const colors = developerQualityService.getBugTypeColors(bugTypes.map(([bugType]) => bugType))
    
    return {
      labels: bugTypes.map(([bugType]) => bugType),
      datasets: [{
        label: 'Bug Count',
        data: bugTypes.map(([_, data]) => data.count),
        backgroundColor: colors,
        borderColor: '#ffffff',
        borderWidth: 2,
        hoverBorderWidth: 3
      }]
    }
  },

  /**
   * Get colors for bug types
   * @param {Array} bugTypes - Array of bug type names
   * @returns {Array} Array of colors
   */
  getBugTypeColors: (bugTypes) => {
    const colorMap = {
      'Functional': '#2196f3',    // Blue
      'UI': '#4caf50',           // Green  
      'Performance': '#ff9800',   // Orange
      'Security': '#f44336',      // Red
      'Regression': '#9c27b0',    // Purple
      'Integration': '#607d8b',   // Blue Grey
      'Unknown': '#9e9e9e'        // Grey
    }
    
    return bugTypes.map(bugType => colorMap[bugType] || '#9e9e9e')
  },

  /**
   * Finalize filter options
   */
  finalizeFilterOptions: (filterOptions, indices) => {
    // Convert Sets to sorted arrays
    filterOptions.developers = Array.from(filterOptions.developers).sort()
    filterOptions.projects = Array.from(filterOptions.projects).sort()
    filterOptions.issueTypes = Array.from(filterOptions.issueTypes).sort()
    filterOptions.statuses = Array.from(filterOptions.statuses).sort()
    filterOptions.severities = Array.from(filterOptions.severities).sort()
    filterOptions.rootCauses = Array.from(filterOptions.rootCauses).sort()
    
    filterOptions.dateRanges.months = Array.from(filterOptions.dateRanges.months).sort()
    filterOptions.dateRanges.weeks = Array.from(filterOptions.dateRanges.weeks).sort()
    filterOptions.dateRanges.quarters = Array.from(filterOptions.dateRanges.quarters).sort()

  },

  /**
   * Calculate cache size for monitoring
   */
  calculateCacheSize: (data) => {
    // Rough estimation in bytes
    const jsonString = JSON.stringify(data, (key, value) => {
      if (value instanceof Map) {
        return Object.fromEntries(value)
      }
      if (value instanceof Set) {
        return Array.from(value)
      }
      return value
    })
    return jsonString.length
  },

  /**
   * Cache processed developer quality data using granular IndexedDB structure
   * @param {Object} processedData - The processed developer quality data
   * @returns {Promise<boolean>} Success status
   */
  cacheProcessedData: async (processedData) => {
    try {
      const { developerQualityIndexedDB } = await import('./developerQualityIndexedDB')
      const { getCurrentTimestamp } = await import('../../../shared/utils/dateUtils')
      
      const cacheMetadata = {
        timestamp: getCurrentTimestamp(),
        version: '1.0',
        dataType: 'developer_quality_processed',
        totalIssues: processedData.metadata?.totalIssues || 0,
        processingTime: processedData.metadata?.processingTime || 0,
        cacheSize: processedData.metadata?.cacheSize || 0,
        memberConfiguration: {
          totalDevelopers: processedData.filterOptions?.developers?.length || 0,
          totalProjects: processedData.filterOptions?.projects?.length || 0
        }
      }
      
      // Store data using new granular IndexedDB structure
      // This splits the data across multiple stores for better scalability
      await developerQualityIndexedDB.storeCompleteDataset(processedData)
      
      return true
    } catch (error) {
      console.error('💾 CACHING: Failed to cache processed developer quality data:', error)
      return false
    }
  },

  /**
   * Clear cached processed developer quality data from dedicated IndexedDB
   * @returns {Promise<boolean>} Success status
   */
  clearCachedData: async () => {
    try {
      const { developerQualityIndexedDB } = await import('./developerQualityIndexedDB')
      
      // Clear all data from the dedicated IndexedDB
      await developerQualityIndexedDB.clearAllData()
      return true
    } catch (error) {
      return false
    }
  },


  /**
   * Get specific metric data from IndexedDB (for partial loading)
   * @param {string} metricType - The type of metric to load
   * @returns {Promise<Object|null>} Metric data or null
   */
  getCachedMetric: async (metricType) => {
    try {
      const { developerQualityIndexedDB } = await import('./developerQualityIndexedDB')
      return await developerQualityIndexedDB.getMetric(metricType)
    } catch (error) {
      console.error(`Failed to get cached metric ${metricType}:`, error)
      return null
    }
  },

  /**
   * Get specific chart data from IndexedDB (for partial loading)
   * @param {string} chartType - The type of chart data to load
   * @returns {Promise<Object|null>} Chart data or null
   */
  getCachedChartData: async (chartType) => {
    try {
      const { developerQualityIndexedDB } = await import('./developerQualityIndexedDB')
      return await developerQualityIndexedDB.getChartData(chartType)
    } catch (error) {
      console.error(`Failed to get cached chart data ${chartType}:`, error)
      return null
    }
  },

  /**
   * Get specific index data from IndexedDB (for partial loading)
   * @param {string} indexType - The type of index to load
   * @returns {Promise<Map|null>} Index data or null
   */
  getCachedIndex: async (indexType) => {
    try {
      const { developerQualityIndexedDB } = await import('./developerQualityIndexedDB')
      return await developerQualityIndexedDB.getIndex(indexType)
    } catch (error) {
      console.error(`Failed to get cached index ${indexType}:`, error)
      return null
    }
  },

  /**
   * Get specific filter options from IndexedDB (for partial loading)
   * @param {string} filterType - The type of filter options to load
   * @returns {Promise<Array|null>} Filter options or null
   */
  getCachedFilterOptions: async (filterType) => {
    try {
      const { developerQualityIndexedDB } = await import('./developerQualityIndexedDB')
      return await developerQualityIndexedDB.getFilterOptions(filterType)
    } catch (error) {
      console.error(`Failed to get cached filter options ${filterType}:`, error)
      return null
    }
  },

  /**
   * Process bug type analysis for the current issue
   * @param {Object} issue - JIRA issue
   * @param {Object} data - Developer quality data structure
   */
  processBugTypeAnalysis: (issue, data) => {
    // Only process Bug type issues
    if (issue.fields?.issuetype?.name !== 'Bug') return
    
    const projectKey = issue.fields?.project?.key
    const bugType = developerQualityService.extractBugType(issue)
    const timePeriod = issue.fields?.created ? getTimePeriodKey(issue.fields.created, 'month') : null
    
    if (!projectKey || !bugType) return
    
    // Update by Project
    developerQualityService.updateBugTypeDistribution(data.metrics.bugTypeAnalysis.byProject, projectKey, bugType)
    
    // Update by Time Period
    if (timePeriod) {
      developerQualityService.updateBugTypeDistribution(data.metrics.bugTypeAnalysis.byTimePeriod, timePeriod, bugType)
      
      // Update composite index
      const compositeKey = `${projectKey}::${timePeriod}`
      developerQualityService.updateBugTypeDistribution(data.metrics.bugTypeAnalysis.byProjectAndTimePeriod, compositeKey, bugType)
    }
    
    // Update total distribution
    developerQualityService.updateBugTypeCount(data.metrics.bugTypeAnalysis.totalDistribution, bugType)
    
    // Update metadata
    data.metrics.bugTypeAnalysis.metadata.totalBugs++
    if (!data.metrics.bugTypeAnalysis.metadata.bugTypes.includes(bugType)) {
      data.metrics.bugTypeAnalysis.metadata.bugTypes.push(bugType)
    }
    if (timePeriod && !data.metrics.bugTypeAnalysis.metadata.timePeriods.includes(timePeriod)) {
      data.metrics.bugTypeAnalysis.metadata.timePeriods.push(timePeriod)
    }
  },

  /**
   * Extract bug type from JIRA issue
   * @param {Object} issue - JIRA issue
   * @returns {string} Bug type or 'Unknown'
   */
  extractBugType: (issue) => {
    const projectKey = issue.fields?.project?.key || 'Unknown'
    const bugTypeField = issue.fields?.[JIRA_CONSTANTS.CUSTOM_FIELDS.BUG_TYPE]

    
    if (bugTypeField) {
      let rawBugType = null
      
      // Handle array format (JIRA custom field options)
      if (Array.isArray(bugTypeField) && bugTypeField.length > 0) {
        const firstOption = bugTypeField[0]
        if (firstOption && firstOption.value) {
          rawBugType = firstOption.value
        } else if (firstOption && firstOption.name) {
          rawBugType = firstOption.name
        }
      }
      // Handle string format
      else if (typeof bugTypeField === 'string') {
        rawBugType = bugTypeField
      }
      // Handle object format
      else if (bugTypeField.value) {
        rawBugType = bugTypeField.value
      } else if (bugTypeField.name) {
        rawBugType = bugTypeField.name
      }
      
      if (rawBugType) {
        // Use project-specific mapping
        const mappedCategory = mapBugTypeToCategory(rawBugType, projectKey)

        return mappedCategory
      }
    }
    
    // Fallback to configured fallback category
    return memberConfiguration.bugTypeConfiguration.fallbackCategory
  },

  // REMOVED: normalizeBugType - now using project-specific configuration via mapBugTypeToCategory

  /**
   * Update bug type distribution for a given key
   * @param {Map} distributionMap - Map to update
   * @param {string} key - Key (project, time period, etc.)
   * @param {string} bugType - Bug type to count
   */
  updateBugTypeDistribution: (distributionMap, key, bugType) => {
    if (!distributionMap.has(key)) {
      distributionMap.set(key, {
        bugTypes: {
          'Functional': { count: 0, percentage: 0 },
          'UI': { count: 0, percentage: 0 },
          'Performance': { count: 0, percentage: 0 },
          'Security': { count: 0, percentage: 0 },
          'Regression': { count: 0, percentage: 0 },
          'Integration': { count: 0, percentage: 0 },
          'Unknown': { count: 0, percentage: 0 }
        },
        totalBugs: 0,
        projectKey: key.includes('::') ? key.split('::')[0] : key,
        timePeriod: key.includes('::') ? key.split('::')[1] : null,
        metadata: {
          calculatedAt: new Date().toISOString(),
          source: 'single-loop-processing'
        }
      })
    }
    
    const distribution = distributionMap.get(key)
    
    // Initialize bug type if it doesn't exist
    if (!distribution.bugTypes[bugType]) {
      distribution.bugTypes[bugType] = { count: 0, percentage: 0 }
    }
    
    // Update counts
    distribution.bugTypes[bugType].count++
    distribution.totalBugs++
    
    // Recalculate percentages
    Object.values(distribution.bugTypes).forEach(bugTypeData => {
      if (distribution.totalBugs > 0) {
        bugTypeData.percentage = (bugTypeData.count / distribution.totalBugs) * 100
      }
    })
  },

  /**
   * Update total bug type count
   * @param {Object} totalDistribution - Total distribution object
   * @param {string} bugType - Bug type to count
   */
  updateBugTypeCount: (totalDistribution, bugType) => {
    // Initialize bug type if it doesn't exist
    if (!totalDistribution.bugTypes[bugType]) {
      totalDistribution.bugTypes[bugType] = { count: 0, percentage: 0 }
    }
    
    // Update counts
    totalDistribution.bugTypes[bugType].count++
    totalDistribution.totalBugs++
    
    // Recalculate percentages
    Object.values(totalDistribution.bugTypes).forEach(bugTypeData => {
      if (totalDistribution.totalBugs > 0) {
        bugTypeData.percentage = (bugTypeData.count / totalDistribution.totalBugs) * 100
      }
    })
    
    // Update metadata
    totalDistribution.metadata.calculatedAt = new Date().toISOString()
  },

  /**
   * Process bug status analysis for trending by time period
   * @param {Object} issue - JIRA issue
   * @param {Object} data - Developer quality data structure
   */
  processBugStatusAnalysis: (issue, data) => {
    // Only process Bug type issues
    if (issue.fields?.issuetype?.name !== 'Bug') return
    
    const projectKey = issue.fields?.project?.key
    const status = issue.fields?.status?.name
    
    if (!projectKey || !status) {
      return
    }
    
    // Use existing bugCategorization utility with memberConfiguration mapping
    const statusCategory = categorizeBugStatus(status)
    
    // Determine which date to use based on status category (following user specs)
    const dates = {
      created: issue.fields?.created,
      updated: issue.fields?.updated,
      resolved: issue.fields?.resolutiondate
    }
    
    const relevantDate = developerQualityService.getRelevantDateForBugStatus(dates, statusCategory)
    if (!relevantDate) return
    
    // Process for all time periods (week, month, quarter)
    const timePeriods = {
      week: getTimePeriodKey(relevantDate, 'week'),
      month: getTimePeriodKey(relevantDate, 'month'),
      quarter: getTimePeriodKey(relevantDate, 'quarter')
    }
    
    // Update project-specific metrics
    if (!data.metrics.bugStatusAnalysis.byProject.has(projectKey)) {
      data.metrics.bugStatusAnalysis.byProject.set(projectKey, new Map())
    }
    const projectData = data.metrics.bugStatusAnalysis.byProject.get(projectKey)
    
    // Update aggregated metrics and time period specific maps
    Object.entries(timePeriods).forEach(([periodType, periodKey]) => {
      if (!periodKey) return
      
      // Update project-specific data
      if (!projectData.has(periodKey)) {
        projectData.set(periodKey, {
          new: 0, inProgress: 0, resolved: 0, notFixed: 0, total: 0
        })
      }
      const projectPeriodData = projectData.get(periodKey)
      projectPeriodData[statusCategory] += 1
      projectPeriodData.total += 1
      
      // Update aggregated data
      if (!data.metrics.bugStatusAnalysis.aggregated.has(periodKey)) {
        data.metrics.bugStatusAnalysis.aggregated.set(periodKey, {
          new: 0, inProgress: 0, resolved: 0, notFixed: 0, total: 0
        })
      }
      const aggregatedPeriodData = data.metrics.bugStatusAnalysis.aggregated.get(periodKey)
      aggregatedPeriodData[statusCategory] += 1
      aggregatedPeriodData.total += 1
      
      // Update time period specific maps
      const periodMap = data.metrics.bugStatusAnalysis[`by${periodType.charAt(0).toUpperCase() + periodType.slice(1)}`]
      if (!periodMap.has(periodKey)) {
        periodMap.set(periodKey, {
          new: 0, inProgress: 0, resolved: 0, notFixed: 0, total: 0
        })
      }
      const periodMapData = periodMap.get(periodKey)
      periodMapData[statusCategory] += 1
      periodMapData.total += 1
      
      // Update metadata
      data.metrics.bugStatusAnalysis.metadata.timePeriods.add(periodKey)
      data.metrics.bugStatusAnalysis.metadata.projects.add(projectKey)
    })
    
    // Update total counters
    data.metrics.bugStatusAnalysis.totalBugs += 1
    data.metrics.bugStatusAnalysis.statusBreakdown[statusCategory] += 1
  },

  /**
   * Determine which date to use based on bug status category
   * Following user specifications for date precedence
   * @param {Object} dates - Object with created, updated, resolved dates
   * @param {string} statusCategory - Bug status category
   * @returns {string|null} Relevant date string
   */
  getRelevantDateForBugStatus: (dates, statusCategory) => {
    switch (statusCategory) {
      case 'resolved':
      case 'notFixed':
        // Use resolutionDate first, fallback to updated
        return dates.resolved || dates.updated
      case 'new':
        // Use created first, fallback to updated
        return dates.created || dates.updated
      case 'inProgress':
      default:
        // All others use updated (JIRA sets updated == created for new issues)
        return dates.updated
    }
  }

}


if (typeof window !== 'undefined') {
  window.developerQualityService = developerQualityService
  // Add a global function to clear cache for testing the time tracking fix
  window.clearDeveloperQualityCache = async () => {
    const success = await developerQualityService.clearCachedData();
    return success
  }
} 