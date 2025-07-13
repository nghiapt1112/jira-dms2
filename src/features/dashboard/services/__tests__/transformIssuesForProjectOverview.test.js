import { transformIssuesForProjectOverview } from '../transformIssuesForProjectOverview'

describe('transformIssuesForProjectOverview - Old Implementation Compatibility', () => {
  const mockIssues = [
    {
      fields: {
        project: { key: 'PROJ1', name: 'Project 1' },
        issuetype: { name: 'Bug' },
        status: { name: 'Done' },
        priority: { name: 'Critical' },
        storyPoints: 5
      },
      displayFields: {
        projectKey: 'PROJ1',
        projectName: 'Project 1',
        issueType: 'Bug',
        status: 'Done'
      }
    },
    {
      fields: {
        project: { key: 'PROJ1', name: 'Project 1' },
        issuetype: { name: 'Story' },
        status: { name: 'In Progress' },
        priority: { name: 'Medium' },
        storyPoints: 3
      },
      displayFields: {
        projectKey: 'PROJ1',
        projectName: 'Project 1',
        issueType: 'Story',
        status: 'In Progress'
      }
    },
    {
      fields: {
        project: { key: 'PROJ1', name: 'Project 1' },
        issuetype: { name: 'Bug' },
        status: { name: 'Open' },
        priority: { name: 'Low' },
        storyPoints: 2
      },
      displayFields: {
        projectKey: 'PROJ1',
        projectName: 'Project 1',
        issueType: 'Bug',
        status: 'Open'
      }
    }
  ]

  test('should calculate progress using completed issues count (old method)', () => {
    const result = transformIssuesForProjectOverview(mockIssues)
    const project = result[0]
    
    // Progress = (1 completed issue / 3 total issues) * 100 = 33.33% -> 33%
    expect(project.progress).toBe(33)
    expect(project.totalIssues).toBe(3)
    expect(project.completedIssues).toBe(1)
  })

  test('should calculate weighted bug rate correctly', () => {
    const result = transformIssuesForProjectOverview(mockIssues)
    const project = result[0]
    
    // Bug weights: Critical = 1.0, Low = 0.3
    // Weighted bug count = 1.0 + 0.3 = 1.3
    // Bug rate = (1.3 / 3 issues) * 100 = 43.33%
    expect(project.bugRate).toBe(43.33)
    expect(project.weightedBugCount).toBe(43.33)
    expect(project.bugs.length).toBe(2)
  })

  test('should calculate quality score using old formula', () => {
    const result = transformIssuesForProjectOverview(mockIssues)
    const project = result[0]
    
    // Quality Score = Math.max(1, 100 - 43.33) = 56.67
    expect(project.qualityScore).toBe(56.67)
  })

  test('should use correct quality status thresholds', () => {
    const result = transformIssuesForProjectOverview(mockIssues)
    const project = result[0]
    
    // Score 56.67 should be "Poor" (< 60)
    expect(project.qualityStatus).toBe('Poor')
  })

  test('should calculate health score using weighted formula', () => {
    const result = transformIssuesForProjectOverview(mockIssues)
    const project = result[0]
    
    // Health = qualityScore * 0.4 + (100 - bugRate) * 0.3 + progress * 0.3
    // Health = 56.67 * 0.4 + (100 - 43.33) * 0.3 + 33 * 0.3
    // Health = 22.67 + 17.00 + 9.9 = 49.57
    expect(project.healthScore).toBeCloseTo(49.57, 1)
  })

  test('should identify high severity bugs correctly', () => {
    const result = transformIssuesForProjectOverview(mockIssues)
    const project = result[0]
    
    // Only 1 Critical bug should be counted as high severity
    expect(project.highSeverityBugs).toBe(1)
  })

  test('should handle projects with different quality thresholds', () => {
    const excellentProject = [
      {
        fields: {
          project: { key: 'EXCELLENT', name: 'Excellent Project' },
          issuetype: { name: 'Story' },
          status: { name: 'Done' },
          priority: { name: 'Medium' },
          storyPoints: 5
        },
        displayFields: {
          projectKey: 'EXCELLENT',
          issueType: 'Story',
          status: 'Done'
        }
      }
    ]

    const result = transformIssuesForProjectOverview(excellentProject)
    const project = result[0]
    
    // No bugs = 100% quality score = "Excellent"
    expect(project.qualityScore).toBe(100)
    expect(project.qualityStatus).toBe('Excellent')
    expect(project.bugRate).toBe(0)
  })

  test('should maintain backward compatibility with story points display', () => {
    const result = transformIssuesForProjectOverview(mockIssues)
    const project = result[0]
    
    // Should have both totalStoryPoints and plannedEffort for compatibility
    expect(project.totalStoryPoints).toBe(10) // 5 + 3 + 2
    expect(project.plannedEffort).toBe(10) // Same value for compatibility
  })

  test('should handle edge cases like old implementation', () => {
    const edgeCases = [
      {
        fields: {
          project: { key: 'EDGE', name: 'Edge Case' },
          issuetype: { name: 'Bug' },
          status: { name: 'Done' },
          priority: { name: 'Unknown Priority' }, // Should default to Medium
          storyPoints: 0
        },
        displayFields: {
          projectKey: 'EDGE',
          issueType: 'Bug',
          status: 'Done'
        }
      }
    ]

    const result = transformIssuesForProjectOverview(edgeCases)
    const project = result[0]
    
    // Unknown priority should be treated as Medium (weight 0.5)
    expect(project.bugRate).toBe(50) // (0.5 / 1 issue) * 100
    expect(project.qualityScore).toBe(50) // Math.max(1, 100 - 50)
  })
})