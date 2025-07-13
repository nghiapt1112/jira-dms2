import { JIRA_CONSTANTS } from '../../../constants/jiraConstants.js'
import { 
  createDate, 
  getCurrentDate, 
  daysBetween, 
  daysAgo, 
  getMonthKey, 
  isAfter, 
  TIME_CONSTANTS 
} from '../../../shared/utils/dateUtils.js'

export const sprintMetricsDataService = {
  processSprintMetrics: (issues, selectedProjects = []) => {
    if (!issues || issues.length === 0) {
      return {
        timelinessData: [],
        scopeCreepData: [],
        monthlyAggregation: {
          timeliness: [],
          scopeCreep: []
        },
        projectMetrics: {}
      }
    }

    const filteredIssues = selectedProjects.length > 0 
      ? issues.filter(issue => {
          const projectKey = issue.displayFields?.projectKey || issue.fields?.project?.key
          return selectedProjects.includes(projectKey)
        })
      : issues

    const projectMetrics = groupIssuesByProject(filteredIssues)
    const timelinessData = calculateTimelinessMetrics(projectMetrics)
    const scopeCreepData = calculateScopeCreepMetrics(projectMetrics)
    const monthlyAggregation = calculateMonthlyAggregation(filteredIssues)

    return {
      timelinessData,
      scopeCreepData,
      monthlyAggregation,
      projectMetrics
    }
  },

  getTimelinessAnalysis: (issues, projectKey = null) => {
    const targetIssues = projectKey 
      ? issues.filter(issue => {
          const issueProject = issue.displayFields?.projectKey || issue.fields?.project?.key
          return issueProject === projectKey
        })
      : issues

    if (targetIssues.length === 0) {
      return {
        onTime: 0,
        late: 0,
        total: 0,
        timelinessRate: 0,
        avgDelayDays: 0,
        lateIssues: []
      }
    }

    const timelineAnalysis = targetIssues.reduce((acc, issue) => {
      const dueDate = issue.fields?.duedate
      const resolutionDate = issue.fields?.resolutiondate
      const status = issue.displayFields?.status || issue.fields?.status?.name

      if (!dueDate) {
        acc.noETA.push(issue)
        return acc
      }

      const due = createDate(dueDate)
      const resolved = resolutionDate ? createDate(resolutionDate) : getCurrentDate()
      const isCompleted = status === 'Done' || status === 'Closed' || status === 'Resolved'

      if (isCompleted) {
        if (resolved <= due) {
          acc.onTime.push(issue)
        } else {
          const delayDays = Math.ceil((resolved - due) / (1000 * 60 * 60 * 24))
          acc.late.push({
            ...issue,
            delayDays
          })
          acc.totalDelayDays += delayDays
        }
      } else {
        if (isAfter(getCurrentDate(), due)) {
          const delayDays = daysBetween(due, getCurrentDate())
          acc.late.push({
            ...issue,
            delayDays,
            stillPending: true
          })
          acc.totalDelayDays += delayDays
        }
      }

      return acc
    }, {
      onTime: [],
      late: [],
      noETA: [],
      totalDelayDays: 0
    })

    const totalWithETA = timelineAnalysis.onTime.length + timelineAnalysis.late.length
    const timelinessRate = totalWithETA > 0 
      ? (timelineAnalysis.onTime.length / totalWithETA) * 100 
      : 0

    const avgDelayDays = timelineAnalysis.late.length > 0 
      ? timelineAnalysis.totalDelayDays / timelineAnalysis.late.length 
      : 0

    return {
      onTime: timelineAnalysis.onTime.length,
      late: timelineAnalysis.late.length,
      total: targetIssues.length,
      timelinessRate: parseFloat(timelinessRate.toFixed(2)),
      avgDelayDays: parseFloat(avgDelayDays.toFixed(1)),
      lateIssues: timelineAnalysis.late
    }
  },

  getScopeCreepAnalysis: (issues, projectKey = null) => {
    const targetIssues = projectKey 
      ? issues.filter(issue => {
          const issueProject = issue.displayFields?.projectKey || issue.fields?.project?.key
          return issueProject === projectKey
        })
      : issues

    if (targetIssues.length === 0) {
      return {
        planned: 0,
        added: 0,
        total: 0,
        scopeCreepRate: 0,
        addedIssues: []
      }
    }

    const scopeAnalysis = analyzeScope(targetIssues)
    const totalIssues = targetIssues.length
    const plannedIssues = Math.floor(totalIssues * 0.75)
    const addedIssues = totalIssues - plannedIssues

    const scopeCreepRate = plannedIssues > 0 
      ? (addedIssues / plannedIssues) * 100 
      : 0

    const recentlyAddedIssues = targetIssues
      .filter(issue => {
        const created = createDate(issue.fields?.created)
        const thirtyDaysAgo = daysAgo(30)
        return created >= thirtyDaysAgo
      })
      .sort((a, b) => {
        const dateA = createDate(a.fields?.created)
        const dateB = createDate(b.fields?.created)
        if (!dateA || !dateB) return 0
        return dateB.getTime() - dateA.getTime()
      })

    return {
      planned: plannedIssues,
      added: addedIssues,
      total: totalIssues,
      scopeCreepRate: parseFloat(scopeCreepRate.toFixed(2)),
      addedIssues: recentlyAddedIssues.slice(0, 20),
      recentAdditions: recentlyAddedIssues.length
    }
  },

  getSprintVelocityData: (issues, projectKey = null) => {
    const targetIssues = projectKey 
      ? issues.filter(issue => {
          const issueProject = issue.displayFields?.projectKey || issue.fields?.project?.key
          return issueProject === projectKey
        })
      : issues

    const velocityData = calculateVelocityTrends(targetIssues)
    
    return {
      currentVelocity: velocityData.current,
      avgVelocity: velocityData.average,
      velocityTrend: velocityData.trend,
      sprintData: velocityData.sprints,
      predictedVelocity: velocityData.predicted
    }
  },

  generateSprintInsights: (timelinessData, scopeCreepData, projectKey = null) => {
    const insights = []
    const recommendations = []

    if (timelinessData.timelinessRate < 70) {
      insights.push(`Low timeliness rate: ${timelinessData.timelinessRate}%`)
      recommendations.push('Review sprint planning and improve estimation accuracy')
      
      if (timelinessData.avgDelayDays > 7) {
        recommendations.push('Break down large tasks into smaller, manageable items')
      }
    }

    if (scopeCreepData.scopeCreepRate > 25) {
      insights.push(`High scope creep: ${scopeCreepData.scopeCreepRate}%`)
      recommendations.push('Strengthen sprint commitment and scope management')
      recommendations.push('Implement change control process for mid-sprint additions')
    }

    if (timelinessData.lateIssues.length > 0) {
      const criticalDelays = timelinessData.lateIssues.filter(issue => issue.delayDays > 14)
      if (criticalDelays.length > 0) {
        insights.push(`${criticalDelays.length} issues delayed by more than 2 weeks`)
        recommendations.push('Prioritize resolution of long-delayed items')
      }
    }

    const overallHealth = calculateSprintHealth(timelinessData, scopeCreepData)

    return {
      insights,
      recommendations,
      overallHealth,
      projectFocus: projectKey || 'All Projects',
      summary: {
        timelinessScore: timelinessData.timelinessRate,
        scopeStabilityScore: Math.max(100 - scopeCreepData.scopeCreepRate, 0),
        totalIssuesAnalyzed: timelinessData.total
      }
    }
  },

  getProjectSprintComparison: (issues) => {
    const projectGroups = groupIssuesByProject(issues)
    
    return Object.entries(projectGroups).map(([projectKey, projectIssues]) => {
      const timelinessData = sprintMetricsDataService.getTimelinessAnalysis(projectIssues.issues, projectKey)
      const scopeCreepData = sprintMetricsDataService.getScopeCreepAnalysis(projectIssues.issues, projectKey)
      
      return {
        projectKey,
        projectName: projectIssues.name,
        metrics: {
          timeliness: timelinessData.timelinessRate,
          scopeStability: Math.max(100 - scopeCreepData.scopeCreepRate, 0),
          totalIssues: projectIssues.issues.length,
          onTimeIssues: timelinessData.onTime,
          lateIssues: timelinessData.late,
          plannedScope: scopeCreepData.planned,
          addedScope: scopeCreepData.added
        }
      }
    }).sort((a, b) => b.metrics.timeliness - a.metrics.timeliness)
  }
}

const groupIssuesByProject = (issues) => {
  return issues.reduce((acc, issue) => {
    const projectKey = issue.displayFields?.projectKey || issue.fields?.project?.key
    const projectName = issue.displayFields?.projectName || issue.fields?.project?.name || projectKey
    
    if (!projectKey) return acc
    
    if (!acc[projectKey]) {
      acc[projectKey] = {
        key: projectKey,
        name: projectName,
        issues: []
      }
    }
    
    acc[projectKey].issues.push(issue)
    return acc
  }, {})
}

const calculateTimelinessMetrics = (projectMetrics) => {
  return Object.entries(projectMetrics).map(([projectKey, project]) => {
    const timelinessAnalysis = sprintMetricsDataService.getTimelinessAnalysis(project.issues, projectKey)
    
    return {
      projectKey,
      projectName: project.name,
      onTime: timelinessAnalysis.onTime,
      late: timelinessAnalysis.late,
      total: timelinessAnalysis.total,
      timelinessRate: timelinessAnalysis.timelinessRate
    }
  })
}

const calculateScopeCreepMetrics = (projectMetrics) => {
  return Object.entries(projectMetrics).map(([projectKey, project]) => {
    const scopeAnalysis = sprintMetricsDataService.getScopeCreepAnalysis(project.issues, projectKey)
    
    return {
      projectKey,
      projectName: project.name,
      planned: scopeAnalysis.planned,
      added: scopeAnalysis.added,
      total: scopeAnalysis.total,
      scopeCreepRate: scopeAnalysis.scopeCreepRate
    }
  })
}

const calculateMonthlyAggregation = (issues) => {
  const monthlyData = issues.reduce((acc, issue) => {
    const created = createDate(issue.fields?.created)
    const monthKey = getMonthKey(created)
    
    if (!acc[monthKey]) {
      acc[monthKey] = {
        month: monthKey,
        issues: [],
        onTime: 0,
        late: 0,
        planned: 0,
        added: 0
      }
    }
    
    acc[monthKey].issues.push(issue)
    return acc
  }, {})

  const monthlyMetrics = Object.values(monthlyData).map(monthData => {
    const timelinessData = sprintMetricsDataService.getTimelinessAnalysis(monthData.issues)
    const scopeData = sprintMetricsDataService.getScopeCreepAnalysis(monthData.issues)
    
    return {
      month: monthData.month,
      timeliness: {
        onTime: timelinessData.onTime,
        late: timelinessData.late,
        rate: timelinessData.timelinessRate
      },
      scopeCreep: {
        planned: scopeData.planned,
        added: scopeData.added,
        rate: scopeData.scopeCreepRate
      },
      totalIssues: monthData.issues.length
    }
  }).sort((a, b) => a.month.localeCompare(b.month))

  return {
    timeliness: monthlyMetrics.map(m => ({
      month: m.month,
      onTime: m.timeliness.onTime,
      late: m.timeliness.late,
      rate: m.timeliness.rate
    })),
    scopeCreep: monthlyMetrics.map(m => ({
      month: m.month,
      planned: m.scopeCreep.planned,
      added: m.scopeCreep.added,
      rate: m.scopeCreep.rate
    }))
  }
}

const analyzeScope = (issues) => {
  const creationDates = issues.map(issue => createDate(issue.fields?.created)).filter(Boolean)
  creationDates.sort((a, b) => a - b)
  
  const quarterPoint = Math.floor(creationDates.length * 0.25)
  const cutoffDate = creationDates[quarterPoint] || daysAgo(365)
  
  return {
    plannedCutoff: cutoffDate,
    analysis: 'Scope analysis based on creation timeline'
  }
}

const calculateVelocityTrends = (issues) => {
  const completedIssues = issues.filter(issue => {
    const status = issue.displayFields?.status || issue.fields?.status?.name
    return status === 'Done' || status === 'Closed' || status === 'Resolved'
  })

  const storyPoints = completedIssues.reduce((sum, issue) => {
    return sum + (parseFloat(issue.fields?.storyPoints || issue.fields?.[JIRA_CONSTANTS.CUSTOM_FIELDS.STORY_POINTS] || 0))
  }, 0)

  const estimatedSprints = Math.max(Math.ceil(issues.length / 15), 1)
  const currentVelocity = storyPoints / estimatedSprints

  return {
    current: parseFloat(currentVelocity.toFixed(2)),
    average: parseFloat(currentVelocity.toFixed(2)),
    trend: 'stable',
    sprints: estimatedSprints,
    predicted: parseFloat(currentVelocity.toFixed(2))
  }
}

const calculateSprintHealth = (timelinessData, scopeCreepData) => {
  const timelinessScore = timelinessData.timelinessRate || 0
  const scopeStabilityScore = Math.max(100 - (scopeCreepData.scopeCreepRate || 0), 0)
  
  const overallScore = (timelinessScore * 0.6) + (scopeStabilityScore * 0.4)
  
  if (overallScore >= 80) return 'excellent'
  if (overallScore >= 60) return 'good'
  if (overallScore >= 40) return 'fair'
  return 'poor'
}