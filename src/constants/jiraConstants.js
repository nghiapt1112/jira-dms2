export const JIRA_CONSTANTS = {
  // Default projects from your curl command
  DEFAULT_PROJECTS: [
    "WON", "YUIM", "STU", "DAAI", "DAICO", "TOUC", "TG", "NKR2", 
    "SG", "BCP", "SIP", "IP", "HG", "CF", "TIT", "OOPS", "JSR", 
    "RAG", "ECHO", "SEK", "PMAX", "MIT", "IS", "KB", "PDS", "TS", "YUB"
  ],
  
  // Standard JIRA fields
  STANDARD_FIELDS: {
    PROJECT: 'project',
    RESOLUTION_DATE: 'resolutiondate',
    STATUS: 'status',
    ASSIGNEE: 'assignee',
    ISSUE_TYPE: 'issuetype',
    TIME_SPENT: 'timespent',
    TIME_ORIGINAL_ESTIMATE: 'timeoriginalestimate',
    TIME_TRACKING: 'timetracking',
    CREATED: 'created',
    UPDATED: 'updated',
    PRIORITY: 'priority',
    REPORTER: 'reporter',
    DUE_DATE: 'duedate',
    SUMMARY: 'summary',
    DESCRIPTION: 'description'
  },

  // Selected fields - constructed from constants for consistency
  get SELECTED_FIELDS() {
    const standardFields = [
      this.STANDARD_FIELDS.PROJECT,
      this.STANDARD_FIELDS.RESOLUTION_DATE,
      this.STANDARD_FIELDS.STATUS,
      this.STANDARD_FIELDS.ASSIGNEE,
      this.STANDARD_FIELDS.ISSUE_TYPE,
      this.STANDARD_FIELDS.TIME_SPENT,
      this.STANDARD_FIELDS.TIME_ORIGINAL_ESTIMATE,
      this.STANDARD_FIELDS.TIME_TRACKING,
      this.STANDARD_FIELDS.CREATED,
      this.STANDARD_FIELDS.UPDATED,
      this.STANDARD_FIELDS.PRIORITY,
      this.STANDARD_FIELDS.REPORTER
    ]
    const customFields = [
      this.CUSTOM_FIELDS.STORY_POINTS,
      this.CUSTOM_FIELDS.SPRINT,
      this.CUSTOM_FIELDS.BUG_TYPE,
      this.CUSTOM_FIELDS.ROOT_CAUSE,
      this.CUSTOM_FIELDS.BUG_SEVERITY,
      this.CUSTOM_FIELDS.START_DATE,
      this.CUSTOM_FIELDS.BUG_CAUSED_BY,
      this.CUSTOM_FIELDS.BUG_CAUSED_BY_NEW
    ]
    return [...standardFields, ...customFields].join(',')
  },
  
  // Custom field mappings (from your data-structures.md)
  CUSTOM_FIELDS: {
    STORY_POINTS: 'customfield_10028',
    SPRINT: 'customfield_10020',
    BUG_TYPE: 'customfield_10271',
    ROOT_CAUSE: 'customfield_10272',
    BUG_SEVERITY: 'customfield_10049',
    START_DATE: 'customfield_10015',
    BUG_CAUSED_BY: 'customfield_10636',
    BUG_CAUSED_BY_NEW: 'customfield_10002' // New field for bug causation tracking
  },
  
  // API endpoints
  API_ENDPOINTS: {
    JIRA_ISSUES_V3: '/jira/issues/v3',
    BASE_URL: (typeof window !== 'undefined' && window.VITE_API_BASE_URL) || 'https://6rornklpte.execute-api.ap-southeast-1.amazonaws.com/dev/api'
  },
  
  // Download settings
  DOWNLOAD_SETTINGS: {
    TIMEOUT: 300000, // 5 minutes
    MAX_RETRIES: 3,
    RETRY_DELAY: 2000, // 2 seconds
    CHUNK_SIZE: 1000000, // 1MB chunks
    CONNECTION_SPEED: 1000000, // 1MB/s default
    // Parallel download settings
    MAX_CONCURRENT_DOWNLOADS: 3, // Number of simultaneous downloads
    BANDWIDTH_LIMIT_MBPS: 10, // Total bandwidth limit in MB/s
    PER_FILE_TIMEOUT: 300000, // 5 minutes per file
    RETRY_WITH_BACKOFF: true, // Use exponential backoff for retries
    ENABLE_PARALLEL_DOWNLOADS: true // Feature flag to enable/disable
  },
  
  // Cache settings
  CACHE_SETTINGS: {
    EXPIRY_HOURS: 168, // 7 days (increased from 24 hours)
    MAX_SIZE_MB: 500, // Increased from 100MB to 500MB
    STORAGE_KEY: 'jira_data_cache',
    METADATA_KEY: 'jira_data_metadata',
    ALLOW_STALE_DATA: true // Allow loading stale data with warning
  },
  
  // Issue types
  ISSUE_TYPES: {
    BUG: 'Bug',
    STORY: 'Story',
    TASK: 'Task',
    EPIC: 'Epic',
    SUB_TASK: 'Sub-task',
    IMPROVEMENT: 'Improvement'
  },
  
  // Issue statuses
  ISSUE_STATUSES: {
    OPEN: 'Open',
    IN_PROGRESS: 'In Progress',
    RESOLVED: 'Resolved',
    CLOSED: 'Closed',
    DONE: 'Done',
    TODO: 'To Do',
    IN_REVIEW: 'In Review'
  },
  
  // Priority levels
  PRIORITY_LEVELS: {
    HIGHEST: 'Highest',
    HIGH: 'High',
    MEDIUM: 'Medium',
    LOW: 'Low',
    LOWEST: 'Lowest'
  },
  
  // Bug types
  BUG_TYPES: {
    FUNCTIONAL: 'Functional',
    UI: 'UI',
    PERFORMANCE: 'Performance',
    SECURITY: 'Security',
    REGRESSION: 'Regression',
    INTEGRATION: 'Integration'
  },
  
  // Root causes
  ROOT_CAUSES: {
    CODE_ERROR: 'Code Error',
    DESIGN_ISSUE: 'Design Issue',
    REQUIREMENT_GAP: 'Requirement Gap',
    CONFIGURATION: 'Configuration',
    DATA_ISSUE: 'Data Issue',
    EXTERNAL_DEPENDENCY: 'External Dependency'
  },
  
  // Date formats
  DATE_FORMATS: {
    API_FORMAT: 'YYYY/MM/DD',
    DISPLAY_FORMAT: 'MMM DD, YYYY',
    ISO_FORMAT: 'YYYY-MM-DDTHH:mm:ss.SSSZ'
  }
}