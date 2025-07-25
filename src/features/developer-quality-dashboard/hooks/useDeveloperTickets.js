import { useMemo } from 'react'
import { useDeveloperQualityStore } from '../store/developerQualityStore'
import { getTimePeriodKey } from '../../../shared/utils/timeUtils'
import { performanceMonitor } from '../utils/PerformanceMonitor'
import { dataPipelineLogger } from '../../../shared/services/dataPipelineLogger'

/**
 * Custom hook for filtering and grouping tickets by developer and time period
 * Respects Filter components state for projects filtering
 * @param {string} developerName - Name of the selected developer
 * @returns {Object} - Grouped ticket data with metadata
 * 
 * Filtering Logic:
 * 1. Filters by developer (assignee field)
 * 2. Filters by projects from filters.projects (if any selected)
 * 3. Groups by timeframe from filters.timeframe
 * 4. Sorts by resolved/updated date within each time period
 */
export const useDeveloperTickets = (developerName) => {
  // Get store state
  const { data, filters } = useDeveloperQualityStore()
  
  // Memoized filtered and grouped tickets with performance monitoring
  const developerTicketData = useMemo(() => {
    const timer = performanceMonitor.startTimer('developerTicketFiltering')
    
    try {
      // Early return if no data or developer
      if (!data?.minimalIssues || !developerName) {
        timer?.end()
        return {
          groupedTickets: new Map(),
          totalTickets: 0,
          isEmpty: true,
          error: null
        }
      }

      const { minimalIssues } = data
      const timeframe = filters?.timeframe || 'month'
      
      // Debug logging for filter state
      dataPipelineLogger.logDeveloperFiltering(developerName, {
        totalIssues: minimalIssues.length,
        timeframe,
        projectsFilter: filters?.projects || [],
        hasProjectsFilter: !!(filters?.projects && filters.projects.length > 0)
      })
      
      // SPECIAL DEBUG: Check for specific missing tickets
      const missingTickets = ['YUIM-328', 'YUIM-521', 'YUIM-689', 'YUIM-690']
      const foundMissingTickets = minimalIssues.filter(ticket => missingTickets.includes(ticket.key))
      dataPipelineLogger.logMissingTicketsDebug(missingTickets, foundMissingTickets)
      
      // Check if Yudanis tickets exist with different assignee names
      const yudanisVariations = minimalIssues.filter(ticket => 
        ticket.assignee?.toLowerCase().includes('yudanis') || 
        ticket.assignee?.toLowerCase().includes('taqwin') ||
        ticket.assignee?.toLowerCase().includes('rohman')
      )
      dataPipelineLogger.logYudanisVariations(yudanisVariations)
      
      // Filter tickets by developer, projects, and status from Filter components
      const developerTickets = minimalIssues.filter(ticket => {
        // Developer filter (existing)
        if (ticket.assignee !== developerName) return false
        
        // Project filter - respect filters.projects from Filter components
        if (filters.projects && filters.projects.length > 0) {
          // Only show tickets from selected projects
          if (!filters.projects.includes(ticket.project)) return false
        }
        
        // Status filter - exclude specific statuses as mentioned by user
        // User wants "all statuses except: todo, inprogress, rejected"
        const excludedStatuses = ['To Do', 'In Progress', 'Rejected', 'todo', 'inprogress', 'rejected']
        if (ticket.status && excludedStatuses.some(excludedStatus => 
          ticket.status.toLowerCase() === excludedStatus.toLowerCase()
        )) {
          return false
        }
        
        return true
      })
      
      // SPECIAL DEBUG: Check missing tickets after all filtering
      const missingTicketsAfterFiltering = missingTickets.filter(ticketKey => 
        !developerTickets.some(ticket => ticket.key === ticketKey)
      )
      if (missingTicketsAfterFiltering.length > 0) {
        dataPipelineLogger.logMissingTicketsAfterFiltering(
          missingTicketsAfterFiltering, 
          minimalIssues, 
          developerName, 
          filters
        )
      }
      
      // Debug logging for filtering results
      dataPipelineLogger.logDeveloperFilteringResults(developerName, developerTickets, filters)
      
      if (developerTickets.length === 0) {
        timer?.end()
        return {
          groupedTickets: new Map(),
          totalTickets: 0,
          isEmpty: true,
          error: null
        }
      }
      
      // Group tickets by time period
      const groupedTickets = new Map()
      
      developerTickets.forEach(ticket => {
        // Use resolved date first, fall back to updated date
        const dateToUse = ticket.resolved || ticket.updated
        
        if (!dateToUse) {
          console.warn(`Ticket ${ticket.key} has no resolved or updated date`, ticket)
          return
        }
        
        // Get time period key using existing utility
        const periodKey = getTimePeriodKey(dateToUse, timeframe)
        
        if (!periodKey) {
          console.warn(`Could not determine period key for ticket ${ticket.key}`, { dateToUse, timeframe })
          return
        }
        
        // Initialize group if it doesn't exist
        if (!groupedTickets.has(periodKey)) {
          groupedTickets.set(periodKey, [])
        }
        
        // Add ticket to group
        groupedTickets.get(periodKey).push(ticket)
      })
      
      // Sort tickets within each period (resolved date primary, updated date fallback, then by key)
      groupedTickets.forEach((tickets, periodKey) => {
        tickets.sort((a, b) => {
          // Primary sort: resolved date (descending - most recent first)
          const aResolved = a.resolved ? new Date(a.resolved) : null
          const bResolved = b.resolved ? new Date(b.resolved) : null
          
          if (aResolved && bResolved) {
            return bResolved - aResolved
          }
          if (aResolved && !bResolved) return -1
          if (!aResolved && bResolved) return 1
          
          // Secondary sort: updated date (descending - most recent first)
          const aUpdated = a.updated ? new Date(a.updated) : null
          const bUpdated = b.updated ? new Date(b.updated) : null
          
          if (aUpdated && bUpdated) {
            return bUpdated - aUpdated
          }
          if (aUpdated && !bUpdated) return -1
          if (!aUpdated && bUpdated) return 1
          
          // Tertiary sort: ticket key (ascending for consistency)
          return a.key.localeCompare(b.key)
        })
      })
      
      // Sort period keys for consistent display order
      const sortedPeriods = Array.from(groupedTickets.keys()).sort((a, b) => {
        // Sort in descending order (most recent first)
        return b.localeCompare(a)
      })
      
      // Create new Map with sorted keys
      const sortedGroupedTickets = new Map()
      sortedPeriods.forEach(periodKey => {
        sortedGroupedTickets.set(periodKey, groupedTickets.get(periodKey))
      })
      
      timer?.end()
      performanceMonitor.recordMetric('developerTicketCacheHit', 1)
      
      return {
        groupedTickets: sortedGroupedTickets,
        totalTickets: developerTickets.length,
        isEmpty: false,
        error: null,
        metadata: {
          timeframe,
          periodCount: sortedGroupedTickets.size,
          processingTime: timer?.duration || 0
        }
      }
      
    } catch (error) {
      timer?.end()
      performanceMonitor.recordMetric('developerTicketCacheMiss', 1)
      console.error('Error in useDeveloperTickets:', error)
      
      return {
        groupedTickets: new Map(),
        totalTickets: 0,
        isEmpty: true,
        error: error.message || 'Unknown error filtering developer tickets'
      }
    }
  }, [data?.minimalIssues, developerName, filters?.timeframe, filters?.projects])
  
  // Additional computed values
  const computedData = useMemo(() => {
    if (developerTicketData.isEmpty) {
      return {
        ...developerTicketData,
        ticketsByType: new Map(),
        ticketsByStatus: new Map(),
        averageStoryPoints: 0,
        totalStoryPoints: 0
      }
    }
    
    // Calculate additional analytics
    const allTickets = Array.from(developerTicketData.groupedTickets.values()).flat()
    
    const ticketsByType = new Map()
    const ticketsByStatus = new Map()
    let totalStoryPoints = 0
    
    allTickets.forEach(ticket => {
      // Count by type
      const type = ticket.issueType || 'Unknown'
      ticketsByType.set(type, (ticketsByType.get(type) || 0) + 1)
      
      // Count by status
      const status = ticket.status || 'Unknown'
      ticketsByStatus.set(status, (ticketsByStatus.get(status) || 0) + 1)
      
      // Sum story points
      totalStoryPoints += ticket.storyPoints || 0
    })
    
    const averageStoryPoints = allTickets.length > 0 ? totalStoryPoints / allTickets.length : 0
    
    return {
      ...developerTicketData,
      ticketsByType,
      ticketsByStatus,
      averageStoryPoints: Math.round(averageStoryPoints * 10) / 10, // Round to 1 decimal
      totalStoryPoints
    }
  }, [developerTicketData])
  
  return computedData
}

export default useDeveloperTickets