import React, { useState, useMemo, useCallback } from 'react'
import PropTypes from 'prop-types'
import { 
  Box, 
  Typography, 
  Paper, 
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  useTheme,
  Chip
} from '@mui/material'
import TimelinessCharts from './TimelinessCharts'
import ScopeCreepCharts from './ScopeCreepCharts'
import SprintMetricsDetailsPopup from './SprintMetricsDetailsPopup'
import { sprintMetricsService } from '../../services/sprintMetricsService'

const SprintMetricsCharts = React.memo(({ 
  data, 
  isLoading = false,
  error = null,
  title = 'Sprint Metrics Dashboard',
  defaultSelectedProject = null, // Will be set to first project
  showProjectFilter = true,
  chartHeight = 300,
  ...props 
}) => {
  const theme = useTheme()
  
  // Get available projects first to determine default
  const availableProjects = useMemo(() => {
    if (!data || data.length === 0) return []
    
    const projectMap = new Map()
    
    data.forEach(issue => {
      const projectKey = issue.fields?.project?.key
      const projectName = issue.fields?.project?.name
      
      if (projectKey && !projectMap.has(projectKey)) {
        projectMap.set(projectKey, {
          key: projectKey,
          name: projectName || projectKey,
          issueCount: 0
        })
      }
      
      if (projectKey) {
        const project = projectMap.get(projectKey)
        project.issueCount += 1
      }
    })
    
    return Array.from(projectMap.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [data])

  // Set default to first project or fallback
  const initialProject = useMemo(() => {
    if (defaultSelectedProject) return defaultSelectedProject
    if (availableProjects.length > 0) return availableProjects[0].key
    return 'all'
  }, [defaultSelectedProject, availableProjects])

  const [selectedProject, setSelectedProject] = useState(initialProject)
  const [detailsModal, setDetailsModal] = useState({
    open: false,
    type: null,
    projectKey: null,
    data: []
  })

  // Update selected project when available projects change
  React.useEffect(() => {
    if (availableProjects.length > 0 && selectedProject === 'all') {
      setSelectedProject(availableProjects[0].key)
    }
  }, [availableProjects, selectedProject])

  // Process sprint metrics data using the correct service
  const sprintMetricsData = useMemo(() => {
    if (!data || data.length === 0) return null
    
    // Get all available projects
    const projectMap = new Map()
    data.forEach(issue => {
      const projectKey = issue.fields?.project?.key
      const projectName = issue.fields?.project?.name
      if (projectKey && !projectMap.has(projectKey)) {
        projectMap.set(projectKey, projectName || projectKey)
      }
    })
    
    const allProjects = Array.from(projectMap.keys())
    const selectedProjects = selectedProject === 'all' ? allProjects : [selectedProject]
    
    // Process with correct sprint metrics logic
    return sprintMetricsService.getAllSprintMetricsData(data, selectedProjects)
  }, [data, selectedProject])

  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return []
    
    if (selectedProject === 'all') return data
    
    return data.filter(issue => {
      const projectKey = issue.fields?.project?.key
      return projectKey === selectedProject
    })
  }, [data, selectedProject])

  const handleProjectChange = useCallback((event) => {
    setSelectedProject(event.target.value)
  }, [])

  const handleViewDetails = useCallback((type, projectKey = null) => {
    // For sprint metrics, we should show all issues that have sprint data
    // The details service will filter and analyze them appropriately
    const targetProject = projectKey || selectedProject
    
    const modalData = targetProject === 'all' 
      ? data // Show all data for 'all' projects
      : data.filter(issue => {
          const issueProject = issue.fields?.project?.key
          return issueProject === targetProject
        })

    console.log('Opening details modal:', {
      type,
      projectKey: targetProject,
      totalIssues: modalData.length,
      sampleIssue: modalData[0]
    })

    setDetailsModal({
      open: true,
      type,
      projectKey: targetProject,
      data: modalData
    })
  }, [data, selectedProject])

  const handleCloseDetails = useCallback(() => {
    setDetailsModal({
      open: false,
      type: null,
      projectKey: null,
      data: []
    })
  }, [])

  const selectedProjectInfo = useMemo(() => {
    if (selectedProject === 'all') {
      return {
        key: 'all',
        name: 'All Projects',
        issueCount: filteredData.length
      }
    }
    
    return availableProjects.find(p => p.key === selectedProject) || {
      key: selectedProject,
      name: selectedProject,
      issueCount: filteredData.length
    }
  }, [selectedProject, availableProjects, filteredData])

  if (isLoading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: 200,
          p: 4
        }}
        {...props}
      >
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }} {...props}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error.message || 'Failed to load sprint metrics data'}
        </Alert>
      </Box>
    )
  }

  if (!data || data.length === 0) {
    return (
      <Box sx={{ p: 2 }} {...props}>
        <Typography variant="h5" gutterBottom>
          {title}
        </Typography>
        <Alert severity="info">
          No sprint data available for analysis
        </Alert>
      </Box>
    )
  }

  if (!sprintMetricsData || sprintMetricsData.summary.totalSprints === 0) {
    return (
      <Box sx={{ p: 2 }} {...props}>
        <Typography variant="h5" gutterBottom>
          {title}
        </Typography>
        <Alert severity="warning">
          No issues with sprint data found. Make sure issues have been assigned to sprints in JIRA.
        </Alert>
      </Box>
    )
  }

  return (
    <Box sx={{ width: '100%' }} {...props}>
      <Typography 
        variant="h5" 
        gutterBottom 
        sx={{ 
          mb: 3,
          [theme.breakpoints.down('sm')]: {
            fontSize: '1.25rem'
          }
        }}
      >
        {title}
      </Typography>

      {/* Project Filter */}
      {showProjectFilter && availableProjects.length > 1 && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Project Filter</InputLabel>
                <Select
                  value={selectedProject}
                  onChange={handleProjectChange}
                  label="Project Filter"
                >
                  <MenuItem value="all">All Projects</MenuItem>
                  {availableProjects.map(project => (
                    <MenuItem key={project.key} value={project.key}>
                      {project.name} ({project.issueCount} issues)
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={8}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 2,
                flexWrap: 'wrap'
              }}>
                <Typography variant="body2" color="text.secondary">
                  Selected: {selectedProjectInfo.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Issues: {selectedProjectInfo.issueCount}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Sprint Metrics Info */}
      <Paper sx={{ p: 2, mb: 3, backgroundColor: theme.palette.info.light, color: theme.palette.info.contrastText }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6}>
            <Typography variant="body2">
              <strong>Sprint Analysis:</strong> {sprintMetricsData.summary.totalSprints} sprints analyzed
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip 
                label={`Timeliness: ${sprintMetricsData.summary.avgTimeliness.toFixed(1)}%`}
                size="small" 
                color="primary"
              />
              <Chip 
                label={`Scope Stability: ${sprintMetricsData.summary.avgScopeStability.toFixed(1)}%`}
                size="small" 
                color="secondary"
              />
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Sprint Metrics Charts */}
      <Grid container spacing={3}>
        {/* Timeliness Charts */}
        <Grid item xs={12} lg={6}>
          <TimelinessCharts
            sprintTimelinessData={sprintMetricsData.sprintTimelinessData}
            projectTimelinessData={sprintMetricsData.projectTimelinessData}
            projectKey={selectedProject}
            height={chartHeight}
            onViewDetails={(type) => handleViewDetails('late_issues', selectedProject)}
          />
        </Grid>

        {/* Scope Creep Charts */}
        <Grid item xs={12} lg={6}>
          <ScopeCreepCharts
            sprintScopeCreepData={sprintMetricsData.sprintScopeCreepData}
            projectScopeCreepData={sprintMetricsData.projectScopeCreepData}
            projectKey={selectedProject}
            height={chartHeight}
            onViewDetails={(type) => handleViewDetails('scope_creep', selectedProject)}
          />
        </Grid>
      </Grid>



      {/* Details Modal */}
      <SprintMetricsDetailsPopup
        open={detailsModal.open}
        onClose={handleCloseDetails}
        type={detailsModal.type}
        data={detailsModal.data}
        projectKey={detailsModal.projectKey}
        projectName={selectedProjectInfo.name}
      />
    </Box>
  )
})

SprintMetricsCharts.propTypes = {
  data: PropTypes.arrayOf(PropTypes.shape({
    key: PropTypes.string,
    fields: PropTypes.object,
    displayFields: PropTypes.object
  })),
  isLoading: PropTypes.bool,
  error: PropTypes.shape({
    message: PropTypes.string
  }),
  title: PropTypes.string,
  defaultSelectedProject: PropTypes.string,
  showProjectFilter: PropTypes.bool,
  chartHeight: PropTypes.number
}

SprintMetricsCharts.displayName = 'SprintMetricsCharts'

export default SprintMetricsCharts