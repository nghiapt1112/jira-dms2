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
          highSeverityBugs: 0,
          mediumSeverityBugs: 0,
          lowSeverityBugs: 0,
          totalEffort: 0
        })
      }

      const project = projectMap.get(projectKey)
      project.issues.push(issue)

      const storyPoints = parseFloat(issue.fields?.storyPoints || issue.fields?.customfield_10004 || 0)
      project.totalStoryPoints += storyPoints

      const issueType = issue.displayFields?.issueType || issue.fields?.issuetype?.name
      const status = issue.displayFields?.status || issue.fields?.status?.name
      const priority = issue.fields?.priority?.name || 'Medium'

      if (issueType === 'Bug') {
        project.bugs.push(issue)
        
        if (priority === 'Critical' || priority === 'High') {
          project.highSeverityBugs += 1
        } else if (priority === 'Medium') {
          project.mediumSeverityBugs += 1
        } else {
          project.lowSeverityBugs += 1
        }
      }

      if (status === 'Done' || status === 'Closed' || status === 'Resolved') {
        project.completedStoryPoints += storyPoints
      }

      project.totalEffort += storyPoints || 1

    } catch (error) {
      console.warn('Error processing issue for project overview:', error, issue)
    }
  })

  return Array.from(projectMap.values()).map(project => {
    const totalIssues = project.issues.length
    const totalBugs = project.bugs.length
    const bugRate = totalIssues > 0 ? (totalBugs / totalIssues) * 100 : 0
    const progress = project.totalStoryPoints > 0 
      ? (project.completedStoryPoints / project.totalStoryPoints) * 100 
      : 0

    const qualityScore = calculateQualityScore(project, bugRate)
    const healthScore = calculateHealthScore(qualityScore, bugRate, progress)
    const deliveryScore = calculateDeliveryScore(project)

    return {
      ...project,
      progress: Math.min(progress, 100),
      bugRate: parseFloat(bugRate.toFixed(2)),
      qualityScore: parseFloat(qualityScore.toFixed(2)),
      qualityStatus: getQualityStatus(qualityScore),
      healthScore: parseFloat(healthScore.toFixed(2)),
      health: getHealthStatus(healthScore),
      delivery: parseFloat(deliveryScore.toFixed(2)),
      effort: project.totalEffort
    }
  })
}

const calculateQualityScore = (project, bugRate) => {
  const bugWeight = 0.6
  const severityWeight = 0.4
  
  const bugPenalty = Math.min(bugRate * 2, 50)
  
  const severityPenalty = (
    project.highSeverityBugs * 5 + 
    project.mediumSeverityBugs * 2 + 
    project.lowSeverityBugs * 0.5
  )
  
  const maxScore = 100
  const qualityScore = maxScore - (bugPenalty * bugWeight) - (severityPenalty * severityWeight)
  
  return Math.max(qualityScore, 0)
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
  if (score >= 80) return 'Excellent'
  if (score >= 60) return 'Good'
  if (score >= 40) return 'Fair'
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