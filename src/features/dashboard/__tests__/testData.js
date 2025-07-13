import fs from 'fs'
import path from 'path'
import { JIRA_CONSTANTS } from '../../../constants/jiraConstants.js'

// Load real JIRA test data from the 256KB file
const loadTestData = () => {
  try {
    const testDataPath = '/Users/duongthao/data/sources/ai-agent/source/Q1-2025-tickets-256KB.json'
    const rawData = fs.readFileSync(testDataPath, 'utf8')
    return JSON.parse(rawData)
  } catch (error) {
    console.warn('Could not load test data from file, using mock data:', error.message)
    return getMockData()
  }
}

// Fallback mock data if file is not available
const getMockData = () => ([
  {
    "id": "70354",
    "key": "YUIM-129",
    "fields": {
      "issuetype": {
        "name": "Task",
        "id": "10002"
      },
      "created": "2025-03-24T18:47:01.131+0900",
      "project": {
        "key": "YUIM",
        "name": "Yuime",
        "id": "10246"
      },
      [JIRA_CONSTANTS.CUSTOM_FIELDS.STORY_POINTS]: 12,
      "resolutiondate": "2025-03-28T19:02:06.058+0900",
      "assignee": {
        "displayName": "Henry Phung",
        "accountId": "712020:a406f86b-ff65-41e2-8bdb-333302c8527d"
      },
      "status": {
        "name": "Done",
        "id": "10012",
        "statusCategory": {
          "key": "done",
          "name": "Done"
        }
      },
      [JIRA_CONSTANTS.CUSTOM_FIELDS.SPRINT]: [{
        "name": "YUIM Sprint15",
        "state": "closed",
        "startDate": "2025-03-24T03:46:07.911Z",
        "endDate": "2025-03-31T03:46:00.000Z"
      }]
    }
  },
  {
    "id": "70177",
    "key": "YUIM-128",
    "fields": {
      "issuetype": {
        "name": "Task",
        "id": "10002"
      },
      "created": "2025-03-23T17:45:51.931+0900",
      "project": {
        "key": "YUIM",
        "name": "Yuime",
        "id": "10246"
      },
      [JIRA_CONSTANTS.CUSTOM_FIELDS.STORY_POINTS]: 3,
      "resolutiondate": "2025-03-29T02:11:13.602+0900",
      "assignee": {
        "displayName": "Izal Fathoni",
        "accountId": "712020:5aec5bd8-b56d-4408-bc6f-4f1c3359704b"
      },
      "status": {
        "name": "Done",
        "id": "10012",
        "statusCategory": {
          "key": "done",
          "name": "Done"
        }
      },
      [JIRA_CONSTANTS.CUSTOM_FIELDS.SPRINT]: [{
        "name": "YUIM Sprint15",
        "state": "closed",
        "startDate": "2025-03-24T03:46:07.911Z",
        "endDate": "2025-03-31T03:46:00.000Z"
      }]
    }
  }
])

// Transform issues to the format expected by our components
const transformTestData = (issues) => {
  return issues.map(issue => ({
    ...issue,
    displayFields: {
      projectKey: issue.fields?.project?.key,
      projectName: issue.fields?.project?.name,
      issueType: issue.fields?.issuetype?.name,
      status: issue.fields?.status?.name,
      assignee: issue.fields?.assignee?.displayName,
      storyPoints: issue.fields?.[JIRA_CONSTANTS.CUSTOM_FIELDS.STORY_POINTS],
      sprint: issue.fields?.[JIRA_CONSTANTS.CUSTOM_FIELDS.SPRINT]?.[0]?.name,
      sprintState: issue.fields?.[JIRA_CONSTANTS.CUSTOM_FIELDS.SPRINT]?.[0]?.state
    }
  }))
}

// Get sample data for different test scenarios
export const getTestIssues = (count = 10) => {
  const allIssues = loadTestData()
  const transformed = transformTestData(allIssues.slice(0, count))
  return transformed
}

// Get issues for specific project
export const getTestIssuesByProject = (projectKey = 'YUIM', count = 5) => {
  const allIssues = loadTestData()
  const projectIssues = allIssues.filter(issue => 
    issue.fields?.project?.key === projectKey
  ).slice(0, count)
  return transformTestData(projectIssues)
}

// Get issues with specific status
export const getTestIssuesByStatus = (status = 'Done', count = 5) => {
  const allIssues = loadTestData()
  const statusIssues = allIssues.filter(issue => 
    issue.fields?.status?.name === status
  ).slice(0, count)
  return transformTestData(statusIssues)
}

// Get mock project data for dashboard components
export const getMockProjectData = () => [
  {
    projectKey: 'YUIM',
    projectName: 'Yuime',
    totalIssues: 25,
    resolvedIssues: 20,
    bugCount: 3,
    storyPoints: 45,
    qualityScore: 85,
    healthScore: 90,
    deliveryScore: 78,
    avgResolutionTime: 5.2,
    sprintMetrics: {
      onTimeDelivery: 0.8,
      scopeCreep: 0.15
    }
  },
  {
    projectKey: 'TEST',
    projectName: 'Test Project',
    totalIssues: 15,
    resolvedIssues: 12,
    bugCount: 2,
    storyPoints: 28,
    qualityScore: 75,
    healthScore: 80,
    deliveryScore: 85,
    avgResolutionTime: 3.8,
    sprintMetrics: {
      onTimeDelivery: 0.9,
      scopeCreep: 0.1
    }
  }
]

// Mock cache hook for testing
export const getMockCacheHook = () => ({
  cacheKey: 'test_cache_key_123',
  performanceMetrics: {
    hitRate: 85.5,
    avgResponseTime: 8.2,
    totalRequests: 45,
    hits: 38,
    misses: 7,
    cacheSize: 5,
    isPerformant: true,
    lastProcessingTime: 2100,
    cacheKeys: ['main_dashboard_cache_abc123', 'main_dashboard_cache_def456']
  },
  cacheStatus: {
    status: 'valid',
    age: 1800000, // 30 minutes
    expiresIn: 19200000 // 5.33 hours
  },
  isProcessing: false,
  processIssuesWithCache: jest.fn().mockResolvedValue({
    data: {
      projects: getMockProjectData(),
      metrics: {
        totalProjects: 2,
        avgQualityScore: 80,
        avgHealthScore: 85,
        avgDeliveryScore: 81.5,
        totalIssues: 40,
        totalBugs: 5
      }
    }
  }),
  clearCache: jest.fn(),
  getCacheStatus: jest.fn().mockReturnValue({
    status: 'valid',
    age: 1800000,
    expiresIn: 19200000
  })
})

// Mock useJiraData hook for testing
export const getMockJiraDataHook = () => ({
  issues: getTestIssues(20),
  hasData: true,
  isLoading: false,
  error: null,
  fetchData: jest.fn(),
  refreshData: jest.fn(),
  isDataStale: jest.fn().mockReturnValue(false),
  lastFetched: Date.now() - 1800000 // 30 minutes ago
})

export default {
  getTestIssues,
  getTestIssuesByProject,
  getTestIssuesByStatus,
  getMockProjectData,
  getMockCacheHook,
  getMockJiraDataHook
}