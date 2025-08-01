/**
 * Debug Data Viewer Component
 * Shows raw JSON data used by Effort Effectiveness Chart for debugging
 */

import React, { useState } from 'react'
import PropTypes from 'prop-types'
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
  const [expanded, setExpanded] = useState(false)

  // Collect all the data that's passed to the chart
  const debugData = {
    selectedDeveloper,
    timestamp: new Date().toISOString(),
    dataSource: {
      developerData: developerData || null,
      filteredData: {
        filteredIssues: filteredData?.filteredIssues?.filter(issue => issue.assignee === selectedDeveloper) || [],
        totalFilteredIssues: filteredData?.filteredIssues?.length || 0
      },
      metrics: metrics || null
    },
    processedData: {
      relevantIssues: filteredData?.filteredIssues?.filter(issue => issue.assignee === selectedDeveloper) || [],
      issueCount: filteredData?.filteredIssues?.filter(issue => issue.assignee === selectedDeveloper)?.length || 0
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
            Data includes filtered issues, metrics, and processed calculations for developer: <strong>{selectedDeveloper}</strong>
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