import axios from 'axios'
import axiosInstance from './axiosConfig'
import { JIRA_CONSTANTS } from '../../constants/jiraConstants.js'

const _CHUNK_SIZE = 1024 * 1024

class JiraDataService {
  constructor() {
    this.cache = new Map()
    this.downloadControllers = new Map()
  }

  async fetchJiraSnapshots(options = {}) {
    const {
      projects = ["WON","YUIM","STU","DAAI","DAICO","TOUC","TG","NKR2","SG","BCP","SIP","IP","HG","CF","TIT","OOPS","JSR","RAG","ECHO","SEK","PMAX","MIT","IS","KB","PDS","TS","YUB"],
      fromDate = "2025/01/01",
      toDate = "2025/07/11",
      selectedFields = `project,resolutiondate,status,assignee,issuetype,timespent,timeoriginalestimate,timetracking,created,priority,${JIRA_CONSTANTS.CUSTOM_FIELDS.STORY_POINTS},${JIRA_CONSTANTS.CUSTOM_FIELDS.SPRINT},${JIRA_CONSTANTS.CUSTOM_FIELDS.BUG_TYPE},${JIRA_CONSTANTS.CUSTOM_FIELDS.ROOT_CAUSE},${JIRA_CONSTANTS.CUSTOM_FIELDS.BUG_SEVERITY},${JIRA_CONSTANTS.CUSTOM_FIELDS.START_DATE},${JIRA_CONSTANTS.CUSTOM_FIELDS.BUG_CAUSED_BY},reporter`,
      includeCurrentQuarter = true,
      useSnapshots = true
    } = options
    
    const jql = `project IN (${projects.map(p => `"${p}"`).join(',')}) AND "updated" >= "${fromDate}" AND "updated" <= "${toDate}"`
    
    const payload = {
      jql,
      selectedProjects: projects,
      selectedFields,
      fromDate,
      toDate,
      startDate: fromDate,
      endDate: toDate,
      includeCurrentQuarter,
      statuses: [],
      issueTypes: [],
      bugTypes: [],
      rootCauses: [],
      useSnapshots
    }
    
    const response = await axiosInstance.post('/jira/issues/v3', payload)
    return response
  }

  async downloadSnapshotData(url, onProgress = null) {
    const cacheKey = url
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)
    }
    
    const controller = new AbortController()
    const fileId = this.extractFileIdFromUrl(url)
    this.downloadControllers.set(fileId, controller)
    
    try {
      const response = await axios.get(url, {
        responseType: 'json',
        signal: controller.signal,
        onDownloadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
            onProgress(fileId, progress)
          }
        },
        timeout: 600000
      })
      
      const data = response.data
      
      if (data.byteLength < 10 * 1024 * 1024) {
        this.cache.set(cacheKey, data)
        
        setTimeout(() => {
          this.cache.delete(cacheKey)
        }, 15 * 60 * 1000)
      }
      
      return data
    } catch (error) {
      if (error.name === 'CanceledError') {
        throw new Error('Download cancelled')
      }
      
      if (error.response?.status === 403) {
        throw new Error('Pre-signed URL has expired. Please refresh the data')
      }
      
      throw error
    } finally {
      this.downloadControllers.delete(fileId)
    }
  }

  async processSnapshotsData(snapshots, currentQuarter, onProgress = null) {
    const allData = []
    
    const downloadSnapshot = async (snapshot, index) => {
      try {
        const data = await this.downloadSnapshotData(
          snapshot.url,
          (fileId, progress) => {
            if (onProgress) {
              onProgress(fileId, progress)
            }
          }
        )
        
        return Array.isArray(data) ? data : []
      } catch (error) {
        console.error(`Failed to download snapshot ${index + 1}:`, error)
        throw error
      }
    }
    
    const snapshotPromises = snapshots.map((snapshot, index) => 
      downloadSnapshot(snapshot, index)
    )
    
    if (currentQuarter?.url) {
      snapshotPromises.push(
        downloadSnapshot(currentQuarter, snapshots.length)
      )
    }
    
    try {
      const results = await Promise.all(snapshotPromises)
      results.forEach(data => {
        if (data && data.length > 0) {
          allData.push(...data)
        }
      })
    } catch (error) {
      throw new Error('Failed to download one or more snapshots')
    }
    
    return this.deduplicateIssues(allData)
  }

  getCurrentQuarterData() {
    const cached = this.cache.get('current-quarter')
    if (cached) {
      return Promise.resolve(cached)
    }
    
    return axiosInstance.get('/jira/current-quarter')
      .then(response => {
        this.cache.set('current-quarter', response.data)
        return response.data
      })
  }

  mergeQuarterlyData(quarterlyDataArray) {
    const mergedData = []
    const issueMap = new Map()
    
    quarterlyDataArray.forEach(quarterData => {
      if (Array.isArray(quarterData)) {
        quarterData.forEach(issue => {
          const key = issue.key || issue.id
          if (key && !issueMap.has(key)) {
            issueMap.set(key, issue)
            mergedData.push(issue)
          } else if (key && issueMap.has(key)) {
            const existingIssue = issueMap.get(key)
            if (new Date(issue.updated) > new Date(existingIssue.updated)) {
              const index = mergedData.findIndex(i => (i.key || i.id) === key)
              if (index !== -1) {
                mergedData[index] = issue
                issueMap.set(key, issue)
              }
            }
          }
        })
      }
    })
    
    return mergedData
  }

  cacheSnapshotData(data, cacheKey = 'snapshot-data') {
    try {
      const serializedData = JSON.stringify(data)
      const chunks = []
      const chunkSize = 5 * 1024 * 1024
      
      for (let i = 0; i < serializedData.length; i += chunkSize) {
        chunks.push(serializedData.slice(i, i + chunkSize))
      }
      
      localStorage.setItem(`${cacheKey}-chunks`, chunks.length.toString())
      chunks.forEach((chunk, index) => {
        localStorage.setItem(`${cacheKey}-${index}`, chunk)
      })
      
      localStorage.setItem(`${cacheKey}-timestamp`, Date.now().toString())
    } catch (error) {
      console.warn('Failed to cache snapshot data:', error)
    }
  }

  getCachedSnapshotData(cacheKey = 'snapshot-data') {
    try {
      const timestamp = localStorage.getItem(`${cacheKey}-timestamp`)
      if (!timestamp) return null
      
      const age = Date.now() - parseInt(timestamp)
      if (age > 24 * 60 * 60 * 1000) {
        this.clearCachedSnapshotData(cacheKey)
        return null
      }
      
      const chunks = parseInt(localStorage.getItem(`${cacheKey}-chunks`) || '0')
      if (chunks === 0) return null
      
      let serializedData = ''
      for (let i = 0; i < chunks; i++) {
        const chunk = localStorage.getItem(`${cacheKey}-${i}`)
        if (!chunk) return null
        serializedData += chunk
      }
      
      return JSON.parse(serializedData)
    } catch (error) {
      console.warn('Failed to retrieve cached snapshot data:', error)
      return null
    }
  }

  clearCachedSnapshotData(cacheKey = 'snapshot-data') {
    const chunks = parseInt(localStorage.getItem(`${cacheKey}-chunks`) || '0')
    for (let i = 0; i < chunks; i++) {
      localStorage.removeItem(`${cacheKey}-${i}`)
    }
    localStorage.removeItem(`${cacheKey}-chunks`)
    localStorage.removeItem(`${cacheKey}-timestamp`)
  }

  cancelDownload(fileId) {
    const controller = this.downloadControllers.get(fileId)
    if (controller) {
      controller.abort()
      this.downloadControllers.delete(fileId)
    }
  }

  cancelAllDownloads() {
    this.downloadControllers.forEach(controller => controller.abort())
    this.downloadControllers.clear()
  }

  extractFileIdFromUrl(url) {
    try {
      const urlObj = new URL(url)
      const pathParts = urlObj.pathname.split('/')
      return pathParts[pathParts.length - 1].split('.')[0]
    } catch {
      return url
    }
  }

  deduplicateIssues(issues) {
    const uniqueMap = new Map()
    
    issues.forEach(issue => {
      const key = issue.key || issue.id
      if (key) {
        const existing = uniqueMap.get(key)
        if (!existing || new Date(issue.updated) > new Date(existing.updated)) {
          uniqueMap.set(key, issue)
        }
      }
    })
    
    return Array.from(uniqueMap.values())
  }
}

export default new JiraDataService()