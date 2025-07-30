/**
 * Raw JSON Viewer - Simple JSON display component
 * Uses Filter.projects from Zustand state automatically
 */

import React, { useMemo } from 'react'
import { Box, Typography, Paper, Button } from '@mui/material'
import { ContentCopy } from '@mui/icons-material'
import { useBugAnalysis } from '../../hooks/useBugAnalysis'
import { useDeveloperQualityFilters } from '../../hooks/useDeveloperQualityFilters'
import { convertProjectNamesToKeys } from '../../utils/projectMapping'

const RawJsonViewer = () => {
  const { filters } = useDeveloperQualityFilters()
  
  // Convert project names to keys for API calls
  const projectKeys = useMemo(() => {
    return convertProjectNamesToKeys(filters.projects)
  }, [filters.projects])
  
  const { bugAnalysis, isLoading, error } = useBugAnalysis(
    projectKeys, 
    filters.timeframe
  )
  
  // Use filtered data based on current Filter.projects state
  const displayData = useMemo(() => {
    if (!bugAnalysis) return null
    
    // If no projects are selected in filters, show all
    if (!filters.projects || filters.projects.length === 0) {
      return bugAnalysis
    }
    
    // Filter by selected project keys (converted from names)
    return Object.fromEntries(
      Object.entries(bugAnalysis).filter(([projectKey]) => 
        projectKeys.includes(projectKey)
      )
    )
  }, [bugAnalysis, projectKeys])
  
  if (isLoading) {
    return (
      <Box p={2}>
        <Typography variant="body2" color="textSecondary">
          Loading bug analysis data...
        </Typography>
      </Box>
    )
  }
  
  if (error) {
    return (
      <Box p={2}>
        <Typography variant="body2" color="error">
          Error loading data: {error}
        </Typography>
      </Box>
    )
  }
  
  if (!displayData) {
    return (
      <Box p={2}>
        <Typography variant="body2" color="textSecondary">
          No bug analysis data available. Process JIRA data to generate bug analysis.
        </Typography>
      </Box>
    )
  }
  
  const handleCopy = () => {
    const jsonString = JSON.stringify(displayData, null, 2)
    navigator.clipboard.writeText(jsonString)
  }
  
  const selectedProjects = filters.projects || []
  const projectsText = selectedProjects.length === 0 ? 'All Projects' : 
                      selectedProjects.length === 1 ? `${selectedProjects[0]} (${projectKeys[0]})` :
                      `${selectedProjects.length} Projects`
  
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Raw Bug Analysis JSON
      </Typography>
      
      {/* Info and Controls */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="body2" color="textSecondary">
          Showing: {projectsText} • Timeframe: {filters.timeframe}
        </Typography>
        
        <Button
          variant="outlined"
          startIcon={<ContentCopy />}
          onClick={handleCopy}
          size="small"
        >
          Copy JSON
        </Button>
      </Box>
      
      {/* JSON Display */}
      <Paper 
        sx={{ 
          p: 2, 
          backgroundColor: '#f5f5f5',
          maxHeight: '400px',
          overflow: 'auto',
          border: '1px solid #ddd'
        }}
      >
        <Typography 
          component="pre" 
          sx={{ 
            fontFamily: 'monospace',
            fontSize: '0.75rem',
            lineHeight: 1.4,
            margin: 0,
            whiteSpace: 'pre-wrap'
          }}
        >
          {JSON.stringify(displayData, null, 2)}
        </Typography>
      </Paper>
    </Box>
  )
}

export default RawJsonViewer