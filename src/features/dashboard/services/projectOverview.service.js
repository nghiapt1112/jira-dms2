export const projectOverviewService = {
  calculateProjectHealth: (project) => {
    if (!project || !project.issues) {
      return {
        score: 0,
        status: 'Unknown',
        factors: {
          quality: 0,
          bugRate: 0,
          progress: 0
        }
      }
    }

    const qualityWeight = 0.4
    const bugRateWeight = 0.3
    const progressWeight = 0.3

    const qualityScore = project.qualityScore || 0
    const bugRate = project.bugRate || 0
    const progress = project.progress || 0

    const bugRatePenalty = Math.min(bugRate * 1.5, 30)
    const progressBonus = progress * 0.8

    const healthScore = (qualityScore * qualityWeight) + 
                       ((100 - bugRatePenalty) * bugRateWeight) + 
                       (progressBonus * progressWeight)

    const finalScore = Math.max(Math.min(healthScore, 100), 0)

    return {
      score: parseFloat(finalScore.toFixed(2)),
      status: getHealthStatus(finalScore),
      factors: {
        quality: parseFloat((qualityScore * qualityWeight).toFixed(2)),
        bugRate: parseFloat(((100 - bugRatePenalty) * bugRateWeight).toFixed(2)),
        progress: parseFloat((progressBonus * progressWeight).toFixed(2))
      }
    }
  },

  getProjectTrends: (projects, historicalData = []) => {
    if (!projects || projects.length === 0) {
      return {
        overall: 'stable',
        quality: 'stable',
        delivery: 'stable',
        health: 'stable'
      }
    }

    const currentMetrics = {
      avgQuality: projects.reduce((sum, p) => sum + (p.qualityScore || 0), 0) / projects.length,
      avgDelivery: projects.reduce((sum, p) => sum + (p.delivery || 0), 0) / projects.length,
      avgHealth: projects.reduce((sum, p) => sum + (p.healthScore || 0), 0) / projects.length
    }

    if (historicalData.length === 0) {
      return {
        overall: 'stable',
        quality: 'stable',
        delivery: 'stable',
        health: 'stable',
        currentMetrics
      }
    }

    const previousMetrics = historicalData[historicalData.length - 1]
    
    const qualityTrend = getTrendDirection(currentMetrics.avgQuality, previousMetrics.avgQuality)
    const deliveryTrend = getTrendDirection(currentMetrics.avgDelivery, previousMetrics.avgDelivery)
    const healthTrend = getTrendDirection(currentMetrics.avgHealth, previousMetrics.avgHealth)

    const overallTrend = calculateOverallTrend([qualityTrend, deliveryTrend, healthTrend])

    return {
      overall: overallTrend,
      quality: qualityTrend,
      delivery: deliveryTrend,
      health: healthTrend,
      currentMetrics,
      previousMetrics
    }
  },

  getProjectsByStatus: (projects) => {
    if (!projects || projects.length === 0) {
      return {
        healthy: [],
        moderate: [],
        atRisk: [],
        critical: []
      }
    }

    return projects.reduce((acc, project) => {
      const health = project.health || 'Unknown'
      
      switch (health.toLowerCase()) {
        case 'healthy':
          acc.healthy.push(project)
          break
        case 'moderate':
          acc.moderate.push(project)
          break
        case 'at risk':
          acc.atRisk.push(project)
          break
        case 'critical':
          acc.critical.push(project)
          break
        default:
          acc.atRisk.push(project)
      }
      
      return acc
    }, {
      healthy: [],
      moderate: [],
      atRisk: [],
      critical: []
    })
  },

  getTopPerformingProjects: (projects, limit = 5) => {
    if (!projects || projects.length === 0) return []

    return [...projects]
      .sort((a, b) => {
        const scoreA = (a.qualityScore || 0) + (a.delivery || 0) + (a.healthScore || 0)
        const scoreB = (b.qualityScore || 0) + (b.delivery || 0) + (b.healthScore || 0)
        return scoreB - scoreA
      })
      .slice(0, limit)
      .map(project => ({
        ...project,
        combinedScore: parseFloat(((project.qualityScore || 0) + (project.delivery || 0) + (project.healthScore || 0)).toFixed(2))
      }))
  },

  getProjectsNeedingAttention: (projects, thresholds = {}) => {
    const defaultThresholds = {
      qualityScore: 60,
      healthScore: 60,
      bugRate: 15,
      ...thresholds
    }

    if (!projects || projects.length === 0) return []

    return projects.filter(project => {
      const needsAttention = 
        (project.qualityScore || 0) < defaultThresholds.qualityScore ||
        (project.healthScore || 0) < defaultThresholds.healthScore ||
        (project.bugRate || 0) > defaultThresholds.bugRate

      return needsAttention
    }).map(project => {
      const issues = []
      
      if ((project.qualityScore || 0) < defaultThresholds.qualityScore) {
        issues.push('Low quality score')
      }
      
      if ((project.healthScore || 0) < defaultThresholds.healthScore) {
        issues.push('Poor health score')
      }
      
      if ((project.bugRate || 0) > defaultThresholds.bugRate) {
        issues.push('High bug rate')
      }

      return {
        ...project,
        attentionReasons: issues
      }
    })
  },

  calculateTeamProductivity: (projects) => {
    if (!projects || projects.length === 0) {
      return {
        totalStoryPoints: 0,
        completedStoryPoints: 0,
        avgVelocity: 0,
        productivityScore: 0
      }
    }

    const totalStoryPoints = projects.reduce((sum, p) => sum + (p.totalStoryPoints || 0), 0)
    const completedStoryPoints = projects.reduce((sum, p) => sum + (p.completedStoryPoints || 0), 0)
    const avgVelocity = projects.length > 0 ? completedStoryPoints / projects.length : 0

    const productivityScore = totalStoryPoints > 0 
      ? (completedStoryPoints / totalStoryPoints) * 100 
      : 0

    return {
      totalStoryPoints,
      completedStoryPoints,
      avgVelocity: parseFloat(avgVelocity.toFixed(2)),
      productivityScore: parseFloat(productivityScore.toFixed(2))
    }
  },

  getProjectInsights: (projects) => {
    if (!projects || projects.length === 0) {
      return {
        insights: [],
        recommendations: []
      }
    }

    const insights = []
    const recommendations = []

    const avgQuality = projects.reduce((sum, p) => sum + (p.qualityScore || 0), 0) / projects.length
    const avgBugRate = projects.reduce((sum, p) => sum + (p.bugRate || 0), 0) / projects.length
    const totalBugs = projects.reduce((sum, p) => sum + (p.bugs?.length || 0), 0)

    if (avgQuality < 70) {
      insights.push(`Overall quality score is below average (${avgQuality.toFixed(1)})`)
      recommendations.push('Consider implementing code review processes and automated testing')
    }

    if (avgBugRate > 10) {
      insights.push(`Bug rate is higher than recommended (${avgBugRate.toFixed(1)}%)`)
      recommendations.push('Focus on bug prevention and early detection in development cycle')
    }

    const highBugProjects = projects.filter(p => (p.bugs?.length || 0) > 10)
    if (highBugProjects.length > 0) {
      insights.push(`${highBugProjects.length} project(s) have high bug counts`)
      recommendations.push('Prioritize bug fixing for projects with highest bug counts')
    }

    const stagnantProjects = projects.filter(p => (p.progress || 0) < 30)
    if (stagnantProjects.length > 0) {
      insights.push(`${stagnantProjects.length} project(s) show low progress`)
      recommendations.push('Review project roadmaps and remove blockers for stagnant projects')
    }

    return {
      insights,
      recommendations,
      metrics: {
        avgQuality: parseFloat(avgQuality.toFixed(2)),
        avgBugRate: parseFloat(avgBugRate.toFixed(2)),
        totalBugs,
        totalProjects: projects.length
      }
    }
  }
}

const getHealthStatus = (score) => {
  if (score >= 80) return 'Healthy'
  if (score >= 60) return 'Moderate'
  if (score >= 40) return 'At Risk'
  return 'Critical'
}

const getTrendDirection = (current, previous, threshold = 2) => {
  const diff = current - previous
  
  if (Math.abs(diff) <= threshold) return 'stable'
  return diff > 0 ? 'improving' : 'declining'
}

const calculateOverallTrend = (trends) => {
  const trendScores = trends.map(trend => {
    switch (trend) {
      case 'improving': return 1
      case 'declining': return -1
      case 'stable': return 0
      default: return 0
    }
  })
  
  const avgScore = trendScores.reduce((sum, score) => sum + score, 0) / trendScores.length
  
  if (avgScore > 0.3) return 'improving'
  if (avgScore < -0.3) return 'declining'
  return 'stable'
}