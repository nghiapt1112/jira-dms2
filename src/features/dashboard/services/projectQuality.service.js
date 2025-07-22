import { parseSeverity } from '../../../shared/utils/severityParser.js'
import { SEVERITY_LEVELS, initializeSeverityBreakdown } from '../../../shared/constants/severityConstants.js'

export const projectQualityService = {
  calculateQualityMetrics: (project) => {
    if (!project || !project.issues) {
      return {
        qualityScore: 0,
        bugDensity: 0,
        defectRemovalEfficiency: 0,
        codeQualityIndex: 0,
        testCoverage: 0,
        technicalDebt: 0
      }
    }

    const totalIssues = project.issues.length
    const bugs = project.bugs || []
    const totalBugs = bugs.length

    const bugDensity = totalIssues > 0 ? (totalBugs / totalIssues) * 100 : 0
    
    const qualityScore = calculateQualityScore(project, bugDensity)
    const defectRemovalEfficiency = calculateDefectRemovalEfficiency(bugs)
    const codeQualityIndex = calculateCodeQualityIndex(project)
    const testCoverage = estimateTestCoverage(project)
    const technicalDebt = calculateTechnicalDebt(project)

    return {
      qualityScore: parseFloat(qualityScore.toFixed(2)),
      bugDensity: parseFloat(bugDensity.toFixed(2)),
      defectRemovalEfficiency: parseFloat(defectRemovalEfficiency.toFixed(2)),
      codeQualityIndex: parseFloat(codeQualityIndex.toFixed(2)),
      testCoverage: parseFloat(testCoverage.toFixed(2)),
      technicalDebt: parseFloat(technicalDebt.toFixed(2))
    }
  },

  analyzeBugSeverityDistribution: (bugs) => {
    if (!bugs || bugs.length === 0) {
      return {
        [SEVERITY_LEVELS.CRITICAL]: 0,
        [SEVERITY_LEVELS.MAJOR]: 0,
        [SEVERITY_LEVELS.MINOR]: 0,
        [SEVERITY_LEVELS.LOW]: 0,
        [SEVERITY_LEVELS.COSMETIC]: 0,
        total: 0,
        severityScore: 0
      }
    }

    const distribution = bugs.reduce((acc, bug) => {
      // Use centralized severity parser instead of custom logic
      const severityResult = parseSeverity(bug, bug.fields?.project?.key)
      const severity = severityResult.severity
      
      // Use centralized severity levels
      if (acc[severity] !== undefined) {
        acc[severity] += 1
      } else {
        // Fallback to Minor for unknown values (matches severityParser default)
        acc[SEVERITY_LEVELS.MINOR] += 1
      }
      
      return acc
    }, initializeSeverityBreakdown())

    const total = bugs.length
    const severityScore = calculateSeverityScore(distribution, total)

    return {
      ...distribution,
      total,
      severityScore: parseFloat(severityScore.toFixed(2)),
      percentages: {
        [SEVERITY_LEVELS.CRITICAL]: parseFloat(((distribution[SEVERITY_LEVELS.CRITICAL] / total) * 100).toFixed(1)),
        [SEVERITY_LEVELS.MAJOR]: parseFloat(((distribution[SEVERITY_LEVELS.MAJOR] / total) * 100).toFixed(1)),
        [SEVERITY_LEVELS.MINOR]: parseFloat(((distribution[SEVERITY_LEVELS.MINOR] / total) * 100).toFixed(1)),
        [SEVERITY_LEVELS.LOW]: parseFloat(((distribution[SEVERITY_LEVELS.LOW] / total) * 100).toFixed(1)),
        [SEVERITY_LEVELS.COSMETIC]: parseFloat(((distribution[SEVERITY_LEVELS.COSMETIC] / total) * 100).toFixed(1))
      }
    }
  },

  getQualityTrends: (projectHistory) => {
    if (!projectHistory || projectHistory.length < 2) {
      return {
        trend: 'stable',
        direction: 0,
        changePercent: 0,
        recommendation: 'Insufficient data for trend analysis'
      }
    }

    const recent = projectHistory[projectHistory.length - 1]
    const previous = projectHistory[projectHistory.length - 2]

    const qualityChange = (recent.qualityScore || 0) - (previous.qualityScore || 0)
    const bugRateChange = (recent.bugRate || 0) - (previous.bugRate || 0)

    const changePercent = previous.qualityScore > 0 
      ? (qualityChange / previous.qualityScore) * 100 
      : 0

    let trend = 'stable'
    let recommendation = 'Continue current practices'

    if (Math.abs(changePercent) > 5) {
      if (changePercent > 0) {
        trend = 'improving'
        recommendation = 'Quality is improving, maintain current development practices'
      } else {
        trend = 'declining'
        recommendation = 'Quality declining, review development processes and increase testing'
      }
    }

    return {
      trend,
      direction: Math.sign(changePercent),
      changePercent: parseFloat(changePercent.toFixed(2)),
      qualityChange: parseFloat(qualityChange.toFixed(2)),
      bugRateChange: parseFloat(bugRateChange.toFixed(2)),
      recommendation
    }
  },

  identifyQualityIssues: (project, thresholds = {}) => {
    const defaultThresholds = {
      minQualityScore: 70,
      maxBugRate: 10,
      maxCriticalBugs: 5,
      minTestCoverage: 80,
      ...thresholds
    }

    const issues = []
    const recommendations = []

    const qualityScore = project.qualityScore || 0
    const bugRate = project.bugRate || 0
    const criticalBugs = project.highSeverityBugs || 0

    if (qualityScore < defaultThresholds.minQualityScore) {
      issues.push({
        type: 'low_quality_score',
        severity: qualityScore < 50 ? 'high' : 'medium',
        description: `Quality score (${qualityScore}) below threshold (${defaultThresholds.minQualityScore})`,
        impact: 'Overall project quality'
      })
      recommendations.push('Implement code review processes and automated quality checks')
    }

    if (bugRate > defaultThresholds.maxBugRate) {
      issues.push({
        type: 'high_bug_rate',
        severity: bugRate > 20 ? 'high' : 'medium',
        description: `Bug rate (${bugRate}%) above threshold (${defaultThresholds.maxBugRate}%)`,
        impact: 'User experience and maintenance cost'
      })
      recommendations.push('Focus on bug prevention through better testing and code reviews')
    }

    if (criticalBugs > defaultThresholds.maxCriticalBugs) {
      issues.push({
        type: 'critical_bugs',
        severity: 'high',
        description: `${criticalBugs} critical bugs exceed threshold (${defaultThresholds.maxCriticalBugs})`,
        impact: 'System stability and user trust'
      })
      recommendations.push('Prioritize immediate fixing of critical bugs')
    }

    const technicalDebtLevel = calculateTechnicalDebt(project)
    if (technicalDebtLevel > 60) {
      issues.push({
        type: 'technical_debt',
        severity: technicalDebtLevel > 80 ? 'high' : 'medium',
        description: `High technical debt level (${technicalDebtLevel})`,
        impact: 'Development velocity and maintainability'
      })
      recommendations.push('Schedule technical debt reduction sprints')
    }

    return {
      issues,
      recommendations,
      overallRisk: calculateOverallRisk(issues),
      actionRequired: issues.some(issue => issue.severity === 'high')
    }
  },

  benchmarkQuality: (projects) => {
    if (!projects || projects.length === 0) {
      return {
        benchmark: null,
        percentile: 0,
        comparison: 'insufficient_data'
      }
    }

    const qualityScores = projects.map(p => p.qualityScore || 0).sort((a, b) => a - b)
    const totalProjects = qualityScores.length

    const percentiles = {
      p25: qualityScores[Math.floor(totalProjects * 0.25)],
      p50: qualityScores[Math.floor(totalProjects * 0.5)],
      p75: qualityScores[Math.floor(totalProjects * 0.75)],
      p90: qualityScores[Math.floor(totalProjects * 0.9)]
    }

    const avgQuality = qualityScores.reduce((sum, score) => sum + score, 0) / totalProjects

    return {
      benchmark: {
        average: parseFloat(avgQuality.toFixed(2)),
        percentiles,
        totalProjects
      },
      industryStandards: {
        excellent: 90,
        good: 75,
        acceptable: 60,
        poor: 40
      }
    }
  },

  generateQualityReport: (project) => {
    const qualityMetrics = projectQualityService.calculateQualityMetrics(project)
    const bugAnalysis = projectQualityService.analyzeBugSeverityDistribution(project.bugs || [])
    const qualityIssues = projectQualityService.identifyQualityIssues(project)

    const summary = {
      projectName: project.name || project.projectKey,
      overallGrade: getQualityGrade(qualityMetrics.qualityScore),
      riskLevel: qualityIssues.overallRisk,
      actionRequired: qualityIssues.actionRequired
    }

    return {
      summary,
      metrics: qualityMetrics,
      bugAnalysis,
      issues: qualityIssues.issues,
      recommendations: qualityIssues.recommendations,
      generatedAt: new Date().toISOString()
    }
  }
}

const calculateQualityScore = (project, bugDensity) => {
  const bugWeight = 0.4
  const severityWeight = 0.3
  const progressWeight = 0.3

  const bugPenalty = Math.min(bugDensity * 2, 40)
  
  const severityPenalty = (
    (project.highSeverityBugs || 0) * 4 + 
    (project.mediumSeverityBugs || 0) * 2 + 
    (project.lowSeverityBugs || 0) * 0.5
  )
  
  const progressBonus = (project.progress || 0) * 0.3
  
  const maxScore = 100
  const qualityScore = maxScore - 
    (bugPenalty * bugWeight) - 
    (Math.min(severityPenalty, 30) * severityWeight) + 
    (progressBonus * progressWeight)
  
  return Math.max(Math.min(qualityScore, 100), 0)
}

const calculateDefectRemovalEfficiency = (bugs) => {
  if (!bugs || bugs.length === 0) return 100

  const resolvedBugs = bugs.filter(bug => {
    const status = bug.displayFields?.status || bug.fields?.status?.name
    return status === 'Done' || status === 'Closed' || status === 'Resolved'
  }).length

  return (resolvedBugs / bugs.length) * 100
}

const calculateCodeQualityIndex = (project) => {
  const totalIssues = project.issues?.length || 0
  const storyPoints = project.totalStoryPoints || 1
  const bugs = project.bugs?.length || 0

  const complexityScore = Math.min((totalIssues / storyPoints) * 10, 100)
  const bugScore = Math.max(100 - (bugs / totalIssues * 100), 0)
  
  return (complexityScore * 0.4) + (bugScore * 0.6)
}

const estimateTestCoverage = (project) => {
  const totalIssues = project.issues?.length || 0
  const testIssues = project.issues?.filter(issue => {
    const summary = issue.fields?.summary || ''
    const issueType = issue.displayFields?.issueType || issue.fields?.issuetype?.name || ''
    return summary.toLowerCase().includes('test') || issueType.toLowerCase().includes('test')
  }).length || 0

  if (totalIssues === 0) return 0
  
  const estimatedCoverage = Math.min((testIssues / totalIssues) * 400, 100)
  return estimatedCoverage
}

const calculateTechnicalDebt = (project) => {
  const totalIssues = project.issues?.length || 0
  const bugs = project.bugs?.length || 0
  const progress = project.progress || 0

  const bugRatio = totalIssues > 0 ? (bugs / totalIssues) : 0
  const stagnationPenalty = Math.max(0, (100 - progress) * 0.3)
  const bugPenalty = bugRatio * 50

  return Math.min(stagnationPenalty + bugPenalty, 100)
}

const calculateSeverityScore = (distribution, total) => {
  if (total === 0) return 100

  const weights = { 
    [SEVERITY_LEVELS.CRITICAL]: 10, 
    [SEVERITY_LEVELS.MAJOR]: 5, 
    [SEVERITY_LEVELS.MINOR]: 2, 
    [SEVERITY_LEVELS.LOW]: 1,
    [SEVERITY_LEVELS.COSMETIC]: 1
  }
  
  const weightedSum = Object.entries(distribution).reduce((sum, [severity, count]) => {
    return sum + (count * (weights[severity] || 1))
  }, 0)

  const maxPossibleScore = total * weights[SEVERITY_LEVELS.CRITICAL]
  const severityScore = 100 - ((weightedSum / maxPossibleScore) * 100)

  return Math.max(severityScore, 0)
}

const calculateOverallRisk = (issues) => {
  if (issues.length === 0) return 'low'

  const riskScores = issues.map(issue => {
    switch (issue.severity) {
      case 'high': return 3
      case 'medium': return 2
      case 'low': return 1
      default: return 1
    }
  })

  const avgRisk = riskScores.reduce((sum, score) => sum + score, 0) / riskScores.length

  if (avgRisk >= 2.5) return 'high'
  if (avgRisk >= 1.5) return 'medium'
  return 'low'
}

const getQualityGrade = (score) => {
  if (score >= 90) return 'A+'
  if (score >= 80) return 'A'
  if (score >= 70) return 'B'
  if (score >= 60) return 'C'
  if (score >= 50) return 'D'
  return 'F'
}