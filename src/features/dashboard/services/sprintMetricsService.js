import { JIRA_CONSTANTS } from '../../../constants/jiraConstants.js'
import { 
  createDate, 
  getCurrentDate, 
  daysBetween, 
  isAfter 
} from '../../../shared/utils/dateUtils.js'

const SPRINT_FIELD = JIRA_CONSTANTS.CUSTOM_FIELDS.SPRINT

export const sprintMetricsService = {
  getAllSprintMetricsData: (allIssues, projects = []) => {
    if (!allIssues || allIssues.length === 0) {
      return {
        sprintTimelinessData: [],
        projectTimelinessData: {},
        sprintScopeCreepData: [],
        projectScopeCreepData: {},
        summary: {
          totalSprints: 0,
          totalProjects: 0,
          avgTimeliness: 0,
          avgScopeStability: 0
        }
      }
    }

    // Filter issues that have sprint data
    const validIssues = allIssues.filter(issue => 
      issue.fields?.[SPRINT_FIELD] && 
      issue.fields[SPRINT_FIELD].length > 0
    )

    if (validIssues.length === 0) {
      return {
        sprintTimelinessData: [],
        projectTimelinessData: {},
        sprintScopeCreepData: [],
        projectScopeCreepData: {},
        summary: {
          totalSprints: 0,
          totalProjects: 0,
          avgTimeliness: 0,
          avgScopeStability: 0
        }
      }
    }

    // Generate both formats as per old source analysis
    const sprintTimelinessData = getSprintTimelinessData(validIssues, projects)
    const projectTimelinessData = getSprintTimelinessDataByProject(validIssues, projects)
    const sprintScopeCreepData = getSprintScopeCreepData(validIssues, projects)
    const projectScopeCreepData = getSprintScopeCreepDataByProject(validIssues, projects)

    const summary = calculateSummaryMetrics(sprintTimelinessData, sprintScopeCreepData)

    return {
      sprintTimelinessData,
      projectTimelinessData,
      sprintScopeCreepData,
      projectScopeCreepData,
      summary
    }
  }
}

// TIMELINESS PROCESSING - Uses LAST sprint for completion point
const getSprintTimelinessData = (issues, selectedProjects) => {
  const sprintData = {}
  const projectNames = {}

  // Build project name mapping
  issues.forEach(issue => {
    const projectKey = issue.fields?.project?.key
    const projectName = issue.fields?.project?.name
    if (projectKey && projectName) {
      projectNames[projectKey] = projectName
    }
  })

  // Process each issue for timeliness
  issues.forEach(issue => {
    const projectKey = issue.fields?.project?.key
    if (!projectKey) return

    // Filter by selected projects if specified
    if (selectedProjects.length > 0 && !selectedProjects.includes(projectKey)) {
      return
    }

    // Skip if no resolution date
    if (!issue.fields?.resolutiondate) {
      return
    }

    // Get LAST sprint (completion point)
    const sprints = issue.fields[SPRINT_FIELD]
    const lastSprint = sprints[sprints.length - 1]

    if (!lastSprint || !lastSprint.endDate) {
      return // Skip issues without sprint end date
    }

    const sprintKey = `${lastSprint.id}_${lastSprint.name}`
    
    // Initialize sprint data
    if (!sprintData[sprintKey]) {
      sprintData[sprintKey] = {
        sprintId: lastSprint.id,
        sprintName: lastSprint.name,
        sprintStartDate: createDate(lastSprint.startDate),
        sprintEndDate: createDate(lastSprint.endDate),
        sprintState: lastSprint.state
      }
      
      // Initialize project counters for this sprint
      selectedProjects.forEach(projKey => {
        sprintData[sprintKey][`${projKey}_total`] = 0
        sprintData[sprintKey][`${projKey}_onTime`] = 0
        sprintData[sprintKey][`project_${projKey}_total`] = 0
        sprintData[sprintKey][`project_${projKey}_onTime`] = 0
      })
    }

    // Calculate timeliness
    const resolutionDate = createDate(issue.fields.resolutiondate)
    const sprintEndDate = createDate(lastSprint.endDate)
    const isOnTime = resolutionDate <= sprintEndDate

    // Update counters
    const totalKey = `${projectKey}_total`
    const onTimeKey = `${projectKey}_onTime`
    const projectTotalKey = `project_${projectKey}_total`
    const projectOnTimeKey = `project_${projectKey}_onTime`

    sprintData[sprintKey][totalKey] = (sprintData[sprintKey][totalKey] || 0) + 1
    sprintData[sprintKey][projectTotalKey] = (sprintData[sprintKey][projectTotalKey] || 0) + 1

    if (isOnTime) {
      sprintData[sprintKey][onTimeKey] = (sprintData[sprintKey][onTimeKey] || 0) + 1
      sprintData[sprintKey][projectOnTimeKey] = (sprintData[sprintKey][projectOnTimeKey] || 0) + 1
    }
  })

  // Generate final format with percentages
  return Object.values(sprintData).map(sprint => {
    const result = { ...sprint }
    
    selectedProjects.forEach(projectKey => {
      const total = sprint[`${projectKey}_total`] || 0
      const onTime = sprint[`${projectKey}_onTime`] || 0
      const percentage = total > 0 ? Math.round((onTime / total) * 100) : 0
      
      // Legacy format properties (as per old analysis)
      result[`project_${projectKey}`] = percentage
      result[projectNames[projectKey] || projectKey] = percentage
    })
    
    return result
  }).sort((a, b) => (a.sprintStartDate || 0) - (b.sprintStartDate || 0))
}

// PROJECT-CENTRIC TIMELINESS FORMAT (New format as per analysis)
const getSprintTimelinessDataByProject = (issues, selectedProjects) => {
  const projectData = {}

  issues.forEach(issue => {
    const projectKey = issue.fields?.project?.key
    if (!projectKey) return

    if (selectedProjects.length > 0 && !selectedProjects.includes(projectKey)) {
      return
    }

    if (!issue.fields?.resolutiondate) {
      return
    }

    // Get LAST sprint for timeliness
    const sprints = issue.fields[SPRINT_FIELD]
    const lastSprint = sprints[sprints.length - 1]

    if (!lastSprint || !lastSprint.endDate) {
      return
    }

    if (!projectData[projectKey]) {
      projectData[projectKey] = []
    }

    const resolutionDate = createDate(issue.fields.resolutiondate)
    const sprintEndDate = createDate(lastSprint.endDate)
    const isOnTime = resolutionDate <= sprintEndDate

    // Find or create sprint entry for this project
    let sprintEntry = projectData[projectKey].find(s => s.sprintId === lastSprint.id)
    if (!sprintEntry) {
      sprintEntry = {
        sprintName: lastSprint.name,
        sprintId: lastSprint.id,
        totalIssues: 0,
        onTimeIssues: 0,
        lateIssues: 0,
        totalTimeliness: 0
      }
      projectData[projectKey].push(sprintEntry)
    }

    sprintEntry.totalIssues += 1
    if (isOnTime) {
      sprintEntry.onTimeIssues += 1
    } else {
      sprintEntry.lateIssues += 1
    }
    
    // Calculate percentage
    sprintEntry.totalTimeliness = sprintEntry.totalIssues > 0 
      ? Math.round((sprintEntry.onTimeIssues / sprintEntry.totalIssues) * 100) 
      : 0
  })

  // Sort sprints within each project
  Object.keys(projectData).forEach(projectKey => {
    projectData[projectKey].sort((a, b) => a.sprintName.localeCompare(b.sprintName))
  })

  return projectData
}

// SCOPE CREEP PROCESSING - Uses FIRST sprint for planning point
const getSprintScopeCreepData = (issues, selectedProjects) => {
  const sprintData = {}
  const projectNames = {}

  // Build project name mapping
  issues.forEach(issue => {
    const projectKey = issue.fields?.project?.key
    const projectName = issue.fields?.project?.name
    if (projectKey && projectName) {
      projectNames[projectKey] = projectName
    }
  })

  // Process each issue for scope creep
  issues.forEach(issue => {
    const projectKey = issue.fields?.project?.key
    if (!projectKey) return

    if (selectedProjects.length > 0 && !selectedProjects.includes(projectKey)) {
      return
    }

    // Get FIRST sprint (planning point)
    const sprints = issue.fields[SPRINT_FIELD]
    const firstSprint = sprints[0]

    if (!firstSprint || !firstSprint.startDate) {
      return
    }

    const sprintKey = `${firstSprint.id}_${firstSprint.name}`
    
    // Initialize sprint data
    if (!sprintData[sprintKey]) {
      sprintData[sprintKey] = {
        sprintId: firstSprint.id,
        sprintName: firstSprint.name,
        sprintStartDate: createDate(firstSprint.startDate),
        sprintEndDate: createDate(firstSprint.endDate),
        sprintState: firstSprint.state
      }
      
      // Initialize project counters
      selectedProjects.forEach(projKey => {
        sprintData[sprintKey][`${projKey}_total`] = 0
        sprintData[sprintKey][`${projKey}_planned`] = 0
        sprintData[sprintKey][`${projKey}_added`] = 0
        sprintData[sprintKey][`project_${projKey}_total`] = 0
        sprintData[sprintKey][`project_${projKey}_planned`] = 0
        sprintData[sprintKey][`project_${projKey}_added`] = 0
      })
    }

    // Detect scope creep using changelog analysis (primary method)
    const hasCreep = detectScopeCreep(issue, firstSprint)

    // Update counters
    const totalKey = `${projectKey}_total`
    const plannedKey = `${projectKey}_planned`
    const addedKey = `${projectKey}_added`
    const projectTotalKey = `project_${projectKey}_total`
    const projectPlannedKey = `project_${projectKey}_planned`
    const projectAddedKey = `project_${projectKey}_added`

    sprintData[sprintKey][totalKey] = (sprintData[sprintKey][totalKey] || 0) + 1
    sprintData[sprintKey][projectTotalKey] = (sprintData[sprintKey][projectTotalKey] || 0) + 1

    if (hasCreep) {
      sprintData[sprintKey][addedKey] = (sprintData[sprintKey][addedKey] || 0) + 1
      sprintData[sprintKey][projectAddedKey] = (sprintData[sprintKey][projectAddedKey] || 0) + 1
    } else {
      sprintData[sprintKey][plannedKey] = (sprintData[sprintKey][plannedKey] || 0) + 1
      sprintData[sprintKey][projectPlannedKey] = (sprintData[sprintKey][projectPlannedKey] || 0) + 1
    }
  })

  // Generate final format with percentages
  return Object.values(sprintData).map(sprint => {
    const result = { ...sprint }
    
    selectedProjects.forEach(projectKey => {
      const total = sprint[`${projectKey}_total`] || 0
      const added = sprint[`${projectKey}_added`] || 0
      const percentage = total > 0 ? Math.round((added / total) * 100) : 0
      
      // Legacy format properties
      result[`project_${projectKey}`] = percentage
      result[projectNames[projectKey] || projectKey] = percentage
    })
    
    return result
  }).sort((a, b) => (a.sprintStartDate || 0) - (b.sprintStartDate || 0))
}

// PROJECT-CENTRIC SCOPE CREEP FORMAT
const getSprintScopeCreepDataByProject = (issues, selectedProjects) => {
  const projectData = {}

  issues.forEach(issue => {
    const projectKey = issue.fields?.project?.key
    if (!projectKey) return

    if (selectedProjects.length > 0 && !selectedProjects.includes(projectKey)) {
      return
    }

    // Get FIRST sprint for scope creep
    const sprints = issue.fields[SPRINT_FIELD]
    const firstSprint = sprints[0]

    if (!firstSprint || !firstSprint.startDate) {
      return
    }

    if (!projectData[projectKey]) {
      projectData[projectKey] = []
    }

    const hasCreep = detectScopeCreep(issue, firstSprint)

    // Find or create sprint entry
    let sprintEntry = projectData[projectKey].find(s => s.sprintId === firstSprint.id)
    if (!sprintEntry) {
      sprintEntry = {
        sprintName: firstSprint.name,
        sprintId: firstSprint.id,
        totalIssues: 0,
        plannedIssues: 0,
        addedIssues: 0,
        scopeCreepRate: 0
      }
      projectData[projectKey].push(sprintEntry)
    }

    sprintEntry.totalIssues += 1
    if (hasCreep) {
      sprintEntry.addedIssues += 1
    } else {
      sprintEntry.plannedIssues += 1
    }
    
    // Calculate percentage
    sprintEntry.scopeCreepRate = sprintEntry.totalIssues > 0 
      ? Math.round((sprintEntry.addedIssues / sprintEntry.totalIssues) * 100) 
      : 0
  })

  // Sort sprints within each project
  Object.keys(projectData).forEach(projectKey => {
    projectData[projectKey].sort((a, b) => a.sprintName.localeCompare(b.sprintName))
  })

  return projectData
}

// SCOPE CREEP DETECTION - Complex multi-layer logic as per old analysis
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

// SUMMARY METRICS CALCULATION
const calculateSummaryMetrics = (timelinessData, scopeCreepData) => {
  const totalSprints = new Set([
    ...timelinessData.map(s => s.sprintId),
    ...scopeCreepData.map(s => s.sprintId)
  ]).size

  const avgTimeliness = timelinessData.length > 0
    ? timelinessData.reduce((sum, sprint) => {
        const projectKeys = Object.keys(sprint).filter(key => key.startsWith('project_') && !key.includes('_total') && !key.includes('_onTime'))
        const sprintAvg = projectKeys.reduce((acc, key) => acc + (sprint[key] || 0), 0) / Math.max(projectKeys.length, 1)
        return sum + sprintAvg
      }, 0) / timelinessData.length
    : 0

  const avgScopeStability = scopeCreepData.length > 0
    ? 100 - (scopeCreepData.reduce((sum, sprint) => {
        const projectKeys = Object.keys(sprint).filter(key => key.startsWith('project_') && !key.includes('_total') && !key.includes('_planned') && !key.includes('_added'))
        const sprintAvg = projectKeys.reduce((acc, key) => acc + (sprint[key] || 0), 0) / Math.max(projectKeys.length, 1)
        return sum + sprintAvg
      }, 0) / scopeCreepData.length)
    : 100

  return {
    totalSprints,
    totalProjects: 0, // Will be calculated by caller if needed
    avgTimeliness: Math.round(avgTimeliness * 100) / 100,
    avgScopeStability: Math.round(avgScopeStability * 100) / 100
  }
}

export default sprintMetricsService