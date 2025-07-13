import { JIRA_CONSTANTS } from '../../../constants/jiraConstants.js'

// Bug severity weights - matches old implementation
const SEVERITY_WEIGHTS = {
  Critical: 1.0,
  Major: 0.7,
  Medium: 0.5,
  Moderate: 0.5,
  Low: 0.3,
  Lowest: 0.1,
  Minor: 0.1,
}

// Bug severity configuration matching old source analysis
const BUG_SEVERITY_CONFIG = {
  normalizedSeverities: {
    // Direct severity mappings
    'CRITICAL': 'Critical',
    'MAJOR': 'Major', 
    'MEDIUM': 'Medium',
    'MODERATE': 'Medium',
    'LOW': 'Low',
    'LOWEST': 'Lowest',
    'MINOR': 'Lowest',
    'BLOCKER': 'Critical',
    // Priority mappings
    'P1': 'Critical',
    'P2': 'Major',
    'P3': 'Medium', 
    'P4': 'Low',
    'P5': 'Lowest',
    'TRIVIAL': 'Low',
    'HIGHEST': 'Critical',
    'HIGH': 'Major'
  },
  priorityMapping: {
    highest: ['CRITICAL', 'BLOCKER', 'P1', 'HIGHEST'],
    high: ['MAJOR', 'P2', 'HIGH'],
    medium: ['MEDIUM', 'MODERATE', 'P3'],
    low: ['LOW', 'P4', 'TRIVIAL'],
    lowest: ['LOWEST', 'P5', 'MINOR']
  },
  defaultSeverity: 'Medium'
}

// Get bug severity with sophisticated fallback logic (matches old source)
const getBugSeverity = (issue) => {
  const isBug = issue.fields?.issuetype?.name?.toUpperCase() === 'BUG'
  
  // Step 1: Check severity field first (primary source)
  const severityField = issue.fields?.[JIRA_CONSTANTS.CUSTOM_FIELDS.BUG_SEVERITY]
  if (severityField?.value) {
    const normalizedSeverity = BUG_SEVERITY_CONFIG.normalizedSeverities[severityField.value.toUpperCase()]
    if (normalizedSeverity) {
      return normalizedSeverity
    }
  }
  
  // Step 2: Priority field fallback
  const priority = issue.fields?.priority?.name
  if (priority) {
    const upperPriority = priority.toUpperCase()
    
    // Direct mapping check first
    const directMapping = BUG_SEVERITY_CONFIG.normalizedSeverities[upperPriority]
    if (directMapping) {
      return directMapping
    }
    
    // Special bug-specific logic (matches old source)
    if (isBug) {
      // Check if priority is in highest group
      if (BUG_SEVERITY_CONFIG.priorityMapping.highest.some(p => p === upperPriority)) {
        return 'Critical'
      }
      // Check if priority is in high group  
      if (BUG_SEVERITY_CONFIG.priorityMapping.high.some(p => p === upperPriority)) {
        return 'Major'
      }
      // Check if priority is in lowest group
      if (BUG_SEVERITY_CONFIG.priorityMapping.lowest.some(p => p === upperPriority)) {
        return 'Lowest'
      }
    }
  }
  
  // Step 3: Default severity assignment
  if (isBug) {
    return 'Major' // Default for bugs without severity/priority
  }
  
  return BUG_SEVERITY_CONFIG.defaultSeverity // 'Medium' for non-bugs
}

// Get severity weight
const getSeverityWeight = (severity) => {
  return SEVERITY_WEIGHTS[severity] || 0.5
}

// Check if high severity bug
const isHighSeverityBug = (issue) => {
  const severity = getBugSeverity(issue)
  return severity === 'Critical' || severity === 'Major'
}

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
          weightedBugCount: 0,
          highSeverityBugs: 0,
          severityBreakdown: {
            Critical: 0,
            Major: 0,
            Medium: 0,
            Low: 0,
            Lowest: 0
          },
          totalEffort: 0
        })
      }

      const project = projectMap.get(projectKey)
      project.issues.push(issue)

      const storyPoints = parseFloat(issue.fields?.storyPoints || issue.fields?.[JIRA_CONSTANTS.CUSTOM_FIELDS.STORY_POINTS] || 0)
      project.totalStoryPoints += storyPoints

      const issueType = issue.displayFields?.issueType || issue.fields?.issuetype?.name
      const status = issue.displayFields?.status || issue.fields?.status?.name

      // Process bugs with weighted severity system
      if (issueType === 'Bug') {
        project.bugs.push(issue)
        
        // Use sophisticated severity detection
        const severity = getBugSeverity(issue)
        const weight = getSeverityWeight(severity)
        
        // Add to weighted bug count
        project.weightedBugCount = (project.weightedBugCount || 0) + weight
        
        // Track severity breakdown
        if (project.severityBreakdown[severity] !== undefined) {
          project.severityBreakdown[severity] += 1
        }
        
        // Track high severity bugs separately (Critical + Major)
        if (isHighSeverityBug(issue)) {
          project.highSeverityBugs += 1
        }
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
    const totalBugs = project.bugs.length
    
    // Calculate progress using ISSUE COUNT method (old implementation)
    const progress = totalIssues > 0 
      ? Math.round((project.completedIssues / totalIssues) * 100)
      : 0
    
    // Calculate weighted bug rate (weighted bugs per 100 issues)
    const weightedBugRate = totalIssues > 0 
      ? (project.weightedBugCount / totalIssues) * 100 
      : 0
    
    // Calculate quality score using old formula
    const qualityScore = Math.max(1, 100 - weightedBugRate)
    
    // Calculate health score using old weighted formula
    const healthScore = (
      qualityScore * 0.4 +           // Quality Score (40%)
      (100 - weightedBugRate) * 0.3 + // Bug Rate (30%)
      progress * 0.3                  // Progress (30%)
    )
    
    const deliveryScore = calculateDeliveryScore(project)

    return {
      ...project,
      totalIssues,
      progress: Math.min(progress, 100),
      bugRate: parseFloat(weightedBugRate.toFixed(2)), // Now using weighted rate
      qualityScore: parseFloat(qualityScore.toFixed(2)),
      qualityStatus: getQualityStatus(qualityScore),
      healthScore: parseFloat(healthScore.toFixed(2)),
      health: getHealthStatus(healthScore),
      delivery: parseFloat(deliveryScore.toFixed(2)),
      effort: project.totalEffort,
      // Additional fields for compatibility
      plannedEffort: project.totalStoryPoints,
      weightedBugCount: parseFloat(weightedBugRate.toFixed(2))
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