import React, { useMemo } from 'react'
import PropTypes from 'prop-types'
import { memberConfiguration } from '../../../../constants/memberConfiguration'
import { 
  Box, 
  Paper, 
  Typography,
  Grid,
  Chip,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  LinearProgress
} from '@mui/material'
import { 
  Person as PersonIcon,
  BugReport as BugIcon,
  AccessTime as TimeIcon,
  Assignment as TaskIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon
} from '@mui/icons-material'
import EffortEffectivenessChart from '../EffortEffectivenessChart'

/**
 * DeveloperDetailPanel - Comprehensive developer metrics panel
 * Displays detailed pre-processed data when a single developer is selected from filters
 * 
 * @param {Object} props - Component props
 * @param {string} props.developerName - Name of the selected developer
 * @param {Object} props.metrics - Developer quality metrics containing comprehensive data
 * @param {Object} props.filteredData - Filtered data containing developer details
 * @returns {JSX.Element} Developer detail panel component
 */
const DeveloperDetailPanel = ({ 
  developerName, 
  metrics, 
  filteredData,
  statusFilter = memberConfiguration.filterDefaults.statusFilter 
}) => {
  // Extract comprehensive developer data from the bug rate analysis (contains all detailed metrics)
  const developerData = useMemo(() => {
    if (!developerName) {
      return null
    }

    console.log('🔍 DEVELOPER PANEL: Available data sources:', {
      metrics: metrics ? Object.keys(metrics) : null,
      bugRateAnalysis: metrics?.bugRateAnalysis ? Object.keys(metrics.bugRateAnalysis) : null,
      bugRateAnalysisDevelopers: metrics?.bugRateAnalysis?.developers?.length || 0,
      developersType: Array.isArray(metrics?.bugRateAnalysis?.developers) ? 'Array' : 'Other',
      developersPreview: metrics?.bugRateAnalysis?.developers?.slice(0, 2)
    })
    
    // COMPREHENSIVE DEBUG: Check all available developer data sources
    console.log('🔍 DEVELOPER PANEL: Full data investigation for', developerName, ':', {
      bugRateDevs: metrics?.bugRateAnalysis?.developers,
      teamContribDevs: metrics?.teamContribution?.developerStats,
      topContributors: metrics?.teamContribution?.topContributors,
      filteredDataSources: filteredData ? Object.keys(filteredData) : null
    })

    // The bug rate analysis contains the COMPLETE developer metrics including:
    // - Story points data
    // - Time tracking data (totalTimeSpentHours, timePerStoryPoint, etc.)
    // - Extended bug analysis
    // - Quality metrics and trends
    if (metrics?.bugRateAnalysis?.developers) {
      const comprehensiveDeveloperData = metrics.bugRateAnalysis.developers.find(
        dev => dev.developer === developerName || dev.name === developerName
      )
      
      if (comprehensiveDeveloperData) {
        console.log('🔍 DEVELOPER PANEL: Found comprehensive data for', developerName, ':', {
          hasTimeSpentHours: 'totalTimeSpentHours' in comprehensiveDeveloperData,
          hasTimePerStoryPoint: 'timePerStoryPoint' in comprehensiveDeveloperData,
          hasSeverityBreakdown: 'severityBreakdown' in comprehensiveDeveloperData,
          hasRootCauseBreakdown: 'rootCauseBreakdown' in comprehensiveDeveloperData,
          hasWeeklyTimeData: 'weeklyTimeData' in comprehensiveDeveloperData,
          allKeys: Object.keys(comprehensiveDeveloperData),
          comprehensiveDeveloperData
        })
        return comprehensiveDeveloperData
      }
    }

    // Fallback: if bug rate analysis doesn't have the data, collect from other sources
    const result = {
      developer: developerName,
      message: 'Enhanced data from multiple sources - comprehensive metrics may be limited'
    }

    // Try to get additional data from team contribution stats (Map)
    if (metrics?.teamContribution?.developerStats) {
      let teamContribDev = null
      if (metrics.teamContribution.developerStats instanceof Map) {
        teamContribDev = metrics.teamContribution.developerStats.get(developerName)
      } else if (Array.isArray(metrics.teamContribution.developerStats)) {
        teamContribDev = metrics.teamContribution.developerStats.find(
          dev => dev.developer === developerName || dev.name === developerName
        )
      }
      if (teamContribDev) {
        // Map team contribution fields to expected comprehensive format
        Object.assign(result, {
          totalIssues: teamContribDev.contributions || 0,
          bugs: teamContribDev.bugs || 0,
          bugRate: teamContribDev.contributions > 0 ? (teamContribDev.bugs / teamContribDev.contributions) * 100 : 0,
          projects: teamContribDev.projects ? Array.from(teamContribDev.projects) : [],
          storyPoints: teamContribDev.storyPoints || 0,
          // Try to extract time tracking if available
          ...(teamContribDev.timeTrackingData && {
            totalTimeSpentHours: teamContribDev.timeTrackingData.totalTimeSpentHours || 0,
            timePerStoryPoint: teamContribDev.timeTrackingData.timePerStoryPoint || 0,
            timeLoggedIssues: teamContribDev.timeTrackingData.timeLoggedIssues || 0,
            weeklyTimeData: teamContribDev.timeTrackingData.weeklyTimeTracking ? 
              Array.from(teamContribDev.timeTrackingData.weeklyTimeTracking.entries()).map(([week, hours]) => ({week, hours})) : []
          })
        })
      }
    }

    // Add any available data from top contributors
    if (metrics?.teamContribution?.topContributors) {
      const topContribDev = metrics.teamContribution.topContributors.find(
        dev => dev.developer === developerName || dev.name === developerName
      )
      if (topContribDev) {
        Object.assign(result, {
          totalIssues: topContribDev.contributions || result.totalIssues || 0,
          storyPoints: topContribDev.storyPoints || result.storyPoints || 0,
          percentage: topContribDev.percentage || 0,
          storyPointsPercentage: topContribDev.storyPointsPercentage || 0
        })
      }
    }

    // Set trend if not already set
    if (!result.trend) {
      result.trend = 'stable'
    }

    console.log('🔍 DEVELOPER PANEL: Enhanced fallback data for', developerName, ':', result)
    return result
  }, [metrics, developerName])

  // Helper function to get trend icon
  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'improving':
        return <TrendingUpIcon sx={{ color: 'success.main' }} />
      case 'declining':
        return <TrendingDownIcon sx={{ color: 'error.main' }} />
      case 'stable':
      default:
        return <TrendingFlatIcon sx={{ color: 'info.main' }} />
    }
  }

  // Helper function to get trend color
  const getTrendColor = (trend) => {
    switch (trend) {
      case 'improving':
        return 'success'
      case 'declining':
        return 'error'
      case 'stable':
      default:
        return 'info'
    }
  }

  // Helper function to format numbers
  const formatNumber = (num, decimals = 1) => {
    if (typeof num !== 'number') return 'N/A'
    return Number(num.toFixed(decimals))
  }

  // Helper function to format hours
  const formatHours = (hours) => {
    if (typeof hours !== 'number') return 'N/A'
    return `${formatNumber(hours)}h`
  }

  if (!developerData || (!developerData.developer && !developerData.message)) {
    return (
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <PersonIcon color="primary" />
          <Typography variant="h6">
            Developer Details: {developerName}
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          No detailed metrics available for this developer.
        </Typography>
        
        <Box 
          component="pre" 
          sx={{ 
            backgroundColor: '#f5f5f5',
            padding: 2,
            borderRadius: 1,
            overflow: 'auto',
            fontSize: '0.875rem',
            fontFamily: 'monospace',
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word',
            maxHeight: '300px',
            mt: 2
          }}
        >
          Available data structure:
          {JSON.stringify({ 
            metrics: metrics ? Object.keys(metrics) : null,
            filteredData: filteredData ? Object.keys(filteredData) : null 
          }, null, 2)}
        </Box>
      </Paper>
    )
  }

  return (
    <Box sx={{ mb: 3 }}>
      {/* Header */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <PersonIcon color="primary" />
          <Typography variant="h6">
            Individual Analysis: {developerData.developer || developerName}
          </Typography>
        </Box>
      </Paper>

      {/* Effort Effectiveness Chart */}
      <Box sx={{ mb: 3 }}>
        <EffortEffectivenessChart 
          developerData={developerData}
          selectedDeveloper={developerData.developer || developerName}
          statusFilter={statusFilter}
        />
      </Box>

      {/* Optional: Keep debug data in development */}
      {process.env.NODE_ENV === 'development' && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Developer Data (Debug):
          </Typography>
          
          <Box 
            component="pre" 
            sx={{ 
              backgroundColor: '#f5f5f5',
              padding: 2,
              borderRadius: 1,
              overflow: 'auto',
              fontSize: '0.75rem',
              fontFamily: 'monospace',
              whiteSpace: 'pre-wrap',
              wordWrap: 'break-word',
              maxHeight: '300px'
            }}
          >
            {JSON.stringify(developerData, null, 2)}
          </Box>
        </Paper>
      )}
    </Box>
  )
}

DeveloperDetailPanel.propTypes = {
  developerName: PropTypes.string.isRequired,
  metrics: PropTypes.object,
  filteredData: PropTypes.object,
  statusFilter: PropTypes.arrayOf(PropTypes.string)
}

DeveloperDetailPanel.defaultProps = {
  metrics: null,
  filteredData: null,
  statusFilter: memberConfiguration.filterDefaults.statusFilter
}

export default React.memo(DeveloperDetailPanel)