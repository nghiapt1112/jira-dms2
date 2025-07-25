import axiosInstance from '../../../shared/services/axiosConfig'
import { JIRA_CONSTANTS } from '../../../constants/jiraConstants'
import { getCurrentDate, formatDate, DATE_FORMATS, addDays } from '../../../shared/utils/dateUtils'

export const jiraIssuesService = {
  // Get snapshot URLs (based on working curl command)
  getSnapshotUrls: async (filters = {}) => {
    // CRITICAL FIX: Match exact working curl payload structure
    const defaultPayload = {
      jql: `project IN (${JIRA_CONSTANTS.DEFAULT_PROJECTS.map(p => `"${p}"`).join(',')})`,
      selectedProjects: JIRA_CONSTANTS.DEFAULT_PROJECTS,
      selectedFields: JIRA_CONSTANTS.SELECTED_FIELDS,
      // FIXED: Use current year for date range
      fromDate: filters.fromDate || `${new Date().getFullYear()}/01/01`,  // Start from January 1st of current year
      toDate: filters.toDate || formatDate(addDays(getCurrentDate(), 1), DATE_FORMATS.YEAR_MONTH_DAY),  // Tomorrow
      startDate: filters.startDate || filters.fromDate || `${new Date().getFullYear()}/01/01`,
      endDate: filters.endDate || filters.toDate || formatDate(addDays(getCurrentDate(), 1), DATE_FORMATS.YEAR_MONTH_DAY),
      includeCurrentQuarter: filters.includeCurrentQuarter ?? true,
      statuses: filters.statuses || [],
      issueTypes: filters.issueTypes || [],
      bugTypes: filters.bugTypes || [],
      rootCauses: filters.rootCauses || [],
      useSnapshots: filters.useSnapshots ?? true,
      // CRITICAL: Ensure these params match working curl
      maxResults: 50000,  // High limit to ensure all data
      expand: "changelog"  // Include changelog for comprehensive data
    }
    
    // Override with specific selected projects if provided
    if (filters.selectedProjects && filters.selectedProjects.length > 0) {
      defaultPayload.selectedProjects = filters.selectedProjects
      defaultPayload.jql = `project IN (${filters.selectedProjects.map(p => `"${p}"`).join(',')})`
    }
    
    try {
      const requestPayload = {
        ...defaultPayload,
        ...filters
      }
      
      // CRITICAL DEBUG: Log the exact request being sent
      console.log('🔍 JIRA API REQUEST:', {
        url: JIRA_CONSTANTS.API_ENDPOINTS.JIRA_ISSUES_V3,
        payload: requestPayload,
        payloadSize: JSON.stringify(requestPayload).length
      })
      
      const response = await axiosInstance.post(
        JIRA_CONSTANTS.API_ENDPOINTS.JIRA_ISSUES_V3,
        requestPayload,
        {
          headers: {
            'Accept': 'application/json, text/plain, */*',
            'Content-Type': 'application/json'
          }
        }
      )
      
      // CRITICAL DEBUG: Log the raw API response with detailed analysis
      console.log('🔍 JIRA API RAW RESPONSE:', {
        status: response.status,
        statusText: response.statusText,
        responseKeys: Object.keys(response.data || {}),
        responseData: response.data,
        hasSnapshots: !!response.data?.snapshots,
        snapshotsCount: response.data?.snapshots?.length || 0,
        // Additional debugging for snapshots issue
        snapshotsProperty: response.data?.snapshots,
        snapshotsType: typeof response.data?.snapshots,
        isSnapshotsArray: Array.isArray(response.data?.snapshots),
        totalRecords: response.data?.totalRecords,
        // Check for alternative property names
        hasQuarters: !!response.data?.quarters,
        hasPreviousQuarters: !!response.data?.previousQuarters,
        hasCurrentQuarter: !!response.data?.currentQuarter,
        hasData: !!response.data?.data,
        allProperties: Object.keys(response.data || {}).map(key => ({
          key,
          type: typeof response.data[key],
          isArray: Array.isArray(response.data[key]),
          length: Array.isArray(response.data[key]) ? response.data[key].length : 'N/A'
        }))
      })
      
      // EMERGENCY DEBUG: Store response in window for inspection
      if (typeof window !== 'undefined') {
        window.lastAPIResponse = {
          fullResponse: response,
          data: response.data,
          timestamp: new Date().toISOString()
        }
        console.log('🔍 RESPONSE STORED IN window.lastAPIResponse for inspection')
      }
      
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