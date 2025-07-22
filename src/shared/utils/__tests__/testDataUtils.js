/**
 * Centralized Test Data Utilities
 * Provides consistent test data using centralized severity constants
 * Following SOLID principles - single source of truth for test data
 */

import { SEVERITY_LEVELS } from '../../constants/severityConstants.js'
import { initializeSeverityBreakdown } from '../../constants/severityConstants.js'

export const testDataUtils = {
  /**
   * Create mock developer data with centralized severity values
   * @param {Object} overrides - Override default values
   * @returns {Object} Mock developer object
   */
  createMockDeveloper: (overrides = {}) => {
    return {
      developer: 'john.doe',
      totalIssues: 100,
      bugs: 15,
      bugRate: 15.0,
      trend: 'stable',
      projects: ['PROJ-A', 'PROJ-B'],
      severityBreakdown: {
        [SEVERITY_LEVELS.CRITICAL]: 2,
        [SEVERITY_LEVELS.MAJOR]: 5,
        [SEVERITY_LEVELS.MINOR]: 6,
        [SEVERITY_LEVELS.LOW]: 2,
        [SEVERITY_LEVELS.COSMETIC]: 0,
        [SEVERITY_LEVELS.UNKNOWN]: 0
      },
      ...overrides
    }
  },

  /**
   * Create mock JIRA issue with centralized severity
   * @param {Object} overrides - Override default values  
   * @returns {Object} Mock JIRA issue object
   */
  createMockIssue: (overrides = {}) => {
    return {
      id: '1',
      key: 'TEST-1',
      assignee: 'John Doe',
      project: 'TEST-PROJECT', 
      issueType: 'Bug',
      severity: SEVERITY_LEVELS.MAJOR,
      rootCause: 'Logic Error',
      created: '2024-01-15T10:00:00.000Z',
      resolved: '2024-01-20T10:00:00.000Z',
      fields: {
        priority: { name: 'High' },
        assignee: { displayName: 'John Doe' },
        project: { key: 'TEST-PROJECT' },
        issuetype: { name: 'Bug' },
        status: { name: 'Done' }
      },
      ...overrides
    }
  },

  /**
   * Create mock bug rate analysis data
   * @param {Object} overrides - Override default values
   * @returns {Object} Mock bug rate analysis object
   */
  createMockBugRateAnalysis: (overrides = {}) => {
    return {
      developers: [
        testDataUtils.createMockDeveloper({ developer: 'john.doe', bugRate: 14.74 }),
        testDataUtils.createMockDeveloper({ 
          developer: 'jane.smith', 
          bugRate: 20.89,
          severityBreakdown: {
            [SEVERITY_LEVELS.CRITICAL]: 1,
            [SEVERITY_LEVELS.MAJOR]: 3,
            [SEVERITY_LEVELS.MINOR]: 4,
            [SEVERITY_LEVELS.LOW]: 1,
            [SEVERITY_LEVELS.COSMETIC]: 1,
            [SEVERITY_LEVELS.UNKNOWN]: 0
          }
        })
      ],
      teamAverage: 17.8,
      ...overrides
    }
  },

  /**
   * Create mock filter test data with centralized severity indices
   * @returns {Object} Mock cache data for filter tests
   */
  createMockFilterCacheData: () => {
    return {
      indices: {
        byDeveloper: new Map([
          ['John Doe', [0, 2, 4]],
          ['Jane Smith', [1, 3]],
          ['Bob Wilson', [5]]
        ]),
        byProject: new Map([
          ['PROJ-A', [0, 1, 2]],
          ['PROJ-B', [3, 4, 5]]
        ]),
        byIssueType: new Map([
          ['Bug', [0, 2, 4]],
          ['Story', [1, 3, 5]]
        ]),
        bySeverity: new Map([
          [SEVERITY_LEVELS.MAJOR, [0, 2]],
          [SEVERITY_LEVELS.MINOR, [1, 3]],
          [SEVERITY_LEVELS.LOW, [4, 5]]
        ])
      },
      minimalIssues: [
        testDataUtils.createMockIssue({ id: '1', severity: SEVERITY_LEVELS.MAJOR }),
        testDataUtils.createMockIssue({ id: '2', severity: SEVERITY_LEVELS.MINOR }),
        testDataUtils.createMockIssue({ id: '3', severity: SEVERITY_LEVELS.MAJOR }),
        testDataUtils.createMockIssue({ id: '4', severity: SEVERITY_LEVELS.MINOR }),
        testDataUtils.createMockIssue({ id: '5', severity: SEVERITY_LEVELS.LOW }),
        testDataUtils.createMockIssue({ id: '6', severity: SEVERITY_LEVELS.LOW })
      ]
    }
  },

  /**
   * Get all severity levels for testing
   * @returns {Array} Array of all severity levels
   */
  getAllSeverityLevels: () => {
    return Object.values(SEVERITY_LEVELS)
  },

  /**
   * Create empty severity breakdown for testing
   * @returns {Object} Initialized severity breakdown
   */
  createEmptySeverityBreakdown: () => {
    return initializeSeverityBreakdown()
  },

  /**
   * Create mock project data with centralized calculations
   * @param {Object} overrides - Override default values
   * @returns {Object} Mock project object
   */
  createMockProject: (overrides = {}) => {
    return {
      id: 'TEST-PROJECT',
      name: 'Test Project',
      projectKey: 'TEST-PROJECT',
      totalIssues: 100,
      bugs: [
        testDataUtils.createMockIssue({ severity: SEVERITY_LEVELS.CRITICAL }),
        testDataUtils.createMockIssue({ severity: SEVERITY_LEVELS.MAJOR })
      ],
      bugRate: 15.5,
      qualityScore: 84.5,
      severityBreakdown: {
        [SEVERITY_LEVELS.CRITICAL]: 1,
        [SEVERITY_LEVELS.MAJOR]: 4,
        [SEVERITY_LEVELS.MINOR]: 8,
        [SEVERITY_LEVELS.LOW]: 2,
        [SEVERITY_LEVELS.COSMETIC]: 0,
        [SEVERITY_LEVELS.UNKNOWN]: 0
      },
      highSeverityBugs: 5,
      ...overrides
    }
  }
}