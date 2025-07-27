/**
 * Data Pipeline Logger
 * Comprehensive logging system to track data flow from API to IndexedDB
 * Integrates with debug store for export functionality
 */

import { memberConfiguration, shouldIncludeMember } from '../../constants/memberConfiguration'

export class DataPipelineLogger {
  constructor() {
    this.logs = []
    this.metrics = {
      api: {
        totalRecordsFromAPI: 0,
        snapshotsCount: 0,
        downloadSuccessCount: 0,
        downloadFailureCount: 0,
        downloadDetails: []
      },
      processing: {
        totalIssuesReceived: 0,
        memberFiltered: {
          included: 0,
          excluded: 0,
          excludedBreakdown: {
            unassigned: 0,
            notConfigured: 0,
            unknownDevelopers: new Set()
          }
        },
        projectFiltered: {
          included: 0,
          excluded: 0,
          excludedProjects: new Set()
        },
        issueTypeBreakdown: new Map(),
        statusBreakdown: new Map(),
        timeRangeBreakdown: {
          currentQuarter: 0,
          previousQuarters: 0,
          dateRange: {
            earliest: null,
            latest: null
          }
        }
      },
      storage: {
        indexedDBRecords: 0,
        cacheKeys: [],
        storageBreakdown: {
          metrics: 0,
          chartData: 0,
          indices: 0,
          filterOptions: 0,
          minimalIssues: 0
        }
      },
      performance: {
        fetchTime: 0,
        processingTime: 0,
        storageTime: 0,
        totalTime: 0
      }
    }
    this.startTime = Date.now()
  }

  log(level, stage, message, data = null) {
    const timestamp = new Date().toISOString()
    const logEntry = {
      timestamp,
      level, // 'INFO', 'WARN', 'ERROR', 'DEBUG'
      stage, // 'API', 'PROCESSING', 'STORAGE', 'SYSTEM'
      message,
      data
    }
    
    this.logs.push(logEntry)
    
    // Also log to console with appropriate level
    const consoleMessage = `🔍 ${stage}: ${message}`
    switch (level) {
      case 'ERROR':
        console.error(consoleMessage, data)
        break
      case 'WARN':
        console.warn(consoleMessage, data)
        break
      case 'DEBUG':
        console.debug(consoleMessage, data)
        break
      default:
        console.log(consoleMessage, data)
    }
  }

  // API Stage Logging
  logAPIStart() {
    this.log('INFO', 'API', 'Starting data fetch from /issues/v3 API')
  }

  logAPIResponse(response) {
    this.metrics.api.totalRecordsFromAPI = response.totalRecords || 0
    this.metrics.api.snapshotsCount = response.snapshots?.length || 0
    
    this.log('INFO', 'API', `API Response received`, {
      totalRecords: this.metrics.api.totalRecordsFromAPI,
      snapshotsCount: this.metrics.api.snapshotsCount,
      currentQuarter: response.currentQuarter,
      metadata: response.metadata
    })

    // Log snapshot details
    if (response.snapshots) {
      response.snapshots.forEach(snapshot => {
        this.metrics.api.downloadDetails.push({
          quarter: snapshot.quarter,
          year: snapshot.year,
          expectedRecords: snapshot.recordCount || 0,
          fileSize: snapshot.fileSize || 0,
          url: snapshot.url ? 'Present' : 'Missing'
        })
      })
    }
  }

  logSnapshotDownload(snapshot, result, error = null) {
    if (error) {
      this.metrics.api.downloadFailureCount++
      this.log('ERROR', 'API', `Snapshot download failed: Q${snapshot.quarter} ${snapshot.year}`, {
        snapshot,
        error: error.message
      })
    } else {
      this.metrics.api.downloadSuccessCount++
      const actualRecords = Array.isArray(result) ? result.length : 0
      this.log('INFO', 'API', `Snapshot downloaded: Q${snapshot.quarter} ${snapshot.year}`, {
        expectedRecords: snapshot.recordCount || 0,
        actualRecords,
        recordsDelta: actualRecords - (snapshot.recordCount || 0)
      })
      
      // Update download details
      const detail = this.metrics.api.downloadDetails.find(d => 
        d.quarter === snapshot.quarter && d.year === snapshot.year
      )
      if (detail) {
        detail.actualRecords = actualRecords
        detail.status = 'success'
      }
    }
  }

  // Processing Stage Logging
  logProcessingStart(totalIssues) {
    this.metrics.processing.totalIssuesReceived = totalIssues
    this.log('INFO', 'PROCESSING', `Processing ${totalIssues} issues`, {
      configuredDevelopers: memberConfiguration.developers.length,
      configuredProjects: memberConfiguration.projects.length,
      onlyCalculateForConfiguredMembers: memberConfiguration.kpiSettings.onlyCalculateForConfiguredMembers
    })
  }

  logMemberFiltering(issue, memberStatus) {
    const assignee = issue.fields?.assignee?.displayName || 'Unassigned'
    const assigneeAccountId = issue.fields?.assignee?.accountId || null
    
    if (memberStatus.isIncluded) {
      this.metrics.processing.memberFiltered.included++
    } else {
      this.metrics.processing.memberFiltered.excluded++
      
      if (assignee === 'Unassigned') {
        this.metrics.processing.memberFiltered.excludedBreakdown.unassigned++
      } else {
        this.metrics.processing.memberFiltered.excludedBreakdown.notConfigured++
        this.metrics.processing.memberFiltered.excludedBreakdown.unknownDevelopers.add(assignee)
      }
    }
    
    // Log first 10 excluded developers for debugging
  }

  logProjectFiltering(issue, isIncluded) {
    const projectName = issue.fields?.project?.name || 'Unknown'
    const projectKey = issue.fields?.project?.key || 'Unknown'
    
    if (isIncluded) {
      this.metrics.processing.projectFiltered.included++
    } else {
      this.metrics.processing.projectFiltered.excluded++
      this.metrics.processing.projectFiltered.excludedProjects.add(`${projectName} (${projectKey})`)
    }
  }

  logIssueTypeBreakdown(issue) {
    const issueType = issue.fields?.issuetype?.name || 'Unknown'
    this.metrics.processing.issueTypeBreakdown.set(
      issueType,
      (this.metrics.processing.issueTypeBreakdown.get(issueType) || 0) + 1
    )
  }

  logStatusBreakdown(issue) {
    const status = issue.fields?.status?.name || 'Unknown'
    this.metrics.processing.statusBreakdown.set(
      status,
      (this.metrics.processing.statusBreakdown.get(status) || 0) + 1
    )
  }

  logTimeRangeAnalysis(issue) {
    const created = issue.fields?.created
    const updated = issue.fields?.updated
    
    if (created) {
      const createdDate = new Date(created)
      
      // Update date range
      if (!this.metrics.processing.timeRangeBreakdown.dateRange.earliest || 
          createdDate < this.metrics.processing.timeRangeBreakdown.dateRange.earliest) {
        this.metrics.processing.timeRangeBreakdown.dateRange.earliest = createdDate
      }
      
      if (!this.metrics.processing.timeRangeBreakdown.dateRange.latest || 
          createdDate > this.metrics.processing.timeRangeBreakdown.dateRange.latest) {
        this.metrics.processing.timeRangeBreakdown.dateRange.latest = createdDate
      }
      
      // Determine if current quarter (simplified logic)
      const now = new Date()
      const currentYear = now.getFullYear()
      const currentQuarter = Math.floor((now.getMonth() + 3) / 3)
      
      const issueYear = createdDate.getFullYear()
      const issueQuarter = Math.floor((createdDate.getMonth() + 3) / 3)
      
      if (issueYear === currentYear && issueQuarter === currentQuarter) {
        this.metrics.processing.timeRangeBreakdown.currentQuarter++
      } else {
        this.metrics.processing.timeRangeBreakdown.previousQuarters++
      }
    }
  }

  logProcessingComplete(processedData) {
    this.log('INFO', 'PROCESSING', `Processing completed`, {
      totalProcessed: this.metrics.processing.memberFiltered.included,
      totalExcluded: this.metrics.processing.memberFiltered.excluded,
      memberFilterBreakdown: {
        included: this.metrics.processing.memberFiltered.included,
        unassigned: this.metrics.processing.memberFiltered.excludedBreakdown.unassigned,
        notConfigured: this.metrics.processing.memberFiltered.excludedBreakdown.notConfigured,
        uniqueUnknownDevelopers: this.metrics.processing.memberFiltered.excludedBreakdown.unknownDevelopers.size
      },
      projectFilterBreakdown: {
        included: this.metrics.processing.projectFiltered.included,
        excluded: this.metrics.processing.projectFiltered.excluded,
        excludedProjects: Array.from(this.metrics.processing.projectFiltered.excludedProjects).slice(0, 10)
      },
      timeRangeBreakdown: {
        ...this.metrics.processing.timeRangeBreakdown,
        dateRange: {
          earliest: this.metrics.processing.timeRangeBreakdown.dateRange.earliest?.toISOString(),
          latest: this.metrics.processing.timeRangeBreakdown.dateRange.latest?.toISOString()
        }
      }
    })
  }

  // Storage Stage Logging
  logStorageStart() {
    this.log('INFO', 'STORAGE', 'Starting IndexedDB storage')
  }

  logStorageComplete(success, cachedData) {
    if (success) {
      this.metrics.storage.indexedDBRecords = cachedData?.minimalIssues?.length || 0
      
      // Calculate storage breakdown
      this.metrics.storage.storageBreakdown = {
        metrics: Object.keys(cachedData?.metrics || {}).length,
        chartData: Object.keys(cachedData?.chartData || {}).length,
        indices: Object.keys(cachedData?.indices || {}).length,
        filterOptions: Object.keys(cachedData?.filterOptions || {}).length,
        minimalIssues: cachedData?.minimalIssues?.length || 0
      }
      
      this.log('INFO', 'STORAGE', `IndexedDB storage completed successfully`, {
        recordsStored: this.metrics.storage.indexedDBRecords,
        storageBreakdown: this.metrics.storage.storageBreakdown,
        cacheSize: cachedData?.metadata?.cacheSize || 0
      })
    } else {
      this.log('ERROR', 'STORAGE', 'IndexedDB storage failed')
    }
  }

  // Performance Logging
  logPerformance(stage, timeMs) {
    this.metrics.performance[stage] = timeMs
    this.log('DEBUG', 'PERFORMANCE', `${stage} completed in ${timeMs}ms`)
  }

  // Summary Generation
  generateSummaryReport() {
    this.metrics.performance.totalTime = Date.now() - this.startTime
    
    const summary = {
      timestamp: new Date().toISOString(),
      pipeline: 'JIRA Data Processing',
      status: 'COMPLETED',
      metrics: this.metrics,
      keyInsights: this.generateKeyInsights(),
      recommendations: this.generateRecommendations(),
      detailedLogs: this.logs,
      configuration: {
        configuredDevelopers: memberConfiguration.developers.length,
        configuredProjects: memberConfiguration.projects.length,
        onlyCalculateForConfiguredMembers: memberConfiguration.kpiSettings.onlyCalculateForConfiguredMembers,
        memberNames: memberConfiguration.developers.map(d => d.name).slice(0, 10) // First 10 for debugging
      }
    }
    
    this.log('INFO', 'SYSTEM', 'Data pipeline summary generated', {
      totalAPIRecords: this.metrics.api.totalRecordsFromAPI,
      processedRecords: this.metrics.processing.memberFiltered.included,
      storedRecords: this.metrics.storage.indexedDBRecords,
      retentionRate: `${((this.metrics.storage.indexedDBRecords / this.metrics.api.totalRecordsFromAPI) * 100).toFixed(2)}%`
    })
    
    return summary
  }

  generateKeyInsights() {
    const insights = []
    
    // API vs Storage discrepancy insight
    const retentionRate = (this.metrics.storage.indexedDBRecords / this.metrics.api.totalRecordsFromAPI) * 100
    insights.push({
      type: 'DATA_RETENTION',
      message: `${retentionRate.toFixed(2)}% of API records stored in IndexedDB`,
      explanation: `Out of ${this.metrics.api.totalRecordsFromAPI.toLocaleString()} API records, only ${this.metrics.storage.indexedDBRecords.toLocaleString()} were stored. This is expected due to member filtering.`,
      severity: retentionRate < 5 ? 'INFO' : 'NORMAL'
    })
    
    // Member filtering insight
    const unknownDevelopersCount = this.metrics.processing.memberFiltered.excludedBreakdown.unknownDevelopers.size
    if (unknownDevelopersCount > 0) {
      insights.push({
        type: 'MEMBER_FILTERING',
        message: `${unknownDevelopersCount} unique developers not in configuration`,
        explanation: `Issues assigned to ${unknownDevelopersCount} developers were excluded because they're not in memberConfiguration.`,
        severity: 'INFO',
        unknownDevelopers: Array.from(this.metrics.processing.memberFiltered.excludedBreakdown.unknownDevelopers).slice(0, 20)
      })
    }
    
    // Project filtering insight
    const excludedProjectsCount = this.metrics.processing.projectFiltered.excludedProjects.size
    if (excludedProjectsCount > 0) {
      insights.push({
        type: 'PROJECT_FILTERING',
        message: `${excludedProjectsCount} projects not in configuration`,
        explanation: `Issues from ${excludedProjectsCount} projects were excluded because they're not configured.`,
        severity: 'INFO',
        excludedProjects: Array.from(this.metrics.processing.projectFiltered.excludedProjects).slice(0, 10)
      })
    }
    
    // Time range insight
    const currentQuarterPercentage = (this.metrics.processing.timeRangeBreakdown.currentQuarter / this.metrics.processing.totalIssuesReceived) * 100
    insights.push({
      type: 'TIME_DISTRIBUTION',
      message: `${currentQuarterPercentage.toFixed(1)}% of issues are from current quarter`,
      explanation: `${this.metrics.processing.timeRangeBreakdown.currentQuarter} current quarter issues vs ${this.metrics.processing.timeRangeBreakdown.previousQuarters} from previous quarters`,
      severity: 'INFO'
    })
    
    return insights
  }

  generateRecommendations() {
    const recommendations = []
    
    // High exclusion rate recommendation
    const exclusionRate = (this.metrics.processing.memberFiltered.excluded / this.metrics.processing.totalIssuesReceived) * 100
    if (exclusionRate > 90) {
      recommendations.push({
        type: 'CONFIGURATION',
        message: 'Consider reviewing member configuration',
        reason: `${exclusionRate.toFixed(1)}% of issues are excluded due to member filtering`,
        action: 'Add more developers to memberConfiguration.developers or set onlyCalculateForConfiguredMembers to false'
      })
    }
    
    // Unknown developers recommendation
    const unknownDevCount = this.metrics.processing.memberFiltered.excludedBreakdown.unknownDevelopers.size
    if (unknownDevCount > 10) {
      recommendations.push({
        type: 'MEMBER_ADDITION',
        message: 'Many unknown developers found',
        reason: `${unknownDevCount} developers not in configuration`,
        action: 'Review console logs for unknown developer names and add relevant ones to memberConfiguration.developers'
      })
    }
    
    return recommendations
  }

  // Developer Ticket Filtering Logging (for useDeveloperTickets hook)
  logDeveloperFiltering(developerName, filterState) {
    this.log('DEBUG', 'DEVELOPER_FILTERING', `Filtering tickets for developer "${developerName}"`, {
      totalIssues: filterState.totalIssues,
      timeframe: filterState.timeframe,
      projectsFilter: filterState.projectsFilter,
      hasProjectsFilter: filterState.hasProjectsFilter
    })
  }

  logMissingTicketsDebug(missingTickets, foundTickets) {
    this.log('DEBUG', 'MISSING_TICKETS', `Missing tickets analysis`, {
      searchedTickets: missingTickets,
      foundCount: foundTickets.length,
      missingCount: missingTickets.length - foundTickets.length,
      foundTickets: foundTickets.map(t => ({
        key: t.key,
        assignee: t.assignee,
        project: t.project,
        status: t.status,
        resolved: t.resolved,
        updated: t.updated
      })),
      missingTickets: missingTickets.filter(ticketKey => 
        !foundTickets.some(ticket => ticket.key === ticketKey)
      )
    })
  }

  logYudanisVariations(yudanisTickets) {
    this.log('DEBUG', 'YUDANIS_VARIATIONS', `Found ${yudanisTickets.length} tickets with Yudanis name variations`, {
      count: yudanisTickets.length,
      sampleTickets: yudanisTickets.slice(0, 5).map(t => ({ 
        key: t.key, 
        assignee: t.assignee, 
        project: t.project,
        status: t.status 
      })),
      allTicketKeys: yudanisTickets.map(t => t.key)
    })
  }

  logMissingTicketsAfterFiltering(missingTicketsAfterFiltering, minimalIssues, developerName, filters) {
    const analysisResults = []
    
    // Analyze each missing ticket
    missingTicketsAfterFiltering.forEach(ticketKey => {
      const originalTicket = minimalIssues.find(t => t.key === ticketKey)
      if (originalTicket) {
        const excludedStatuses = ['To Do', 'In Progress', 'Rejected', 'todo', 'inprogress', 'rejected']
        const isExcludedByStatus = excludedStatuses.some(excludedStatus => 
          originalTicket.status?.toLowerCase() === excludedStatus.toLowerCase()
        )
        const isExcludedByProject = filters.projects && filters.projects.length > 0 && 
          !filters.projects.includes(originalTicket.project)
        const isExcludedByDeveloper = originalTicket.assignee !== developerName
        
        analysisResults.push({
          ticketKey,
          status: originalTicket.status,
          project: originalTicket.project,
          assignee: originalTicket.assignee,
          exclusionReasons: {
            byStatus: isExcludedByStatus,
            byProject: isExcludedByProject,
            byDeveloper: isExcludedByDeveloper
          }
        })
      } else {
        analysisResults.push({
          ticketKey,
          status: 'NOT_FOUND_IN_SOURCE',
          exclusionReasons: {
            notInSource: true
          }
        })
      }
    })

    this.log('WARN', 'MISSING_TICKETS_AFTER_FILTERING', 
      `${missingTicketsAfterFiltering.length} tickets still missing after all filtering`, {
      missingTickets: missingTicketsAfterFiltering,
      analysisResults,
      filterCriteria: {
        developer: developerName,
        projects: filters.projects || [],
        excludedStatuses: ['To Do', 'In Progress', 'Rejected', 'todo', 'inprogress', 'rejected']
      }
    })
  }

  logDeveloperFilteringResults(developerName, developerTickets, filters) {
    this.log('INFO', 'DEVELOPER_FILTERING_RESULTS', `Filtering completed for "${developerName}"`, {
      filteredTickets: developerTickets.length,
      excludedStatusesUsed: ['To Do', 'In Progress', 'Rejected', 'todo', 'inprogress', 'rejected'],
      projectsInResults: [...new Set(developerTickets.map(t => t.project))],
      statusesInResults: [...new Set(developerTickets.map(t => t.status))],
      timeframeFilter: filters?.timeframe || 'month',
      projectsFilter: filters?.projects || [],
      sampleTickets: developerTickets.slice(0, 3).map(t => ({ 
        key: t.key, 
        project: t.project, 
        status: t.status,
        storyPoints: t.storyPoints,
        updated: t.updated,
        resolved: t.resolved
      }))
    })
  }

  // Export functionality for debug store
  exportLogs() {
    return {
      summary: this.generateSummaryReport(),
      rawLogs: this.logs,
      metrics: this.metrics
    }
  }
}

// Global instance for use across the application
export const dataPipelineLogger = new DataPipelineLogger()

// Make available for debugging
if (typeof window !== 'undefined') {
  window.dataPipelineLogger = dataPipelineLogger
}