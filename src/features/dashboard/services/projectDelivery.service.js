export const projectDeliveryService = {
  calculateDeliveryMetrics: (project) => {
    if (!project || !project.issues) {
      return {
        deliveryRate: 0,
        velocityScore: 0,
        timelinessScore: 0,
        scopeStability: 0,
        overallDeliveryScore: 0
      }
    }

    const deliveryRate = calculateDeliveryRate(project)
    const velocityScore = calculateVelocityScore(project)
    const timelinessScore = calculateTimelinessScore(project)
    const scopeStability = calculateScopeStability(project)
    
    const overallDeliveryScore = (
      deliveryRate * 0.4 +
      velocityScore * 0.3 +
      timelinessScore * 0.2 +
      scopeStability * 0.1
    )

    return {
      deliveryRate: parseFloat(deliveryRate.toFixed(2)),
      velocityScore: parseFloat(velocityScore.toFixed(2)),
      timelinessScore: parseFloat(timelinessScore.toFixed(2)),
      scopeStability: parseFloat(scopeStability.toFixed(2)),
      overallDeliveryScore: parseFloat(overallDeliveryScore.toFixed(2))
    }
  },

  analyzeDeliveryTrends: (projectHistory) => {
    if (!projectHistory || projectHistory.length < 2) {
      return {
        trend: 'stable',
        velocity: 'stable',
        timeline: 'stable',
        predictedDelivery: null
      }
    }

    const recent = projectHistory.slice(-3)
    const deliveryScores = recent.map(p => p.delivery || 0)
    const velocityScores = recent.map(p => calculateVelocityScore(p))

    const deliveryTrend = calculateTrend(deliveryScores)
    const velocityTrend = calculateTrend(velocityScores)

    return {
      trend: deliveryTrend,
      velocity: velocityTrend,
      timeline: deliveryTrend,
      predictedDelivery: predictNextDeliveryScore(deliveryScores),
      improvement: deliveryTrend === 'improving',
      recommendations: generateDeliveryRecommendations(deliveryTrend, velocityTrend)
    }
  },

  getDeliveryEfficiencyBreakdown: (projects) => {
    if (!projects || projects.length === 0) {
      return {
        onTime: [],
        delayed: [],
        critical: [],
        summary: {
          onTimePercentage: 0,
          delayedPercentage: 0,
          criticalPercentage: 0
        }
      }
    }

    const breakdown = projects.reduce((acc, project) => {
      const deliveryScore = project.delivery || 0
      
      if (deliveryScore >= 80) {
        acc.onTime.push(project)
      } else if (deliveryScore >= 60) {
        acc.delayed.push(project)
      } else {
        acc.critical.push(project)
      }
      
      return acc
    }, { onTime: [], delayed: [], critical: [] })

    const total = projects.length
    const summary = {
      onTimePercentage: parseFloat(((breakdown.onTime.length / total) * 100).toFixed(1)),
      delayedPercentage: parseFloat(((breakdown.delayed.length / total) * 100).toFixed(1)),
      criticalPercentage: parseFloat(((breakdown.critical.length / total) * 100).toFixed(1))
    }

    return {
      ...breakdown,
      summary,
      total
    }
  },

  getRecentDeliveries: (projects, limit = 5) => {
    if (!projects || projects.length === 0) return []

    return projects
      .filter(project => {
        const hasCompletedWork = (project.completedStoryPoints || 0) > 0
        const hasRecentActivity = project.issues?.some(issue => {
          const updated = new Date(issue.fields?.updated || 0)
          const daysSinceUpdate = (Date.now() - updated.getTime()) / (1000 * 60 * 60 * 24)
          return daysSinceUpdate <= 30
        })
        return hasCompletedWork || hasRecentActivity
      })
      .sort((a, b) => {
        const aLastUpdate = getLastUpdateTime(a)
        const bLastUpdate = getLastUpdateTime(b)
        return bLastUpdate - aLastUpdate
      })
      .slice(0, limit)
      .map(project => ({
        ...project,
        lastDeliveryDate: getLastDeliveryDate(project),
        deliveryEfficiency: getDeliveryEfficiencyCategory(project.delivery || 0),
        recentCompletions: getRecentCompletions(project)
      }))
  },

  calculateSprintMetrics: (project) => {
    if (!project || !project.issues) {
      return {
        sprintVelocity: 0,
        burndownEfficiency: 0,
        scopeCreep: 0,
        commitmentReliability: 0
      }
    }

    const sprintVelocity = calculateSprintVelocity(project)
    const burndownEfficiency = calculateBurndownEfficiency(project)
    const scopeCreep = calculateScopeCreep(project)
    const commitmentReliability = calculateCommitmentReliability(project)

    return {
      sprintVelocity: parseFloat(sprintVelocity.toFixed(2)),
      burndownEfficiency: parseFloat(burndownEfficiency.toFixed(2)),
      scopeCreep: parseFloat(scopeCreep.toFixed(2)),
      commitmentReliability: parseFloat(commitmentReliability.toFixed(2))
    }
  },

  identifyDeliveryBottlenecks: (project) => {
    const bottlenecks = []
    
    if (!project || !project.issues) {
      return { bottlenecks, severity: 'low' }
    }

    const deliveryScore = project.delivery || 0
    const progress = project.progress || 0
    const bugRate = project.bugRate || 0

    if (deliveryScore < 60) {
      bottlenecks.push({
        type: 'low_delivery_score',
        description: `Delivery score (${deliveryScore}) below acceptable threshold`,
        impact: 'high',
        recommendations: ['Review sprint planning process', 'Identify blockers', 'Improve estimation accuracy']
      })
    }

    if (progress < 50) {
      bottlenecks.push({
        type: 'slow_progress',
        description: `Project progress (${progress}%) is behind schedule`,
        impact: 'medium',
        recommendations: ['Break down large tasks', 'Remove dependencies', 'Add resources if needed']
      })
    }

    if (bugRate > 15) {
      bottlenecks.push({
        type: 'quality_issues',
        description: `High bug rate (${bugRate}%) affecting delivery`,
        impact: 'high',
        recommendations: ['Focus on bug fixing', 'Improve testing processes', 'Code review improvements']
      })
    }

    const blockedIssues = project.issues.filter(issue => {
      const status = issue.displayFields?.status || issue.fields?.status?.name || ''
      return status.toLowerCase().includes('blocked') || status.toLowerCase().includes('impediment')
    })

    if (blockedIssues.length > 0) {
      bottlenecks.push({
        type: 'blocked_issues',
        description: `${blockedIssues.length} issues are currently blocked`,
        impact: 'high',
        recommendations: ['Resolve blockers immediately', 'Escalate impediments', 'Find alternative solutions']
      })
    }

    const severity = bottlenecks.some(b => b.impact === 'high') ? 'high' : 
                    bottlenecks.some(b => b.impact === 'medium') ? 'medium' : 'low'

    return { bottlenecks, severity }
  },

  generateDeliveryForecast: (project, sprintLength = 14) => {
    if (!project || !project.issues) {
      return {
        estimatedCompletion: null,
        confidence: 0,
        remainingWork: 0,
        recommendedActions: []
      }
    }

    const remainingStoryPoints = (project.totalStoryPoints || 0) - (project.completedStoryPoints || 0)
    const currentVelocity = calculateCurrentVelocity(project, sprintLength)
    
    let estimatedSprints = 0
    let confidence = 0
    const recommendedActions = []

    if (currentVelocity > 0) {
      estimatedSprints = Math.ceil(remainingStoryPoints / currentVelocity)
      
      const deliveryConsistency = calculateDeliveryConsistency(project)
      confidence = Math.min(deliveryConsistency * 100, 95)
      
      if (confidence < 70) {
        recommendedActions.push('Improve estimation accuracy')
        recommendedActions.push('Address velocity fluctuations')
      }
    } else {
      recommendedActions.push('Establish baseline velocity')
      recommendedActions.push('Review and prioritize backlog')
    }

    const estimatedDays = estimatedSprints * sprintLength
    const estimatedCompletion = new Date()
    estimatedCompletion.setDate(estimatedCompletion.getDate() + estimatedDays)

    return {
      estimatedCompletion: estimatedCompletion.toISOString().split('T')[0],
      confidence: parseFloat(confidence.toFixed(1)),
      remainingWork: remainingStoryPoints,
      estimatedSprints,
      currentVelocity: parseFloat(currentVelocity.toFixed(2)),
      recommendedActions
    }
  }
}

const calculateDeliveryRate = (project) => {
  const totalIssues = project.issues?.length || 0
  if (totalIssues === 0) return 0

  const completedIssues = project.issues.filter(issue => {
    const status = issue.displayFields?.status || issue.fields?.status?.name
    return status === 'Done' || status === 'Closed' || status === 'Resolved'
  }).length

  return (completedIssues / totalIssues) * 100
}

const calculateVelocityScore = (project) => {
  const totalStoryPoints = project.totalStoryPoints || 0
  const completedStoryPoints = project.completedStoryPoints || 0
  
  if (totalStoryPoints === 0) return 0
  
  return (completedStoryPoints / totalStoryPoints) * 100
}

const calculateTimelinessScore = (project) => {
  if (!project.issues || project.issues.length === 0) return 0

  const onTimeIssues = project.issues.filter(issue => {
    const created = new Date(issue.fields?.created || 0)
    const resolved = new Date(issue.fields?.resolutiondate || Date.now())
    const dueDate = new Date(issue.fields?.duedate || Date.now())
    
    return resolved <= dueDate
  }).length

  return (onTimeIssues / project.issues.length) * 100
}

const calculateScopeStability = (project) => {
  const totalIssues = project.issues?.length || 0
  if (totalIssues === 0) return 100

  const originalEstimate = Math.floor(totalIssues * 0.8)
  const addedIssues = totalIssues - originalEstimate
  const scopeCreepPercentage = (addedIssues / originalEstimate) * 100

  return Math.max(100 - scopeCreepPercentage, 0)
}

const calculateTrend = (values) => {
  if (values.length < 2) return 'stable'
  
  const recent = values[values.length - 1]
  const previous = values[values.length - 2]
  const diff = recent - previous
  
  if (Math.abs(diff) <= 2) return 'stable'
  return diff > 0 ? 'improving' : 'declining'
}

const predictNextDeliveryScore = (scores) => {
  if (scores.length < 2) return null
  
  const trend = scores.reduce((sum, score, index) => {
    if (index === 0) return 0
    return sum + (score - scores[index - 1])
  }, 0) / (scores.length - 1)
  
  const lastScore = scores[scores.length - 1]
  return Math.max(Math.min(lastScore + trend, 100), 0)
}

const generateDeliveryRecommendations = (deliveryTrend, velocityTrend) => {
  const recommendations = []
  
  if (deliveryTrend === 'declining') {
    recommendations.push('Review and address delivery bottlenecks')
    recommendations.push('Improve sprint planning and estimation')
  }
  
  if (velocityTrend === 'declining') {
    recommendations.push('Analyze team capacity and workload')
    recommendations.push('Remove impediments and blockers')
  }
  
  if (deliveryTrend === 'improving' && velocityTrend === 'improving') {
    recommendations.push('Continue current practices')
    recommendations.push('Consider taking on additional scope')
  }
  
  return recommendations
}

const getLastUpdateTime = (project) => {
  if (!project.issues || project.issues.length === 0) return 0
  
  return Math.max(...project.issues.map(issue => 
    new Date(issue.fields?.updated || 0).getTime()
  ))
}

const getLastDeliveryDate = (project) => {
  if (!project.issues || project.issues.length === 0) return null
  
  const completedIssues = project.issues.filter(issue => {
    const status = issue.displayFields?.status || issue.fields?.status?.name
    return status === 'Done' || status === 'Closed' || status === 'Resolved'
  })
  
  if (completedIssues.length === 0) return null
  
  const lastResolved = Math.max(...completedIssues.map(issue => 
    new Date(issue.fields?.resolutiondate || 0).getTime()
  ))
  
  return new Date(lastResolved).toISOString().split('T')[0]
}

const getDeliveryEfficiencyCategory = (score) => {
  if (score >= 80) return 'On Time'
  if (score >= 60) return 'Delayed'
  return 'Critical'
}

const getRecentCompletions = (project) => {
  if (!project.issues) return 0
  
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  
  return project.issues.filter(issue => {
    const resolved = new Date(issue.fields?.resolutiondate || 0)
    const status = issue.displayFields?.status || issue.fields?.status?.name
    const isCompleted = status === 'Done' || status === 'Closed' || status === 'Resolved'
    
    return isCompleted && resolved >= thirtyDaysAgo
  }).length
}

const calculateSprintVelocity = (project) => {
  const completedStoryPoints = project.completedStoryPoints || 0
  const assumedSprintCount = Math.max(Math.ceil((project.issues?.length || 0) / 10), 1)
  
  return completedStoryPoints / assumedSprintCount
}

const calculateBurndownEfficiency = (project) => {
  const progress = project.progress || 0
  const idealProgress = 70 // Assuming 70% should be completed by now
  
  return Math.min((progress / idealProgress) * 100, 100)
}

const calculateScopeCreep = (project) => {
  const totalIssues = project.issues?.length || 0
  const originalScope = Math.floor(totalIssues * 0.8)
  const addedIssues = totalIssues - originalScope
  
  return addedIssues > 0 ? (addedIssues / originalScope) * 100 : 0
}

const calculateCommitmentReliability = (project) => {
  const totalStoryPoints = project.totalStoryPoints || 0
  const completedStoryPoints = project.completedStoryPoints || 0
  
  if (totalStoryPoints === 0) return 0
  
  return (completedStoryPoints / totalStoryPoints) * 100
}

const calculateCurrentVelocity = (project, sprintLength) => {
  const completedStoryPoints = project.completedStoryPoints || 0
  const totalDays = sprintLength * 3 // Assuming 3 sprints for velocity calculation
  
  return (completedStoryPoints / totalDays) * sprintLength
}

const calculateDeliveryConsistency = (project) => {
  if (!project.issues || project.issues.length === 0) return 0
  
  const deliveryVariance = 0.8 // Simplified consistency score
  return deliveryVariance
}