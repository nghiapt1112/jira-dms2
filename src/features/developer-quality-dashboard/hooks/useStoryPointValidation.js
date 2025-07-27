/**
 * Story Point Validation Hook
 * 
 * Validates story point consistency across components using IssueUtils
 * Helps detect inconsistencies between Team Contribution Chart and Individual Tickets
 */

import { useEffect, useMemo } from 'react'
import { IssueUtils } from '../../../shared/utils/IssueUtils'
import { useDeveloperQualityStore } from '../store/developerQualityStore'

/**
 * Hook to validate story point consistency across components
 * @param {Object} options - Validation options
 * @param {boolean} options.enableLogging - Enable console logging in development
 * @param {boolean} options.enableContinuousValidation - Run validation on every data change
 * @returns {Object} Validation results and helper functions
 */
export const useStoryPointValidation = (options = {}) => {
  const { 
    enableLogging = process.env.NODE_ENV === 'development',
    enableContinuousValidation = true 
  } = options
  
  const { data, filteredData, filters } = useDeveloperQualityStore()
  
  /**
   * Validate story point consistency between different data sources
   */
  const validation = useMemo(() => {
    if (!data || !filteredData) {
      return { 
        isConsistent: true, 
        inconsistencies: [], 
        totals: {},
        isValidationPossible: false,
        message: 'Insufficient data for validation'
      }
    }
    
    try {
      // Get team contribution data (from Team Contribution Chart)
      const teamData = filteredData.filteredChartData?.teamContributionChart?.data || []
      
      // Get individual tickets data would need to be calculated separately
      // For now, we'll validate against the source data
      const sourceIssues = data.minimalIssues || []
      
      // Calculate what Individual Tickets should show for comparison
      const allDevelopers = new Set(sourceIssues.map(issue => issue.assignee).filter(a => a && a !== 'Unassigned'))
      const individualDataSimulation = new Map()
      
      // Simulate individual tickets calculation for each developer
      allDevelopers.forEach(developer => {
        const developerTickets = IssueUtils.calculateDeveloperTicketsByTimePeriod(
          sourceIssues,
          developer,
          filters?.timeframe || 'month',
          {
            projectFilter: filters?.projects || null
          }
        )
        individualDataSimulation.set(developer, developerTickets)
      })
      
      // Calculate velocity/effort data
      const deliveredIssues = IssueUtils.filterDeliveredIssues(sourceIssues, {
        projectFilter: filters?.projects || null
      })
      
      const validationResult = IssueUtils.validateStoryPointConsistency({
        teamData,
        individualData: individualDataSimulation,
        velocityData: deliveredIssues
      })
      
      return {
        ...validationResult,
        isValidationPossible: true,
        sourceDataCount: sourceIssues.length,
        filteredDataCount: deliveredIssues.length,
        teamDataPeriods: teamData.length,
        activeDevelopers: allDevelopers.size,
        activeFilters: {
          timeframe: filters?.timeframe || 'month',
          projects: filters?.projects?.length || 0,
          developers: filters?.developers?.length || 0
        }
      }
      
    } catch (error) {
      console.error('Story point validation error:', error)
      return {
        isConsistent: false,
        inconsistencies: [`Validation error: ${error.message}`],
        totals: {},
        isValidationPossible: false,
        error: error.message
      }
    }
  }, [data, filteredData, filters])
  
  /**
   * Validate specific developer's data consistency
   * @param {string} developerName - Name of developer to validate
   * @returns {Object} Developer-specific validation results
   */
  const validateDeveloper = useMemo(() => (developerName) => {
    if (!data?.minimalIssues || !developerName) {
      return { isConsistent: true, message: 'No data available for validation' }
    }
    
    try {
      // Calculate using IssueUtils (what Individual Tickets should show)
      const individualTickets = IssueUtils.calculateDeveloperTicketsByTimePeriod(
        data.minimalIssues,
        developerName,
        filters?.timeframe || 'month',
        {
          projectFilter: filters?.projects || null
        }
      )
      
      // Calculate using IssueUtils (what Team Contribution should show)
      const teamContribution = IssueUtils.calculateStoryPointsByTimePeriod(
        data.minimalIssues,
        filters?.timeframe || 'month',
        {
          developerFilter: [developerName],
          projectFilter: filters?.projects || null
        }
      )
      
      // Calculate totals
      const individualTotal = IssueUtils.calculateTotalFromGroupedTickets(individualTickets)
      const teamTotal = IssueUtils.calculateTotalFromTimeBasedData(teamContribution)
      
      return {
        isConsistent: individualTotal === teamTotal,
        individualTotal,
        teamTotal,
        difference: Math.abs(individualTotal - teamTotal),
        individualPeriods: individualTickets.size,
        teamPeriods: teamContribution.length,
        message: individualTotal === teamTotal 
          ? `✅ Data consistent: ${individualTotal} story points`
          : `❌ Inconsistency detected: Individual(${individualTotal}) vs Team(${teamTotal})`
      }
      
    } catch (error) {
      return {
        isConsistent: false,
        error: error.message,
        message: `Validation error: ${error.message}`
      }
    }
  }, [data, filters])
  
  /**
   * Get summary of current data state for debugging
   */
  const getDataSummary = useMemo(() => () => {
    if (!data?.minimalIssues) return null
    
    return IssueUtils.getIssueSummary(data.minimalIssues, {
      projectFilter: filters?.projects || null
    })
  }, [data, filters])
  
  /**
   * Debug function to log detailed validation information
   */
  const debugValidation = useMemo(() => () => {
    if (!enableLogging) return
    
    console.group('📊 Story Point Validation Debug')
    console.log('Validation Results:', validation)
    console.log('Data Summary:', getDataSummary())
    console.log('Current Filters:', filters)
    
    if (!validation.isConsistent) {
      console.warn('❌ Inconsistencies Found:', validation.inconsistencies)
      console.table(validation.totals)
    } else {
      console.log('✅ All data is consistent')
    }
    
    console.groupEnd()
  }, [validation, getDataSummary, filters, enableLogging])
  
  // Continuous validation logging
  useEffect(() => {
    if (enableLogging && enableContinuousValidation && validation.isValidationPossible) {
      if (!validation.isConsistent) {
        console.warn('🚨 Story Point Inconsistency Detected:', validation.inconsistencies)
        console.table(validation.totals)
      } else if (process.env.NODE_ENV === 'development') {
        console.log('✅ Story Point Validation: All data consistent')
      }
    }
  }, [validation, enableLogging, enableContinuousValidation])
  
  return {
    validation,
    validateDeveloper,
    getDataSummary,
    debugValidation,
    isValid: validation.isConsistent,
    hasData: validation.isValidationPossible
  }
}

export default useStoryPointValidation