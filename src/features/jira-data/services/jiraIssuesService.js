import axiosInstance from '../../../shared/services/axiosConfig'
import { JIRA_CONSTANTS } from '../../../constants/jiraConstants'

export const jiraIssuesService = {
  // Get snapshot URLs (based on your curl)
  getSnapshotUrls: async (filters = {}) => {
    const defaultPayload = {
      jql: `project IN (${JIRA_CONSTANTS.DEFAULT_PROJECTS.map(p => `"${p}"`).join(',')})`,
      selectedProjects: JIRA_CONSTANTS.DEFAULT_PROJECTS,
      selectedFields: JIRA_CONSTANTS.SELECTED_FIELDS,
      fromDate: filters.fromDate || '2025/01/01',
      toDate: filters.toDate || '2025/07/11',
      startDate: filters.startDate || filters.fromDate || '2025/01/01',
      endDate: filters.endDate || filters.toDate || '2025/07/11',
      includeCurrentQuarter: filters.includeCurrentQuarter ?? true,
      statuses: filters.statuses || [],
      issueTypes: filters.issueTypes || [],
      bugTypes: filters.bugTypes || [],
      rootCauses: filters.rootCauses || [],
      useSnapshots: filters.useSnapshots ?? true
    }
    
    // Override with specific selected projects if provided
    if (filters.selectedProjects && filters.selectedProjects.length > 0) {
      defaultPayload.selectedProjects = filters.selectedProjects
      defaultPayload.jql = `project IN (${filters.selectedProjects.map(p => `"${p}"`).join(',')})`
    }
    
    try {
      const response = await axiosInstance.post(
        JIRA_CONSTANTS.API_ENDPOINTS.JIRA_ISSUES_V3,
        {
          ...defaultPayload,
          ...filters
        },
        {
          headers: {
            'Accept': 'application/json, text/plain, */*',
            'Content-Type': 'application/json'
          }
        }
      )
      
      return response.data
    } catch (error) {
      console.error('Error fetching snapshot URLs:', error)
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Failed to fetch JIRA snapshot URLs'
      )
    }
  },
  
  // Validate snapshot URLs before download
  validateSnapshotUrls: async (snapshots) => {
    const validSnapshots = []
    const currentTime = new Date().getTime()
    
    for (const snapshot of snapshots) {
      try {
        // Check if URL is still valid (not expired)
        // Assuming the snapshot was created recently, add expiresIn to current time
        const expirationTime = currentTime + (snapshot.expiresIn * 1000)
        
        if (currentTime < expirationTime) {
          validSnapshots.push(snapshot)
        } else {
          console.warn(`Snapshot URL expired: Q${snapshot.quarter} ${snapshot.year}`)
        }
      } catch (error) {
        console.error('Error validating snapshot URL:', error)
      }
    }
    
    return validSnapshots
  },
  
  // Retry failed snapshot request
  retrySnapshotRequest: async (filters, maxRetries = JIRA_CONSTANTS.DOWNLOAD_SETTINGS.MAX_RETRIES) => {
    let lastError
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Snapshot request attempt ${attempt}...`)
        const response = await jiraIssuesService.getSnapshotUrls(filters)
        return response
      } catch (error) {
        lastError = error
        console.warn(`Snapshot request attempt ${attempt} failed:`, error.message)
        
        if (attempt < maxRetries) {
          // Wait before retry (exponential backoff)
          const delay = JIRA_CONSTANTS.DOWNLOAD_SETTINGS.RETRY_DELAY * Math.pow(2, attempt - 1)
          console.log(`Waiting ${delay}ms before retry...`)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }
    
    throw lastError
  },
  
  // Parse snapshot metadata
  parseSnapshotMetadata: (snapshots) => {
    const totalRecords = snapshots.reduce((sum, snapshot) => sum + (snapshot.recordCount || 0), 0)
    const totalSize = snapshots.reduce((sum, snapshot) => sum + (snapshot.fileSize || 0), 0)
    
    return {
      totalSnapshots: snapshots.length,
      totalRecords,
      totalSize,
      quarters: snapshots.map(s => ({
        year: s.year,
        quarter: s.quarter,
        records: s.recordCount,
        size: s.fileSize
      }))
    }
  },
  
  // Build JQL query from filters
  buildJQLQuery: (filters) => {
    const conditions = []
    
    // Projects
    if (filters.selectedProjects && filters.selectedProjects.length > 0) {
      conditions.push(`project IN (${filters.selectedProjects.map(p => `"${p}"`).join(',')})`)
    }
    
    // Issue types
    if (filters.issueTypes && filters.issueTypes.length > 0) {
      conditions.push(`issuetype IN (${filters.issueTypes.map(t => `"${t}"`).join(',')})`)
    }
    
    // Statuses
    if (filters.statuses && filters.statuses.length > 0) {
      conditions.push(`status IN (${filters.statuses.map(s => `"${s}"`).join(',')})`)
    }
    
    // Bug types (custom field)
    if (filters.bugTypes && filters.bugTypes.length > 0) {
      conditions.push(`"${JIRA_CONSTANTS.CUSTOM_FIELDS.BUG_TYPE}" IN (${filters.bugTypes.map(b => `"${b}"`).join(',')})`)
    }
    
    // Root causes (custom field)
    if (filters.rootCauses && filters.rootCauses.length > 0) {
      conditions.push(`"${JIRA_CONSTANTS.CUSTOM_FIELDS.ROOT_CAUSE}" IN (${filters.rootCauses.map(r => `"${r}"`).join(',')})`)
    }
    
    // Date range
    if (filters.fromDate) {
      conditions.push(`created >= "${filters.fromDate}"`)
    }
    if (filters.toDate) {
      conditions.push(`created <= "${filters.toDate}"`)
    }
    
    return conditions.length > 0 ? conditions.join(' AND ') : 'project IS NOT EMPTY'
  },
  
  // Format date for JIRA API
  formatDateForAPI: (date) => {
    if (!date) return null
    
    // If already in YYYY/MM/DD format, return as is
    if (/^\d{4}\/\d{2}\/\d{2}$/.test(date)) {
      return date
    }
    
    // Convert from various formats
    const dateObj = new Date(date)
    if (isNaN(dateObj)) {
      console.warn('Invalid date:', date)
      return null
    }
    
    const year = dateObj.getFullYear()
    const month = String(dateObj.getMonth() + 1).padStart(2, '0')
    const day = String(dateObj.getDate()).padStart(2, '0')
    
    return `${year}/${month}/${day}`
  }
}