import { JIRA_CONSTANTS } from '../../../constants/jiraConstants.js'
import { createDate, isAfter } from '../../../shared/utils/dateUtils.js'

const SPRINT_FIELD = JIRA_CONSTANTS.CUSTOM_FIELDS.SPRINT

// SCOPE CREEP DETECTION - Same logic as main service
const detectScopeCreep = (issue, firstSprint) => {
  const sprintStartDate = createDate(firstSprint.startDate)
  
  // Layer 1: Changelog Analysis (Primary method)
  if (issue.changelog?.histories) {
    const sprintAddition = issue.changelog.histories.find(history => {
      if (!history.items) return false
      
      return history.items.some(item => {
        // Check multiple field variations
        const isSprintField = item.field === 'Sprint' || 
                             item.fieldId === SPRINT_FIELD || 
                             item.field === 'Agile Sprint'
        
        if (!isSprintField) return false
        
        // Check if this sprint was added
        return item.toString?.includes(firstSprint.name) || 
               item.toString?.includes(firstSprint.id)
      })
    })
    
    if (sprintAddition) {
      const additionDate = createDate(sprintAddition.created)
      if (additionDate && sprintStartDate && isAfter(additionDate, sprintStartDate)) {
        return true // Added after sprint started = scope creep
      }
    }
  }
  
  // Layer 2: Creation Date Fallback
  const issueCreatedDate = createDate(issue.fields?.created)
  if (issueCreatedDate && sprintStartDate && isAfter(issueCreatedDate, sprintStartDate)) {
    return true // Created after sprint started = likely scope creep
  }
  
  // Layer 3: Multi-Sprint Analysis
  const sprints = issue.fields[SPRINT_FIELD] || []
  if (sprints.length >= 3) {
    return true // Issues spanning 3+ sprints indicate planning issues
  }
  
  return false // Planned issue
}

export const sprintMetricsDetailsService = {
  getLateIssuesDetails: (issues, projectKey = null, filters = {}) => {
    const targetIssues = projectKey 
      ? issues.filter(issue => {
          const issueProject = issue.fields?.project?.key
          return issueProject === projectKey
        })
      : issues

    // Use sprint-based logic instead of dueDate logic
    const lateIssues = targetIssues.filter(issue => {
      // Must have sprint data
      if (!issue.fields?.[SPRINT_FIELD] || issue.fields[SPRINT_FIELD].length === 0) {
        return false
      }

      // Must be resolved
      if (!issue.fields?.resolutiondate) {
        return false
      }

      // Get LAST sprint (completion point)
      const sprints = issue.fields[SPRINT_FIELD]
      const lastSprint = sprints[sprints.length - 1]

      if (!lastSprint || !lastSprint.endDate) {
        return false
      }

      const resolutionDate = createDate(issue.fields.resolutiondate)
      const sprintEndDate = createDate(lastSprint.endDate)

      // Issue is late if resolved after sprint end date
      return resolutionDate > sprintEndDate
    })

    const enrichedLateIssues = lateIssues.map(issue => {
      // Get sprint dates for delay calculation
      const sprints = issue.fields[SPRINT_FIELD]
      const lastSprint = sprints[sprints.length - 1]
      const sprintEndDate = createDate(lastSprint.endDate)
      const resolutionDate = createDate(issue.fields.resolutiondate)
      
      const delayDays = Math.ceil((resolutionDate - sprintEndDate) / (1000 * 60 * 60 * 24))
      const isStillOpen = false // All late issues are resolved (by definition)

      return {
        key: issue.key,
        summary: issue.fields?.summary || 'No summary',
        issueType: issue.displayFields?.issueType || issue.fields?.issuetype?.name || 'Unknown',
        status: issue.displayFields?.status || issue.fields?.status?.name || 'Unknown',
        assignee: issue.fields?.assignee?.displayName || 'Unassigned',
        priority: issue.fields?.priority?.name || 'Medium',
        projectKey: issue.displayFields?.projectKey || issue.fields?.project?.key,
        projectName: issue.displayFields?.projectName || issue.fields?.project?.name,
        created: issue.fields?.created,
        sprintEndDate: lastSprint.endDate,
        resolutionDate: issue.fields?.resolutiondate,
        sprintName: lastSprint.name,
        delayDays,
        isStillOpen,
        labels: issue.fields?.labels || [],
        components: issue.fields?.components?.map(c => c.name) || [],
        storyPoints: parseFloat(issue.fields?.storyPoints || issue.fields?.[JIRA_CONSTANTS.CUSTOM_FIELDS.STORY_POINTS] || 0),
        // Sprint information
        sprints: sprints.map(sprint => ({
          id: sprint.id,
          name: sprint.name,
          state: sprint.state,
          startDate: sprint.startDate,
          endDate: sprint.endDate,
          goal: sprint.goal || ''
        })),
        totalSprints: sprints.length,
        isMultiSprint: sprints.length > 1,
        jiraUrl: `#/browse/${issue.key}` // Simplified for now
      }
    })

    const filteredIssues = applyDetailFilters(enrichedLateIssues, filters)
    const sortedIssues = sortIssuesByDelay(filteredIssues)

    return {
      issues: sortedIssues,
      totalCount: sortedIssues.length,
      summary: {
        avgDelayDays: calculateAvgDelay(sortedIssues),
        maxDelayDays: Math.max(...sortedIssues.map(i => i.delayDays), 0),
        stillOpenCount: sortedIssues.filter(i => i.isStillOpen).length,
        resolvedLateCount: sortedIssues.filter(i => !i.isStillOpen).length
      }
    }
  },

  getScopeCreepIssuesDetails: (issues, projectKey = null, filters = {}) => {
    const targetIssues = projectKey 
      ? issues.filter(issue => {
          const issueProject = issue.fields?.project?.key
          return issueProject === projectKey
        })
      : issues

    // Use sprint-based scope creep detection (same as main service)
    const scopeCreepIssues = targetIssues.filter(issue => {
      // Must have sprint data
      if (!issue.fields?.[SPRINT_FIELD] || issue.fields[SPRINT_FIELD].length === 0) {
        return false
      }

      // Get FIRST sprint (planning point)
      const sprints = issue.fields[SPRINT_FIELD]
      const firstSprint = sprints[0]

      if (!firstSprint || !firstSprint.startDate) {
        return false
      }

      // Use the same scope creep detection as main service
      return detectScopeCreep(issue, firstSprint)
    })

    const enrichedScopeIssues = scopeCreepIssues.map(issue => {
      const sprints = issue.fields[SPRINT_FIELD]
      const firstSprint = sprints[0]
      const created = createDate(issue.fields?.created)
      const sprintStartDate = createDate(firstSprint.startDate)
      
      const daysAfterStart = sprintStartDate && created 
        ? Math.ceil((created - sprintStartDate) / (1000 * 60 * 60 * 24))
        : 0

      return {
        key: issue.key,
        summary: issue.fields?.summary || 'No summary',
        issueType: issue.displayFields?.issueType || issue.fields?.issuetype?.name || 'Unknown',
        status: issue.displayFields?.status || issue.fields?.status?.name || 'Unknown',
        assignee: issue.fields?.assignee?.displayName || 'Unassigned',
        priority: issue.fields?.priority?.name || 'Medium',
        projectKey: issue.displayFields?.projectKey || issue.fields?.project?.key,
        projectName: issue.displayFields?.projectName || issue.fields?.project?.name,
        created: issue.fields?.created,
        sprintStartDate: firstSprint.startDate,
        sprintName: firstSprint.name,
        reporter: issue.fields?.reporter?.displayName || 'Unknown',
        daysAfterStart,
        labels: issue.fields?.labels || [],
        components: issue.fields?.components?.map(c => c.name) || [],
        storyPoints: parseFloat(issue.fields?.storyPoints || issue.fields?.[JIRA_CONSTANTS.CUSTOM_FIELDS.STORY_POINTS] || 0),
        reason: 'Added during sprint', // Simplified for now
        // Sprint information
        sprints: sprints.map(sprint => ({
          id: sprint.id,
          name: sprint.name,
          state: sprint.state,
          startDate: sprint.startDate,
          endDate: sprint.endDate,
          goal: sprint.goal || ''
        })),
        totalSprints: sprints.length,
        isMultiSprint: sprints.length > 1,
        jiraUrl: `#/browse/${issue.key}` // Simplified for now
      }
    })

    const filteredIssues = applyDetailFilters(enrichedScopeIssues, filters)
    const sortedIssues = filteredIssues.sort((a, b) => new Date(b.created) - new Date(a.created))

    return {
      issues: sortedIssues,
      totalCount: sortedIssues.length,
      summary: {
        avgStoryPoints: calculateAvgStoryPoints(sortedIssues),
        totalStoryPoints: sortedIssues.reduce((sum, i) => sum + i.storyPoints, 0),
        reasonBreakdown: getReasonBreakdown(sortedIssues),
        recentAdditions: sortedIssues.filter(i => {
          const created = new Date(i.created)
          const weekAgo = new Date()
          weekAgo.setDate(weekAgo.getDate() - 7)
          return created >= weekAgo
        }).length
      }
    }
  },

  getIssuesByStatus: (issues, targetStatus, projectKey = null, filters = {}) => {
    const targetIssues = projectKey 
      ? issues.filter(issue => {
          const issueProject = issue.displayFields?.projectKey || issue.fields?.project?.key
          return issueProject === projectKey
        })
      : issues

    const statusIssues = targetIssues.filter(issue => {
      const status = issue.displayFields?.status || issue.fields?.status?.name
      return status?.toLowerCase() === targetStatus.toLowerCase()
    })

    const enrichedStatusIssues = statusIssues.map(issue => ({
      key: issue.key,
      summary: issue.fields?.summary || 'No summary',
      issueType: issue.displayFields?.issueType || issue.fields?.issuetype?.name || 'Unknown',
      status: issue.displayFields?.status || issue.fields?.status?.name || 'Unknown',
      assignee: issue.fields?.assignee?.displayName || 'Unassigned',
      priority: issue.fields?.priority?.name || 'Medium',
      projectKey: issue.displayFields?.projectKey || issue.fields?.project?.key,
      projectName: issue.displayFields?.projectName || issue.fields?.project?.name,
      created: issue.fields?.created,
      updated: issue.fields?.updated,
      dueDate: issue.fields?.duedate,
      labels: issue.fields?.labels || [],
      components: issue.fields?.components?.map(c => c.name) || [],
      storyPoints: parseFloat(issue.fields?.storyPoints || issue.fields?.[JIRA_CONSTANTS.CUSTOM_FIELDS.STORY_POINTS] || 0),
      timeInStatus: calculateTimeInStatus(issue, targetStatus),
      jiraUrl: `${getJiraBaseUrl()}/browse/${issue.key}`
    }))

    const filteredIssues = applyDetailFilters(enrichedStatusIssues, filters)
    const sortedIssues = filteredIssues.sort((a, b) => new Date(b.updated) - new Date(a.updated))

    return {
      issues: sortedIssues,
      totalCount: sortedIssues.length,
      summary: {
        avgTimeInStatus: calculateAvgTimeInStatus(sortedIssues),
        totalStoryPoints: sortedIssues.reduce((sum, i) => sum + i.storyPoints, 0),
        priorityBreakdown: getPriorityBreakdown(sortedIssues),
        assigneeBreakdown: getAssigneeBreakdown(sortedIssues)
      }
    }
  },

  getDetailedMetricsForModal: (issues, modalType, projectKey = null, filters = {}) => {
    switch (modalType) {
      case 'late_issues':
        return sprintMetricsDetailsService.getLateIssuesDetails(issues, projectKey, filters)
      
      case 'scope_creep':
        return sprintMetricsDetailsService.getScopeCreepIssuesDetails(issues, projectKey, filters)
      
      case 'in_progress':
        return sprintMetricsDetailsService.getIssuesByStatus(issues, 'In Progress', projectKey, filters)
      
      case 'blocked':
        return sprintMetricsDetailsService.getIssuesByStatus(issues, 'Blocked', projectKey, filters)
      
      case 'done':
        return sprintMetricsDetailsService.getIssuesByStatus(issues, 'Done', projectKey, filters)
      
      default:
        return {
          issues: [],
          totalCount: 0,
          summary: {}
        }
    }
  },

  exportIssuesData: (issuesData, format = 'json') => {
    if (format === 'csv') {
      return exportToCSV(issuesData.issues)
    }
    
    if (format === 'excel') {
      return exportToExcel(issuesData.issues)
    }

    return {
      data: issuesData,
      exportedAt: new Date().toISOString(),
      format: 'json'
    }
  },

  getIssueAnalytics: (issues) => {
    if (!issues || issues.length === 0) {
      return {
        typeDistribution: {},
        priorityDistribution: {},
        statusDistribution: {},
        assigneeDistribution: {},
        projectDistribution: {}
      }
    }

    return {
      typeDistribution: getDistribution(issues, 'issueType'),
      priorityDistribution: getDistribution(issues, 'priority'),
      statusDistribution: getDistribution(issues, 'status'),
      assigneeDistribution: getDistribution(issues, 'assignee'),
      projectDistribution: getDistribution(issues, 'projectKey'),
      totalIssues: issues.length,
      totalStoryPoints: issues.reduce((sum, i) => sum + (i.storyPoints || 0), 0)
    }
  }
}

const getJiraBaseUrl = () => {
  return process.env.REACT_APP_JIRA_BASE_URL || 'https://your-domain.atlassian.net'
}

const applyDetailFilters = (issues, filters) => {
  let filtered = [...issues]

  if (filters.assignee && filters.assignee !== 'all') {
    filtered = filtered.filter(issue => issue.assignee === filters.assignee)
  }

  if (filters.priority && filters.priority !== 'all') {
    filtered = filtered.filter(issue => issue.priority === filters.priority)
  }

  if (filters.issueType && filters.issueType !== 'all') {
    filtered = filtered.filter(issue => issue.issueType === filters.issueType)
  }

  if (filters.minDelayDays) {
    filtered = filtered.filter(issue => (issue.delayDays || 0) >= filters.minDelayDays)
  }

  if (filters.search) {
    const searchLower = filters.search.toLowerCase()
    filtered = filtered.filter(issue => 
      issue.summary.toLowerCase().includes(searchLower) ||
      issue.key.toLowerCase().includes(searchLower)
    )
  }

  return filtered
}

const sortIssuesByDelay = (issues) => {
  return issues.sort((a, b) => (b.delayDays || 0) - (a.delayDays || 0))
}

const calculateAvgDelay = (issues) => {
  if (issues.length === 0) return 0
  const totalDelay = issues.reduce((sum, issue) => sum + (issue.delayDays || 0), 0)
  return parseFloat((totalDelay / issues.length).toFixed(1))
}

const calculateScopeCreepThreshold = (issues) => {
  const sortedDates = issues
    .map(issue => new Date(issue.fields?.created || 0))
    .sort((a, b) => a - b)
  
  const quarterIndex = Math.floor(sortedDates.length * 0.25)
  return sortedDates[quarterIndex] || new Date(0)
}

const categorizeScopeCreepReason = (issue) => {
  const summary = (issue.fields?.summary || '').toLowerCase()
  const labels = issue.fields?.labels || []
  
  if (summary.includes('bug') || summary.includes('fix')) {
    return 'Bug Fix'
  }
  
  if (summary.includes('urgent') || summary.includes('critical')) {
    return 'Urgent Requirement'
  }
  
  if (labels.some(label => label.toLowerCase().includes('enhancement'))) {
    return 'Enhancement'
  }
  
  return 'Scope Addition'
}

const calculateAvgStoryPoints = (issues) => {
  if (issues.length === 0) return 0
  const totalPoints = issues.reduce((sum, issue) => sum + (issue.storyPoints || 0), 0)
  return parseFloat((totalPoints / issues.length).toFixed(1))
}

const getReasonBreakdown = (issues) => {
  return issues.reduce((acc, issue) => {
    const reason = issue.reason || 'Unknown'
    acc[reason] = (acc[reason] || 0) + 1
    return acc
  }, {})
}

const calculateTimeInStatus = (issue, targetStatus) => {
  const updated = new Date(issue.fields?.updated || 0)
  const now = new Date()
  const hoursInStatus = (now - updated) / (1000 * 60 * 60)
  return parseFloat(hoursInStatus.toFixed(1))
}

const calculateAvgTimeInStatus = (issues) => {
  if (issues.length === 0) return 0
  const totalTime = issues.reduce((sum, issue) => sum + (issue.timeInStatus || 0), 0)
  return parseFloat((totalTime / issues.length).toFixed(1))
}

const getPriorityBreakdown = (issues) => {
  return getDistribution(issues, 'priority')
}

const getAssigneeBreakdown = (issues) => {
  return getDistribution(issues, 'assignee')
}

const getDistribution = (issues, field) => {
  return issues.reduce((acc, issue) => {
    const value = issue[field] || 'Unknown'
    acc[value] = (acc[value] || 0) + 1
    return acc
  }, {})
}

const exportToCSV = (issues) => {
  if (issues.length === 0) return ''

  const headers = Object.keys(issues[0]).filter(key => 
    typeof issues[0][key] !== 'object' || issues[0][key] === null
  )

  const csvContent = [
    headers.join(','),
    ...issues.map(issue => 
      headers.map(header => {
        const value = issue[header]
        return typeof value === 'string' && value.includes(',') 
          ? `"${value}"` 
          : value
      }).join(',')
    )
  ].join('\n')

  return csvContent
}

const exportToExcel = (issues) => {
  return {
    message: 'Excel export would require additional library (xlsx)',
    data: issues,
    format: 'json_for_excel'
  }
}