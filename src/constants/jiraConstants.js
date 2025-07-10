export const JIRA_CONSTANTS = {
  // Default projects from your curl command
  DEFAULT_PROJECTS: [
    "WON", "YUIM", "STU", "DAAI", "DAICO", "TOUC", "TG", "NKR2", 
    "SG", "BCP", "SIP", "IP", "HG", "CF", "TIT", "OOPS", "JSR", 
    "RAG", "ECHO", "SEK", "PMAX", "MIT", "IS", "KB", "PDS", "TS", "YUB"
  ],
  
  // Selected fields from your curl command
  SELECTED_FIELDS: "project,resolutiondate,status,assignee,issuetype,timespent,timeoriginalestimate,timetracking,created,priority,customfield_10028,customfield_10020,customfield_10271,customfield_10272,customfield_10049,customfield_10015,customfield_10636,reporter",
  
  // Custom field mappings (from your data-structures.md)
  CUSTOM_FIELDS: {
    STORY_POINTS: 'customfield_10028',
    SPRINT: 'customfield_10020',
    BUG_TYPE: 'customfield_10271',
    ROOT_CAUSE: 'customfield_10272',
    BUG_SEVERITY: 'customfield_10049',
    START_DATE: 'customfield_10015',
    BUG_CAUSED_BY: 'customfield_10636'
  },
  
  // API endpoints
  API_ENDPOINTS: {
    JIRA_ISSUES_V3: '/jira/issues/v3',
    BASE_URL: import.meta.env.VITE_API_BASE_URL || 'https://6rornklpte.execute-api.ap-southeast-1.amazonaws.com/dev/api'
  },
  
  // Download settings
  DOWNLOAD_SETTINGS: {
    TIMEOUT: 300000, // 5 minutes
    MAX_RETRIES: 3,
    RETRY_DELAY: 2000, // 2 seconds
    CHUNK_SIZE: 1000000, // 1MB chunks
    CONNECTION_SPEED: 1000000 // 1MB/s default
  },
  
  // Cache settings
  CACHE_SETTINGS: {
    EXPIRY_HOURS: 24,
    MAX_SIZE_MB: 100,
    STORAGE_KEY: 'jira_data_cache',
    METADATA_KEY: 'jira_data_metadata'
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