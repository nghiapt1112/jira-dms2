import { useMemo } from 'react'
import { useDeveloperQualityStore } from '../store/developerQualityStore'
import { performanceMonitor } from '../utils/PerformanceMonitor'
import { dataPipelineLogger } from '../../../shared/services/dataPipelineLogger'
import { IssueUtils } from '../../../shared/utils/IssueUtils'

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
      
      // CRITICAL: timeframe must come from Zustand filters.timeframe
      if (!timeframe) {
        console.error('useDeveloperTickets: timeframe is required from Zustand filters.timeframe')
        timer?.end()
        return {
          groupedTickets: new Map(),
          totalTickets: 0,
          isEmpty: true,
          error: 'Missing timeframe from filters'
        }
      }
      
      // Use IssueUtils for consistent calculation (DRY & SOLID compliant)
      const groupedTickets = IssueUtils.calculateDeveloperTicketsByTimePeriod(
        minimalIssues, 
        developerName, 
        timeframe, // Dynamic from Zustand filters.timeframe
        {
          projectFilter: filters?.projects || null
          // Delivered statuses are mandatory - no exclusion logic needed
        }
      )
      
      // Debug logging using IssueUtils
      if (process.env.NODE_ENV === 'development') {
        const developerIssues = minimalIssues.filter(issue => issue.assignee === developerName)
        const deliveredIssues = Array.from(groupedTickets.values()).flat()
        IssueUtils.debugCalculation(developerIssues, deliveredIssues, 'Individual Tickets')
      }
      
      // Calculate total tickets
      const totalTickets = Array.from(groupedTickets.values()).reduce((total, tickets) => total + tickets.length, 0)
      
      if (totalTickets === 0) {
        timer?.end()
        return {
          groupedTickets: new Map(),
          totalTickets: 0,
          isEmpty: true,
          error: null
        }
      }
      
      timer?.end()
      performanceMonitor.recordMetric('developerTicketCacheHit', 1)
      
      return {
        groupedTickets,
        totalTickets,
        isEmpty: false,
        error: null,
        metadata: {
          timeframe,
          periodCount: groupedTickets.size,
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
    
    // Calculate additional analytics using IssueUtils
    const allTickets = Array.from(developerTicketData.groupedTickets.values()).flat()
    
    const ticketsByType = new Map()
    const ticketsByStatus = new Map()
    
    allTickets.forEach(ticket => {
      // Count by type
      const type = ticket.issueType || 'Unknown'
      ticketsByType.set(type, (ticketsByType.get(type) || 0) + 1)
      
      // Count by status
      const status = ticket.status || 'Unknown'
      ticketsByStatus.set(status, (ticketsByStatus.get(status) || 0) + 1)
    })
    
    // Use IssueUtils for consistent story points calculation
    const totalStoryPoints = IssueUtils.calculateTotalStoryPoints(allTickets)
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