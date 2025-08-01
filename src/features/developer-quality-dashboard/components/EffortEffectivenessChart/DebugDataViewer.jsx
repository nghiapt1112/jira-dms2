/**
 * Debug Data Viewer Component
 * Shows raw JSON data used by Effort Effectiveness Chart for debugging
 */

import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { 
  getBugAttributionStats, 
  getBugAttributionDetails,
  isBugIssue
} from '../../../../shared/utils/bugAttributionUtils'
import { useDeveloperQualityStore } from '../../store/developerQualityStore'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Collapse,
  Paper,
  Chip
} from '@mui/material'
import {
  BugReport as DebugIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  ContentCopy as CopyIcon
} from '@mui/icons-material'

const DebugDataViewer = ({ 
  developerData, 
  selectedDeveloper, 
  filteredData, 
  metrics
}) => {
  // Get bug attribution mode from Zustand store
  const bugAttributionMode = useDeveloperQualityStore((state) => state.bugAttributionMode)
  const [expanded, setExpanded] = useState(false)

  // Collect all the data that's passed to the chart
  // NOTE: This now uses proper bug attribution based on selected mode
  const relevantIssues = filteredData?.filteredIssues?.filter(issue => {
    if (bugAttributionMode === 'assignee') {
      // Legacy mode: use assignee for all issues including bugs
      return issue.assignee === selectedDeveloper
    } else {
      // Enhanced mode: For bugs, check custom fields; for others, use assignee
      if (isBugIssue(issue)) {
        const causedBy = issue.fields?.customfield_10636 || 
                        issue.fields?.customfield_10002 || 
                        issue.assignee
        return causedBy === selectedDeveloper
      }
      return issue.assignee === selectedDeveloper
    }
  }) || []
  
  // Separate bugs from all issues for EE Quality calculations
  const bugs = relevantIssues.filter(isBugIssue)
  
  // Get bug attribution statistics for monitoring custom field usage
  const bugAttributionStats = getBugAttributionStats(bugs)
  const bugAttributionDetails = getBugAttributionDetails(bugs)

  const debugData = {
    selectedDeveloper,
    bugAttributionMode,
    timestamp: new Date().toISOString(),
    dataSource: {
      developerData: developerData || null,
      filteredData: {
        filteredIssues: relevantIssues,
        totalFilteredIssues: filteredData?.filteredIssues?.length || 0
      },
      metrics: metrics || null
    },
    processedData: {
      relevantIssues,
      issueCount: relevantIssues.length,
      bugCount: bugs.length,
      totalStoryPoints: relevantIssues.reduce((sum, issue) => sum + (issue.storyPoints || 0), 0),
      totalTimeSpent: relevantIssues.reduce((sum, issue) => sum + (issue.timeSpentHours || 0), 0),
      bugs: bugs.map(bug => ({
        key: bug.key,
        issueType: bug.issueType,
        storyPoints: bug.storyPoints,
        timeSpentHours: bug.timeSpentHours,
        status: bug.status
      }))
    },
    eeMetricsPreview: {
      effortEfficiency: relevantIssues.length > 0 ? 
        ((relevantIssues.reduce((sum, issue) => sum + (issue.storyPoints || 0), 0) / 
          Math.max(relevantIssues.reduce((sum, issue) => sum + (issue.timeSpentHours || 0), 0), 0.1)) * 100) : 0,
      qualityEfficiencyApprox: bugs.length > 0 && relevantIssues.length > 0 ? 
        Math.max(0, 100 - ((bugs.length / relevantIssues.length) * 100)) : 100,
      bugDensity: relevantIssues.length > 0 ? (bugs.length / relevantIssues.length) * 100 : 0
    },
    bugDebugging: {
      bugsWithCreatedDate: bugs.filter(bug => bug.created || bug.fields?.created).map(bug => ({
        key: bug.key,
        issueType: bug.issueType,
        created: bug.created || bug.fields?.created,
        assignee: bug.assignee
      })),
      bugsWithoutCreatedDate: bugs.filter(bug => !(bug.created || bug.fields?.created)).map(bug => ({
        key: bug.key,
        issueType: bug.issueType,
        assignee: bug.assignee,
        availableFields: Object.keys(bug)
      })),
      totalBugsInData: bugs.length,
      totalIssuesInData: relevantIssues.length,
      sampleIssueFields: relevantIssues.length > 0 ? Object.keys(relevantIssues[0]) : []
    },
    bugAttribution: {
      stats: bugAttributionStats,
      details: bugAttributionDetails,
      customFieldsUsed: {
        'customfield_10636': bugs.filter(bug => bug.fields?.customfield_10636).length,
        'customfield_10002': bugs.filter(bug => bug.fields?.customfield_10002).length,
        'assigneeOnly': bugs.filter(bug => 
          !bug.fields?.customfield_10636 && 
          !bug.fields?.customfield_10002
        ).length
      }
    }
  }

  const handleCopyToClipboard = () => {
    const jsonString = JSON.stringify(debugData, null, 2)
    navigator.clipboard.writeText(jsonString).then(() => {
      console.log('Debug data copied to clipboard')
    }).catch(err => {
      console.error('Failed to copy to clipboard:', err)
    })
  }

  return (
    <Card sx={{ mt: 2, border: '2px dashed #ff9800' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DebugIcon color="warning" />
            <Typography variant="h6" sx={{ color: '#ff9800' }}>
              Debug: Effort Effectiveness Data
            </Typography>
            <Chip 
              label={`${debugData.processedData.issueCount} issues`} 
              size="small" 
              color="warning" 
              variant="outlined" 
            />
            <Chip 
              label={`${debugData.processedData.bugCount} bugs`} 
              size="small" 
              color="error" 
              variant="outlined"
              sx={{ ml: 1 }}
            />
            <Chip 
              label={`EE: ${Math.round(debugData.eeMetricsPreview.effortEfficiency)}%`} 
              size="small" 
              color="success" 
              variant="outlined"
              sx={{ ml: 1 }}
            />
            <Chip 
              label={`Custom Fields: ${Math.round(bugAttributionStats.customFieldUsageRate)}%`} 
              size="small" 
              color="info" 
              variant="outlined"
              sx={{ ml: 1 }}
            />
            <Chip 
              label={`Mode: ${bugAttributionMode === 'assignee' ? 'Assignee' : 'Bug Caused By'}`} 
              size="small" 
              color={bugAttributionMode === 'assignee' ? 'warning' : 'success'} 
              variant="filled"
              sx={{ ml: 1 }}
            />
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              startIcon={<CopyIcon />}
              onClick={handleCopyToClipboard}
              size="small"
              variant="outlined"
            >
              Copy JSON
            </Button>
            <Button
              endIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              onClick={() => setExpanded(!expanded)}
              size="small"
              variant="contained"
              color="warning"
            >
              {expanded ? 'Hide' : 'Show'} Raw Data
            </Button>
          </Box>
        </Box>

        <Collapse in={expanded}>
          <Paper 
            sx={{ 
              p: 2, 
              bgcolor: '#f5f5f5', 
              maxHeight: '500px', 
              overflow: 'auto',
              fontFamily: 'monospace'
            }}
          >
            <pre style={{ margin: 0, fontSize: '12px', whiteSpace: 'pre-wrap' }}>
              {JSON.stringify(debugData, null, 2)}
            </pre>
          </Paper>
        </Collapse>

        {!expanded && (
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            Click "Show Raw Data" to see the complete JSON structure used by the Effort Effectiveness chart.
            Data includes filtered issues, EE metrics, EE Quality calculations, bug attribution via custom fields, and detailed analysis for developer: <strong>{selectedDeveloper}</strong>
            <br />
            <strong>Current Attribution Mode:</strong> {bugAttributionMode === 'assignee' ? 'By Assignee (Legacy)' : 'By Bug Caused By (Enhanced)'} - affects bug counting and quality metrics.
          </Typography>
        )}
      </CardContent>
    </Card>
  )
}

DebugDataViewer.propTypes = {
  developerData: PropTypes.object,
  selectedDeveloper: PropTypes.string,
  filteredData: PropTypes.object,
  metrics: PropTypes.object
}

export default DebugDataViewer