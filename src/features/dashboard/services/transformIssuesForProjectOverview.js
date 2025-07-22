import { JIRA_CONSTANTS } from '../../../constants/jiraConstants.js'
import { 
  calculateSeverityBreakdown, 
  calculateWeightedBugRate,
  calculateBugRateMetrics
} from '../../../shared/utils/severityCalculations.js'

export const transformIssuesForProjectOverview = (issues) => {
  if (!issues || !Array.isArray(issues) || issues.length === 0) {
    return []
  }

  const projectMap = new Map()

  issues.forEach(issue => {
    try {
      const projectKey = issue.displayFields?.projectKey || issue.fields?.project?.key
      const projectName = issue.displayFields?.projectName || issue.fields?.project?.name
      
      if (!projectKey) return

      if (!projectMap.has(projectKey)) {
        projectMap.set(projectKey, {
          id: projectKey,
          name: projectName || projectKey,
          projectKey,
          issues: [],
          bugs: [],
          totalStoryPoints: 0,
          completedStoryPoints: 0,
          completedIssues: 0,
          totalEffort: 0
        })
      }

      const project = projectMap.get(projectKey)
      project.issues.push(issue)

      const storyPoints = parseFloat(issue.fields?.storyPoints || issue.fields?.[JIRA_CONSTANTS.CUSTOM_FIELDS.STORY_POINTS] || 0)
      project.totalStoryPoints += storyPoints

      const issueType = issue.displayFields?.issueType || issue.fields?.issuetype?.name
      const status = issue.displayFields?.status || issue.fields?.status?.name

      // Collect bugs for centralized processing
      if (issueType === 'Bug') {
        project.bugs.push(issue)
      }

      // Track completed issues for progress calculation (old method)
      if (status === 'Done' || status === 'Closed' || status === 'Resolved') {
        project.completedIssues = (project.completedIssues || 0) + 1
        project.completedStoryPoints += storyPoints
      }

      project.totalEffort += storyPoints || 1

    } catch (error) {
      console.warn('Error processing issue for project overview:', error, issue)
    }
  })

  return Array.from(projectMap.values()).map(project => {
    const totalIssues = project.issues.length
    
    // Calculate progress using ISSUE COUNT method (old implementation)
    const progress = totalIssues > 0 
      ? Math.round((project.completedIssues / totalIssues) * 100)
      : 0
    
    // Use centralized bug rate calculations
    const bugMetrics = calculateBugRateMetrics(project.bugs, totalIssues, project.projectKey)
    const deliveryScore = calculateDeliveryScore(project)
    
    // Calculate health score using centralized quality metrics
    const healthScore = (
      bugMetrics.qualityEfficiency * 0.4 +           // Quality Score (40%)
      (100 - bugMetrics.weightedBugRate) * 0.3 +     // Bug Rate (30%)
      progress * 0.3                                  // Progress (30%)
    )

    return {
      ...project,
      totalIssues,
      progress: Math.min(progress, 100),
      bugRate: parseFloat(bugMetrics.weightedBugRate.toFixed(2)),
      qualityScore: parseFloat(bugMetrics.qualityEfficiency.toFixed(2)),
      qualityStatus: getQualityStatus(bugMetrics.qualityEfficiency),
      healthScore: parseFloat(healthScore.toFixed(2)),
      health: getHealthStatus(healthScore),
      delivery: parseFloat(deliveryScore.toFixed(2)),
      effort: project.totalEffort,
      // Additional fields from centralized calculations
      plannedEffort: project.totalStoryPoints,
      severityBreakdown: bugMetrics.severityBreakdown,
      highSeverityBugs: (bugMetrics.severityBreakdown.Critical || 0) + (bugMetrics.severityBreakdown.Major || 0),
      weightedBugCount: parseFloat(bugMetrics.weightedBugRate.toFixed(2))
    }
  })
}


const calculateHealthScore = (qualityScore, bugRate, progress) => {
  const qualityWeight = 0.4
  const bugRateWeight = 0.3
  const progressWeight = 0.3
  
  const bugRatePenalty = Math.min(bugRate * 1.5, 30)
  const progressBonus = progress * 0.8
  
  const healthScore = (qualityScore * qualityWeight) + 
                     ((100 - bugRatePenalty) * bugRateWeight) + 
                     (progressBonus * progressWeight)
  
  return Math.max(Math.min(healthScore, 100), 0)
}

const calculateDeliveryScore = (project) => {
  const totalIssues = project.issues.length
  if (totalIssues === 0) return 0

  const completedIssues = project.issues.filter(issue => {
    const status = issue.displayFields?.status || issue.fields?.status?.name
    return status === 'Done' || status === 'Closed' || status === 'Resolved'
  }).length

  const deliveryRate = (completedIssues / totalIssues) * 100

  const sprintPerformance = project.totalStoryPoints > 0 
    ? (project.completedStoryPoints / project.totalStoryPoints) * 100 
    : deliveryRate

  return (deliveryRate * 0.6) + (sprintPerformance * 0.4)
}

const getQualityStatus = (score) => {
  // Match old implementation thresholds exactly
  if (score >= 90) return 'Excellent'
  if (score >= 80) return 'Good'
  if (score >= 70) return 'Satisfactory'
  if (score >= 60) return 'Needs Improvement'
  return 'Poor'
}

const getHealthStatus = (score) => {
  if (score >= 80) return 'Healthy'
  if (score >= 60) return 'Moderate'
  if (score >= 40) return 'At Risk'
  return 'Critical'
}

export const getProjectMetrics = (transformedProjects) => {
  if (!transformedProjects || transformedProjects.length === 0) {
    return {
      totalProjects: 0,
      avgQualityScore: 0,
      avgHealthScore: 0,
      avgDeliveryScore: 0,
      totalBugs: 0,
      totalStoryPoints: 0,
      avgBugRate: 0
    }
  }

  const totalProjects = transformedProjects.length
  const totalQuality = transformedProjects.reduce((sum, p) => sum + p.qualityScore, 0)
  const totalHealth = transformedProjects.reduce((sum, p) => sum + p.healthScore, 0)
  const totalDelivery = transformedProjects.reduce((sum, p) => sum + p.delivery, 0)
  const totalBugs = transformedProjects.reduce((sum, p) => sum + p.bugs.length, 0)
  const totalStoryPoints = transformedProjects.reduce((sum, p) => sum + p.totalStoryPoints, 0)
  const totalBugRate = transformedProjects.reduce((sum, p) => sum + p.bugRate, 0)

  return {
    totalProjects,
    avgQualityScore: parseFloat((totalQuality / totalProjects).toFixed(2)),
    avgHealthScore: parseFloat((totalHealth / totalProjects).toFixed(2)),
    avgDeliveryScore: parseFloat((totalDelivery / totalProjects).toFixed(2)),
    totalBugs,
    totalStoryPoints,
    avgBugRate: parseFloat((totalBugRate / totalProjects).toFixed(2))
  }
}