export const sprintMetricsDetailsService = {
  getLateIssuesDetails: (issues, projectKey = null, filters = {}) => {
    const targetIssues = projectKey 
      ? issues.filter(issue => {
          const issueProject = issue.displayFields?.projectKey || issue.fields?.project?.key
          return issueProject === projectKey
        })
      : issues

    const lateIssues = targetIssues.filter(issue => {
      const dueDate = issue.fields?.duedate
      const resolutionDate = issue.fields?.resolutiondate
      const status = issue.displayFields?.status || issue.fields?.status?.name

      if (!dueDate) return false

      const due = new Date(dueDate)
      const resolved = resolutionDate ? new Date(resolutionDate) : new Date()
      const isCompleted = status === 'Done' || status === 'Closed' || status === 'Resolved'

      return isCompleted ? resolved > due : new Date() > due
    })

    const enrichedLateIssues = lateIssues.map(issue => {
      const dueDate = new Date(issue.fields?.duedate)
      const resolutionDate = issue.fields?.resolutiondate 
        ? new Date(issue.fields.resolutiondate) 
        : new Date()
      
      const delayDays = Math.ceil((resolutionDate - dueDate) / (1000 * 60 * 60 * 24))
      const isStillOpen = !issue.fields?.resolutiondate

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
        dueDate: issue.fields?.duedate,
        resolutionDate: issue.fields?.resolutiondate,
        delayDays,
        isStillOpen,
        labels: issue.fields?.labels || [],
        components: issue.fields?.components?.map(c => c.name) || [],
        storyPoints: parseFloat(issue.fields?.storyPoints || issue.fields?.customfield_10004 || 0),
        jiraUrl: `${getJiraBaseUrl()}/browse/${issue.key}`
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
          const issueProject = issue.displayFields?.projectKey || issue.fields?.project?.key
          return issueProject === projectKey
        })
      : issues

    const scopeCreepThreshold = calculateScopeCreepThreshold(targetIssues)
    
    const scopeCreepIssues = targetIssues.filter(issue => {
      const created = new Date(issue.fields?.created || 0)
      return created >= scopeCreepThreshold
    })

    const enrichedScopeIssues = scopeCreepIssues.map(issue => {
      const created = new Date(issue.fields?.created)
      const daysAfterThreshold = Math.ceil((created - scopeCreepThreshold) / (1000 * 60 * 60 * 24))

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
        reporter: issue.fields?.reporter?.displayName || 'Unknown',
        daysAfterThreshold,
        labels: issue.fields?.labels || [],
        components: issue.fields?.components?.map(c => c.name) || [],
        storyPoints: parseFloat(issue.fields?.storyPoints || issue.fields?.customfield_10004 || 0),
        reason: categorizeScopeCreepReason(issue),
        jiraUrl: `${getJiraBaseUrl()}/browse/${issue.key}`
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
      storyPoints: parseFloat(issue.fields?.storyPoints || issue.fields?.customfield_10004 || 0),
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