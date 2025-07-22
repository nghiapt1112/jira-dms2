import { JIRA_CONSTANTS } from '../../../constants/jiraConstants'
import { parseSeverity } from '../../../shared/utils/severityParser.js'

export const dataProcessingService = {
  // Process raw JIRA issues from S3 files
  processJiraIssues: (rawData) => {
    try {
      console.log('Processing JIRA issues...')
      const startTime = Date.now()
      
      // Check if rawData is already a flat array of issues
      if (Array.isArray(rawData) && rawData.length > 0 && rawData[0].key) {
        // Data is already flattened
        console.log(`Processing ${rawData.length} pre-flattened issues`)
        const uniqueIssues = dataProcessingService.removeDuplicateIssues(rawData)
        const validIssues = dataProcessingService.validateIssueData(uniqueIssues)
        const enrichedIssues = dataProcessingService.enrichIssueData(validIssues)
        
        const processingTime = Date.now() - startTime
        console.log(`Processing completed in ${processingTime}ms`)
        
        const stats = dataProcessingService.getProcessingStats(rawData.length, enrichedIssues.length)
        console.log('Processing statistics:', stats)
        
        return enrichedIssues
      }
      
      // Otherwise, flatten all issues from multiple snapshots
      const allIssues = []
      let totalRawCount = 0
      
      for (const dataChunk of rawData) {
        if (Array.isArray(dataChunk)) {
          totalRawCount += dataChunk.length
          allIssues.push(...dataChunk)
        } else if (dataChunk && Array.isArray(dataChunk.issues)) {
          totalRawCount += dataChunk.issues.length
          allIssues.push(...dataChunk.issues)
        } else if (dataChunk && dataChunk.data && Array.isArray(dataChunk.data)) {
          totalRawCount += dataChunk.data.length
          allIssues.push(...dataChunk.data)
        }
      }
      
      console.log(`Total raw issues collected: ${totalRawCount}`)
      
      // Remove duplicates based on issue key
      const uniqueIssues = dataProcessingService.removeDuplicateIssues(allIssues)
      console.log(`Unique issues after deduplication: ${uniqueIssues.length}`)
      
      // Validate and clean data
      const cleanedIssues = dataProcessingService.validateIssueData(uniqueIssues)
      console.log(`Valid issues after cleaning: ${cleanedIssues.length}`)
      
      // Enrich issues with calculated fields
      const enrichedIssues = dataProcessingService.enrichIssueData(cleanedIssues)
      
      // Sort by created date (newest first)
      enrichedIssues.sort((a, b) => 
        new Date(b.fields.created) - new Date(a.fields.created)
      )
      
      const processingTime = Date.now() - startTime
      console.log(`Processing completed in ${processingTime}ms`)
      
      // Log processing statistics
      const stats = dataProcessingService.getProcessingStats(totalRawCount, enrichedIssues.length)
      console.log('Processing statistics:', stats)
      
      return enrichedIssues
      
    } catch (error) {
      console.error('Error processing JIRA issues:', error)
      throw new Error(`Data processing failed: ${error.message}`)
    }
  },
  
  // Remove duplicate issues
  removeDuplicateIssues: (issues) => {
    const seen = new Map()
    const duplicates = []
    
    const uniqueIssues = issues.filter(issue => {
      if (!issue.key) return false
      
      if (seen.has(issue.key)) {
        duplicates.push(issue.key)
        return false
      }
      
      seen.set(issue.key, true)
      return true
    })
    
    if (duplicates.length > 0) {
      console.log(`Removed ${duplicates.length} duplicate issues`)
    }
    
    return uniqueIssues
  },
  
  // Validate issue data structure
  validateIssueData: (issues) => {
    const invalidIssues = []
    
    const validIssues = issues.filter(issue => {
      // Basic validation
      if (!issue || typeof issue !== 'object') {
        invalidIssues.push({ reason: 'Not an object', issue })
        return false
      }
      
      if (!issue.key) {
        invalidIssues.push({ reason: 'Missing key', issue })
        return false
      }
      
      if (!issue.fields || typeof issue.fields !== 'object') {
        invalidIssues.push({ reason: 'Missing or invalid fields', issue: issue.key })
        return false
      }
      
      // Ensure required fields exist
      if (!issue.fields.project || !issue.fields.created) {
        invalidIssues.push({ reason: 'Missing required fields', issue: issue.key })
        return false
      }
      
      return true
    })
    
    if (invalidIssues.length > 0) {
      console.warn(`Filtered out ${invalidIssues.length} invalid issues`)
    }
    
    return validIssues
  },
  
  // Enrich issue data with calculated fields
  enrichIssueData: (issues) => {
    return issues.map(issue => {
      const enriched = { ...issue }
      
      // Add display fields
      enriched.displayFields = {
        projectKey: issue.fields.project?.key || 'Unknown',
        projectName: issue.fields.project?.name || 'Unknown Project',
        issueType: issue.fields.issuetype?.name || 'Unknown Type',
        status: issue.fields.status?.name || 'Unknown Status',
        priority: issue.fields.priority?.name || 'None',
        severity: parseSeverity(issue, issue.fields.project?.key).severity,
        assignee: issue.fields.assignee?.displayName || 'Unassigned',
        reporter: issue.fields.reporter?.displayName || 'Unknown',
        created: dataProcessingService.formatDate(issue.fields.created),
        updated: dataProcessingService.formatDate(issue.fields.updated),
        resolved: dataProcessingService.formatDate(issue.fields.resolutiondate),
      }
      
      // Add calculated fields
      enriched.calculatedFields = {
        age: dataProcessingService.calculateAge(issue.fields.created),
        timeToResolve: dataProcessingService.calculateTimeToResolve(
          issue.fields.created,
          issue.fields.resolutiondate
        ),
        isOverdue: dataProcessingService.checkOverdue(issue),
        hasAttachments: issue.fields.attachment?.length > 0,
        commentCount: issue.fields.comment?.total || 0,
        storyPoints: issue.fields[JIRA_CONSTANTS.CUSTOM_FIELDS.STORY_POINTS] || null,
        sprint: dataProcessingService.extractSprintInfo(
          issue.fields[JIRA_CONSTANTS.CUSTOM_FIELDS.SPRINT]
        ),
        bugType: issue.fields[JIRA_CONSTANTS.CUSTOM_FIELDS.BUG_TYPE] || null,
        rootCause: issue.fields[JIRA_CONSTANTS.CUSTOM_FIELDS.ROOT_CAUSE] || null,
      }
      
      return enriched
    })
  },
  
  // Calculate processing statistics
  getProcessingStats: (originalCount, processedCount) => {
    const duplicatesRemoved = originalCount - processedCount
    const duplicatePercentage = originalCount > 0 
      ? ((duplicatesRemoved / originalCount) * 100).toFixed(2)
      : '0.00'
    
    return {
      originalCount,
      processedCount,
      duplicatesRemoved,
      duplicatePercentage: `${duplicatePercentage}%`,
      retentionRate: `${(100 - parseFloat(duplicatePercentage)).toFixed(2)}%`
    }
  },
  
  // Extract unique projects from issues
  extractProjects: (issues) => {
    const projectsMap = new Map()
    
    issues.forEach(issue => {
      const project = issue.fields.project
      if (project && project.key) {
        projectsMap.set(project.key, {
          key: project.key,
          name: project.name || project.key,
          issueCount: (projectsMap.get(project.key)?.issueCount || 0) + 1
        })
      }
    })
    
    return Array.from(projectsMap.values()).sort((a, b) => b.issueCount - a.issueCount)
  },
  
  // Extract date range from issues
  extractDateRange: (issues) => {
    if (issues.length === 0) return null
    
    const dates = issues
      .map(issue => new Date(issue.fields.created))
      .filter(date => !isNaN(date))
    
    if (dates.length === 0) return null
    
    const earliest = new Date(Math.min(...dates))
    const latest = new Date(Math.max(...dates))
    
    return {
      earliest,
      latest,
      earliestFormatted: dataProcessingService.formatDate(earliest),
      latestFormatted: dataProcessingService.formatDate(latest),
      rangeInDays: Math.ceil((latest - earliest) / (1000 * 60 * 60 * 24))
    }
  },
  
  // Format date for display
  formatDate: (dateString) => {
    if (!dateString) return null
    
    try {
      const date = new Date(dateString)
      if (isNaN(date)) return dateString
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch (error) {
      return dateString
    }
  },
  
  // Calculate issue age in days
  calculateAge: (createdDate) => {
    if (!createdDate) return null
    
    try {
      const created = new Date(createdDate)
      const now = new Date()
      const ageInMs = now - created
      return Math.floor(ageInMs / (1000 * 60 * 60 * 24))
    } catch (error) {
      return null
    }
  },
  
  // Calculate time to resolve in days
  calculateTimeToResolve: (createdDate, resolvedDate) => {
    if (!createdDate || !resolvedDate) return null
    
    try {
      const created = new Date(createdDate)
      const resolved = new Date(resolvedDate)
      const timeInMs = resolved - created
      return Math.floor(timeInMs / (1000 * 60 * 60 * 24))
    } catch (error) {
      return null
    }
  },
  
  // Check if issue is overdue
  checkOverdue: (issue) => {
    if (!issue.fields.duedate) return false
    
    try {
      const dueDate = new Date(issue.fields.duedate)
      const now = new Date()
      const isResolved = issue.fields.resolutiondate || 
                        issue.fields.status?.statusCategory?.key === 'done'
      
      return !isResolved && now > dueDate
    } catch (error) {
      return false
    }
  },
  
  // Extract sprint information
  extractSprintInfo: (sprintField) => {
    if (!sprintField) return null
    
    // Sprint field is usually an array of sprint objects or strings
    if (Array.isArray(sprintField) && sprintField.length > 0) {
      const latestSprint = sprintField[sprintField.length - 1]
      
      if (typeof latestSprint === 'string') {
        // Parse sprint string if needed
        const match = latestSprint.match(/name=([^,]+)/)
        return match ? match[1] : latestSprint
      }
      
      return latestSprint.name || latestSprint
    }
    
    return null
  },
  
  // Group issues by a field
  groupIssuesBy: (issues, fieldPath) => {
    const groups = new Map()
    
    issues.forEach(issue => {
      const value = dataProcessingService.getNestedValue(issue, fieldPath) || 'Unknown'
      
      if (!groups.has(value)) {
        groups.set(value, [])
      }
      
      groups.get(value).push(issue)
    })
    
    return Object.fromEntries(groups)
  },
  
  // Get nested value from object
  getNestedValue: (obj, path) => {
    return path.split('.').reduce((current, key) => current?.[key], obj)
  },
  
  // Create summary statistics
  createSummaryStatistics: (issues) => {
    const projects = dataProcessingService.extractProjects(issues)
    const dateRange = dataProcessingService.extractDateRange(issues)
    
    const issueTypes = {}
    const statuses = {}
    const priorities = {}
    
    issues.forEach(issue => {
      // Count issue types
      const type = issue.displayFields?.issueType || 'Unknown'
      issueTypes[type] = (issueTypes[type] || 0) + 1
      
      // Count statuses
      const status = issue.displayFields?.status || 'Unknown'
      statuses[status] = (statuses[status] || 0) + 1
      
      // Count priorities
      const priority = issue.displayFields?.priority || 'None'
      priorities[priority] = (priorities[priority] || 0) + 1
    })
    
    return {
      totalIssues: issues.length,
      projectCount: projects.length,
      dateRange,
      projects: projects.slice(0, 10), // Top 10 projects
      issueTypes,
      statuses,
      priorities,
      averageAge: Math.round(
        issues.reduce((sum, issue) => sum + (issue.calculatedFields?.age || 0), 0) / issues.length
      ),
      resolvedCount: issues.filter(i => i.fields.resolutiondate).length,
      unresolvedCount: issues.filter(i => !i.fields.resolutiondate).length
    }
  }
}